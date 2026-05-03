const express = require("express");
const router = express.Router();
const { getAuditLogsByAlertId } = require("../controllers/auditLogController");

router.route("/alert/:alertId").get(getAuditLogsByAlertId);

module.exports = router;