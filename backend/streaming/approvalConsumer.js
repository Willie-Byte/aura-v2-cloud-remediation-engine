require("dotenv").config({ path: __dirname + "/.env" });
const kafka = require("./kafkaClient");
const ApprovalRequest = require("../models/ApprovalRequest");
const { connectStreamingDb } = require("./streamingDb");

const consumer = kafka.consumer({ groupId: "aura-v2-approval-group" });

function getKafkaMetadata({ topic, partition, message }) {
  return {
    topic,
    partition,
    offset: message.offset,
    key: message.key?.toString() || "",
  };
}

function getQueuedAt(approvalRequest) {
  return (
    approvalRequest.queuedAt ||
    approvalRequest.timestamp ||
    approvalRequest.createdAt ||
    null
  );
}

async function persistApprovalRequest({
  topic,
  partition,
  message,
  approvalRequest,
}) {
  const kafkaMetadata = getKafkaMetadata({ topic, partition, message });

  try {
    await ApprovalRequest.create({
      approvalId: approvalRequest.approvalId || `approval-${Date.now()}`,
      remediationId: approvalRequest.remediationId || "unknown-remediation",
      threatId: approvalRequest.threatId || "unknown-threat",
      status: approvalRequest.status || "awaiting_approval",
      reason: approvalRequest.reason || "human_approval_required",
      targetResource: approvalRequest.targetResource || "unknown-resource",
      resourceType: approvalRequest.resourceType || "unknown-resource-type",
      cloudProvider: approvalRequest.cloudProvider || "unknown-cloud",
      issueType: approvalRequest.issueType || "unknown-issue",
      action: approvalRequest.action || "unknown-action",
      executionMode: approvalRequest.executionMode || "simulate",
      queuedAt: getQueuedAt(approvalRequest)
        ? new Date(getQueuedAt(approvalRequest))
        : null,
      payload: approvalRequest,
      kafka: kafkaMetadata,
    });

    console.log("Approval request persisted to MongoDB.");
  } catch (error) {
    if (error.code === 11000) {
      console.log(
        `Approval request already persisted for ${topic}[${partition}] offset ${message.offset}.`
      );
      return;
    }

    throw error;
  }
}

async function runApprovalConsumer() {
  try {
    await connectStreamingDb();

    await consumer.connect();

    console.log("Approval consumer connected. Waiting for approval requests...");

    await consumer.subscribe({
      topic: process.env.KAFKA_APPROVAL_TOPIC,
      fromBeginning: false,
    });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        let approvalRequest;

        try {
          approvalRequest = JSON.parse(message.value.toString());
        } catch (error) {
          console.error("Failed to parse approval request:", error.message);
          return;
        }

        console.log("\nApproval request received");
        console.log("Topic:", topic);
        console.log("Partition:", partition);
        console.log("Payload:", approvalRequest);

        await persistApprovalRequest({
          topic,
          partition,
          message,
          approvalRequest,
        });
      },
    });
  } catch (error) {
    console.error("Approval consumer error:", error.message);
  }
}

runApprovalConsumer();