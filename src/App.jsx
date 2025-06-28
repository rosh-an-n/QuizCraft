import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, CssBaseline, createTheme, Box, Snackbar, Alert } from "@mui/material";
import SnackbarContext from "./SnackbarContext";

import NavBar from "./components/NavBar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateQuiz from "./pages/CreateQuiz";
import Quiz from "./pages/Quiz";
import Result from "./pages/Result";
import UserProfile from "./components/UserProfile";
import RequireAuth from "./components/RequireAuth";
import BarChartIcon from '@mui/icons-material/BarChart';

const theme = createTheme({
  palette: {
    primary: { main: '#1a73e8' }, // Google blue
    secondary: { main: '#e91e63' },
    background: { default: '#f5f5f5', paper: '#fff' },
    text: { primary: '#222', secondary: '#444' },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, boxShadow: 'none' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 16, boxShadow: '0 2px 8px rgba(60,60,60,0.06)' },
      },
    },
  },
});

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem("darkMode");
    return stored ? JSON.parse(stored) : false;
  });

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  const handleToggleDarkMode = () => setDarkMode((prev) => !prev);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };
  const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarContext.Provider value={showSnackbar}>
        <Box minHeight="100vh" width="100vw" display="flex" flexDirection="column" bgcolor={theme.palette.background.default}>
          <Router>
            <NavBar darkMode={darkMode} onToggleDarkMode={handleToggleDarkMode} />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
              <Route path="/create" element={<RequireAuth><CreateQuiz /></RequireAuth>} />
              <Route path="/edit/:quizId" element={<RequireAuth><CreateQuiz /></RequireAuth>} />
              <Route path="/quiz/:quizId" element={<RequireAuth><Quiz /></RequireAuth>} />
              <Route path="/result/:quizId" element={<RequireAuth><Result /></RequireAuth>} />
              <Route path="/profile/:userId" element={<RequireAuth><UserProfile /></RequireAuth>} />
            </Routes>
          </Router>
          <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
            <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Box>
      </SnackbarContext.Provider>
    </ThemeProvider>
  );
}

export default App;
