const express = require("express");
const teamSponsorHistoryController = require("../controllers/teamSponsorHistoryController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/teams/:team_id/sponsor-history
// Accessible by admin, TA, and grader
router.get(
  "/:team_id/sponsor-history",
  authMiddleware.verifyToken,
  authMiddleware.isStaff,
  teamSponsorHistoryController.getHistoryByTeam
);

module.exports = router;
