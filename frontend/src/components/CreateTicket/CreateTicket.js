import Cookies from "js-cookie";
import React, { useEffect, useState } from "react";
import "./CreateTicket.css";

//In order to have the buttons have a ripple effect, this page has to be rebuilt with mui
//mui by default does the ripple effect
import { Box, Button, Typography, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useTheme } from "@mui/material/styles";

const baseURL = process.env.REACT_APP_API_BASE_URL;

const CreateTicket = ({ onClose }) => {
  const theme = useTheme();
  const [studentName, setStudentName] = useState(Cookies.get("name") || "N/A");
  const user_id = Cookies.get("user_id") || "";
  const [teamName, setTeamName] = useState("");
  const [team_id, setTeamID] = useState("");
  const [sponsorName, setSponsorName] = useState("");
  const [section, setSection] = useState("");
  const [instructorName, setInstructorName] = useState("");
  const [instructor_user_id, setInstructorID] = useState(null);
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetchStudentData(user_id);
  }, []);

  const fetchStudentData = async (user_id) => {
    try {
      const token = Cookies.get("token");
      const response = await fetch(`${baseURL}/api/studentdata/studentdata-with-team/${user_id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      console.log("Fetched student data with team:", data);

      setSection(data.section || "");
      setTeamName(data.team_name || "");
      setTeamID(data.team_id || "");
      setSponsorName(data.sponsor_name || "");  
      setInstructorName(data.instructor_name || "");
      setInstructorID(data.instructor_user_id || null);
      
    } catch (error) {
      console.error("Failed to fetch student data:", error);
      setStudentName("N/A");
    }
  };


  const handleSubmit = async (event) => {
    event.preventDefault();

    const submittedData = {
      studentName,
      teamName,
      sponsorName,
      section,
      instructorName,
      issueType,
      description,
      // asuId,
    };

    console.log("Submitted Data:", submittedData);

    try {
      const token = Cookies.get("token");
      const id = Cookies.get("user_id");

      // Step 2: Create the ticket
      const ticketResponse = await fetch(`${baseURL}/api/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          team_id: team_id, // Use the team ID selected from the dropdown
          student_id: id,
          sponsor_name: submittedData.sponsorName,
          section: submittedData.section,
          issue_type: submittedData.issueType,
          issue_description: submittedData.description,
          // asu_id: submittedData.asuId,

        }),
      });

      if (!ticketResponse.ok) {
        throw new Error("Failed to create ticket.");
      }

      const ticket = await ticketResponse.json();

      // Step 3: Assign the TA to the ticket
      const assignResponse = await fetch(
        `${baseURL}/api/ticketassignments/ticket/${ticket.ticket_id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            user_id: instructor_user_id, // TA ID
          }),
        }
      );

      if (!assignResponse.ok) {
        throw new Error("Failed to assign ticket to TA.");
      }

      const a = await assignResponse.json();
      alert("Ticket submitted successfully!");
      console.log("Ticket created:", ticket);
      console.log("Assignment", a);

      // Reset the form
      setStudentName("");
      setTeamName("");
      setSponsorName("");
      setSection("");
      setInstructorName("");
      setIssueType("");
      setDescription("");
      // setAsuId("");

      if (onClose) onClose(); // Close modal if `onClose` is provided
      window.location.reload();
    } catch (error) {
      console.error("Error creating ticket:", error);
      alert(error.message || "An error occurred while submitting the ticket.");
    }
  };

  //Robert: All buttons below have been updated with '<Button/>' in order to have a ripple effect when the button is clicked
  return (
    <Box className="modal-overlay"
         sx={{
             position: 'fixed',
             top: 0,
             left: 0,
             width: '100vw',
             height: '100vh',
             bgcolor: 'rgba(0, 0, 0, 0.5)',
             display: 'flex',
             justifyContent: 'center',
             alignItems: 'center',
             zIndex: 1000,
             pl: '250px',
             pt: '50px',
         }}
    >
      <Box className="modal-content"
           sx={{
               bgcolor: theme.palette.background.paper,
               p: 3,
               borderRadius: 2.5,
               width: '90%',
               maxWidth: 600,
               position: 'relative',
               boxShadow: 3,
               mt: -6.25,
           }}
      >
        {/* Close button */}
        <Button 
          className="close-button" 
          onClick={onClose}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            minWidth: "32px",
            minHeight: "32px",
            borderRadius: "50%",
            backgroundColor: "#8C1D40",
            color: "white",
            "&:hover": {
              backgroundColor: "#5F0E24",
            },
          }}
        >
          &times;
        </Button>

        {/* Form Content */}
          <Typography variant="h4" sx={{ 
              mb: 2, 
              fontWeight: 'bold', 
              textAlign: 'center',
              color: theme.palette.text.primary
          }}>
              Create New Ticket
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* <TextField
                  label="Student Name"
                  variant="outlined"
                  placeholder="Enter your name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  required
                  fullWidth
              /> */}
              <TextField
                  label="Your Name"
                  variant="outlined"
                  value={studentName}
                  required
                  fullWidth
                  disabled
              />

          {/* <label>ASU ID:</label>
          <input
            type="text"
            placeholder="10-digit ASU ID"
            value={asuId}
            onChange={(e) => setAsuId(e.target.value)}
            required
            maxLength={10}
          /> */}
              {/* <TextField
                  label="Section"
                  variant="outlined"
                  placeholder="Enter your section"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  required
                  fullWidth
              />
              */}
              <TextField
                  label="Your Section"
                  variant="outlined"
                  placeholder="N/A"
                  value={section}
                  required
                  fullWidth
                  disabled
              />
              {/* <FormControl fullWidth required>
                  <InputLabel>Team</InputLabel>
                  <Select
                      value={teamName}
                      label="Team"
                      placeholder="Select a team"
                      onChange={(e) => setTeamName(e.target.value)}
                  >
                      {teamList.map((team) => (
                          <MenuItem key={team.team_id} value={team.team_id}>
                              {team.team_name}
                          </MenuItem>
                      ))}
                  </Select>
              </FormControl> */}
               <TextField
                  label="Your Team"
                  variant="outlined"
                  placeholder="N/A"
                  value={teamName}
                  required
                  fullWidth
                  disabled
              />
              {/* <TextField
                  label="Sponsor Name"
                  variant="outlined"
                  placeholder="Enter your Sponsor's name"
                  value={sponsorName}
                  onChange={(e) => setSponsorName(e.target.value)}
                  required
                  fullWidth
              /> */}
               <TextField
                  label="Sponsor Name"
                  variant="outlined"
                  placeholder="N/A"
                  value={sponsorName}
                  required
                  fullWidth
                  disabled
              />
              {/* <FormControl fullWidth required>
                  <InputLabel>Instructor (TA)</InputLabel>
                  <Select
                      value={instructorName}
                      label="Instructor (TA)"
                      placeholder="Select a instructor (TA)"
                      onChange={(e) => setInstructorName(e.target.value)}
                  >
                      {taList.map((ta) => (
                          <MenuItem key={ta.user_id} value={ta.user_id}>
                              {ta.name}
                          </MenuItem>
                      ))}
                  </Select>
              </FormControl>
              */}
              <TextField
                  label="Instructor (TA)"
                  variant="outlined"
                  placeholder="N/A"
                  value={instructorName}
                  required
                  fullWidth
                  disabled
              />

              <FormControl fullWidth required>
                  <InputLabel>Issue Type</InputLabel>
                  <Select
                      value={issueType}
                      label="Issue Type"
                      placeholder="Select a issue type"
                      onChange={(e) => setIssueType(e.target.value)}
                  >
                      <MenuItem value="sponsorIssue">Issues with Sponsor</MenuItem>
                      <MenuItem value="teamIssue">Issues within the Team</MenuItem>
                      <MenuItem value="assignmentIssue">Issues with Assignments</MenuItem>
                      <MenuItem value="Bug">Bug</MenuItem>
                      <MenuItem value="Feature Request">Feature Request</MenuItem>
                      <MenuItem value="Question">Question</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                  </Select>
              </FormControl>
              <TextField
                  label="Description"
                  variant="outlined"
                  placeholder="Describe your issue"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  fullWidth
                  multiline
                  rows={6}
              />
          <Button type="submit">Submit Ticket</Button>
        </Box>
      </Box>
    </Box>
  );
};

export default CreateTicket;
