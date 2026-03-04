import React, { useEffect, useState } from "react";
import Button from '@mui/material/Button';
import Cookies from "js-cookie";
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import './ShareTicket.css'
const baseURL = process.env.REACT_APP_API_BASE_URL;


const ShareTicket = ({handleOpen, handleClose, ticketID, oldTAID, idNameMap, updateTA, allTAs}) => { 
    const [selectedTA, setSelectedTA] = useState(''); //current TA
    const [error, setError] = useState(false);
    const token = Cookies.get("token");

    const getDisplayName = (value, fallbackId) => {
        if (typeof value === "string") return value;
        if (value && typeof value === "object") return value.name || `User ${fallbackId}`;
        return `User ${fallbackId}`;
    };

    

    const handleSelectChange = (event) => {
        setSelectedTA(Number(event.target.value));
    };

    const handleUpdate = async (event) => {
            //Adds shared TA to ticketassignments
            try{
                const shareResponse = await fetch(
                    `${baseURL}/api/ticketassignments/ticket/${ticketID}`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            ticket_id : ticketID,
                            user_id: selectedTA
                        }),
                    }
                );
            
                if (!shareResponse.ok) {
                    alert("Failed to updated TA assignment");
                    console.error(`Failed to updated TA assignment. Status: ${shareResponse.status}`);
                    console.error(`${shareResponse.reason}`);
                }
                updateTA(selectedTA); //share to new TA, so it will be displayed on main page                 
                alert("Finished sharing ticket");

        } catch(error) {
            alert("ERROR");
            console.log("Error: ", error);
            setError(true);
        }
    }

    const handleSubmit = () => {
        if (!selectedTA) {
            alert("Please select a valid TA before confirming.");
            return;
        }
        if (selectedTA === oldTAID) {
            alert("You cannot share the ticket to the same TA. Please select a different TA.");
            return; // Exit without making the PUT request
        }
        handleUpdate();
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
            },
        }}
        >
            <DialogContent>
                <DialogContentText variant="body1" sx={{ fontWeight: '500', color: "black" }}>
                    Assigned TAs
                </DialogContentText>
                <DialogContentText> 
                    {Object.entries(idNameMap).map(([user_id, info]) => (allTAs.includes(Number(user_id)) &&
                        <option key={user_id} value={user_id}>• {getDisplayName(info, user_id)}</option>
                        ))}
                </DialogContentText>
                <DialogContentText> 
                Pick a new TA to share ticket {ticketID} to.
                </DialogContentText>
                <DialogActions classname="dropdown">
                    <select value={selectedTA} onChange={handleSelectChange}>
                        <option value="" disabled>Select a TA</option>
                        {Object.entries(idNameMap).map(([user_id, info]) => (
                        <option key={user_id} value={user_id}>{getDisplayName(info, user_id)}</option> //TA name is displayed but actual value for 'selectedTA' is user_id
                        ))}
                    </select>
                    
                </DialogActions>
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
                        Confirm
                    </Button>
                </DialogActions>
            </DialogContent>
        </Dialog>
    )
}


export default ShareTicket;
