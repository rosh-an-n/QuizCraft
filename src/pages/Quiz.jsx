import React, { useEffect, useState, useRef, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc, addDoc, collection, serverTimestamp, updateDoc, setDoc } from "firebase/firestore";
import {
  Container,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from "@mui/material";
import SnackbarContext from "../SnackbarContext";
import QuizIcon from '@mui/icons-material/Quiz';

const Quiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState([]); // [{selected: [optionIndexes]}]
  const [timer, setTimer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef = useRef();
  const [submitted, setSubmitted] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const showSnackbar = useContext(SnackbarContext);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(null);
  const [timedOutQuestions, setTimedOutQuestions] = useState([]); // array of bools

  // Check authentication first
  useEffect(() => {
    if (!auth.currentUser) {
      setAuthDialogOpen(true);
      return;
    }
    
    const fetchQuiz = async () => {
      setLoading(true);
      setError("");
      try {
        const docRef = doc(db, "quizzes", quizId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setQuiz(data);
          // Set timer
          if (data.timerType === "perQuiz") {
            setTimer(data.timer);
            setTimeLeft(data.timer);
          } else if (data.timerType === "perQuestion") {
            setTimer(data.timer);
            setQuestionTimeLeft(
              data.questions && data.questions[0]?.timer
                ? Number(data.questions[0].timer)
                : Number(data.timer)
            );
            setTimedOutQuestions(Array((data.questions || []).length).fill(false));
          }
          // Initialize answers as array of objects
          setAnswers(
            (data.questions || []).map(() => ({ selected: [] }))
          );
        } else {
          setError("Quiz not found.");
        }
      } catch (err) {
        setError("Failed to fetch quiz: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
    // eslint-disable-next-line
  }, [quizId]);

  // Timer logic
  useEffect(() => {
    if (!quiz || submitted) return;
    if (quiz.timerType === "perQuiz" && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    }
    if (quiz.timerType === "perQuiz" && timeLeft === 0) {
      handleSubmit();
    }
    // --- Per-question timer logic ---
    if (quiz.timerType === "perQuestion" && questionTimeLeft > 0) {
      timerRef.current = setTimeout(() => setQuestionTimeLeft(questionTimeLeft - 1), 1000);
    }
    if (quiz.timerType === "perQuestion" && questionTimeLeft === 0) {
      // Mark this question as timed out
      setTimedOutQuestions(prev => {
        const updated = [...prev];
        updated[currentQuestion] = true;
        return updated;
      });
      // If last question, submit
      if (currentQuestion === quiz.questions.length - 1) {
        setTimeout(() => handleSubmit(), 500); // slight delay for UX
      } else {
        // Move to next question after a short delay
        setTimeout(() => {
          setCurrentQuestion(q => q + 1);
          setQuestionTimeLeft(
            quiz.questions[currentQuestion + 1]?.timer
              ? Number(quiz.questions[currentQuestion + 1].timer)
              : Number(quiz.timer)
          );
        }, 500);
      }
    }
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line
  }, [quiz, timeLeft, submitted, questionTimeLeft, currentQuestion]);

  // Handle answer selection
  const handleSelect = (qIdx, oIdx, checked) => {
    // Prevent selection if timed out in perQuestion mode
    if (quiz.timerType === "perQuestion" && timedOutQuestions[qIdx]) return;
    setAnswers(prev => {
      const updated = [...prev];
      if (quiz.questions[qIdx].allowMultiple) {
        // Multiple correct
        if (checked) {
          updated[qIdx] = { selected: [...(updated[qIdx]?.selected || []), oIdx] };
        } else {
          updated[qIdx] = { selected: (updated[qIdx]?.selected || []).filter(i => i !== oIdx) };
        }
      } else {
        updated[qIdx] = { selected: [oIdx] };
      }
      return updated;
    });
  };

  // Submit quiz and save result
  const handleSubmit = async () => {
    setSubmitted(true);
    setSubmitLoading(true);
    setSubmitError("");
    
    // Calculate score
    let score = 0;
    quiz.questions.forEach((q, qIdx) => {
      const correctIndexes = q.options.map((opt, i) => opt.isCorrect ? i : null).filter(i => i !== null);
      const selected = answers[qIdx]?.selected || [];
      if (
        correctIndexes.length === selected.length &&
        correctIndexes.every(idx => selected.includes(idx))
      ) {
        score += 1;
      }
    });

    // Get user profile
    const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
    const userData = userDoc.data();
    
    // Save result to Firestore
    try {
      const docRef = await addDoc(collection(db, "results"), {
        quizId,
        userId: auth.currentUser.uid,
        userName: userData?.displayName || "Unknown User",
        userEmail: auth.currentUser.email,
        score,
        total: quiz.questions.length,
        answers,
        submittedAt: serverTimestamp()
      });

      // Update user stats
      await setDoc(doc(db, "users", auth.currentUser.uid), {
        quizzesTaken: (userData?.quizzesTaken || 0) + 1,
        totalScore: (userData?.totalScore || 0) + score
      }, { merge: true });

      showSnackbar("Quiz submitted successfully!", "success");
      navigate(`/result/${quizId}`, {
        state: {
          score,
          total: quiz.questions.length,
          answers,
          quiz,
          userName: userData?.displayName || "Unknown User",
          resultId: docRef.id
        }
      });
    } catch (err) {
      setSubmitError("Failed to save result: " + err.message);
      showSnackbar("Failed to save result: " + err.message, "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle authentication dialog
  const handleAuthDialogClose = () => {
    setAuthDialogOpen(false);
    navigate("/login");
  };

  if (loading) {
    return (
      <Box
        minHeight="100vh"
        sx={{
          bgcolor: 'background.default',
          background: 'linear-gradient(135deg, #e3f0ff 0%, #f5f5f5 100%)',
          py: { xs: 2, sm: 4 },
        }}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Container maxWidth="md" sx={{ px: { xs: 0.5, sm: 2 } }}>
          <Box minHeight="60vh" display="flex" alignItems="center" justifyContent="center">
            <CircularProgress />
          </Box>
        </Container>
      </Box>
    );
  }
  if (error) {
    return (
      <Box
        minHeight="100vh"
        sx={{
          bgcolor: 'background.default',
          background: 'linear-gradient(135deg, #e3f0ff 0%, #f5f5f5 100%)',
          py: { xs: 2, sm: 4 },
        }}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Container maxWidth="md" sx={{ px: { xs: 0.5, sm: 2 } }}>
          <Box minHeight="60vh" display="flex" alignItems="center" justifyContent="center">
            <Alert severity="error">{error}</Alert>
          </Box>
        </Container>
      </Box>
    );
  }
  if (!quiz) return null;

  return (
    <Box
      minHeight="100vh"
      sx={{
        bgcolor: 'background.default',
        background: 'linear-gradient(135deg, #e3f0ff 0%, #f5f5f5 100%)',
        py: { xs: 2, sm: 4 },
      }}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Container maxWidth="md" sx={{ px: { xs: 0.5, sm: 2 } }}>
        <Paper elevation={8} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 4, bgcolor: 'white', boxShadow: '0 4px 24px rgba(60,60,60,0.08)' }}>
          <Dialog open={authDialogOpen} disableEscapeKeyDown disableBackdropClick>
            <DialogTitle>Authentication Required</DialogTitle>
            <DialogContent>
              <Typography>
                You need to be logged in to take this quiz. Please create an account or login to continue.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleAuthDialogClose} variant="contained">
                Go to Login
              </Button>
            </DialogActions>
          </Dialog>
          
          {/* Hero Section */}
          <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
            <QuizIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" fontWeight={900} color="primary" gutterBottom sx={{ letterSpacing: 1, fontSize: { xs: 22, sm: 32 } }}>
              {quiz.title}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" align="center" sx={{ mb: 2, fontWeight: 400 }}>
              {quiz.description}
            </Typography>
          </Box>
          {/* Timer */}
          {quiz.timerType === "perQuiz" && (
            <Box mb={3}>
              <LinearProgress variant="determinate" value={100 * (timeLeft / timer)} sx={{ height: 10, borderRadius: 5 }} />
              <Typography align="center" mt={1} fontWeight={500} color="primary">
                Time Left: {timeLeft}s
              </Typography>
            </Box>
          )}
          {quiz.timerType === "perQuestion" && (
            <Box mb={3}>
              <LinearProgress variant="determinate" value={100 * (questionTimeLeft / (quiz.questions[currentQuestion]?.timer || quiz.timer))} sx={{ height: 10, borderRadius: 5 }} />
              <Typography align="center" mt={1} fontWeight={500} color="primary">
                Time Left: {questionTimeLeft}s
              </Typography>
            </Box>
          )}
          {/* Question Card */}
          <Box mb={3}>
            <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: '#f8fafc', boxShadow: '0 2px 8px rgba(60,60,60,0.06)' }}>
              <Typography variant="h6" fontWeight={700} gutterBottom sx={{ fontSize: { xs: 18, sm: 22 } }}>
                Q{quiz.timerType === "perQuestion" ? currentQuestion + 1 : ''}{quiz.timerType === "perQuiz" ? quiz.questions.length > 1 ? `${currentQuestion + 1}/${quiz.questions.length}` : '' : ''}: {quiz.questions[currentQuestion]?.text}
              </Typography>
              <Box mt={2}>
                {quiz.questions[currentQuestion]?.options.map((opt, oIdx) => (
                  <Box key={oIdx} mb={1}>
                    {quiz.questions[currentQuestion].allowMultiple ? (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={answers[currentQuestion]?.selected?.includes(oIdx) || false}
                            onChange={e => handleSelect(currentQuestion, oIdx, e.target.checked)}
                            disabled={quiz.timerType === "perQuestion" && timedOutQuestions[currentQuestion]}
                          />
                        }
                        label={<Typography sx={{ fontSize: 16 }}>{opt.text}</Typography>}
                      />
                    ) : (
                      <FormControlLabel
                        control={
                          <Radio
                            checked={answers[currentQuestion]?.selected?.includes(oIdx) || false}
                            onChange={e => handleSelect(currentQuestion, oIdx, e.target.checked)}
                            disabled={quiz.timerType === "perQuestion" && timedOutQuestions[currentQuestion]}
                          />
                        }
                        label={<Typography sx={{ fontSize: 16 }}>{opt.text}</Typography>}
                      />
                    )}
                  </Box>
                ))}
              </Box>
            </Paper>
          </Box>
          {/* Navigation & Submit */}
          <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2} justifyContent="center" alignItems="center">
            {quiz.timerType === "perQuiz" && quiz.questions.length > 1 && (
              <Button
                variant="outlined"
                color="primary"
                disabled={currentQuestion === 0}
                onClick={() => setCurrentQuestion(q => q - 1)}
                sx={{ minWidth: 120, fontWeight: 500 }}
              >
                Previous
              </Button>
            )}
            {quiz.timerType === "perQuiz" && quiz.questions.length > 1 && (
              <Button
                variant="outlined"
                color="primary"
                disabled={currentQuestion === quiz.questions.length - 1}
                onClick={() => setCurrentQuestion(q => q + 1)}
                sx={{ minWidth: 120, fontWeight: 500 }}
              >
                Next
              </Button>
            )}
            <Button
              variant="contained"
              color="success"
              size="large"
              onClick={handleSubmit}
              disabled={submitLoading || submitted || (quiz.timerType === "perQuestion" && timedOutQuestions[currentQuestion])}
              sx={{ minWidth: 160, fontWeight: 700, py: 1.5, fontSize: 18, borderRadius: 2 }}
            >
              {submitLoading ? "Submitting..." : "Submit Quiz"}
            </Button>
          </Box>
          {submitError && <Alert severity="error" sx={{ mt: 2 }}>{submitError}</Alert>}
        </Paper>
      </Container>
    </Box>
  );
};

export default Quiz; 