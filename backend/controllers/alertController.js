const Alert = require("../models/Alert");
const Remediation = require("../models/Remediation");
const AuditLog = require("../models/AuditLog");
const { generateRemediationFromAI } = require("../services/aiService");

// @desc    Create a new alert
// @route   POST /api/alerts
// @access  Public
const createAlert = async (req, res) => {
  try {
    const {
      source,
      cloudProvider,
      resourceType,
      resourceName,
      severity,
      issueType,
      description,
      status,
    } = req.body;

    const alert = new Alert({
      source,
      cloudProvider,
      resourceType,
      resourceName,
      severity,
      issueType,
      description,
      status,
    });

    const savedAlert = await alert.save();

    await AuditLog.create({
      alertId: savedAlert._id,
      action: "ALERT_CREATED",
      message: `Alert created for resource "${savedAlert.resourceName}" with issue type "${savedAlert.issueType}".`,
    });

    res.status(201).json(savedAlert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all alerts
// @route   GET /api/alerts
// @access  Public
const getAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 });
    res.status(200).json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get quantum risk summary
// @route   GET /api/alerts/quantum-risk
// @access  Public
const getQuantumRisk = async (req, res) => {
  try {
    const alerts = await Alert.find();

    const issueWeights = {
      nonQuantumSafeCrypto: 50,
      unencryptedDatabase: 35,
      weakTlsVersion: 30,
      publicStorageAccess: 20,
      publicSSHAccess: 10,
      publicRDPAccess: 10,
    };

    const issueCounts = {
      nonQuantumSafeCrypto: 0,
      unencryptedDatabase: 0,
      weakTlsVersion: 0,
      publicStorageAccess: 0,
      publicSSHAccess: 0,
      publicRDPAccess: 0,
    };

    let totalScore = 0;

    alerts.forEach((alert) => {
      const weight = issueWeights[alert.issueType] || 5;
      totalScore += weight;

      if (issueCounts[alert.issueType] !== undefined) {
        issueCounts[alert.issueType] += 1;
      }
    });

    const score = Math.min(totalScore, 100);

    let riskLabel = "Low";
    if (score >= 70) {
      riskLabel = "High";
    } else if (score >= 40) {
      riskLabel = "Moderate";
    }

    const totalQuantumSensitiveFindings =
      issueCounts.nonQuantumSafeCrypto +
      issueCounts.unencryptedDatabase +
      issueCounts.weakTlsVersion +
      issueCounts.publicStorageAccess;

    let topRecommendation = "Maintain current monitoring posture.";

    if (issueCounts.nonQuantumSafeCrypto > 0) {
      topRecommendation =
        "Prioritize post-quantum cryptography readiness by enforcing TLS 1.3 with Kyber/ML-KEM hybrid key exchange where supported.";
    } else if (issueCounts.unencryptedDatabase > 0) {
      topRecommendation =
        "Prioritize long-retention data protection and encryption hardening for databases.";
    } else if (issueCounts.weakTlsVersion > 0) {
      topRecommendation =
        "Upgrade weak TLS configurations to improve crypto-agility and long-term resilience.";
    } else if (issueCounts.publicStorageAccess > 0) {
      topRecommendation =
        "Reduce public exposure of sensitive storage to lower harvest-now-decrypt-later risk.";
    }

    res.status(200).json({
      score,
      riskLabel,
      totalQuantumSensitiveFindings,
      issueCounts,
      trackedAlerts: alerts.length,
      topRecommendation,
    });
  } catch (error) {
    console.error("Error calculating quantum risk:", error);
    res.status(500).json({ message: "Failed to calculate quantum risk." });
  }
};

// @desc    Get single alert by ID
// @route   GET /api/alerts/:id
// @access  Public
const getAlertById = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    res.status(200).json(alert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

function getConfidenceFromAuditStatus(auditStatus) {
  if (auditStatus === "PASS") {
    return 0.96;
  }

  if (auditStatus === "CORRECTED") {
    return 0.9;
  }

  return 0.85;
}

// @desc    Generate an AI remediation fix for an alert
// @route   POST /api/alerts/:id/generate-fix
// @access  Public
const generateFix = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    if (alert.status === "approved" || alert.status === "resolved") {
      return res.status(400).json({
        message: `Cannot generate a remediation for an alert with status "${alert.status}"`,
        alert,
      });
    }

    const existingGeneratedRemediation = await Remediation.findOne({
      alertId: alert._id,
      status: "generated",
    });

    if (existingGeneratedRemediation) {
      return res.status(200).json({
        message: "Existing generated remediation already found",
        alert,
        remediation: existingGeneratedRemediation,
      });
    }

    const aiResult = await generateRemediationFromAI(alert);

    const remediation = new Remediation({
      alertId: alert._id,
      generatedCode: aiResult.generatedCode,
      explanation: aiResult.explanation,
      confidence: getConfidenceFromAuditStatus(aiResult.auditStatus),
      status: "generated",
      agenticValidation: aiResult.agenticValidation || {
        enabled: false,
        auditStatus: "NOT_RUN",
        auditNotes: "Agentic validation was not returned by the AI service.",
        validatedAt: null,
      },
    });

    const savedRemediation = await remediation.save();

    await AuditLog.create({
      alertId: alert._id,
      remediationId: savedRemediation._id,
      action: "REMEDIATION_GENERATED",
      message: `AI remediation generated for alert "${alert._id}" on resource "${alert.resourceName}". Agentic audit status: ${savedRemediation.agenticValidation.auditStatus}.`,
    });

    res.status(201).json({
      message: "Remediation generated successfully",
      alert,
      remediation: savedRemediation,
    });
  } catch (error) {
    console.error("Generate remediation error:", error);
    res.status(500).json({
      message: error.message || "Failed to generate remediation",
    });
  }
};

module.exports = {
  createAlert,
  getAlerts,
  getQuantumRisk,
  getAlertById,
  generateFix,
};