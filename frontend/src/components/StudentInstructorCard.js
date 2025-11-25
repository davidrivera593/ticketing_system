import { Avatar, Button, Typography, Box, Chip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import PersonIcon from "@mui/icons-material/Person";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";



const baseURL = process.env.REACT_APP_API_BASE_URL;

function stringAvatar(name) {
  if (!name || typeof name !== "string") {
    return {
      sx: { bgcolor: "#000" },
      children: "?"
    };
  }
  const nameParts = name.split(" ");
  const initials = nameParts[0]
    ? (nameParts[1] ? `${nameParts[0][0]}${nameParts[1][0]}` : nameParts[0][0])
    : "?";
  return {
    sx: { bgcolor: stringToColor(name) },
    children: initials.toUpperCase(),
  };
}

function stringToColor(string) {
  let hash = 0;
  let i;

  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = "#";
  for (i = 0; i < 3; i += 1) {
    let value = (hash >> (i * 8)) & 0xff;
    if (value > 200) value -= 55;
    if (value < 55) value += 55;
    if (i === 0 && value > 180) value -= 40;
    if (i === 1 && value > 180) value -= 40;
    if (i === 2 && value > 180) value -= 40;
    color += `00${value.toString(16)}`.slice(-2);
  }
  return color;
}

const defaultProps = {
  name: "Unknown Name",
  userId: "1",
};

const StudentInstructorCard = ({
  name = defaultProps.name,
  userId = defaultProps.userId,
}) => {
  const theme = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [officeHours, setOfficeHours] = useState({
    monday: {start: '', end: ''},
    tuesday: {start: '', end: ''},
    wednesday: {start: '', end: ''},
    thursday: {start: '', end: ''},
    friday: {start: '', end: ''},
    saturday: {start: '', end: ''},
    sunday: {start: '', end: ''}
  });
  const [isAvailable, setIsAvailable] = useState(false);

  let navigate = useNavigate();

  useEffect(() => {
    fetchUserDetails();
    fetchOfficeHours();
  }, [userId]);

  const fetchOfficeHours = async () => {
    try {
      const token = Cookies.get("token");
      const response = await fetch(`${baseURL}/api/officehours/users/${userId}`,{
        headers: {
        'Authorization': `Bearer ${token}`,
      },
      });
      
      const data = await response.json();
      
      if (response.ok && data.office_hours) {
        setOfficeHours(data.office_hours);
        checkAvailability(data.office_hours);
      }
      
    } catch (err) {
      console.error("error fetching office hours:", err);
    }
  };

  const checkAvailability = (hours) => {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes
    
    const todayHours = hours[currentDay];
    if (todayHours && todayHours.start && todayHours.end) {
      const [startHour, startMin] = todayHours.start.split(':').map(Number);
      const [endHour, endMin] = todayHours.end.split(':').map(Number);
      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;
      
      if (currentTime >= startTime && currentTime <= endTime) {
        setIsAvailable(true);
      }
    }
  };

  // Add this helper function after checkAvailability()
const getAvailabilityStatus = () => {
  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = dayNames[now.getDay()];
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const todayHours = officeHours[currentDay];
  if (todayHours && todayHours.start && todayHours.end) {
    const [startHour, startMin] = todayHours.start.split(':').map(Number);
    const [endHour, endMin] = todayHours.end.split(':').map(Number);
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    if (currentTime >= startTime && currentTime <= endTime) {
      return { status: 'available', label: 'Available Now', color: 'success' };
    }
  }
  
  if (todayHours && todayHours.start && todayHours.end) {
    const [startHour, startMin] = todayHours.start.split(':').map(Number);
    const startTime = startHour * 60 + startMin;
    if (currentTime < startTime) {
      return { 
        status: 'later', 
        label: `Available at ${handleDisplayTime(todayHours.start)}`, 
        color: 'warning' 
      };
    }
  }
  
  return { status: 'offline', label: 'Not Available', color: 'default' };
};

  function handleDisplayTime(time) {
    if (time) {
      let hrs = parseInt(time.split(':')[0]), mins = time.split(':')[1];
      if (hrs > 12) {
        return (hrs - 12) + ':' + mins + ' PM';
      } else if (hrs === 12) {
        return '12:' + mins + ' PM';
      } else if (hrs === 0) {
        return '12:' + mins + ' AM';
      } else {
        return hrs + ':' + mins + ' AM';
      }
    }
    return '';
  }

  function getAllOfficeHours() {
    const dayAbbreviations = {
      monday: 'Mon',
      tuesday: 'Tue', 
      wednesday: 'Wed',
      thursday: 'Thu',
      friday: 'Fri',
      saturday: 'Sat',
      sunday: 'Sun'
    };

    const daysInOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    const activeHours = [];
    daysInOrder.forEach(day => {
      const hours = officeHours[day];
      if (hours && hours.start && hours.end && hours.start !== '' && hours.end !== '') {
        activeHours.push({
          day: dayAbbreviations[day],
          start: handleDisplayTime(hours.start),
          end: handleDisplayTime(hours.end)
        });
      }
    });

    return activeHours;
  }

  const onViewProfile = () => {
    navigate(`/instructorprofile?user=${userId}`)
  }

  const fetchUserDetails = async () => {
    try {
      const token = Cookies.get("token");
      const response = await fetch(`${baseURL}/api/users/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch TA details");
      }

      const taData = await response.json();
      setUser(taData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching TA details:", error);
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: theme.palette.background.paper,
        padding: 2.5,
        borderRadius: 1,
        flex: 1,
        gap: 1.25,
        width: "100%",
        height: "280px",
        overflow: "hidden",
        boxSizing: "border-box",
        border: 1,
        borderColor: theme.palette.divider,
        position: "relative",
      }}
    >
      {/* HEADER */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          position: "relative"
        }}
      >
        <Avatar {...stringAvatar(name)} sx={{ width: 56, height: 56 }} />
        
        {/* Status Indicator */}
        <Box
          sx={{
            position: "absolute",
            top: -19.5,
            right: -18,
            zIndex: 2
          }}
        >
          <Chip
            icon={<FiberManualRecordIcon sx={{ fontSize: "0.7rem !important" }} />}
            label={getAvailabilityStatus().label}
            color={getAvailabilityStatus().color}
            size="small"
            sx={{
              fontSize: "0.7rem",
              height: "20px",
              "& .MuiChip-label": {
                padding: "0 6px"
              }
            }}
          />
        </Box>
        
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <Typography
            variant="h6"
            sx={{
              fontSize: "1.1rem",
              color: theme.palette.text.primary,
              fontWeight: "bold",
              textAlign: "right",
            }}
          >
            {name}
          </Typography>
          <Typography
            variant="body2"
            sx={{ 
              fontSize: "0.8rem", 
              color: theme.palette.text.secondary, 
              textAlign: "right",
              display: "flex",
              alignItems: "center",
              gap: 0.5
            }}
          >
            <PersonIcon sx={{ fontSize: "0.9rem" }} />
            Teaching Assistant
          </Typography>
        </Box>
      </Box>

      {/* OFFICE HOURS SECTION */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          backgroundColor: theme.palette.background.default,
          padding: 1.5,
          borderRadius: 1,
          flex: 1,
          minHeight: 0, 
          overflow: "hidden", 
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            color: theme.palette.text.primary,
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: 0.5,
          }}
        >
          <AccessTimeIcon sx={{ fontSize: "1rem" }} />
          Office Hours
        </Typography>
        
        {getAllOfficeHours().length > 0 ? (
          <Box sx={{ 
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
            flex: 1,
            minHeight: 0,
            overflowY: "auto"
          }}>
            {getAllOfficeHours().map((hours, index) => (
              <Typography
                key={index}
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: "0.85rem",
                  lineHeight: 1.3,
                }}
              >
                {hours.day}: {hours.start} - {hours.end}
              </Typography>
            ))}
          </Box>
        ) : (
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.disabled,
              fontSize: "0.85rem",
              fontStyle: "italic",
            }}
          >
            No office hours scheduled
          </Typography>
        )}
      </Box>

      {/* CONTACT BUTTON */}
      <Button
        variant="contained"
        disableElevation
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: "white",
          borderRadius: "8px",
          fontSize: "0.85rem",
          fontWeight: "bold",
          textTransform: "none",
          padding: "8px 16px",
          flexShrink: 0, 
          marginTop: "auto", 
        }} 
        onClick={onViewProfile}
      >
        View Contact Info
      </Button>
    </Box>
  );
};

export default StudentInstructorCard;