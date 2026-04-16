const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const logger = require("../utils/logger");

const router = express.Router();

const levelForStatus = (status) => {
  if (status === "failed") return "error";
  if (status === "pending" || status === "skipped") return "warn";
  return "info";
};

router.post(
  "/bulk-upload",
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  (req, res) => {
    const {
      operation = "bulk_upload",
      operationId = null,
      step = "unknown",
      status = "info",
      reason = null,
      details = null,
      fileName = null,
    } = req.body || {};

    const level = levelForStatus(status);
    const message = `Bulk upload step ${status}`;

    logger[level](message, {
      operation,
      operationId,
      step,
      reason,
      details,
      fileName,
      userId: req.user?.id || null,
      role: req.user?.role || null,
    });

    res.status(204).send();
  }
);

module.exports = router;
