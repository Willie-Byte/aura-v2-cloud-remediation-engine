require("dotenv").config({ path: __dirname + "/.env" });

const kafka = require("./kafkaClient");
const {
  addAuditEvent,
  addExecutionResult,
} = require("./streamState");

const auditTopic = process.env.KAFKA_AUDIT_TOPIC || "audit-log";
const resultsTopic = process.env.KAFKA_RESULTS_TOPIC || "execution-results";

const auditConsumer = kafka.consumer({
  groupId: "aura-v2-bridge-audit-group",
});

const resultConsumer = kafka.consumer({
  groupId: "aura-v2-bridge-results-group",
});

let bridgeStarted = false;

async function startStreamBridge() {
  if (bridgeStarted) {
    console.log("Aura V2 stream bridge already started.");
    return;
  }

  bridgeStarted = true;

  try {
    console.log("Starting Aura V2 stream bridge...");
    console.log(`Bridge audit topic: ${auditTopic}`);
    console.log(`Bridge results topic: ${resultsTopic}`);

    await auditConsumer.connect();
    console.log("Bridge audit consumer connected.");

    await resultConsumer.connect();
    console.log("Bridge results consumer connected.");

    await auditConsumer.subscribe({
      topic: auditTopic,
      fromBeginning: false,
    });

    await resultConsumer.subscribe({
      topic: resultsTopic,
      fromBeginning: false,
    });

    await auditConsumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const auditEvent = JSON.parse(message.value.toString());
          addAuditEvent(auditEvent);

          console.log("[StreamBridge] Audit event cached:", {
            topic,
            partition,
            eventType: auditEvent.eventType,
            eventId: auditEvent.eventId,
            timestamp: auditEvent.timestamp,
          });
        } catch (error) {
          console.error("[StreamBridge] Failed to cache audit event:", error.message);
        }
      },
    });

    await resultConsumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const resultEvent = JSON.parse(message.value.toString());
          addExecutionResult(resultEvent);

          console.log("[StreamBridge] Execution result cached:", {
            topic,
            partition,
            resultId: resultEvent.resultId,
            remediationId: resultEvent.remediationId,
            threatId: resultEvent.threatId,
            status: resultEvent.status,
          });
        } catch (error) {
          console.error("[StreamBridge] Failed to cache execution result:", error.message);
        }
      },
    });

    console.log("Aura V2 stream bridge started.");
  } catch (error) {
    bridgeStarted = false;
    console.error("Failed to start stream bridge:", error);
  }
}

module.exports = {
  startStreamBridge,
};