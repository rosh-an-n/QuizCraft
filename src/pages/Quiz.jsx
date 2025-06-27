import React, { useEffect, useState, useRef, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
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
  const [nameDialogOpen, setNameDialogOpen] = useState(true);
  const [participantName, setParticipantName] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const showSnackbar = useContext(SnackbarContext);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(null);
  const [timedOutQuestions, setTimedOutQuestions] = useState([]); // array of bools

  // Fetch quiz data
  useEffect(() => {
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
    // Save result to Firestore
    try {
      const docRef = await addDoc(collection(db, "results"), {
        quizId,
        name: participantName || "Anonymous",
        score,
        total: quiz.questions.length,
        answers,
        submittedAt: serverTimestamp()
      });
      showSnackbar("Quiz submitted!", "success");
      navigate(`/result/${quizId}`, {
        state: {
          score,
          total: quiz.questions.length,
          answers,
          quiz,
          name: participantName || "Anonymous",
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

  // Handle name dialog
  const handleNameSubmit = () => {
    setNameDialogOpen(false);
  };

  if (loading) {
    return (
      <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return (
      <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center">
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }
  if (!quiz) return null;

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center">
      <Container maxWidth="md" sx={{ px: { xs: 0.5, sm: 2 } }}>
        <Paper elevation={8} sx={{ p: { xs: 1, sm: 3 }, borderRadius: 4 }}>
          <Dialog open={nameDialogOpen} disableEscapeKeyDown disableBackdropClick>
            <DialogTitle>Enter Your Name</DialogTitle>
            <DialogContent>
              <TextField
                label="Name (optional)"
                value={participantName}
                onChange={e => setParticipantName(e.target.value)}
                fullWidth
                autoFocus
                sx={{ mt: 1 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleNameSubmit} variant="contained">Start Quiz</Button>
            </DialogActions>
          </Dialog>
          <Typography variant="h4" fontWeight={700} color="primary" align="center" gutterBottom>
            {quiz.title}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" align="center" gutterBottom>
            {quiz.description}
          </Typography>
          {/* Per Quiz Timer UI */}
          {quiz.timerType === "perQuiz" && (
            <Box mb={2}>
              <LinearProgress variant="determinate" value={100 * (timeLeft / timer)} sx={{ height: 10, borderRadius: 5 }} />
              <Typography align="center" mt={1}>
                Time Left: {timeLeft}s
              </Typography>
            </Box>
          )}
          {/* Per Question Timer UI */}
          {quiz.timerType === "perQuestion" && (
            <Box mb={2}>
              <LinearProgress variant="determinate" value={100 * (questionTimeLeft / (quiz.questions[currentQuestion]?.timer || timer))} sx={{ height: 10, borderRadius: 5, bgcolor: questionTimeLeft <= 10 ? 'error.light' : undefined }} />
              <Typography align="center" mt={1} color={questionTimeLeft <= 10 ? 'error' : undefined} fontWeight={questionTimeLeft <= 10 ? 700 : 400}>
                Time Left: {questionTimeLeft}s
                {questionTimeLeft <= 10 && questionTimeLeft > 0 && ' (Hurry up!)'}
              </Typography>
            </Box>
          )}
          {/* Questions UI */}
          {quiz.timerType === "perQuiz"
            ? quiz.questions.map((q, qIdx) => (
                <Box key={qIdx} mb={4}>
                  <Typography variant="h6" fontWeight={600}>
                    Q{qIdx + 1}: {q.text}
                  </Typography>
                  {q.allowMultiple ? (
                    <Box>
                      {q.options.map((opt, oIdx) => (
                        <FormControlLabel
                          key={oIdx}
                          control={
                            <Checkbox
                              checked={answers[qIdx]?.selected?.includes(oIdx) || false}
                              onChange={e => handleSelect(qIdx, oIdx, e.target.checked)}
                              disabled={submitted}
                            />
                          }
                          label={opt.text}
                        />
                      ))}
                    </Box>
                  ) : (
                    <RadioGroup
                      value={answers[qIdx]?.selected?.[0] ?? null}
                      onChange={e => handleSelect(qIdx, parseInt(e.target.value), true)}
                    >
                      {q.options.map((opt, oIdx) => (
                        <FormControlLabel
                          key={oIdx}
                          value={oIdx}
                          control={<Radio disabled={submitted} />}
                          label={opt.text}
                        />
                      ))}
                    </RadioGroup>
                  )}
                </Box>
              ))
            : (
              <Box mb={4}>
                <Typography variant="h6" fontWeight={600}>
                  Q{currentQuestion + 1}: {quiz.questions[currentQuestion].text}
                </Typography>
                {quiz.questions[currentQuestion].allowMultiple ? (
                  <Box>
                    {quiz.questions[currentQuestion].options.map((opt, oIdx) => (
                      <FormControlLabel
                        key={oIdx}
                        control={
                          <Checkbox
                            checked={answers[currentQuestion]?.selected?.includes(oIdx) || false}
                            onChange={e => handleSelect(currentQuestion, oIdx, e.target.checked)}
                            disabled={submitted || timedOutQuestions[currentQuestion]}
                          />
                        }
                        label={opt.text}
                      />
                    ))}
                  </Box>
                ) : (
                  <RadioGroup
                    value={answers[currentQuestion]?.selected?.[0] ?? null}
                    onChange={e => handleSelect(currentQuestion, parseInt(e.target.value), true)}
                  >
                    {quiz.questions[currentQuestion].options.map((opt, oIdx) => (
                      <FormControlLabel
                        key={oIdx}
                        value={oIdx}
                        control={<Radio disabled={submitted || timedOutQuestions[currentQuestion]} />}
                        label={opt.text}
                      />
                    ))}
                  </RadioGroup>
                )}
                {/* Navigation for per-question */}
                <Box display="flex" justifyContent="space-between" mt={2}>
                  <Button
                    variant="outlined"
                    onClick={() => setCurrentQuestion(q => Math.max(0, q - 1))}
                    disabled={currentQuestion === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setTimedOutQuestions(prev => {
                        const updated = [...prev];
                        updated[currentQuestion] = true;
                        return updated;
                      });
                      if (currentQuestion === quiz.questions.length - 1) {
                        handleSubmit();
                      } else {
                        setCurrentQuestion(q => q + 1);
                        setQuestionTimeLeft(
                          quiz.questions[currentQuestion + 1]?.timer
                            ? Number(quiz.questions[currentQuestion + 1].timer)
                            : Number(quiz.timer)
                        );
                      }
                    }}
                    disabled={timedOutQuestions[currentQuestion] || submitted}
                  >
                    {currentQuestion === quiz.questions.length - 1 ? 'Submit' : 'Next'}
                  </Button>
                </Box>
              </Box>
            )}
          {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}
          {quiz.timerType === "perQuiz" && (
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleSubmit}
              disabled={submitted || submitLoading}
              fullWidth
            >
              {submitLoading ? "Submitting..." : "Submit Quiz"}
            </Button>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default Quiz; 