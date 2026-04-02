import React, { useEffect, useState } from "react";
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
    Switch,
    IconButton,
    ToggleButton,
    ToggleButtonGroup,
    Checkbox,
    Toolbar,
    Menu,
    MenuItem,
    Button,
    Tooltip,
    alpha,
    TextField,
    InputAdornment,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";

const ManageStudents = () => {
    // Master list of all students from API
    const [students, setStudents] = useState([]);
    // The list of students to display after filtering
    const [filteredStudents, setFilteredStudents] = useState([]);
    // The current filter state
    const [filterStatus, setFilterStatus] = useState("all");

    // State for selection and action menu
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);

    // Add new state for search query
    const [searchQuery, setSearchQuery] = useState("");

    // ---  STATES FOR TEAM ASSIGNMENT ---
    const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
    const [teams, setTeams] = useState([]);
    const [selectedTeamId, setSelectedTeamId] = useState("");
    const [isAssigning, setIsAssigning] = useState(false);
    const [studentsToAssign, setStudentsToAssign] = useState([]);

    // --- STATES FOR SECTION ASSIGNMENT ---
    const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);
    const [selectedSection, setSelectedSection] = useState("");
    const [isAssigningSection, setIsAssigningSection] = useState(false);

    const [isLoading, setIsLoading] = useState(true);
    const token = Cookies.get("token");
    const theme = useTheme();
    const navigate = useNavigate();

    // Initial data fetch
    useEffect(() => {
        fetchStudents();
        fetchTeams();
    }, []);

    // useEffect now handles filtering AND search
    useEffect(() => {
        let list = students; // Start with the full list

        // Filter by status
        if (filterStatus === "enabled") {
            list = students.filter(s => (s.is_enabled ?? true));
        } else if (filterStatus === "disabled") {
            list = students.filter(s => !(s.is_enabled ?? true));
        }

        // Filter by search query
        const lowerCaseQuery = searchQuery.toLowerCase();
        if (lowerCaseQuery) {
            list = list.filter(student => {
                const name = student.name?.toLowerCase() || "";
                const email = student.email?.toLowerCase() || "";
                const team = student.team_name?.toLowerCase() || "n/a";
                const sponsor = student.sponsor?.toLowerCase() || "n/a";
                const section = student.section?.toLowerCase() || "n/a";

                return (
                    name.includes(lowerCaseQuery) ||
                    email.includes(lowerCaseQuery) ||
                    team.includes(lowerCaseQuery) ||
                    sponsor.includes(lowerCaseQuery) ||
                    section.includes(lowerCaseQuery)
                );
            });
        }

        setFilteredStudents(list);
    }, [students, filterStatus, searchQuery]);

    const fetchStudents = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_BASE_URL}/api/users/role/student`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) throw new Error("Failed to fetch students.");
            const data = await response.json();
            setStudents(data);
        } catch (error) {
            console.error("Failed to load students:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTeams = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/teams`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setTeams(data); // Assuming the API returns an array of team objects
            }
        } catch (error) {
            console.error("Failed to fetch teams:", error);
        }
    };

    const handleToggleEnabled = async (student) => {
        const currentValue = student.is_enabled ?? true;
        const newValue = !currentValue;

        setStudents((currentStudents) =>
            currentStudents.map((s) =>
                s.user_id === student.user_id ? { ...s, is_enabled: newValue } : s
            )
        );

        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_BASE_URL}/api/users/${student.user_id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        is_enabled: newValue,
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to update student status.");
            }
        } catch (err) {
            console.error("Error updating student status:", err);
            alert(`Error: ${err.message}. Reverting change.`);
            setStudents((currentStudents) =>
                currentStudents.map((s) =>
                    s.user_id === student.user_id
                        ? { ...s, is_enabled: currentValue }
                        : s
                )
            );
        }
    };

    const handleBack = () => {
        navigate(-1);
    };

    const handleFilterChange = (event, newStatus) => {
        if (newStatus !== null) {
            setFilterStatus(newStatus);
            setSelectedStudents([]); // Clear selection when filter changes
        }
    };

    // Handler for search input change
    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
        setSelectedStudents([]); // Clear selection when search query changes
    };

    // Handlers for selection
    const handleSelectAll = (event) => {
        if (event.target.checked) {
            const newSelecteds = filteredStudents.map((s) => s.user_id);
            setSelectedStudents(newSelecteds);
            return;
        }
        setSelectedStudents([]);
    };

    const handleSelectOne = (event, id) => {
        const selectedIndex = selectedStudents.indexOf(id);
        let newSelected = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selectedStudents, id);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selectedStudents.slice(1));
        } else if (selectedIndex === selectedStudents.length - 1) {
            newSelected = newSelected.concat(selectedStudents.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selectedStudents.slice(0, selectedIndex),
                selectedStudents.slice(selectedIndex + 1)
            );
        }
        setSelectedStudents(newSelected);
    };

    const isSelected = (id) => selectedStudents.indexOf(id) !== -1;

    // Handlers for the Action Menu
    const handleMenuClick = (event) => {
        setMenuAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
    };

    const handleAssignTeamSubmit = async () => {
        if (!selectedTeamId) return;
        setIsAssigning(true);

        // Find the team name for the optimistic UI update
        const selectedTeam = teams.find(t => t.team_id === selectedTeamId);

        // 1. Optimistic UI update
        setStudents((currentStudents) =>
            currentStudents.map((student) =>
                studentsToAssign.includes(student.user_id)
                    ? { ...student, team_name: selectedTeam?.team_name, team_id: selectedTeamId }
                    : student
            )
        );

        // 2. Fire API requests (Targeting the StudentData route)
        const updatePromises = studentsToAssign.map(studentId =>
            fetch(`${process.env.REACT_APP_API_BASE_URL}/api/studentData/${studentId}`, { // <-- UPDATED ROUTE HERE
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ team_id: selectedTeamId }),
            }).then(res => {
                if (!res.ok) throw new Error(`Failed to assign team for ${studentId}`);
                return studentId;
            })
        );

        const results = await Promise.allSettled(updatePromises);

        const failedUpdates = results.filter(result => result.status === "rejected");
        if (failedUpdates.length > 0) {
            alert(`${failedUpdates.length} student(s) failed to update. Please try again or refresh.`);
            fetchStudents(); // Re-fetch to guarantee sync on failure
        }

        // 3. Cleanup and close dialog
        setIsAssigning(false);
        setIsTeamDialogOpen(false);
        setSelectedStudents([]); // Clear checkboxes
        setSelectedTeamId(""); // Reset dropdown
    };

    const handleEditSectionSubmit = async () => {
        const trimmedSection = selectedSection.trim();
        if (!trimmedSection) return;

        setIsAssigningSection(true);

        // 1. Optimistic UI update
        setStudents((currentStudents) =>
            currentStudents.map((student) =>
                studentsToAssign.includes(student.user_id)
                    ? { ...student, section: trimmedSection }
                    : student
            )
        );

        // 2. Fire API requests targeting the StudentData route
        const updatePromises = studentsToAssign.map(studentId =>
            fetch(`${process.env.REACT_APP_API_BASE_URL}/api/studentData/${studentId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ section: trimmedSection }),
            }).then(res => {
                if (!res.ok) throw new Error(`Failed to assign section for ${studentId}`);
                return studentId;
            })
        );

        const results = await Promise.allSettled(updatePromises);

        const failedUpdates = results.filter(result => result.status === "rejected");
        if (failedUpdates.length > 0) {
            alert(`${failedUpdates.length} student(s) failed to update. Please try again or refresh.`);
            fetchStudents(); // Re-fetch to guarantee sync on failure
        }

        // 3. Cleanup and close dialog
        setIsAssigningSection(false);
        setIsSectionDialogOpen(false);
        setSelectedStudents([]); // Clear checkboxes
        setSelectedSection(""); // Reset input
    };

    // Bulk action logic
    const handleMenuAction = async (action) => {
        handleMenuClose(); // Close the menu

        let targetStatus;
        if (action === 'enable') {
            targetStatus = true;
        } else if (action === 'disable') {
            targetStatus = false;
        } else if (action === 'assign_team') {
            // Save the currently selected students so we know who to update
            setStudentsToAssign([...selectedStudents]);
            setIsTeamDialogOpen(true);
            return; // Stop here, the Dialog takes over
        } else if (action === 'edit_section') {
            setStudentsToAssign([...selectedStudents]);
            setIsSectionDialogOpen(true);
            return;
        } else {
            return; // Unknown action
        }

        const originalSelectedStudents = students.filter(s =>
            selectedStudents.includes(s.user_id)
        );

        setStudents(currentStudents =>
            currentStudents.map(student =>
                selectedStudents.includes(student.user_id)
                    ? { ...student, is_enabled: targetStatus }
                    : student
            )
        );

        let failedUpdates = [];
        for (const studentId of selectedStudents) {
            try {
                const response = await fetch(
                    `${process.env.REACT_APP_API_BASE_URL}/api/users/${studentId}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            is_enabled: targetStatus,
                        }),
                    }
                );

                if (!response.ok) {
                    failedUpdates.push(studentId);
                }
            } catch (error) {
                failedUpdates.push(studentId);
                console.error(`Network error updating student ${studentId}:`, error);
            }
        }

        if (failedUpdates.length > 0) {
            alert(`Error: ${failedUpdates.length} student(s) failed to update. Reverting their status.`);

            setStudents(currentStudents =>
                currentStudents.map(student => {
                    if (failedUpdates.includes(student.user_id)) {
                        const originalStudent = originalSelectedStudents.find(
                            s => s.user_id === student.user_id
                        );
                        return originalStudent ? originalStudent : student; // Revert
                    }
                    return student;
                })
            );
        }

        setSelectedStudents([]);
    };

    const numSelected = selectedStudents.length;
    const rowCount = filteredStudents.length;

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
                    maxWidth: "1200px",
                    margin: "40px auto",
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        position: 'relative',
                        marginBottom: 3,
                    }}
                >
                    <IconButton
                        onClick={handleBack}
                        sx={{
                            position: 'absolute',
                            left: 0,
                            color: theme.palette.text.primary,
                        }}
                    >
                        <ArrowBackIosNewIcon />
                    </IconButton>
                    <Typography
                        variant="h4"
                        sx={{
                            flexGrow: 1,
                            textAlign: "center",
                            fontWeight: "bold",
                            color: theme.palette.text.primary,
                        }}
                    >
                        Manage Students
                    </Typography>
                </Box>

                {/* --- SEARCH BAR --- */}
                <Box sx={{ mb: 2, width: '100%' }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Search by name, email, team, sponsor, or section..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>
                {/* --- END OF SEARCH BAR --- */}

                <Box sx={{ display: 'flex', justifyContent: 'center', marginBottom: 2 }}>
                    <ToggleButtonGroup
                        color="primary"
                        value={filterStatus}
                        exclusive
                        onChange={handleFilterChange}
                        aria-label="Filter student status"
                        sx={{
                            '& .MuiToggleButton-root.Mui-selected': {
                                color: '#fff',
                            },
                        }}
                    >
                        <ToggleButton value="all">All</ToggleButton>
                        <ToggleButton value="enabled">Enabled</ToggleButton>
                        <ToggleButton value="disabled">Disabled</ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                {numSelected > 0 && (
                    <Toolbar
                        sx={{
                            mb: 2,
                            borderRadius: 1,
                            bgcolor: (theme) =>
                                alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity),
                        }}
                    >
                        <Typography
                            sx={{ flex: '1 1 100%' }}
                            color="inherit"
                            variant="subtitle1"
                            component="div"
                        >
                            {numSelected} selected
                        </Typography>

                        <Button
                            variant="contained"
                            onClick={handleMenuClick}
                            sx={{ backgroundColor: theme.palette.primary.main }}
                        >
                            Actions
                        </Button>
                        <Menu
                            anchorEl={menuAnchorEl}
                            open={Boolean(menuAnchorEl)}
                            onClose={handleMenuClose}
                        >
                            <MenuItem onClick={() => handleMenuAction('enable')}>Enable Selected</MenuItem>
                            <MenuItem onClick={() => handleMenuAction('disable')}>Disable Selected</MenuItem>
                            <MenuItem onClick={() => handleMenuAction('assign_team')}>Assign Team</MenuItem>
                            <MenuItem onClick={() => handleMenuAction('edit_section')}>Edit Section</MenuItem>
                        </Menu>
                    </Toolbar>
                )}

                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', marginY: 5 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            color="primary"
                                            indeterminate={numSelected > 0 && numSelected < rowCount}
                                            checked={rowCount > 0 && numSelected === rowCount}
                                            onChange={handleSelectAll}
                                            inputProps={{ 'aria-label': 'select all students' }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: "bold", color: theme.palette.text.primary, backgroundColor: theme.palette.background.paper }}>
                                        Name
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: "bold", color: theme.palette.text.primary, backgroundColor: theme.palette.background.paper }}>
                                        Email
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontWeight: "bold", color: theme.palette.text.primary, backgroundColor: theme.palette.background.paper }}>
                                        Team
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontWeight: "bold", color: theme.palette.text.primary, backgroundColor: theme.palette.background.paper }}>
                                        Sponsor
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontWeight: "bold", color: theme.palette.text.primary, backgroundColor: theme.palette.background.paper }}>
                                        Section
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontWeight: "bold", color: theme.palette.text.primary, backgroundColor: theme.palette.background.paper }}>
                                        Enabled
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredStudents.map((student) => {
                                    const isEnabled = student.is_enabled ?? true;
                                    const isItemSelected = isSelected(student.user_id);
                                    const labelId = `student-checkbox-${student.user_id}`;

                                    return (
                                        <TableRow
                                            key={student.user_id}
                                            hover
                                            onClick={(event) => handleSelectOne(event, student.user_id)}
                                            role="checkbox"
                                            aria-checked={isItemSelected}
                                            tabIndex={-1}
                                            selected={isItemSelected}
                                            sx={{ cursor: 'pointer' }}
                                        >
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    color="primary"
                                                    checked={isItemSelected}
                                                    inputProps={{ 'aria-labelledby': labelId }}
                                                />
                                            </TableCell>

                                            <TableCell component="th" id={labelId} scope="row" sx={{ color: theme.palette.text.primary }}>
                                                {student.name}
                                            </TableCell>
                                            <TableCell sx={{ color: theme.palette.text.primary }}>
                                                {student.email}
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                sx={{ color: theme.palette.text.primary }}
                                            >
                                                {student.team_name || "N/A"}
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                sx={{ color: theme.palette.text.primary }}
                                            >
                                                {student.sponsor || "N/A"}
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                sx={{ color: theme.palette.text.primary }}
                                            >
                                                {student.section || "N/A"}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Switch
                                                    checked={isEnabled}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={() => handleToggleEnabled(student)}
                                                    color={isEnabled ? "success" : "error"}
                                                    inputProps={{ "aria-label": `toggle ${student.name}` }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Box>
            <Dialog
                open={isTeamDialogOpen}
                onClose={() => !isAssigning && setIsTeamDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Assign Team</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 3 }}>
                        Select a team to assign to the {studentsToAssign.length} selected student(s).
                    </DialogContentText>
                    <FormControl fullWidth>
                        <InputLabel id="team-select-label">Team</InputLabel>
                        <Select
                            labelId="team-select-label"
                            value={selectedTeamId}
                            label="Team"
                            onChange={(e) => setSelectedTeamId(e.target.value)}
                            disabled={isAssigning}
                        >
                            {teams.map((team) => (
                                <MenuItem key={team.team_id} value={team.team_id}>
                                    {team.team_name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setIsTeamDialogOpen(false)}
                        disabled={isAssigning}
                        sx={{ color: theme.palette.text.secondary }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleAssignTeamSubmit}
                        disabled={!selectedTeamId || isAssigning}
                    >
                        {isAssigning ? <CircularProgress size={24} color="inherit" /> : "Assign"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* --- EDIT SECTION DIALOG --- */}
            <Dialog
                open={isSectionDialogOpen}
                onClose={() => !isAssigningSection && setIsSectionDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Edit Section</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 3 }}>
                        Enter the new section number for the {studentsToAssign.length} selected student(s).
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="section"
                        label="Section Number"
                        type="text" // Keep as text to prevent the up/down arrows, but enforce numbers via regex
                        fullWidth
                        variant="outlined"
                        value={selectedSection}
                        onChange={(e) => {
                            const value = e.target.value;
                            // Only update state if the value is empty OR contains only numbers
                            if (value === '' || /^[0-9]+$/.test(value)) {
                                setSelectedSection(value);
                            }
                        }}
                        disabled={isAssigningSection}
                        slotProps={{
                            htmlInput: {
                                inputMode: 'numeric',
                                pattern: '[0-9]*',
                                maxLength: 10 // Optional: prevent absurdly long section numbers
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setIsSectionDialogOpen(false)}
                        disabled={isAssigningSection}
                        sx={{ color: theme.palette.text.secondary }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleEditSectionSubmit}
                        disabled={!selectedSection.trim() || isAssigningSection}
                    >
                        {isAssigningSection ? <CircularProgress size={24} color="inherit" /> : "Save Section"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ManageStudents;