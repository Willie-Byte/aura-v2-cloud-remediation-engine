import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getAlerts, getQuantumRisk } from "../services/api";
import CreateAlertForm from "../components/CreateAlertForm";

function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [quantumRiskData, setQuantumRiskData] = useState({
    score: 0,
    riskLabel: "Low",
    totalQuantumSensitiveFindings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  const [newAlertMessage, setNewAlertMessage] = useState("");
  const navigate = useNavigate();

  const previousAlertIdsRef = useRef([]);

  const fetchAlerts = useCallback(async (showLoader = false, showToast = false) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const [alertsResponse, quantumRiskResponse] = await Promise.all([
        getAlerts(),
        getQuantumRisk(),
      ]);

      const nextAlerts = alertsResponse.data;
      const nextAlertIds = nextAlerts.map((alert) => alert._id);

      if (showToast && previousAlertIdsRef.current.length > 0) {
        const newestAlert = nextAlerts.find(
          (alert) => !previousAlertIdsRef.current.includes(alert._id)
        );

        if (newestAlert) {
          const providerLabel =
            newestAlert.cloudProvider === "aws"
              ? "AWS"
              : newestAlert.cloudProvider === "azure"
              ? "Azure"
              : newestAlert.cloudProvider;

          setNewAlertMessage(
            `New ${providerLabel} alert received: ${newestAlert.resourceName}`
          );

          setTimeout(() => {
            setNewAlertMessage("");
          }, 4000);
        }
      }

      previousAlertIdsRef.current = nextAlertIds;
      setAlerts(nextAlerts);
      setQuantumRiskData(quantumRiskResponse.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchAlerts(true, false);
  }, [fetchAlerts]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchAlerts(false, true);
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchAlerts]);

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

  const getSeverityRank = (severity) => {
    switch (severity) {
      case "critical":
        return 4;
      case "high":
        return 3;
      case "medium":
        return 2;
      case "low":
        return 1;
      default:
        return 0;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const totalAlerts = alerts.length;
  const openAlerts = alerts.filter((alert) => alert.status === "open").length;
  const approvedAlerts = alerts.filter((alert) => alert.status === "approved").length;
  const rejectedAlerts = alerts.filter((alert) => alert.status === "rejected").length;
  const webhookEventsCount = alerts.filter((alert) =>
    ["azure-event-grid", "aws-eventbridge"].includes(alert.source)
  ).length;

  const filteredAlerts = useMemo(() => {
    let result = [...alerts];

    if (statusFilter !== "all") {
      result = result.filter((alert) => alert.status === statusFilter);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (alert) =>
          alert.resourceName.toLowerCase().includes(term) ||
          alert.issueType.toLowerCase().includes(term) ||
          alert.cloudProvider.toLowerCase().includes(term)
      );
    }

    switch (sortOption) {
      case "oldest":
        result.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case "severity-high":
        result.sort((a, b) => getSeverityRank(b.severity) - getSeverityRank(a.severity));
        break;
      case "severity-low":
        result.sort((a, b) => getSeverityRank(a.severity) - getSeverityRank(b.severity));
        break;
      case "newest":
      default:
        result.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }

    return result;
  }, [alerts, statusFilter, searchTerm, sortOption]);

  return (
    <div className="dashboard-container">
      {newAlertMessage && <div className="toast toast-success">{newAlertMessage}</div>}

      <h1 className="dashboard-title">Security Alerts</h1>
      <p className="dashboard-subtitle">
        Review cloud misconfigurations, generated remediations, and workflow status.
      </p>

      <div className="summary-grid">
        <div className="summary-card">
          <p className="summary-label">Total Alerts</p>
          <h3>{totalAlerts}</h3>
        </div>

        <div className="summary-card">
          <p className="summary-label">Open Alerts</p>
          <h3>{openAlerts}</h3>
        </div>

        <div className="summary-card">
          <p className="summary-label">Approved</p>
          <h3>{approvedAlerts}</h3>
        </div>

        <div className="summary-card">
          <p className="summary-label">Rejected</p>
          <h3>{rejectedAlerts}</h3>
        </div>

        <div
          className="summary-card clickable-card"
          onClick={() => navigate("/webhook-events")}
          role="button"
          tabIndex={0}
          style={{ cursor: "pointer" }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              navigate("/webhook-events");
            }
          }}
        >
          <p className="summary-label">Webhook Events</p>
          <h3>{webhookEventsCount}</h3>
          <p className="timestamp-text">Azure and AWS intake activity</p>
          <p
            style={{
              marginTop: "12px",
              color: "#60a5fa",
              fontWeight: "600",
            }}
          >
            Open Event History →
          </p>
        </div>

        <div
          className="summary-card clickable-card"
          onClick={() => navigate("/quantum-risk")}
          role="button"
          tabIndex={0}
          style={{ cursor: "pointer" }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              navigate("/quantum-risk");
            }
          }}
        >
          <p className="summary-label">Quantum Risk</p>
          <h3>{quantumRiskData.score}/100</h3>
          <p className="timestamp-text">Status: {quantumRiskData.riskLabel}</p>
          <p className="timestamp-text">
            Quantum-Sensitive Findings: {quantumRiskData.totalQuantumSensitiveFindings}
          </p>
          <p
            style={{
              marginTop: "12px",
              color: "#60a5fa",
              fontWeight: "600",
            }}
          >
            Open Quantum Report →
          </p>
        </div>
      </div>

      <CreateAlertForm onAlertCreated={() => fetchAlerts(false, false)} />

      <div className="page-divider"></div>

      <div className="toolbar-row">
        <input
          type="text"
          className="search-input"
          placeholder="Search by resource name, issue type, or cloud provider..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="controls-row">
        <div className="filter-row">
          <button
            className={statusFilter === "all" ? "filter-button active-filter" : "filter-button"}
            onClick={() => setStatusFilter("all")}
          >
            All
          </button>
          <button
            className={statusFilter === "open" ? "filter-button active-filter" : "filter-button"}
            onClick={() => setStatusFilter("open")}
          >
            Open
          </button>
          <button
            className={statusFilter === "approved" ? "filter-button active-filter" : "filter-button"}
            onClick={() => setStatusFilter("approved")}
          >
            Approved
          </button>
          <button
            className={statusFilter === "rejected" ? "filter-button active-filter" : "filter-button"}
            onClick={() => setStatusFilter("rejected")}
          >
            Rejected
          </button>
        </div>

        <div className="sort-group">
          <label htmlFor="sortOption" className="sort-label">
            Sort By
          </label>
          <select
            id="sortOption"
            className="sort-select"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="severity-high">Severity High to Low</option>
            <option value="severity-low">Severity Low to High</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="loading-text">Loading alerts...</p>
      ) : filteredAlerts.length === 0 ? (
        <p className="empty-text">No alerts found for this filter or search.</p>
      ) : (
        <div className="alert-grid">
          {filteredAlerts.map((alert) => (
            <div
              key={alert._id}
              className="card clickable-card"
              onClick={() => navigate(`/alerts/${alert._id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  navigate(`/alerts/${alert._id}`);
                }
              }}
            >
              <h3>{alert.resourceName}</h3>

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

              <p>
                <strong>Cloud:</strong> {alert.cloudProvider}
              </p>
              <p>
                <strong>Resource Type:</strong> {alert.resourceType}
              </p>
              <p>
                <strong>Issue Type:</strong> {alert.issueType}
              </p>
              <p className="timestamp-text">
                <strong>Created:</strong> {formatDate(alert.createdAt)}
              </p>
              <p className="timestamp-text">
                <strong>Updated:</strong> {formatDate(alert.updatedAt)}
              </p>

              <p className="card-link">View Details</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AlertsPage;