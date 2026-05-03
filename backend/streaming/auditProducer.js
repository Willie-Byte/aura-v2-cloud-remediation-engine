const kafka = require("./kafkaClient");

const producer = kafka.producer();

let connected = false;

async function ensureConnected() {
  if (!connected) {
    await producer.connect();
    connected = true;
    console.log("Audit producer connected.");
  }
}

async function publishAuditEvent(eventType, payload) {
  await ensureConnected();

  const auditEvent = {
    eventId: `audit-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    eventType,
    timestamp: new Date().toISOString(),
    payload,
  };

  await producer.send({
    topic: process.env.KAFKA_AUDIT_TOPIC,
    messages: [{ value: JSON.stringify(auditEvent) }],
  });

  console.log(`Audit event published: ${eventType}`);
}

module.exports = {
  publishAuditEvent,
};