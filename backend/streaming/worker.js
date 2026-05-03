require("dotenv").config({ path: __dirname + "/.env" });
const kafka = require("./kafkaClient");
const { validateRemediationCommand } = require("./validator");
const { publishAuditEvent } = require("./auditProducer");

const consumer = kafka.consumer({ groupId: "aura-v2-worker-group" });
const producer = kafka.producer();

const processedRemediationIds = new Set();

async function publishExecutionResult(command, status, details = {}) {
  const resultPayload = {
    resultId: `result-${Date.now()}`,
    remediationId: command.remediationId || "unknown-remediation",
    threatId: command.threatId || "unknown-threat",
    targetResource: command.targetResource || "unknown-resource",
    resourceType: command.resourceType || "unknown-resource-type",
    cloudProvider: command.cloudProvider || "unknown-cloud",
    issueType: command.issueType || "unknown-issue",
    executionMode: command.executionMode || "unknown",
    status,
    timestamp: new Date().toISOString(),
    remediationPlan: command.remediationPlan || null,
    details,
  };

  await producer.send({
    topic: process.env.KAFKA_RESULTS_TOPIC,
    messages: [{ value: JSON.stringify(resultPayload) }],
  });

  console.log("Execution result published.");
  console.log(resultPayload);
}

async function publishToDlq(command, errors) {
  const dlqPayload = {
    failedAt: new Date().toISOString(),
    reason: "validation_failed",
    errors,
    originalCommand: command,
  };

  await producer.send({
    topic: process.env.KAFKA_DLQ_TOPIC,
    messages: [{ value: JSON.stringify(dlqPayload) }],
  });

  console.log("Command sent to DLQ.");
  console.log(dlqPayload);

  await publishAuditEvent("REMEDIATION_REJECTED_TO_DLQ", dlqPayload);

  await publishExecutionResult(command, "rejected", {
    reason: "validation_failed",
    errors,
    message: "Remediation command failed validation and was sent to the DLQ.",
  });
}

async function publishToApprovalQueue(command) {
  const approvalPayload = {
    approvalId: `approval-${Date.now()}`,
    queuedAt: new Date().toISOString(),
    status: "awaiting_approval",
    reason: "human_approval_required",
    remediationId: command.remediationId,
    threatId: command.threatId,
    targetResource: command.targetResource,
    resourceType: command.resourceType,
    cloudProvider: command.cloudProvider,
    issueType: command.issueType,
    action: command.action,
    executionMode: command.executionMode,
    remediationPlan: command.remediationPlan || null,
    originalCommand: command,
  };

  await producer.send({
    topic: process.env.KAFKA_APPROVAL_TOPIC,
    messages: [{ value: JSON.stringify(approvalPayload) }],
  });

  console.log("Command sent to approval queue.");
  console.log(approvalPayload);

  await publishAuditEvent("REMEDIATION_AWAITING_APPROVAL", approvalPayload);

  await publishExecutionResult(command, "awaiting_approval", {
    reason: "human_approval_required",
    message:
      "Remediation command requires human approval and was sent to the approval queue.",
    riskLevel: command.remediationPlan?.riskLevel || "unknown",
    requiresApproval: command.remediationPlan?.requiresApproval === true,
  });
}

function shouldRequireApproval(command) {
  return command.remediationPlan?.requiresApproval === true;
}

function simulateExecution(command) {
  console.log("Validation passed.");
  console.log(`Execution mode: ${command.executionMode}`);
  console.log(`Simulated execution for resource: ${command.targetResource}`);
  console.log(`Resource type: ${command.resourceType}`);
  console.log(`Risk level: ${command.remediationPlan?.riskLevel || "unknown"}`);
  console.log(
    `Requires approval: ${
      command.remediationPlan?.requiresApproval === true ? "yes" : "no"
    }`
  );
  console.log(`Execution recorded for remediationId: ${command.remediationId}`);
}

async function runWorker() {
  try {
    await consumer.connect();
    await producer.connect();

    console.log("Worker connected. Waiting for remediation commands...");

    await consumer.subscribe({
      topic: process.env.KAFKA_REMEDIATION_TOPIC,
      fromBeginning: false,
    });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const command = JSON.parse(message.value.toString());

        console.log("\nRemediation command received by worker");
        console.log("Topic:", topic);
        console.log("Partition:", partition);
        console.log("Payload:", command);

        await publishAuditEvent("REMEDIATION_COMMAND_RECEIVED", {
          topic,
          partition,
          command,
        });

        const validation = validateRemediationCommand(command);

        if (!validation.valid) {
          console.log("Validation failed. Command rejected.");
          console.log("Errors:", validation.errors);

          await publishToDlq(command, validation.errors);
          return;
        }

        if (processedRemediationIds.has(command.remediationId)) {
          console.log(
            `Duplicate remediation detected. Skipping execution for ${command.remediationId}.`
          );

          await publishAuditEvent("REMEDIATION_DUPLICATE_SKIPPED", {
            remediationId: command.remediationId,
            command,
          });

          await publishExecutionResult(command, "skipped_duplicate", {
            message: "Duplicate remediation command was skipped.",
          });

          return;
        }

        processedRemediationIds.add(command.remediationId);

        if (shouldRequireApproval(command)) {
          console.log("Validation passed.");
          console.log("Human approval required. Sending to approval queue.");
          console.log(`Resource: ${command.targetResource}`);
          console.log(`Risk level: ${command.remediationPlan?.riskLevel || "unknown"}`);

          await publishToApprovalQueue(command);
          return;
        }

        simulateExecution(command);

        await publishAuditEvent("REMEDIATION_EXECUTED", {
          remediationId: command.remediationId,
          executionMode: command.executionMode,
          remediationPlan: command.remediationPlan,
          command,
        });

        await publishExecutionResult(command, "executed", {
          message: "Simulated remediation executed successfully.",
          riskLevel: command.remediationPlan?.riskLevel || "unknown",
          requiresApproval: command.remediationPlan?.requiresApproval === true,
        });
      },
    });
  } catch (error) {
    console.error("Worker error:", error.message);
  }
}

runWorker();