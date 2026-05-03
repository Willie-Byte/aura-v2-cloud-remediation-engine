const MAX_AUDIT_EVENTS = 100;
const MAX_RESULT_EVENTS = 100;

const streamState = {
  auditEvents: [],
  executionResults: [],
};

function addAuditEvent(event) {
  streamState.auditEvents.unshift(event);

  if (streamState.auditEvents.length > MAX_AUDIT_EVENTS) {
    streamState.auditEvents.pop();
  }
}

function addExecutionResult(result) {
  streamState.executionResults.unshift(result);

  if (streamState.executionResults.length > MAX_RESULT_EVENTS) {
    streamState.executionResults.pop();
  }
}

function getAuditEvents() {
  return streamState.auditEvents;
}

function getExecutionResults() {
  return streamState.executionResults;
}

function getRawTelemetryEvents() {
  return streamState.auditEvents.filter(
    (event) => event.eventType === "RAW_TELEMETRY_RECEIVED"
  );
}

function getNormalizedThreatEvents() {
  return streamState.auditEvents.filter(
    (event) => event.eventType === "TELEMETRY_NORMALIZED_TO_THREAT"
  );
}

function getResolvedApprovalRemediationIds() {
  return new Set(
    streamState.executionResults
      .filter(
        (result) =>
          result.approvalDecision &&
          ["executed", "rejected"].includes(result.status)
      )
      .map((result) => result.remediationId)
      .filter(Boolean)
  );
}

function getResolvedApprovalIds() {
  return new Set(
    streamState.executionResults
      .filter(
        (result) =>
          result.approvalDecision &&
          ["executed", "rejected"].includes(result.status)
      )
      .map((result) => result.approvalDecision?.approvalId)
      .filter(Boolean)
  );
}

function getAwaitingApprovalResults() {
  const resolvedRemediationIds = getResolvedApprovalRemediationIds();
  const resolvedApprovalIds = getResolvedApprovalIds();

  return streamState.executionResults.filter((result) => {
    if (result.status !== "awaiting_approval") {
      return false;
    }

    const remediationResolved =
      result.remediationId && resolvedRemediationIds.has(result.remediationId);

    const approvalResolved =
      result.approvalId && resolvedApprovalIds.has(result.approvalId);

    return !remediationResolved && !approvalResolved;
  });
}

function getApprovedHumanDecisions() {
  return streamState.executionResults.filter(
    (result) =>
      result.approvalDecision?.decision === "approve" &&
      result.status === "executed"
  );
}

function getRejectedHumanDecisions() {
  return streamState.executionResults.filter(
    (result) =>
      result.approvalDecision?.decision === "reject" &&
      result.status === "rejected"
  );
}

function getLatestRawTelemetryEvent() {
  const rawTelemetryEvents = getRawTelemetryEvents();
  return rawTelemetryEvents[0] || null;
}

function getLatestNormalizedThreatEvent() {
  const normalizedThreatEvents = getNormalizedThreatEvents();
  return normalizedThreatEvents[0] || null;
}

function getLatestAwaitingApprovalResult() {
  const awaitingApprovalResults = getAwaitingApprovalResults();
  return awaitingApprovalResults[0] || null;
}

function getStreamingStateSummary() {
  const rawTelemetryEvents = getRawTelemetryEvents();
  const normalizedThreatEvents = getNormalizedThreatEvents();
  const awaitingApprovalResults = getAwaitingApprovalResults();
  const approvedHumanDecisions = getApprovedHumanDecisions();
  const rejectedHumanDecisions = getRejectedHumanDecisions();

  return {
    auditEventsCached: streamState.auditEvents.length,
    executionResultsCached: streamState.executionResults.length,

    rawTelemetryCount: rawTelemetryEvents.length,
    normalizedThreatCount: normalizedThreatEvents.length,

    awaitingApprovalCount: awaitingApprovalResults.length,
    approvedHumanDecisionCount: approvedHumanDecisions.length,
    rejectedHumanDecisionCount: rejectedHumanDecisions.length,

    latestRawTelemetryEvent: getLatestRawTelemetryEvent(),
    latestNormalizedThreatEvent: getLatestNormalizedThreatEvent(),
    latestAwaitingApprovalResult: getLatestAwaitingApprovalResult(),
  };
}

module.exports = {
  addAuditEvent,
  addExecutionResult,

  getAuditEvents,
  getExecutionResults,

  getRawTelemetryEvents,
  getNormalizedThreatEvents,
  getAwaitingApprovalResults,

  getApprovedHumanDecisions,
  getRejectedHumanDecisions,

  getResolvedApprovalRemediationIds,
  getResolvedApprovalIds,

  getLatestRawTelemetryEvent,
  getLatestNormalizedThreatEvent,
  getLatestAwaitingApprovalResult,

  getStreamingStateSummary,
};