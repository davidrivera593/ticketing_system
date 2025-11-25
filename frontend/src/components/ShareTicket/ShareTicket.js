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
    // const [ticketList, setTicketList] = useState([]); // Initialize as empty array
    // const [idToNameMap, setIdToNameMap] = useState([]);
    const [error, setError] = useState(false);
    const token = Cookies.get("token");

    

    const handleSelectChange = (event) => {
        setSelectedTA(Number(event.target.value));
    };

    // const fetchAssignedTaID = async () => {
    //     try {
    //       const token = Cookies.get("token");
          
    //       const getResponse = await fetch(
    //         `${baseURL}/api/ticketassignments/ticket/${ticketID}`,
    //         {
    //             method: "GET",
    //             headers: {
    //                 "Content-Type": "application/json",
    //                 Authorization: `Bearer ${token}`,
    //             },
    //         });
    
    //         //console.log("Assigned TA ID: ", getResponse);
    
    //         if (!getResponse.ok) {
    //           console.error(`Failed to get assigned TAs ID. Status: ${getResponse.status}`);
    //           console.error(`${getResponse.reason}`);
    //         }
          
    //         const list = await getResponse.json();
    //         console.log("Assigned TA ID: ", list);
    //         const TA_id = list.map(obj => obj.user_id)[0]; //if tickets have multiple TAs, only get the first one
    //         setAssignedID(TA_id);
    
    //       } catch (err) {
    //         console.log("Error: ", err);
    //         setError(true);
    //       }
    // }

    // const convertToMap = (list) => {
    //     return list.reduce((acc, obj) => { //map ID to name
    //     acc[obj.user_id] = obj.name;
    //     return acc;
    //     }, []);
    // };

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
            //handleClose();
            },
        }}
        >
            <DialogContent>
                <DialogContentText variant="body1" sx={{ fontWeight: '500', color: "black" }}>
                    Assigned TAs
                </DialogContentText>
                <DialogContentText> 
                    {Object.entries(idNameMap).map(([user_id, name]) => (allTAs.includes(Number(user_id)) &&
                        <option key={user_id} value={user_id}>• {name}</option>
                        ))}
                </DialogContentText>
                <DialogContentText> 
                Pick a new TA to share ticket {ticketID} to.
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
