const mongoose = require("mongoose");

const remediationSchema = new mongoose.Schema(
  {
    alertId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Alert",
      required: true,
    },

    generatedCode: {
      type: String,
      required: true,
    },

    explanation: {
      type: String,
      required: true,
    },

    confidence: {
      type: Number,
      default: 0.85,
    },

    status: {
      type: String,
      enum: ["generated", "approved", "rejected", "deployed"],
      default: "generated",
    },

    agenticValidation: {
      enabled: {
        type: Boolean,
        default: false,
      },
      auditStatus: {
        type: String,
        enum: ["PASS", "CORRECTED", "FAILED", "NOT_RUN"],
        default: "NOT_RUN",
      },
      auditNotes: {
        type: String,
        default: "",
      },
      validatedAt: {
        type: Date,
        default: null,
      },
    },

    prUrl: {
      type: String,
      default: "",
    },

    prNumber: {
      type: Number,
      default: null,
    },

    branchName: {
      type: String,
      default: "",
    },

    filePath: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Remediation", remediationSchema);