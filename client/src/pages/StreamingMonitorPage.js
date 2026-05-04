import { useEffect, useState, useCallback } from "react";
import {
  getStreamingStatus,
  getStreamingAuditSummary,
  getStreamingExecutionResults,
  sendStreamingApprovalDecision,
} from "../services/api";

function StreamingMonitorPage() {
  const [streamStatus, setStreamStatus] = useState(null);
  const [auditData, setAuditData] = useState({ count: 0, events: [] });
  const [resultsData, setResultsData] = useState({ count: 0, results: [] });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [decisionLoadingId, setDecisionLoadingId] = useState(null);

  const fetchStreamingData = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }

      const [statusResponse, auditResponse, resultsResponse] =
        await Promise.all([
          getStreamingStatus(),
          getStreamingAuditSummary(),
          getStreamingExecutionResults(),
        ]);

      setStreamStatus(statusResponse.data);
      setAuditData(auditResponse.data);
      setResultsData(resultsResponse.data);
      setErrorMessage("");
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to load streaming monitor data:", error);
      setErrorMessage("Failed to load streaming monitor data.");
    } finally {
      if (showLoader) {
        setLoading(false);
      }

      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStreamingData(true);
  }, [fetchStreamingData]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchStreamingData(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchStreamingData]);

  const formatDate = (value) => {
    if (!value) return "N/A";
    return new Date(value).toLocaleString();
  };

  const formatValue = (value) => {
    if (value === undefined || value === null || value === "") return "N/A";
    return String(value);
  };

  const getTelemetryEvidence = (telemetry = {}) => {
    const evidence = telemetry.evidence || telemetry.metadata?.runtimeEvidence || {};

    return {
      namespace: evidence.namespace || telemetry.namespace,
      podName: evidence.podName || telemetry.podName,
      containerName: evidence.containerName || telemetry.containerName,
      imageName: evidence.imageName || telemetry.imageName,
      binary: evidence.binary || telemetry.binary,
      arguments: evidence.arguments || telemetry.arguments,
      nodeName: evidence.nodeName || telemetry.nodeName,
    };
  };

  const isRuntimeTelemetry = (telemetry = {}) => {
    return (
      telemetry.source === "tetragon-ebpf" ||
      telemetry.issueType === "unauthorizedPodExec" ||
      telemetry.eventType === "process_exec"
    );
  };

  const getThreatEvidence = (threat = {}) => {
    return threat.evidence || getTelemetryEvidence(threat.rawTelemetry || {});
  };

  const getFallbackActionForIssueType = (issueType) => {
    if (issueType === "unauthorizedPodExec") {
      return "investigateUnauthorizedPodExec";
    }

    if (issueType === "nonQuantumSafeCrypto") {
      return "enforcePQCTls1_3";
    }

    if (issueType === "publicStorageAccess") {
      return "disablePublicAccess";
    }

    if (issueType === "publicRDPAccess") {
      return "restrictRDPAccess";
    }

    return "restrictSSHAccess";
  };

  const getApprovalEventForResult = (result) => {
    return auditData.events.find(
      (event) =>
        event.eventType === "REMEDIATION_AWAITING_APPROVAL" &&
        event.payload?.remediationId === result.remediationId
    );
  };

  const handleApprovalDecision = async (result, decision) => {
    try {
      setDecisionLoadingId(`${decision}-${result.remediationId}`);
      setErrorMessage("");
      setSuccessMessage("");

      const approvalEvent = getApprovalEventForResult(result);

      const approvalId =
        approvalEvent?.payload?.approvalId ||
        result.approvalId ||
        `manual-approval-${Date.now()}`;

      const decisionPayload = {
        decision,
        approvalId,
        remediationId: result.remediationId,
        threatId: result.threatId,
        targetResource: result.targetResource,
        resourceType: result.resourceType,
        cloudProvider: result.cloudProvider,
        issueType: result.issueType,
        action:
          result.action ||
          result.remediationPlan?.action ||
          getFallbackActionForIssueType(result.issueType),
        riskLevel: result.remediationPlan?.riskLevel || "high",
        decidedBy: "dashboard-reviewer",
        reason:
          decision === "approve"
            ? "Reviewer approved the simulated remediation from the dashboard."
            : "Reviewer rejected the simulated remediation from the dashboard.",
      };

      await sendStreamingApprovalDecision(decisionPayload);

      setSuccessMessage(
        `Remediation ${decision} decision sent successfully for ${result.remediationId}.`
      );

      await fetchStreamingData(false);
    } catch (error) {
      console.error("Failed to send approval decision:", error);
      setErrorMessage("Failed to send approval decision.");
    } finally {
      setDecisionLoadingId(null);
    }
  };

  const getExecutionStatusClass = (status) => {
    switch (status) {
      case "executed":
        return "status-badge status-approved";
      case "awaiting_approval":
      case "skipped_duplicate":
        return "status-badge status-generated";
      case "rejected":
      case "failed":
        return "status-badge status-rejected";
      default:
        return "status-badge status-open";
    }
  };

  const getExecutionModeClass = (mode) => {
    switch (mode) {
      case "simulate":
        return "status-badge status-generated";
      case "plan":
        return "status-badge status-resolved";
      case "apply":
        return "status-badge status-rejected";
      default:
        return "status-badge status-open";
    }
  };

  const getRiskBadgeClass = (riskLevel) => {
    switch (riskLevel) {
      case "critical":
        return "status-badge status-rejected";
      case "high":
        return "status-badge status-open";
      case "medium":
        return "status-badge status-generated";
      case "low":
        return "status-badge status-approved";
      default:
        return "status-badge status-resolved";
    }
  };

  const getDecisionBadgeClass = (decision) => {
    switch (decision) {
      case "approve":
      case "approved":
        return "status-badge status-approved";
      case "reject":
      case "rejected":
        return "status-badge status-rejected";
      default:
        return "status-badge status-generated";
    }
  };

  const getAuditEventClass = (eventType) => {
    switch (eventType) {
      case "REMEDIATION_EXECUTED":
      case "REMEDIATION_APPROVED_BY_HUMAN":
        return "status-badge status-approved";

      case "RAW_TELEMETRY_RECEIVED":
      case "TELEMETRY_NORMALIZED_TO_THREAT":
      case "REMEDIATION_AWAITING_APPROVAL":
      case "APPROVAL_DECISION_RECEIVED":
      case "REMEDIATION_DUPLICATE_SKIPPED":
        return "status-badge status-generated";

      case "REMEDIATION_REJECTED_TO_DLQ":
      case "REMEDIATION_REJECTED_BY_HUMAN":
      case "REMEDIATION_GENERATION_FAILED":
        return "status-badge status-rejected";

      case "THREAT_RECEIVED":
        return "status-badge status-open";

      case "REMEDIATION_GENERATED":
      case "REMEDIATION_COMMAND_RECEIVED":
      default:
        return "status-badge status-resolved";
    }
  };

  const getBridgeStatusClass = (status) => {
    if (status === "online") {
      return "status-badge status-approved";
    }

    return "status-badge status-rejected";
  };

  const getAuditSummaryText = (event) => {
    if (!event) return "No details available.";

    switch (event.eventType) {
      case "RAW_TELEMETRY_RECEIVED": {
        const telemetry = event.payload?.telemetry || {};
        const evidence = getTelemetryEvidence(telemetry);

        if (isRuntimeTelemetry(telemetry)) {
          return `Live eBPF telemetry received from ${
            telemetry.source || "unknown source"
          } for ${telemetry.resourceName || "unknown resource"}. Command: ${
            evidence.binary || "unknown binary"
          } ${evidence.arguments || ""}`;
        }

        return `Raw telemetry received from ${
          telemetry.source || "unknown source"
        } for ${telemetry.resourceName || "unknown resource"}.`;
      }

      case "TELEMETRY_NORMALIZED_TO_THREAT": {
        const threat = event.payload?.threat || {};
        const evidence = getThreatEvidence(threat);

        if (threat.issueType === "unauthorizedPodExec") {
          return `Live eBPF telemetry ${
            event.payload?.sourceTelemetryId || "unknown telemetry"
          } was normalized into runtime threat ${threat.id || "unknown threat"} for ${
            threat.resourceName || "unknown resource"
          }. Command: ${evidence.binary || "unknown binary"} ${
            evidence.arguments || ""
          }`;
        }

        return `Telemetry ${
          event.payload?.sourceTelemetryId || "unknown telemetry"
        } was normalized into threat ${
          threat.id || "unknown threat"
        } for ${threat.resourceName || "unknown resource"}.`;
      }

      case "THREAT_RECEIVED":
        return `Threat received for ${
          event.payload?.threat?.resourceName || "unknown resource"
        }.`;

      case "REMEDIATION_GENERATED":
        return `Remediation generated for ${
          event.payload?.remediationCommand?.targetResource ||
          "unknown resource"
        }.`;

      case "REMEDIATION_COMMAND_RECEIVED":
        return `Worker received remediation command for ${
          event.payload?.command?.targetResource || "unknown resource"
        }.`;

      case "REMEDIATION_AWAITING_APPROVAL":
        return `Remediation for ${
          event.payload?.targetResource || "unknown resource"
        } is waiting for human approval because ${
          event.payload?.reason || "approval is required"
        }.`;

      case "APPROVAL_DECISION_RECEIVED":
        return `Human approval decision received for remediation ${
          event.payload?.decisionPayload?.remediationId || "unknown remediation"
        }: ${event.payload?.decisionPayload?.decision || "unknown decision"}.`;

      case "REMEDIATION_APPROVED_BY_HUMAN":
        return `Human reviewer approved remediation ${
          event.payload?.decisionPayload?.remediationId || "unknown remediation"
        }.`;

      case "REMEDIATION_REJECTED_BY_HUMAN":
        return `Human reviewer rejected remediation ${
          event.payload?.decisionPayload?.remediationId || "unknown remediation"
        }.`;

      case "REMEDIATION_EXECUTED":
        return `Remediation executed for ${
          event.payload?.command?.targetResource || "unknown resource"
        } in ${
          event.payload?.executionMode ||
          event.payload?.command?.executionMode ||
          "unknown"
        } mode.`;

      case "REMEDIATION_DUPLICATE_SKIPPED":
        return `Duplicate remediation skipped for ${
          event.payload?.command?.targetResource || "unknown resource"
        }.`;

      case "REMEDIATION_REJECTED_TO_DLQ":
        return `Remediation rejected and sent to DLQ because ${
          event.payload?.errors?.[0] || "validation failed"
        }.`;

      case "REMEDIATION_GENERATION_FAILED":
        return `Remediation generation failed because ${
          event.payload?.error || "the AI response could not be processed"
        }.`;

      default:
        return "Streaming event recorded.";
    }
  };

  const getRejectedReason = (result) => {
    if (result.status !== "rejected") return null;

    return (
      result.details?.errors?.[0] ||
      result.details?.reason ||
      result.approvalDecision?.reason ||
      "Command was rejected by validation."
    );
  };

  const getAwaitingApprovalReason = (result) => {
    if (result.status !== "awaiting_approval") return null;

    return (
      result.details?.reason ||
      "This remediation requires human approval before execution."
    );
  };

  const latestRejectedCount = resultsData.results.filter(
    (result) => result.status === "rejected"
  ).length;

  const latestExecutedCount = resultsData.results.filter(
    (result) => result.status === "executed"
  ).length;

  const latestAwaitingApprovalCount = resultsData.results.filter(
    (result) => result.status === "awaiting_approval"
  ).length;

  const latestHumanApprovedCount = resultsData.results.filter(
    (result) => result.approvalDecision?.decision === "approve"
  ).length;

  const latestHumanRejectedCount = resultsData.results.filter(
    (result) => result.approvalDecision?.decision === "reject"
  ).length;

  const rawTelemetryCount = auditData.events.filter(
    (event) => event.eventType === "RAW_TELEMETRY_RECEIVED"
  ).length;

  const normalizedThreatCount = auditData.events.filter(
    (event) => event.eventType === "TELEMETRY_NORMALIZED_TO_THREAT"
  ).length;

  const latestTelemetryEvent = auditData.events.find(
    (event) => event.eventType === "RAW_TELEMETRY_RECEIVED"
  );

  const runtimeTelemetryCount = auditData.events.filter(
    (event) =>
      event.eventType === "RAW_TELEMETRY_RECEIVED" &&
      isRuntimeTelemetry(event.payload?.telemetry || {})
  ).length;

  const latestTelemetryResource =
    latestTelemetryEvent?.payload?.telemetry?.resourceName || "No telemetry";

  const latestTelemetrySource =
    latestTelemetryEvent?.payload?.telemetry?.source || "N/A";

  const latestTelemetryEvidence = getTelemetryEvidence(
    latestTelemetryEvent?.payload?.telemetry || {}
  );

  if (loading) {
    return (
      <div className="dashboard-container">
        <h1 className="dashboard-title">Streaming Monitor</h1>
        <p className="loading-text">Loading streaming monitor...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "16px",
          flexWrap: "wrap",
          marginBottom: "10px",
        }}
      >
        <div>
          <h1 className="dashboard-title">Streaming Monitor</h1>
          <p className="dashboard-subtitle" style={{ marginBottom: 0 }}>
            View live Aura V2 telemetry, normalized threats, approval gates, and
            execution outcomes from the streaming bridge.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "10px",
          }}
        >
          <button
            onClick={() => fetchStreamingData(false)}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Refreshing..." : "Refresh Now"}
          </button>

          <p className="timestamp-text" style={{ margin: 0 }}>
            <strong>Last Updated:</strong>{" "}
            {lastUpdated ? formatDate(lastUpdated) : "N/A"}
          </p>
        </div>
      </div>

      {errorMessage && <div className="toast toast-error">{errorMessage}</div>}

      {successMessage && (
        <div className="toast toast-success">{successMessage}</div>
      )}

      <div className="summary-grid">
        <div className="summary-card">
          <p className="summary-label">Stream Bridge</p>
          <h3 style={{ fontSize: "18px" }}>
            {streamStatus?.bridge || "unknown"}
          </h3>
          <div className="meta-row">
            <span className={getBridgeStatusClass(streamStatus?.status)}>
              {streamStatus?.status || "offline"}
            </span>
          </div>
          <p className="timestamp-text">
            Refresh every {streamStatus?.refreshIntervalSeconds || 5} seconds
          </p>
        </div>

        <div className="summary-card">
          <p className="summary-label">Execution Mode</p>
          <h3 style={{ fontSize: "18px" }}>
            {resultsData.results[0]?.executionMode || "simulate"}
          </h3>
          <div className="meta-row">
            <span
              className={getExecutionModeClass(
                resultsData.results[0]?.executionMode || "simulate"
              )}
            >
              safe mode
            </span>
          </div>
          <p className="timestamp-text">Real apply is disabled</p>
        </div>

        <div className="summary-card">
          <p className="summary-label">Raw Telemetry</p>
          <h3>{rawTelemetryCount}</h3>
          <div className="meta-row">
            <span className="status-badge status-generated">sensor input</span>
          </div>
          <p className="timestamp-text">
            Latest: {latestTelemetryResource} from {latestTelemetrySource}
          </p>
        </div>

        <div className="summary-card">
          <p className="summary-label">Live eBPF Runtime</p>
          <h3>{runtimeTelemetryCount}</h3>
          <div className="meta-row">
            <span className="status-badge status-open">pod exec</span>
          </div>
          <p className="timestamp-text">
            Latest command: {formatValue(latestTelemetryEvidence.binary)} {formatValue(latestTelemetryEvidence.arguments)}
          </p>
        </div>

        <div className="summary-card">
          <p className="summary-label">Normalized Threats</p>
          <h3>{normalizedThreatCount}</h3>
          <div className="meta-row">
            <span className="status-badge status-open">threat ingest</span>
          </div>
          <p className="timestamp-text">Telemetry converted into threats</p>
        </div>

        <div className="summary-card">
          <p className="summary-label">Awaiting Approval</p>
          <h3>{latestAwaitingApprovalCount}</h3>
          <div className="meta-row">
            <span className="status-badge status-generated">approval gate</span>
          </div>
          <p className="timestamp-text">Human review required</p>
        </div>

        <div className="summary-card">
          <p className="summary-label">Human Decisions</p>
          <h3 style={{ fontSize: "18px" }}>
            {latestHumanApprovedCount} approved / {latestHumanRejectedCount}{" "}
            rejected
          </h3>
          <p className="timestamp-text">From approval-decisions topic</p>
        </div>

        <div className="summary-card">
          <p className="summary-label">Audit Events</p>
          <h3>{auditData.count}</h3>
          <p className="timestamp-text">
            Cached:{" "}
            {streamStatus?.currentState?.auditEventsCached ?? auditData.count}
          </p>
        </div>

        <div className="summary-card">
          <p className="summary-label">Execution Results</p>
          <h3>{resultsData.count}</h3>
          <p className="timestamp-text">
            {latestExecutedCount} executed / {latestAwaitingApprovalCount}{" "}
            waiting / {latestRejectedCount} rejected
          </p>
        </div>

        <div className="summary-card">
          <p className="summary-label">Latest Audit Event</p>
          <h3 style={{ fontSize: "18px" }}>
            {auditData.events[0]?.eventType || "No events"}
          </h3>
          <p className="timestamp-text">
            {formatDate(auditData.events[0]?.timestamp)}
          </p>
        </div>

        <div className="summary-card">
          <p className="summary-label">Latest Execution Status</p>
          <h3 style={{ fontSize: "18px" }}>
            {resultsData.results[0]?.status || "No results"}
          </h3>
          <p className="timestamp-text">
            {formatDate(resultsData.results[0]?.timestamp)}
          </p>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title" style={{ marginTop: 0 }}>
          Kafka Topics
        </h2>

        {!streamStatus?.topics ? (
          <p className="empty-text">No topic status available.</p>
        ) : (
          <div className="summary-grid">
            <div className="summary-card">
              <p className="summary-label">Raw Telemetry</p>
              <h3 style={{ fontSize: "16px" }}>
                {streamStatus.topics.rawTelemetry || "raw-telemetry"}
              </h3>
            </div>

            <div className="summary-card">
              <p className="summary-label">Threat Ingest</p>
              <h3 style={{ fontSize: "16px" }}>
                {streamStatus.topics.threatIngest}
              </h3>
            </div>

            <div className="summary-card">
              <p className="summary-label">Remediation Commands</p>
              <h3 style={{ fontSize: "16px" }}>
                {streamStatus.topics.remediationCommands}
              </h3>
            </div>

            <div className="summary-card">
              <p className="summary-label">Approval Queue</p>
              <h3 style={{ fontSize: "16px" }}>
                {streamStatus.topics.approvalQueue || "approval-queue"}
              </h3>
            </div>

            <div className="summary-card">
              <p className="summary-label">Approval Decisions</p>
              <h3 style={{ fontSize: "16px" }}>
                {streamStatus.topics.approvalDecisions || "approval-decisions"}
              </h3>
            </div>

            <div className="summary-card">
              <p className="summary-label">DLQ</p>
              <h3 style={{ fontSize: "16px" }}>
                {streamStatus.topics.remediationDlq}
              </h3>
            </div>

            <div className="summary-card">
              <p className="summary-label">Audit Log</p>
              <h3 style={{ fontSize: "16px" }}>
                {streamStatus.topics.auditLog}
              </h3>
            </div>

            <div className="summary-card">
              <p className="summary-label">Execution Results</p>
              <h3 style={{ fontSize: "16px" }}>
                {streamStatus.topics.executionResults}
              </h3>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="section-title" style={{ marginTop: 0 }}>
          Latest Execution Results
        </h2>

        {resultsData.results.length === 0 ? (
          <p className="empty-text">No execution results yet.</p>
        ) : (
          resultsData.results.map((result) => {
            const approvalEvent = getApprovalEventForResult(result);
            const approvalId = approvalEvent?.payload?.approvalId;

            const isApproveLoading =
              decisionLoadingId === `approve-${result.remediationId}`;

            const isRejectLoading =
              decisionLoadingId === `reject-${result.remediationId}`;

            const isDecisionLoading = isApproveLoading || isRejectLoading;

            return (
              <div key={result.resultId} className="card audit-item">
                <div className="meta-row">
                  <span className={getExecutionStatusClass(result.status)}>
                    {result.status}
                  </span>

                  <span
                    className={getExecutionModeClass(
                      result.executionMode || "unknown"
                    )}
                  >
                    mode: {result.executionMode || "unknown"}
                  </span>

                  {result.remediationPlan?.riskLevel && (
                    <span
                      className={getRiskBadgeClass(
                        result.remediationPlan.riskLevel
                      )}
                    >
                      risk: {result.remediationPlan.riskLevel}
                    </span>
                  )}

                  {result.remediationPlan?.requiresApproval === true && (
                    <span className="status-badge status-generated">
                      requires approval
                    </span>
                  )}

                  {result.approvalDecision?.decision && (
                    <span
                      className={getDecisionBadgeClass(
                        result.approvalDecision.decision
                      )}
                    >
                      human: {result.approvalDecision.decision}
                    </span>
                  )}
                </div>

                <p>
                  <strong>Resource:</strong> {result.targetResource}
                </p>
                <p>
                  <strong>Resource Type:</strong> {result.resourceType || "N/A"}
                </p>
                <p>
                  <strong>Cloud Provider:</strong> {result.cloudProvider}
                </p>
                <p>
                  <strong>Issue Type:</strong> {result.issueType}
                </p>
                <p>
                  <strong>Execution Mode:</strong>{" "}
                  <span
                    className={getExecutionModeClass(
                      result.executionMode || "unknown"
                    )}
                  >
                    {result.executionMode || "unknown"}
                  </span>
                </p>
                <p>
                  <strong>Remediation ID:</strong> {result.remediationId}
                </p>
                <p>
                  <strong>Threat ID:</strong> {result.threatId}
                </p>
                <p>
                  <strong>Approval ID:</strong> {approvalId || "N/A"}
                </p>
                <p>
                  <strong>Timestamp:</strong> {formatDate(result.timestamp)}
                </p>
                <p>
                  <strong>Details:</strong> {result.details?.message || "N/A"}
                </p>

                {result.status === "awaiting_approval" && (
                  <div className="approval-box">
                    <strong>Awaiting Approval:</strong>{" "}
                    {getAwaitingApprovalReason(result)}

                    <div className="approval-actions">
                      <button
                        className="approval-button approve-button"
                        onClick={() =>
                          handleApprovalDecision(result, "approve")
                        }
                        disabled={isDecisionLoading}
                      >
                        {isApproveLoading ? "Approving..." : "Approve"}
                      </button>

                      <button
                        className="approval-button reject-button"
                        onClick={() => handleApprovalDecision(result, "reject")}
                        disabled={isDecisionLoading}
                      >
                        {isRejectLoading ? "Rejecting..." : "Reject"}
                      </button>
                    </div>
                  </div>
                )}

                {result.approvalDecision && (
                  <div className="card" style={{ marginTop: "14px" }}>
                    <h3
                      className="section-title"
                      style={{ marginTop: 0, fontSize: "18px" }}
                    >
                      Human Approval Decision
                    </h3>

                    <p>
                      <strong>Decision:</strong>{" "}
                      <span
                        className={getDecisionBadgeClass(
                          result.approvalDecision.decision
                        )}
                      >
                        {result.approvalDecision.decision || "unknown"}
                      </span>
                    </p>

                    <p>
                      <strong>Decision ID:</strong>{" "}
                      {result.approvalDecision.decisionId || "N/A"}
                    </p>

                    <p>
                      <strong>Approval ID:</strong>{" "}
                      {result.approvalDecision.approvalId || "N/A"}
                    </p>

                    <p>
                      <strong>Decided By:</strong>{" "}
                      {result.approvalDecision.decidedBy || "N/A"}
                    </p>

                    <p>
                      <strong>Decided At:</strong>{" "}
                      {formatDate(result.approvalDecision.decidedAt)}
                    </p>

                    <p>
                      <strong>Reason:</strong>{" "}
                      {result.approvalDecision.reason || "N/A"}
                    </p>
                  </div>
                )}

                {result.remediationPlan && (
                  <div className="card" style={{ marginTop: "14px" }}>
                    <h3
                      className="section-title"
                      style={{ marginTop: 0, fontSize: "18px" }}
                    >
                      Remediation Plan
                    </h3>

                    <p>
                      <strong>Risk Level:</strong>{" "}
                      <span
                        className={getRiskBadgeClass(
                          result.remediationPlan.riskLevel
                        )}
                      >
                        {result.remediationPlan.riskLevel || "unknown"}
                      </span>
                    </p>

                    <p>
                      <strong>Requires Approval:</strong>{" "}
                      {result.remediationPlan.requiresApproval ? "Yes" : "No"}
                    </p>

                    <p>
                      <strong>Plan Provider:</strong>{" "}
                      {result.remediationPlan.provider || "N/A"}
                    </p>

                    <p>
                      <strong>Plan Action:</strong>{" "}
                      {result.remediationPlan.action || "N/A"}
                    </p>

                    <p>
                      <strong>Plan Resource Type:</strong>{" "}
                      {result.remediationPlan.resourceType || "N/A"}
                    </p>

                    <p>
                      <strong>Plan Resource:</strong>{" "}
                      {result.remediationPlan.resourceName || "N/A"}
                    </p>

                    <p>
                      <strong>Steps:</strong>
                    </p>

                    {result.remediationPlan.steps?.length > 0 ? (
                      <ol>
                        {result.remediationPlan.steps.map((step, index) => (
                          <li key={`${result.resultId}-step-${index}`}>
                            {step}
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="empty-text">
                        No remediation steps available.
                      </p>
                    )}
                  </div>
                )}

                {result.status === "rejected" && (
                  <div
                    className="toast toast-error"
                    style={{ marginTop: "14px" }}
                  >
                    <strong>Rejected Reason:</strong>{" "}
                    {getRejectedReason(result)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="card">
        <h2 className="section-title" style={{ marginTop: 0 }}>
          Audit Timeline
        </h2>

        {auditData.events.length === 0 ? (
          <p className="empty-text">No audit events yet.</p>
        ) : (
          auditData.events.map((event) => (
            <div key={event.eventId} className="card audit-item">
              <div className="meta-row">
                <span className={getAuditEventClass(event.eventType)}>
                  {event.eventType}
                </span>

                {event.eventType === "RAW_TELEMETRY_RECEIVED" && (
                  <span className="status-badge status-generated">
                    raw sensor event
                  </span>
                )}

                {event.eventType === "TELEMETRY_NORMALIZED_TO_THREAT" && (
                  <span className="status-badge status-open">
                    normalized threat
                  </span>
                )}

                {event.payload?.decisionPayload?.decision && (
                  <span
                    className={getDecisionBadgeClass(
                      event.payload.decisionPayload.decision
                    )}
                  >
                    decision: {event.payload.decisionPayload.decision}
                  </span>
                )}
              </div>

              <p>
                <strong>Timestamp:</strong> {formatDate(event.timestamp)}
              </p>

              <p>{getAuditSummaryText(event)}</p>

              {event.eventType === "RAW_TELEMETRY_RECEIVED" && (
                <div className="card" style={{ marginTop: "14px" }}>
                  <h3
                    className="section-title"
                    style={{ marginTop: 0, fontSize: "18px" }}
                  >
                    Raw Telemetry Details
                  </h3>

                  {(() => {
                    const telemetry = event.payload?.telemetry || {};
                    const runtimeEvidence = getTelemetryEvidence(telemetry);
                    const runtimeEvent = isRuntimeTelemetry(telemetry);

                    return (
                      <>
                        <p>
                          <strong>Telemetry ID:</strong>{" "}
                          {telemetry.telemetryId || telemetry.id || "N/A"}
                        </p>
                        <p>
                          <strong>Source:</strong> {telemetry.source || "N/A"}
                        </p>
                        <p>
                          <strong>Event Type:</strong>{" "}
                          {telemetry.eventType || "N/A"}
                        </p>
                        <p>
                          <strong>Resource:</strong>{" "}
                          {telemetry.resourceName || "N/A"}
                        </p>
                        <p>
                          <strong>Issue Type:</strong>{" "}
                          {telemetry.issueType || "N/A"}
                        </p>

                        {runtimeEvent ? (
                          <>
                            <p>
                              <strong>Namespace:</strong>{" "}
                              {formatValue(runtimeEvidence.namespace)}
                            </p>
                            <p>
                              <strong>Pod:</strong>{" "}
                              {formatValue(runtimeEvidence.podName)}
                            </p>
                            <p>
                              <strong>Container:</strong>{" "}
                              {formatValue(runtimeEvidence.containerName)}
                            </p>
                            <p>
                              <strong>Image:</strong>{" "}
                              {formatValue(runtimeEvidence.imageName)}
                            </p>
                            <p>
                              <strong>Binary:</strong>{" "}
                              {formatValue(runtimeEvidence.binary)}
                            </p>
                            <p>
                              <strong>Arguments:</strong>{" "}
                              {formatValue(runtimeEvidence.arguments)}
                            </p>
                            <p>
                              <strong>Node:</strong>{" "}
                              {formatValue(runtimeEvidence.nodeName)}
                            </p>
                          </>
                        ) : (
                          <>
                            <p>
                              <strong>Observed Port:</strong>{" "}
                              {telemetry.observedPort || "N/A"}
                            </p>
                            <p>
                              <strong>Exposure:</strong>{" "}
                              {telemetry.exposure || "N/A"}
                            </p>
                            <p>
                              <strong>Source IP Range:</strong>{" "}
                              {telemetry.sourceIpRange || "N/A"}
                            </p>
                          </>
                        )}

                        <p>
                          <strong>Confidence:</strong>{" "}
                          {telemetry.metadata?.confidence ?? "N/A"}
                        </p>
                      </>
                    );
                  })()}
                </div>
              )}

              {event.eventType === "TELEMETRY_NORMALIZED_TO_THREAT" && (
                <div className="card" style={{ marginTop: "14px" }}>
                  <h3
                    className="section-title"
                    style={{ marginTop: 0, fontSize: "18px" }}
                  >
                    Normalized Threat Details
                  </h3>

                  <p>
                    <strong>Source Telemetry ID:</strong>{" "}
                    {event.payload?.sourceTelemetryId || "N/A"}
                  </p>
                  <p>
                    <strong>Threat ID:</strong>{" "}
                    {event.payload?.threat?.id || "N/A"}
                  </p>
                  <p>
                    <strong>Resource:</strong>{" "}
                    {event.payload?.threat?.resourceName || "N/A"}
                  </p>
                  <p>
                    <strong>Issue Type:</strong>{" "}
                    {event.payload?.threat?.issueType || "N/A"}
                  </p>
                  <p>
                    <strong>Severity:</strong>{" "}
                    <span
                      className={getRiskBadgeClass(
                        event.payload?.threat?.severity
                      )}
                    >
                      {event.payload?.threat?.severity || "N/A"}
                    </span>
                  </p>
                  <p>
                    <strong>Description:</strong>{" "}
                    {event.payload?.threat?.description || "N/A"}
                  </p>

                  {event.payload?.threat?.issueType === "unauthorizedPodExec" &&
                    (() => {
                      const runtimeEvidence = getThreatEvidence(
                        event.payload?.threat || {}
                      );

                      return (
                        <div className="card" style={{ marginTop: "14px" }}>
                          <h3
                            className="section-title"
                            style={{ marginTop: 0, fontSize: "18px" }}
                          >
                            eBPF Evidence
                          </h3>
                          <p><strong>Namespace:</strong> {formatValue(runtimeEvidence.namespace)}</p>
                          <p><strong>Pod:</strong> {formatValue(runtimeEvidence.podName)}</p>
                          <p><strong>Container:</strong> {formatValue(runtimeEvidence.containerName)}</p>
                          <p><strong>Image:</strong> {formatValue(runtimeEvidence.imageName)}</p>
                          <p><strong>Binary:</strong> {formatValue(runtimeEvidence.binary)}</p>
                          <p><strong>Arguments:</strong> {formatValue(runtimeEvidence.arguments)}</p>
                          <p><strong>Node:</strong> {formatValue(runtimeEvidence.nodeName)}</p>
                        </div>
                      );
                    })()}
                </div>
              )}

              {event.payload?.decisionPayload && (
                <div className="card" style={{ marginTop: "14px" }}>
                  <h3
                    className="section-title"
                    style={{ marginTop: 0, fontSize: "18px" }}
                  >
                    Approval Decision Details
                  </h3>

                  <p>
                    <strong>Decision:</strong>{" "}
                    <span
                      className={getDecisionBadgeClass(
                        event.payload.decisionPayload.decision
                      )}
                    >
                      {event.payload.decisionPayload.decision || "unknown"}
                    </span>
                  </p>

                  <p>
                    <strong>Decision ID:</strong>{" "}
                    {event.payload.decisionPayload.decisionId || "N/A"}
                  </p>

                  <p>
                    <strong>Approval ID:</strong>{" "}
                    {event.payload.decisionPayload.approvalId || "N/A"}
                  </p>

                  <p>
                    <strong>Remediation ID:</strong>{" "}
                    {event.payload.decisionPayload.remediationId || "N/A"}
                  </p>

                  <p>
                    <strong>Threat ID:</strong>{" "}
                    {event.payload.decisionPayload.threatId || "N/A"}
                  </p>

                  <p>
                    <strong>Decided By:</strong>{" "}
                    {event.payload.decisionPayload.decidedBy || "N/A"}
                  </p>

                  <p>
                    <strong>Decided At:</strong>{" "}
                    {formatDate(event.payload.decisionPayload.decidedAt)}
                  </p>

                  <p>
                    <strong>Reason:</strong>{" "}
                    {event.payload.decisionPayload.reason || "N/A"}
                  </p>
                </div>
              )}

              <details style={{ marginTop: "12px" }}>
                <summary
                  style={{
                    cursor: "pointer",
                    color: "#60a5fa",
                    fontWeight: "600",
                    marginBottom: "10px",
                  }}
                >
                  View Event Payload
                </summary>
                <pre className="code-block">
                  {JSON.stringify(event.payload, null, 2)}
                </pre>
              </details>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default StreamingMonitorPage;