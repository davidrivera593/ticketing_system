// ticketing_system/frontend/src/pages/Profile/Profile.js
import React, { useEffect, useState } from 'react';
import { TextField, Button, Typography, Box } from '@mui/material';
import { useTheme } from "@mui/material/styles";
import Cookies from "js-cookie";
import Avatar from '@mui/material/Avatar';
import { validatePassword, passwordRequirementsText } from "../../utils/passwordValidator";
const baseURL = process.env.REACT_APP_API_BASE_URL;

function Profile() {
  const theme = useTheme();
  const [user, setUser] = useState(null);  
  const [error, setError] = useState(null);
  const [isEditing,setIsEditing] = useState(false);
  const [editData,setEditData] = useState({name: '',email: ''});
  const [showPass, setShowPass] = React.useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
  });

  const token = Cookies.get("token"); 


  useEffect(() => {
    fetch(`${baseURL}/api/users/profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setUser(data);
      })
      .catch((err) => {
        console.error('Error fetching user profile:', err);
        setError(err.message);
      });
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!user) {
    return <div>Loading profile...</div>;
  }

  const handleEditClick = () => {
    setEditData({name:user.name,email: user.email});
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setShowChangePassword(false);
    setPasswordData({ currentPassword: '', newPassword: '' });
  };

  const handleInputChange = (e) => {
    const {name, value} = e.target;
    setEditData(prev => ({...prev,[name]: value}));
  };

  const handleSaveClick = async() => {
    try{
      const response = await fetch(`${baseURL}/api/users/${user.user_id}`, {
        method: "PUT",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editData),
      });      
      if(!response.ok)
      {
        alert(`ERROR failed to update profile. Status ${response.status}`);
        //throw new Error(`failed to update profile. Status ${response.status}`);
      } else {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setIsEditing(false);

      }
    } catch(err){
      console.error("Error updating profile: ",err);
      setError(err.message);
    }
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdatePassword = async () => {
    const { currentPassword, newPassword } = passwordData;
    if (!currentPassword || !newPassword) {
      alert("Please fill in both fields.");
      return;
    }

    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.valid) {
      alert(passwordCheck.errors.join(" ") || passwordRequirementsText);
      return;
    }
    try {
      const response = await fetch(`${baseURL}/api/users/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData?.error === "Password policy violation" && Array.isArray(errorData?.details)) {
          throw new Error(errorData.details.join(" "));
        }
        throw new Error(errorData.error || `Failed to change password. Status ${response.status}`);
      }
  
      alert("Password updated successfully.");
      setPasswordData({ currentPassword: '', newPassword: '' });
      setShowChangePassword(false);
    } catch (err) {
      console.error("Error updating password:", err);
      alert(err.message);    }

  };
  

  const handleChangePasswordClick = () => {
    setShowChangePassword((prev) => !prev);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 60px)",
        backgroundColor: theme.palette.background.default,
        padding: 2,
      }}
    >
      <Box
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderRadius: 2,
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          padding: 4,
          maxWidth: 400,
          width: "100%",
          textAlign: "center",
        }}
      >
        <Typography 
          variant="h5" 
          sx={{ 
            marginBottom: 2,
            color: theme.palette.text.primary
          }}
        >
          My Profile
        </Typography>
        <Avatar 
          sx={{
            width: 100,
            height: 100,
            margin: "20px auto",
            backgroundColor: theme.palette.primary.main,
          }}
          src={user.profilePicture || ''}
        >
          {user.name ? user.name.charAt(0).toUpperCase() : ''}
        </Avatar>
        {!isEditing ? (
          <>
            <Box sx={{ marginBottom: 2.5 }}>
              <Typography 
                sx={{ 
                  fontSize: 16, 
                  margin: "6px 0",
                  color: theme.palette.text.primary
                }}
              >
                <strong>Name:</strong> {user.name}
              </Typography>
              <Typography 
                sx={{ 
                  fontSize: 16, 
                  margin: "6px 0",
                  color: theme.palette.text.primary
                }}
              >
                <strong>Email:</strong> {user.email}
              </Typography>
              <Typography 
                sx={{ 
                  fontSize: 16, 
                  margin: "6px 0",
                  color: theme.palette.text.primary
                }}
              >
                <strong>Role:</strong> {user.role}
              </Typography>
            </Box>
            <Box sx={{ marginBottom: 1.25, display: "flex", justifyContent: "center" }}>
              <Button 
                variant="contained" 
                onClick={handleEditClick}
                sx={{ backgroundColor: theme.palette.primary.main }}
              >
                Edit Info
              </Button>
            </Box>
          </>
        ) : (
          <>
            <Box sx={{ marginTop: 2.5, textAlign: "left" }}>
              <TextField
                label="Name"
                name="name"
                value={editData.name}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Email"
                name="email"
                value={editData.email}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              />
            </Box>
            <Box sx={{ marginTop: 2.5, textAlign: "center" }}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSaveClick}
                sx={{ backgroundColor: theme.palette.primary.main }}
              >
                Save
              </Button>
              <Button variant="outlined" onClick={handleCancelClick} sx={{ marginLeft: 2 }}>
                Cancel
              </Button>
              <Button variant="outlined" onClick={handleChangePasswordClick} sx={{ ml: 1, mt: 2 }}>
                {showChangePassword ? "Hide Change Password" : "Change Password"}
              </Button>
            </Box>
            {showChangePassword && (
              <Box sx={{ marginTop: 2.5, textAlign: "left" }}>
                <TextField
                  label="Current Password"
                  name="currentPassword"
                  type={showPass ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={handlePasswordInputChange}
                  fullWidth
                  margin="normal"
                />
                <TextField
                  label="New Password"
                  name="newPassword"
                  type={showPass ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={handlePasswordInputChange}
                  fullWidth
                  margin="normal"
                />
                <Box sx={{ marginTop: 1.25, marginBottom: 1.75 }}>
                  <input 
                      type="checkbox"
                      id="showPassCheckBox"
                      onChange={e => setShowPass(e.target.checked)}
                      checked={showPass}
                      style={{ marginRight: '0px'}}
                  />
                  <label style={{ marginLeft: "0.5rem" }}>Show Password</label>
                </Box>              
                <Box sx={{ marginTop: 1.25 }}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleUpdatePassword}
                    sx={{ backgroundColor: theme.palette.primary.main }}
                  >
                    Update Password
                  </Button>
                </Box>
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}

export default Profile;