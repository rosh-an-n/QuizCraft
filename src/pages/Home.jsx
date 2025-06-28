import React from "react";
import { Container, Typography, Button, Paper, Box } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import {
  Person,
  Quiz,
  EmojiEvents,
  People,
  Share,
  Edit,
  PersonAdd,
  PersonRemove
} from "@mui/icons-material";

const Home = () => {
  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" bgcolor="#f0f4fa">
      <Container maxWidth="sm" sx={{ px: { xs: 0.5, sm: 2 } }}>
        <Paper elevation={6} sx={{ p: { xs: 2, sm: 6 }, textAlign: "center", borderRadius: 4, bgcolor: 'white' }}>
          <Typography variant="h2" fontWeight={800} color="primary" gutterBottom sx={{ fontSize: { xs: 32, sm: 48 } }}>
            Quiz App
          </Typography>
          <Typography variant="h5" color="text.secondary" gutterBottom sx={{ mb: 3, fontSize: { xs: 18, sm: 24 } }}>
            Create, share, and take quizzes with ease. <br />
            The best quiz platform for students and teachers.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            component={RouterLink}
            to="/login"
            sx={{ mt: 2, px: 5, py: 1.5, fontSize: 20, borderRadius: 3, boxShadow: 2 }}
            fullWidth
          >
            Get Started
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default Home; 