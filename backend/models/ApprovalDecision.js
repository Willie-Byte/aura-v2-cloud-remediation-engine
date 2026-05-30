const mongoose = require("mongoose");

const approvalDecisionSchema = new mongoose.Schema(
  {
    decisionId: {
      type: String,
      required: true,
      index: true,
    },
    approvalId: {
      type: String,
      default: "unknown-approval",
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
    decision: {
      type: String,
      enum: ["approve", "reject", "unknown"],
      default: "unknown",
      index: true,
    },
    decidedBy: {
      type: String,
      default: "unknown-reviewer",
      index: true,
    },
    decidedAt: {
      type: Date,
      default: null,
      index: true,
    },
    reason: {
      type: String,
      default: "",
    },
    executionMode: {
      type: String,
      default: "simulate",
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

approvalDecisionSchema.index(
  { "kafka.topic": 1, "kafka.partition": 1, "kafka.offset": 1 },
  { unique: true, sparse: true }
);

module.exports = mongoose.model("ApprovalDecision", approvalDecisionSchema);
