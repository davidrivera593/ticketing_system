import React, { useEffect, useState } from "react";
import Button from '@mui/material/Button';
import Cookies from "js-cookie";
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import './ConfirmReassign.css';

const baseURL = process.env.REACT_APP_API_BASE_URL;

const ConfirmReassign = ({ handleOpen, handleClose, ticketID, oldTAID, idNameMap, updateTA }) => {
    const [selectedUser, setSelectedUser] = useState('');
    const [error, setError] = useState(false);
    const token = Cookies.get("token");

    const handleSelectChange = (event) => {
        setSelectedUser(Number(event.target.value));
    };

    const handleUpdate = async () => {
        try {
            const assignResponse = await fetch(
                `${baseURL}/api/ticketassignments/ticket/${ticketID}/assignment/${oldTAID}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        new_user_id: selectedUser
                    }),
                }
            );

            if (!assignResponse.ok) {
                throw new Error(`Failed to update assignment. Status: ${assignResponse.status}`);
            }

            updateTA(selectedUser);

        } catch(error) {
            console.error("Error: ", error);
            setError(true);
            alert("An error occurred while reassigning the ticket.");
        }
    };

    const handleSubmit = () => {
        if (!selectedUser) {
            alert("Please select a staff member before confirming.");
            return;
        }
        if (selectedUser === oldTAID) {
            alert("This ticket is already assigned to this person.");
            return;
        }
        handleUpdate();
        handleClose();
    };

    return (
        <Dialog open={handleOpen} onClose={handleClose}>
            <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>
                    Reassign Ticket <strong>#{ticketID}</strong> to a new TA or Grader.
                </DialogContentText>

                <div className="dropdown-container" style={{ marginBottom: '20px' }}>
                    <select
                        value={selectedUser}
                        onChange={handleSelectChange}
                        style={{ width: '100%', padding: '10px', borderRadius: '4px' }}
                    >
                        <option value="" disabled>Select Staff Member</option>
                        {Object.entries(idNameMap).map(([user_id, info]) => (
                            <option key={user_id} value={user_id}>
                                {info.name} — ({info.role})
                            </option>
                        ))}
                    </select>
                </div>

                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSubmit}
                    >
                        Confirm Reassignment
                    </Button>
                </DialogActions>
            </DialogContent>
        </Dialog>
    );
};

export default ConfirmReassign;