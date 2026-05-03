require("dotenv").config({ path: __dirname + "/.env" });
const kafka = require("./kafkaClient");
const { publishAuditEvent } = require("./auditProducer");

const consumer = kafka.consumer({ groupId: "aura-v2-approval-decisions-group" });
const producer = kafka.producer();

function getCanonicalRemediationPlan(decisionPayload) {
  return (
    decisionPayload.originalCommand?.remediationPlan ||
    decisionPayload.remediationPlan ||
    null
  );
}

function getCanonicalAgenticValidation(decisionPayload) {
  return (
    decisionPayload.originalCommand?.agenticValidation ||
    decisionPayload.agenticValidation ||
    null
  );
}

function getCanonicalGeneratedCode(decisionPayload) {
  return (
    decisionPayload.originalCommand?.generatedCode ||
    decisionPayload.generatedCode ||
    null
  );
}

function getCanonicalAction(decisionPayload) {
  return (
    decisionPayload.originalCommand?.action ||
    decisionPayload.action ||
    "unknown-action"
  );
}

function getCanonicalExecutionMode(decisionPayload) {
  return (
    decisionPayload.originalCommand?.executionMode ||
    decisionPayload.executionMode ||
    "simulate"
  );
}

function getPlanSource(decisionPayload) {
  if (decisionPayload.originalCommand?.remediationPlan) {
    return "original_ai_generated_remediation_plan";
  }

  if (decisionPayload.remediationPlan) {
    return "approval_decision_remediation_plan";
  }

  return "missing_remediation_plan";
}

async function publishExecutionResultFromDecision(
  decisionPayload,
  status,
  details = {}
) {
  const remediationPlan = getCanonicalRemediationPlan(decisionPayload);
  const agenticValidation = getCanonicalAgenticValidation(decisionPayload);
  const generatedCode = getCanonicalGeneratedCode(decisionPayload);
  const action = getCanonicalAction(decisionPayload);
  const executionMode = getCanonicalExecutionMode(decisionPayload);
  const planSource = getPlanSource(decisionPayload);

  const resultPayload = {
    resultId: `result-${Date.now()}`,
    remediationId: decisionPayload.remediationId || "unknown-remediation",
    threatId: decisionPayload.threatId || "unknown-threat",
    targetResource: decisionPayload.targetResource || "unknown-resource",
    resourceType: decisionPayload.resourceType || "unknown-resource-type",
    cloudProvider: decisionPayload.cloudProvider || "unknown-cloud",
    issueType: decisionPayload.issueType || "unknown-issue",
    action,
    executionMode,
    status,
    timestamp: new Date().toISOString(),

    generatedCode,
    remediationPlan,
    agenticValidation,
    originalCommand: decisionPayload.originalCommand || null,

    approvalDecision: {
      decisionId: decisionPayload.decisionId || "unknown-decision",
      approvalId: decisionPayload.approvalId || "unknown-approval",
      decision: decisionPayload.decision || "unknown",
      decidedBy: decisionPayload.decidedBy || "unknown-reviewer",
      decidedAt: decisionPayload.decidedAt || new Date().toISOString(),
      reason: decisionPayload.reason || "No reason provided.",
    },

    details: {
      ...details,
      planSource,
      preservedOriginalPlan: Boolean(
        decisionPayload.originalCommand?.remediationPlan
      ),
      preservedAgenticValidation: Boolean(agenticValidation),
      preservedGeneratedCode: Boolean(generatedCode),
    },
  };

  await producer.send({
    topic: process.env.KAFKA_RESULTS_TOPIC,
    messages: [
      {
        key: resultPayload.remediationId,
        value: JSON.stringify(resultPayload),
      },
    ],
  });

  console.log("Approval decision execution result published with preserved context.");
  console.log(resultPayload);
}

function validateApprovalDecision(decisionPayload) {
  const errors = [];

  if (!decisionPayload || typeof decisionPayload !== "object") {
    return {
      valid: false,
      errors: ["Approval decision payload must be a valid object."],
    };
  }

  if (!decisionPayload.decisionId) {
    errors.push("Missing decisionId.");
  }

  if (!decisionPayload.approvalId) {
    errors.push("Missing approvalId.");
  }

  if (!decisionPayload.remediationId) {
    errors.push("Missing remediationId.");
  }

  if (!decisionPayload.decision) {
    errors.push("Missing decision.");
  } else if (!["approve", "reject"].includes(decisionPayload.decision)) {
    errors.push('Decision must be either "approve" or "reject".');
  }

  if (!decisionPayload.decidedBy) {
    errors.push("Missing decidedBy.");
  }

  if (!decisionPayload.decidedAt) {
    errors.push("Missing decidedAt.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

async function handleApprovalDecision(decisionPayload) {
  const validation = validateApprovalDecision(decisionPayload);

  if (!validation.valid) {
    console.log("Approval decision validation failed.");
    console.log("Errors:", validation.errors);

    await publishAuditEvent("APPROVAL_DECISION_REJECTED", {
      reason: "validation_failed",
      errors: validation.errors,
      decisionPayload,
    });

    await publishExecutionResultFromDecision(decisionPayload, "rejected", {
      reason: "approval_decision_validation_failed",
      errors: validation.errors,
      message: "Approval decision failed validation.",
    });

    return;
  }

  if (decisionPayload.decision === "reject") {
    console.log("Human reviewer rejected remediation.");
    console.log(`Remediation ID: ${decisionPayload.remediationId}`);

    await publishAuditEvent("REMEDIATION_REJECTED_BY_HUMAN", {
      decisionPayload,
      preservedOriginalPlan: Boolean(
        decisionPayload.originalCommand?.remediationPlan
      ),
      preservedAgenticValidation: Boolean(
        getCanonicalAgenticValidation(decisionPayload)
      ),
    });

    await publishExecutionResultFromDecision(decisionPayload, "rejected", {
      reason: "human_rejected",
      message: "Human reviewer rejected the remediation.",
    });

    return;
  }

  console.log("Human reviewer approved remediation.");
  console.log(`Remediation ID: ${decisionPayload.remediationId}`);
  console.log("Final execution is still simulated for safety.");

  await publishAuditEvent("REMEDIATION_APPROVED_BY_HUMAN", {
    decisionPayload,
    preservedOriginalPlan: Boolean(
      decisionPayload.originalCommand?.remediationPlan
    ),
    preservedAgenticValidation: Boolean(
      getCanonicalAgenticValidation(decisionPayload)
    ),
  });

  await publishExecutionResultFromDecision(decisionPayload, "executed", {
    reason: "human_approved",
    message:
      "Human reviewer approved the remediation. Final execution was simulated successfully.",
  });
}

async function runApprovalDecisionConsumer() {
  try {
    await consumer.connect();
    await producer.connect();

    console.log(
      "Approval decision consumer connected. Waiting for decisions..."
    );
    console.log(
      "Approval decision consumer context preservation is ENABLED."
    );

    await consumer.subscribe({
      topic: process.env.KAFKA_APPROVAL_DECISIONS_TOPIC,
      fromBeginning: false,
    });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        let decisionPayload;

        try {
          decisionPayload = JSON.parse(message.value.toString());
        } catch (error) {
          console.error(
            "Failed to parse approval decision payload:",
            error.message
          );

          await publishAuditEvent("APPROVAL_DECISION_PARSE_FAILED", {
            topic,
            partition,
            error: error.message,
            rawValue: message.value?.toString(),
          });

          return;
        }

        console.log("\nApproval decision received");
        console.log("Topic:", topic);
        console.log("Partition:", partition);
        console.log("Payload:", decisionPayload);

        await publishAuditEvent("APPROVAL_DECISION_RECEIVED", {
          topic,
          partition,
          decisionPayload,
        });

        await handleApprovalDecision(decisionPayload);
      },
    });
  } catch (error) {
    console.error("Approval decision consumer error:", error.message);
  }
}

runApprovalDecisionConsumer();