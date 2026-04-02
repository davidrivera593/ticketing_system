const StudentData = require("../models/StudentData");

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