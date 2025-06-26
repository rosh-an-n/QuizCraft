import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import {
  Button,
  Typography,
  Container,
  Paper,
  Box,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
  Alert,
  Grid,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from "@mui/material";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { collection, query, where, getDocs, orderBy, doc, deleteDoc } from "firebase/firestore";

const Dashboard = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copySuccess, setCopySuccess] = useState("");
  const [viewQuiz, setViewQuiz] = useState(null);
  const [deleteQuizId, setDeleteQuizId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const handleCreateQuiz = () => {
    navigate("/create");
  };

  const fetchQuizzes = async () => {
    setLoading(true);
    setError("");
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const q = query(
        collection(db, "quizzes"),
        where("creatorId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const quizList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setQuizzes(quizList);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
    // eslint-disable-next-line
  }, []);

  const handleCopyLink = (quizId) => {
    const url = `${window.location.origin}/quiz/${quizId}`;
    navigator.clipboard.writeText(url);
    setCopySuccess(quizId);
    setTimeout(() => setCopySuccess(""), 1500);
  };

  const handleView = (quiz) => {
    setViewQuiz(quiz);
  };

  const handleEdit = (quiz) => {
    navigate(`/edit/${quiz.id}`);
  };

  const handleDelete = async () => {
    if (!deleteQuizId) return;
    setDeleteLoading(true);
    try {
      await deleteDoc(doc(db, "quizzes", deleteQuizId));
      setDeleteQuizId(null);
      fetchQuizzes();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" bgcolor="#f0f4fa">
      <Container maxWidth="sm">
        <Paper elevation={8} sx={{ p: { xs: 3, sm: 6 }, borderRadius: 4, bgcolor: 'white', position: 'relative' }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleLogout}
            sx={{ position: 'absolute', top: 24, right: 24 }}
          >
            Logout
          </Button>
          <Typography variant="h3" fontWeight={800} color="primary" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Your Quizzes
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleCreateQuiz}
            sx={{ mb: 4, mt: 2 }}
            fullWidth
          >
            + Create Quiz
          </Button>
          {loading && <Box display="flex" justifyContent="center" my={2}><CircularProgress /></Box>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2}>
            {quizzes.map((quiz) => (
              <Grid item xs={12} key={quiz.id}>
                <Card elevation={3} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={700}>{quiz.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{quiz.description}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Quiz ID: {quiz.id}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Tooltip title="Copy shareable link">
                      <IconButton onClick={() => handleCopyLink(quiz.id)} color={copySuccess === quiz.id ? "success" : "primary"}>
                        <ContentCopyIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View Quiz">
                      <IconButton onClick={() => handleView(quiz)} color="primary">
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Quiz">
                      <IconButton onClick={() => handleEdit(quiz)} color="info">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Quiz">
                      <IconButton onClick={() => setDeleteQuizId(quiz.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {window.location.origin}/quiz/{quiz.id}
                    </Typography>
                    {copySuccess === quiz.id && (
                      <Typography variant="body2" color="success.main" sx={{ ml: 2 }}>
                        Copied!
                      </Typography>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
          {(!loading && quizzes.length === 0) && (
            <Typography variant="body1" color="text.secondary" align="center" sx={{ mt: 4 }}>
              You haven't created any quizzes yet.
            </Typography>
          )}
        </Paper>
        {/* View Quiz Modal */}
        <Dialog open={!!viewQuiz} onClose={() => setViewQuiz(null)} maxWidth="sm" fullWidth>
          <DialogTitle>Quiz Details</DialogTitle>
          <DialogContent dividers>
            {viewQuiz && (
              <Box>
                <Typography variant="h6" fontWeight={700}>{viewQuiz.title}</Typography>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>{viewQuiz.description}</Typography>
                <Divider sx={{ my: 2 }} />
                {viewQuiz.questions && viewQuiz.questions.map((q, idx) => (
                  <Box key={idx} mb={2}>
                    <Typography fontWeight={600}>Q{idx + 1}: {q.text}</Typography>
                    <ul>
                      {q.options.map((opt, oIdx) => (
                        <li key={oIdx} style={{ color: opt.isCorrect ? 'green' : undefined }}>
                          {opt.text} {opt.isCorrect ? '(Correct)' : ''}
                        </li>
                      ))}
                    </ul>
                    {viewQuiz.timerType === "perQuestion" && (
                      <Typography variant="caption">Timer: {q.timer} seconds</Typography>
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewQuiz(null)}>Close</Button>
          </DialogActions>
        </Dialog>
        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteQuizId} onClose={() => setDeleteQuizId(null)}>
          <DialogTitle>Delete Quiz?</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to delete this quiz? This action cannot be undone.</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteQuizId(null)} disabled={deleteLoading}>Cancel</Button>
            <Button onClick={handleDelete} color="error" disabled={deleteLoading}>
              {deleteLoading ? <CircularProgress size={20} /> : "Delete"}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default Dashboard; 