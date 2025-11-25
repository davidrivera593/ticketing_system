import {
  Button,
  CircularProgress,
  Menu,
  MenuItem,
  TextField,
  Typography,
  Box,
  Avatar,
} from "@mui/material";
import ArticleIcon from "@mui/icons-material/Article";
import { useTheme } from "@mui/material/styles";
import Cookies from "js-cookie";
import React, { act, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TicketsViewController from "../../components/TicketsViewController";
import TaTicketsViewController from "../../components/TaTicketsViewController";
import Pagination from "../../components/Pagination/Pagination";

const baseURL = process.env.REACT_APP_API_BASE_URL;

const AllTickets = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalTickets, setTotalTickets] = useState(0);
  const [escalatedTickets, setEscalatedTickets] = useState(0);
  const [openTickets, setOpenTickets] = useState(0);
  const [closedTickets, setClosedTickets] = useState(0);
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [activeFilters, setActiveFilters] = useState({
    sort: null,
    status: null,
    source: null,
    search: "",
    teamNameSearch: "",
  });



  const [hideResolved, setHideResolved] = useState(true);

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

  useEffect(() => {
    fetchTickets();
  }, [hideResolved]);



  useEffect(() => {
    applyFilters();
  }, [tickets, activeFilters.search, activeFilters.teamNameSearch, activeFilters.source, activeFilters.sort, activeFilters.status, hideResolved, studentCurrentPage, studentItemsPerPage, taCurrentPage, taItemsPerPage]);

  useEffect(() => {
    if (activeFilters.status && activeFilters.status.toLowerCase() === "resolved") {
      setHideResolved(false);
    }
  }, [activeFilters.status]);

  const applyFilters = () => {
    let filteredStudentTickets = [...studentTickets];
    
    let filteredTaTickets = [...taTickets];

    const applyFiltersToArray = (ticketArray) => {
      let filtered = [...ticketArray];

      if (activeFilters.search) {
        filtered = filtered.filter((ticket) =>
          ticket.userName
            .toLowerCase()
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
            .toLowerCase()
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
          filtered = filtered.filter(ticket => ticket.escalated === true);
        } else {
          filtered = filtered.filter(ticket => 
            ticket.status?.toLowerCase() === activeFilters.status.toLowerCase()
          );
        }
      }

      return filtered;
    };

    // Apply filters to both ticket types
    filteredStudentTickets = applyFiltersToArray(studentTickets);
    filteredTaTickets = applyFiltersToArray(taTickets);

    // Apply source filter if specified
    if (activeFilters.source) {
      if (activeFilters.source === 'student') {
        filteredTaTickets = []; 
      } else if (activeFilters.source === 'ta') {
        filteredStudentTickets = []; 
      }
    }

    const studentTotalItems = filteredStudentTickets.length;
    const studentTotalPages = Math.ceil(studentTotalItems / studentItemsPerPage);
    const studentStartIndex = (studentCurrentPage - 1) * studentItemsPerPage;
    const studentEndIndex = studentStartIndex + studentItemsPerPage;
    const paginatedStudentTickets = filteredStudentTickets.slice(studentStartIndex, studentEndIndex);

    const taTotalItems = filteredTaTickets.length;
    const taTotalPages = Math.ceil(taTotalItems / taItemsPerPage);
    const taStartIndex = (taCurrentPage - 1) * taItemsPerPage;
    const taEndIndex = taStartIndex + taItemsPerPage;
    const paginatedTaTickets = filteredTaTickets.slice(taStartIndex, taEndIndex);

    setStudentPagination({
      totalItems: studentTotalItems,
      totalPages: studentTotalPages,
      hasNextPage: studentCurrentPage < studentTotalPages,
      hasPreviousPage: studentCurrentPage > 1
    });

    setTaPagination({
      totalItems: taTotalItems, 
      totalPages: taTotalPages,
      hasNextPage: taCurrentPage < taTotalPages,
      hasPreviousPage: taCurrentPage > 1
    });

    // Combine for overall filtered tickets (but use paginated versions for display)
    const allFiltered = [...paginatedStudentTickets, ...paginatedTaTickets];
    setFilteredTickets(allFiltered);
  };

  const handleFilterClick = (event) => {
    setFilterAnchor(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchor(null);
  };

  const handleClearFilters = () => {
    setActiveFilters({ sort: null, status: null, source: null, search: "", teamNameSearch: "" });
  };

    const fetchUserNameForTicket = async (ticket) => {
        // 1. Determine which ID to use based on the ticket's source
        const userId = ticket.source === 'ta' ? ticket.ta_id : ticket.student_id;

        // 2. Handle cases where the ticket might not have an ID
        if (!userId) {
            console.warn("Ticket object is missing a valid ID.", ticket);
            return "Unknown Name";
        }

        try {
            const token = Cookies.get("token");
            // 3. Use the determined userId in the API call
            const response = await fetch(`${baseURL}/api/users/${userId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                console.warn(`Failed to fetch user name for ID: ${userId}`);
                return "Unknown Name";
            }

            const data = await response.json();
            return data.name;
        } catch (error) {
            console.error(`Error fetching name for ID ${userId}:`, error);
            return "Unknown Name";
        }
    };

  const fetchTeamNameFromId = async (team_id) => {
    try {
      const token = Cookies.get("token");
      const response = await fetch(`${baseURL}/api/teams/${team_id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.warn(`Failed to fetch team name for ticket ${team_id}`);
        return "Unknown Name";
      }

      const data = await response.json();
      return data.team_name;
    } catch (error) {
      console.error(`Error fetching name for ticket ${team_id}:`, error);
      return "Unknown Name";
    }
  };

    const fetchTickets = async () => {
        try {          
            setLoading(true);
            
            const token = Cookies.get("token");
            
            const studentParams = new URLSearchParams({
                page: '1',
                limit: '1000'  // Get all tickets (or a very large number)
            });
            
            const taParams = new URLSearchParams({
                page: '1', 
                limit: '1000'  // Get all tickets (or a very large number)
            });
            

            
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
                throw new Error("Failed to fetch tickets");
            }

            const studentTicketsData = await studentTicketsResponse.json();
            const taTicketsDataRaw = await taTicketsResponse.json();
            
            const studentTicketsRaw = studentTicketsData.tickets || studentTicketsData;
            const taTicketsRaw = taTicketsDataRaw.tickets || taTicketsDataRaw;

            // Add source property to differentiate ticket types
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
            
            // Combine for filtering and counts calculation
            const allTicketsData = [...studentTicketsWithNames, ...taTicketsWithNames];
            setTickets(allTicketsData);
            
            setStudentPagination(studentTicketsData.pagination || {
                totalItems: studentTicketsRaw.length,
                totalPages: 1,
                hasNextPage: false,
                hasPreviousPage: false
            });

            setTaPagination(taTicketsDataRaw.pagination || {
                totalItems: taTicketsRaw.length,
                totalPages: 1,
                hasNextPage: false,
                hasPreviousPage: false
            });

            let totalTickets, openTickets, closedTickets, escalatedTickets;
            
            // Get TOTAL count (unfiltered) for the main totalTickets display
            const grandTotalStudentParams = new URLSearchParams({ page: '1', limit: '1' }); // Minimal data
            const grandTotalTaParams = new URLSearchParams({ page: '1', limit: '1' });
            
            const [grandTotalStudentResponse, grandTotalTaResponse] = await Promise.all([
                fetch(`${baseURL}/api/tickets?${grandTotalStudentParams}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }),
                fetch(`${baseURL}/api/tatickets?${grandTotalTaParams}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                })
            ]);
            
            let grandTotalTickets = 0;
            if (grandTotalStudentResponse.ok && grandTotalTaResponse.ok) {
                const grandTotalStudentData = await grandTotalStudentResponse.json();
                const grandTotalTaData = await grandTotalTaResponse.json();
                
                const grandTotalStudentCount = grandTotalStudentData.summary ? grandTotalStudentData.summary.totalTickets : 
                                              (grandTotalStudentData.pagination ? grandTotalStudentData.pagination.totalItems : 0);
                const grandTotalTaCount = grandTotalTaData.summary ? grandTotalTaData.summary.totalTickets : 
                                         (grandTotalTaData.pagination ? grandTotalTaData.pagination.totalItems : 0);
                
                grandTotalTickets = grandTotalStudentCount + grandTotalTaCount;
            }
            
            totalTickets = grandTotalTickets;
            
            if (studentTicketsData.summary && taTicketsDataRaw.summary) {
                openTickets = studentTicketsData.summary.openTickets + taTicketsDataRaw.summary.openTickets;
                closedTickets = studentTicketsData.summary.closedTickets + taTicketsDataRaw.summary.closedTickets;
                escalatedTickets = studentTicketsData.summary.escalatedTickets + taTicketsDataRaw.summary.escalatedTickets;
            } else {
                escalatedTickets = 0;
                openTickets = 0;
                closedTickets = 0;
                console.warn('Backend summary not available for filtered counts');
            }
            
            setTotalTickets(totalTickets);
            setEscalatedTickets(escalatedTickets);
            setOpenTickets(openTickets);
            setClosedTickets(closedTickets);
            
        } catch (error) {
            console.error("Error fetching tickets:", error);
            setStudentTickets([]);
            setTaTickets([]);
            setTickets([]);
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

  const toggleHideResolved = () => {
    setHideResolved((prev) => !prev);
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
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: theme.palette.background.default,
          flexDirection: "column",
          gap: 2.5,
        }}
      >
        <CircularProgress size={80} thickness={4} />
        <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
          Loading, please wait...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: theme.palette.background.default,
        padding: 6.25,
        gap: 6.25,
      }}
    >
      <Typography
        variant="h1"
        sx={{ fontWeight: "bold", fontSize: "2rem", textAlign: "center" }}
      >
        All Tickets
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2.5,
          backgroundColor: theme.palette.background.paper,
          padding: 2.5,
          borderRadius: 1,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <Avatar>
            <ArticleIcon sx={{ fontSize: "2rem" }} />
          </Avatar>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <Typography variant="h1" sx={{ fontWeight: 'bold', fontSize: '2rem' }}>
              {totalTickets}
            </Typography>
            <Typography variant="p" sx={{ fontSize: '0.8rem', color: theme.palette.text.secondary }}>
              Total Tickets
            </Typography>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <Typography variant="h1" sx={{ fontWeight: 'bold', fontSize: '2rem' }}>
              {openTickets}
            </Typography>
            <Typography variant="p" sx={{ fontSize: '0.8rem', color: theme.palette.text.secondary }}>
              Open
            </Typography>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <Typography variant="h1" sx={{ fontWeight: 'bold', fontSize: '2rem' }}>
              {escalatedTickets}
            </Typography>
            <Typography variant="p" sx={{ fontSize: '0.8rem', color: theme.palette.text.secondary }}>
              Escalated
            </Typography>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <Typography variant="h1" sx={{ fontWeight: 'bold', fontSize: '2rem' }}>
              {closedTickets}
            </Typography>
            <Typography variant="p" sx={{ fontSize: '0.8rem', color: theme.palette.text.secondary }}>
              Closed
            </Typography>
          </div>
        </div>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2.5,
          backgroundColor: theme.palette.background.paper,
          padding: 2.5,
          borderRadius: 1,
          flex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 20,
          }}
        >
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
              ? `Filters: ${activeFilters.sort || ""} ${
                  activeFilters.status || ""
                }`
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
            {hideResolved ? "Include Resolved Tickets" : "Hide Resolved Tickets"}
          </Button>
        </div>

        {/* Filter Dropdown */}
        <Menu
          anchorEl={filterAnchor}
          open={Boolean(filterAnchor)}
          onClose={handleFilterClose}
        >
          {/* Sort: Newest */}
          <MenuItem
            onClick={() => {
              const newSort = activeFilters.sort === "newest" ? null : "newest";
              setActiveFilters({ ...activeFilters, sort: newSort });
              handleFilterClose();
            }}
          >
            {activeFilters.sort === "newest" && (
              <span style={{ marginRight: 8 }}>✔</span>
            )}
            Newest
          </MenuItem>

          {/* Sort: Oldest */}
          <MenuItem
            onClick={() => {
              const newSort = activeFilters.sort === "oldest" ? null : "oldest";
              setActiveFilters({ ...activeFilters, sort: newSort });
              handleFilterClose();
            }}
          >
            {activeFilters.sort === "oldest" && (
              <span style={{ marginRight: 8 }}>✔</span>
            )}
            Oldest
          </MenuItem>

          {/* Sort: ID Ascending */}
          <MenuItem
            onClick={() => {
              const newSort = activeFilters.sort === "id-asc" ? null : "id-asc";
              setActiveFilters({ ...activeFilters, sort: newSort });
              handleFilterClose();
            }}
          >
            {activeFilters.sort === "id-asc" && (
              <span style={{ marginRight: 8 }}>✔</span>
            )}
            Sort by ID: Ascending
          </MenuItem>

          {/* Sort: ID Descending */}
          <MenuItem
            onClick={() => {
              const newSort = activeFilters.sort === "id-desc" ? null : "id-desc";
              setActiveFilters({ ...activeFilters, sort: newSort });
              handleFilterClose();
            }}
          >
            {activeFilters.sort === "id-desc" && (
              <span style={{ marginRight: 8 }}>✔</span>
            )}
            Sort by ID: Descending
          </MenuItem>

          {/* Status: New */}
          <MenuItem
            onClick={() => {
              const newStatus = activeFilters.status === "New" ? null : "New";
              setActiveFilters({ ...activeFilters, status: newStatus });
              handleFilterClose();
            }}
          >
            {activeFilters.status === "New" && (
              <span style={{ marginRight: 8 }}>✔</span>
            )}
            Status: New
          </MenuItem>

          {/* Status: Ongoing */}
          <MenuItem
            onClick={() => {
              const newStatus = activeFilters.status === "Ongoing" ? null : "Ongoing";
              setActiveFilters({ ...activeFilters, status: newStatus });
              handleFilterClose();
            }}
          >
            {activeFilters.status === "Ongoing" && (
              <span style={{ marginRight: 8 }}>✔</span>
            )}
            Status: Ongoing
          </MenuItem>

          {/* Status: Resolved */}
          <MenuItem
            onClick={() => {
              const newStatus = activeFilters.status === "Resolved" ? null : "Resolved";
              setActiveFilters({ ...activeFilters, status: newStatus });
              handleFilterClose();
            }}
          >
            {activeFilters.status === "Resolved" && (
              <span style={{ marginRight: 8 }}>✔</span>
            )}
            Status: Resolved
          </MenuItem>
          {/* Status: Escalated */}
          <MenuItem
            onClick={() => {
              const newStatus = activeFilters.status === "Escalated" ? null : "Escalated";
              setActiveFilters({ ...activeFilters, status: newStatus });
              handleFilterClose();
            }}
          >
            {activeFilters.status === "Escalated" && (
              <span style={{ marginRight: 8 }}>✔</span>
            )}
            Status: Escalated
          </MenuItem>

            {/* Source: Student */}
            <MenuItem
                onClick={() => {
                    setActiveFilters({
                        ...activeFilters,
                        source: activeFilters.source === "student" ? null : "student",
                    });
                    handleFilterClose();
                }}
            >
                {activeFilters.source === "student" && (
                    <span style={{ marginRight: 8 }}>✔</span>
                )}
                Source: Student
            </MenuItem>

            {/* Source: TA */}
            <MenuItem
                onClick={() => {
                    setActiveFilters({
                        ...activeFilters,
                        source: activeFilters.source === "ta" ? null : "ta",
                    });
                    handleFilterClose();
                }}
            >
                {activeFilters.source === "ta" && (
                    <span style={{ marginRight: 8 }}>✔</span>
                )}
                Source: TA
            </MenuItem>
        </Menu>

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
                          Student Tickets ({studentPagination.totalItems} total)
                      </Typography>
                      {studentTickets.length > 0 ? (
                          <>
                              <TicketsViewController
                                  tickets={filteredTickets.filter(ticket => ticket.source === 'regular')}
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
                          <Typography>No student tickets to display.</Typography>
                      )}
                  </Box>
              )}

              {/* Render TA Tickets Section */}
              {(!activeFilters.source || activeFilters.source === 'ta') && (
                  <Box>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                          TA Tickets ({taPagination.totalItems} total)
                      </Typography>
                      {taTickets.length > 0 ? (
                          <>
                              <TaTicketsViewController
                                  tickets={filteredTickets.filter(ticket => ticket.source === 'ta')}
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
                          <Typography>No TA tickets to display.</Typography>
                      )}
                  </Box>
              )}

              {/* Display a message if no tickets match the filters */}
              {studentTickets.length === 0 && taTickets.length === 0 && (
                  <Typography>No tickets to display.</Typography>
              )}
          </Box>
      </Box>
    </Box>
  );
};

export default AllTickets;
