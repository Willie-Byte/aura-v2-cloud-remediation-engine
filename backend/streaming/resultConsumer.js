require("dotenv").config({ path: __dirname + "/.env" });
const kafka = require("./kafkaClient");

const consumer = kafka.consumer({ groupId: "aura-v2-results-group" });

async function runResultConsumer() {
  try {
    await consumer.connect();
    console.log("Result consumer connected. Waiting for execution results...");

    await consumer.subscribe({
      topic: process.env.KAFKA_RESULTS_TOPIC,
      fromBeginning: false,
    });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const result = JSON.parse(message.value.toString());

        console.log("\nExecution result received");
        console.log("Topic:", topic);
        console.log("Partition:", partition);
        console.log("Payload:", result);
      },
    });
  } catch (error) {
    console.error("Result consumer error:", error.message);
  }
}

runResultConsumer();