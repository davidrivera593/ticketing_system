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
    React.useEffect(() => localStorage.setItem("tickets:view", view), [view]);

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
                        <span style={{ textAlign: "center" }}>OWNER NAME</span>
                        <span style={{ textAlign: "center" }}>TEAM</span>
                        <span style={{ textAlign: "center" }}>SPONSOR</span>
                        <span style={{ textAlign: "center" }}>DESCRIPTION</span>
                        <span style={{ textAlign: "center" }}>TICKET #</span>
                        <span style={{ textAlign: "center" }}>CREATED</span>
                        <span style={{ textAlign: "center" }}>STATUS</span>
                    </Box>

                    {tickets.length === 0
                        ? <Box sx={{ p:4, textAlign:"center", color:"text.secondary" }}>No tickets yet</Box>
                        : tickets.map((t) => <TicketRow key={t.ticket_id ?? t.id} ticket={t} onOpen={onOpenTicket} />)}
                </Box>
            ) : (
                <Grid container spacing={2}>
                    {tickets.map((t) => (
                        <Grid key={t.ticket_id ?? t.id} item {...gridBreakpoints}>
                            <TaTicketCard
                                ticketId={t.ticket_id}
                                issueType={t.issue_type}
                                issueDescription={t.issue_description}
                                status={t.status}
                                name={t.userName || t.name}
                                escalated={t.escalated}
                            />
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
}
