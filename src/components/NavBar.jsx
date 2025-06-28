import React from "react";
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Tooltip } from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import MenuIcon from '@mui/icons-material/Menu';
import Avatar from '@mui/material/Avatar';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import HomeIcon from '@mui/icons-material/Home';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import { Divider } from '@mui/material';

const NavBar = ({ darkMode, onToggleDarkMode }) => {
  const [user, setUser] = React.useState(null);
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const handleDrawerToggle = () => setMobileOpen((prev) => !prev);

  return (
    <>
      <AppBar position="sticky" color="primary" elevation={2} sx={{ zIndex: 1201 }}>
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 }, px: { xs: 1, sm: 3 } }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ display: { sm: 'none' }, mr: 1 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit', fontWeight: 700, letterSpacing: 1 }}
          >
            <Box component="span" sx={{ color: '#fff', fontWeight: 900, mr: 1, fontSize: 28, verticalAlign: 'middle' }}>Q</Box>uiz App
          </Typography>
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
            <Button color="inherit" component={RouterLink} to="/">Home</Button>
            {!user && <Button color="inherit" component={RouterLink} to="/login" startIcon={<LoginIcon />}>Login</Button>}
            {user && <Button color="inherit" component={RouterLink} to="/dashboard" startIcon={<DashboardIcon />}>Dashboard</Button>}
            {user && <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />}>Logout</Button>}
            <Tooltip title={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
              <IconButton color="inherit" onClick={onToggleDarkMode} sx={{ ml: 1 }}>
                {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>
            {user && <Avatar src={user.photoURL} alt={user.displayName} sx={{ ml: 1, width: 32, height: 32 }} />}
          </Box>
        </Toolbar>
      </AppBar>
      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', sm: 'none' } }}
      >
        <Box sx={{ width: 250 }} role="presentation" onClick={handleDrawerToggle}>
          <List>
            <ListItem button component={RouterLink} to="/">
              <ListItemIcon><HomeIcon /></ListItemIcon>
              <ListItemText primary="Home" />
            </ListItem>
            {!user && (
              <ListItem button component={RouterLink} to="/login">
                <ListItemIcon><LoginIcon /></ListItemIcon>
                <ListItemText primary="Login" />
              </ListItem>
            )}
            {user && (
              <ListItem button component={RouterLink} to="/dashboard">
                <ListItemIcon><DashboardIcon /></ListItemIcon>
                <ListItemText primary="Dashboard" />
              </ListItem>
            )}
            {user && (
              <ListItem button onClick={handleLogout}>
                <ListItemIcon><LogoutIcon /></ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItem>
            )}
          </List>
          <Divider />
          <List>
            <ListItem>
              <ListItemIcon>
                <Tooltip title={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
                  <IconButton color="inherit" onClick={onToggleDarkMode}>
                    {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                  </IconButton>
                </Tooltip>
              </ListItemIcon>
              <ListItemText primary="Theme" />
            </ListItem>
            {user && (
              <ListItem>
                <ListItemIcon>
                  <Avatar src={user.photoURL} alt={user.displayName} sx={{ width: 32, height: 32 }} />
                </ListItemIcon>
                <ListItemText primary={user.displayName || "User"} />
              </ListItem>
            )}
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default NavBar; 