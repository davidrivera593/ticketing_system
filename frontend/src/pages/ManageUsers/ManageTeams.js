import React, { useEffect, useState, useMemo } from "react";
import Cookies from "js-cookie";
import { useTheme } from "@mui/material/styles";
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    IconButton,
    TextField,
    InputAdornment,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";

const ManageTeam = () => {
    const [teams, setTeams] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // --- Action States ---
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Edit States
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editTeamName, setEditTeamName] = useState("");

    // Delete States
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const token = Cookies.get("token");
    const theme = useTheme();
    const navigate = useNavigate();

    // Initial data fetch
    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        setIsLoading(true);
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
            console.error("Failed to load teams:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        navigate(-1);
    };

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };

    // --- EDIT HANDLERS ---
    const handleEditClick = (team) => {
        setSelectedTeam(team);
        setEditTeamName(team.team_name);
        setIsEditDialogOpen(true);
    };

    const handleEditSubmit = async () => {
        const trimmedName = editTeamName.trim();
        if (!trimmedName || !selectedTeam) return;

        setIsProcessing(true);

        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/teams/${selectedTeam.team_id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ team_name: trimmedName }),
            });

            if (!response.ok) throw new Error("Failed to update team.");

            // Optimistic UI update
            setTeams(currentTeams =>
                currentTeams.map(t =>
                    t.team_id === selectedTeam.team_id ? { ...t, team_name: trimmedName } : t
                )
            );

            setIsEditDialogOpen(false);
        } catch (error) {
            console.error(error);
            alert("An error occurred while updating the team.");
        } finally {
            setIsProcessing(false);
            setSelectedTeam(null);
        }
    };

    // --- DELETE HANDLERS ---
    const handleDeleteClick = (team) => {
        setSelectedTeam(team);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteSubmit = async () => {
        if (!selectedTeam) return;
        setIsProcessing(true);

        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/teams/${selectedTeam.team_id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error("Failed to delete team.");

            // Remove team from UI
            setTeams(currentTeams => currentTeams.filter(t => t.team_id !== selectedTeam.team_id));

            setIsDeleteDialogOpen(false);
        } catch (error) {
            console.error(error);
            alert("An error occurred while deleting the team.");
        } finally {
            setIsProcessing(false);
            setSelectedTeam(null);
        }
    };

    // Performant local filtering
    const filteredTeams = useMemo(() => {
        const lowerCaseQuery = searchQuery.toLowerCase();
        if (!lowerCaseQuery) return teams;

        return teams.filter(team => {
            const name = team.team_name?.toLowerCase() || "";
            return name.includes(lowerCaseQuery);
        });
    }, [teams, searchQuery]);

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
                    maxWidth: "1000px",
                    margin: "40px auto",
                }}
            >
                {/* --- HEADER --- */}
                <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative', marginBottom: 4 }}>
                    <IconButton onClick={handleBack} sx={{ position: 'absolute', left: 0, color: theme.palette.text.primary }}>
                        <ArrowBackIosNewIcon />
                    </IconButton>
                    <Typography variant="h4" sx={{ flexGrow: 1, textAlign: "center", fontWeight: "bold", color: theme.palette.text.primary }}>
                        Manage Teams
                    </Typography>
                </Box>

                {/* --- TOOLBAR --- */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, gap: 2 }}>
                    <TextField
                        variant="outlined"
                        placeholder="Search teams..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        sx={{ width: '100%', maxWidth: '400px' }}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                        }}
                    />
                    <Button variant="contained" color="primary" onClick={() => alert("Create Team feature coming soon!")}>
                        + Create New Team
                    </Button>
                </Box>

                {/* --- DATA TABLE --- */}
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', marginY: 8 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer component={Paper} sx={{ boxShadow: "none", border: `1px solid ${theme.palette.divider}` }}>
                        <Table>
                            <TableHead sx={{ backgroundColor: theme.palette.action.hover }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: "bold", width: "10%" }}>ID</TableCell>
                                    <TableCell sx={{ fontWeight: "bold" }}>Team Name</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: "bold" }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredTeams.length > 0 ? (
                                    filteredTeams.map((team, index) => (
                                        <TableRow key={team.team_id || index} hover>
                                            <TableCell sx={{ color: theme.palette.text.secondary }}>{team.team_id}</TableCell>
                                            <TableCell sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>{team.team_name}</TableCell>
                                            <TableCell align="right">
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ mr: 1 }}
                                                    onClick={() => handleEditClick(team)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    color="error"
                                                    onClick={() => handleDeleteClick(team)}
                                                >
                                                    Delete
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} align="center" sx={{ py: 4, color: theme.palette.text.secondary }}>
                                            No teams found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Box>

            {/* --- EDIT TEAM DIALOG --- */}
            <Dialog open={isEditDialogOpen} onClose={() => !isProcessing && setIsEditDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Edit Team</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Team Name"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={editTeamName}
                        onChange={(e) => setEditTeamName(e.target.value)}
                        disabled={isProcessing}
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsEditDialogOpen(false)} disabled={isProcessing} sx={{ color: theme.palette.text.secondary }}>
                        Cancel
                    </Button>
                    <Button onClick={handleEditSubmit} variant="contained" disabled={!editTeamName.trim() || isProcessing}>
                        {isProcessing ? <CircularProgress size={24} color="inherit" /> : "Save Changes"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* --- DELETE TEAM CONFIRMATION DIALOG --- */}
            <Dialog open={isDeleteDialogOpen} onClose={() => !isProcessing && setIsDeleteDialogOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ color: theme.palette.error.main }}>Delete Team?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete <strong>{selectedTeam?.team_name}</strong>? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsDeleteDialogOpen(false)} disabled={isProcessing} sx={{ color: theme.palette.text.secondary }}>
                        Cancel
                    </Button>
                    <Button onClick={handleDeleteSubmit} variant="contained" color="error" disabled={isProcessing}>
                        {isProcessing ? <CircularProgress size={24} color="inherit" /> : "Delete"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ManageTeam;