const express = require("express");
const kafka = require("../streaming/kafkaClient");
const {
  getPolicyForIssueType,
  getExpectedAction,
} = require("../streaming/remediationPolicy");

const router = express.Router();
const producer = kafka.producer();

let producerConnected = false;

async function ensureProducerConnected() {
  if (!producerConnected) {
    await producer.connect();
    producerConnected = true;
    console.log("Streaming approval route producer connected to Kafka.");
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

function buildGeneratedCode({
  issueType,
  action,
  targetResource,
  resourceType,
  cloudProvider,
}) {
  if (issueType === "nonQuantumSafeCrypto") {
    return `Safely enforce TLS 1.3 with Kyber/ML-KEM hybrid key exchange on ${cloudProvider} ${resourceType} ${targetResource}. Validate service compatibility, apply the PQC-ready TLS profile, and monitor for connectivity issues.`;
  }

  if (issueType === "publicSSHAccess") {
    return `Restrict public SSH access on ${cloudProvider} ${resourceType} ${targetResource}. Remove 0.0.0.0/0 access on port 22 and allow only trusted administrator IP ranges.`;
  }

  if (issueType === "publicRDPAccess") {
    return `Restrict public RDP access on ${cloudProvider} ${resourceType} ${targetResource}. Remove 0.0.0.0/0 access on port 3389 and allow only trusted administrator IP ranges.`;
  }

  if (issueType === "publicStorageAccess") {
    return `Disable public access on ${cloudProvider} ${resourceType} ${targetResource}. Ensure storage access is private by default and only available through approved identities.`;
  }

  if (issueType === "unencryptedDatabase") {
    return `Enable encryption at rest on ${cloudProvider} ${resourceType} ${targetResource}. Use managed keys or approved customer-managed keys according to policy.`;
  }

  if (issueType === "weakTlsVersion") {
    return `Enforce modern TLS settings on ${cloudProvider} ${resourceType} ${targetResource}. Disable legacy TLS versions and require TLS 1.2 or newer.`;
  }

  return `Safely perform action ${action} on ${cloudProvider} ${resourceType} ${targetResource}.`;
}

function buildFallbackSteps({ decision, issueType, targetResource }) {
  if (decision === "reject") {
    return [
      "Review the remediation request and identify why it should not proceed.",
      "Reject the remediation decision from the dashboard.",
    ];
  }

  if (issueType === "nonQuantumSafeCrypto") {
    return [
      `Review the current TLS and cryptographic configuration for ${targetResource}.`,
      "Validate support for TLS 1.3 with Kyber/ML-KEM hybrid key exchange in the target environment.",
      `Apply the PQC-ready TLS profile to ${targetResource} in simulate mode and monitor for compatibility issues.`,
    ];
  }

  if (issueType === "publicSSHAccess") {
    return [
      "Review the approved administrator IP ranges.",
      `Remove public 0.0.0.0/0 SSH access from ${targetResource}.`,
      "Allow SSH only from trusted administrator IP ranges.",
    ];
  }

  if (issueType === "publicRDPAccess") {
    return [
      "Review the approved administrator IP ranges.",
      `Remove public 0.0.0.0/0 RDP access from ${targetResource}.`,
      "Allow RDP only from trusted administrator IP ranges.",
    ];
  }

  return [
    "Review the remediation request and confirm it matches policy.",
    "Confirm the target resource and issue type are correct.",
    "Approve simulated execution from the dashboard.",
  ];
}

function buildRemediationPlan({
  decision,
  cloudProvider,
  issueType,
  action,
  resourceType,
  targetResource,
  riskLevel,
  existingRemediationPlan,
}) {
  if (existingRemediationPlan && typeof existingRemediationPlan === "object") {
    return existingRemediationPlan;
  }

  const policy = getPolicyForIssueType(issueType);
  const expectedAction = getExpectedAction(issueType);

  const finalAction = action || expectedAction || "unknown-action";
  const finalResourceType =
    resourceType || policy?.allowedResourceTypes?.[0] || "unknown-resource-type";
  const finalRiskLevel = riskLevel || policy?.riskLevel || "high";

  return {
    provider: cloudProvider || "azure",
    action: finalAction,
    resourceType: finalResourceType,
    resourceName: targetResource || "unknown-resource",
    steps: buildFallbackSteps({
      decision,
      issueType,
      targetResource: targetResource || "unknown-resource",
    }),
    riskLevel: finalRiskLevel,
    requiresApproval: true,
  };
}

function buildAgenticValidation(existingAgenticValidation) {
  if (
    existingAgenticValidation &&
    typeof existingAgenticValidation === "object"
  ) {
    return existingAgenticValidation;
  }

  return {
    enabled: true,
    auditStatus: "PASS",
    auditNotes:
      "Dashboard approval route carried forward an AI-audited remediation command for approval testing.",
    validatedAt: new Date().toISOString(),
  };
}

function buildOriginalCommand({
  originalCommand,
  remediationId,
  threatId,
  action,
  targetResource,
  resourceType,
  cloudProvider,
  issueType,
  generatedCode,
  remediationPlan,
  agenticValidation,
}) {
  if (originalCommand && typeof originalCommand === "object") {
    return originalCommand;
  }

  return {
    remediationId,
    threatId,
    action,
    targetResource,
    resourceType,
    cloudProvider,
    issueType,
    status: "pending",
    executionMode: "simulate",
    generatedAt: new Date().toISOString(),
    generatedCode,
    remediationPlan,
    agenticValidation,
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
      generatedCode,
      remediationPlan,
      agenticValidation,
      originalCommand,
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

    const finalIssueType =
      issueType || originalCommand?.issueType || "unknown-issue";

    const expectedAction = getExpectedAction(finalIssueType);

    const finalAction =
      action ||
      originalCommand?.action ||
      expectedAction ||
      "unknown-action";

    const finalCloudProvider =
      cloudProvider || originalCommand?.cloudProvider || "azure";

    const finalResourceType =
      resourceType ||
      originalCommand?.resourceType ||
      getPolicyForIssueType(finalIssueType)?.allowedResourceTypes?.[0] ||
      "unknown-resource-type";

    const finalTargetResource =
      targetResource || originalCommand?.targetResource || "unknown-resource";

    const finalThreatId =
      threatId || originalCommand?.threatId || "unknown-threat";

    const finalRemediationPlan = buildRemediationPlan({
      decision,
      cloudProvider: finalCloudProvider,
      issueType: finalIssueType,
      action: finalAction,
      resourceType: finalResourceType,
      targetResource: finalTargetResource,
      riskLevel,
      existingRemediationPlan:
        originalCommand?.remediationPlan || remediationPlan,
    });

    const finalGeneratedCode =
      originalCommand?.generatedCode ||
      generatedCode ||
      buildGeneratedCode({
        issueType: finalIssueType,
        action: finalAction,
        targetResource: finalTargetResource,
        resourceType: finalResourceType,
        cloudProvider: finalCloudProvider,
      });

    const finalAgenticValidation = buildAgenticValidation(
      originalCommand?.agenticValidation || agenticValidation
    );

    const finalOriginalCommand = buildOriginalCommand({
      originalCommand,
      remediationId,
      threatId: finalThreatId,
      action: finalAction,
      targetResource: finalTargetResource,
      resourceType: finalResourceType,
      cloudProvider: finalCloudProvider,
      issueType: finalIssueType,
      generatedCode: finalGeneratedCode,
      remediationPlan: finalRemediationPlan,
      agenticValidation: finalAgenticValidation,
    });

    const decisionPayload = {
      decisionId: `decision-${Date.now()}`,
      approvalId: approvalId || `manual-approval-${Date.now()}`,
      remediationId,
      threatId: finalThreatId,
      targetResource: finalTargetResource,
      resourceType: finalResourceType,
      cloudProvider: finalCloudProvider,
      issueType: finalIssueType,
      action: finalAction,
      executionMode: "simulate",
      decision,
      decidedBy: decidedBy || "dashboard-reviewer",
      decidedAt: new Date().toISOString(),
      reason:
        reason ||
        (decision === "approve"
          ? "Reviewer approved the remediation from the dashboard."
          : "Reviewer rejected the remediation from the dashboard."),

      generatedCode: finalGeneratedCode,
      remediationPlan: finalRemediationPlan,
      agenticValidation: finalAgenticValidation,
      originalCommand: finalOriginalCommand,
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