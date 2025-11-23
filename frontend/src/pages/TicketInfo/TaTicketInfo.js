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
import ConfirmEdit from "../../components/ConfirmEdit/ConfirmEdit";
import TaEditTicket from "../../components/EditTicket/TaEditTicket";
import TaConfirmEscalate from "../../components/ConfirmEscalate/TaConfirmEscalate";
import TaConfirmReassign from "../../components/ConfirmReassign/TaConfirmReassign";
import TaConfirmAssign from "../../components/ConfirmReassign/TaConfirmAssign";
import TaReplySection from "../../components/ReplySection/TaReplySection";
import TicketStatusIndicator from "../../components/TicketStatusIndicator/TicketStatusIndicator";
import { issueTypeDisplay, generateTicketNumber } from "../../constants/IssueTypes";
import "./TicketInfo.css";

const baseURL = process.env.REACT_APP_API_BASE_URL;

const TaTicketInfo = () => {
    const theme = useTheme();

    // State Management
    const [editOpen, setEditOpen] = useState(false);
    const [editFormOpen, setEditFormOpen] = useState(false);
    const [reassignOpen, setReassignOpen] = useState(false);
    const [escalateOpen, setEscalateOpen] = useState(false);
    const [assignOpen, setAssignOpen] = useState(false);
    const [ticketData, setTicketData] = useState(null);
    const [loadingTicketData, setLoadingTicketData] = useState(true);
    const [unauthorized, setUnauthorized] = useState(false);
    const [error, setError] = useState(false);
    const [AssignedID, setAssignedID] = useState(null);
    const [idToNameMap, setIdToNameMap] = useState({});

    // Hooks and URL Params
    const navigate = useNavigate();
    const location = useLocation();
    const token = Cookies.get("token");
    const decodedToken = jwtDecode(token);
    const userType = decodedToken.role;
    const userId = decodedToken.id;
    const urlParameters = new URLSearchParams(location.search);
    const ticketId = urlParameters.get("ticket");

    // Data Fetching
    const fetchData = async () => {
        try {
            const token = Cookies.get("token");
            const response = await fetch(`${baseURL}/api/tatickets/info/${ticketId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                setUnauthorized(true);
                throw new Error("Failed to fetch ticket data");
            }

            const data = await response.json();
            setTicketData(data);
            setLoadingTicketData(false);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError(true);
            setLoadingTicketData(false);
        }
    };

    const fetchAssignedTaID = async () => {
        try {
            const token = Cookies.get("token");
            const response = await fetch(`${baseURL}/api/taticketassignments/ticket/${ticketId}`, {
                method: "GET",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const list = await response.json();
                // Handle multiple assignees gracefully, but UI currently uses the first one
                const taId = list.length > 0 ? list[0].user_id : null;
                setAssignedID(taId);
            }
        } catch (err) {
            console.error("Error fetching assigned TA:", err);
        }
    };

    const fetchTaMap = async () => {
        try {
            const token = Cookies.get("token");
            const response = await fetch(`${baseURL}/api/users/role/TA`, {
                method: "GET",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const list = await response.json();
                const map = list.reduce((acc, obj) => {
                    acc[obj.user_id] = obj.name;
                    return acc;
                }, {});
                setIdToNameMap(map);
            }
        } catch (err) {
            console.error("Error fetching TA map:", err);
        }
    };

    useEffect(() => {
        if (ticketId) {
            fetchData();
            fetchAssignedTaID();
            fetchTaMap();
        }
    }, [ticketId]);

    // Handlers
    const handleSaveEdit = async () => {
        setEditOpen(false);
        try {
            const token = Cookies.get("token");
            const response = await fetch(`${baseURL}/api/tatickets/${ticketId}/edit`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status: "Updated" }), // Example body, adjust as needed
            });

            if (!response.ok) throw new Error("Failed to edit ticket");

            console.log("Ticket successfully updated!");
            setEditFormOpen(false);
            fetchData(); // Refresh data
        } catch (error) {
            console.error("Error editing ticket:", error);
        }
    };

    const handleStatusChange = async (event) => {
        const newStatus = event.target.value;
        try {
            const token = Cookies.get("token");
            const response = await fetch(`${baseURL}/api/tatickets/${ticketId}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) throw new Error("Failed to update status");

            const updatedTicket = await response.json();
            setTicketData(updatedTicket); // Single source of truth update
            window.dispatchEvent(new Event("ticketUpdated"));
        } catch (error) {
            console.error("Error updating ticket status:", error);
        }
    };

    const resolveEscalation = async () => {
        try {
            const token = Cookies.get("token");
            const response = await fetch(`${baseURL}/api/tatickets/${ticketId}/deescalate`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                alert("Failed to de-escalate ticket. Please try again.");
            } else {
                alert("Ticket was de-escalated successfully.");
                fetchData(); // Refresh data
            }
        } catch (error) {
            console.error("Error resolving escalation:", error);
        }
    };

    const handleBack = () => navigate(-1);
    const editPopupClose = () => setEditOpen(false);
    const handleConfirmEdit = () => {
        setEditOpen(false);
        setEditFormOpen(true);
    };

    // Conditional Rendering for loading/error states
    if (unauthorized) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <Typography variant="h6" color="error">Sorry, you are not authorized to view this ticket</Typography>
            </Box>
        );
    }

    if (loadingTicketData) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", flexDirection: "column", gap: 3 }}>
                <CircularProgress size={80} />
                <Typography variant="h6">Loading, please wait...</Typography>
            </Box>
        );
    }

    if (error || !ticketData) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <Typography variant="h6" color="error">Could not load ticket data. Please try again later.</Typography>
            </Box>
        )
    }

    // Main Component Render
    return (
        <Box sx={{ backgroundColor: theme.palette.background.default, minHeight: '100vh', p: 4, pt: 4 }}>
            <Box sx={{ backgroundColor: theme.palette.background.paper, p: 1, borderRadius: 1 }}>
                <Stack className="ticketInfo" sx={{ backgroundColor: theme.palette.background.paper }}>
                    <Button variant="text" onClick={handleBack} startIcon={<ArrowBackIosNewIcon />} sx={{ mb: 1, alignSelf: 'flex-start' }}>
                        Back
                    </Button>

                    {/* --- NEW MODERN UI HEADER --- */}
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
                                    {userType === 'admin' || userType === 'TA' ? ticketId : generateTicketNumber(ticketData?.issue_type, ticketId)}
                                </Typography>
                                <TicketStatusIndicator status={ticketData?.status?.toUpperCase() || "UNKNOWN"} />
                                {ticketData.escalated && <TicketStatusIndicator status={"ESCALATED"} />}
                            </Box>
                        </Box>

                        {/* Single Row Info Grid */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 3, mb: 2 }}>
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: theme.palette.text.secondary, mb: 0.5, fontSize: '0.75rem' }}>CREATOR</Typography>
                                <Typography variant="body1" sx={{ fontWeight: '500' }}>{ticketData.ta_name || 'N/A'}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: theme.palette.text.secondary, mb: 0.5, fontSize: '0.75rem' }}>ISSUE TYPE</Typography>
                                <Typography variant="body1" sx={{ fontWeight: '500' }}>{issueTypeDisplay[ticketData.issue_type] || "Unknown"}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: theme.palette.text.secondary, mb: 0.5, fontSize: '0.75rem' }}>ASSIGNED TA</Typography>
                                <Typography variant="body1" sx={{ fontWeight: '500' }}>{AssignedID ? (idToNameMap[AssignedID] || 'Unknown') : 'Unassigned'}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: theme.palette.text.secondary, mb: 0.5, fontSize: '0.75rem' }}>CREATED</Typography>
                                <Typography variant="body1" sx={{ fontWeight: '500' }}>{new Date(ticketData.created_at).toLocaleDateString()}</Typography>
                            </Box>
                        </Box>

                        {/* Action Buttons Row */}
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                            <FormControl sx={{ minWidth: 150 }}>
                                <InputLabel sx={{ fontSize: '14px', transform: 'translate(14px, -9px) scale(0.75)', backgroundColor: theme.palette.background.paper, padding: '0 4px' }}>Status</InputLabel>
                                <Select value={ticketData?.status || ''} onChange={handleStatusChange} size="small" sx={{ height: "40px" }}>
                                    <MenuItem value="new">New</MenuItem>
                                    <MenuItem value="ongoing">Ongoing</MenuItem>
                                    <MenuItem value="resolved">Resolved</MenuItem>
                                </Select>
                            </FormControl>
                            <Button variant="contained" onClick={() => setEditOpen(true)}>Edit Ticket</Button>
                            <ConfirmEdit handleOpen={editOpen} handleClose={editPopupClose} onConfirmEdit={handleConfirmEdit} />
                            <Button variant="outlined" color="error" onClick={() => handleStatusChange({ target: { value: 'resolved' } })}>Close Ticket</Button>
                            {userType === "TA" && userId !== ticketData.ta_id && !ticketData.escalated && (
                                <Button variant="contained" color="warning" onClick={() => setEscalateOpen(true)}>Escalate Ticket</Button>
                            )}
                            <TaConfirmEscalate handleOpen={escalateOpen} handleClose={() => setEscalateOpen(false)} ticketID={ticketId} />
                            {userType === "admin" && ticketData.escalated && (
                                <Button variant="contained" color="success" onClick={resolveEscalation}>Resolve Escalation</Button>
                            )}
                            {userType === "admin" && (
                                AssignedID ? (
                                    <>
                                        <Button variant="outlined" onClick={() => setReassignOpen(true)}>Reassign</Button>
                                        <TaConfirmReassign handleOpen={reassignOpen} handleClose={() => setReassignOpen(false)} ticketID={ticketId} oldTAID={AssignedID} idNameMap={idToNameMap} updateTA={setAssignedID} />
                                    </>
                                ) : (
                                    <>
                                        <Button variant="outlined" onClick={() => setAssignOpen(true)}>Assign</Button>
                                        <TaConfirmAssign handleOpen={assignOpen} handleClose={() => setAssignOpen(false)} ticketID={ticketId} idNameMap={idToNameMap} updateTA={setAssignedID} />
                                    </>
                                )
                            )}
                        </Box>
                    </Box>

                    {/* Description Section */}
                    <Box sx={{ mb: 2, p: 2, borderRadius: 1, border: `1px solid ${theme.palette.divider}` }}>
                        <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>Description:</Typography>
                        <Typography variant="body1" sx={{ lineHeight: 1.6 }}>{ticketData.issue_description}</Typography>
                    </Box>

                    {/* Replies Section */}
                    <Box sx={{ p: 2, borderRadius: 1, border: `1px solid ${theme.palette.divider}` }}>
                        <TaReplySection />
                    </Box>

                </Stack>
            </Box>
            {editFormOpen && <TaEditTicket ticketId={ticketId} onClose={() => setEditFormOpen(false)} handleSaveEdit={handleSaveEdit} />}
        </Box>
    );
};

export default TaTicketInfo;

//git tracking