import React, { useEffect, useState } from "react";
import { Box, Typography, Avatar, Button, CircularProgress, Menu, MenuItem, TextField } from "@mui/material";
import ArticleIcon from "@mui/icons-material/Article";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import TicketsViewController from "../../components/TicketsViewController";
import TaTicketsViewController from "../../components/TaTicketsViewController";
import Pagination from "../../components/Pagination/Pagination";

import TicketCard from "../../components/TicketCard";
import TaTicketCard from "../../components/TaTicketCard";

const baseURL = process.env.REACT_APP_API_BASE_URL;

export default function EscalatedTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [activeFilters, setActiveFilters] = useState({
    sort: null,
    status: null,
    source: null,
    search: "",
    teamNameSearch: "",
  });
  const [hideResolved, setHideResolved] = useState(true);

  const [serverFilters, setServerFilters] = useState({
    sort: null,
    status: null,
  });

  const [studentCurrentPage, setStudentCurrentPage] = useState(1);
  const [studentItemsPerPage, setStudentItemsPerPage] = useState(10);
  const [studentPagination, setStudentPagination] = useState({
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });

  const [taCurrentPage, setTaCurrentPage] = useState(1);
  const [taItemsPerPage, setTaItemsPerPage] = useState(10);
  const [taPagination, setTaPagination] = useState({
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });

  const [studentTickets, setStudentTickets] = useState([]);
  const [taTickets, setTaTickets] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const savedFilters = sessionStorage.getItem('escalatedTickets_filters');
    if (savedFilters) {
      const filters = JSON.parse(savedFilters);
      setActiveFilters(filters.activeFilters || {
        sort: null,
        status: null,
        source: null,
        search: "",
        teamNameSearch: "",
      });
      setHideResolved(filters.hideResolved ?? true);
      setServerFilters(filters.serverFilters || {
        sort: null,
        status: null,
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
        if (!userId) {
            console.warn("Ticket object is missing a valid ID.", ticket);
            return "Unknown Name";
        }
        try {
            const token = Cookies.get("token");
            const res = await fetch(`${baseURL}/api/users/${userId}`, {
                method: "GET",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                console.warn(`Failed to fetch user name for ID: ${userId}`);
                return "Unknown Name";
            }
            const data = await res.json();
            return data.name;
        } catch (error) {
            console.error(`Error fetching name for ID ${userId}:`, error);
            return "Unknown Name";
        }
    };

  const fetchTeamNameFromId = async (team_id) => {
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
        console.warn(`Failed to fetch user name for team_id=${team_id} (status ${res.status})`);
        return "Unknown";
      }

      const data = await res.json();
      return data?.team_name || "Unknown";
    } catch (error) {
      console.error(`Error fetching name for team_id=${team_id}:`, error);
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
        limit: studentItemsPerPage.toString()
      });
      
      const taParams = new URLSearchParams({
        page: taCurrentPage.toString(),
        limit: taItemsPerPage.toString()
      });

      studentParams.append('status', 'escalated');
      taParams.append('status', 'escalated');
      
      if (serverFilters.sort) {
        studentParams.append('sort', serverFilters.sort);
        taParams.append('sort', serverFilters.sort);
      }
      
      if (hideResolved) {
        studentParams.append('hideResolved', 'true');
        taParams.append('hideResolved', 'true');
      }

      // Get paginated student tickets
      const studentTicketsResponse = await fetch(`${baseURL}/api/tickets?${studentParams}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      // Get paginated TA tickets
      const taTicketsResponse = await fetch(`${baseURL}/api/tatickets?${taParams}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!studentTicketsResponse.ok || !taTicketsResponse.ok) {
        throw new Error("Failed to fetch one or more ticket lists");
      }

      const studentTicketsData = await studentTicketsResponse.json();
      const taTicketsDataRaw = await taTicketsResponse.json();
      
      // Handle both old format (array) and new format (object with pagination)
      const studentTicketsRaw = studentTicketsData.tickets || studentTicketsData;
      const taTicketsRaw = taTicketsDataRaw.tickets || taTicketsDataRaw;

      const sourcedStudentTickets = studentTicketsRaw.map(ticket => ({ ...ticket, source: 'regular' }));
      const sourcedTaTickets = taTicketsRaw.map(ticket => ({ ...ticket, source: 'ta' }));

      // Add user and team names to student tickets
      const studentTicketsWithNames = await Promise.all(
        sourcedStudentTickets.map(async (ticket) => {
          const userName = await fetchUserNameForTicket(ticket);
          const teamName = await fetchTeamNameFromId(ticket.team_id);
          return { ...ticket, userName, teamName };
        })
      );

      // Add user and team names to TA tickets
      const taTicketsWithNames = await Promise.all(
        sourcedTaTickets.map(async (ticket) => {
          const userName = await fetchUserNameForTicket(ticket);
          const teamName = await fetchTeamNameFromId(ticket.team_id);
          return { ...ticket, userName, teamName };
        })
      );

      // Set separate ticket arrays
      setStudentTickets(studentTicketsWithNames);
      setTaTickets(taTicketsWithNames);
      
      // Combine for backward compatibility
      const allTicketsData = [...studentTicketsWithNames, ...taTicketsWithNames];
      setTickets(allTicketsData);
      
      // Set separate pagination info
      setStudentPagination(studentTicketsData.pagination || {
        totalItems: studentTicketsRaw.length,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false
      });

      // Set TA pagination info
      setTaPagination(taTicketsDataRaw.pagination || {
        totalItems: taTicketsRaw.length,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false
      });

      // Calculate total count for display
      const studentTotal = studentTicketsData.pagination ? studentTicketsData.pagination.totalItems : studentTicketsRaw.length;
      const taTotal = taTicketsDataRaw.pagination ? taTicketsDataRaw.pagination.totalItems : taTicketsRaw.length;
      setCount(studentTotal + taTotal);
      
    } catch (error) {
      console.error("Error fetching escalated tickets:", error);
      setStudentTickets([]);
      setTaTickets([]);
      setTickets([]);
      setCount(0);
      setStudentPagination({
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false
      });
      setTaPagination({
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [tickets, activeFilters.search, activeFilters.teamNameSearch, activeFilters.source]);

  const applyFilters = () => {
    let filteredStudentTickets = [...studentTickets];
    
    let filteredTaTickets = [...taTickets];

    const applyFiltersToArray = (ticketArray) => {
      let filtered = [...ticketArray];

      if (activeFilters.search) {
        filtered = filtered.filter((ticket) =>
          ticket.userName
            ?.toLowerCase()
            .includes(activeFilters.search.toLowerCase())
        );
      }

      if (activeFilters.ticketIdSearch) {
        filtered = filtered.filter(
          (ticket) => ticket.ticket_id.toString() === activeFilters.ticketIdSearch
        );
      }

      if (activeFilters.teamNameSearch) {
        filtered = filtered.filter((ticket) =>
          ticket.teamName
            ?.toLowerCase()
            .includes(activeFilters.teamNameSearch.toLowerCase())
        );
      }

      return filtered;
    };

    // Apply filters to both ticket types
    filteredStudentTickets = applyFiltersToArray(studentTickets);
    filteredTaTickets = applyFiltersToArray(taTickets);

    if (activeFilters.source) {
      if (activeFilters.source === 'student') {
        filteredTaTickets = []; 
      } else if (activeFilters.source === 'ta') {
        filteredStudentTickets = [];
      }
    }

    // Combine for overall filtered tickets (for backward compatibility)
    const allFiltered = [...filteredStudentTickets, ...filteredTaTickets];
    setFilteredTickets(allFiltered);
  };

  useEffect(() => {
    if (activeFilters.status && activeFilters.status.toLowerCase() === "resolved") {
      setHideResolved(false);
    }
  }, [activeFilters.status]);

  const handleFilterClick = (event) => {
    setFilterAnchor(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchor(null);
  };

  const handleClearFilters = () => {
    setActiveFilters({ sort: null, status: null, source: null, search: "", teamNameSearch: "" });
    setServerFilters({ sort: null, status: null });
  };

  const openTicket = (t) => navigate(`/ticketinfo?ticket=${t.ticket_id}`);

  const handleStudentPageChange = (newPage) => {
    setStudentCurrentPage(newPage);
  };

  const handleStudentItemsPerPageChange = (newItemsPerPage) => {
    setStudentCurrentPage(1); 
    setStudentItemsPerPage(newItemsPerPage);
  };

  const handleTaPageChange = (newPage) => {
    setTaCurrentPage(newPage);
  };

  const handleTaItemsPerPageChange = (newItemsPerPage) => {
    setTaCurrentPage(1); 
    setTaItemsPerPage(newItemsPerPage);
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
            <Typography variant="h6">Escalated Tickets</Typography>
            <Typography variant="body2" color="text.secondary">
              {count} escalated
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField
            label="Search by Name"
            variant="outlined"
            value={activeFilters.search}
            onChange={(e) =>
              setActiveFilters({ ...activeFilters, search: e.target.value })
            }
            size="small"
          />
          <TextField
            label="Search by Team Name"
            variant="outlined"
            value={activeFilters.teamNameSearch}
            onChange={(e) =>
              setActiveFilters({ ...activeFilters, teamNameSearch: e.target.value })
            }
            size="small"
          />
          <Button variant="contained" onClick={handleFilterClick}>
            {activeFilters.sort || activeFilters.status
              ? `Filters: ${activeFilters.sort || ""} ${activeFilters.status || ""}`
              : "Add Filter"}
          </Button>
          <Button variant="outlined" onClick={handleClearFilters}>
            Clear Filters
          </Button>
          <Button variant="outlined" onClick={() => setHideResolved((p) => !p)}>
            {hideResolved ? "Include Resolved Tickets" : "Hide Resolved Tickets"}
          </Button>
          <Button variant="contained" onClick={() => navigate(-1)}>Back</Button>
        </Box>
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
          {/* Render Student Tickets Section */}
          {(!activeFilters.source || activeFilters.source === 'student') && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Escalated Student Tickets ({studentPagination.totalItems} total)
              </Typography>
              {studentTickets.length > 0 ? (
                <>
                  <TicketsViewController
                    tickets={studentTickets.filter(ticket => {
                      let show = true;
                      if (activeFilters.search) show = show && ticket.userName?.toLowerCase().includes(activeFilters.search.toLowerCase());
                      if (activeFilters.teamNameSearch) show = show && ticket.teamName?.toLowerCase().includes(activeFilters.teamNameSearch.toLowerCase());
                      return show;
                    })}
                    defaultView="list"
                    onOpenTicket={(t) => navigate(`/ticketinfo?ticket=${t.ticket_id}`)}
                  />
                  {/* Student Tickets Pagination */}
                  {studentPagination.totalPages > 1 && (
                    <Box sx={{ mt: 2 }}>
                      <Pagination
                        currentPage={studentCurrentPage}
                        totalPages={studentPagination.totalPages}
                        onPageChange={handleStudentPageChange}
                        itemsPerPage={studentItemsPerPage}
                        hasNextPage={studentPagination.hasNextPage}
                        hasPreviousPage={studentPagination.hasPreviousPage}
                        onItemsPerPageChange={handleStudentItemsPerPageChange}
                        totalItems={studentPagination.totalItems}
                      />
                    </Box>
                  )}
                </>
              ) : (
                <Typography>No escalated student tickets to display.</Typography>
              )}
            </Box>
          )}

          {/* Render TA Tickets Section */}
          {(!activeFilters.source || activeFilters.source === 'ta') && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Escalated TA Tickets ({taPagination.totalItems} total)
              </Typography>
              {taTickets.length > 0 ? (
                <>
                  <TaTicketsViewController
                    tickets={taTickets.filter(ticket => {
                      let show = true;
                      if (activeFilters.search) show = show && ticket.userName?.toLowerCase().includes(activeFilters.search.toLowerCase());
                      if (activeFilters.teamNameSearch) show = show && ticket.teamName?.toLowerCase().includes(activeFilters.teamNameSearch.toLowerCase());
                      return show;
                    })}
                    defaultView="list"
                    onOpenTicket={(t) => navigate(`/taticketinfo?ticket=${t.ticket_id}`)}
                  />
                  {/* TA Tickets Pagination */}
                  {taPagination.totalPages > 1 && (
                    <Box sx={{ mt: 2 }}>
                      <Pagination
                        currentPage={taCurrentPage}
                        totalPages={taPagination.totalPages}
                        onPageChange={handleTaPageChange}
                        itemsPerPage={taItemsPerPage}
                        hasNextPage={taPagination.hasNextPage}
                        hasPreviousPage={taPagination.hasPreviousPage}
                        onItemsPerPageChange={handleTaItemsPerPageChange}
                        totalItems={taPagination.totalItems}
                      />
                    </Box>
                  )}
                </>
              ) : (
                <Typography>No escalated TA tickets to display.</Typography>
              )}
            </Box>
          )}

          {/* Display a message if no tickets match the filters */}
          {studentTickets.length === 0 && taTickets.length === 0 && (
            <Typography>No escalated tickets match the current filters.</Typography>
          )}
        </Box>      <Menu anchorEl={filterAnchor} open={Boolean(filterAnchor)} onClose={handleFilterClose}>
        {/* Sort: Newest */}
        <MenuItem
          onClick={() => {
            const newSort = activeFilters.sort === "newest" ? null : "newest";
            setActiveFilters({ ...activeFilters, sort: newSort });
            setServerFilters({ ...serverFilters, sort: newSort });
            handleFilterClose();
          }}
        >
          {activeFilters.sort === "newest" && <span style={{ marginRight: 8 }}>✔</span>}
          Newest
        </MenuItem>

        {/* Sort: Oldest */}
        <MenuItem
          onClick={() => {
            const newSort = activeFilters.sort === "oldest" ? null : "oldest";
            setActiveFilters({ ...activeFilters, sort: newSort });
            setServerFilters({ ...serverFilters, sort: newSort });
            handleFilterClose();
          }}
        >
          {activeFilters.sort === "oldest" && <span style={{ marginRight: 8 }}>✔</span>}
          Oldest
        </MenuItem>

        {/* Sort: ID Ascending */}
        <MenuItem
          onClick={() => {
            const newSort = activeFilters.sort === "id-asc" ? null : "id-asc";
            setActiveFilters({ ...activeFilters, sort: newSort });
            setServerFilters({ ...serverFilters, sort: newSort });
            handleFilterClose();
          }}
        >
          {activeFilters.sort === "id-asc" && <span style={{ marginRight: 8 }}>✔</span>}
          Sort by ID: Ascending
        </MenuItem>

        {/* Sort: ID Descending */}
        <MenuItem
          onClick={() => {
            const newSort = activeFilters.sort === "id-desc" ? null : "id-desc";
            setActiveFilters({ ...activeFilters, sort: newSort });
            setServerFilters({ ...serverFilters, sort: newSort });
            handleFilterClose();
          }}
        >
          {activeFilters.sort === "id-desc" && <span style={{ marginRight: 8 }}>✔</span>}
          Sort by ID: Descending
        </MenuItem>

        {/* Status: New */}
        <MenuItem
          onClick={() => {
            const newStatus = activeFilters.status === "New" ? null : "New";
            setActiveFilters({ ...activeFilters, status: newStatus });
            setServerFilters({ ...serverFilters, status: newStatus });
            handleFilterClose();
          }}
        >
          {activeFilters.status === "New" && <span style={{ marginRight: 8 }}>✔</span>}
          Status: New
        </MenuItem>

        {/* Status: Ongoing */}
        <MenuItem
          onClick={() => {
            const newStatus = activeFilters.status === "Ongoing" ? null : "Ongoing";
            setActiveFilters({ ...activeFilters, status: newStatus });
            setServerFilters({ ...serverFilters, status: newStatus });
            handleFilterClose();
          }}
        >
          {activeFilters.status === "Ongoing" && <span style={{ marginRight: 8 }}>✔</span>}
          Status: Ongoing
        </MenuItem>

        {/* Status: Resolved */}
        <MenuItem
          onClick={() => {
            const newStatus = activeFilters.status === "Resolved" ? null : "Resolved";
            setActiveFilters({ ...activeFilters, status: newStatus });
            setServerFilters({ ...serverFilters, status: newStatus });
            handleFilterClose();
          }}
        >
          {activeFilters.status === "Resolved" && <span style={{ marginRight: 8 }}>✔</span>}
          Status: Resolved
        </MenuItem>
          {/* New MenuItems for source filter */}
          <MenuItem
              onClick={() => {
                  if(activeFilters.source === "student"){
                      setActiveFilters({ ...activeFilters, source: null});
                  } else {
                      setActiveFilters({ ...activeFilters, source: "Student"});
                  }
                  handleFilterClose();
              }}
          >
              {activeFilters.source === "student" && <span style={{ marginRight: 8 }}>✔</span>}
              Source: Student
          </MenuItem>
          <MenuItem
              onClick={() => {
                  setActiveFilters({ ...activeFilters, source: activeFilters.source === "ta" ? null : "ta" });
                  handleFilterClose();
              }}
          >
              {activeFilters.source === "ta" && <span style={{ marginRight: 8 }}>✔</span>}
              Source: TA
          </MenuItem>
      </Menu>
    </Box>
  );
}
