import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
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
  LinearProgress
} from "@mui/material";

const Quiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState([]); // [{questionIndex, selected: [optionIndexes]}]
  const [timer, setTimer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef = useRef();
  const [submitted, setSubmitted] = useState(false);

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
            setTimeLeft(data.timer);
          }
          // Initialize answers
          setAnswers(
            (data.questions || []).map(() => [])
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
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line
  }, [quiz, timeLeft, submitted]);

  // Handle answer selection
  const handleSelect = (qIdx, oIdx, checked) => {
    setAnswers(prev => {
      const updated = [...prev];
      if (quiz.questions[qIdx].allowMultiple) {
        // Multiple correct
        if (checked) {
          updated[qIdx] = [...(updated[qIdx] || []), oIdx];
        } else {
          updated[qIdx] = (updated[qIdx] || []).filter(i => i !== oIdx);
        }
      } else {
        updated[qIdx] = [oIdx];
      }
      return updated;
    });
  };

  // Submit quiz
  const handleSubmit = () => {
    setSubmitted(true);
    // Calculate score
    let score = 0;
    quiz.questions.forEach((q, qIdx) => {
      const correctIndexes = q.options.map((opt, i) => opt.isCorrect ? i : null).filter(i => i !== null);
      const selected = answers[qIdx] || [];
      // Compare arrays (order doesn't matter)
      if (
        correctIndexes.length === selected.length &&
        correctIndexes.every(idx => selected.includes(idx))
      ) {
        score += 1;
      }
    });
    // Navigate to result page with score and answers
    navigate(`/result/${quizId}`, {
      state: {
        score,
        total: quiz.questions.length,
        answers,
        quiz
      }
    });
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
      <Container maxWidth="md">
        <Paper elevation={8} sx={{ p: { xs: 2, sm: 5 }, borderRadius: 4 }}>
          <Typography variant="h4" fontWeight={700} color="primary" align="center" gutterBottom>
            {quiz.title}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" align="center" gutterBottom>
            {quiz.description}
          </Typography>
          {quiz.timerType === "perQuiz" && (
            <Box mb={2}>
              <LinearProgress variant="determinate" value={100 * (timeLeft / timer)} sx={{ height: 10, borderRadius: 5 }} />
              <Typography align="center" mt={1}>
                Time Left: {timeLeft}s
              </Typography>
            </Box>
          )}
          {quiz.questions.map((q, qIdx) => (
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
                          checked={answers[qIdx]?.includes(oIdx) || false}
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
                  value={answers[qIdx]?.[0] ?? null}
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
          ))}
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleSubmit}
            disabled={submitted}
            fullWidth
          >
            Submit Quiz
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default Quiz; 