import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, CssBaseline, createTheme, Box } from "@mui/material";


import NavBar from "./components/NavBar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateQuiz from "./pages/CreateQuiz";
import Quiz from "./pages/Quiz";
import Result from "./pages/Result";
import RequireAuth from "./components/RequireAuth";

const theme = createTheme();

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box minHeight="100vh" width="100vw" display="flex" flexDirection="column" bgcolor="#f0f4fa">
        <Router>
          <NavBar />
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
      </Box>
    </ThemeProvider>
  );
}

export default App;
