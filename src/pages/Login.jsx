import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { Button, TextField, Typography, Paper, Alert, Divider, Container, Grid, Box } from "@mui/material";
import GoogleIcon from '@mui/icons-material/Google';

const provider = new GoogleAuthProvider();

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithPopup(auth, provider);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" bgcolor="#f0f4fa">
      <Container maxWidth="sm">
        <Paper elevation={8} sx={{ p: { xs: 3, sm: 6 }, borderRadius: 4, bgcolor: 'white' }}>
          <Typography variant="h4" align="center" fontWeight={700} gutterBottom>
            {isSignUp ? "Sign Up" : "Login"} (Creator Only)
          </Typography>
          <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 2 }}>
            {isSignUp ? "Create your account to start making quizzes." : "Login to create and manage your quizzes."}
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <form onSubmit={handleEmailAuth}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              fullWidth
              margin="normal"
              required
              size="large"
              sx={{ fontSize: 18 }}
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              fullWidth
              margin="normal"
              required
              size="large"
              sx={{ fontSize: 18 }}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
              sx={{ mt: 2, py: 1.5, fontSize: 18, borderRadius: 2 }}
            >
              {isSignUp ? "Sign Up" : "Login"}
            </Button>
          </form>
          <Divider sx={{ my: 3 }}>or</Divider>
          <Button
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleSignIn}
            fullWidth
            disabled={loading}
            sx={{ py: 1.5, fontSize: 18, borderRadius: 2 }}
          >
            Continue with Google
          </Button>
          <Button
            color="secondary"
            onClick={() => setIsSignUp(!isSignUp)}
            fullWidth
            sx={{ mt: 2 }}
          >
            {isSignUp ? "Already have an account? Login" : "Don't have an account? Sign Up"}
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login; 