import Cookies from "js-cookie";
import React, { useEffect, useState } from "react";
import "./GroupShareTicketSideBar.css";

//In order to have the buttons have a ripple effect, this page has to be rebuilt with mui
//mui by default does the ripple effect
//Copied, need to edit as needed - ethan
import { Box, Button, Typography, TextField, FormControl, InputLabel, Select, MenuItem, Checkbox } from '@mui/material';
import { useTheme } from "@mui/material/styles";

const baseURL = process.env.REACT_APP_API_BASE_URL;

const GroupShareTicketSideBar = ({ onClose }) => {
    const theme = useTheme();

  //General info
  const [studentName, setStudentName] = useState("");
  const [taList, setTaList] = useState([]); // Initialize as empty array
  const [teamList, setTeamList] = useState([]); // Initialize as empty array for teams
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = Cookies.get("token");
  
  //From copying over
  const [sponsorName, setSponsorName] = useState("");
  const [section, setSection] = useState("");
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  // const [asuId, setAsuId] = useState(""); 
  const [singleMenu, setSingleMenu] = useState(false);


  //Selection fields
  const [teamName, setTeamName] = useState("");
  const [fromInstructorName, setFromInstructorName] = useState("");
  const [toInstructorName, setToInstructorName] = useState("");
  const [currentTicketID, setCurrentTicketID] = useState("");
  

  useEffect(() => {
    fetchTAs();
    fetchTeams();
    fetchTickets();
  }, []);

  // Fetch TA users from the API
  const fetchTAs = async () => {
    try {
      // const token = Cookies.get("token");
      const response = await fetch(`${baseURL}/api/users/role/TA`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setTaList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch TAs:", error);
      setTaList([]); // Fallback to empty array
    }
  };

  // Fetch Teams from the API
  const fetchTeams = async () => {
    try {
      // const token = Cookies.get("token");
      const response = await fetch(`${baseURL}/api/teams`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setTeamList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch teams:", error);
      setTeamList([]); // Fallback to empty array
    }
  };

  const fetchTickets = async () => {
        try {          
            setLoading(true);
            
            // const token = Cookies.get("token");
            
            // const studentParams = new URLSearchParams({
            //     page: '1',
            //     limit: '1000'  // Get all tickets (or a very large number)
            // });
            
            // const taParams = new URLSearchParams({
            //     page: '1', 
            //     limit: '1000'  // Get all tickets (or a very large number)
            // });
            

            
            // // if (hideResolved) {
            // //     studentParams.append('hideResolved', 'true');
            // //     taParams.append('hideResolved', 'true');
            // // }

            // // Get paginated student tickets
            // const studentTicketsResponse = await fetch(`${baseURL}/api/tickets?${studentParams}`, {
            //     method: "GET",
            //     headers: {
            //         "Content-Type": "application/json",
            //         Authorization: `Bearer ${token}`,
            //     },
            // });

            // alert("Looking for studentTicketsResponse " + studentTicketsResponse.length);        

            // // Get paginated TA tickets
            // const taTicketsResponse = await fetch(`${baseURL}/api/tatickets?${taParams}`, {
            //     method: "GET",
            //     headers: {
            //         "Content-Type": "application/json",
            //         Authorization: `Bearer ${token}`,
            //     },
            // });

            // if (!studentTicketsResponse.ok || !taTicketsResponse.ok) {
            //     throw new Error("Failed to fetch tickets");
            // }

            // const studentTicketsData = await studentTicketsResponse.json();
            // const taTicketsDataRaw = await taTicketsResponse.json();
            
            // const studentTicketsRaw = studentTicketsData.tickets || studentTicketsData;
            // const taTicketsRaw = taTicketsDataRaw.tickets || taTicketsDataRaw;

            // // Add source property to differentiate ticket types
            // const sourcedStudentTickets = studentTicketsRaw.map(ticket => ({ ...ticket, source: 'regular' }));
            // const sourcedTaTickets = taTicketsRaw.map(ticket => ({ ...ticket, source: 'ta' }));

            // // Add user and team names to student tickets
            // const studentTicketsWithNames = await Promise.all(
            //     sourcedStudentTickets.map(async (ticket) => {
            //         const userName = await fetchUserNameForTicket(ticket);
            //         const teamName = await fetchTeamNameFromId(ticket.team_id);
            //         return { ...ticket, userName, teamName };
            //     })
            // );

            // // Add user and team names to TA tickets
            // const taTicketsWithNames = await Promise.all(
            //     sourcedTaTickets.map(async (ticket) => {
            //         const userName = await fetchUserNameForTicket(ticket);
            //         const teamName = await fetchTeamNameFromId(ticket.team_id);
            //         return { ...ticket, userName, teamName };
            //     })
            // );

            // // Set separate ticket arrays
            // // setStudentTickets(studentTicketsWithNames);
            // // setTaTickets(taTicketsWithNames);
            
            // // Combine for filtering and counts calculation
            // const allTicketsData = [...studentTicketsWithNames, ...taTicketsWithNames];
            const allTicketsData = await fetch(`${baseURL}/api/tickets/`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                }
              }
            );
            setTickets(allTicketsData);
            alert("Looking for allTicketsData " + allTicketsData.length);
            alert("Looking for allTicketsData status " + allTicketsData.status); 
            alert("Looking for tickets " + tickets.length);        
            
            // setStudentPagination(studentTicketsData.pagination || {
            //     totalItems: studentTicketsRaw.length,
            //     totalPages: 1,
            //     hasNextPage: false,
            //     hasPreviousPage: false
            // });

            // setTaPagination(taTicketsDataRaw.pagination || {
            //     totalItems: taTicketsRaw.length,
            //     totalPages: 1,
            //     hasNextPage: false,
            //     hasPreviousPage: false
            // });

            let totalTickets, openTickets, closedTickets, escalatedTickets;              
            
            
            setTotalTickets(totalTickets);
            setEscalatedTickets(escalatedTickets);
            setOpenTickets(openTickets);
            setClosedTickets(closedTickets);
            
        } catch (error) {
            console.error("Error fetching tickets:", error);
            // setStudentTickets([]);
            // setTaTickets([]);
            setTickets([]);
            // setStudentPagination({
            //     totalItems: 0,
            //     totalPages: 0,
            //     hasNextPage: false,
            //     hasPreviousPage: false
            // });
            // setTaPagination({
            //     totalItems: 0,
            //     totalPages: 0,
            //     hasNextPage: false,
            //     hasPreviousPage: false
            // });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (event) => {
          //Adds shared TA to ticketassignments
          try{
              const shareResponse = await fetch(
                  `${baseURL}/api/ticketassignments/ticket/${currentTicketID}`,
                  {
                      method: "POST",
                      headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                          ticket_id : currentTicketID,
                          user_id: toInstructorName
                      }),
                  }
              );
          
              if (!shareResponse.ok) {
                  alert("Failed to updated TA assignment");
                  console.error(`Failed to updated TA assignment. Status: ${shareResponse.status}`);
                  console.error(`${shareResponse.reason}`);
              }
              updateTA(selectedTA); //share to new TA, so it will be displayed on main page 

          } catch(error) {
              alert("ERROR");
              console.log("Error: ", error);
              setError(true);
          }
    }

  const handleSubmit = async (event) => {
    event.preventDefault();

    //prolly won't need
    const submittedData = {
      studentName,
      teamName,
      sponsorName,
      section,
      toInstructorName,
      issueType,
      description,
      // asuId,
    };

    try {
      // const token = Cookies.get("token");
      const id = Cookies.get("user_id");

      //Get all tickets from selected filters
      //Branch between single ticket and group tickets
      alert("Looking for tickets1.");
      if(fromInstructorName == "" && teamName == ""){
        alert("You have not selected anyfields to share the ticket.");
      }else {
        alert("Looking for " + tickets.length);        
        for (let ticketVar of tickets){
          alert("Looping.");  
          if (ticketVar.instructorName == fromInstructorName){
            if(ticketVar.teamName == teamName){
              //Both fields filled out
              alert("Ticket found1.");
              setCurrentTicketID(ticketVar.ticket_id);
              handleUpdate();
            }else{
              //Only instructor/TA filled out
              alert("Ticket found2.");
              setCurrentTicketID(ticketVar.ticket_id);
              handleUpdate();
            }
          }else if(ticketVar.teamName == teamName){
            //Only team name filled out
              alert("Ticket found3.");
              setCurrentTicketID(ticketVar.ticket_id);
              handleUpdate();
          }else{
            alert("Ticket not found1.");
          }
          //set back to blank; reset for next one
          setCurrentTicketID("");
        }
      }

      // // Step 2: Create the ticket
      // const ticketResponse = await fetch(`${baseURL}/api/tickets`, {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //     Authorization: `Bearer ${token}`,
      //   },
      //   body: JSON.stringify({
      //     team_id: teamName, // Use the team ID selected from the dropdown
      //     student_id: id,
      //     sponsor_name: submittedData.sponsorName,
      //     section: submittedData.section,
      //     issue_type: submittedData.issueType,
      //     issue_description: submittedData.description,
      //     // asu_id: submittedData.asuId,

      //   }),
      // });

      // if (!ticketResponse.ok) {
      //   throw new Error("Failed to create ticket.");
      // }

      // const ticket = await ticketResponse.json();

      // // Step 3: Assign the TA to the ticket
      // const assignResponse = await fetch(
      //   `${baseURL}/api/ticketassignments/ticket/${ticket.ticket_id}`,
      //   {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //       Authorization: `Bearer ${token}`,
      //     },
      //     body: JSON.stringify({
      //       user_id: submittedData.instructorName, // TA ID
      //     }),
      //   }
      // );

      // if (!assignResponse.ok) {
      //   throw new Error("Failed to assign ticket to TA.");
      // }

      // const a = await assignResponse.json();
      // alert("Ticket submitted successfully!");
      // console.log("Ticket created:", ticket);
      // console.log("Assignment", a);

      // Reset the form
      setStudentName("");
      setTeamName("");
      setSponsorName("");
      setSection("");
      setFromInstructorName("");
      setToInstructorName("");
      setIssueType("");
      setDescription("");
      setCurrentTicketID("");
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
              Share Tickets
          </Typography>
          
            
              <label>
                <input type="checkbox"
                  checked={singleMenu}
                  onChange={(e) => setSingleMenu(e.target.checked)}
                />
                Share Single Ticket
              </label>
          
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <label>
                From
              </label>
              { singleMenu === true && (
                <TextField
                    label="Student Name"
                    variant="outlined"
                    placeholder="Enter your name"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    required
                    fullWidth
                />
              )}
          {/* <label>ASU ID:</label>
          <input
            type="text"
            placeholder="10-digit ASU ID"
            value={asuId}
            onChange={(e) => setAsuId(e.target.value)}
            required
            maxLength={10}
          /> */}
              { singleMenu === true && (
                <TextField
                  label="Section"
                  variant="outlined"
                  placeholder="Enter your section"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  required
                  fullWidth
              />)}
              <FormControl fullWidth required>
                  <InputLabel>Team</InputLabel>
                  <Select
                      value={teamName}
                      label="Team"
                      placeholder="Select a team"
                      onChange={(e) => setTeamName(e.target.value)}
                  >
                      <MenuItem
                        value=""
                        onClick={(event) => {
                          event.stopPropagation(); // keeps menu open
                          setTeamName("");         // resets selection
                        }}
                      >
                        Select a team                         
                      </MenuItem>

                      {teamList.map((team) => (
                          <MenuItem key={team.team_id} value={team.team_id}>    
                              {team.team_name}
                          </MenuItem>
                      ))}
                  </Select>
              </FormControl>
              {/* <TextField
                  label="Sponsor Name"
                  variant="outlined"
                  placeholder="Enter your Sponsor's name"
                  value={sponsorName}
                  onChange={(e) => setSponsorName(e.target.value)}
                  required
                  fullWidth
              /> */}
              {/* <label>
                <input type="checkbox"
                checked={singleMenu}
                onChange={(e) => setSingleMenu(e.target.checked)}
                />
                Active TA
              </label> */}
              <FormControl fullWidth required>
                  <InputLabel>Instructor (TA)</InputLabel>
                  <Select
                      value={fromInstructorName}
                      label="Instructor (TA)"
                      placeholder="Select an instructor (TA)"
                      onChange={(e) => setFromInstructorName(e.target.value)}
                  >
                      <MenuItem
                        value=""
                        onClick={(event) => {
                          event.stopPropagation(); // keeps menu open
                          setFromInstructorName("");         // resets selection
                        }}
                      >
                        Select an instructor (TA)                     
                      </MenuItem>


                      {taList.map((ta) => (
                          <MenuItem key={ta.user_id} value={ta.user_id}>
                              {ta.name}
                          </MenuItem>
                      ))}
                  </Select>
              </FormControl>
              <label>
                To
              </label>
              <FormControl fullWidth required>
                  <InputLabel>Instructor (TA)</InputLabel>
                  <Select
                      value={toInstructorName}
                      label="Instructor (TA)"
                      placeholder="Select an instructor (TA)"
                      onChange={(e) => setToInstructorName(e.target.value)}
                  >
                      <MenuItem
                        value=""
                        onClick={(event) => {
                          event.stopPropagation(); // keeps menu open
                          setToInstructorName("");         // resets selection
                        }}
                      >
                        Select an instructor (TA)                     
                      </MenuItem>

                      {taList.map((ta) => (
                          <MenuItem key={ta.user_id} value={ta.user_id}>
                              {ta.name}
                          </MenuItem>
                      ))}
                  </Select>
              </FormControl>
          <Button type="submit">Share Ticket</Button>
        </Box>
      </Box>
    </Box>
  );
};

export default GroupShareTicketSideBar;
