const express = require("express");
const studentDataController = require("../controllers/studentDataController");

const router = express.Router();

router.get("/:user_id", studentDataController.getStudentDataByUserId);
router.post("/", studentDataController.createStudentData);
router.put("/:user_id", studentDataController.updateStudentData); //use when id in user but not in studentdata

router.get("/team/:team_id", studentDataController.getStudentsByTeam);

router.get('/user/:user_id/team', studentDataController.getTeamForStudent);

module.exports = router;