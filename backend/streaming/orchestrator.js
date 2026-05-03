require("dotenv").config({ path: __dirname + "/.env" });
const kafka = require("./kafkaClient");
const { publishAuditEvent } = require("./auditProducer");
const { generateRemediationCommandFromAI } = require("./aiRemediationService");

const consumer = kafka.consumer({ groupId: "aura-v2-orchestrator-group" });
const producer = kafka.producer();

async function runOrchestrator() {
  try {
    await consumer.connect();
    await producer.connect();

    console.log("Orchestrator connected. Waiting for threat events...");

    await consumer.subscribe({
      topic: process.env.KAFKA_TOPIC,
      fromBeginning: false,
    });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const threat = JSON.parse(message.value.toString());

          console.log("\nThreat received by orchestrator");
          console.log("Topic:", topic);
          console.log("Partition:", partition);
          console.log("Payload:", threat);

          await publishAuditEvent("THREAT_RECEIVED", {
            topic,
            partition,
            threat,
          });

          const remediationCommand = await generateRemediationCommandFromAI(threat);

          await producer.send({
            topic: process.env.KAFKA_REMEDIATION_TOPIC,
            messages: [{ value: JSON.stringify(remediationCommand) }],
          });

          console.log("AI remediation command published:");
          console.log(remediationCommand);

          await publishAuditEvent("REMEDIATION_GENERATED", {
            remediationCommand,
            source: "ai",
          });
        } catch (error) {
          console.error("Failed to process threat in orchestrator:", error.message);

          await publishAuditEvent("REMEDIATION_GENERATION_FAILED", {
            error: error.message,
            rawMessage: message.value.toString(),
          });
        }
      },
    });
  } catch (error) {
    console.error("Orchestrator error:", error.message);
  }
}

runOrchestrator();