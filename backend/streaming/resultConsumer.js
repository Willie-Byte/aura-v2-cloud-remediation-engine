require("dotenv").config({ path: __dirname + "/.env" });
const kafka = require("./kafkaClient");
const ExecutionResult = require("../models/ExecutionResult");
const { connectStreamingDb } = require("./streamingDb");

const consumer = kafka.consumer({ groupId: "aura-v2-results-group" });

function getKafkaMetadata({ topic, partition, message }) {
  return {
    topic,
    partition,
    offset: message.offset,
    key: message.key?.toString() || "",
  };
}

function getResultReason(result) {
  return (
    result.reason ||
    result.details?.reason ||
    result.approvalDecision?.reason ||
    ""
  );
}

async function persistExecutionResult({ topic, partition, message, result }) {
  const kafkaMetadata = getKafkaMetadata({ topic, partition, message });

  try {
    await ExecutionResult.create({
      resultId: result.resultId || `result-${Date.now()}`,
      remediationId: result.remediationId || "unknown-remediation",
      threatId: result.threatId || "unknown-threat",
      targetResource: result.targetResource || "unknown-resource",
      resourceType: result.resourceType || "unknown-resource-type",
      cloudProvider: result.cloudProvider || "unknown-cloud",
      issueType: result.issueType || "unknown-issue",
      action: result.action || "unknown-action",
      executionMode: result.executionMode || "unknown",
      status: result.status || "unknown",
      reason: getResultReason(result),
      resultTimestamp: result.timestamp ? new Date(result.timestamp) : null,
      payload: result,
      kafka: kafkaMetadata,
    });

    console.log("Execution result persisted to MongoDB.");
  } catch (error) {
    if (error.code === 11000) {
      console.log(
        `Execution result already persisted for ${topic}[${partition}] offset ${message.offset}.`
      );
      return;
    }

    throw error;
  }
}

async function runResultConsumer() {
  try {
    await connectStreamingDb();

    await consumer.connect();
    console.log("Result consumer connected. Waiting for execution results...");

    await consumer.subscribe({
      topic: process.env.KAFKA_RESULTS_TOPIC,
      fromBeginning: false,
    });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        let result;

        try {
          result = JSON.parse(message.value.toString());
        } catch (error) {
          console.error("Failed to parse execution result:", error.message);
          return;
        }

        console.log("\nExecution result received");
        console.log("Topic:", topic);
        console.log("Partition:", partition);
        console.log("Payload:", result);

        await persistExecutionResult({ topic, partition, message, result });
      },
    });
  } catch (error) {
    console.error("Result consumer error:", error.message);
  }
}

runResultConsumer();