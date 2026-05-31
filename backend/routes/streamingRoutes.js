const express = require("express");
const router = express.Router();
const {
  getAuditEvents,
  getExecutionResults,
} = require("../streaming/streamState");
const {
  getStreamingAuditEvents,
  getStreamingExecutionResults,
  getStreamingApprovalRequests,
  getStreamingApprovalDecisions,
} = require("../controllers/streamingObservabilityController");

router.get("/status", (req, res) => {
  res.status(200).json({
    status: "online",
    bridge: "active",
    message: "Aura V2 streaming bridge is running.",
    refreshIntervalSeconds: 5,
    topics: {
      threatIngest: process.env.KAFKA_TOPIC || "threat-ingest",
      remediationCommands:
        process.env.KAFKA_REMEDIATION_TOPIC || "remediation-commands",
      remediationDlq: process.env.KAFKA_DLQ_TOPIC || "remediation-dlq",
      auditLog: process.env.KAFKA_AUDIT_TOPIC || "audit-log",
      executionResults:
        process.env.KAFKA_RESULTS_TOPIC || "execution-results",
    },
    currentState: {
      auditEventsCached: getAuditEvents().length,
      executionResultsCached: getExecutionResults().length,
    },
    checkedAt: new Date().toISOString(),
  });
});

router.get("/audit-summary", (req, res) => {
  res.status(200).json({
    count: getAuditEvents().length,
    events: getAuditEvents(),
  });
});

router.get("/cached-execution-results", (req, res) => {
  res.status(200).json({
    count: getExecutionResults().length,
    results: getExecutionResults(),
  });
});

router.get("/audit-events", getStreamingAuditEvents);
router.get("/execution-results", getStreamingExecutionResults);
router.get("/approval-requests", getStreamingApprovalRequests);
router.get("/approval-decisions", getStreamingApprovalDecisions);

module.exports = router;