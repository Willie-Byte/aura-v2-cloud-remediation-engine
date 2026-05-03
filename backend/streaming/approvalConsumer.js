require("dotenv").config({ path: __dirname + "/.env" });
const kafka = require("./kafkaClient");

const consumer = kafka.consumer({ groupId: "aura-v2-approval-group" });

async function runApprovalConsumer() {
  try {
    await consumer.connect();

    console.log("Approval consumer connected. Waiting for approval requests...");

    await consumer.subscribe({
      topic: process.env.KAFKA_APPROVAL_TOPIC,
      fromBeginning: false,
    });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const approvalRequest = JSON.parse(message.value.toString());

        console.log("\nApproval request received");
        console.log("Topic:", topic);
        console.log("Partition:", partition);
        console.log("Payload:", approvalRequest);
      },
    });
  } catch (error) {
    console.error("Approval consumer error:", error.message);
  }
}

runApprovalConsumer();