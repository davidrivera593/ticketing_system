import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import {
  Button,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Box,
  TextField,
  FormControl,
  RadioGroup,
  Radio,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Cookies from "js-cookie";
import React, { useEffect, useState } from "react";
import {useNavigate} from "react-router-dom";
import ConfirmTADelete from "../../components/ConfirmTADelete/ConfirmTADelete";
import { useTheme as useCustomTheme } from "../../contexts/ThemeContext";


const AdminSettings = () => {
  const [teams, setTeams] = useState([]);
  const [tas, setTAs] = useState([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTAName, setNewTAName] = useState("");
  const [newTAEmail, setNewTAEmail] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedTA, setSelectedTA] = useState(null); // To track which TA is being deleted
  const [idNameMap, setIdToNameMap] = useState({});
  const [deleteStatus, setDeleteStatus] = useState(false);
  const [user, setUser] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const token = Cookies.get("token");
  const navigate = useNavigate();
  const theme = useTheme();
  const { isDarkMode, themeMode, setTheme } = useCustomTheme();


  useEffect(() => {
    fetchTeams();
    fetchTAs();
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

  const fetchTeams = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/teams`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch teams.");
      const data = await response.json();
      setTeams(data);
    } catch (error) {
      console.error(error);
    }
  };

  const convertToMap = (list) => {
    return list.reduce((acc, obj) => { //map ID to name
      acc[obj.user_id] = obj.name;
      return acc;
    }, {});
  };

  const fetchTAs = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/users/role/TA`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch TAs.");
      const data = await response.json();
      setTAs(data);

      const idToNameMap = convertToMap(data);
      setIdToNameMap(idToNameMap);
    } catch (error) {
      console.error(error);
    }
  };

  const addTeam = async () => {
    if (!newTeamName.trim())           //validation check to prevent adding blank team name
    {
      alert("Team name cannot be blank.");
      return;
    }
    
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/teams`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ team_name: newTeamName }),
        }
      );

      if (!response.ok) throw new Error("Failed to add team.");
      setNewTeamName("");
      fetchTeams(); // Refresh the list of teams
    } catch (error) {
      console.error(error);
    }
  };

  const encryptPassword = async (password) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/encrypt`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ password }),
        }
      );

      if (!response.ok) throw new Error("Failed to encrypt password.");
      const data = await response.json();
      return data.hashedPassword;

    } catch (error) {
      console.error(error);
    }
  }

  const addTA = async () => {
    if (!newTAName.trim())           //validation check to prevent adding blank TA name
    {
      alert("TA name cannot be blank.");
      return;
    }
    if (!newTAEmail.trim())           //validation check to prevent adding blank TA email
    {
      alert("TA Email name cannot be blank.");
      return;
    }
    
    const defaultPassword = await encryptPassword(`password`); // Encrypt the default password
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/users`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: newTAName,
            email: newTAEmail,
            role: "TA",
            password: defaultPassword, // Default password
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to add TA.");
      setNewTAName("");
      setNewTAEmail("");
      fetchTAs(); // Refresh the list of TAs
    } catch (error) {
      console.error(error);
    }
  };

  const deleteTeam = async (teamId) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/teams/${teamId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to delete team.");
      fetchTeams(); // Refresh the list of teams
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = (ta) => {
    console.log("Delete TA Button Clicked");
    setSelectedTA(ta);
    setDeleteOpen(true);
  };

  const deletePopupClose = () => {
    setDeleteOpen(false);
    setSelectedTA(null); // Clear the selected TA
  };

  const updateStatus = (status) => {
    console.log("This is the update status:", status)
    setDeleteStatus(status);
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

      {/* Teams Section */}
      {/*
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
          Teams Under development
        </Typography>

        <List
          sx={{
            maxHeight: "300px",
            overflowY: "auto",
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: "5px",
            padding: 1.25,
            backgroundColor: isDarkMode ? "#2d2d2d" : theme.palette.background.default,
          }}
        >
          {teams.map((team) => (
            <ListItem key={team.team_id}>
              <ListItemText primary={team.team_name} />
              <ListItemSecondaryAction>
                <Button
                  variant="outlined"
                  onClick={() => deleteTeam(team.team_id)}
                  sx={{ 
                    color: isDarkMode ? "white" : "black", 
                    borderColor: isDarkMode ? "white" : "black" 
                  }}
                >
                  Delete
                </Button>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
        <Box sx={{ marginTop: 2.5, display: "flex", gap: 1.25 }}>
          <TextField
            fullWidth
            value={newTeamName}
            placeholder="New Team Name"
            onChange={(e) => setNewTeamName(e.target.value)}
            variant="outlined"
            size="small"
          />
          <Button 
            variant="contained" 
            onClick={addTeam}
            sx={{ backgroundColor: theme.palette.primary.main }}
          >
            Add Team
          </Button>
        </Box>

      </Box> */}

      {/* Teaching Assistants Section */}
      {/*<Box*/}
      {/*  sx={{*/}
      {/*    marginBottom: 5,*/}
      {/*    backgroundColor: theme.palette.background.paper,*/}
      {/*    borderRadius: "10px",*/}
      {/*    border: `1px solid ${theme.palette.divider}`,*/}
      {/*    padding: 2.5,*/}
      {/*    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",*/}
      {/*  }}*/}
      {/*>*/}
        {/*<Typography */}
        {/*  variant="h5" */}
        {/*  sx={{ */}
        {/*    marginBottom: 2.5, */}
        {/*    fontWeight: "bold",*/}
        {/*    color: theme.palette.text.primary*/}
        {/*  }}*/}
        {/*>*/}
        {/*  Teaching Assistants (TAs)*/}
        {/*</Typography>*/}
    {/*    <TableContainer */}
    {/*      component={Paper} */}
    {/*      sx={{*/}
    {/*        marginTop: 1.25,*/}
    {/*        maxHeight: "300px",*/}
    {/*        overflowY: "auto",*/}
    {/*        backgroundColor: isDarkMode ? "#2d2d2d" : theme.palette.background.default,*/}
    {/*      }}*/}
    {/*    >*/}
    {/*  <Table>*/}
    {/*    <TableHead>*/}
    {/*      <TableRow>*/}
    {/*        <TableCell sx={{ backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary }}>Name</TableCell>*/}
    {/*        <TableCell sx={{ backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary }}>Email</TableCell>*/}
    {/*        <TableCell align="right" sx={{ backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary }}>Action</TableCell>*/}
    {/*      </TableRow>*/}
    {/*    </TableHead>*/}
    {/*    <TableBody>*/}
    {/*      {tas.map((ta) => (*/}
    {/*        <TableRow key={ta.user_id}>*/}
    {/*          <TableCell sx={{ color: theme.palette.text.primary }}>{ta.name}</TableCell>*/}
    {/*          <TableCell sx={{ color: theme.palette.text.primary }}>{ta.email}</TableCell>*/}
    {/*          <TableCell align="right">*/}
    {/*          <Button */}
    {/*              variant="outlined"*/}
    {/*              onClick={() =>  { */}
    {/*                handleDelete(ta);*/}
    {/*                }*/}
    {/*              }*/}
    {/*              sx={{ */}
    {/*                color: isDarkMode ? "white" : "black", */}
    {/*                borderColor: isDarkMode ? "white" : "black" */}
    {/*              }}*/}
    {/*            > */}
    {/*              Delete*/}
    {/*            </Button>*/}
    {/*          </TableCell>*/}
    {/*        </TableRow>*/}
    {/*      ))}*/}
    {/*    </TableBody>*/}
    {/*  </Table>*/}
    {/*</TableContainer>*/}
    {/*{deleteOpen && (*/}
    {/*  <ConfirmTADelete*/}
    {/*    handleOpen={deleteOpen}*/}
    {/*    handleClose={deletePopupClose}*/}
    {/*    ta={selectedTA}*/}
    {/*    idNameMap={idNameMap}*/}
    {/*    updateStatus={updateStatus}*/}
    {/*  />*/}
    {/*)}*/}



        {/* <List className="scrollable-list">
          {tas.map((ta) => (
            <ListItem key={ta.user_id}>
              <ListItemText primary={`${ta.name} (${ta.email})`} />
              <ListItemSecondaryAction>
                <Button 
                  color="secondary" 
                  onClick={() =>  { 
                    handleDelete(ta);
                    }
                  }> 
                  Delete
                </Button>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List> */}
        {/*<Box sx={{ marginTop: 2.5, display: "flex", gap: 1.25 }}>*/}
        {/*  <TextField*/}
        {/*    fullWidth*/}
        {/*    value={newTAName}*/}
        {/*    placeholder="New TA Name"*/}
        {/*    onChange={(e) => setNewTAName(e.target.value)}*/}
        {/*    variant="outlined"*/}
        {/*    size="small"*/}
        {/*  />*/}
        {/*  <TextField*/}
        {/*    fullWidth*/}
        {/*    type="email"*/}
        {/*    value={newTAEmail}*/}
        {/*    placeholder="New TA Email"*/}
        {/*    onChange={(e) => setNewTAEmail(e.target.value)}*/}
        {/*    variant="outlined"*/}
        {/*    size="small"*/}
        {/*  />*/}
        {/*  <Button */}
        {/*    variant="contained" */}
        {/*    onClick={addTA}*/}
        {/*    sx={{ backgroundColor: theme.palette.primary.main }}*/}
        {/*  >*/}
        {/*    Add TA*/}
        {/*  </Button>*/}
        {/*</Box>*/}
      {/*</Box>*/}

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
