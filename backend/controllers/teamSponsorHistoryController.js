const TeamSponsorHistory = require("../models/TeamSponsorHistory");
const Team = require("../models/Team");
const User = require("../models/User");

exports.getHistoryByTeam = async (req, res) => {
  try {
    const { team_id } = req.params;

    const team = await Team.findByPk(team_id);
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    const history = await TeamSponsorHistory.findAll({
      where: { team_id },
      include: [
        {
          model: User,
          as: "changedBy",
          attributes: ["user_id", "name", "email"],
          required: false,
        },
      ],
      order: [["changed_at", "DESC"]],
    });

    res.json(history);
  } catch (error) {
    console.error("Error fetching sponsor history:", error);
    res.status(500).json({ error: error.message });
  }
};
