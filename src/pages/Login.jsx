import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signInWithPhoneNumber, RecaptchaVerifier } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Button, TextField, Typography, Paper, Alert, Divider, Container, Grid, Box } from "@mui/material";
import GoogleIcon from '@mui/icons-material/Google';

const provider = new GoogleAuthProvider();

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);

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

  // Setup Recaptcha only once
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => {},
        },
        auth
      );
    }
  };

  useEffect(() => {
    // Cleanup recaptchaVerifier on unmount
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const handleSendOtp = async () => {
    setError("");
    setPhoneLoading(true);
    try {
      // Ensure recaptcha container is in the DOM and always create a new verifier if needed
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      window.recaptchaVerifier = new RecaptchaVerifier(
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => {},
        },
        auth
      );
      const appVerifier = window.recaptchaVerifier;
      const confirmationResult = await signInWithPhoneNumber(auth, phone, appVerifier);
      window.confirmationResult = confirmationResult;
      setOtpSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    setPhoneLoading(true);
    try {
      const result = await window.confirmationResult.confirm(otp);
      await createUserProfile(result.user, result.user.displayName);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setPhoneLoading(false);
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
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" bgcolor="#f0f4fa">
      <Container maxWidth="sm">
        <Paper elevation={8} sx={{ p: { xs: 3, sm: 6 }, borderRadius: 4, bgcolor: 'white' }}>
          <Typography variant="h4" align="center" fontWeight={700} gutterBottom>
            {isSignUp ? "Join QuizHub" : "Welcome Back"}
          </Typography>
          <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 2 }}>
            {isSignUp ? "Create your account to create and take quizzes with friends!" : "Login to access your quizzes and results."}
          </Typography>
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
              sx={{ mt: 2, py: 1.5, fontSize: 18, borderRadius: 2 }}
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
            sx={{ py: 1.5, fontSize: 18, borderRadius: 2 }}
          >
            Continue with Google
          </Button>
          {/* Phone Auth Section */}
          <Divider sx={{ my: 3 }}>or</Divider>
          <Box>
            <TextField
              label="Phone Number"
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              fullWidth
              margin="normal"
              placeholder="+1 234 567 8901"
              disabled={otpSent || phoneLoading}
            />
            {otpSent && (
              <TextField
                label="Enter OTP"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                fullWidth
                margin="normal"
                disabled={phoneLoading}
              />
            )}
            <div id="recaptcha-container" style={{ margin: "8px 0" }} />
            {!otpSent ? (
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleSendOtp}
                disabled={phoneLoading || !phone}
                sx={{ mt: 1, py: 1.5, fontSize: 18, borderRadius: 2 }}
              >
                {phoneLoading ? "Sending..." : "Send OTP"}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="success"
                fullWidth
                onClick={handleVerifyOtp}
                disabled={phoneLoading || !otp}
                sx={{ mt: 1, py: 1.5, fontSize: 18, borderRadius: 2 }}
              >
                {phoneLoading ? "Verifying..." : "Verify & Login"}
              </Button>
            )}
          </Box>
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