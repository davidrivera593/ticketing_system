import React, { useEffect, useState } from "react";
import Button from '@mui/material/Button';
import Cookies from "js-cookie";
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import './GroupShareTicket.css'
const baseURL = process.env.REACT_APP_API_BASE_URL;


const GroupShareTicket = ({handleOpen, handleClose, ticketIDs, idNameMap: propIdNameMap = {}, allTAs}) => { 
    const [selectedTA, setSelectedTA] = useState(''); //current TA
    const [error, setError] = useState(false);
    const [assignedTAs, setAssignedTAs] = useState([]);
    // keep a local copy in case the parent doesn't supply one
    const [idNameMap, setIdNameMap] = useState(propIdNameMap);
    const token = Cookies.get("token");

    // whenever the dialog closes we want to clear the selection
    const handleDialogClose = () => {
        setSelectedTA('');
        handleClose();
    };

    // also clear if the open flag flips from true to false
    useEffect(() => {
        if (!handleOpen) {
            setSelectedTA('');
        }
    }, [handleOpen]);

    

    const handleSelectChange = (event) => {
        setSelectedTA(Number(event.target.value));
    };

    // fetch the current assignments for the first ticket in the group
    useEffect(() => {
        if (ticketIDs.length === 0) return;
        const fetchAssignments = async () => {
        try {
            const res = await fetch(
            `${baseURL}/api/ticketassignments/ticket/${ticketIDs[0]}`,    // call the GET route
            {
                method: "GET",
                headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                },
            }
            );

            if (!res.ok) {
            console.error("failed to load assignments", res.status);
            return;
            }

            const list = await res.json();
            setAssignedTAs(list);          // array of {ticket_id, user_id,…}
        } catch (err) {
            console.error(err);
        }
    };

    const convertToMap = (list) => {
        return list.reduce((acc, obj) => { //map ID to name
        acc[obj.user_id] = obj.name;
        return acc;
        }, {});
    };

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
            }
        );

        if (!getResponse.ok) {
            console.error(`Failed to get TAs. Status: ${getResponse.status}`);
            console.error(`${getResponse.reason}`);
        }

        const list = await getResponse.json();
        console.log("all ID: ", list);
        const map = convertToMap(list);
        setIdNameMap(map);
    } catch (err) {
        console.log("Error: ", err);
        setError(true);
    }
};

    fetchAssignments();
    // ensure we have TA names available when the dialog opens
    fetchTaMap();
    }, [ticketIDs, baseURL, token]);

    const handleUpdate = async (event) => {
        //Check to see if number of ticketID is > 0 is handled in  the initial share button 
        // so there should always be at least 1 ticketID here

        //Adds shared TA to ticketassignments
        for (const ticketID of ticketIDs) {
            try{
                // selectedTA = assignedTAs.length ? assignedTAs[0].user_id : null;
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
                    //Check if Error is due to duplicate assignment (status 409) or other reason
                    if(shareResponse.status !== 409) {
                        //If it's due to duplicate assignment, we can ignore since the ticket is already shared to that TA
                        alert("Failed to updated TA assignment");
                        console.error(`Failed to updated TA assignment. Status: ${shareResponse.status}`);
                        console.error(`${shareResponse.reason}`);
                    }
                }

            } catch(error) {
                alert("ERROR");
                console.log("Error: ", error);
                setError(true);
            }
        }
        alert("Finished sharing tickets");
    }

    const handleSubmit = () => {
        if (!selectedTA) {
            alert("Please select a valid TA before confirming.");
            return;
        }
        handleUpdate();
        // close and reset
        handleDialogClose();
    }

    return(
        <Dialog
        open={handleOpen}
        onClose={handleDialogClose}
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
                    {Object.entries(idNameMap).map(([user_id, name]) => (allTAs.includes(Number(user_id)) &&
                        <option key={user_id} value={user_id}>• {name}</option> //TA name is displayed but actual value for 'selectedTA' is user_id
                        ))}
                </DialogContentText>
                <DialogContentText> 
                Pick a new TA to share the tickets to.
                </DialogContentText>
                <DialogActions classname="dropdown">
                    <select value={selectedTA} onChange={handleSelectChange}>
                        <option value="" disabled>Select a TA</option>
                        {Object.entries(idNameMap).map(([user_id, name]) => (
                        <option key={user_id} value={user_id}>{name}</option> //TA name is displayed but actual value for 'selectedTA' is user_id
                        ))}
                    </select>
                    
                </DialogActions>
                <DialogActions classname="buttons">
                    <Button onClick={handleDialogClose}>Cancel</Button>
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


export default GroupShareTicket;
