require("dotenv").config({ path: __dirname + "/.env" });
const kafka = require("./kafkaClient");

const consumer = kafka.consumer({ groupId: "aura-v2-dlq-group" });

async function runDlqConsumer() {
  try {
    await consumer.connect();
    console.log("DLQ consumer connected. Waiting for rejected commands...");

    await consumer.subscribe({
      topic: process.env.KAFKA_DLQ_TOPIC,
      fromBeginning: false,
    });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const payload = JSON.parse(message.value.toString());

        console.log("\nDLQ event received");
        console.log("Topic:", topic);
        console.log("Partition:", partition);
        console.log("Payload:", payload);
      },
    });
  } catch (error) {
    console.error("DLQ consumer error:", error.message);
  }
}

runDlqConsumer();