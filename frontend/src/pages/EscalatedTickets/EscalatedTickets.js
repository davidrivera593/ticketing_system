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
    source: null,
    search: "",
    teamNameSearch: "",
    escalatedBy: null,
};

const defaultServerFilters = {
    sort: null,
    status: null,
    escalatedBy: null,
};

export default function EscalatedTickets() {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filterAnchor, setFilterAnchor] = useState(null);

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
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const savedFilters = sessionStorage.getItem('escalatedTickets_filters');
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
      hideResolved,
      serverFilters,
      studentCurrentPage,
      studentItemsPerPage,
      taCurrentPage,
      taItemsPerPage,
    };
    sessionStorage.setItem('escalatedTickets_filters', JSON.stringify(filters));
  }, [activeFilters, hideResolved, serverFilters, studentCurrentPage, studentItemsPerPage, taCurrentPage, taItemsPerPage, isInitialized]);

    // helper: get student name for avatar/title
    const fetchUserNameForTicket = async (ticket) => {
        const userId = ticket.source === 'ta' ? ticket.ta_id : ticket.student_id;
        if (!userId) return "Unknown Name";
        try {
            const token = Cookies.get("token");
            const res = await fetch(`${baseURL}/api/users/${userId}`, {
                method: "GET",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            return data.name;
        } catch (error) {
            return "Unknown Name";
        }
    };

    const fetchTeamNameFromId = async (team_id) => {
        try {
            const token = Cookies.get("token");
            const res = await fetch(`${baseURL}/api/teams/${team_id}`, {
                method: "GET",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            return data?.team_name || "Unknown";
        } catch (error) {
            return "Unknown";
        }
    };

  // Fetch escalated tickets with server-side pagination  
  useEffect(() => {
    if (!isInitialized) return;
    fetchTickets();
  }, [studentCurrentPage, studentItemsPerPage, taCurrentPage, taItemsPerPage, serverFilters, hideResolved, isInitialized]);

    useEffect(() => {
        setStudentCurrentPage(1);
        setTaCurrentPage(1);
    }, [serverFilters, hideResolved]);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const token = Cookies.get("token");

            const studentParams = new URLSearchParams({
                page: studentCurrentPage.toString(),
                limit: studentItemsPerPage.toString(),
                status: 'escalated'
            });

            const taParams = new URLSearchParams({
                page: taCurrentPage.toString(),
                limit: taItemsPerPage.toString(),
                status: 'escalated'
            });

            // Append escalatedBy filter to the query
            if (serverFilters.escalatedBy) {
                studentParams.append('escalatedBy', serverFilters.escalatedBy);
                taParams.append('escalatedBy', serverFilters.escalatedBy);
            }

            if (serverFilters.sort) {
                studentParams.append('sort', serverFilters.sort);
                taParams.append('sort', serverFilters.sort);
            }

            if (hideResolved) {
                studentParams.append('hideResolved', 'true');
                taParams.append('hideResolved', 'true');
            }

            const [studentRes, taRes] = await Promise.all([
                fetch(`${baseURL}/api/tickets?${studentParams}`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`${baseURL}/api/tatickets?${taParams}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
            ]);

            const studentData = await studentRes.json();
            const taData = await taRes.json();

            const studentRaw = studentData.tickets || studentData;
            const taRaw = taData.tickets || taData;

            const sWithNames = await Promise.all(studentRaw.map(async (t) => ({
                ...t, source: 'regular', userName: await fetchUserNameForTicket({...t, source: 'regular'}), teamName: await fetchTeamNameFromId(t.team_id)
            })));

            const tWithNames = await Promise.all(taRaw.map(async (t) => ({
                ...t, source: 'ta', userName: await fetchUserNameForTicket({...t, source: 'ta'}), teamName: await fetchTeamNameFromId(t.team_id)
            })));

            setStudentTickets(sWithNames);
            setTaTickets(tWithNames);
            setCount((studentData.pagination?.totalItems || studentRaw.length) + (taData.pagination?.totalItems || taRaw.length));

            setStudentPagination(studentData.pagination || studentPagination);
            setTaPagination(taData.pagination || taPagination);

        } catch (error) {
            console.error("Error fetching tickets:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterClick = (event) => setFilterAnchor(event.currentTarget);
    const handleFilterClose = () => setFilterAnchor(null);

    const handleClearFilters = () => {
        setActiveFilters(defaultActiveFilters);
        setServerFilters(defaultServerFilters);
    };

    if (loading) return <Box sx={{ p: 4, display: "grid", placeItems: "center" }}><CircularProgress /></Box>;

    return (
        <Box sx={{ display: "grid", gap: 3, p: 3 }}>
            {/* Header */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "background.paper", border: "1px solid", borderColor: "divider", p: 2, borderRadius: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar><ArticleIcon /></Avatar>
                    <Box>
                        <Typography variant="h6">Escalated Tickets (Coordinators)</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {count} {activeFilters.escalatedBy ? `escalated by ${activeFilters.escalatedBy}s` : "total escalated"}
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <Button variant="contained" onClick={handleFilterClick}>
                        {activeFilters.escalatedBy ? `Escalated By: ${activeFilters.escalatedBy.toUpperCase()}` : "Filters"}
                    </Button>
                    <Button variant="outlined" onClick={handleClearFilters}>Clear</Button>
                    <Button variant="contained" onClick={() => navigate(-1)}>Back</Button>
                </Box>
            </Box>

            {/* Ticket List Containers */}
            <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", p: 2, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Student Tickets</Typography>
                <TicketsViewController tickets={studentTickets} onOpenTicket={(t) => navigate(`/ticketinfo?ticket=${t.ticket_id}`)} />
                <Pagination currentPage={studentCurrentPage} totalPages={studentPagination.totalPages} onPageChange={setStudentCurrentPage} totalItems={studentPagination.totalItems} onItemsPerPageChange={setStudentItemsPerPage} />

                <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>TA Tickets</Typography>
                <TaTicketsViewController tickets={taTickets} onOpenTicket={(t) => navigate(`/taticketinfo?ticket=${t.ticket_id}`)} />
                <Pagination currentPage={taCurrentPage} totalPages={taPagination.totalPages} onPageChange={setTaCurrentPage} totalItems={taPagination.totalItems} onItemsPerPageChange={setTaItemsPerPage} />
            </Box>

            {/* Filter Menu */}
            <Menu anchorEl={filterAnchor} open={Boolean(filterAnchor)} onClose={handleFilterClose}>
                <MenuItem onClick={() => { setServerFilters({...serverFilters, sort: 'newest'}); handleFilterClose(); }}>Newest First</MenuItem>
                <MenuItem onClick={() => { setServerFilters({...serverFilters, sort: 'oldest'}); handleFilterClose(); }}>Oldest First</MenuItem>

                <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #eee' }} />

                {/* TA Filter */}
                <MenuItem onClick={() => {
                    const val = activeFilters.escalatedBy === 'ta' ? null : 'ta';
                    setActiveFilters({...activeFilters, escalatedBy: val});
                    setServerFilters({...serverFilters, escalatedBy: val});
                    handleFilterClose();
                }}>
                    {activeFilters.escalatedBy === 'ta' && "✔ "} Escalated by TAs
                </MenuItem>

                {/* Grader Filter */}
                <MenuItem onClick={() => {
                    const val = activeFilters.escalatedBy === 'grader' ? null : 'grader';
                    setActiveFilters({...activeFilters, escalatedBy: val});
                    setServerFilters({...serverFilters, escalatedBy: val});
                    handleFilterClose();
                }}>
                    {activeFilters.escalatedBy === 'grader' && "✔ "} Escalated by Graders
                </MenuItem>
            </Menu>
        </Box>
    );
}