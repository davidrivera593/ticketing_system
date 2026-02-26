import React, { useEffect, useMemo, useState } from "react";
import { Box, Typography, Avatar, Button, CircularProgress, TextField, Menu, MenuItem } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ArticleIcon from "@mui/icons-material/Article";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import TicketsViewController from "../../components/TicketsViewController";
import Pagination from "../../components/Pagination/Pagination";
import { fetchTicketsByUserId } from "../../services/ticketServices";

const baseURL = process.env.REACT_APP_API_BASE_URL;

export default function MyTickets() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [allTickets, setAllTickets] = useState([]);
  const [tickets, setTickets] = useState([]); 
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });

  const [activeFilters, setActiveFilters] = useState({
    sort: null,
    status: null,
    search: "",
    teamNameSearch: "",
  });
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [hideResolved, setHideResolved] = useState(false);

  const fetchTeamNameFromId = async (team_id) => {
    if (!team_id) return "No Team";
    try {
      const token = Cookies.get("token");
      const res = await fetch(`${baseURL}/api/teams/${team_id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.warn(`Failed to fetch team name for team_id=${team_id}`);
        return "Unknown Team";
      }

      const data = await res.json();
      return data?.team_name || "Unknown Team";
    } catch (error) {
      console.error(`Error fetching team name for team_id=${team_id}:`, error);
      return "Unknown Team";
    }
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      
      // Build filters for server-side filtering (only major filters that require server processing)
      const filters = {};
      if (hideResolved) {
        filters.hideResolved = "true";
      }
      
      const response = await fetchTicketsByUserId(1, 1000, filters);
      
      // Handle both old format (array) and new format (object with pagination)
      const ticketsData = response.tickets || response;

      const enriched = await Promise.all(
        ticketsData.map(async (t) => {
          const teamName = await fetchTeamNameFromId(t.team_id);
          return {
            ...t,
            userName: t.student_name || t.userName || "Unknown", 
            teamName: teamName,
          };
        })
      );

      setAllTickets(enriched);
      setCount(enriched.length); // Use actual count, not server pagination count
      
      // Store for client-side pagination (like StudentDash pattern)
      window.myTicketsAllData = enriched;
    } catch (e) {
      console.error("Error fetching tickets:", e);
      setAllTickets([]);
      setCount(0);
      setPagination({
        totalItems: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [hideResolved]); // ✅ Only server calls for major filters

  useEffect(() => {
    applyFilters();
  }, [allTickets, activeFilters.search, activeFilters.teamNameSearch, activeFilters.sort, activeFilters.status, currentPage, itemsPerPage]);

  useEffect(() => {
    if (activeFilters.status && activeFilters.status.toLowerCase() === "resolved") {
      setHideResolved(false);
    }
  }, [activeFilters.status]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilters, hideResolved]);

  const applyFilters = () => {
    let filtered = [...allTickets];

    // Apply client-side filters
    if (activeFilters.search) {
      filtered = filtered.filter((ticket) =>
        ticket.userName
          ?.toLowerCase()
          .includes(activeFilters.search.toLowerCase())
      );
    }

    if (activeFilters.teamNameSearch) {
      filtered = filtered.filter((ticket) =>
        ticket.teamName
          ?.toLowerCase()
          .includes(activeFilters.teamNameSearch.toLowerCase())
      );
    }

    if (activeFilters.sort) {
      if (activeFilters.sort === "newest") {
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      } else if (activeFilters.sort === "oldest") {
        filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      } else if (activeFilters.sort === "id-asc") {
        filtered.sort((a, b) => a.ticket_id - b.ticket_id);
      } else if (activeFilters.sort === "id-desc") {
        filtered.sort((a, b) => b.ticket_id - a.ticket_id);
      }
    }

    if (activeFilters.status) {
      if (activeFilters.status.toLowerCase() === "escalated") {
        filtered = filtered.filter((ticket) => ticket.escalated === true);
      } else {
        filtered = filtered.filter(
          (ticket) =>
            ticket.status?.toLowerCase() === activeFilters.status.toLowerCase()
        );
      }
    }

    // Apply client-side pagination
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedFiltered = filtered.slice(startIndex, endIndex);

    setPagination({
      totalItems: totalItems,
      totalPages: totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1
    });

    setFilteredTickets(paginatedFiltered);
    setTickets(paginatedFiltered);
  };

  const handleFilterClick = (event) => {
    setFilterAnchor(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchor(null);
  };

  const handleClearFilters = () => {
    setActiveFilters({ sort: null, status: null, search: "", teamNameSearch: "" });
  };

  const openTicket = (t) => navigate(`/ticketinfo?ticket=${t.ticket_id}`);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); 
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "grid", gap: 3, p: 3 }}>
      {/* Header / Stats */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          justifyContent: "space-between",
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          p: 2,
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar><ArticleIcon /></Avatar>
          <Box>
            <Typography variant="h6">My Tickets</Typography>
            <Typography variant="body2" color="text.secondary">
              {count} total • Showing {pagination.totalItems} filtered • Page {currentPage} of {pagination.totalPages || 1}
            </Typography>
          </Box>
        </Box>
        <Button variant="contained" onClick={() => navigate(-1)}>Back</Button>
      </Box>

      {/* Search and Filter Controls */}
      <Box
        sx={{
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          p: 2,
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2.5 }}>
          <TextField
            label="Search by Name"
            variant="outlined"
            value={activeFilters.search}
            onChange={(e) =>
              setActiveFilters({ ...activeFilters, search: e.target.value })
            }
            sx={{ flex: 1 }}
          />
          <TextField
            label="Search by Team Name"
            variant="outlined"
            value={activeFilters.teamNameSearch}
            onChange={(e) =>
              setActiveFilters({ ...activeFilters, teamNameSearch: e.target.value })
            }
            sx={{ flex: 1 }}
          />
          <Button
            variant="contained"
            onClick={handleFilterClick}
            sx={{ backgroundColor: theme.palette.primary.main, color: "white" }}
          >
            {activeFilters.sort || activeFilters.status
              ? `Filters Active`
              : "Add Filter"}
          </Button>
          <Button
            variant="outlined"
            onClick={handleClearFilters}
            sx={{ borderColor: theme.palette.primary.main, color: theme.palette.primary.main }}
          >
            Clear Filters
          </Button>
          <Button
            variant="outlined"
            onClick={() => setHideResolved(prev => !prev)}
            sx={{ borderColor: theme.palette.primary.main, color: theme.palette.primary.main }}
          >
            {hideResolved ? "Include Resolved" : "Hide Resolved"}
          </Button>
        </Box>

        {/* Filter Menu */}
        <Menu anchorEl={filterAnchor} open={Boolean(filterAnchor)} onClose={handleFilterClose}>
          <MenuItem onClick={() => { setActiveFilters({ ...activeFilters, sort: activeFilters.sort === "newest" ? null : "newest" }); handleFilterClose(); }}>
            {activeFilters.sort === "newest" && (<span style={{ marginRight: 8 }}>✔</span>)} Newest
          </MenuItem>
          <MenuItem onClick={() => { setActiveFilters({ ...activeFilters, sort: activeFilters.sort === "oldest" ? null : "oldest" }); handleFilterClose(); }}>
            {activeFilters.sort === "oldest" && (<span style={{ marginRight: 8 }}>✔</span>)} Oldest
          </MenuItem>
          <MenuItem onClick={() => { setActiveFilters({ ...activeFilters, sort: activeFilters.sort === "id-asc" ? null : "id-asc" }); handleFilterClose(); }}>
            {activeFilters.sort === "id-asc" && (<span style={{ marginRight: 8 }}>✔</span>)} ID Ascending
          </MenuItem>
          <MenuItem onClick={() => { setActiveFilters({ ...activeFilters, sort: activeFilters.sort === "id-desc" ? null : "id-desc" }); handleFilterClose(); }}>
            {activeFilters.sort === "id-desc" && (<span style={{ marginRight: 8 }}>✔</span>)} ID Descending
          </MenuItem>
          <MenuItem onClick={() => { setActiveFilters({ ...activeFilters, status: activeFilters.status === "New" ? null : "New" }); handleFilterClose(); }}>
            {activeFilters.status === "New" && (<span style={{ marginRight: 8 }}>✔</span>)} Status: New
          </MenuItem>
          <MenuItem onClick={() => { setActiveFilters({ ...activeFilters, status: activeFilters.status === "Ongoing" ? null : "Ongoing" }); handleFilterClose(); }}>
            {activeFilters.status === "Ongoing" && (<span style={{ marginRight: 8 }}>✔</span>)} Status: Ongoing
          </MenuItem>
          <MenuItem onClick={() => { setActiveFilters({ ...activeFilters, status: activeFilters.status === "Resolved" ? null : "Resolved" }); handleFilterClose(); }}>
            {activeFilters.status === "Resolved" && (<span style={{ marginRight: 8 }}>✔</span>)} Status: Resolved
          </MenuItem>
          <MenuItem onClick={() => { setActiveFilters({ ...activeFilters, status: activeFilters.status === "Escalated" ? null : "Escalated" }); handleFilterClose(); }}>
            {activeFilters.status === "Escalated" && (<span style={{ marginRight: 8 }}>✔</span>)} Status: Escalated
          </MenuItem>
        </Menu>
      </Box>

      {/* Tickets */}
      <Box
        sx={{
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          p: 2,
          borderRadius: 2,
        }}
      >
        <TicketsViewController
          tickets={tickets}
          defaultView="list"
          onOpenTicket={openTicket}
          header={<Typography variant="subtitle2">
            {pagination.totalPages > 1 
              ? `My Tickets (Page ${currentPage} of ${pagination.totalPages})` 
              : "My Tickets"}
          </Typography>}
        />
        
        {/* Pagination Component */}
        <Pagination
          currentPage={currentPage}
          totalItems={pagination.totalItems}
          itemsPerPage={itemsPerPage}
          totalPages={pagination.totalPages}
          hasNextPage={pagination.hasNextPage}
          hasPreviousPage={pagination.hasPreviousPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />

        {/* No tickets message */}
        {tickets.length === 0 && !loading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              {allTickets.length === 0 
                ? "You haven't submitted any tickets yet." 
                : "No tickets match the current filters."}
            </Typography>
            {allTickets.length === 0 && (
              <Button
                variant="contained"
                sx={{ mt: 2 }}
                onClick={() => navigate("/createticket")}
              >
                Create Your First Ticket
              </Button>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
