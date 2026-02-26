import AdminDash from "./pages/AdminDash/AdminDash";
import AllAssignees from "./pages/AllAssignees/AllAssignees";
import AllTickets from "./pages/AllTickets/AllTickets";
import ChangePassword from "./pages/ChangePassword/ChangePassword";
import InstructorDash from "./pages/InstructorDash/InstructorDash";
import InstructorProfile from "./pages/InstructorProfile/InstructorProfile";
import InstructorTickets from "./pages/InstructorTickets/InstructorTickets";
import TicketSubmit from "./pages/IssueSubmissionForm/IssueSubmissionForm";
import Login from "./pages/Login/Login";
import MyTickets from "./pages/MyTickets/MyTickets";
import RequestReset from "./pages/RequestReset/RequestReset";
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import StudentDash from "./pages/StudentDash/StudentDash";
import TAinfo from "./pages/TAInfo/TAinfo";
import TicketInfo from "./pages/TicketInfo/TicketInfo";
import TicketQueue from "./pages/TicketQueue/TicketQueue";
import Unauthorized from "./pages/Unauthorized/Unauthorized";

const routes = [
  { path: "/login", element: <Login />, isProtected: false },
  { path: "/unauthorized", element: <Unauthorized />, isProtected: false },
  {
    path: "/change-password",
    element: <ChangePassword />,
    isProtected: true,
    roles: ["admin", "student", "TA"],
  },
  {
    path: "/ticketinfo",
    element: <TicketInfo />,
    isProtected: true,
    roles: ["admin", "student", "TA"],
  },
  {
    path: "/ticketsubmit",
    element: <TicketSubmit />,
    isProtected: true,
    roles: ["admin", "student", "TA"],
  },
  {
    path: "/ticketqueue",
    element: <TicketQueue />,
    isProtected: true,
    roles: ["admin", "student", "TA"],
  },
  {
    path: "/alltickets",
    element: <AllTickets />,
    isProtected: true,
    roles: ["admin", "student", "TA"],
  },
  {
    path: "/allassignees",
    element: <AllAssignees />,
    isProtected: true,
    roles: ["admin", "student", "TA"],
  },
  {
    path: "/mytickets",
    element: <MyTickets user_id={7} />,
    isProtected: true,
    roles: ["admin", "student", "TA"],
  },
  {
    path: "/instructortickets",
    element: <InstructorTickets />,
    isProtected: true,
    roles: ["admin", "student", "TA"],
  },
  {
    path: "/ta-info",
    element: <TAinfo />,
    isProtected: true,
    roles: ["admin", "student", "TA"],
  },
  {
    path: "/admindash",
    element: <AdminDash />,
    isProtected: true,
    roles: ["admin"],
  },
  {
    path: "/studentdash",
    element: <StudentDash />,
    isProtected: true,
    roles: ["student"],
  },
  {
    path: "/instructordash",
    element: <InstructorDash />,
    isProtected: true,
    roles: ["TA"],
  },
  {
    path: "/instructorprofile",
    element: <InstructorProfile />,
    isProtected: true,
    roles: ["admin", "student", "TA"],
  },
  {
    path: '/requestreset',
    element: <RequestReset />,
    isProtected: false,
    roles: [],
  },
  {
    path: "/resetpassword",
    element: <ResetPassword />,
    isProtected: false,
    roles: [],
  }
];

export default routes;
