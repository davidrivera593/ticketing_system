const { StudentData, User } = require("../models");

exports.getStudentDataByUserId = async (req, res) => {
    try {
        const studentData = await StudentData.findOne({ where: { user_id: req.params.user_id } });
        if (studentData) {
            res.json(studentData);
        } else {
            res.status(404).json({ error: "Student data not found" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createStudentData = async (req, res) => {
    try {
       const { user_id, team_id, section, semester } = req.body;
        const [user, created] = await StudentData.findOrCreate({
            where: { user_id },
            defaults: { user_id, team_id, section, semester }
        });
        
        if (created) return res.status(201).json({ created: true, user });
        return res.status(200).json({ created: false, user });
 
        // const studentData = await StudentData.create(req.body);
        // res.status(201).json(studentData);
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

exports.updateStudentData = async (req, res) => {
    try {
        const studentData = await StudentData.findOne({ where: { user_id: req.params.user_id } });
        if (studentData) {
            await studentData.update(req.body);
            res.json(studentData);
        } else {
            res.status(404).json({ error: "Student data not found" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getStudentsByTeam = async (req, res) => {
    try {
        const { team_id } = req.params;

        // Fetch StudentData records for the team, including User details
        const students = await StudentData.findAll({
            where: { team_id },
            include: [{
                model: User,
                attributes: ['user_id', 'name', 'email']
            }]
        });

        // Flatten the response so the frontend gets an array of user objects
        const formattedStudents = students.map(s => ({
            user_id: s.User.user_id,
            name: s.User.name,
            email: s.User.email
        }));

        res.json(formattedStudents);
    } catch (error) {
        console.error("Error fetching students by team:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getTeamForStudent = async (req, res) => {
    try {
        const { user_id } = req.params;

        const studentData = await StudentData.findOne({
            where: { user_id },
            attributes: ['team_id'] // We only need the team_id for this
        });

        if (studentData && studentData.team_id) {
            res.json({ team_id: studentData.team_id });
        } else {
            res.status(404).json({ error: "No team assigned to this student" });
        }
    } catch (error) {
        console.error("Error fetching student's team:", error);
        res.status(500).json({ error: error.message });
    }
};