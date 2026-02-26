import * as React from "react";
import { useState } from "react";
import { Box, Grid, Typography, Checkbox } from "@mui/material";
import Button from "@mui/material/Button";
import ViewToggle from "./viewToggle";
import TicketRow from "./TicketRow";
import TicketCard from "./TicketCard";
import TaTicketCard from "./TaTicketCard";
import GroupShareTicket from "./GroupShareTicket/GroupShareTicket";

export default function TicketsViewController({
  tickets = [],
  defaultView = "list",           // list by default, as requested
  onOpenTicket,                   // function(ticket)
  header = "",
  gridBreakpoints = { xs:12, sm:6, md:4, lg:3 },
  enableShare = false,            // show share controls (only used on AllTickets page)
}) {
  const [view, setView] = React.useState(() => localStorage.getItem("tickets:view") || defaultView);
  const [sortColumn, setSortColumn] = React.useState(null);
  const [sortDirection, setSortDirection] = React.useState("asc"); // "asc" or "desc"

  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [selectedCheckboxes, setSelectedCheckboxes] = useState([]);

  const [shareOpen, setShareOpen] = useState(false);

  const [idNameMap, setIdNameMap] = useState({});
  const [allAssignedID, setAllAssignedID] = useState([]);
  const [error, setError] = useState(false);

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

  //TICKET ASSIGNMENTS: from ticket_id get user_id (database has multiple users assigned to same ticket?)
  const fetchAssignedTaID = async () => {
    try {
      const token = Cookies.get("token");
      
      const getResponse = await fetch(
        `${baseURL}/api/ticketassignments/ticket/${ticketId}`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        //console.log("Assigned TA ID: ", getResponse);

        if (!getResponse.ok) {
          console.error(`Failed to get assigned TAs ID. Status: ${getResponse.status}`);
          console.error(`${getResponse.reason}`);
        }
      
        const list = await getResponse.json();
        console.log("Assigned TA ID: ", list);
        const TA_id = list.map(obj => obj.user_id)[0]; //if tickets have multiple TAs, only get the first one
        const TA_id_list = list.map(obj => obj.user_id);
        setAllAssignedID(TA_id_list);
        setAssignedID(TA_id);

      } catch (err) {
        console.log("Error: ", err);
        setError(true);
      }
  }

  const fetchTaMap = async () => {
  try {
      
      const getResponse = await fetch(
      `${baseURL}/api/users/role/TA`,
      {
          method: "GET",
          headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
          },
      });

      if (!getResponse.ok) {
          console.error(`Failed to get TAs. Status: ${getResponse.status}`);
          console.error(`${getResponse.reason}`);
      }
      
      const list = await getResponse.json();
      console.log("all ID: ", list);
      const idNameMap = convertToMap(list);
      setIdNameMap(idNameMap);

      } catch (err) {
      console.log("Error: ", error);
      setError(true);
      }
  }

  return (
    <Box sx={{ p: 0 }}>
      <Box sx={{ display:"flex", alignItems:"center", mb:1.5 }}>
        {/* left‑aligned group */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box>{header}</Box>
          {enableShare && (
            <>
              <Button variant={showCheckboxes ? "outlined" : "contained"} 
                onClick={() => {
                  setShowCheckboxes(!showCheckboxes)
                  if(!showCheckboxes){
                    //If canceling out of showing checkboxes, clear selected checkboxes
                    setSelectedCheckboxes([]);
                  }
                }}>
                {showCheckboxes ? "Cancel" : "Share Tickets"}
              </Button>
              {showCheckboxes && (
                <Button 
                  variant="contained" 
                  disabled={selectedCheckboxes.length === 0}
                  onClick={() => {
                    if (selectedCheckboxes.length === 0) {
                      // nothing to share, avoid opening dialog
                      alert("Please select at least one ticket to share.");
                      return;
                    }
                    console.log("selectedCheckboxes:", selectedCheckboxes);
                    setShareOpen(true);
                    fetchAssignedTaID();
                    fetchTaMap();
                  }
                }>
                  Share
                </Button>          
              )}
              <GroupShareTicket handleOpen={shareOpen} handleClose={() => setShareOpen(false)} 
                  ticketIDs={selectedCheckboxes} 
                  // updateTA={(newTAID) => setSharedID(newTAID)}
                  idNameMap={idNameMap}
                  allTAs = {allAssignedID}
                  />
            </>
          )}
        </Box>
        {/* right‑aligned view toggle */}
        <Box sx={{ ml: 'auto' }}>
          <ViewToggle value={view} onChange={setView} />
      </Box>
      </Box>
      {view === "list" ? (
        <Box role="listitem" sx={{ border:"1px solid", borderColor:"divider", borderRadius:1, overflow:"hidden", bgcolor:"background.paper" }}>
          <Box sx={{
            display:{ xs:"none", md:"grid" },
            gridTemplateColumns: showCheckboxes ? "100px 1fr 1fr 1fr 2fr 100px 100px 100px" : "40px 1fr 1fr 1fr 2fr 100px 100px 100px",
            gap:2, 
            px:2, 
            py:1.5,
            alignItems: "center",
            cursor: showCheckboxes ? "pointer" : "default",
            bgcolor:"background.default", 
            borderBottom:"1px solid", 
            borderColor:"divider",
            typography:"overline", 
            letterSpacing:0.6, 
            color:"text.secondary", 
            position:"sticky", 
            top:0, 
            zIndex:1,
            fontWeight: "bold"
          }}
          onClick={() => {
            // if (showCheckboxes) onToggleSelect(ticket.ticket_id ?? ticket.id);
          }}
        >
          <span> 
            {showCheckboxes && (
              <Checkbox
                size="small"
                indeterminate={
                  selectedCheckboxes.length > 0 &&
                  selectedCheckboxes.length < sortedTickets.length
                }
                checked={
                  sortedTickets.length > 0 &&
                  selectedCheckboxes.length === sortedTickets.length
                }
                onChange={(e) =>
                  setSelectedCheckboxes(
                    e.target.checked
                      ? sortedTickets.map(t => t.ticket_id ?? t.id)
                      : []
                  )
                }
              />
            )}
          </span>
          {/* <span style={{ textAlign: "center" }}>TEST</span> */}
          <SortableHeader column="owner" label="OWNER NAME" />
          <SortableHeader column="team" label="TEAM" />
          <SortableHeader column="sponsor" label="SPONSOR" />
          <span style={{ textAlign: "center" }}>DESCRIPTION</span>
          <span style={{ textAlign: "center" }}>TICKET #</span>
          <SortableHeader column="created" label="CREATED" />
          <span style={{ textAlign: "center" }}>STATUS</span>
          </Box>

          {tickets.length === 0
            ? <Box sx={{ p:4, textAlign:"center", color:"text.secondary" }}>No tickets yet</Box>
            : sortedTickets.map((t) => 
                <TicketRow
                  key={t.ticket_id ?? t.id} 
                  ticket={t} 
                  onOpen={onOpenTicket} 
                  escalated={t.escalated} 
                  showCheckboxes={showCheckboxes}
                  selectedCheckboxes={selectedCheckboxes.includes(t.ticket_id ?? t.id)}
                  onToggleSelect={(id) =>
                    setSelectedCheckboxes(prev =>
                      prev.includes(id)
                        ? prev.filter(x => x !== id)
                        : [...prev, id]
                    )
                  }
                />)}
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
