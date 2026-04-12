import React, { useEffect, useState } from "react";
import { Box, Typography, Avatar, Button, CircularProgress, Menu, MenuItem, TextField } from "@mui/material";
import ArticleIcon from "@mui/icons-material/Article";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import TicketsViewController from "../../components/TicketsViewController";
import TaTicketsViewController from "../../components/TaTicketsViewController";
import Pagination from "../../components/Pagination/Pagination";

const baseURL = process.env.REACT_APP_API_BASE_URL;

const defaultActiveFilters = {
    sort: null,
    status: null,
    search: "",
    teamNameSearch: "",
};

const defaultServerFilters = {
    sort: null,
};

export default function EscalatedTicketsTA() {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);

    // Filtering states
    const [activeFilters, setActiveFilters] = useState(defaultActiveFilters);
    const [serverFilters, setServerFilters] = useState(defaultServerFilters);

    const [hideResolved, setHideResolved] = useState(true);

    // Pagination states
    const [studentCurrentPage, setStudentCurrentPage] = useState(1);
    const [studentItemsPerPage, setStudentItemsPerPage] = useState(10);
    const [studentPagination, setStudentPagination] = useState({
        totalItems: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false
    });

    const [taCurrentPage, setTaCurrentPage] = useState(1);
    const [taItemsPerPage, setTaItemsPerPage] = useState(10);
    const [taPagination, setTaPagination] = useState({
        totalItems: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false
    });

    const [studentTickets, setStudentTickets] = useState([]);
    const [taTickets, setTaTickets] = useState([]);

    // Helpers for names (Note: Backend JOINS are recommended to replace these)
    const fetchUserNameForTicket = async (ticket) => {
        const userId = ticket.source === 'ta' ? ticket.ta_id : ticket.student_id;
        if (!userId) return "Unknown Name";
        try {
            const token = Cookies.get("token");
            const res = await fetch(`${baseURL}/api/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            return data.name || "Unknown Name";
        } catch { return "Unknown Name"; }
    };

    const fetchTeamNameFromId = async (team_id) => {
        try {
            const token = Cookies.get("token");
            const res = await fetch(`${baseURL}/api/teams/${team_id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            return data?.team_name || "Unknown";
        } catch { return "Unknown"; }
    };

    // Main Data Fetching
    const fetchTickets = async () => {
        try {
            setLoading(true);
            const token = Cookies.get("token");

            // Define Query Params
            const studentParams = new URLSearchParams({
                page: studentCurrentPage.toString(),
                limit: studentItemsPerPage.toString(),
                status: 'escalated',
                escalatedBy: 'grader' // <--- FORCE GRADER FILTER
            });

            const taParams = new URLSearchParams({
                page: taCurrentPage.toString(),
                limit: taItemsPerPage.toString(),
                status: 'escalated',
                escalatedBy: 'grader' // <--- FORCE GRADER FILTER
            });

            if (serverFilters.sort) {
                studentParams.append('sort', serverFilters.sort);
                taParams.append('sort', serverFilters.sort);
            }
            if (hideResolved) {
                studentParams.append('hideResolved', 'true');
                taParams.append('hideResolved', 'true');
            }

            const [studentRes, taRes] = await Promise.all([
                fetch(`${baseURL}/api/tickets?${studentParams}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${baseURL}/api/tatickets?${taParams}`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            const studentData = await studentRes.json();
            const taData = await taRes.json();

            const sRaw = studentData.tickets || [];
            const tRaw = taData.tickets || [];

            // Add metadata (User/Team names)
            const sWithNames = await Promise.all(sRaw.map(async t => ({
                ...t, source: 'regular',
                userName: await fetchUserNameForTicket({...t, source: 'regular'}),
                teamName: await fetchTeamNameFromId(t.team_id)
            })));

            const tWithNames = await Promise.all(tRaw.map(async t => ({
                ...t, source: 'ta',
                userName: await fetchUserNameForTicket({...t, source: 'ta'}),
                teamName: await fetchTeamNameFromId(t.team_id)
            })));

            setStudentTickets(sWithNames);
            setTaTickets(tWithNames);
            setStudentPagination(studentData.pagination || studentPagination);
            setTaPagination(taData.pagination || taPagination);
            setCount((studentData.pagination?.totalItems || 0) + (taData.pagination?.totalItems || 0));

        } catch (error) {
            console.error("Error fetching grader escalations:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const savedFilters = sessionStorage.getItem('escalatedTicketsTA_filters');
        if (savedFilters) {
            const filters = JSON.parse(savedFilters);
            setActiveFilters({
                ...defaultActiveFilters,
                ...(filters.activeFilters || {}),
            });
            setHideResolved(filters.hideResolved ?? true);
            setServerFilters({
                ...defaultServerFilters,
                ...(filters.serverFilters || {}),
            });
            setStudentCurrentPage(filters.studentCurrentPage || 1);
            setStudentItemsPerPage(filters.studentItemsPerPage || 10);
            setTaCurrentPage(filters.taCurrentPage || 1);
            setTaItemsPerPage(filters.taItemsPerPage || 10);
        }
        setIsInitialized(true);
    }, []);

    useEffect(() => {
        if (!isInitialized) return;
        const filters = {
            activeFilters,
            serverFilters,
            hideResolved,
            studentCurrentPage,
            studentItemsPerPage,
            taCurrentPage,
            taItemsPerPage,
        };
        sessionStorage.setItem('escalatedTicketsTA_filters', JSON.stringify(filters));
    }, [activeFilters, serverFilters, hideResolved, studentCurrentPage, studentItemsPerPage, taCurrentPage, taItemsPerPage, isInitialized]);

    useEffect(() => {
        if (!isInitialized) return;
        fetchTickets();
    }, [studentCurrentPage, studentItemsPerPage, taCurrentPage, taItemsPerPage, serverFilters, hideResolved, isInitialized]);

    if (loading) return <Box sx={{ p: 4, display: "grid", placeItems: "center" }}><CircularProgress /></Box>;

    return (
        <Box sx={{ display: "grid", gap: 3, p: 3 }}>
            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", bgcolor: "background.paper", p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar><ArticleIcon /></Avatar>
                    <Box>
                        <Typography variant="h6">Grader Escalations</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {count} tickets escalated by graders
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <TextField label="Search Student" size="small" value={activeFilters.search} onChange={(e) => setActiveFilters({...activeFilters, search: e.target.value})} />
                    <Button variant="outlined" onClick={() => setHideResolved(!hideResolved)}>
                        {hideResolved ? "Show Resolved" : "Hide Resolved"}
                    </Button>
                    <Button variant="contained" onClick={() => navigate(-1)}>Back</Button>
                </Box>
            </Box>

            {/* List View */}
            <Box sx={{ bgcolor: "background.paper", p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Student Tickets (Escalated by Graders)</Typography>
                <TicketsViewController
                    tickets={studentTickets.filter(t => t.userName.toLowerCase().includes(activeFilters.search.toLowerCase()))}
                    onOpenTicket={(t) => navigate(`/ticketinfo?ticket=${t.ticket_id}`)}
                />
                <Pagination
                    currentPage={studentCurrentPage}
                    totalPages={studentPagination.totalPages}
                    onPageChange={setStudentCurrentPage}
                    totalItems={studentPagination.totalItems}
                    onItemsPerPageChange={setStudentItemsPerPage}
                />

                <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>TA Tickets (Escalated by Graders)</Typography>
                <TaTicketsViewController
                    tickets={taTickets.filter(t => t.userName.toLowerCase().includes(activeFilters.search.toLowerCase()))}
                    onOpenTicket={(t) => navigate(`/taticketinfo?ticket=${t.ticket_id}`)}
                />
                <Pagination
                    currentPage={taCurrentPage}
                    totalPages={taPagination.totalPages}
                    onPageChange={setTaCurrentPage}
                    totalItems={taPagination.totalItems}
                    onItemsPerPageChange={setTaItemsPerPage}
                />
            </Box>
        </Box>
    );
}