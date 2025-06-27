import React, { useMemo, useState, useEffect } from "react";
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
import RequireAuth from "./components/RequireAuth";
import BarChartIcon from '@mui/icons-material/BarChart';

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem("darkMode");
    return stored ? JSON.parse(stored) : false;
  });

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  const theme = useMemo(() =>
    createTheme({
      palette: {
        mode: darkMode ? "dark" : "light",
        primary: {
          main: darkMode ? "#90caf9" : "#1976d2"
        },
        background: {
          default: darkMode ? "#121212" : "#f0f4fa"
        }
      }
    }),
    [darkMode]
  );

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
              <Route path="/quiz/:quizId" element={<Quiz />} />
              <Route path="/result/:quizId" element={<Result />} />
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
