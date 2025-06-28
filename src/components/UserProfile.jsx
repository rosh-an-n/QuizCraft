import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import {
  Container,
  Paper,
  Typography,
  Box,
  Avatar,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar
} from "@mui/material";
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
import { updateProfile } from "firebase/auth";

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhoto, setEditPhoto] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError("");
      try {
        // Get current user
        const currentUserDoc = await getDoc(doc(db, "users", auth.currentUser?.uid));
        if (currentUserDoc.exists()) {
          setCurrentUser(currentUserDoc.data());
        }

        // Get profile user
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser(userData);
          setIsFollowing(currentUserDoc.data()?.following?.includes(userId) || false);
        } else {
          setError("User not found");
        }
      } catch (err) {
        setError("Failed to fetch user data: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (auth.currentUser && userId) {
      fetchUserData();
    }
  }, [userId]);

  const handleFollow = async () => {
    if (!auth.currentUser || !user) return;
    
    setFollowLoading(true);
    try {
      const currentUserRef = doc(db, "users", auth.currentUser.uid);
      const userRef = doc(db, "users", userId);

      if (isFollowing) {
        // Unfollow
        await updateDoc(currentUserRef, {
          following: arrayRemove(userId)
        });
        await updateDoc(userRef, {
          followers: arrayRemove(auth.currentUser.uid)
        });
        setIsFollowing(false);
      } else {
        // Follow
        await updateDoc(currentUserRef, {
          following: arrayUnion(userId)
        });
        await updateDoc(userRef, {
          followers: arrayUnion(auth.currentUser.uid)
        });
        setIsFollowing(true);
      }
    } catch (err) {
      console.error("Error updating follow status:", err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleShare = () => {
    const profileUrl = `${window.location.origin}/profile/${userId}`;
    navigator.clipboard.writeText(profileUrl);
    // You can add a snackbar notification here
  };

  // Open dialog with current values
  const handleEditOpen = () => {
    setEditName(user.displayName || "");
    setEditPhoto(user.photoURL || "");
    setEditBio(user.bio || "");
    setEditOpen(true);
  };

  const handleEditClose = () => setEditOpen(false);

  // Save profile changes
  const handleEditSave = async () => {
    setEditLoading(true);
    try {
      // Update Firestore
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        displayName: editName,
        photoURL: editPhoto,
        bio: editBio
      });
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, {
        displayName: editName,
        photoURL: editPhoto
      });
      setSnackbar({ open: true, message: "Profile updated!", severity: "success" });
      setEditOpen(false);
      // Refresh user data
      setUser(prev => ({ ...prev, displayName: editName, photoURL: editPhoto, bio: editBio }));
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: "error" });
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center">
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!user) return null;

  const isOwnProfile = auth.currentUser?.uid === userId;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={8} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 4 }}>
        {/* Profile Header */}
        <Box display="flex" alignItems="center" mb={3}>
          <Avatar
            src={user.photoURL}
            sx={{ width: 80, height: 80, mr: 3 }}
          >
            <Person sx={{ fontSize: 40 }} />
          </Avatar>
          <Box flex={1}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {user.displayName}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Member since {user.createdAt?.toDate?.()?.toLocaleDateString() || "Recently"}
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Chip
                icon={<Quiz />}
                label={`${user.quizzesCreated || 0} Quizzes Created`}
                color="primary"
                variant="outlined"
              />
              <Chip
                icon={<EmojiEvents />}
                label={`${user.quizzesTaken || 0} Quizzes Taken`}
                color="secondary"
                variant="outlined"
              />
            </Box>
          </Box>
          <Box display="flex" gap={1}>
            {!isOwnProfile && (
              <Button
                variant={isFollowing ? "outlined" : "contained"}
                startIcon={isFollowing ? <PersonRemove /> : <PersonAdd />}
                onClick={handleFollow}
                disabled={followLoading}
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </Button>
            )}
            {isOwnProfile && (
              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={handleEditOpen}
              >
                Edit Profile
              </Button>
            )}
            <Tooltip title="Share Profile">
              <IconButton onClick={handleShare}>
                <Share />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Stats Grid */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent textAlign="center">
                <Typography variant="h4" color="primary" fontWeight={700}>
                  {user.quizzesCreated || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Quizzes Created
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent textAlign="center">
                <Typography variant="h4" color="secondary" fontWeight={700}>
                  {user.quizzesTaken || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Quizzes Taken
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent textAlign="center">
                <Typography variant="h4" color="success.main" fontWeight={700}>
                  {user.followers?.length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Followers
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Social Stats */}
        <Box display="flex" justifyContent="space-around" mb={3}>
          <Box textAlign="center">
            <Typography variant="h6" fontWeight={600}>
              {user.followers?.length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Followers
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h6" fontWeight={600}>
              {user.following?.length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Following
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h6" fontWeight={600}>
              {user.totalScore || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Score
            </Typography>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box display="flex" gap={2} justifyContent="center">
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate(`/user/${userId}/quizzes`)}
          >
            View Quizzes
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate(`/user/${userId}/results`)}
          >
            View Results
          </Button>
        </Box>
      </Paper>
      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onClose={handleEditClose} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <TextField
            label="Display Name"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Photo URL"
            value={editPhoto}
            onChange={e => setEditPhoto(e.target.value)}
            fullWidth
            margin="normal"
          />
          {editPhoto && (
            <Box display="flex" justifyContent="center" my={2}>
              <Avatar src={editPhoto} sx={{ width: 64, height: 64 }} />
            </Box>
          )}
          <TextField
            label="Bio"
            value={editBio}
            onChange={e => setEditBio(e.target.value)}
            fullWidth
            margin="normal"
            multiline
            minRows={2}
            maxRows={4}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose} disabled={editLoading}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained" disabled={editLoading}>
            {editLoading ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Container>
  );
};

export default UserProfile; 