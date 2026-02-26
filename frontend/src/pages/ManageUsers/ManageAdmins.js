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
    IconButton,
    Button,
    TextField,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { useNavigate } from "react-router-dom";
// Note: This still uses ConfirmTADelete, assuming it's a generic user delete modal
import ConfirmTADelete from "../../components/ConfirmTADelete/ConfirmTADelete";
import {generateRandomPassword} from "../../services/generateRandomPass";

const ManageAdmins = () => {
    // Master list of all Admins from API
    const [admins, setAdmins] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const token = Cookies.get("token");
    const theme = useTheme();
    const navigate = useNavigate();

    // State for delete modal
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [idNameMap, setIdToNameMap] = useState({});
    const [deleteStatus, setDeleteStatus] = useState(false);

    // Add state for new Admin inputs
    const [newAdminName, setNewAdminName] = useState("");
    const [newAdminEmail, setNewAdminEmail] = useState("");

    // Add deleteStatus to dependency array to refresh list
    useEffect(() => {
        fetchAdmins();
    }, [deleteStatus]);

    // Helper function to create ID-to-Name map
    const convertToMap = (list) => {
        return list.reduce((acc, obj) => {
            //map ID to name
            acc[obj.user_id] = obj.name;
            return acc;
        }, {});
    };

    const fetchAdmins = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_BASE_URL}/api/users/role/admin`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) throw new Error("Failed to fetch Admins.");
            const data = await response.json();
            setAdmins(data); // Set the master Admin list

            // Create the map for the delete modal
            const idToNameMap = convertToMap(data);
            setIdToNameMap(idToNameMap);
        } catch (error) {
            console.error("Failed to load Admins:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Add encryptPassword and addAdmin functions
    const encryptPassword = async (password) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/encrypt`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ password }),
                }
            );

            if (!response.ok) throw new Error("Failed to encrypt password.");
            const data = await response.json();
            return data.hashedPassword;

        } catch (error) {
            console.error(error);
        }
    }

    const addAdmin = async () => {
        if (!newAdminName.trim()) { //validation check
            alert("Admin name cannot be blank.");
            return;
        }
        if (!newAdminEmail.trim()) { //validation check
            alert("Admin Email name cannot be blank.");
            return;
        }

        const defaultPassword = generateRandomPassword(); //Generates random password
        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_BASE_URL}/api/auth/register`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        name: newAdminName,
                        email: newAdminEmail,
                        role: "admin", // Set role to admin
                        password: defaultPassword, // Default password
                        must_change_password: true
                    }),
                }
            );

            if (!response.ok) throw new Error("Failed to add Admin.");
            setNewAdminName("");
            setNewAdminEmail("");
            fetchAdmins(); // Refresh the list of Admins
        } catch (error) {
            console.error(error);
        }
    };


    const handleBack = () => {
        navigate(-1);
    };

    // Handlers for the delete modal
    const handleDelete = (admin) => {
        setSelectedAdmin(admin);
        setDeleteOpen(true);
    };

    const deletePopupClose = () => {
        setDeleteOpen(false);
        setSelectedAdmin(null); // Clear the selected Admin
    };

    const updateStatus = (status) => {
        setDeleteStatus(status);
    };

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
                    maxWidth: "900px",
                    margin: "40px auto",
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        position: "relative",
                        marginBottom: 3,
                    }}
                >
                    <IconButton
                        onClick={handleBack}
                        sx={{
                            position: "absolute",
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
                        Manage Admins
                    </Typography>
                </Box>

                <Box
                    sx={{
                        marginBottom: 2,
                        backgroundColor: theme.palette.background.paper,
                        borderRadius: "10px",
                        border: `1px solid ${theme.palette.divider}`,
                        padding: 2.5,
                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                    }}
                >
                    <Typography
                        variant="h6"
                        sx={{
                            marginBottom: 2,
                            fontWeight: "bold",
                            color: theme.palette.text.primary
                        }}
                    >
                        Add New Admin
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1.25 }}>
                        <TextField
                            fullWidth
                            value={newAdminName}
                            placeholder="New Admin Name"
                            onChange={(e) => setNewAdminName(e.target.value)}
                            variant="outlined"
                            size="small"
                        />
                        <TextField
                            fullWidth
                            type="email"
                            value={newAdminEmail}
                            placeholder="New Admin Email"
                            onChange={(e) => setNewAdminEmail(e.target.value)}
                            variant="outlined"
                            size="small"
                        />
                        <Button
                            variant="contained"
                            onClick={addAdmin}
                            sx={{ backgroundColor: theme.palette.primary.main, whiteSpace: 'nowrap' }}
                        >
                            Add
                        </Button>
                    </Box>
                </Box>

                {/* Filter buttons and action toolbar removed */}

                {isLoading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", marginY: 5 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell
                                        sx={{
                                            backgroundColor: theme.palette.background.paper,
                                            color: theme.palette.text.primary,
                                            fontWeight: "bold",
                                        }}
                                    >
                                        Name
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            backgroundColor: theme.palette.background.paper,
                                            color: theme.palette.text.primary,
                                            fontWeight: "bold",
                                        }}
                                    >
                                        Email
                                    </TableCell>
                                    {/* Enabled column removed */}
                                    <TableCell
                                        align="right"
                                        sx={{
                                            backgroundColor: theme.palette.background.paper,
                                            color: theme.palette.text.primary,
                                            fontWeight: "bold",
                                        }}
                                    >
                                        Actions
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {/* Map directly over admins, not filteredAdmins */}
                                {admins.map((admin) => {
                                    return (
                                        <TableRow key={admin.user_id}>
                                            <TableCell sx={{ color: theme.palette.text.primary }}>
                                                {admin.name}
                                            </TableCell>
                                            <TableCell sx={{ color: theme.palette.text.primary }}>
                                                {admin.email}
                                            </TableCell>
                                            {/* Enabled switch cell removed */}
                                            <TableCell align="right">
                                                <Button
                                                    variant="outlined"
                                                    onClick={() => handleDelete(admin)}
                                                    sx={{
                                                        color:
                                                            theme.palette.mode === "dark" ? "white" : "black",
                                                        borderColor:
                                                            theme.palette.mode === "dark" ? "white" : "black",
                                                    }}
                                                >
                                                    Delete
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* Add the modal component */}
                {deleteOpen && (
                    <ConfirmTADelete
                        handleOpen={deleteOpen}
                        handleClose={deletePopupClose}
                        ta={selectedAdmin} // Pass the admin object to the 'ta' prop
                        idNameMap={idNameMap}
                        updateStatus={updateStatus}
                    />
                )}
            </Box>
        </Box>
    );
};

export default ManageAdmins;