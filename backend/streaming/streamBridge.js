require("dotenv").config({ path: __dirname + "/.env" });
const kafka = require("./kafkaClient");
const {
  addAuditEvent,
  addExecutionResult,
} = require("./streamState");

const auditConsumer = kafka.consumer({ groupId: "aura-v2-bridge-audit-group" });
const resultConsumer = kafka.consumer({ groupId: "aura-v2-bridge-results-group" });

let bridgeStarted = false;

async function startStreamBridge() {
  if (bridgeStarted) {
    return;
  }

  bridgeStarted = true;

  try {
    await auditConsumer.connect();
    await resultConsumer.connect();

    await auditConsumer.subscribe({
      topic: process.env.KAFKA_AUDIT_TOPIC,
      fromBeginning: false,
    });

    await resultConsumer.subscribe({
      topic: process.env.KAFKA_RESULTS_TOPIC,
      fromBeginning: false,
    });

    await auditConsumer.run({
      eachMessage: async ({ message }) => {
        const auditEvent = JSON.parse(message.value.toString());
        addAuditEvent(auditEvent);
      },
    });

    await resultConsumer.run({
      eachMessage: async ({ message }) => {
        const resultEvent = JSON.parse(message.value.toString());
        addExecutionResult(resultEvent);
      },
    });

    console.log("Aura V2 stream bridge started.");
  } catch (error) {
    console.error("Failed to start stream bridge:", error.message);
  }
}

module.exports = {
  startStreamBridge,
};