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
    <Box
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{
        bgcolor: 'background.default',
        background: 'linear-gradient(135deg, #e3f0ff 0%, #f5f5f5 100%)',
        py: { xs: 4, sm: 8 },
      }}
    >
      <Container maxWidth="sm" sx={{ px: { xs: 0.5, sm: 2 } }}>
        <Paper elevation={6} sx={{ p: { xs: 3, sm: 6 }, textAlign: "center", borderRadius: 4, bgcolor: 'white', boxShadow: '0 4px 24px rgba(60,60,60,0.08)' }}>
          <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
            <Quiz sx={{ fontSize: 64, color: 'primary.main', mb: 1 }} />
            <Typography variant="h2" fontWeight={900} color="primary" gutterBottom sx={{ fontSize: { xs: 32, sm: 48 }, letterSpacing: 1 }}>
              Quiz Craft
            </Typography>
            <Typography variant="h5" color="text.secondary" gutterBottom sx={{ mb: 3, fontSize: { xs: 18, sm: 24 }, fontWeight: 400 }}>
              Create, share, and take quizzes with ease.<br />
              The best quiz platform for students and teachers.
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            size="large"
            component={RouterLink}
            to="/login"
            sx={{ mt: 2, px: 5, py: 1.5, fontSize: 20, borderRadius: 3, boxShadow: 2, fontWeight: 700, letterSpacing: 1 }}
            fullWidth
          >
            Get Started
          </Button>
          <Box mt={5} display="flex" justifyContent="center" gap={2} flexWrap="wrap">
            <Box display="flex" alignItems="center" gap={1}>
              <EmojiEvents color="warning" />
              <Typography variant="body1" color="text.secondary">Earn badges</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <People color="success" />
              <Typography variant="body1" color="text.secondary">Compete with friends</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Share color="primary" />
              <Typography variant="body1" color="text.secondary">Share results</Typography>
            </Box>
          </Box>
        </Paper>
        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ mt: 2, fontStyle: 'italic' }}
        >
          made by Komal and Roshan
        </Typography>
      </Container>
    </Box>
  );
};

export default Home;
