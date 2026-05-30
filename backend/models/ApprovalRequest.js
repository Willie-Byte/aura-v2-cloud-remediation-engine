const mongoose = require("mongoose");

const approvalRequestSchema = new mongoose.Schema(
  {
    approvalId: {
      type: String,
      required: true,
      index: true,
    },
    remediationId: {
      type: String,
      default: "unknown-remediation",
      index: true,
    },
    threatId: {
      type: String,
      default: "unknown-threat",
      index: true,
    },
    status: {
      type: String,
      default: "awaiting_approval",
      index: true,
    },
    reason: {
      type: String,
      default: "human_approval_required",
      index: true,
    },
    targetResource: {
      type: String,
      default: "unknown-resource",
      index: true,
    },
    resourceType: {
      type: String,
      default: "unknown-resource-type",
    },
    cloudProvider: {
      type: String,
      default: "unknown-cloud",
    },
    issueType: {
      type: String,
      default: "unknown-issue",
      index: true,
    },
    action: {
      type: String,
      default: "unknown-action",
    },
    executionMode: {
      type: String,
      default: "simulate",
      index: true,
    },
    queuedAt: {
      type: Date,
      default: null,
      index: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    kafka: {
      topic: { type: String, default: "" },
      partition: { type: Number, default: null },
      offset: { type: String, default: "" },
      key: { type: String, default: "" },
    },
    receivedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

approvalRequestSchema.index(
  { "kafka.topic": 1, "kafka.partition": 1, "kafka.offset": 1 },
  { unique: true, sparse: true }
);

module.exports = mongoose.model("ApprovalRequest", approvalRequestSchema);
