import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Button, TextField, Typography, Paper, Alert, Divider, Container, Grid, Box } from "@mui/material";
import GoogleIcon from '@mui/icons-material/Google';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

const provider = new GoogleAuthProvider();

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const createUserProfile = async (user, name) => {
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        // Create new user profile
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: name || user.displayName || "Quiz User",
          photoURL: user.photoURL || null,
          createdAt: new Date(),
          quizzesCreated: 0,
          quizzesTaken: 0,
          totalScore: 0,
          followers: [],
          following: []
        });
      }
    } catch (err) {
      console.error("Error creating user profile:", err);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      await createUserProfile(result.user, result.user.displayName);
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
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await createUserProfile(result.user, displayName);
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
      <Container maxWidth="sm">
        <Paper elevation={8} sx={{ p: { xs: 3, sm: 6 }, borderRadius: 4, bgcolor: 'white', boxShadow: '0 4px 24px rgba(60,60,60,0.08)' }}>
          <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
            <LockOutlinedIcon sx={{ fontSize: 56, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" align="center" fontWeight={900} gutterBottom sx={{ letterSpacing: 1 }}>
              {isSignUp ? "Join QuizHub" : "Welcome Back"}
            </Typography>
            <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 2, fontWeight: 400 }}>
              {isSignUp ? "Create your account to create and take quizzes with friends!" : "Login to access your quizzes and results."}
            </Typography>
          </Box>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <form onSubmit={handleEmailAuth}>
            {isSignUp && (
              <TextField
                label="Display Name"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                fullWidth
                margin="normal"
                required
                size="large"
                sx={{ fontSize: 18 }}
              />
            )}
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
              sx={{ mt: 2, py: 1.5, fontSize: 18, borderRadius: 2, fontWeight: 700, letterSpacing: 1 }}
            >
              {isSignUp ? "Create Account" : "Login"}
            </Button>
          </form>
          <Divider sx={{ my: 3 }}>or</Divider>
          <Button
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleSignIn}
            fullWidth
            disabled={loading}
            sx={{ py: 1.5, fontSize: 18, borderRadius: 2, fontWeight: 700, letterSpacing: 1 }}
          >
            Continue with Google
          </Button>
          <Button
            color="secondary"
            onClick={() => setIsSignUp(!isSignUp)}
            fullWidth
            sx={{ mt: 2, fontWeight: 500 }}
          >
            {isSignUp ? "Already have an account? Login" : "Don't have an account? Sign Up"}
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login; 