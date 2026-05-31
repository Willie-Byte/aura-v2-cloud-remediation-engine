import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getPersistentStreamingAuditEvents,
  getPersistentStreamingExecutionResults,
  getPersistentStreamingApprovalRequests,
  getPersistentStreamingApprovalDecisions,
} from "../services/api";

const DEFAULT_LIMIT = 25;

const datasets = [
  {
    key: "auditEvents",
    label: "Audit Events",
    description: "Persistent audit-log records saved from Kafka consumers.",
    responseKey: "events",
    fetcher: getPersistentStreamingAuditEvents,
    filterPlaceholder: "Filter by event type, topic, key, resource, or payload...",
  },
  {
    key: "executionResults",
    label: "Execution Results",
    description: "Persistent execution-results records from simulated remediation flow.",
    responseKey: "results",
    fetcher: getPersistentStreamingExecutionResults,
    filterPlaceholder: "Filter by status, remediation ID, resource, issue, or mode...",
  },
  {
    key: "approvalRequests",
    label: "Approval Requests",
    description: "Persistent approval-queue records waiting for human review.",
    responseKey: "requests",
    fetcher: getPersistentStreamingApprovalRequests,
    filterPlaceholder: "Filter by approval ID, remediation ID, status, issue, or mode...",
  },
  {
    key: "approvalDecisions",
    label: "Approval Decisions",
    description: "Persistent approval-decisions records from human review actions.",
    responseKey: "decisions",
    fetcher: getPersistentStreamingApprovalDecisions,
    filterPlaceholder: "Filter by decision, reviewer, approval ID, resource, or issue...",
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

function recordMatchesFilter(record, filterText) {
  if (!filterText.trim()) {
    return true;
  }

  return JSON.stringify(record)
    .toLowerCase()
    .includes(filterText.trim().toLowerCase());
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
  const [pageByKey, setPageByKey] = useState({
    auditEvents: 1,
    executionResults: 1,
    approvalRequests: 1,
    approvalDecisions: 1,
  });
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [filterText, setFilterText] = useState("");
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [refreshSeconds, setRefreshSeconds] = useState(15);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const activeDataset = useMemo(
    () => datasets.find((dataset) => dataset.key === activeKey) || datasets[0],
    [activeKey]
  );

  const fetchObservabilityData = useCallback(
    async (showLoader = false) => {
      try {
        if (showLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        const responses = await Promise.all(
          datasets.map((dataset) =>
            dataset.fetcher({
              limit,
              page: pageByKey[dataset.key] || 1,
            })
          )
        );

        const nextRecords = {};
        const nextPagination = {};

        datasets.forEach((dataset, index) => {
          const responseData = responses[index].data || {};
          nextRecords[dataset.key] = responseData[dataset.responseKey] || [];
          nextPagination[dataset.key] = responseData.pagination || {
            page: pageByKey[dataset.key] || 1,
            limit,
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
    },
    [limit, pageByKey]
  );

  useEffect(() => {
    fetchObservabilityData(true);
  }, [fetchObservabilityData]);

  useEffect(() => {
    if (!autoRefreshEnabled) {
      return undefined;
    }

    const interval = setInterval(() => {
      fetchObservabilityData(false);
    }, refreshSeconds * 1000);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, fetchObservabilityData, refreshSeconds]);

  const activeRecords = recordsByKey[activeKey] || [];
  const filteredRecords = activeRecords.filter((record) =>
    recordMatchesFilter(record, filterText)
  );
  const activePagination = paginationByKey[activeKey] || {
    total: activeRecords.length,
    page: pageByKey[activeKey] || 1,
    limit,
    pages: 0,
  };

  const currentPage = activePagination.page || pageByKey[activeKey] || 1;
  const totalPages = activePagination.pages || 0;
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = totalPages > 0 && currentPage < totalPages;

  const updateActivePage = (nextPage) => {
    setPageByKey((current) => ({
      ...current,
      [activeKey]: Math.max(nextPage, 1),
    }));
  };

  const handleLimitChange = (event) => {
    setLimit(Number(event.target.value));
    setPageByKey({
      auditEvents: 1,
      executionResults: 1,
      approvalRequests: 1,
      approvalDecisions: 1,
    });
  };

  const handleDatasetChange = (datasetKey) => {
    setActiveKey(datasetKey);
    setFilterText("");
  };

  return (
    <div className="dashboard-container">
      <div className="page-header-row observability-header">
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

      <div className="summary-grid observability-summary-grid">
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
              onClick={() => handleDatasetChange(dataset.key)}
            >
              <span className="summary-label">{dataset.label}</span>
              <h3>{pagination.total ?? records.length}</h3>
              <p>{dataset.description}</p>
            </button>
          );
        })}
      </div>

      <div className="card observability-controls-card">
        <div className="observability-controls-grid">
          <label className="observability-control">
            <span>Local filter</span>
            <input
              className="search-input"
              type="search"
              value={filterText}
              onChange={(event) => setFilterText(event.target.value)}
              placeholder={activeDataset.filterPlaceholder}
            />
          </label>

          <label className="observability-control">
            <span>Rows per page</span>
            <select
              className="sort-select"
              value={limit}
              onChange={handleLimitChange}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>

          <label className="observability-control">
            <span>Auto refresh</span>
            <select
              className="sort-select"
              value={autoRefreshEnabled ? "on" : "off"}
              onChange={(event) =>
                setAutoRefreshEnabled(event.target.value === "on")
              }
            >
              <option value="off">Off</option>
              <option value="on">On</option>
            </select>
          </label>

          <label className="observability-control">
            <span>Refresh interval</span>
            <select
              className="sort-select"
              value={refreshSeconds}
              onChange={(event) => setRefreshSeconds(Number(event.target.value))}
              disabled={!autoRefreshEnabled}
            >
              <option value={10}>10 seconds</option>
              <option value={15}>15 seconds</option>
              <option value={30}>30 seconds</option>
              <option value={60}>60 seconds</option>
            </select>
          </label>
        </div>
      </div>

      <div className="card">
        <div className="section-header-row observability-section-header">
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
          <div className="empty-state observability-empty-state">
            <h3>No persisted records found yet</h3>
            <p>
              This usually means your local MongoDB is clean or the streaming
              consumers have not persisted records during this session.
            </p>
            <p>
              Run a controlled simulator validation or consumer replay later to
              populate this read-only dashboard.
            </p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="empty-state observability-empty-state">
            <h3>No records match your filter</h3>
            <p>
              Clear the local filter or switch to another dataset. Filtering is
              client-side and does not mutate any backend data.
            </p>
          </div>
        ) : (
          <div className="observability-record-list">
            {filteredRecords.map((record, index) => {
              const badge = getRecordBadge(record, activeKey);
              const recordKey =
                record._id ||
                record.kafka?.offset ||
                record.offset ||
                `${activeKey}-${index}`;

              return (
                <div className="observability-record-card" key={recordKey}>
                  <div className="section-header-row observability-record-header">
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

        <div className="observability-pagination">
          <p className="last-updated-text">
            Page {currentPage} of {totalPages || 1} · Limit {limit} · Total{" "}
            {activePagination.total ?? filteredRecords.length} · Showing{" "}
            {filteredRecords.length}
          </p>

          <div className="button-row">
            <button
              className="secondary-button"
              type="button"
              onClick={() => updateActivePage(1)}
              disabled={!hasPreviousPage}
            >
              First
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => updateActivePage(currentPage - 1)}
              disabled={!hasPreviousPage}
            >
              Previous
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => updateActivePage(currentPage + 1)}
              disabled={!hasNextPage}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StreamingObservabilityPage;
