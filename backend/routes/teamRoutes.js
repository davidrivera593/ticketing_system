const express = require("express");
const teamController = require("../controllers/teamController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", teamController.getAllTeams);
// Query-based lookup avoids path issues with '/' in team names
router.get("/by-name", teamController.getTeamByNameQuery);
router.get("/name/:team_name", teamController.getTeamByName);
// Only match numeric team IDs so '/name/...' isn't swallowed by this route
router.get("/:team_id(\\d+)", teamController.getTeamById);
router.post("/", authMiddleware.verifyToken, authMiddleware.isAdmin, teamController.createTeam);
router.put("/:team_id", authMiddleware.verifyToken, authMiddleware.isAdmin, teamController.updateTeam);
router.delete("/:team_id", authMiddleware.verifyToken, authMiddleware.isAdmin, teamController.deleteTeam);

module.exports = router;