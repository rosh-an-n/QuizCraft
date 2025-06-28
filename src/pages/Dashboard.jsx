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
  Tab,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction
} from "@mui/material";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BarChartIcon from '@mui/icons-material/BarChart';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StarIcon from '@mui/icons-material/Star';
import PersonIcon from '@mui/icons-material/Person';
import QuizIcon from '@mui/icons-material/Quiz';
import PeopleIcon from '@mui/icons-material/People';
import ShareIcon from '@mui/icons-material/Share';
import AddIcon from '@mui/icons-material/Add';
import { collection, query, where, getDocs, orderBy, doc, deleteDoc, getDoc } from "firebase/firestore";
import SnackbarContext from "../SnackbarContext";

const BADGES = [
  { key: 'creator', label: 'Quiz Creator', icon: <EmojiEventsIcon color="warning" />, desc: 'Created your first quiz!' },
  { key: 'master', label: 'Quiz Master', icon: <StarIcon color="primary" />, desc: 'Created 5+ quizzes!' },
  { key: 'participant', label: 'Quiz Participant', icon: <PersonIcon color="secondary" />, desc: 'Took your first quiz!' },
  { key: 'social', label: 'Social Butterfly', icon: <PeopleIcon color="success" />, desc: 'Gained your first follower!' }
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [takenQuizzes, setTakenQuizzes] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
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
  const [dashboardTab, setDashboardTab] = useState(0);
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

  const fetchUserProfile = async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data());
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
  };

  const fetchQuizzes = async () => {
    setLoading(true);
    setError("");
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      
      // Fetch created quizzes
      const createdQuery = query(
        collection(db, "quizzes"),
        where("creatorId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const createdSnapshot = await getDocs(createdQuery);
      const createdList = createdSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setQuizzes(createdList);

      // Fetch taken quizzes
      const resultsQuery = query(
        collection(db, "results"),
        where("userId", "==", user.uid),
        orderBy("submittedAt", "desc")
      );
      const resultsSnapshot = await getDocs(resultsQuery);
      const resultsList = resultsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Get quiz details for taken quizzes
      const takenQuizzesWithDetails = await Promise.all(
        resultsList.map(async (result) => {
          try {
            const quizDoc = await getDoc(doc(db, "quizzes", result.quizId));
            if (quizDoc.exists()) {
              return {
                ...result,
                quiz: { id: quizDoc.id, ...quizDoc.data() }
              };
            }
            return result;
          } catch (err) {
            return result;
          }
        })
      );
      setTakenQuizzes(takenQuizzesWithDetails);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchQuizzes();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (quizzes.length > 0 && !badges.creator) {
      const newBadges = { ...badges, creator: true };
      setBadges(newBadges);
      localStorage.setItem('badges', JSON.stringify(newBadges));
      showSnackbar("🎉 You earned the Quiz Creator badge!", "success");
    }
    if (quizzes.length >= 5 && !badges.master) {
      const newBadges = { ...badges, master: true };
      setBadges(newBadges);
      localStorage.setItem('badges', JSON.stringify(newBadges));
      showSnackbar("🏆 You earned the Quiz Master badge!", "success");
    }
    if (takenQuizzes.length > 0 && !badges.participant) {
      const newBadges = { ...badges, participant: true };
      setBadges(newBadges);
      localStorage.setItem('badges', JSON.stringify(newBadges));
      showSnackbar("👤 You earned the Quiz Participant badge!", "success");
    }
    if (userProfile?.followers?.length > 0 && !badges.social) {
      const newBadges = { ...badges, social: true };
      setBadges(newBadges);
      localStorage.setItem('badges', JSON.stringify(newBadges));
      showSnackbar("🦋 You earned the Social Butterfly badge!", "success");
    }
    // eslint-disable-next-line
  }, [quizzes, takenQuizzes, userProfile]);

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

  const handleShareProfile = () => {
    const profileUrl = `${window.location.origin}/profile/${auth.currentUser.uid}`;
    navigator.clipboard.writeText(profileUrl);
    showSnackbar("Profile link copied!", "success");
  };

  // Helper to export results as CSV
  const exportResultsCSV = () => {
    if (!results || results.length === 0) return;
    const headers = ["Name", "Score", "Total", "Date", "Answers"];
    const rows = results.map(r => [
      r.userName || r.name,
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
    <Box
      minHeight="100vh"
      sx={{
        bgcolor: 'background.default',
        background: 'linear-gradient(135deg, #e3f0ff 0%, #f5f5f5 100%)',
        py: { xs: 2, sm: 4 },
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
        {/* Hero Section */}
        {userProfile && (
          <Paper elevation={8} sx={{ p: { xs: 2, sm: 4 }, mb: 4, borderRadius: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 3, bgcolor: 'white', boxShadow: '0 4px 24px rgba(60,60,60,0.08)' }}>
            <Avatar src={userProfile.photoURL} sx={{ width: 80, height: 80, mr: { sm: 3 }, mb: { xs: 2, sm: 0 } }}>
              <PersonIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Box flex={1} minWidth={0}>
              <Typography variant="h4" fontWeight={900} gutterBottom sx={{ letterSpacing: 1, fontSize: { xs: 24, sm: 32 } }}>
                {userProfile.displayName}
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {userProfile.email}
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
                <Chip icon={<QuizIcon />} label={`${userProfile.quizzesCreated || 0} Quizzes Created`} color="primary" variant="outlined" />
                <Chip icon={<EmojiEventsIcon />} label={`${userProfile.quizzesTaken || 0} Quizzes Taken`} color="secondary" variant="outlined" />
              </Box>
              <Box display="flex" gap={1} flexWrap="wrap">
                {BADGES.filter(b => badges[b.key]).map(b => (
                  <Tooltip title={b.desc} key={b.key}><Chip icon={b.icon} label={b.label} color="success" /></Tooltip>
                ))}
              </Box>
            </Box>
          </Paper>
        )}

        {/* Main Dashboard */}
        <Paper elevation={8} sx={{ borderRadius: 4 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={dashboardTab} onChange={(e, newValue) => setDashboardTab(newValue)}>
              <Tab label={`My Quizzes (${quizzes.length})`} icon={<QuizIcon />} />
              <Tab label={`Taken Quizzes (${takenQuizzes.length})`} icon={<PersonIcon />} />
            </Tabs>
          </Box>

          <Box sx={{ p: 3 }}>
            {dashboardTab === 0 && (
              <>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h5" fontWeight={700}>
                    My Created Quizzes
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleCreateQuiz}
                    startIcon={<QuizIcon />}
                  >
                    Create New Quiz
                  </Button>
                </Box>

                {loading ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                  </Box>
                ) : error ? (
                  <Alert severity="error">{error}</Alert>
                ) : quizzes.length === 0 ? (
                  <Box textAlign="center" py={4}>
                    <QuizIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No quizzes created yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={3}>
                      Start creating amazing quizzes to share with others!
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleCreateQuiz}
                    >
                      Create Your First Quiz
                    </Button>
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                    {quizzes.map((quiz) => (
                      <Grid item xs={12} sm={6} md={4} key={quiz.id}>
                        <Card elevation={4} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                          <CardContent sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                              {quiz.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" mb={2}>
                              {quiz.description}
                            </Typography>
                            <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                              <Chip label={`${quiz.questions?.length || 0} questions`} size="small" />
                              <Chip label={quiz.timerType || 'No timer'} size="small" variant="outlined" />
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              Created: {quiz.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                            </Typography>
                          </CardContent>
                          <CardActions>
                            <Tooltip title="Copy Link">
                              <IconButton
                                onClick={() => handleCopyLink(quiz.id)}
                                color={copySuccess === quiz.id ? "success" : "default"}
                              >
                                <ContentCopyIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="View Results">
                              <IconButton onClick={() => handleViewResults(quiz)}>
                                <BarChartIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit Quiz">
                              <IconButton onClick={() => handleEdit(quiz)}>
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Quiz">
                              <IconButton
                                onClick={() => setDeleteQuizId(quiz.id)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </CardActions>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </>
            )}

            {dashboardTab === 1 && (
              <>
                <Typography variant="h5" fontWeight={700} mb={3}>
                  Quizzes I've Taken
                </Typography>

                {loading ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                  </Box>
                ) : takenQuizzes.length === 0 ? (
                  <Box textAlign="center" py={4}>
                    <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No quizzes taken yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Start taking quizzes to see your results here!
                    </Typography>
                  </Box>
                ) : (
                  <List>
                    {takenQuizzes.map((result) => (
                      <ListItem key={result.id} divider>
                        <ListItemAvatar>
                          <Avatar>
                            <QuizIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={result.quiz?.title || "Unknown Quiz"}
                          secondary={
                            <Box>
                              <Typography variant="body2">
                                Score: {result.score}/{result.total} ({Math.round((result.score / result.total) * 100)}%)
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Taken: {result.submittedAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => navigate(`/result/${result.quizId}`, {
                              state: {
                                score: result.score,
                                total: result.total,
                                answers: result.answers,
                                quiz: result.quiz,
                                userName: result.userName,
                                resultId: result.id
                              }
                            })}
                          >
                            View Result
                          </Button>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
              </>
            )}
          </Box>
        </Paper>

        {/* View Quiz Dialog */}
        <Dialog open={!!viewQuiz} onClose={() => setViewQuiz(null)} maxWidth="md" fullWidth>
          <DialogTitle>{viewQuiz?.title}</DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>
              {viewQuiz?.description}
            </Typography>
            <Typography variant="h6" mt={2} gutterBottom>
              Questions ({viewQuiz?.questions?.length || 0}):
            </Typography>
            {viewQuiz?.questions?.map((q, idx) => (
              <Box key={idx} mb={2}>
                <Typography variant="body2" fontWeight={600}>
                  Q{idx + 1}: {q.text}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Options: {q.options?.length || 0} | Multiple: {q.allowMultiple ? 'Yes' : 'No'}
                </Typography>
              </Box>
            ))}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewQuiz(null)}>Close</Button>
            <Button onClick={() => handleCopyLink(viewQuiz?.id)} variant="contained">
              Copy Link
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteQuizId} onClose={() => setDeleteQuizId(null)}>
          <DialogTitle>Delete Quiz</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this quiz? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteQuizId(null)}>Cancel</Button>
            <Button
              onClick={handleDelete}
              color="error"
              variant="contained"
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Results Dialog */}
        <Dialog open={!!resultsDialogQuiz} onClose={() => setResultsDialogQuiz(null)} maxWidth="md" fullWidth>
          <DialogTitle>
            Results for "{resultsDialogQuiz?.title}"
            <Button
              startIcon={<FileDownloadIcon />}
              onClick={exportResultsCSV}
              sx={{ ml: 2 }}
              disabled={results.length === 0}
            >
              Export CSV
            </Button>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={resultsTab} onChange={(e, newValue) => setResultsTab(newValue)}>
                <Tab label="Attempts" />
                <Tab label="Leaderboard" />
              </Tabs>
            </Box>

            {resultsLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : resultsError ? (
              <Alert severity="error">{resultsError}</Alert>
            ) : results.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography color="text.secondary">No results yet</Typography>
              </Box>
            ) : (
              <Box mt={2}>
                {resultsTab === 0 && (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Score</TableCell>
                          <TableCell>Percentage</TableCell>
                          <TableCell>Date</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {results.map((result) => (
                          <TableRow key={result.id}>
                            <TableCell>{result.userName || result.name}</TableCell>
                            <TableCell>{result.score}/{result.total}</TableCell>
                            <TableCell>{Math.round((result.score / result.total) * 100)}%</TableCell>
                            <TableCell>
                              {result.submittedAt?.toDate?.()?.toLocaleString() || '-'}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="small"
                                onClick={() => setSelectedResult(result)}
                              >
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                {resultsTab === 1 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Top Performers
                    </Typography>
                    {results
                      .sort((a, b) => (b.score / b.total) - (a.score / a.total))
                      .slice(0, 10)
                      .map((result, idx) => (
                        <Box key={result.id} display="flex" alignItems="center" mb={1}>
                          <Typography variant="h6" sx={{ minWidth: 40 }}>
                            #{idx + 1}
                          </Typography>
                          <Typography sx={{ flex: 1 }}>
                            {result.userName || result.name}
                          </Typography>
                          <Typography variant="h6" color="primary">
                            {Math.round((result.score / result.total) * 100)}%
                          </Typography>
                        </Box>
                      ))}
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setResultsDialogQuiz(null)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Result Details Dialog */}
        <Dialog open={!!selectedResult} onClose={() => setSelectedResult(null)} maxWidth="md" fullWidth>
          <DialogTitle>Result Details</DialogTitle>
          <DialogContent>
            {selectedResult && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  {selectedResult.userName || selectedResult.name}
                </Typography>
                <Typography>
                  Score: {selectedResult.score}/{selectedResult.total} ({Math.round((selectedResult.score / selectedResult.total) * 100)}%)
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Submitted: {selectedResult.submittedAt?.toDate?.()?.toLocaleString() || '-'}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Answers:
                </Typography>
                {selectedResult.answers?.map((answer, idx) => (
                  <Box key={idx} mb={1}>
                    <Typography variant="body2">
                      Q{idx + 1}: Selected options {answer.selected?.join(', ') || 'none'}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedResult(null)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Floating Action Button for Create Quiz (mobile) */}
        <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1300, display: { xs: 'flex', sm: 'none' } }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleCreateQuiz}
            sx={{ borderRadius: '50%', minWidth: 0, width: 56, height: 56, boxShadow: 3 }}
          >
            <AddIcon sx={{ fontSize: 32 }} />
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default Dashboard; 