import * as React from "react";
import { Box, Grid, Typography } from "@mui/material";
import ViewToggle from "./viewToggle";
import TicketRow from "./TicketRow";
import TicketCard from "./TicketCard";
import TaTicketCard from "./TaTicketCard";

export default function TicketsViewController({
  tickets = [],
  defaultView = "list",           // list by default, as requested
  onOpenTicket,                   // function(ticket)
  header = "",
  gridBreakpoints = { xs:12, sm:6, md:4, lg:3 },
}) {
  const [view, setView] = React.useState(() => localStorage.getItem("tickets:view") || defaultView);
  const [sortColumn, setSortColumn] = React.useState(null);
  const [sortDirection, setSortDirection] = React.useState("asc"); // "asc" or "desc"

  React.useEffect(() => localStorage.setItem("tickets:view", view), [view]);

  // Handle column header click for sorting
  const handleSort = (column) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New column, default to ascending
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Sort tickets based on current sort settings
  const sortedTickets = React.useMemo(() => {
    if (!sortColumn) return tickets;

    const sorted = [...tickets].sort((a, b) => {
      let aVal, bVal;

      switch (sortColumn) {
        case "owner":
          aVal = (a.userName || a.student_name || "").toLowerCase();
          bVal = (b.userName || b.student_name || "").toLowerCase();
          break;
        case "team":
          aVal = (a.teamName || a.team_name || "").toLowerCase();
          bVal = (b.teamName || b.team_name || "").toLowerCase();
          break;
        case "sponsor":
          aVal = (a.sponsor_name || "").toLowerCase();
          bVal = (b.sponsor_name || "").toLowerCase();
          break;
        case "created":
          aVal = new Date(a.created_at || 0);
          bVal = new Date(b.created_at || 0);
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [tickets, sortColumn, sortDirection]);

  // Render sortable column header
  const SortableHeader = ({ column, label }) => {
    const [isHovered, setIsHovered] = React.useState(false);

    return (
      <span
        style={{
          textAlign: "center",
          cursor: "pointer",
          userSelect: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "4px",
          opacity: isHovered ? 0.7 : 1,
          transition: "opacity 0.2s"
        }}
        onClick={() => handleSort(column)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {label}
        {sortColumn === column && (
          <span style={{ fontSize: "0.8em" }}>
            {sortDirection === "asc" ? "↑" : "↓"}
          </span>
        )}
      </span>
    );
  };

  return (
    <Box sx={{ p: 0 }}>
      <Box sx={{ display:"flex", alignItems:"center", justifyContent:"space-between", mb:1.5 }}>
        <Box>{header}</Box>
        <ViewToggle value={view} onChange={setView} />
      </Box>

      {view === "list" ? (
        <Box role="list" sx={{ border:"1px solid", borderColor:"divider", borderRadius:1, overflow:"hidden", bgcolor:"background.paper" }}>
          <Box sx={{
            display:{ xs:"none", md:"grid" },
            gridTemplateColumns:"40px 1fr 1fr 1fr 2fr 100px 100px 100px",
            gap:2, px:2, py:1.5,
            bgcolor:"background.default", borderBottom:"1px solid", borderColor:"divider",
            typography:"overline", letterSpacing:0.6, color:"text.secondary", position:"sticky", top:0, zIndex:1,
            fontWeight: "bold"
          }}>
          <span></span>
          <SortableHeader column="owner" label="OWNER NAME" />
          <SortableHeader column="team" label="TEAM" />
          <SortableHeader column="sponsor" label="SPONSOR" />
          <span style={{ textAlign: "center" }}>DESCRIPTION</span>
          <span style={{ textAlign: "center" }}>TICKET #</span>
          <SortableHeader column="created" label="CREATED" />
          <span style={{ textAlign: "center" }}>STATUS</span>
          </Box>

          {sortedTickets.length === 0
            ? <Box sx={{ p:4, textAlign:"center", color:"text.secondary" }}>No tickets yet</Box>
            : sortedTickets.map((t) => <TicketRow key={t.ticket_id ?? t.id} ticket={t} onOpen={onOpenTicket} escalated={t.escalated} />)}
        </Box>
      ) : (
        <Grid container spacing={2}>
          {sortedTickets.map((t) => (
            <Grid key={t.ticket_id ?? t.id} item {...gridBreakpoints}>
              <TicketCard
                ticketId={t.ticket_id}
                issueType={t.issue_type}
                issueDescription={t.issue_description}
                status={t.status}
                name={t.userName || t.name}
                escalated={t.escalated}
                teamName={t.teamName || t.team_name}
                sponsorName={t.sponsor_name}
                createdAt={t.created_at}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
