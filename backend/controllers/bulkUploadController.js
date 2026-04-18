const bcrypt = require("bcryptjs");
const sequelize = require("../config/db");
const User = require("../models/User");
const Team = require("../models/Team");
const StudentData = require("../models/StudentData");
const TeamMember = require("../models/TeamMember");

const normalizeTeamName = (value) =>
  String(value ?? "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const trimValue = (value) => String(value ?? "").trim();

const getUserId = (u) => u?.user_id ?? u?.id;
const getTeamId = (t) => t?.team_id ?? t?.id;

const createTempPasswordHash = async () => {
  const temp = `Temp#${Math.random().toString(36).slice(2, 10)}A1`;
  return bcrypt.hash(temp, 10);
};

const findOrCreateUserByEmail = async ({ name, email, role, transaction }) => {
  const cleanEmail = trimValue(email);
  const cleanName = trimValue(name);

  if (!cleanEmail) throw new Error(`Missing email for ${role}`);
  if (!cleanName) throw new Error(`Missing name for ${role}`);

  const existing = await User.findOne({ where: { email: cleanEmail }, transaction });
  if (existing) return { user: existing, created: false };

  const password = await createTempPasswordHash();
  const created = await User.create(
    {
      name: cleanName,
      email: cleanEmail,
      password,
      role,
      must_change_password: true,
    },
    { transaction }
  );

  return { user: created, created: true };
};

exports.importBulk = async (req, res) => {
  const { projectRows, studentRows } = req.body || {};

  if (!Array.isArray(projectRows) || !Array.isArray(studentRows)) {
    return res.status(400).json({
      message: "projectRows and studentRows must be arrays",
    });
  }

  try {
    await sequelize.transaction(async (transaction) => {
      const teamByName = new Map();

      // First create/find INSTRUCTOR TA
      for (const row of projectRows) {
        const instructorName = trimValue(row.instructor);
        const instructorEmail = trimValue(row.instructor_email);

        await findOrCreateUserByEmail({
          name: instructorName,
          email: instructorEmail,
          role: "TA",
          transaction,
        });
      }

      // Next create/find teams
      for (const row of projectRows) {
        const teamName = normalizeTeamName(row.project);
        if (!teamName) throw new Error("Project/team name is required");

        const instructorEmail = trimValue(row.instructor_email);
        const instructorUser = await User.findOne({
          where: { email: instructorEmail },
          transaction,
        });

        if (!instructorUser) {
          throw new Error(`Could not find TA with email ${instructorEmail}`);
        }

        const instructorUserId = getUserId(instructorUser);
        if (!instructorUserId) throw new Error(`Missing user_id for TA ${instructorEmail}`);

        let team = await Team.findOne({ where: { team_name: teamName }, transaction });

        if (!team) {
          team = await Team.create(
            {
              team_name: teamName,
              instructor_user_id: instructorUserId,
              sponsor_name: trimValue(row.sponsor),
              sponsor_email: trimValue(row.sponsor_email),
              grader_name: trimValue(row.grader),
              grader_email: trimValue(row.grader_email),
            },
            { transaction }
          );
        }

        teamByName.set(teamName.toLowerCase(), team);
      }

      // Next generate student users
      for (const row of studentRows) {
        const teamName = normalizeTeamName(row.group_name);
        if (!teamName) throw new Error("group_name is required");

        const team =
          teamByName.get(teamName.toLowerCase()) ||
          (await Team.findOne({ where: { team_name: teamName }, transaction }));

        if (!team) throw new Error(`Team not found for student row: ${teamName}`);

        const teamId = getTeamId(team);
        if (!teamId) throw new Error(`Missing team_id for ${teamName}`);

        const name = trimValue(row.name).replace(/,/g, "");
        const loginId = trimValue(row.login_id);
        if (!loginId) throw new Error(`Missing login_id for student ${name || "(unknown)"}`);

        const studentEmail = `${loginId}@asu.edu`;
        const section = trimValue(row.sections);

        let student = await User.findOne({
          where: { email: studentEmail },
          transaction,
        });

        if (!student) {
          const password = await createTempPasswordHash();
          student = await User.create(
            {
              name: name || studentEmail,
              email: studentEmail,
              password,
              role: "student",
              must_change_password: true,
            },
            { transaction }
          );
        } else {
          const nextName = name || studentEmail;
          if (trimValue(student.name) !== trimValue(nextName)) {
            await student.update({ name: nextName }, { transaction });
          }
        }

        const studentId = getUserId(student);
        if (!studentId) throw new Error(`Missing user_id for student ${studentEmail}`);

        let studentData = await StudentData.findOne({
          where: { user_id: studentId },
          transaction,
        });

        if (!studentData) {
          await StudentData.create(
            {
              user_id: studentId,
              team_id: teamId,
              section,
            },
            { transaction }
          );
        } else {
          const needsUpdate =
            String(studentData.section ?? "") !== String(section ?? "") ||
            Number(studentData.team_id) !== Number(teamId);

          if (needsUpdate) {
            await studentData.update(
              {
                section,
                team_id: teamId,
              },
              { transaction }
            );
          }
        }

        // ensure team member exists
        const existingMember = await TeamMember.findOne({
          where: { team_id: teamId, user_id: studentId },
          transaction,
        });

        if (!existingMember) {
          await TeamMember.create(
            { team_id: teamId, user_id: studentId },
            { transaction }
          );
        }
      }

      // Finally create/find grader users
      for (const row of projectRows) {
        await findOrCreateUserByEmail({
          name: trimValue(row.grader),
          email: trimValue(row.grader_email),
          role: "grader",
          transaction,
        });
      }
    });

    return res.status(200).json({
      message: "Bulk import completed successfully",
    });
  } catch (error) {
    return res.status(400).json({
      message: "Bulk import failed. No data was saved.",
      error: error.message,
    });
  }
};