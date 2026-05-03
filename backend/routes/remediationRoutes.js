const express = require("express");
const router = express.Router();
const {
  getRemediationsByAlertId,
  approveRemediation,
  rejectRemediation,
  deployRemediation,
} = require("../controllers/remediationController");

router.route("/alert/:alertId").get(getRemediationsByAlertId);
router.route("/:id/approve").patch(approveRemediation);
router.route("/:id/reject").patch(rejectRemediation);
router.route("/:id/deploy").patch(deployRemediation);

module.exports = router;