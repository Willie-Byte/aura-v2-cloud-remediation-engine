import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getAlertById,
  getRemediationsByAlertId,
  getAuditLogsByAlertId,
  generateFix,
  approveRemediation,
  rejectRemediation,
  deployRemediation,
} from "../services/api";
import ConfirmModal from "../components/ConfirmModal";

function AlertDetailsPage() {
  const { id } = useParams();

  const [alert, setAlert] = useState(null);
  const [remediations, setRemediations] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [modalState, setModalState] = useState({
    isOpen: false,
    action: null,
    remediationId: null,
    title: "",
    message: "",
    confirmText: "Confirm",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const alertRes = await getAlertById(id);
        const remediationRes = await getRemediationsByAlertId(id);
        const auditLogRes = await getAuditLogsByAlertId(id);

        setAlert(alertRes.data);
        setRemediations(remediationRes.data);
        setAuditLogs(auditLogRes.data);
      } catch (error) {
        console.error("Error fetching alert details:", error);
        setErrorMessage("Failed to load alert details.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const refreshData = async () => {
    const alertRes = await getAlertById(id);
    const remediationRes = await getRemediationsByAlertId(id);
    const auditLogRes = await getAuditLogsByAlertId(id);

    setAlert(alertRes.data);
    setRemediations(remediationRes.data);
    setAuditLogs(auditLogRes.data);
  };

  const clearMessages = () => {
    setSuccessMessage("");
    setErrorMessage("");
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      action: null,
      remediationId: null,
      title: "",
      message: "",
      confirmText: "Confirm",
    });
  };

  const openModal = (action, remediationId) => {
    if (action === "approve") {
      setModalState({
        isOpen: true,
        action,
        remediationId,
        title: "Approve Remediation",
        message:
          "Are you sure you want to approve this remediation? This will mark the alert as approved.",
        confirmText: "Approve",
      });
    } else if (action === "reject") {
      setModalState({
        isOpen: true,
        action,
        remediationId,
        title: "Reject Remediation",
        message:
          "Are you sure you want to reject this remediation? This will mark the alert as rejected.",
        confirmText: "Reject",
      });
    } else if (action === "deploy") {
      setModalState({
        isOpen: true,
        action,
        remediationId,
        title: "Deploy Remediation",
        message:
          "Are you sure you want to deploy this remediation? This will mark the alert as resolved and create a GitHub Pull Request.",
        confirmText: "Deploy",
      });
    }
  };

  const handleGenerateFix = async () => {
    try {
      clearMessages();
      await generateFix(id);
      await refreshData();
      setSuccessMessage("Remediation generated successfully.");
    } catch (error) {
      console.error("Error generating fix:", error);
      setErrorMessage("Failed to generate remediation.");
    }
  };

  const handleApprove = async (remediationId) => {
    try {
      clearMessages();
      await approveRemediation(remediationId);
      await refreshData();
      setSuccessMessage("Remediation approved successfully.");
    } catch (error) {
      console.error("Error approving remediation:", error);
      setErrorMessage("Failed to approve remediation.");
    }
  };

  const handleReject = async (remediationId) => {
    try {
      clearMessages();
      await rejectRemediation(remediationId);
      await refreshData();
      setSuccessMessage("Remediation rejected successfully.");
    } catch (error) {
      console.error("Error rejecting remediation:", error);
      setErrorMessage("Failed to reject remediation.");
    }
  };

  const handleDeploy = async (remediationId) => {
    try {
      clearMessages();
      const response = await deployRemediation(remediationId);
      await refreshData();

      const prUrl = response?.data?.pullRequest?.prUrl;
      if (prUrl) {
        setSuccessMessage(`Remediation deployed successfully. Pull Request created: ${prUrl}`);
      } else {
        setSuccessMessage("Remediation deployed successfully.");
      }
    } catch (error) {
      console.error("Error deploying remediation:", error);
      setErrorMessage("Failed to deploy remediation.");
    }
  };

  const handleConfirmAction = async () => {
    const { action, remediationId } = modalState;

    if (!remediationId || !action) return;

    if (action === "approve") {
      await handleApprove(remediationId);
    } else if (action === "reject") {
      await handleReject(remediationId);
    } else if (action === "deploy") {
      await handleDeploy(remediationId);
    }

    closeModal();
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "approved":
        return "status-badge status-approved";
      case "rejected":
        return "status-badge status-rejected";
      case "generated":
        return "status-badge status-generated";
      case "resolved":
        return "status-badge status-resolved";
      case "deployed":
        return "status-badge status-resolved";
      default:
        return "status-badge status-open";
    }
  };

  const getSeverityClass = (severity) => {
    switch (severity) {
      case "critical":
        return "severity-badge severity-critical";
      case "high":
        return "severity-badge severity-high";
      case "medium":
        return "severity-badge severity-medium";
      default:
        return "severity-badge severity-low";
    }
  };

  const getCloudBadgeStyle = (cloudProvider) => {
    switch ((cloudProvider || "").toLowerCase()) {
      case "azure":
        return {
          background: "rgba(59, 130, 246, 0.18)",
          color: "#93c5fd",
          border: "1px solid rgba(59, 130, 246, 0.35)",
        };
      case "aws":
        return {
          background: "rgba(245, 158, 11, 0.16)",
          color: "#fbbf24",
          border: "1px solid rgba(245, 158, 11, 0.35)",
        };
      case "gcp":
        return {
          background: "rgba(34, 197, 94, 0.16)",
          color: "#86efac",
          border: "1px solid rgba(34, 197, 94, 0.35)",
        };
      default:
        return {
          background: "rgba(148, 163, 184, 0.16)",
          color: "#cbd5e1",
          border: "1px solid rgba(148, 163, 184, 0.3)",
        };
    }
  };

  const getCloudLabel = (cloudProvider) => {
    switch ((cloudProvider || "").toLowerCase()) {
      case "azure":
        return "Azure";
      case "aws":
        return "AWS";
      case "gcp":
        return "GCP";
      default:
        return cloudProvider || "Unknown";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const latestRemediation = remediations.length > 0 ? remediations[0] : null;
  const latestAuditLog = auditLogs.length > 0 ? auditLogs[0] : null;

  const evidence = alert?.evidence || {};
  const hasRuntimeEvidence = Boolean(
    alert?.issueType === "unauthorizedPodExec" ||
      alert?.source === "tetragon-ebpf" ||
      evidence.namespace ||
      evidence.podName ||
      evidence.binary
  );

  const formatEvidenceValue = (value) => {
    if (value === undefined || value === null || value === "") return "N/A";
    return String(value);
  };

  const handleExportSummary = () => {
    if (!alert) return;

    const summaryText = `
AURA INCIDENT SUMMARY
=====================

Resource Name: ${alert.resourceName}
Cloud Provider: ${alert.cloudProvider}
Resource Type: ${alert.resourceType}
Issue Type: ${alert.issueType}
Severity: ${alert.severity}
Alert Status: ${alert.status}
Description: ${alert.description}
Source Telemetry ID: ${alert.sourceTelemetryId || "N/A"}
Namespace: ${formatEvidenceValue(alert.evidence?.namespace)}
Pod: ${formatEvidenceValue(alert.evidence?.podName)}
Container: ${formatEvidenceValue(alert.evidence?.containerName)}
Image: ${formatEvidenceValue(alert.evidence?.imageName)}
Binary: ${formatEvidenceValue(alert.evidence?.binary)}
Arguments: ${formatEvidenceValue(alert.evidence?.arguments)}
Node: ${formatEvidenceValue(alert.evidence?.nodeName)}

Created: ${formatDate(alert.createdAt)}
Updated: ${formatDate(alert.updatedAt)}

Latest Remediation Status: ${latestRemediation ? latestRemediation.status : "None"}
Latest Action: ${latestAuditLog ? latestAuditLog.action : "No actions yet"}
Latest Action Time: ${latestAuditLog ? formatDate(latestAuditLog.createdAt) : "N/A"}

Total Remediations: ${remediations.length}
Total Audit Events: ${auditLogs.length}

AUDIT TIMELINE
==============
${auditLogs
  .map(
    (log) =>
      `- ${log.action} | ${formatDate(log.createdAt)} | ${log.message}`
  )
  .join("\n")}
`.trim();

    const blob = new Blob([summaryText], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${alert.resourceName}-incident-summary.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <p className="loading-text">Loading alert details...</p>
      </div>
    );
  }

  if (!alert) {
    return (
      <div className="dashboard-container">
        <p className="empty-text">Alert not found.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Link to="/" className="back-link">
        ← Back to Alerts
      </Link>

      {successMessage && <div className="toast toast-success">{successMessage}</div>}
      {errorMessage && <div className="toast toast-error">{errorMessage}</div>}

      <div className="summary-grid">
        <div className="summary-card">
          <p className="summary-label">Alert Status</p>
          <h3>
            <span className={getStatusClass(alert.status)}>{alert.status}</span>
          </h3>
        </div>

        <div className="summary-card">
          <p className="summary-label">Severity</p>
          <h3>
            <span className={getSeverityClass(alert.severity)}>{alert.severity}</span>
          </h3>
        </div>

        <div className="summary-card">
          <p className="summary-label">Cloud Provider</p>
          <h3>
            <span className="status-badge" style={getCloudBadgeStyle(alert.cloudProvider)}>
              {getCloudLabel(alert.cloudProvider)}
            </span>
          </h3>
        </div>

        <div className="summary-card">
          <p className="summary-label">Latest Action</p>
          <h3 style={{ fontSize: "16px" }}>
            {latestAuditLog ? latestAuditLog.action : "No actions yet"}
          </h3>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title" style={{ marginTop: 0 }}>
          Incident Summary
        </h2>
        <p className="timestamp-text">
          <strong>Created:</strong> {formatDate(alert.createdAt)}
        </p>
        <p className="timestamp-text">
          <strong>Updated:</strong> {formatDate(alert.updatedAt)}
        </p>
        <p className="timestamp-text">
          <strong>Latest Remediation:</strong>{" "}
          {latestRemediation ? latestRemediation.status : "None"}
        </p>
        <p className="timestamp-text">
          <strong>Total Audit Events:</strong> {auditLogs.length}
        </p>
        <p className="timestamp-text">
          <strong>Latest Action Time:</strong>{" "}
          {latestAuditLog ? formatDate(latestAuditLog.createdAt) : "N/A"}
        </p>

        <div className="button-row" style={{ marginTop: "16px" }}>
          <button onClick={handleExportSummary}>Export Summary</button>
        </div>
      </div>

      <div className="card">
        <h1>{alert.resourceName}</h1>

        <div className="meta-row">
          <span
            className="status-badge"
            style={getCloudBadgeStyle(alert.cloudProvider)}
          >
            {getCloudLabel(alert.cloudProvider)}
          </span>
          <span className={getSeverityClass(alert.severity)}>
            {alert.severity}
          </span>
          <span className={getStatusClass(alert.status)}>
            {alert.status}
          </span>
        </div>

        <p><strong>Cloud:</strong> {alert.cloudProvider}</p>
        <p><strong>Source:</strong> {alert.source || "N/A"}</p>
        <p><strong>Resource Type:</strong> {alert.resourceType}</p>
        <p><strong>Issue Type:</strong> {alert.issueType}</p>
        <p><strong>Description:</strong> {alert.description}</p>

        {hasRuntimeEvidence && (
          <div className="card" style={{ marginTop: "16px" }}>
            <h2 className="section-title" style={{ marginTop: 0, fontSize: "18px" }}>
              Live eBPF Runtime Evidence
            </h2>
            <p><strong>Source Telemetry ID:</strong> {alert.sourceTelemetryId || "N/A"}</p>
            <p><strong>Namespace:</strong> {formatEvidenceValue(evidence.namespace)}</p>
            <p><strong>Pod:</strong> {formatEvidenceValue(evidence.podName)}</p>
            <p><strong>Container:</strong> {formatEvidenceValue(evidence.containerName)}</p>
            <p><strong>Image:</strong> {formatEvidenceValue(evidence.imageName)}</p>
            <p><strong>Binary:</strong> {formatEvidenceValue(evidence.binary)}</p>
            <p><strong>Arguments:</strong> {formatEvidenceValue(evidence.arguments)}</p>
            <p><strong>Node:</strong> {formatEvidenceValue(evidence.nodeName)}</p>
            <p><strong>Ingestion Path:</strong> {alert.streamingMetadata?.ingestionPath || "N/A"}</p>
          </div>
        )}

        <div className="button-row">
          <button
            onClick={handleGenerateFix}
            disabled={alert.status === "approved" || alert.status === "resolved"}
          >
            Generate Fix
          </button>
        </div>
      </div>

      <h2 className="section-title">Remediations</h2>
      {remediations.length === 0 ? (
        <p className="empty-text">No remediations yet.</p>
      ) : (
        remediations.map((remediation) => {
          const isDeployed = remediation.status === "deployed";
          const isApproved = remediation.status === "approved";
          const isRejected = remediation.status === "rejected";
          const isGenerated = remediation.status === "generated";
          const alertResolved = alert.status === "resolved";

          return (
            <div key={remediation._id} className="card">
              <p>
                <strong>Status:</strong>{" "}
                <span className={getStatusClass(remediation.status)}>
                  {remediation.status}
                </span>
              </p>

              <p><strong>Confidence:</strong> {remediation.confidence}</p>
              <p><strong>Explanation:</strong> {remediation.explanation}</p>

              {remediation.prNumber && (
                <p>
                  <strong>Pull Request:</strong>{" "}
                  <a
                    href={remediation.prUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="card-link"
                  >
                    #{remediation.prNumber}
                  </a>
                </p>
              )}

              {remediation.branchName && (
                <p>
                  <strong>Branch:</strong> {remediation.branchName}
                </p>
              )}

              {remediation.filePath && (
                <p>
                  <strong>File Path:</strong> {remediation.filePath}
                </p>
              )}

              {remediation.prUrl && (
                <p>
                  <strong>PR URL:</strong>{" "}
                  <a
                    href={remediation.prUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="card-link"
                  >
                    Open Pull Request
                  </a>
                </p>
              )}

              <pre className="code-block">{remediation.generatedCode}</pre>

              <div className="button-row">
                <button
                  onClick={() => openModal("approve", remediation._id)}
                  disabled={
                    isApproved ||
                    isRejected ||
                    isDeployed ||
                    alertResolved ||
                    !isGenerated
                  }
                >
                  Approve
                </button>

                <button
                  className="secondary-button"
                  onClick={() => openModal("reject", remediation._id)}
                  disabled={
                    isRejected ||
                    isDeployed ||
                    alertResolved ||
                    !isGenerated
                  }
                >
                  Reject
                </button>

                <button
                  onClick={() => openModal("deploy", remediation._id)}
                  disabled={isDeployed || alertResolved || !isApproved}
                >
                  Deploy
                </button>
              </div>
            </div>
          );
        })
      )}

      <h2 className="section-title">Audit Logs</h2>
      {auditLogs.length === 0 ? (
        <p className="empty-text">No audit logs yet.</p>
      ) : (
        auditLogs.map((log) => (
          <div key={log._id} className="card audit-item">
            <p><strong>Action:</strong> {log.action}</p>
            <p><strong>Message:</strong> {log.message}</p>
            <p><strong>Created At:</strong> {formatDate(log.createdAt)}</p>
          </div>
        ))
      )}

      <ConfirmModal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        confirmText={modalState.confirmText}
        onConfirm={handleConfirmAction}
        onCancel={closeModal}
      />
    </div>
  );
}

export default AlertDetailsPage;