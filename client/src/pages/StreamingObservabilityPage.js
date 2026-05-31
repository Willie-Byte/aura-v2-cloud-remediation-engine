import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getPersistentStreamingAuditEvents,
  getPersistentStreamingExecutionResults,
  getPersistentStreamingApprovalRequests,
  getPersistentStreamingApprovalDecisions,
} from "../services/api";

const datasets = [
  {
    key: "auditEvents",
    label: "Audit Events",
    description: "Persistent audit-log records saved from Kafka consumers.",
    responseKey: "events",
    fetcher: getPersistentStreamingAuditEvents,
  },
  {
    key: "executionResults",
    label: "Execution Results",
    description: "Persistent execution-results records from simulated remediation flow.",
    responseKey: "results",
    fetcher: getPersistentStreamingExecutionResults,
  },
  {
    key: "approvalRequests",
    label: "Approval Requests",
    description: "Persistent approval-queue records waiting for human review.",
    responseKey: "requests",
    fetcher: getPersistentStreamingApprovalRequests,
  },
  {
    key: "approvalDecisions",
    label: "Approval Decisions",
    description: "Persistent approval-decisions records from human review actions.",
    responseKey: "decisions",
    fetcher: getPersistentStreamingApprovalDecisions,
  },
];

function formatDate(value) {
  if (!value) return "N/A";
  return new Date(value).toLocaleString();
}

function stringifyValue(value) {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

function getPrimaryTime(record) {
  return (
    record.receivedAt ||
    record.resultTimestamp ||
    record.queuedAt ||
    record.decidedAt ||
    record.createdAt ||
    record.updatedAt
  );
}

function getRecordTitle(record, activeKey) {
  if (activeKey === "auditEvents") {
    return record.eventType || "Audit Event";
  }

  if (activeKey === "executionResults") {
    return record.resultId || record.remediationId || "Execution Result";
  }

  if (activeKey === "approvalRequests") {
    return record.approvalId || record.remediationId || "Approval Request";
  }

  if (activeKey === "approvalDecisions") {
    return record.decisionId || record.approvalId || "Approval Decision";
  }

  return "Streaming Record";
}

function getRecordBadge(record, activeKey) {
  if (activeKey === "approvalDecisions") {
    return record.decision || "decision";
  }

  return (
    record.status ||
    record.executionMode ||
    record.eventType ||
    record.topic ||
    "record"
  );
}

function getBadgeClass(value) {
  switch (value) {
    case "executed":
    case "approve":
    case "approved":
      return "status-badge status-approved";
    case "reject":
    case "rejected":
    case "failed":
      return "status-badge status-rejected";
    case "awaiting_approval":
    case "simulate":
      return "status-badge status-generated";
    default:
      return "status-badge status-open";
  }
}

function RecordDetails({ record, activeKey }) {
  const rows = [
    ["Remediation ID", record.remediationId],
    ["Threat ID", record.threatId],
    ["Target Resource", record.targetResource],
    ["Issue Type", record.issueType],
    ["Execution Mode", record.executionMode],
    ["Status", record.status],
    ["Decision", record.decision],
    ["Decided By", record.decidedBy],
    ["Reason", record.reason],
    ["Kafka Topic", record.kafka?.topic || record.topic],
    ["Kafka Partition", record.kafka?.partition || record.partition],
    ["Kafka Offset", record.kafka?.offset || record.offset],
  ].filter(([, value]) => value !== undefined && value !== null && value !== "");

  return (
    <div className="observability-details-grid">
      {rows.map(([label, value]) => (
        <div className="observability-detail" key={`${activeKey}-${label}`}>
          <span>{label}</span>
          <strong>{stringifyValue(value)}</strong>
        </div>
      ))}
    </div>
  );
}

function StreamingObservabilityPage() {
  const [activeKey, setActiveKey] = useState("auditEvents");
  const [recordsByKey, setRecordsByKey] = useState({
    auditEvents: [],
    executionResults: [],
    approvalRequests: [],
    approvalDecisions: [],
  });
  const [paginationByKey, setPaginationByKey] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const activeDataset = useMemo(
    () => datasets.find((dataset) => dataset.key === activeKey) || datasets[0],
    [activeKey]
  );

  const fetchObservabilityData = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const responses = await Promise.all(
        datasets.map((dataset) => dataset.fetcher({ limit: 25 }))
      );

      const nextRecords = {};
      const nextPagination = {};

      datasets.forEach((dataset, index) => {
        const responseData = responses[index].data || {};
        nextRecords[dataset.key] = responseData[dataset.responseKey] || [];
        nextPagination[dataset.key] = responseData.pagination || {
          page: 1,
          limit: 25,
          total: responseData.count || 0,
          pages: 0,
        };
      });

      setRecordsByKey(nextRecords);
      setPaginationByKey(nextPagination);
      setErrorMessage("");
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to load streaming observability data:", error);
      setErrorMessage("Failed to load read-only streaming observability data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchObservabilityData(true);
  }, [fetchObservabilityData]);

  const activeRecords = recordsByKey[activeKey] || [];
  const activePagination = paginationByKey[activeKey] || {
    total: activeRecords.length,
    page: 1,
    limit: 25,
    pages: 0,
  };

  return (
    <div className="dashboard-container">
      <div className="page-header-row">
        <div>
          <h1 className="dashboard-title">Streaming Observability</h1>
          <p className="dashboard-subtitle">
            Read-only view of persistent Aura V2 streaming records. This page
            does not approve, reject, execute, apply Terraform, or mutate cloud
            infrastructure.
          </p>
        </div>

        <button
          className="secondary-button"
          type="button"
          onClick={() => fetchObservabilityData(false)}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="safety-banner">
        <strong>Read-only safety boundary:</strong> this dashboard only reads
        persisted MongoDB records from the streaming API.
      </div>

      {lastUpdated && (
        <p className="last-updated-text">
          Last updated: {lastUpdated.toLocaleString()}
        </p>
      )}

      {errorMessage && <div className="error-banner">{errorMessage}</div>}

      <div className="summary-grid">
        {datasets.map((dataset) => {
          const records = recordsByKey[dataset.key] || [];
          const pagination = paginationByKey[dataset.key] || {};
          const isActive = activeKey === dataset.key;

          return (
            <button
              type="button"
              key={dataset.key}
              className={
                isActive
                  ? "summary-card observability-tab observability-tab-active"
                  : "summary-card observability-tab"
              }
              onClick={() => setActiveKey(dataset.key)}
            >
              <span className="summary-label">{dataset.label}</span>
              <h3>{pagination.total ?? records.length}</h3>
              <p>{dataset.description}</p>
            </button>
          );
        })}
      </div>

      <div className="card">
        <div className="section-header-row">
          <div>
            <h2>{activeDataset.label}</h2>
            <p>{activeDataset.description}</p>
          </div>

          <span className="status-badge status-generated">
            GET-only endpoint
          </span>
        </div>

        {loading ? (
          <p>Loading read-only observability records...</p>
        ) : activeRecords.length === 0 ? (
          <div className="empty-state">
            <h3>No records found</h3>
            <p>
              This is expected if your local MongoDB does not currently contain
              persisted streaming records.
            </p>
          </div>
        ) : (
          <div className="observability-record-list">
            {activeRecords.map((record, index) => {
              const badge = getRecordBadge(record, activeKey);
              const recordKey =
                record._id ||
                record.kafka?.offset ||
                record.offset ||
                `${activeKey}-${index}`;

              return (
                <div className="observability-record-card" key={recordKey}>
                  <div className="section-header-row">
                    <div>
                      <h3>{getRecordTitle(record, activeKey)}</h3>
                      <p>Recorded: {formatDate(getPrimaryTime(record))}</p>
                    </div>

                    <span className={getBadgeClass(badge)}>{badge}</span>
                  </div>

                  <RecordDetails record={record} activeKey={activeKey} />

                  <details className="json-details">
                    <summary>View raw payload</summary>
                    <pre>{JSON.stringify(record.payload || record, null, 2)}</pre>
                  </details>
                </div>
              );
            })}
          </div>
        )}

        <p className="last-updated-text">
          Page {activePagination.page} · Limit {activePagination.limit} · Total{" "}
          {activePagination.total}
        </p>
      </div>
    </div>
  );
}

export default StreamingObservabilityPage;
