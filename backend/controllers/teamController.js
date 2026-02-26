const Team = require("../models/Team");

exports.getAllTeams = async (req, res) => {
  try {
    const teams = await Team.findAll();
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTeamById = async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.team_id);
    if (team) {
      res.json(team);
    } else {
      res.status(404).json({ error: "Team not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTeamByName = async (req, res) => {
  try {
    const team = await Team.findOne({ where: { team_name: req.params.team_name } });
    if (team) {
      res.json(team);
    } else {
      res.status(404).json({ error: "Team not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createTeam = async (req, res) => {
  try {
    const {team_name, instructor_user_id, sponsor_name, sponsor_email, grader_name, grader_email} = req.body;
    
    const [team, created] = await Team.findOrCreate({
      where: { team_name },
      defaults: { team_name, instructor_user_id, sponsor_name, sponsor_email, grader_name, grader_email },
    });
    if (created) return res.status(201).json({ created: true, team });
        return res.status(200).json({ created: false, team });
 
  } catch (error) {
     if (error.name === 'SequelizeUniqueConstraintError') {
            const details = (error.errors || []).map(e => ({ path: e.path, message: e.message }));
            return res.status(409).json({ error: 'Unique constraint', details });
        }
        if (error.name === 'SequelizeValidationError') {
            const details = (error.errors || []).map(e => ({ path: e.path, message: e.message }));
            return res.status(400).json({ error: 'Validation error', details });
        }
    
    res.status(500).json({ error: error.message });
  }
};

exports.updateTeam = async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.team_id);
    if (team) {
      await team.update(req.body);
      res.json(team);
    } else {
      res.status(404).json({ error: "Team not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.team_id);
    if (team) {
      await team.destroy();
      res.status(204).json();
    } else {
      res.status(404).json({ error: "Team not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
