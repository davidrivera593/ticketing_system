import AddCircleIcon from "@mui/icons-material/AddCircle";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LayersIcon from "@mui/icons-material/Layers";
import ListIcon from "@mui/icons-material/List";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ASULogo from "../../assets/ASULogo.png";
import CreateTicket from "../CreateTicket/CreateTicket";
import InstructorCreateTicket from "../CreateTicket/InstructorCreateTicket";
import BugReportIcon from "@mui/icons-material/BugReport";
import "./SideBar.css";


const SideBar = () => {
  const [selectedPage, setSelectedPage] = React.useState(0);
  const [showModal, setShowModal] = useState(false);
  let navigate = useNavigate();

  const token = Cookies.get("token");
  const decodedToken = jwtDecode(token);
  const userType = decodedToken.role;

  const handleLogout = () => {
    setSelectedPage(4);
    Cookies.remove("token");
    navigate("/login");
  };

  const openModal = () => {
    setShowModal(true);
    document.body.classList.add("modal-open"); // Disable body scroll
  };

  const closeModal = () => {
    setShowModal(false);
    document.body.classList.remove("modal-open"); // Enable body scroll
  };

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      className="sideBar"
      classes={{
        paper: "sidebar-paper",
      }}
    >
      <img src={ASULogo} alt="Logo" />
      <List className="ticketsNavigation">
        <ListItemButton 
          className="buttonStyle"
          selected={selectedPage === 0}
          onClick={() => {
            setSelectedPage(0);
            if (userType == "admin") {
              navigate("/admindash");
            } else if (userType == "student") {
              navigate("/studentdash");
            } else if (userType == "TA") {
              navigate("/instructordash");
            }
          }}
        >
              <ListItemIcon>
                <DashboardIcon className="iconStyle" />
              </ListItemIcon>
              <ListItemText className="fontStyle" primary="Dashboard" />
            </ListItemButton>

          {/* Admin "All Tickets" Button */}
          {userType === "admin" && (
              <ListItemButton
                  className="buttonStyle"
                  selected={selectedPage === 1}
                  onClick={() => {
                      setSelectedPage(1);
                      navigate("/alltickets");
                  }}
              >
                  <ListItemIcon>
                      <ListIcon className="iconStyle" />
                  </ListItemIcon>
                  <ListItemText className="fontStyle" primary="All Tickets" />
              </ListItemButton>
          )}

          {/* Student "My Tickets" Button */}
          {userType === "student" && (
              <ListItemButton
                  className="buttonStyle"
                  selected={selectedPage === 1}
                  onClick={() => {
                      setSelectedPage(1);
                      navigate("/mytickets");
                  }}
              >
                  <ListItemIcon>
                      <ListIcon className="iconStyle" />
                  </ListItemIcon>
                  <ListItemText className="fontStyle" primary="My Tickets" />
              </ListItemButton>
          )}

          {/* TA Ticket Buttons */}
          {userType === "TA" && (
              <>
                  <ListItemButton
                      className="buttonStyle"
                      selected={selectedPage === 1}
                      onClick={() => {
                          setSelectedPage(1);
                          navigate("/instructortickets");
                      }}
                  >
                      <ListItemIcon>
                          <ListIcon className="iconStyle" />
                      </ListItemIcon>
                      <ListItemText className="fontStyle" primary="Assigned Tickets" />
                  </ListItemButton>

              <ListItemButton
              className="buttonStyle"
              selected={selectedPage === 6} // Assign a unique selectedPage index for "My Tickets"
              onClick={() => {
                  setSelectedPage(6);
                  navigate("/TaRequestTickets");
              }}
              >{}
          <ListItemIcon>
              <ListIcon className="iconStyle" />
          </ListItemIcon>
          <ListItemText className="fontStyle" primary="My Tickets" />
              </ListItemButton>
    </>
              )}

      { userType === "admin" && (
      <ListItemButton
          className="buttonStyle"
          selected={selectedPage === 5} // Assign a unique selectedPage index for "Escalated Tickets"
          onClick={() => {
            setSelectedPage(5);
            navigate("/escalatedtickets"); // Navigate to a new route for escalated tickets
          }}
        >
          <ListItemIcon>
            <LayersIcon className="iconStyle" />
          </ListItemIcon>
          <ListItemText className="fontStyle" primary="Escalated Tickets" />
        </ListItemButton>
      )}

        <ListItemButton
          className="buttonStyle"
          selected={selectedPage === 2} // Assign a unique selectedPage index for "All Assignees"
          onClick={() => {
            setSelectedPage(2);
            navigate("/allassignees"); // Navigate to a new route for all assignees
          }}
        >
          <ListItemIcon>
            <ListIcon className="iconStyle" />
          </ListItemIcon>
          <ListItemText className="fontStyle" primary="All Assignees" />
        </ListItemButton>

        { (userType === "student" || userType === "TA") && (
          <ListItemButton
            className="buttonStyle"
            selected={selectedPage === 3}
            onClick={() => {
              openModal();
              //setSelectedPage(3);
              //navigate("ticketsubmit");
            }}
          >
            <ListItemIcon>
              <AddCircleIcon className="iconStyle" />
            </ListItemIcon>
            <ListItemText className="fontStyle" primary="Create A Ticket" />
          </ListItemButton>
        )}
      </List>

      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
            {userType === "student" && <CreateTicket onClose={closeModal} />}
            {userType === "TA" && <InstructorCreateTicket onClose={closeModal} />}
        </div>
      )}

      <List className="settingsAndLogOut">
         <ListItemButton
          className="buttonStyle"
          selected={selectedPage === 7}
          onClick={() => { setSelectedPage(7); navigate("/bug-report"); }}
      >
        <ListItemIcon><BugReportIcon className="iconStyle" /></ListItemIcon>
        <ListItemText className="fontStyle" primary="Report a Bug" />
      </ListItemButton>
      <ListItemButton
          className="buttonStyle"
          onClick={() => {
            setSelectedPage(4);
            if (userType === "admin") {
              navigate("/adminsettings");
            } else if (userType === "TA") {
              navigate("/tasettings");
            } else if (userType === "student") {
              navigate("/studentsettings");
            }
          }}
          selected={selectedPage === 4}
        >
          <ListItemIcon>
            <SettingsIcon className="iconStyle" />
          </ListItemIcon>
          <ListItemText className="fontStyle" primary="Settings" />
        </ListItemButton>
        <ListItemButton className="buttonStyle" onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon className="iconStyle" />
          </ListItemIcon>
          <ListItemText className="fontStyle" primary="Log Out" />
        </ListItemButton>
      </List>
    </Drawer>
  );
};

export default SideBar;
