import React, { useEffect, useState, useContext } from "react";
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
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tabs,
  Tab
} from "@mui/material";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BarChartIcon from '@mui/icons-material/BarChart';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StarIcon from '@mui/icons-material/Star';
import { collection, query, where, getDocs, orderBy, doc, deleteDoc } from "firebase/firestore";
import SnackbarContext from "../SnackbarContext";

const BADGES = [
  { key: 'creator', label: 'Quiz Creator', icon: <EmojiEventsIcon color="warning" />, desc: 'Created your first quiz!' },
  { key: 'master', label: 'Quiz Master', icon: <StarIcon color="primary" />, desc: 'Created 5+ quizzes!' }
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copySuccess, setCopySuccess] = useState("");
  const [viewQuiz, setViewQuiz] = useState(null);
  const [deleteQuizId, setDeleteQuizId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [resultsDialogQuiz, setResultsDialogQuiz] = useState(null);
  const [results, setResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState("");
  const [selectedResult, setSelectedResult] = useState(null);
  const [resultsTab, setResultsTab] = useState(0);
  const [badges, setBadges] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('badges') || '{}');
    } catch {
      return {};
    }
  });
  const showSnackbar = useContext(SnackbarContext);

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

  useEffect(() => {
    if (quizzes.length > 0 && !badges.creator) {
      const newBadges = { ...badges, creator: true };
      setBadges(newBadges);
      localStorage.setItem('badges', JSON.stringify(newBadges));
    }
    if (quizzes.length >= 5 && !badges.master) {
      const newBadges = { ...badges, master: true };
      setBadges(newBadges);
      localStorage.setItem('badges', JSON.stringify(newBadges));
    }
    // eslint-disable-next-line
  }, [quizzes]);

  const handleCopyLink = (quizId) => {
    const url = `${window.location.origin}/quiz/${quizId}`;
    navigator.clipboard.writeText(url);
    setCopySuccess(quizId);
    showSnackbar("Quiz link copied!", "success");
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
      showSnackbar("Quiz deleted successfully!", "success");
    } catch (err) {
      setError(err.message);
      showSnackbar(err.message, "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleViewResults = async (quiz) => {
    setResultsDialogQuiz(quiz);
    setResults([]);
    setResultsLoading(true);
    setResultsError("");
    setResultsTab(0);
    try {
      const q = query(
        collection(db, "results"),
        where("quizId", "==", quiz.id),
        orderBy("submittedAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      setResults(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      setResultsError(err.message);
    } finally {
      setResultsLoading(false);
    }
  };

  // Helper to export results as CSV
  const exportResultsCSV = () => {
    if (!results || results.length === 0) return;
    const headers = ["Name", "Score", "Total", "Date", "Answers"];
    const rows = results.map(r => [
      r.name,
      r.score,
      r.total,
      r.submittedAt?.toDate ? r.submittedAt.toDate().toLocaleString() : "-",
      (r.answers || []).map((a, i) => `Q${i + 1}: ${(a.selected || []).join("|")}`).join("; ")
    ]);
    const csvContent = [headers, ...rows].map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${resultsDialogQuiz?.title || 'quiz'}-results.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" bgcolor="#f0f4fa">
      <Container maxWidth="sm" sx={{ px: { xs: 0.5, sm: 2 } }}>
        <Paper elevation={8} sx={{ p: { xs: 1, sm: 3 }, borderRadius: 4, bgcolor: 'white', position: 'relative' }}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            {BADGES.filter(b => badges[b.key]).map(badge => (
              <Tooltip key={badge.key} title={badge.desc}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  {badge.icon}
                  <Typography variant="body2" fontWeight={600}>{badge.label}</Typography>
                </Box>
              </Tooltip>
            ))}
          </Box>
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
                    <Tooltip title="View Results">
                      <IconButton onClick={() => handleViewResults(quiz)} color="success">
                        <BarChartIcon />
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
        {/* Results Dialog */}
        <Dialog open={!!resultsDialogQuiz} onClose={() => setResultsDialogQuiz(null)} maxWidth="md" fullWidth>
          <DialogTitle>Quiz Results: {resultsDialogQuiz?.title}</DialogTitle>
          <DialogContent dividers sx={{ px: { xs: 1, sm: 3 } }}>
            <Box display="flex" justifyContent="flex-end" mb={1}>
              <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={exportResultsCSV} size="small">
                Export CSV
              </Button>
            </Box>
            <Tabs value={resultsTab} onChange={(_, v) => setResultsTab(v)} variant="fullWidth" sx={{ mb: 2 }}>
              <Tab label="Leaderboard" />
              <Tab label="Attempts" />
            </Tabs>
            {resultsTab === 0 && (
              <Box>
                {resultsLoading && <CircularProgress />}
                {resultsError && <Alert severity="error">{resultsError}</Alert>}
                {!resultsLoading && !resultsError && results.length === 0 && (
                  <Typography>No attempts yet.</Typography>
                )}
                {!resultsLoading && !resultsError && results.length > 0 && (
                  <TableContainer sx={{ maxWidth: '100vw', overflowX: 'auto' }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Rank</TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell>Score</TableCell>
                          <TableCell>Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {[...results]
                          .sort((a, b) => b.score - a.score || a.submittedAt?.seconds - b.submittedAt?.seconds)
                          .slice(0, 10)
                          .map((r, i) => (
                            <TableRow key={r.id}>
                              <TableCell>{i + 1}</TableCell>
                              <TableCell>{r.name}</TableCell>
                              <TableCell>{r.score} / {r.total}</TableCell>
                              <TableCell>{r.submittedAt?.toDate ? r.submittedAt.toDate().toLocaleString() : "-"}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}
            {resultsTab === 1 && (
              <Box>
                {resultsLoading && <CircularProgress />}
                {resultsError && <Alert severity="error">{resultsError}</Alert>}
                {!resultsLoading && !resultsError && results.length === 0 && (
                  <Typography>No attempts yet.</Typography>
                )}
                {!resultsLoading && !resultsError && results.length > 0 && (
                  <TableContainer sx={{ maxWidth: '100vw', overflowX: 'auto' }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Score</TableCell>
                          <TableCell>Date</TableCell>
                          <TableCell>Review</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {results.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell>{r.name}</TableCell>
                            <TableCell>{r.score} / {r.total}</TableCell>
                            <TableCell>{r.submittedAt?.toDate ? r.submittedAt.toDate().toLocaleString() : "-"}</TableCell>
                            <TableCell>
                              <Button size="small" onClick={() => setSelectedResult(r)}>View</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setResultsDialogQuiz(null)}>Close</Button>
          </DialogActions>
        </Dialog>
        {/* Review Result Dialog */}
        <Dialog open={!!selectedResult} onClose={() => setSelectedResult(null)} maxWidth="sm" fullWidth>
          <DialogTitle>Review Answers</DialogTitle>
          <DialogContent dividers sx={{ px: { xs: 1, sm: 3 } }}>
            {selectedResult && resultsDialogQuiz && (
              <Box>
                {resultsDialogQuiz.questions.map((q, qIdx) => {
                  const correctIndexes = q.options.map((opt, i) => opt.isCorrect ? i : null).filter(i => i !== null);
                  const selected = selectedResult.answers[qIdx]?.selected || [];
                  const isCorrect =
                    correctIndexes.length === selected.length &&
                    correctIndexes.every(idx => selected.includes(idx));
                  return (
                    <Box key={qIdx} mb={2}>
                      <Typography fontWeight={600}>Q{qIdx + 1}: {q.text} {isCorrect ? <Chip label="Correct" color="success" size="small" sx={{ ml: 1 }} /> : <Chip label="Wrong" color="error" size="small" sx={{ ml: 1 }} />}</Typography>
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
                              {isSelected && !isAnswer && " (Their Answer)"}
                            </li>
                          );
                        })}
                      </ul>
                    </Box>
                  );
                })}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedResult(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default Dashboard; 