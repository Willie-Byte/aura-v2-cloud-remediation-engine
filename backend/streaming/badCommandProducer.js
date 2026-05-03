require("dotenv").config({ path: __dirname + "/.env" });
const kafka = require("./kafkaClient");

const producer = kafka.producer();

async function sendBadCommand() {
  try {
    await producer.connect();
    console.log("Bad command producer connected to Kafka.");

    const badCommand = {
      remediationId: `bad-rem-${Date.now()}`,
      threatId: `bad-threat-${Date.now()}`,
      action: "disablePublicAccess",
      targetResource: "prod-nsg-ssh-001",
      resourceType: "networkSecurityGroup",
      cloudProvider: "azure",
      issueType: "publicSSHAccess",
      status: "pending",
      executionMode: "simulate",
      generatedAt: new Date().toISOString(),
      generatedCode:
        "This is an intentionally invalid command. It uses disablePublicAccess for a publicSSHAccess issue.",
      remediationPlan: {
        provider: "azure",
        action: "disablePublicAccess",
        resourceType: "networkSecurityGroup",
        resourceName: "prod-nsg-ssh-001",
        steps: [
          "This intentionally uses the wrong action for public SSH access.",
          "The validator should reject this command before execution.",
        ],
        riskLevel: "high",
        requiresApproval: true,
      },
    };

    await producer.send({
      topic: process.env.KAFKA_REMEDIATION_TOPIC,
      messages: [{ value: JSON.stringify(badCommand) }],
    });

    console.log("Bad remediation command sent successfully.");
    console.log(badCommand);
  } catch (error) {
    console.error("Bad command producer error:", error.message);
  } finally {
    await producer.disconnect();
  }
}

sendBadCommand();