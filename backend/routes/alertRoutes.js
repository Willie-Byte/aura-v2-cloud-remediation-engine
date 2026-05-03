const express = require("express");
const router = express.Router();
const {
  createAlert,
  getAlerts,
  getAlertById,
  generateFix,
  getQuantumRisk,
} = require("../controllers/alertController");

router.route("/").post(createAlert).get(getAlerts);
router.route("/quantum-risk").get(getQuantumRisk);
router.route("/:id").get(getAlertById);
router.route("/:id/generate-fix").post(generateFix);

module.exports = router;