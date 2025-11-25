import { Button, CircularProgress, TextField, Typography, Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Cookies from "js-cookie";
import React, { useEffect, useState } from "react";
import InstructorCard from "../../components/InstructorCard";
import StudentInstructorCard from "../../components/StudentInstructorCard";
import { jwtDecode } from "jwt-decode";
const baseURL = process.env.REACT_APP_API_BASE_URL;

const AllAssignees = () => {
  const theme = useTheme();
  const [tas, setTAs] = useState([]);
  const [filteredTAs, setFilteredTAs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [taCounts, setTACounts] = useState({});
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Get user role from token
    const token = Cookies.get("token");
    if (token) {
      const decodedToken = jwtDecode(token);
      setUserRole(decodedToken.role);
    }
    fetchTAs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tas, search]);

  const fetchTAs = async () => {
    try {
      const token = Cookies.get("token");
      const decodedToken = jwtDecode(token);

      const response = await fetch(`${baseURL}/api/users/role/TA`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch TAs");
      }

      let tasData = await response.json();
      
      // All roles see all TAs - no filtering needed
      setTAs(tasData);
      setFilteredTAs(tasData);
      await fetchTACounts(tasData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching TAs:", error);
      setLoading(false);
    }
  };

  const fetchTACounts = async (tasData) => {
    try {
      const token = Cookies.get("token");
      const decodedToken = jwtDecode(token);
      const currentUserRole = decodedToken.role;

      // Use role-based ticket assignment endpoint for each TA
      const ticketCounts = {};

      // Initialize counts for all TAs
      tasData.forEach((ta) => {
        ticketCounts[ta.user_id] = {
          name: ta.name,
          counts: { new: 0, ongoing: 0, resolved: 0 },
        };
      });

      // Fetch assignments for each TA using the role-filtered endpoint
      const countPromises = tasData.map(async (ta) => {
        try {
          // Use new endpoint if TA is viewing their own stats
          if (currentUserRole === 'TA' && ta.user_id === decodedToken.id) {
            const response = await fetch(`${baseURL}/api/tickets/assigned-to-me`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            });
            
            if (response.ok) {
              const data = await response.json();
              // Use summary counts from the new endpoint
              ticketCounts[ta.user_id].counts = {
                new: data.summary.openTickets - data.tickets.filter(t => t.status === 'ongoing').length,
                ongoing: data.tickets.filter(t => t.status === 'ongoing').length,
                resolved: data.summary.closedTickets,
              };
            }
          } else if (currentUserRole === 'TA' && ta.user_id !== decodedToken.id) {
            // For TAs viewing other TAs, only show shared tickets
            const [assignmentsResponse, myAssignmentsResponse] = await Promise.all([
              fetch(`${baseURL}/api/ticketassignments/users/${ta.user_id}`, {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }),
              fetch(`${baseURL}/api/ticketassignments/users/${decodedToken.id}`, {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              })
            ]);
            
            if (assignmentsResponse.ok && myAssignmentsResponse.ok) {
              const [otherTAAssignments, myAssignments] = await Promise.all([
                assignmentsResponse.json(),
                myAssignmentsResponse.json()
              ]);
              
              // Find shared ticket IDs
              const myTicketIds = myAssignments.map(a => a.ticket_id);
              const sharedTicketIds = otherTAAssignments
                .filter(a => myTicketIds.includes(a.ticket_id))
                .map(a => a.ticket_id);
              
              // Get shared ticket details
              const sharedTicketPromises = sharedTicketIds.map(async (ticketId) => {
                try {
                  const ticketResponse = await fetch(`${baseURL}/api/tickets/${ticketId}`, {
                    method: "GET",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                  });
                  
                  if (ticketResponse.ok) {
                    return await ticketResponse.json();
                  }
                } catch (err) {
                  console.error(`Error fetching shared ticket ${ticketId}:`, err);
                }
                return null;
              });
              
              const sharedTickets = (await Promise.all(sharedTicketPromises)).filter(Boolean);
              
              // Count shared tickets by status
              sharedTickets.forEach((ticket) => {
                if (ticket.status === "new") {
                  ticketCounts[ta.user_id].counts.new += 1;
                } else if (ticket.status === "ongoing") {
                  ticketCounts[ta.user_id].counts.ongoing += 1;
                } else if (ticket.status === "resolved") {
                  ticketCounts[ta.user_id].counts.resolved += 1;
                }
              });
            }
          } else {
            // Use existing logic for admins and students
            const assignmentsResponse = await fetch(
              `${baseURL}/api/ticketassignments/users/${ta.user_id}`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (assignmentsResponse.ok) {
              const assignments = await assignmentsResponse.json();
              
              // Get ticket details for each assignment
              const ticketPromises = assignments.map(async (assignment) => {
                try {
                  const ticketResponse = await fetch(`${baseURL}/api/tickets/${assignment.ticket_id}`, {
                    method: "GET",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                  });
                  
                  if (ticketResponse.ok) {
                    return await ticketResponse.json();
                  }
                } catch (err) {
                  console.error(`Error fetching ticket ${assignment.ticket_id}:`, err);
                }
                return null;
              });

              const tickets = (await Promise.all(ticketPromises)).filter(Boolean);
              
              // Count by status
              tickets.forEach((ticket) => {
                if (ticket.status === "new") {
                  ticketCounts[ta.user_id].counts.new += 1;
                } else if (ticket.status === "ongoing") {
                  ticketCounts[ta.user_id].counts.ongoing += 1;
                } else if (ticket.status === "resolved") {
                  ticketCounts[ta.user_id].counts.resolved += 1;
                }
              });
            }
          }
        } catch (err) {
          console.error(`Error fetching assignments for TA ${ta.user_id}:`, err);
        }
      });

      await Promise.all(countPromises);
      setTACounts(ticketCounts);
    } catch (err) {
      console.error("Error fetching TA ticket counts:", err);
    }
  };

  const applyFilters = () => {
    const filtered = tas.filter((ta) =>
      ta.name.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredTAs(filtered);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: theme.palette.background.default,
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <CircularProgress size={80} thickness={4} />
        <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
          Loading, please wait...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: theme.palette.background.default,
        padding: 6.25,
        gap: 6.25,
      }}
    >
      <Typography
        variant="h1"
        sx={{ fontWeight: "bold", fontSize: "2rem", textAlign: "center" }}
      >
        {userRole === "student" ? "Teaching Assistants" : "All Teaching Assistants (TAs)"}
      </Typography>
      {userRole === "student" && (
        <Typography
          variant="subtitle1"
          sx={{ 
            fontSize: "1rem", 
            textAlign: "center", 
            color: theme.palette.text.secondary,
            marginTop: -4
          }}
        >
          Find office hours and contact information for your course TAs
        </Typography>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <TextField
          label={userRole === "student" ? "Search Teaching Assistants" : "Search TAs"}
          variant="outlined"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: "300px" }}
          placeholder={userRole === "student" ? "Search by name..." : "Search TAs..."}
        />
        <Button
          variant="outlined"
          onClick={() => setSearch("")}
          sx={{ color: theme.palette.primary.main, borderColor: theme.palette.primary.main }}
        >
          Clear Search
        </Button>
      </div>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: userRole === "student" 
            ? "repeat(auto-fill, minmax(280px, 1fr))" 
            : "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 2.5,
          maxHeight: "70vh",
          overflowY: "auto",
          padding: 0.625,
          border: 1,
          borderColor: theme.palette.divider,
          borderRadius: 1,
        }}
      >
        {filteredTAs.map((ta) => (
          userRole === "student" ? (
            <StudentInstructorCard
              key={ta.user_id}
              name={ta.name}
              userId={ta.user_id}
            />
          ) : (
            <InstructorCard
              key={ta.user_id}
              name={ta.name}
              counts={taCounts[ta.user_id]?.counts || {new:0, ongoing:0, resolved:0}} 
              userId={ta.user_id}
            />
          )
        ))}
      </Box>
    </Box>
  );
};

export default AllAssignees;
