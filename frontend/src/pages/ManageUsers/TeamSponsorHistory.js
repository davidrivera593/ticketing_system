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
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { useNavigate, useSearchParams } from "react-router-dom";

const TeamSponsorHistory = () => {
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const token = Cookies.get("token");
    const theme = useTheme();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const teamId = searchParams.get("team_id");
    const teamName = searchParams.get("team_name") || `Team ${teamId}`;

    useEffect(() => {
        if (!teamId) {
            setError("No team specified.");
            setIsLoading(false);
            return;
        }

        const fetchHistory = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(
                    `${process.env.REACT_APP_API_BASE_URL}/api/teams/${teamId}/sponsor-history`,
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!response.ok) throw new Error("Failed to fetch sponsor history.");
                const data = await response.json();
                setHistory(data);
            } catch (err) {
                console.error("Failed to load sponsor history:", err);
                setError("Could not load sponsor history.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, [teamId, token]);

    const formatDate = (dateString) => {
        if (!dateString) return "—";
        return new Date(dateString).toLocaleString();
    };

    const cellChanged = (oldVal, newVal) =>
        (oldVal || "") !== (newVal || "")
            ? { backgroundColor: theme.palette.action.selected }
            : {};

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
                    maxWidth: "1100px",
                    margin: "40px auto",
                }}
            >
                {/* Header */}
                <Box sx={{ display: "flex", alignItems: "center", position: "relative", marginBottom: 4 }}>
                    <IconButton
                        onClick={() => navigate(-1)}
                        sx={{ position: "absolute", left: 0, color: theme.palette.text.primary }}
                    >
                        <ArrowBackIosNewIcon />
                    </IconButton>
                    <Typography
                        variant="h5"
                        sx={{ flexGrow: 1, textAlign: "center", fontWeight: "bold", color: theme.palette.text.primary }}
                    >
                        Sponsor History — {teamName}
                    </Typography>
                </Box>

                {isLoading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", marginY: 8 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Typography align="center" color="error" sx={{ py: 4 }}>
                        {error}
                    </Typography>
                ) : (
                    <TableContainer
                        component={Paper}
                        sx={{ boxShadow: "none", border: `1px solid ${theme.palette.divider}` }}
                    >
                        <Table size="small">
                            <TableHead sx={{ backgroundColor: theme.palette.action.hover }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: "bold" }}>Date &amp; Time</TableCell>
                                    <TableCell sx={{ fontWeight: "bold" }}>Changed By</TableCell>
                                    <TableCell sx={{ fontWeight: "bold" }}>Old Sponsor Name</TableCell>
                                    <TableCell sx={{ fontWeight: "bold" }}>New Sponsor Name</TableCell>
                                    <TableCell sx={{ fontWeight: "bold" }}>Old Sponsor Email</TableCell>
                                    <TableCell sx={{ fontWeight: "bold" }}>New Sponsor Email</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {history.length > 0 ? (
                                    history.map((row) => (
                                        <TableRow key={row.id} hover>
                                            <TableCell sx={{ color: theme.palette.text.secondary, whiteSpace: "nowrap" }}>
                                                {formatDate(row.changed_at)}
                                            </TableCell>
                                            <TableCell>
                                                {row.changedBy
                                                    ? `${row.changedBy.name} (${row.changedBy.email})`
                                                    : "System"}
                                            </TableCell>
                                            <TableCell sx={cellChanged(row.old_sponsor_name, row.new_sponsor_name)}>
                                                {row.old_sponsor_name || <em style={{ color: theme.palette.text.disabled }}>none</em>}
                                            </TableCell>
                                            <TableCell sx={cellChanged(row.old_sponsor_name, row.new_sponsor_name)}>
                                                {row.new_sponsor_name || <em style={{ color: theme.palette.text.disabled }}>none</em>}
                                            </TableCell>
                                            <TableCell sx={cellChanged(row.old_sponsor_email, row.new_sponsor_email)}>
                                                {row.old_sponsor_email || <em style={{ color: theme.palette.text.disabled }}>none</em>}
                                            </TableCell>
                                            <TableCell sx={cellChanged(row.old_sponsor_email, row.new_sponsor_email)}>
                                                {row.new_sponsor_email || <em style={{ color: theme.palette.text.disabled }}>none</em>}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 4, color: theme.palette.text.secondary }}>
                                            No sponsor changes have been recorded for this team.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Box>
        </Box>
    );
};

export default TeamSponsorHistory;
