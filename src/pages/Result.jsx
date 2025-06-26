import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Divider,
  Chip
} from "@mui/material";

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { quizId } = useParams();
  const { score, total, answers, quiz } = location.state || {};

  if (!score && score !== 0) {
    return (
      <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center">
        <Paper elevation={8} sx={{ p: 4, borderRadius: 4 }}>
          <Typography variant="h5">No result data found.</Typography>
          <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate(`/quiz/${quizId}`)}>
            Take Quiz
          </Button>
        </Paper>
      </Box>
    );
  }

  const percentage = Math.round((score / total) * 100);

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center">
      <Container maxWidth="md">
        <Paper elevation={8} sx={{ p: { xs: 2, sm: 5 }, borderRadius: 4 }}>
          <Typography variant="h4" fontWeight={700} color="primary" align="center" gutterBottom>
            Quiz Results
          </Typography>
          <Typography variant="h5" align="center" gutterBottom>
            Score: {score} / {total}
          </Typography>
          <Typography variant="h6" align="center" color={percentage >= 60 ? 'success.main' : 'error.main'} gutterBottom>
            Percentage: {percentage}%
          </Typography>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Answer Review
          </Typography>
          {quiz.questions.map((q, qIdx) => {
            const correctIndexes = q.options.map((opt, i) => opt.isCorrect ? i : null).filter(i => i !== null);
            const selected = answers[qIdx] || [];
            const isCorrect =
              correctIndexes.length === selected.length &&
              correctIndexes.every(idx => selected.includes(idx));
            return (
              <Box key={qIdx} mb={3}>
                <Typography fontWeight={600}>
                  Q{qIdx + 1}: {q.text}
                  {isCorrect ? (
                    <Chip label="Correct" color="success" size="small" sx={{ ml: 2 }} />
                  ) : (
                    <Chip label="Wrong" color="error" size="small" sx={{ ml: 2 }} />
                  )}
                </Typography>
                <ul style={{ marginTop: 8 }}>
                  {q.options.map((opt, oIdx) => {
                    const isSelected = selected.includes(oIdx);
                    const isAnswer = opt.isCorrect;
                    return (
                      <li
                        key={oIdx}
                        style={{
                          color: isAnswer
                            ? "green"
                            : isSelected
                            ? "#d32f2f"
                            : undefined,
                          fontWeight: isAnswer || isSelected ? 600 : 400,
                          background: isAnswer
                            ? "#e8f5e9"
                            : isSelected
                            ? "#ffebee"
                            : undefined,
                          borderRadius: 4,
                          padding: "2px 8px",
                          display: "inline-block",
                          marginRight: 8
                        }}
                      >
                        {opt.text}
                        {isAnswer && " (Correct)"}
                        {isSelected && !isAnswer && " (Your Answer)"}
                      </li>
                    );
                  })}
                </ul>
              </Box>
            );
          })}
          <Divider sx={{ my: 3 }} />
          <Box display="flex" justifyContent="center" gap={2}>
            <Button variant="contained" color="primary" onClick={() => navigate(`/quiz/${quizId}`)}>
              Retake Quiz
            </Button>
            <Button variant="outlined" onClick={() => navigate(`/`)}>
              Go Home
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Result; 