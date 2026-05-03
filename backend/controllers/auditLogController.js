const AuditLog = require("../models/AuditLog");

// @desc    Get audit logs by alert ID
// @route   GET /api/audit-logs/alert/:alertId
// @access  Public
const getAuditLogsByAlertId = async (req, res) => {
  try {
    const logs = await AuditLog.find({
      alertId: req.params.alertId,
    }).sort({ createdAt: -1 });

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAuditLogsByAlertId,
};