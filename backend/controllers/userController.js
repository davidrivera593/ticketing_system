const User = require("../models/User");
const bcrypt = require("bcryptjs"); // Required for password change
const StudentData = require("../models/StudentData");
const Team = require("../models/Team");
const { validatePassword } = require("../utils/passwordValidator");
// github tracking

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.user_id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ where: { email } });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.user_id);
    if (user) {
      const {
        name,
        email,
        notifications_enabled,
        dark_mode,
        is_enabled,
      } = req.body;

      await user.update({
        name,
        email,
        notifications_enabled,
        dark_mode,
        is_enabled,
      });

      res.json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.user_id);
    if (user) {
      await user.destroy();
      res.status(204).json();
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUsersByRole = async (req, res) => {
    try {
        const { role } = req.params;
        const validRoles = ["student", "TA", "admin", "grader"];

        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: "Invalid role specified" });
        }

        if (!User.associations.StudentData) {
            User.hasOne(StudentData, { foreignKey: 'user_id' });
            StudentData.belongsTo(User, { foreignKey: 'user_id' });
        }

        if (!StudentData.associations.Team) {
            Team.hasMany(StudentData, { foreignKey: 'team_id' });
            StudentData.belongsTo(Team, { foreignKey: 'team_id' });
        }

        let queryOptions = {
            where: { role },
            attributes: ['user_id', 'name', 'email', 'is_enabled'],
        };

        if (role === 'student') {
            queryOptions.include = [
                {
                    model: StudentData,
                    required: false,
                    attributes: ['section'],
                    include: [
                        {
                            model: Team,
                            required: false,
                            attributes: ['team_name', 'sponsor_name'],
                        }
                    ]
                }
            ];
        }

        const users = await User.findAll(queryOptions);

        const flatUsers = users.map(user => {
            const u = user.toJSON();

            if (role === 'student') {
                const sData = u.StudentData || u.StudentDatum || {};
                const team = sData.Team || {};

                return {
                    user_id: u.user_id,
                    name: u.name,
                    email: u.email,
                    is_enabled: u.is_enabled,
                    section: sData.section || "N/A",
                    sponsor: team.sponsor_name || "N/A",
                    team_name: team.team_name || "N/A"
                };
            }
            return u;
        });

        res.json(flatUsers);

    } catch (error) {
        console.error("Error in getUsersByRole:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user?.user_id || req.user?.id;
    if (!userId) {
      return res.status(400).json({ error: "User id not provided" });
    }

    const user = await User.findByPk(userId, {
      attributes: [
        "user_id",
        "name",
        "email",
        "role",
        "notifications_enabled",
        "dark_mode",
        "is_enabled"
      ],
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//  Restore missing changePassword handler
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user?.user_id || req.user?.id;
    if (!userId) {
      return res.status(400).json({ error: "User ID not provided" });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Both current and new passwords are required" });
    }

    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        error: "Password policy violation",
        details: passwordCheck.errors,
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    await user.update({ 
      password: hashedNewPassword,
      must_change_password: false 
    });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
