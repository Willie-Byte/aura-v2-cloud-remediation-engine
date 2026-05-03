const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      required: true,
      default: "simulator",
    },

    cloudProvider: {
      type: String,
      required: true,
      enum: ["azure", "aws", "gcp"],
    },

    resourceType: {
      type: String,
      required: true,
    },

    resourceName: {
      type: String,
      required: true,
    },

    severity: {
      type: String,
      required: true,
      enum: ["low", "medium", "high", "critical"],
    },

    issueType: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["open", "approved", "rejected", "resolved"],
      default: "open",
    },

    cryptoMetadata: {
      tlsVersion: {
        type: String,
        default: "",
      },
      keyExchange: {
        type: String,
        default: "",
      },
      encryptionProfile: {
        type: String,
        default: "",
      },
      pqcReady: {
        type: Boolean,
        default: null,
      },
      requiredStandard: {
        type: String,
        default: "",
      },
      harvestNowDecryptLaterRisk: {
        type: Boolean,
        default: false,
      },
    },

    detectedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Alert", alertSchema);