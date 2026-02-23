import Cookies from "js-cookie";
import React, { useEffect, useState } from "react";
import {
    Box, Button, Typography, TextField, FormControl,
    InputLabel, Select, MenuItem, Grid2 as Grid, CircularProgress
} from '@mui/material';
import { useTheme } from "@mui/material/styles";

const baseURL = process.env.REACT_APP_API_BASE_URL;

const CreateTicket = ({ onClose }) => {
    const theme = useTheme();

    // Auth Data
    const token = Cookies.get("token");
    const userId = Cookies.get("user_id");
    const userName = Cookies.get("name") || "";

    // State for Role Detection
    const [isStudent, setIsStudent] = useState(null); // null until check is complete

    // Form & Data State
    const [issueType, setIssueType] = useState("");
    const [description, setDescription] = useState("");
    const [instructorId, setInstructorId] = useState("");
    const [selectedTeamId, setSelectedTeamId] = useState("");
    const [loading, setLoading] = useState(false);

    // Data Lists
    const [studentData, setStudentData] = useState({ section: "", sponsor: "" });
    const [teamList, setTeamList] = useState([]);
    const [taList, setTaList] = useState([]);
    const [graderList, setGraderList] = useState([]);

    useEffect(() => {
        determineRoleAndLoadData();
    }, []);

    const determineRoleAndLoadData = async () => {
        try {
            // 1. Fetch all students to see if current user is among them
            const studentRes = await fetch(`${baseURL}/api/users/role/student`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const students = await studentRes.json();

            const me = students.find(s => String(s.user_id) === String(userId));

            if (me) {
                // USER IS A STUDENT
                setIsStudent(true);
                setStudentData({ section: me.section || "", sponsor: me.sponsor || "" });

                // Load student-specific requirements
                fetchTeams();
                fetchUsersByRole("TA", setTaList);
                fetchUsersByRole("grader", setGraderList);
            } else {
                // USER IS STAFF (TA/Instructor)
                setIsStudent(false);
            }
        } catch (error) {
            console.error("Role detection failed:", error);
            setIsStudent(false); // Fallback to staff view or error state
        }
    };

    const fetchTeams = async () => {
        const res = await fetch(`${baseURL}/api/teams`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setTeamList(Array.isArray(data) ? data : []);
    };

    const fetchUsersByRole = async (role, setter) => {
        const res = await fetch(`${baseURL}/api/users/role/${role}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setter(Array.isArray(data) ? data : []);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);

        try {
            const endpoint = isStudent ? `${baseURL}/api/tickets` : `${baseURL}/api/tatickets`;
            const payload = isStudent ? {
                team_id: selectedTeamId,
                student_id: userId,
                sponsor_name: studentData.sponsor,
                section: studentData.section,
                issue_type: issueType,
                issue_description: description,
            } : {
                ta_id: userId,
                issue_type: issueType,
                issue_description: description,
            };

            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error("Failed to create ticket.");
            const ticket = await response.json();

            // Step 2: Student Assignment logic
            if (isStudent && instructorId) {
                await fetch(`${baseURL}/api/ticketassignments/ticket/${ticket.ticket_id}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ user_id: instructorId }),
                });
            }

            alert("Ticket submitted successfully!");
            onClose();
            window.location.reload();
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Prevent rendering the form until we know the role
    if (isStudent === null) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            bgcolor: 'rgba(0, 0, 0, 0.4)', display: 'flex', justifyContent: 'center',
            alignItems: 'center', zIndex: 1000
        }}>
            <Box sx={{
                bgcolor: theme.palette.background.paper, p: 4, borderRadius: 2,
                width: '95%', maxWidth: 600, position: 'relative', boxShadow: 24
            }}>
                <Button onClick={onClose} sx={{ position: "absolute", top: 10, right: 10, minWidth: "30px", color: "#8C1D40", fontSize: '20px' }}>&times;</Button>

                <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, textAlign: 'center', color: '#8C1D40' }}>
                    {isStudent ? "New Student Ticket" : "New Staff/TA Ticket"}
                </Typography>

                <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                    <Grid container spacing={2}>
                        <Grid size={isStudent ? 4 : 12}>
                            <TextField label="Name" variant="filled" size="small" value={userName} fullWidth InputProps={{ readOnly: true }} />
                        </Grid>
                        {isStudent && (
                            <>
                                <Grid size={4}><TextField label="Section" variant="filled" size="small" value={studentData.section} fullWidth InputProps={{ readOnly: true }} /></Grid>
                                <Grid size={4}><TextField label="Sponsor" variant="filled" size="small" value={studentData.sponsor} fullWidth InputProps={{ readOnly: true }} /></Grid>
                            </>
                        )}
                    </Grid>

                    {isStudent && (
                        <FormControl fullWidth required>
                            <InputLabel>Team Name</InputLabel>
                            <Select value={selectedTeamId} label="Team Name" onChange={(e) => setSelectedTeamId(e.target.value)}>
                                {teamList.map((t) => <MenuItem key={t.team_id} value={t.team_id}>{t.team_name}</MenuItem>)}
                            </Select>
                        </FormControl>
                    )}

                    <FormControl fullWidth required>
                        <InputLabel>Issue Type</InputLabel>
                        <Select value={issueType} label="Issue Type" onChange={(e) => { setIssueType(e.target.value); setInstructorId(""); }}>
                            <MenuItem value="sponsorIssue">Issues communicating with the Sponsor</MenuItem>
                            <MenuItem value="sponsorWorkingIssue">Issues working with the Sponsor</MenuItem>
                            <MenuItem value="teamIssue">Issues within the Team</MenuItem>
                            <MenuItem value="teamMemberIssue">Issues with a team mate</MenuItem>
                            <MenuItem value="gradeAppeal">Appeal to an assignment grade </MenuItem>
                            <MenuItem value="extensionRequest">Request an extension for an assignment</MenuItem>
                            <MenuItem value="accommodationRequest">Request an accommodation for the course</MenuItem>
                            <MenuItem value="generalQuestion">General questions about the course</MenuItem>
                            <MenuItem value="Feature Request">Feature Request</MenuItem>
                            <MenuItem value="Question">Question about this system</MenuItem>
                            <MenuItem value="other">Other</MenuItem>
                        </Select>
                    </FormControl>

                    {isStudent && (
                        <FormControl fullWidth required>
                            <InputLabel>{issueType === "gradeAppeal" ? "Assigned Grader" : "Assigned TA"}</InputLabel>
                            <Select
                                value={instructorId}
                                label={issueType === "gradeAppeal" ? "Assigned Grader" : "Assigned TA"}
                                onChange={(e) => setInstructorId(e.target.value)}
                                disabled={!issueType}
                            >
                                {(issueType === "gradeAppeal" ? graderList : taList).map((staff) => (
                                    <MenuItem key={staff.user_id} value={staff.user_id}>{staff.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    <TextField
                        label="Description" required fullWidth multiline rows={4}
                        value={description} onChange={(e) => setDescription(e.target.value)}
                        placeholder="Please provide as much detail as possible..."
                    />

                    <Button type="submit" variant="contained" disabled={loading}
                            sx={{ py: 1.5, bgcolor: "#8C1D40", fontWeight: 'bold', "&:hover": { bgcolor: "#5F0E24" } }}>
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Submit Ticket"}
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};

export default CreateTicket;