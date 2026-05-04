const express = require("express");
const kafka = require("../streaming/kafkaClient");

const router = express.Router();
const producer = kafka.producer();

let producerConnected = false;

async function ensureProducerConnected() {
  if (!producerConnected) {
    await producer.connect();
    producerConnected = true;
  }
}

function normalizeDecision(decision) {
  if (!decision) {
    return null;
  }

  const normalizedDecision = String(decision).toLowerCase();

  if (!["approve", "reject"].includes(normalizedDecision)) {
    return null;
  }

  return normalizedDecision;
}

function buildRemediationPlan({
  decision,
  cloudProvider,
  action,
  resourceType,
  targetResource,
  riskLevel,
}) {
  return {
    provider: cloudProvider || "azure",
    action: action || "enforcePQCTls1_3",
    resourceType: resourceType || "appService",
    resourceName: targetResource || "unknown-resource",
    steps:
      decision === "approve"
        ? [
            "Review the remediation request and confirm it matches policy.",
            "Confirm the target resource and issue type are correct.",
            "Approve simulated execution from the dashboard.",
          ]
        : [
            "Review the remediation request and identify why it should not proceed.",
            "Reject the remediation decision from the dashboard.",
          ],
    riskLevel: riskLevel || "critical",
    requiresApproval: true,
  };
}

async function sendApprovalDecision(req, res, decisionFromRoute = null) {
  try {
    const decision = normalizeDecision(decisionFromRoute || req.body.decision);

    const {
      approvalId,
      remediationId,
      threatId,
      targetResource,
      resourceType,
      cloudProvider,
      issueType,
      action,
      riskLevel,
      decidedBy,
      reason,
    } = req.body;

    if (!decision) {
      return res.status(400).json({
        success: false,
        message: 'Decision must be either "approve" or "reject".',
      });
    }

    if (!remediationId) {
      return res.status(400).json({
        success: false,
        message: "remediationId is required.",
      });
    }

    await ensureProducerConnected();

    const decisionPayload = {
      decisionId: `decision-${Date.now()}`,
      approvalId: approvalId || `manual-approval-${Date.now()}`,
      remediationId,
      threatId: threatId || "unknown-threat",
      targetResource: targetResource || "unknown-resource",
      resourceType: resourceType || "unknown-resource-type",
      cloudProvider: cloudProvider || "unknown-cloud",
      issueType: issueType || "unknown-issue",
      action: action || "unknown-action",
      executionMode: "simulate",
      decision,
      decidedBy: decidedBy || "dashboard-reviewer",
      decidedAt: new Date().toISOString(),
      reason:
        reason ||
        (decision === "approve"
          ? "Reviewer approved the remediation from the dashboard."
          : "Reviewer rejected the remediation from the dashboard."),
      remediationPlan: buildRemediationPlan({
        decision,
        cloudProvider,
        action,
        resourceType,
        targetResource,
        riskLevel,
      }),
    };

    await producer.send({
      topic: process.env.KAFKA_APPROVAL_DECISIONS_TOPIC,
      messages: [
        {
          key: remediationId,
          value: JSON.stringify(decisionPayload),
        },
      ],
    });

    return res.status(200).json({
      success: true,
      message: `Remediation ${decision} decision sent successfully.`,
      decision: decisionPayload,
    });
  } catch (error) {
    console.error("Approval decision API error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to send approval decision.",
      error: error.message,
    });
  }
}

router.post("/decision", async (req, res) => {
  return sendApprovalDecision(req, res);
});

router.post("/:decision", async (req, res) => {
  return sendApprovalDecision(req, res, req.params.decision);
});

module.exports = router;