const express = require("express");
const bulkUploadController = require("../controllers/bulkUploadController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/import",
  authMiddleware.verifyToken,
  bulkUploadController.importBulk
);

module.exports = router;