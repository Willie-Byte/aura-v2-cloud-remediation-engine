require("dotenv").config({ path: __dirname + "/.env" });
const kafka = require("./kafkaClient");
const StreamingAuditEvent = require("../models/StreamingAuditEvent");
const { connectStreamingDb } = require("./streamingDb");

const consumer = kafka.consumer({ groupId: "aura-v2-audit-group" });

function getKafkaMetadata({ topic, partition, message }) {
  return {
    topic,
    partition,
    offset: message.offset,
    key: message.key?.toString() || "",
  };
}

function getAuditEventType(auditEvent) {
  return (
    auditEvent.eventType ||
    auditEvent.type ||
    auditEvent.action ||
    auditEvent.auditType ||
    "UNKNOWN_AUDIT_EVENT"
  );
}

async function persistAuditEvent({ topic, partition, message, auditEvent }) {
  const kafkaMetadata = getKafkaMetadata({ topic, partition, message });

  try {
    await StreamingAuditEvent.create({
      eventType: getAuditEventType(auditEvent),
      topic: kafkaMetadata.topic,
      partition: kafkaMetadata.partition,
      offset: kafkaMetadata.offset,
      key: kafkaMetadata.key,
      payload: auditEvent,
    });

    console.log("Audit event persisted to MongoDB.");
  } catch (error) {
    if (error.code === 11000) {
      console.log(
        `Audit event already persisted for ${topic}[${partition}] offset ${message.offset}.`
      );
      return;
    }

    throw error;
  }
}

async function runAuditConsumer() {
  try {
    await connectStreamingDb();

    await consumer.connect();
    console.log("Audit consumer connected. Waiting for audit events...");

    await consumer.subscribe({
      topic: process.env.KAFKA_AUDIT_TOPIC,
      fromBeginning: false,
    });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        let auditEvent;

        try {
          auditEvent = JSON.parse(message.value.toString());
        } catch (error) {
          console.error("Failed to parse audit event:", error.message);
          return;
        }

        console.log("\nAudit event received");
        console.log("Topic:", topic);
        console.log("Partition:", partition);
        console.log("Payload:", auditEvent);

        await persistAuditEvent({ topic, partition, message, auditEvent });
      },
    });
  } catch (error) {
    console.error("Audit consumer error:", error.message);
  }
}

runAuditConsumer();