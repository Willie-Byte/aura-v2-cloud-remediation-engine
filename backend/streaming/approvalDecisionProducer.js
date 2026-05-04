require("dotenv").config({ path: __dirname + "/.env" });
const kafka = require("./kafkaClient");
const { getPolicyForIssueType, getExpectedAction } = require("./remediationPolicy");

const producer = kafka.producer();

function getDecisionFromArgs() {
  const decision = process.argv[2];

  if (!decision) {
    return "approve";
  }

  if (!["approve", "reject"].includes(decision)) {
    throw new Error('Decision must be either "approve" or "reject".');
  }

  return decision;
}

function getArg(index, fallback) {
  return process.argv[index] || fallback;
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

  if (issueType === "unauthorizedPodExec") {
    return `Investigate suspicious live eBPF process execution on ${cloudProvider} ${resourceType} ${targetResource}. Review the process evidence, confirm whether access was authorized, inspect Kubernetes RBAC, and recommend safe least-privilege controls.`;
  }

  return `Safely perform action ${action} on ${cloudProvider} ${resourceType} ${targetResource}.`;
}

function buildOriginalRemediationSteps({ issueType, targetResource }) {
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

  if (issueType === "unauthorizedPodExec") {
    return [
      `Review the live eBPF process execution evidence for ${targetResource}.`,
      "Confirm whether the pod exec activity was authorized by an approved operator or automation.",
      "Inspect Kubernetes RBAC and workload access paths, then recommend least-privilege restrictions in simulate mode.",
    ];
  }

  return [
    "Review the remediation request and confirm it matches policy.",
    "Confirm the target resource and issue type are correct.",
    "Approve simulated execution for local pipeline testing.",
  ];
}

function buildRemediationPlan({
  decision,
  cloudProvider,
  action,
  resourceType,
  targetResource,
  issueType,
  riskLevel,
}) {
  const policy = getPolicyForIssueType(issueType);
  const expectedAction = getExpectedAction(issueType);

  const finalAction = action || expectedAction || "unknown-action";
  const finalRiskLevel = riskLevel || policy?.riskLevel || "high";

  return {
    provider: cloudProvider || "azure",
    action: finalAction,
    resourceType: resourceType || policy?.allowedResourceTypes?.[0] || "unknown-resource-type",
    resourceName: targetResource || "unknown-resource",
    steps:
      decision === "approve"
        ? buildOriginalRemediationSteps({
            issueType,
            targetResource,
          })
        : [
            "Review the remediation request and identify why it should not proceed.",
            "Reject the remediation decision for local pipeline testing.",
          ],
    riskLevel: finalRiskLevel,
    requiresApproval: true,
  };
}

function buildOriginalCommand({
  remediationId,
  threatId,
  cloudProvider,
  resourceType,
  targetResource,
  issueType,
  action,
  riskLevel,
  remediationPlan,
}) {
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
    generatedCode: buildGeneratedCode({
      issueType,
      action,
      targetResource,
      resourceType,
      cloudProvider,
    }),
    remediationPlan,
    agenticValidation: {
      enabled: true,
      auditStatus: "PASS",
      auditNotes:
        "Local demo producer carried forward an AI-audited remediation command for approval testing.",
      validatedAt: new Date().toISOString(),
    },
  };
}

async function sendApprovalDecision() {
  try {
    const decision = getDecisionFromArgs();

    const remediationId = getArg(3, "latest-remediation-from-demo");
    const threatId = getArg(4, "manual-threat-demo");
    const approvalId = getArg(5, `manual-approval-${Date.now()}`);
    const targetResource = getArg(6, "prod-nsg-ssh-001");
    const resourceType = getArg(7, "networkSecurityGroup");
    const cloudProvider = getArg(8, "azure");
    const issueType = getArg(9, "publicSSHAccess");
    const expectedAction = getExpectedAction(issueType);
    const action = getArg(10, expectedAction || "restrictSSHAccess");
    const riskLevel = getArg(11, getPolicyForIssueType(issueType)?.riskLevel || "high");

    await producer.connect();
    console.log("Approval decision producer connected to Kafka.");

    const remediationPlan = buildRemediationPlan({
      decision,
      cloudProvider,
      action,
      resourceType,
      targetResource,
      issueType,
      riskLevel,
    });

    const originalCommand = buildOriginalCommand({
      remediationId,
      threatId,
      cloudProvider,
      resourceType,
      targetResource,
      issueType,
      action,
      riskLevel,
      remediationPlan,
    });

    const decisionPayload = {
      decisionId: `decision-${Date.now()}`,
      approvalId,
      remediationId,
      threatId,
      targetResource,
      resourceType,
      cloudProvider,
      issueType,
      action,
      executionMode: "simulate",
      decision,
      decidedBy: "local-demo-reviewer",
      decidedAt: new Date().toISOString(),
      reason:
        decision === "approve"
          ? "Reviewer approved the simulated remediation for testing."
          : "Reviewer rejected the simulated remediation for testing.",
      generatedCode: originalCommand.generatedCode,
      remediationPlan,
      agenticValidation: originalCommand.agenticValidation,
      originalCommand,
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

    console.log("Approval decision sent successfully.");
    console.log(decisionPayload);
  } catch (error) {
    console.error("Approval decision producer error:", error.message);
  } finally {
    await producer.disconnect();
  }
}

sendApprovalDecision();