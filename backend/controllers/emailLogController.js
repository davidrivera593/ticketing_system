const { Op } = require("sequelize");
const EmailLog = require("../models/EmailLog");
const User = require("../models/User");

const getLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      recipient,
      subject,
      status,
      emailType,
      startDate,
      endDate,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (recipient) {
      where.recipient = { [Op.iLike]: `%${recipient}%` };
    }

    if (subject) {
      where.subject = { [Op.iLike]: `%${subject}%` };
    }

    if (status) {
      where.status = status;
    }

    if (emailType) {
      where.email_type = emailType;
    }

    if (startDate || endDate) {
      where.sent_at = {};
      if (startDate) {
        where.sent_at[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        // Include the full end date day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.sent_at[Op.lte] = end;
      }
    }

    const { rows, count } = await EmailLog.findAndCountAll({
      where,
      order: [["sent_at", "DESC"]],
      limit: parseInt(limit),
      offset,
    });

    // Look up user info (name, role) for each unique recipient email
    const uniqueEmails = [...new Set(rows.map((log) => log.recipient))];
    const users = await User.findAll({
      where: { email: { [Op.in]: uniqueEmails } },
      attributes: ["email", "name", "role"],
    });

    const userMap = {};
    users.forEach((user) => {
      userMap[user.email] = { name: user.name, role: user.role };
    });

    // Attach user info to each log entry
    const logsWithUserInfo = rows.map((log) => {
      const plain = log.toJSON();
      const userInfo = userMap[plain.recipient];
      plain.recipient_name = userInfo ? userInfo.name : null;
      plain.recipient_role = userInfo ? userInfo.role : null;
      return plain;
    });

    res.status(200).json({
      logs: logsWithUserInfo,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / parseInt(limit)),
    });
  } catch (error) {
    console.error("Failed to fetch email logs:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getLogs };
