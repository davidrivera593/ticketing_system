import React, {useEffect, useMemo, useState} from "react";
import { Avatar, Button, Typography, Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ArticleIcon from "@mui/icons-material/Article";
import CircularProgress from "@mui/material/CircularProgress";
import Cookies from "js-cookie";
import TaTicketCard from "../../components/TaTicketCard";
import { fetchTaTicketsByUserId } from "../../services/ticketServices";
import { useNavigate } from "react-router-dom";
import TaTicketsViewController from "../../components/TaTicketsViewController";
import TicketsViewController from "../../components/TicketsViewController";
import Pagination from "../../components/Pagination/Pagination";

const baseURL = process.env.REACT_APP_API_BASE_URL;

// Read user_id from JWT (no secret; just decode payload)
function getUserIdFromToken() {
    try {
        const token = Cookies.get("token");
        if (!token) return null;
        const payload = JSON.parse(atob(token.split(".")[1] || ""));
        return payload?.user_id || payload?.id || null;
    } catch {
        return null;
    }
}

const TaRequestTickets = () => {
    const navigate = useNavigate();
    const userId = useMemo(getUserIdFromToken, []);
    const [allTickets, setAllTickets] = useState([]); 
    const [tickets, setTickets] = useState([]); 
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);
    
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(1000);
    const [pagination, setPagination] = useState({
        totalItems: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false
    });

    const fetchNameFromId = async (student_id) => {
        try {
            const token = Cookies.get("token");
            const res = await fetch(`${baseURL}/api/users/${student_id}`, {
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return "Unknown";
            const data = await res.json();
            return data.name || "Unknown";
        } catch {
            return "Unknown";
        }
    };

    const applyPagination = (ticketsList, page, itemsPerPage) => {
        const totalItems = ticketsList.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        
        const paginatedTickets = ticketsList.slice(startIndex, endIndex);
        
        setTickets(paginatedTickets);
        setPagination({
            totalItems: totalItems,
            totalPages: totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
        });
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleItemsPerPageChange = (newItemsPerPage) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1); 
    };

    useEffect(() => {
        if (allTickets.length > 0) {
            applyPagination(allTickets, currentPage, itemsPerPage);
        }
    }, [allTickets, currentPage, itemsPerPage]);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        let cancelled = false;

        (async () => {
            try {
                setLoading(true);
                const token = Cookies.get("token");

                // Backend: ticketController.getTicketsByUserId
                const res = await fetch(`${baseURL}/api/tatickets/user/${userId}`, {
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error("Failed to fetch TA tickets");
                const data = await res.json();

                const enriched = await Promise.all(
                    data.map(async (t) => ({
                        ...t,
                        userName: await fetchNameFromId(t.ta_id),
                        student_name: await fetchNameFromId(t.on_behalf_of),
                    }))
                );

                if (!cancelled) {
                    setAllTickets(enriched);
                    setCount(enriched.length);
                    
                    applyPagination(enriched, currentPage, itemsPerPage);
                }
            } catch (e) {
                console.error(e);
                if (!cancelled) {
                    setAllTickets([]);
                    setTickets([]);
                    setCount(0);
                    setPagination({
                        totalItems: 0,
                        totalPages: 1,
                        hasNextPage: false,
                        hasPreviousPage: false
                    });
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [userId]);

    const openTicket = (t) => navigate(`/taticketinfo?ticket=${t.ticket_id}`);

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
                            {count} total
                        </Typography>
                    </Box>
                </Box>
                <Button variant="contained" onClick={() => navigate(-1)}>Back</Button>
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
                <TaTicketsViewController
                    tickets={tickets}
                    defaultView="list"
                    onOpenTicket={openTicket}
                    header={<Typography variant="subtitle2">Tickets (Page {currentPage} of {pagination.totalPages})</Typography>}
                />
                
                {/* Pagination */}
                {false && (
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={pagination.totalPages}
                            itemsPerPage={itemsPerPage}
                            totalItems={pagination.totalItems}
                            hasNextPage={pagination.hasNextPage}
                            hasPreviousPage={pagination.hasPreviousPage}
                            onPageChange={handlePageChange}
                            onItemsPerPageChange={handleItemsPerPageChange}
                            itemsPerPageOptions={[5, 10, 25, 50]}
                        />
                    </Box>
                )}
                
                {/* No tickets message */}
                {tickets.length === 0 && !loading && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                            No tickets found.
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
}

export default TaRequestTickets;
