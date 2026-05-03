const Remediation = require("../models/Remediation");
const Alert = require("../models/Alert");
const AuditLog = require("../models/AuditLog");
const { createPullRequestForRemediation } = require("../services/githubService");

// @desc    Get remediations by alert ID
// @route   GET /api/remediations/alert/:alertId
// @access  Public
const getRemediationsByAlertId = async (req, res) => {
  try {
    const remediations = await Remediation.find({
      alertId: req.params.alertId,
    }).sort({ createdAt: -1 });

    res.status(200).json(remediations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve a remediation
// @route   PATCH /api/remediations/:id/approve
// @access  Public
const approveRemediation = async (req, res) => {
  try {
    const remediation = await Remediation.findById(req.params.id);

    if (!remediation) {
      return res.status(404).json({ message: "Remediation not found" });
    }

    remediation.status = "approved";
    const updatedRemediation = await remediation.save();

    await Remediation.updateMany(
      {
        alertId: remediation.alertId,
        _id: { $ne: remediation._id },
        status: "generated",
      },
      { $set: { status: "rejected" } }
    );

    const alert = await Alert.findById(remediation.alertId);
    if (alert) {
      alert.status = "approved";
      await alert.save();
    }

    await AuditLog.create({
      alertId: remediation.alertId,
      remediationId: remediation._id,
      action: "REMEDIATION_APPROVED",
      message: `Remediation "${remediation._id}" approved for alert "${remediation.alertId}".`,
    });

    res.status(200).json({
      message: "Remediation approved successfully",
      remediation: updatedRemediation,
      alert,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject a remediation
// @route   PATCH /api/remediations/:id/reject
// @access  Public
const rejectRemediation = async (req, res) => {
  try {
    const remediation = await Remediation.findById(req.params.id);

    if (!remediation) {
      return res.status(404).json({ message: "Remediation not found" });
    }

    remediation.status = "rejected";
    const updatedRemediation = await remediation.save();

    const alert = await Alert.findById(remediation.alertId);
    if (alert) {
      alert.status = "rejected";
      await alert.save();
    }

    await AuditLog.create({
      alertId: remediation.alertId,
      remediationId: remediation._id,
      action: "REMEDIATION_REJECTED",
      message: `Remediation "${remediation._id}" rejected for alert "${remediation.alertId}".`,
    });

    res.status(200).json({
      message: "Remediation rejected successfully",
      remediation: updatedRemediation,
      alert,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Deploy a remediation
// @route   PATCH /api/remediations/:id/deploy
// @access  Public
const deployRemediation = async (req, res) => {
  try {
    const remediation = await Remediation.findById(req.params.id);

    if (!remediation) {
      return res.status(404).json({ message: "Remediation not found" });
    }

    if (remediation.status !== "approved") {
      return res.status(400).json({
        message: "Only approved remediations can be deployed",
      });
    }

    const alert = await Alert.findById(remediation.alertId);

    if (!alert) {
      return res.status(404).json({ message: "Associated alert not found" });
    }

    const prResult = await createPullRequestForRemediation({
      alert,
      remediation,
    });

    remediation.status = "deployed";
    remediation.prUrl = prResult.prUrl;
    remediation.prNumber = prResult.prNumber;
    remediation.branchName = prResult.branchName;
    remediation.filePath = prResult.filePath;

    const updatedRemediation = await remediation.save();

    alert.status = "resolved";
    await alert.save();

    await AuditLog.create({
      alertId: remediation.alertId,
      remediationId: remediation._id,
      action: "REMEDIATION_DEPLOYED",
      message: `Remediation "${remediation._id}" deployed for alert "${remediation.alertId}". Pull Request: ${prResult.prUrl}`,
    });

    res.status(200).json({
      message: "Remediation deployed successfully and Pull Request created",
      remediation: updatedRemediation,
      alert,
      pullRequest: prResult,
    });
  } catch (error) {
    console.error("Deploy remediation error:", error);
    res.status(500).json({
      message: error.message || "Failed to deploy remediation",
    });
  }
};

module.exports = {
  getRemediationsByAlertId,
  approveRemediation,
  rejectRemediation,
  deployRemediation,
};