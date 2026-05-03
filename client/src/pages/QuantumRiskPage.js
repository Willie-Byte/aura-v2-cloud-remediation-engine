import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAlerts, getQuantumRisk } from "../services/api";

function QuantumRiskPage() {
  const [alerts, setAlerts] = useState([]);
  const [quantumData, setQuantumData] = useState({
    score: 0,
    riskLabel: "Low",
    totalQuantumSensitiveFindings: 0,
    issueCounts: {
      unencryptedDatabase: 0,
      weakTlsVersion: 0,
      publicStorageAccess: 0,
      publicSSHAccess: 0,
      publicRDPAccess: 0,
    },
    trackedAlerts: 0,
    topRecommendation: "Maintain current monitoring posture.",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuantumRisk = async () => {
      try {
        const [quantumRiskResponse, alertsResponse] = await Promise.all([
          getQuantumRisk(),
          getAlerts(),
        ]);

        setQuantumData(quantumRiskResponse.data);
        setAlerts(alertsResponse.data);
      } catch (error) {
        console.error("Error fetching quantum risk report:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuantumRisk();
  }, []);

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

  const cloudCounts = alerts.reduce(
    (acc, alert) => {
      const provider = (alert.cloudProvider || "unknown").toLowerCase();
      acc[provider] = (acc[provider] || 0) + 1;
      return acc;
    },
    {}
  );

  if (loading) {
    return (
      <div className="dashboard-container">
        <p className="loading-text">Loading quantum risk report...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Link to="/" className="back-link">
        ← Back to Dashboard
      </Link>

      <h1 className="dashboard-title">Quantum Risk Report</h1>
      <p className="dashboard-subtitle">
        Review Aura’s quantum-readiness posture, high-value findings, and recommended next actions.
      </p>

      <div className="summary-grid">
        <div className="summary-card">
          <p className="summary-label">Quantum Risk Score</p>
          <h3>{quantumData.score}/100</h3>
        </div>

        <div className="summary-card">
          <p className="summary-label">Risk Level</p>
          <h3>{quantumData.riskLabel}</h3>
        </div>

        <div className="summary-card">
          <p className="summary-label">Quantum-Sensitive Findings</p>
          <h3>{quantumData.totalQuantumSensitiveFindings}</h3>
        </div>

        <div className="summary-card">
          <p className="summary-label">Tracked Alerts</p>
          <h3>{quantumData.trackedAlerts}</h3>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title" style={{ marginTop: 0 }}>
          Executive Summary
        </h2>
        <p>
          <strong>Current Posture:</strong> Aura rates the current environment as{" "}
          {quantumData.riskLabel.toLowerCase()} to quantum-era exposure.
        </p>
        <p>
          <strong>Primary Recommendation:</strong> {quantumData.topRecommendation}
        </p>
        <p>
          <strong>Architectural Direction:</strong> Focus on crypto-agility, high-retention data
          protection, and stronger transport security so critical systems are better positioned for
          post-quantum transition planning.
        </p>
      </div>

      <div className="card">
        <h2 className="section-title" style={{ marginTop: 0 }}>
          Cloud Coverage
        </h2>

        <div className="meta-row" style={{ marginBottom: "14px" }}>
          {Object.keys(cloudCounts).length === 0 ? (
            <span className="timestamp-text">No cloud sources detected.</span>
          ) : (
            Object.entries(cloudCounts).map(([provider, count]) => (
              <span
                key={provider}
                className="status-badge"
                style={getCloudBadgeStyle(provider)}
              >
                {getCloudLabel(provider)}: {count}
              </span>
            ))
          )}
        </div>

        <p className="timestamp-text">
          This report now reflects intake across multiple cloud providers, making Aura’s risk
          posture more realistic for multi-cloud environments.
        </p>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <p className="summary-label">Unencrypted Database</p>
          <h3>{quantumData.issueCounts.unencryptedDatabase}</h3>
          <p className="timestamp-text">Highest long-term data sensitivity</p>
          <p className="timestamp-text" style={{ marginTop: "10px" }}>
            Recommended Action: Enable encryption and prioritize long-retention sensitive data.
          </p>
        </div>

        <div className="summary-card">
          <p className="summary-label">Weak TLS Version</p>
          <h3>{quantumData.issueCounts.weakTlsVersion}</h3>
          <p className="timestamp-text">Crypto-agility concern</p>
          <p className="timestamp-text" style={{ marginTop: "10px" }}>
            Recommended Action: Upgrade to TLS 1.2+ and improve crypto-agility planning.
          </p>
        </div>

        <div className="summary-card">
          <p className="summary-label">Public Storage Access</p>
          <h3>{quantumData.issueCounts.publicStorageAccess}</h3>
          <p className="timestamp-text">Harvest-now-decrypt-later exposure</p>
          <p className="timestamp-text" style={{ marginTop: "10px" }}>
            Recommended Action: Restrict public blobs and review long-term sensitive exposure.
          </p>
        </div>

        <div className="summary-card">
          <p className="summary-label">Public SSH / RDP</p>
          <h3>
            {quantumData.issueCounts.publicSSHAccess +
              quantumData.issueCounts.publicRDPAccess}
          </h3>
          <p className="timestamp-text">Operational exposure</p>
          <p className="timestamp-text" style={{ marginTop: "10px" }}>
            Recommended Action: Reduce direct admin exposure and move toward controlled access paths.
          </p>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title" style={{ marginTop: 0 }}>
          Detailed Issue Breakdown
        </h2>

        <p>
          <strong>Unencrypted Database:</strong>{" "}
          {quantumData.issueCounts.unencryptedDatabase}
        </p>
        <p>
          <strong>Weak TLS Version:</strong>{" "}
          {quantumData.issueCounts.weakTlsVersion}
        </p>
        <p>
          <strong>Public Storage Access:</strong>{" "}
          {quantumData.issueCounts.publicStorageAccess}
        </p>
        <p>
          <strong>Public SSH Access:</strong>{" "}
          {quantumData.issueCounts.publicSSHAccess}
        </p>
        <p>
          <strong>Public RDP Access:</strong>{" "}
          {quantumData.issueCounts.publicRDPAccess}
        </p>
      </div>

      <div className="card">
        <h2 className="section-title" style={{ marginTop: 0 }}>
          Suggested Next Steps
        </h2>

        <p>
          <strong>1.</strong> Harden long-term sensitive data systems first, especially databases and
          publicly exposed storage.
        </p>
        <p>
          <strong>2.</strong> Raise legacy TLS configurations to modern standards to improve
          quantum-readiness and crypto-agility.
        </p>
        <p>
          <strong>3.</strong> Prepare future Aura enhancements for PQC audits, hybrid key strategy
          recommendations, and quantum-specific governance reporting.
        </p>
      </div>
    </div>
  );
}

export default QuantumRiskPage;