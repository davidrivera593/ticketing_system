import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import React from "react";

const ROLE_DISPLAY_NAMES = {
  student: "Students",
  TA: "TAs",
  grader: "Graders",
  admin: "Admins",
  developer: "Developers",
};

const FAQ_ITEMS = [
  {
    id: "create-ticket",
    question: "How do I create a ticket?",
    answer:
      "Use the Create A Ticket option in the sidebar, complete the form, and submit.",
  },
  {
    id: "check-ticket-status",
    question: "How do I check my ticket status?",
    answer:
      "Open your tickets list and select a ticket to view its current status and details.",
  },
  {
    id: "ticket-status-meaning",
    question: "What do ticket statuses mean?",
    answer:
      "New means recently submitted, Ongoing means in progress, and Resolved means completed.",
  },
  {
    id: "update-password",
    question: "How do I update my account password?",
    answer: "Go to your account/profile area and use the change password option.",
  },
  {
    id: "forgot-password",
    question: "I forgot my password. What should I do?",
    answer:
      "Use the reset password flow from the login page to request a password reset link.",
  },
  {
    id: "report-problems",
    question: "Where can I report problems with the system?",
    answer:
      "Use the Report a Bug option from the profile menu to submit technical issues.",
  },
];

const FAQ = () => {
  const [expandedPanel, setExpandedPanel] = React.useState(false);

  const getPanelId = React.useCallback((item, index) => {
    if (item.id) return item.id;

    const base = String(item.question || "faq")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    return base ? `faq-${base}` : `faq-${index}`;
  }, []);

  const userRole = React.useMemo(() => {
    const token = Cookies.get("token");
    if (!token) return null;

    try {
      const decoded = jwtDecode(token);
      return decoded?.role ?? null;
    } catch {
      return null;
    }
  }, []);

  const generalFaqs = React.useMemo(
    () => FAQ_ITEMS.filter((item) => !item.roles),
    []
  );

  const roleFaqs = React.useMemo(() => {
    if (!userRole) return [];
    return FAQ_ITEMS.filter((item) =>
      Array.isArray(item.roles) ? item.roles.includes(userRole) : false
    );
  }, [userRole]);

  const handleChange = (panelId) => (_event, isExpanded) => {
    setExpandedPanel(isExpanded ? panelId : false);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: "background.default",
        padding: 6.25,
        gap: 2.5,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 1100 }}>
        <Typography
          variant="h1"
          sx={{ fontWeight: "bold", fontSize: "2rem", textAlign: "center" }}
        >
          Help / FAQ
        </Typography>

        <Typography variant="body1" sx={{ color: "text.secondary", mt: 2.5 }}>
          General questions for all users.
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
          {generalFaqs.map((item, index) => {
            const panelId = getPanelId(item, index);

            return (
              <Accordion
                key={item.id || item.question}
                expanded={expandedPanel === panelId}
                onChange={handleChange(panelId)}
                disableGutters
                sx={{
                  backgroundColor: "background.paper",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  overflow: "hidden",
                  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                  "&:before": { display: "none" },
                  "&:hover": {
                    borderColor: "text.secondary",
                  },
                  "&.Mui-expanded": {
                    margin: 0,
                  },
                }}
              >
                <AccordionSummary
                  id={`${panelId}-header`}
                  aria-controls={`${panelId}-content`}
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    px: 2.5,
                    py: 1.5,
                    transition: "background-color 0.2s ease",
                    "& .MuiAccordionSummary-content": { my: 0 },
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
                    "&.Mui-focusVisible": {
                      outline: "none",
                      boxShadow: 2,
                    },
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    {item.question}
                  </Typography>
                </AccordionSummary>

                <AccordionDetails
                  id={`${panelId}-content`}
                  sx={{
                    backgroundColor: "action.selected",
                    borderTop: "1px solid",
                    borderColor: "divider",
                    px: 2.5,
                    pt: 0,
                    pb: 2.5,
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{ color: "text.primary", mt: 0.5, lineHeight: 1.6 }}
                  >
                    {item.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>

        {roleFaqs.length > 0 && (
          <>
            <Typography
              variant="h6"
              sx={{ fontWeight: "bold", mt: 4 }}
            >
              User specific questions
            </Typography>

            <Typography
              variant="body1"
              sx={{ color: "text.secondary", mt: 1 }}
            >
              {ROLE_DISPLAY_NAMES[userRole]
                ? `Applicable for ${ROLE_DISPLAY_NAMES[userRole]}.`
                : "Applicable for your role."}
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
              {roleFaqs.map((item, index) => {
                const panelId = getPanelId(item, index);

                return (
                  <Accordion
                    key={item.id || item.question}
                    expanded={expandedPanel === panelId}
                    onChange={handleChange(panelId)}
                    disableGutters
                    sx={{
                      backgroundColor: "background.paper",
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                      overflow: "hidden",
                      transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                      "&:before": { display: "none" },
                      "&:hover": {
                        borderColor: "text.secondary",
                      },
                      "&.Mui-expanded": {
                        margin: 0,
                      },
                    }}
                  >
                    <AccordionSummary
                      id={`${panelId}-header`}
                      aria-controls={`${panelId}-content`}
                      expandIcon={<ExpandMoreIcon />}
                      sx={{
                        px: 2.5,
                        py: 1.5,
                        transition: "background-color 0.2s ease",
                        "& .MuiAccordionSummary-content": { my: 0 },
                        "&:hover": {
                          backgroundColor: "action.hover",
                        },
                        "&.Mui-focusVisible": {
                          outline: "none",
                          boxShadow: 2,
                        },
                      }}
                    >
                      <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                        {item.question}
                      </Typography>
                    </AccordionSummary>

                    <AccordionDetails
                      id={`${panelId}-content`}
                      sx={{
                        backgroundColor: "action.selected",
                        borderTop: "1px solid",
                        borderColor: "divider",
                        px: 2.5,
                        pt: 0,
                        pb: 2.5,
                      }}
                    >
                      <Typography
                        variant="body1"
                        sx={{
                          color: "text.primary",
                          mt: 0.5,
                          lineHeight: 1.6,
                        }}
                      >
                        {item.answer}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default FAQ;