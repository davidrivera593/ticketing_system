import { Box, Typography } from "@mui/material";
import React from "react";

const generalFaqs = [
  {
    question: "How do I create a ticket?",
    answer:
      "Use the Create A Ticket option in the sidebar, complete the form, and submit.",
  },
  {
    question: "How do I check my ticket status?",
    answer:
      "Open your tickets list and select a ticket to view its current status and details.",
  },
  {
    question: "What do ticket statuses mean?",
    answer:
      "New means recently submitted, Ongoing means in progress, and Resolved means completed.",
  },
  {
    question: "How do I update my account password?",
    answer:
      "Go to your account/profile area and use the change password option.",
  },
  {
    question: "I forgot my password. What should I do?",
    answer:
      "Use the reset password flow from the login page to request a password reset link.",
  },
  {
    question: "Where can I report problems with the system?",
    answer:
      "Use the Report a Bug option from the profile menu to submit technical issues.",
  },
];

const FAQ = () => {
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
          {generalFaqs.map((item) => (
            <Box
              component="article"
              tabIndex={0}
              key={item.question}
              sx={{
                backgroundColor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                padding: 2.5,
                transition: "border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease",
                "&:hover": {
                  backgroundColor: "action.hover",
                  borderColor: "text.secondary",
                },
                "&:focus-visible": {
                  outline: "none",
                  borderColor: "primary.main",
                  boxShadow: 2,
                },
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                {item.question}
              </Typography>
              <Typography variant="body1" sx={{ color: "text.secondary", mt: 1 }}>
                {item.answer}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default FAQ;