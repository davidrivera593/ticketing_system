import React, { useEffect, useState } from "react";
import Button from '@mui/material/Button';
import Cookies from "js-cookie";
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import './ConfirmReassign.css'
const baseURL = process.env.REACT_APP_API_BASE_URL;


const TaConfirmAssign = ({handleOpen, handleClose, ticketID, oldTAID, idNameMap, updateTA}) => {
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

    const handleSubmit = async () => {
        // 1. Validate that a TA has been selected
        if (!selectedTA) {
            alert("Please select a valid TA before confirming.");
            return;
        }

        try {
            // 2. Send a POST request to create a new assignment
            const assignResponse = await fetch(
                `${baseURL}/api/taticketassignments/ticket/${ticketID}`,
                {
                    method: "POST", // Use POST to create a new assignment
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        user_id: selectedTA, // The backend expects 'user_id' for a new assignment
                    }),
                }
            );

            // 3. Handle the response
            if (assignResponse.ok) {
                // On success, update the parent component's state and close the dialog
                updateTA(selectedTA);
                handleClose();
            } else {
                // On failure, log the error and keep the dialog open
                console.error(`Failed to assign TA. Status: ${assignResponse.status}`);
                setError(true); // Show an error message to the user
            }
        } catch (error) {
            console.log("Error assigning TA: ", error);
            setError(true);
        }
    };

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
                    Pick a new TA to reassign ticket {ticketID} to.
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

export default TaConfirmAssign;