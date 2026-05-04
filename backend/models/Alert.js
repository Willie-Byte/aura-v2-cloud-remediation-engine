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

    sourceTelemetryId: {
      type: String,
      default: "",
      index: true,
    },

    evidence: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    rawTelemetry: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    streamingMetadata: {
      normalizedThreatId: {
        type: String,
        default: "",
      },
      ingestionPath: {
        type: String,
        default: "api",
      },
      kafkaAuditEventId: {
        type: String,
        default: "",
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

alertSchema.index(
  { sourceTelemetryId: 1 },
  {
    sparse: true,
    partialFilterExpression: { sourceTelemetryId: { $type: "string", $gt: "" } },
  }
);

module.exports = mongoose.model("Alert", alertSchema);