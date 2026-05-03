import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAlerts } from "../services/api";

function WebhookEventsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cloudFilter, setCloudFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWebhookAlerts = async () => {
      try {
        const response = await getAlerts();

        const webhookAlerts = response.data.filter((alert) =>
          ["azure-event-grid", "aws-eventbridge", "gcp-eventarc"].includes(alert.source)
        );

        setAlerts(webhookAlerts);
      } catch (error) {
        console.error("Error fetching webhook events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWebhookAlerts();
  }, []);

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

  const getSourceLabel = (source) => {
    switch ((source || "").toLowerCase()) {
      case "azure-event-grid":
        return "Azure Event Grid";
      case "aws-eventbridge":
        return "AWS EventBridge";
      case "gcp-eventarc":
        return "GCP Eventarc";
      default:
        return source || "Unknown Source";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const filteredEvents = useMemo(() => {
    let result = [...alerts];

    if (cloudFilter !== "all") {
      result = result.filter(
        (alert) => (alert.cloudProvider || "").toLowerCase() === cloudFilter
      );
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (alert) =>
          alert.resourceName.toLowerCase().includes(term) ||
          alert.issueType.toLowerCase().includes(term) ||
          alert.source.toLowerCase().includes(term) ||
          alert.cloudProvider.toLowerCase().includes(term)
      );
    }

    result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return result;
  }, [alerts, cloudFilter, searchTerm]);

  const azureCount = alerts.filter(
    (alert) => (alert.cloudProvider || "").toLowerCase() === "azure"
  ).length;

  const awsCount = alerts.filter(
    (alert) => (alert.cloudProvider || "").toLowerCase() === "aws"
  ).length;

  const gcpCount = alerts.filter(
    (alert) => (alert.cloudProvider || "").toLowerCase() === "gcp"
  ).length;

  if (loading) {
    return (
      <div className="dashboard-container">
        <p className="loading-text">Loading webhook events...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Link to="/" className="back-link">
        ← Back to Dashboard
      </Link>

      <h1 className="dashboard-title">Webhook Event History</h1>
      <p className="dashboard-subtitle">
        Review Azure, AWS, and GCP webhook-driven alert intake across Aura.
      </p>

      <div className="summary-grid">
        <div className="summary-card">
          <p className="summary-label">Webhook Events</p>
          <h3>{alerts.length}</h3>
        </div>

        <div className="summary-card">
          <p className="summary-label">Azure Events</p>
          <h3>{azureCount}</h3>
        </div>

        <div className="summary-card">
          <p className="summary-label">AWS Events</p>
          <h3>{awsCount}</h3>
        </div>

        <div className="summary-card">
          <p className="summary-label">GCP Events</p>
          <h3>{gcpCount}</h3>
        </div>
      </div>

      <div className="toolbar-row">
        <input
          type="text"
          className="search-input"
          placeholder="Search by resource name, issue type, webhook source, or cloud provider..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="controls-row">
        <div className="filter-row">
          <button
            className={cloudFilter === "all" ? "filter-button active-filter" : "filter-button"}
            onClick={() => setCloudFilter("all")}
          >
            All
          </button>

          <button
            className={cloudFilter === "azure" ? "filter-button active-filter" : "filter-button"}
            onClick={() => setCloudFilter("azure")}
          >
            Azure
          </button>

          <button
            className={cloudFilter === "aws" ? "filter-button active-filter" : "filter-button"}
            onClick={() => setCloudFilter("aws")}
          >
            AWS
          </button>

          <button
            className={cloudFilter === "gcp" ? "filter-button active-filter" : "filter-button"}
            onClick={() => setCloudFilter("gcp")}
          >
            GCP
          </button>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <p className="empty-text">No webhook events found.</p>
      ) : (
        <div className="alert-grid">
          {filteredEvents.map((alert) => (
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
                <strong>Source:</strong> {getSourceLabel(alert.source)}
              </p>
              <p>
                <strong>Cloud:</strong> {getCloudLabel(alert.cloudProvider)}
              </p>
              <p>
                <strong>Resource Type:</strong> {alert.resourceType}
              </p>
              <p>
                <strong>Issue Type:</strong> {alert.issueType}
              </p>
              <p>
                <strong>Description:</strong> {alert.description}
              </p>
              <p className="timestamp-text">
                <strong>Created:</strong> {formatDate(alert.createdAt)}
              </p>

              <p className="card-link">Open Alert Details</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default WebhookEventsPage;