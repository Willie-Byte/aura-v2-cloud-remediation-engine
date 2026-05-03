const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    alertId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Alert",
      default: null,
    },
    remediationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Remediation",
      default: null,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "ALERT_CREATED",
        "REMEDIATION_GENERATED",
        "REMEDIATION_APPROVED",
        "REMEDIATION_REJECTED",
        "REMEDIATION_DEPLOYED",
      ],
    },
    message: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);