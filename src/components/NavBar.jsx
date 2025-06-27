import React from "react";
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Tooltip } from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

const NavBar = ({ darkMode, onToggleDarkMode }) => {
  const [user, setUser] = React.useState(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Typography variant="h6" component={RouterLink} to="/" sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}>
          Quiz App
        </Typography>
        <Box>
          <Button color="inherit" component={RouterLink} to="/">Home</Button>
          {!user && <Button color="inherit" component={RouterLink} to="/login">Login</Button>}
          {user && <Button color="inherit" component={RouterLink} to="/dashboard">Dashboard</Button>}
          {user && <Button color="inherit" onClick={handleLogout}>Logout</Button>}
          <Tooltip title={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
            <IconButton color="inherit" onClick={onToggleDarkMode} sx={{ ml: 1 }}>
              {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar; 