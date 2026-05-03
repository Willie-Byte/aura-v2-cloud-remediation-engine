require("dotenv").config({ path: __dirname + "/.env" });
const kafka = require("./kafkaClient");

const consumer = kafka.consumer({ groupId: "aura-v2-audit-group" });

async function runAuditConsumer() {
  try {
    await consumer.connect();
    console.log("Audit consumer connected. Waiting for audit events...");

    await consumer.subscribe({
      topic: process.env.KAFKA_AUDIT_TOPIC,
      fromBeginning: false,
    });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const auditEvent = JSON.parse(message.value.toString());

        console.log("\nAudit event received");
        console.log("Topic:", topic);
        console.log("Partition:", partition);
        console.log("Payload:", auditEvent);
      },
    });
  } catch (error) {
    console.error("Audit consumer error:", error.message);
  }
}

runAuditConsumer();