const User = require("../models/User");
const PasswordResetToken = require("../models/PasswordResetToken");
const sendEmail = require("../services/emailService");
const baseURL = process.env.REACT_APP_API_BASE_URL;
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { validatePassword } = require("../utils/passwordValidator");

exports.requestPasswordReset = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const rawToken = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

        await PasswordResetToken.create({ 
            user_id: user.user_id,
            token_hash: tokenHash,
            expires_at: new Date(Date.now() + 3600000), 
            // used defaults as false
        });

        const resetLink = `${baseURL}/resetpassword?token=${rawToken}`; //modify for prod?
        let devResetLinkLine = "";
        if (process.env.NODE_ENV === "development") {
            const devResetLink = `http://localhost:3001/resetpassword?token=${rawToken}`;
            devResetLinkLine = `dev link: ${devResetLink}\n`;
        }
        await sendEmail(
            user.email,
            "Help Desk Password Reset (Time critical)",
            `Your password reset link: ${resetLink}\n` +
            `This link will expire in 1 hour. If the reset expired, go to the login page to request another password reset.\n` +
            devResetLinkLine
        );
        res.status(200).json({ message: "Password reset email sent." });
    
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.validatePasswordResetToken = async (req, res) => {
    const {token, password} = req.body;
    if (!token || !password) {
        return res.status(400).json({ error: "Token and password are required." });
    }
    try {
        const passwordCheck = validatePassword(password);
        if (!passwordCheck.valid) {
            return res.status(400).json({
                error: "Password policy violation",
                details: passwordCheck.errors,
            });
        }

        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
        const resetToken = await PasswordResetToken.findOne({ 
            where: { 
                token_hash: tokenHash,
                used: false
            }
        });

        if (!resetToken) {
            return res.status(400).json({ error: "Invalid or expired token." });
        }

        if (resetToken.expires_at < new Date()) {
            return res.status(400).json({ error: "Token has expired." });
        }

        const user = await User.findByPk(resetToken.user_id);
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await user.update({ password: hashedPassword });

        await resetToken.update({ used: true });

        return res.json({ message: "Password has been reset successfully." });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
