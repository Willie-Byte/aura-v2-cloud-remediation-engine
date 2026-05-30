const mongoose = require("mongoose");

const executionResultSchema = new mongoose.Schema(
  {
    resultId: {
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
      default: "unknown",
      index: true,
    },
    status: {
      type: String,
      required: true,
      index: true,
    },
    reason: {
      type: String,
      default: "",
      index: true,
    },
    resultTimestamp: {
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

executionResultSchema.index(
  { "kafka.topic": 1, "kafka.partition": 1, "kafka.offset": 1 },
  { unique: true, sparse: true }
);

module.exports = mongoose.model("ExecutionResult", executionResultSchema);
