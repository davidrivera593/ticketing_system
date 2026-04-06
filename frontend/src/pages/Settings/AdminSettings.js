import {
  Button,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Box,
  FormControl,
  RadioGroup,
  Radio,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Cookies from "js-cookie";
import React, { useEffect, useState } from "react";
import {useNavigate} from "react-router-dom";
import { useTheme as useCustomTheme } from "../../contexts/ThemeContext";


const AdminSettings = () => {
  const [deleteStatus, setDeleteStatus] = useState(false);
  const [user, setUser] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const token = Cookies.get("token");
  const navigate = useNavigate();
  const theme = useTheme();
  const { isDarkMode, themeMode, setTheme } = useCustomTheme();


  useEffect(() => {
    fetchUserProfile();
  }, [deleteStatus]); // Fetch teams and TAs when the component mounts or when deleteStatus changes

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/users/profile`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data);
        setNotificationsEnabled(data.notifications_enabled);
      }
    } catch (error) {
      console.error("Failed to load user profile:", error);
    }
  };

  const updatePreference = (updates) => {
    if (!user) return;

    fetch(`${process.env.REACT_APP_API_BASE_URL}/api/users/${user.user_id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...user,
        ...updates,
      }),
    })
      .then((res) => res.json())
      .then((updatedUser) => {
        setUser(updatedUser);
      })
      .catch((err) => {
        console.error("Error saving preferences:", err);
      });
  };

  const handleNotificationsToggle = () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    updatePreference({ notifications_enabled: newValue });
  };

  const handleThemeModeChange = (event) => {
    const newThemeMode = event.target.value;
    setTheme(newThemeMode);
    updatePreference({ 
      theme_mode: newThemeMode,
      dark_mode: newThemeMode === 'dark'
    });
  };


  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 60px)",
        backgroundColor: theme.palette.background.default,
        padding: "20px 0",
      }}
    >
      <Box
        sx={{
          padding: 5,
          backgroundColor: theme.palette.background.paper,
          borderRadius: "10px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          maxWidth: "800px",
          margin: "40px auto",
        }}
      >
      <Typography 
        variant="h4" 
        sx={{ 
          marginBottom: 5, 
          textAlign: "center", 
          fontWeight: "bold",
          color: theme.palette.text.primary
        }}
      >
        Settings
      </Typography>
      
      {/* Personal Preferences Section */}
      <Box
        sx={{
          marginBottom: 5,
          backgroundColor: theme.palette.background.paper,
          borderRadius: "10px",
          border: `1px solid ${theme.palette.divider}`,
          padding: 2.5,
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Typography 
          variant="h5" 
          sx={{ 
            marginBottom: 2.5, 
            fontWeight: "bold",
            color: theme.palette.text.primary
          }}
        >
          Personal Preferences
        </Typography>
        <FormControlLabel
          control={<Switch checked={notificationsEnabled} onChange={handleNotificationsToggle} />}
          label="Email Notifications"
        />
        
        <Typography variant="subtitle1" gutterBottom sx={{ marginTop: "20px" }}>
          Theme Mode
        </Typography>
        <FormControl component="fieldset">
          <RadioGroup
            value={themeMode}
            onChange={handleThemeModeChange}
            row
          >
            <FormControlLabel value="light" control={<Radio />} label="Light" />
            <FormControlLabel value="dark" control={<Radio />} label="Dark" />
            <FormControlLabel value="auto" control={<Radio />} label="Auto (Time-based)" />
          </RadioGroup>
        </FormControl>
      </Box>

      <Divider sx={{ margin: "20px 0" }} />

    {/* People Management Section */}
      <Box
        sx={{
          marginBottom: 5,
          backgroundColor: theme.palette.background.paper,
          borderRadius: "10px",
          border: `1px solid ${theme.palette.divider}`,
          padding: 2.5,
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Typography
          variant="h5"
          sx={{
            marginBottom: 2.5,
            fontWeight: "bold",
            color: theme.palette.text.primary
          }}
        >
          People Management
        </Typography>
          {/* ROW 1 */}
          <Box sx={{ marginBottom: 1.25, display: "flex", justifyContent: "left", gap: 2 }}>
             <Button
              variant="contained"
              onClick={() => navigate("/managestudents")}
              sx={{ backgroundColor: theme.palette.primary.main }}
              >
                  Manage Students
              </Button>

              <Button
                  variant="contained"
                  onClick={() => navigate("/manageTAs")}
                  sx={{ backgroundColor: theme.palette.primary.main }}
              >
                  Manage TAs
              </Button>

              <Button
                  variant="contained"
                  onClick={() => navigate("/manageadmins")}
                  sx={{ backgroundColor: theme.palette.primary.main }}
              >
                  Manage Admins
              </Button>

              <Button
                  variant="contained"
                  onClick={() => navigate("/manageGraders")}
                  sx={{ backgroundColor: theme.palette.primary.main }}
              >
                  Manage Graders
              </Button>
          </Box>
          {/* ROW 2 */}
          <Box sx={{ marginBottom: 1.25, display: "flex", justifyContent: "left", gap: 2 }}>
              <Button
                  variant="contained"
                  onClick={() => navigate("/manageTeams")}
                  sx={{ backgroundColor: theme.palette.primary.main }}
              >
                  Manage Teams
              </Button>
          </Box>
      </Box>

      <Divider sx={{ margin: "20px 0" }} />

      <Box
        sx={{
          marginBottom: 5,
          backgroundColor: theme.palette.background.paper,
          borderRadius: "10px",
          border: `1px solid ${theme.palette.divider}`,
          padding: 2.5,
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Typography
          variant="h5"
          sx={{
            marginBottom: 2.5,
            fontWeight: "bold",
            color: theme.palette.text.primary
          }}
        >
          Data Management
        </Typography>

        <Box sx={{ marginBottom: 1.25, display: "flex", justifyContent: "left", gap: 2 }}>
          <Button
            variant="contained"
            onClick={() => navigate("/bulkupload")}
            sx={{ backgroundColor: theme.palette.primary.main }}
          >
              Data Upload
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          marginBottom: 5,
          backgroundColor: theme.palette.background.paper,
          borderRadius: "10px",
          border: `1px solid ${theme.palette.divider}`,
          padding: 2.5,
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Typography
          variant="h5"
          sx={{
            marginBottom: 2.5,
            fontWeight: "bold",
            color: theme.palette.text.primary
          }}
        >
          System Monitoring
        </Typography>

        <Box sx={{ marginBottom: 1.25, display: "flex", justifyContent: "left", gap: 2 }}>
          <Button
            variant="contained"
            onClick={() => navigate("/email-logs")}
            sx={{ backgroundColor: theme.palette.primary.main }}
          >
            Email Logs
          </Button>
        </Box>
      </Box>

      <Box sx={{ marginBottom: 1.25, display: "flex", justifyContent: "center", gap: 2 }}>
        <Button
          variant="contained"
          onClick={() => navigate("/profile")}
          sx={{ backgroundColor: theme.palette.primary.main }}
        >
          Go To Account Settings
        </Button>

      </Box>
    </Box>
  </Box>
  );
};

export default AdminSettings;
