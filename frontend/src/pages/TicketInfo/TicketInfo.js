import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { Typography, Select, MenuItem, FormControl, InputLabel, Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ConfirmDelete from "../../components/ConfirmDelete/ConfirmDelete";
import ConfirmEdit from "../../components/ConfirmEdit/ConfirmEdit";
import EditTicket from "../../components/EditTicket/EditTicket";
import ConfirmReassign from "../../components/ConfirmReassign/ConfirmReassign";
import ConfirmEscalate from "../../components/ConfirmEscalate/ConfirmEscalate";
import ReplySection from "../../components/ReplySection/ReplySection";
import ShareTicket from "../../components/ShareTicket/ShareTicket";
import TicketStatusIndicator from "../../components/TicketStatusIndicator/TicketStatusIndicator";
import { issueTypeDisplay, generateTicketNumber } from "../../constants/IssueTypes";
import "./TicketInfo.css";

const baseURL = process.env.REACT_APP_API_BASE_URL;
const TicketSubject = "Sponsor Isn’t Responding";

const TicketInfo = () => {
    const theme = useTheme();
  
  // Set body background immediately to prevent white flash
  React.useEffect(() => {
    document.body.style.backgroundColor = theme.palette.background.default;
    return () => {
      // Clean up on unmount if needed
      document.body.style.backgroundColor = '';
    };
  }, [theme.palette.background.default]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [ticketData, setTicketData] = useState(null);
  const [ticketStatus, setTicketStatus] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [loadingTicketData, setLoadingTicketData] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState(false);
  const [AssignedID, setAssignedID] = useState([]);
  const [allAssignedID, setAllAssignedID] = useState([]);
  const [SharedID, setSharedID] = useState([]);
  const [idToNameMap, setIdToNameMap] = useState({});

  const navigate = useNavigate();
  const location = useLocation();
  const token = Cookies.get("token");
  const decodedToken = jwtDecode(token);
  const userType = decodedToken.role;

  const urlParameters = new URLSearchParams(location.search);
  const ticketId = urlParameters.get("ticket");


  const fetchData = async () => {
    try {
      const token = Cookies.get("token");
      const ticketDataResponse = await fetch(`${baseURL}/api/tickets/info/${ticketId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!ticketDataResponse.ok) {
        setUnauthorized(true);
        throw new Error("Failed to fetch tickets");
        
      } else {
        const data = await ticketDataResponse.json();
        setTicketData(data);
        setTicketStatus(data.status);
        setLoadingTicketData(false);
      }
      
    } catch (err) {
      console.error("Error: ", err);
      setError(true);
    }
  };

  const handleSaveEdit = async () => {
    setEditOpen(false);
    try {
      const token = Cookies.get("token");
      console.log("Editing Ticket: ", ticketId);

      const response = await fetch(`${baseURL}/api/tickets/${ticketId}/edit`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "Updated",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to edit ticket");
      }

      console.log("Ticket successfully updated!");
      setEditFormOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error editing ticket:", error);
    }
  };

  const handleStatusChange = async (event) => {
    const newStatus = event.target.value;
    try {
      const token = Cookies.get("token");
      const response = await fetch(`${baseURL}/api/tickets/${ticketId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      const updated = await response.json();
      setTicketStatus(updated.status);
      setTicketData(updated);
      window.dispatchEvent(new Event("ticketUpdated"));
    } catch (error) {
      console.error("Error updating ticket status:", error);
    }
  };

  const resolveEscalation = async () => {
    try{
        const deescalateResponse = await fetch(
            `${baseURL}/api/tickets/${ticketId}/deescalate`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (!deescalateResponse.ok) {
            console.error(`Failed to de-escalate ticket. Status: ${deescalateResponse.status}`);
            console.error(`${deescalateResponse.reason}`);
            alert("Failed to de-escalate ticket. Please try again.");
        } else {
            alert("Ticket was de-escalated successfully.");
        }


    } catch(error) {
        console.log("Error: ", error);
        setError(true);
    }
  };

  const handleDelete = async () => {
    try {
      const token = Cookies.get("token");
      const response = await fetch(`${baseURL}/api/tickets/${ticketId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete ticket");
      }

      console.log("Ticket deleted successfully");
      setDeleteOpen(false);
      navigate(-1); // Go back to previous page
    } catch (error) {
      console.error("Error deleting ticket:", error);
      alert("Failed to delete ticket. Please try again.");
    }
  };

  useEffect(() => {
    fetchData();
  }, [ticketId]);

  //TICKET ASSIGNMENTS: from ticket_id get user_id (database has multiple users assigned to same ticket?)
  const fetchAssignedTaID = async () => {
    try {
      const token = Cookies.get("token");
      
      const getResponse = await fetch(
        `${baseURL}/api/ticketassignments/ticket/${ticketId}`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        //console.log("Assigned TA ID: ", getResponse);

        if (!getResponse.ok) {
          console.error(`Failed to get assigned TAs ID. Status: ${getResponse.status}`);
          console.error(`${getResponse.reason}`);
        }
      
        const list = await getResponse.json();
        console.log("Assigned TA ID: ", list);
        const TA_id = list.map(obj => obj.user_id)[0]; //if tickets have multiple TAs, only get the first one
        const TA_id_list = list.map(obj => obj.user_id);
        setAllAssignedID(TA_id_list);
        setAssignedID(TA_id);

      } catch (err) {
        console.log("Error: ", err);
        setError(true);
      }
  }

// Change your convertToMap to handle roles
    const convertToMapWithRoles = (taList, graderList) => {
        const map = {};
        taList.forEach(user => {
            map[user.user_id] = { name: user.name, role: 'TA' };
        });
        graderList.forEach(user => {
            map[user.user_id] = { name: user.name, role: 'Grader' };
        });
        return map;
    };

    const fetchStaffMap = async () => {
        try {
            const token = Cookies.get("token");

            // Fetch both in parallel
            const [taRes, graderRes] = await Promise.all([
                fetch(`${baseURL}/api/users/role/TA`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`${baseURL}/api/users/role/grader`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
            ]);

            const taList = await taRes.json();
            const graderList = await graderRes.json();

            const combinedMap = convertToMapWithRoles(taList, graderList);
            setIdToNameMap(combinedMap);

        } catch (err) {
            console.error("Error fetching staff:", err);
        }
    };


  useEffect(() => {
      fetchStaffMap();
    fetchAssignedTaID();    
  }, []);


  if (error) {
    // navigate("/unauthorized");
  }

  //Robert Naff: Need to have Back button do something
  const handleBack = () => {
    console.log("Back Button Clicked");
    navigate(-1);
  };

  const editPopupClose = () => setEditOpen(false);
  const handleConfirmEdit = () => {
    setEditOpen(false);
    setEditFormOpen(true);
  };

  if (unauthorized){
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#f0f0f0" }}>
        <Typography variant="h6" sx={{ color: "#8C1D40" }}>Sorry, you are not authorized to view this ticket</Typography>
      </div>
    );
  }
  
  if (loadingTicketData) {
    return (
      <Box sx={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh", 
        backgroundColor: theme.palette.background.default,
        flexDirection: "column", 
        gap: 3 
      }}>
        <CircularProgress size={80} thickness={4} sx={{ color: theme.palette.primary.main }} />
        <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>Loading, please wait...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      backgroundColor: theme.palette.background.default, 
      minHeight: '100vh',
      p: 4, 
      pt: 4
    }}>
      <Box sx={{backgroundColor: theme.palette.background.paper, p: 1, borderRadius: 1, flex: 1 }}>
        <Stack className="ticketInfo" sx={{ backgroundColor: theme.palette.background.paper }}>
          
          <Button variant="text" className="backButton" onClick={handleBack} startIcon={<ArrowBackIosNewIcon />} sx={{ mb: 1, alignSelf: 'flex-start' }}>Back</Button>
          
          {/* NEW CLEAN HORIZONTAL HEADER */}
          <Box className="ticket-header" sx={{ 
            backgroundColor: theme.palette.background.paper,
            p: 3, 
            mb: 2,
            borderRadius: 1,
            border: `1px solid ${theme.palette.divider}`
          }}>
            {/* Title Row */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                Capstone Ticket
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                  {userType === 'admin' || userType === 'TA' ? ticketId : generateTicketNumber(ticketData.issue_type, ticketId)}
                </Typography>
                <TicketStatusIndicator status={ticketStatus.toUpperCase() || "UNKNOWN"} />
                {ticketData.escalated && <TicketStatusIndicator status={"ESCALATED"} />}
              </Box>
            </Box>

            {/* Single Row Info Grid */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(6, 1fr)', 
              gap: 3,
              mb: 2
            }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: theme.palette.text.secondary, mb: 0.5, fontSize: '0.75rem' }}>
                  STUDENT
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: '500', color: theme.palette.text.primary }}>
                  {ticketData.student_name}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: theme.palette.text.secondary, mb: 0.5, fontSize: '0.75rem' }}>
                  TEAM
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: '500', color: theme.palette.text.primary }}>
                  {ticketData.team_name}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: theme.palette.text.secondary, mb: 0.5, fontSize: '0.75rem' }}>
                  SPONSOR
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: '500', color: theme.palette.text.primary }}>
                  {ticketData.sponsor_name}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: theme.palette.text.secondary, mb: 0.5, fontSize: '0.75rem' }}>
                  ISSUE TYPE
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: '500', color: theme.palette.text.primary }}>
                  {issueTypeDisplay[ticketData.issue_type] || "Unknown"}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: theme.palette.text.secondary, mb: 0.5, fontSize: '0.75rem' }}>
                  ASSIGNED STAFF
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: '500', color: theme.palette.text.primary }}>
                    {idToNameMap[AssignedID]?.name || 'Unassigned'}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: theme.palette.text.secondary, mb: 0.5, fontSize: '0.75rem' }}>
                  CREATED
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: '500', color: theme.palette.text.primary }}>
                  {ticketData.created_at ? new Date(ticketData.created_at).toLocaleDateString() : "N/A"}
                </Typography>
              </Box>
            </Box>

            {/* Action Buttons Row */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel sx={{ 
                  fontSize: '14px', 
                  transform: 'translate(14px, -9px) scale(0.75)',
                  backgroundColor: theme.palette.background.paper,
                  padding: '0 4px'
                }}>Status</InputLabel>
                <Select value={ticketStatus} onChange={handleStatusChange} size="small" sx={{ 
                  height: "40px"
                }}>
                  <MenuItem value="new">New</MenuItem>
                  <MenuItem value="ongoing">Ongoing</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                </Select>
              </FormControl>
              
              <Button variant="contained" onClick={() => setEditOpen(true)}>Edit Ticket</Button>
              <ConfirmEdit handleOpen={editOpen} handleClose={editPopupClose} onConfirmEdit={handleConfirmEdit} />
              
              <Button variant="outlined" color="error" onClick={() => handleStatusChange({ target: { value: 'resolved' } })}>Close Ticket</Button>
              
              {userType === "TA" && ticketData.escalated === false && (
                <Button variant="contained" color="warning" onClick={() => setEscalateOpen(true)}>Escalate Ticket</Button>
              )}
              <ConfirmEscalate handleOpen={escalateOpen} handleClose={() => setEscalateOpen(false)} ticketID={ticketId} />
              
              {userType === "admin" && ticketData.escalated && (
                <Button variant="contained" color="success" onClick={() => resolveEscalation()}>Resolve Escalation</Button>
              )}
              
              {userType === "admin" && (
                <Button variant="outlined" onClick={() => setReassignOpen(true)}>Reassign</Button>
              )}
              <ConfirmReassign handleOpen={reassignOpen} handleClose={() => setReassignOpen(false)} ticketID={ticketId} oldTAID={AssignedID} idNameMap={idToNameMap} updateTA={(newTAID) => setAssignedID(newTAID)} />

              {/*Currently copies from Reassign, do not use yet */}
              {(userType === "admin" || userType === "TA") && (
              <Button variant="outlined" onClick={() => setShareOpen(true)}>Share</Button>
              )}
              <ShareTicket handleOpen={shareOpen} handleClose={() => setShareOpen(false)} ticketID={ticketId} oldTAID={AssignedID} idNameMap={idToNameMap} updateTA={(newTAID) => setSharedID(newTAID)} allTAs = {allAssignedID} />
            </Box>
          </Box>

          {/* TICKET DESCRIPTION */}
          <Box sx={{ mb: 2, backgroundColor: theme.palette.background.paper, p: 2, borderRadius: 1, border: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold", color: theme.palette.text.primary }}>Description:</Typography>
            <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.6 }}>
              {ticketData.issue_description}
            </Typography>
          </Box>

          {/* CONVERSATION SECTION */}
          <Box sx={{ mb: 2, backgroundColor: theme.palette.background.paper, p: 2, borderRadius: 1, border: `1px solid ${theme.palette.divider}` }}>
            <ReplySection />
          </Box>

        </Stack>
      </Box>
      {editFormOpen && <EditTicket ticketId={ticketId} onClose={() => setEditFormOpen(false)} handleSaveEdit={handleSaveEdit} />}
    </Box>
  );
};

export default TicketInfo;


//github tracking 

