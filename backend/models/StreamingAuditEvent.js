const mongoose = require("mongoose");

const streamingAuditEventSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    topic: {
      type: String,
      default: "",
      index: true,
    },
    partition: {
      type: Number,
      default: null,
    },
    offset: {
      type: String,
      default: "",
      index: true,
    },
    key: {
      type: String,
      default: "",
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
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

streamingAuditEventSchema.index(
  { topic: 1, partition: 1, offset: 1 },
  { unique: true, sparse: true }
);

module.exports = mongoose.model("StreamingAuditEvent", streamingAuditEventSchema);
