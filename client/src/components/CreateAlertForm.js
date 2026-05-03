import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createAlert } from "../services/api";

function CreateAlertForm({ onAlertCreated }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    source: "simulator",
    cloudProvider: "azure",
    resourceType: "storageAccount",
    resourceName: "",
    severity: "high",
    issueType: "publicStorageAccess",
    description: "Storage account allows public blob access",
    status: "open",
  });

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      let updated = { ...prev, [name]: value };

      if (name === "issueType") {
        if (value === "publicStorageAccess") {
          updated.resourceType = "storageAccount";
          updated.description = "Storage account allows public blob access";
        } else if (value === "publicSSHAccess") {
          updated.resourceType = "networkSecurityGroup";
          updated.description =
            "Network security group allows public SSH access on port 22";
        } else if (value === "publicRDPAccess") {
          updated.resourceType = "networkSecurityGroup";
          updated.description =
            "Network security group allows public RDP access on port 3389";
        } else if (value === "unencryptedDatabase") {
          updated.resourceType = "sqlDatabase";
          updated.description = "Database encryption is not enabled";
        } else if (value === "weakTlsVersion") {
          updated.resourceType = "appService";
          updated.description = "Service allows weak TLS versions below 1.2";
        }
      }

      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSuccessMessage("");
    setErrorMessage("");

    if (!formData.resourceName.trim() || !formData.description.trim()) {
      setErrorMessage("Resource name and description are required.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await createAlert(formData);
      const newAlert = response.data;

      setFormData({
        source: "simulator",
        cloudProvider: "azure",
        resourceType: "storageAccount",
        resourceName: "",
        severity: "high",
        issueType: "publicStorageAccess",
        description: "Storage account allows public blob access",
        status: "open",
      });

      if (onAlertCreated) {
        await onAlertCreated();
      }

      navigate(`/alerts/${newAlert._id}`);
    } catch (error) {
      console.error("Error creating alert:", error);
      setErrorMessage("Failed to create alert.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card">
      <h2 className="section-title" style={{ marginTop: 0 }}>
        Create Simulated Alert
      </h2>

      {successMessage && <p className="success-text">{successMessage}</p>}
      {errorMessage && <p className="error-text">{errorMessage}</p>}

      <form onSubmit={handleSubmit} className="form-grid">
        <div className="form-group">
          <label>Resource Name</label>
          <input
            type="text"
            name="resourceName"
            value={formData.resourceName}
            onChange={handleChange}
            placeholder="prod-storage-003"
          />
        </div>

        <div className="form-group">
          <label>Cloud Provider</label>
          <select
            name="cloudProvider"
            value={formData.cloudProvider}
            onChange={handleChange}
          >
            <option value="azure">azure</option>
            <option value="aws">aws</option>
            <option value="gcp">gcp</option>
          </select>
        </div>

        <div className="form-group">
          <label>Resource Type</label>
          <input
            type="text"
            name="resourceType"
            value={formData.resourceType}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Severity</label>
          <select
            name="severity"
            value={formData.severity}
            onChange={handleChange}
          >
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
            <option value="critical">critical</option>
          </select>
        </div>

        <div className="form-group">
          <label>Issue Type</label>
          <select
            name="issueType"
            value={formData.issueType}
            onChange={handleChange}
          >
            <option value="publicStorageAccess">publicStorageAccess</option>
            <option value="publicSSHAccess">publicSSHAccess</option>
            <option value="publicRDPAccess">publicRDPAccess</option>
            <option value="unencryptedDatabase">unencryptedDatabase</option>
            <option value="weakTlsVersion">weakTlsVersion</option>
          </select>
        </div>

        <div className="form-group form-group-full">
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
          />
        </div>

        <div className="form-group">
          <label>Source</label>
          <input
            type="text"
            name="source"
            value={formData.source}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="open">open</option>
            <option value="resolved">resolved</option>
          </select>
        </div>

        <div className="form-group-full">
          <button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create Alert"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateAlertForm;