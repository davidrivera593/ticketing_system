import React, {memo, useEffect, useState } from "react";
import Button from '@mui/material/Button';
import Cookies from "js-cookie";
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
const baseURL = process.env.REACT_APP_API_BASE_URL;


const ConfirmTADelete = memo(({handleOpen, handleClose, ta, idNameMap, updateStatus}) => {
    const [selectedTAs, setSelectedTAs] = useState({}); //make selectedTA an array for each ticket?
    const [reassignedTickets, setReassignedTickets] = useState({}); //keep track of tickets that have been reassigned
    const [data, setData] = useState([]);
    const [error, setError] = useState(false);
    const token = Cookies.get("token");

    const getDisplayName = (value, fallbackId) => {
      if (typeof value === "string") return value;
      if (value && typeof value === "object") return value.name || `User ${fallbackId}`;
      return `User ${fallbackId}`;
    };
    useEffect(() => { // Fetch ticket assignments when the pop up opens
      if (ta?.user_id) {
        fetchTicketAssignmentsByUserId(ta.user_id);
      }
    }, [ta]);

    const handleSelectChange = (ticketId, event) => { //Update the selected TA for the specified ticket
      setSelectedTAs((prevSelectedTAs) => ({
          ...prevSelectedTAs,
          [ticketId]: Number(event.target.value), 
      }));
    };

    const handleReassignedTickets = (ticketId) => { //Track which tickets have been reassigned and confirmed
      setReassignedTickets((prevReassignedTickets) => ({
          ...prevReassignedTickets,
          [ticketId]: true, 
      }));
    }

    const filterUniqueTickets = (tickets) => { //Avoid duplicate tickets
        const seen = new Set();
        return tickets.filter((ticket) => {
            if (seen.has(ticket.ticket_id)) {
                return false;
            }
            seen.add(ticket.ticket_id);
            return true; 
        });
    };

    const sortTicketsById = (tickets) => {
      return tickets.sort((a, b) =>  a.ticket_id - b.ticket_id);
    }

    const checkIfAllTicketsReassigned = () => {
      return data.length === Object.keys(reassignedTickets).length;
    }

    const deleteTA = async (taId) => {
      try {
        
        const response = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/api/users/${taId}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
  
        if (!response.ok) throw new Error("Failed to delete TA.");
        console.log("TA deleted successfully.");
      } catch (error) {
        console.error(error);
      }
    };

    //Make ticket reassignments for all tickets
    const updateTickets = async (event) => {
      try{
          const oldTAID = ta.user_id;
          for (const [ticketID, taID] of Object.entries(selectedTAs)) {
            const assignResponse = await fetch(
                `${baseURL}/api/ticketassignments/ticket/${ticketID}/assignment/${oldTAID}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        new_user_id: taID
                    }),
                });

            if (!assignResponse.ok) {
              console.error(`Failed to updated TA assignment. Status: ${assignResponse.status}`);
              console.error(`${assignResponse.reason}`);
            }
          }
          console.log("All tickets have been reassigned.");
      } catch(error) {
          console.log("Error: ", error);
          setError(true);
      }
    }

    //Fetch ticket assignments for the TA being deleted
    const fetchTicketAssignmentsByUserId = async (userId) => {
        try{
            const token = Cookies.get("token");
            const response = await fetch(
            `${baseURL}/api/ticketassignments/users/${userId}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );
    
          if (!response.ok) throw new Error("Failed to fetch ticket assignments.");
          const data = await response.json();
          const sortedData = sortTicketsById(data);
          const uniqueData = filterUniqueTickets(sortedData);
          setData(uniqueData);
        } catch (error) {
          console.log(error);
        }
    };


    const handleConfirm = (ticket) => { //Check if a valid TA is selected
      if (!selectedTAs[ticket.ticket_id]) {
        alert("Please select a valid TA before confirming.");
        return;
      }
      if (selectedTAs[ticket.ticket_id] === ta.user_id) {
        alert("You cannot reassign the ticket to the same TA. Please select a different TA.");
        return; // Exit without making the PUT request
      }
      handleReassignedTickets(ticket.ticket_id);
    }

    const handleSubmit = () => { //Check that each Ticket has been reassigned and confirmed
      if (!checkIfAllTicketsReassigned()) {
        alert("Please reassign and confirm all tickets before finishing.");
        return;
      }
      updateTickets();
      deleteTA(ta.user_id);
      updateStatus(true); //updated ticket assignments and delete TA, update TA listing after returning to main page
      handleClose();
    }

    return(
        <Dialog
        open={handleOpen}
        onClose={handleClose}
        PaperProps={{
            component: 'form',
            onSubmit: (event) => {                                                                                                                                                                                                                                                    
            event.preventDefault();
            //handleClose();
            },
        }}
        >
            <DialogContent>
                <DialogContentText>
                Are you sure you want to delete {ta.name}?
                If so, please reassign their tickets.
                </DialogContentText>
                
                {data.map((ticket, index) => (
                    <div key={index} style={{ display: "flex", alignItems: "center", margin: "10px" }}>
                      <label htmlFor={`dropdown-${index}`}>
                        <a 
                          href={`${baseURL}/ticketinfo?ticket=${ticket.ticket_id}`}
                          target = "_blank"
                          rel="noopener noreferrer"
                          style={{ textDecoration: "none", color: "#8C1D40", whiteSpace: "nowrap" }} 
                        >
                          Ticket {ticket.ticket_id}:
                        </a>
                      </label> 
                      {(reassignedTickets[ticket.ticket_id] === true) && (
                          <span style={{ marginLeft: "10px", color: "green", fontSize: "20px" }}> ✔ </span>
                      )} 
                      <select 
                        id={`dropdown-${index}`} 
                        style={{ marginLeft: "10px" }} 
                        value={selectedTAs[ticket.ticket_id] || ""} // Use the selected TA for the specific ticket
                        onChange={(event) => handleSelectChange(ticket.ticket_id, event)} 
                      >
                          <option value="" disabled>Select a TA</option>
                          {Object.entries(idNameMap).map(([user_id, info]) => (
                            <option key={user_id} value={user_id}>{getDisplayName(info, user_id)}</option> //TA name is displayed but actual value for 'selectedTA' is user_id
                          ))}
                      </select>
                      <Button 
                        variant = "contained"
                        style = {{ marginLeft: "10px"}}
                        onClick={() => {
                          handleConfirm(ticket);
                          }
                        }
                      > 
                        Confirm
                      </Button>
                      
                    </div>
                ))}

                <DialogActions classname="buttons">
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button 
                      variant="contained" 
                      type="submit" 
                      onClick={() => {
                          handleSubmit();
                        }
                      }
                    > 
                      {/* prevent from click until all tickets are reassigned after confirm button clicked or randomized remaining */}
                      {/* add button to randomly reassign TA for unselected tickets */} 
                        Finish
                    </Button>
                </DialogActions>
            </DialogContent>
        </Dialog>
    )

});
export default ConfirmTADelete;