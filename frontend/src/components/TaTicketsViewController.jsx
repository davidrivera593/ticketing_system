import * as React from "react";
import { useState } from "react";
import { Box, Grid, Typography, Checkbox } from "@mui/material";
import Button from "@mui/material/Button";
import ViewToggle from "./viewToggle";
import TicketRow from "./TicketRow";
import TaTicketRow from "./TaTicketRow";
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

    const [showCheckboxes, setShowCheckboxes] = useState(false);
    const [selectedCheckboxes, setSelectedCheckboxes] = useState([]);

    const [shareOpen, setShareOpen] = useState(false);

    const [idNameMap, setIdNameMap] = useState({});
    const [allAssignedID, setAllAssignedID] = useState([]);
    const [error, setError] = useState(false);

    React.useEffect(() => localStorage.setItem("tickets:view", view), [view]);

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
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box>{header}</Box>
                    {enableShare && (
                        <>
                            <Button
                                variant={showCheckboxes ? "outlined" : "contained"}
                                onClick={() => {
                                    const next = !showCheckboxes;
                                    setShowCheckboxes(next);
                                    if (!next) {
                                        setSelectedCheckboxes([]);
                                    }
                                }}
                            >
                                {showCheckboxes ? "Cancel" : "Share Tickets"}
                            </Button>
                            {showCheckboxes && (
                                <Button
                                    variant="contained"
                                    disabled={selectedCheckboxes.length === 0}
                                    onClick={() => {
                                        if (selectedCheckboxes.length === 0) {
                                            alert("Please select at least one ticket to share.");
                                            return;
                                        }
                                        setShareOpen(true);
                                    }}
                                >
                                    Share
                                </Button>
                            )}
                            <GroupShareTicket
                                handleOpen={shareOpen}
                                handleClose={() => setShareOpen(false)}
                                ticketIDs={selectedCheckboxes}
                                idNameMap={idNameMap}
                                allTAs={allAssignedID}
                                assignmentPath="taticketassignments"
                            />
                        </>
                    )}
                </Box>
                <Box sx={{ ml: 'auto' }}>
                    <ViewToggle value={view} onChange={setView} />
                </Box>
            </Box>

            {view === "list" ? (
                <Box role="list" sx={{ border:"1px solid", borderColor:"divider", borderRadius:1, overflow:"hidden", bgcolor:"background.paper" }}>
                    <Box sx={{
                        display:{ xs:"none", md:"grid" },
                        gridTemplateColumns: showCheckboxes
                            ? "40px 30px 0px 1fr 2fr 1fr 2fr 100px 100px"
                            : "30px 0px 1fr 2fr 1fr 2fr 100px 100px",
                        gap:2, px:2, py:1.5,
                        bgcolor:"background.default", borderBottom:"1px solid", borderColor:"divider",
                        typography:"overline", letterSpacing:0.6, color:"text.secondary", position:"sticky", top:0, zIndex:1,
                        fontWeight: "bold"
                    }}>
                        {showCheckboxes && (
                            <span>
                                <Checkbox
                                    size="small"
                                    indeterminate={
                                        selectedCheckboxes.length > 0 &&
                                        selectedCheckboxes.length < tickets.length
                                    }
                                    checked={
                                        tickets.length > 0 &&
                                        selectedCheckboxes.length === tickets.length
                                    }
                                    onChange={(e) =>
                                        setSelectedCheckboxes(
                                            e.target.checked
                                                ? tickets.map((t) => t.ticket_id ?? t.id)
                                                : []
                                        )
                                    }
                                />
                            </span>
                        )}
                        <span></span>
                        <span></span>
                        <span style={{ textAlign: "center" }}>Creator (TA)</span>
                        <span style={{ textAlign: "center" }}>Student (On behalf of)</span>
                        <span style={{ textAlign: "center" }}>DESCRIPTION</span>
                        <span style={{ textAlign: "center" }}>TICKET #</span>
                        <span style={{ textAlign: "center" }}>CREATED</span>
                        <span style={{ textAlign: "center" }}>STATUS</span>
                    </Box>

                    {tickets.length === 0
                        ? <Box sx={{ p:4, textAlign:"center", color:"text.secondary" }}>No tickets yet</Box>
                        : tickets.map((t) => (
                            <TaTicketRow
                                key={t.ticket_id ?? t.id}
                                ticket={t}
                                onOpen={onOpenTicket}
                                escalated={t.escalated}
                                showCheckboxes={showCheckboxes}
                                selectedCheckboxes={selectedCheckboxes.includes(t.ticket_id ?? t.id)}
                                onToggleSelect={(id) =>
                                    setSelectedCheckboxes((prev) =>
                                        prev.includes(id)
                                            ? prev.filter((x) => x !== id)
                                            : [...prev, id]
                                    )
                                }
                            />
                        ))}
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
