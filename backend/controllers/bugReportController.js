const Joi = require("joi");
const { Op } = require("sequelize");
const { BugReport } = require("../models");

const hasAttr = (name) => !!BugReport?.rawAttributes?.[name];

const createSchema = Joi.object({
  subject: Joi.string().trim().max(255).required(),
  description: Joi.string().trim().max(10000).required(),
  severity: Joi.string().valid("low", "medium", "high", "critical").optional(),
}).unknown(false);

const updateSchema = Joi.object({
  subject: Joi.string().trim().max(255),
  description: Joi.string().trim().max(10000),
  severity: Joi.string().valid("low", "medium", "high", "critical"),
  status: Joi.string().valid("open", "triaged", "in_progress", "resolved", "closed"),
}).min(1).unknown(false);

exports.create = async (req, res) => {
  try {
    const { value, error } = createSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ ok: false, errors: error.details.map((d) => d.message) });

    const payload = {
      subject: value.subject,
      description: value.description,
    };

    if (hasAttr("severity") && value.severity) payload.severity = value.severity;
    if (hasAttr("status")) payload.status = "open";

    const uid = req.user?.user_id ?? req.user?.id ?? null;
    if (uid !== null) {
      if (hasAttr("user_id")) payload.user_id = uid;
      if (hasAttr("reporter_id")) payload.reporter_id = uid;
    }

    const saved = await BugReport.create(payload);
    return res.status(201).json({ ok: true, data: saved });
  } catch (e) {
    console.error("[bugReportController.create]", e);
    return res.status(500).json({ ok: false, error: "Internal error" });
  }
};

exports.list = async (req, res) => {
  try {
    const where = {};
    if (req.query.status && hasAttr("status")) where.status = req.query.status;
    if (req.query.severity && hasAttr("severity")) where.severity = req.query.severity;
    if (req.query.q && hasAttr("subject")) {
      where[Op.or] = [
        { subject: { [Op.like]: `%${req.query.q}%` } },
        hasAttr("description") ? { description: { [Op.like]: `%${req.query.q}%` } } : null,
      ].filter(Boolean);
    }

    const rows = await BugReport.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    return res.json({ ok: true, data: rows });
  } catch (e) {
    console.error("[bugReportController.list]", e);
    return res.status(500).json({ ok: false, error: "Internal error" });
  }
};

exports.getOne = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ ok: false, error: "Invalid id" });

    const row = await BugReport.findByPk(id);
    if (!row) return res.status(404).json({ ok: false, error: "Not found" });

    return res.json({ ok: true, data: row });
  } catch (e) {
    console.error("[bugReportController.getOne]", e);
    return res.status(500).json({ ok: false, error: "Internal error" });
  }
};

exports.update = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ ok: false, error: "Invalid id" });

    const { value, error } = updateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ ok: false, errors: error.details.map((d) => d.message) });

    const row = await BugReport.findByPk(id);
    if (!row) return res.status(404).json({ ok: false, error: "Not found" });

    const updates = {};
    for (const k of Object.keys(value)) {
      if (hasAttr(k)) updates[k] = value[k];
    }
    if (Object.keys(updates).length === 0) return res.status(400).json({ ok: false, error: "No valid fields to update" });

    await row.update(updates);
    return res.json({ ok: true, data: row });
  } catch (e) {
    console.error("[bugReportController.update]", e);
    return res.status(500).json({ ok: false, error: "Internal error" });
  }
};

exports.remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ ok: false, error: "Invalid id" });

    const row = await BugReport.findByPk(id);
    if (!row) return res.status(404).json({ ok: false, error: "Not found" });

    await row.destroy();
    return res.json({ ok: true });
  } catch (e) {
    console.error("[bugReportController.remove]", e);
    return res.status(500).json({ ok: false, error: "Internal error" });
  }
};
