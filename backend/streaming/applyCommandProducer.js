require("dotenv").config({ path: __dirname + "/.env" });
const kafka = require("./kafkaClient");

const producer = kafka.producer();

async function sendApplyCommand() {
  try {
    await producer.connect();
    console.log("Apply command producer connected to Kafka.");

    const applyCommand = {
      remediationId: `apply-rem-${Date.now()}`,
      threatId: `apply-threat-${Date.now()}`,
      action: "restrictSSHAccess",
      targetResource: "prod-nsg-ssh-001",
      resourceType: "networkSecurityGroup",
      cloudProvider: "azure",
      issueType: "publicSSHAccess",
      status: "pending",
      executionMode: "apply",
      generatedAt: new Date().toISOString(),
      generatedCode:
        "This command intentionally requests apply mode and should be rejected by the worker.",
      remediationPlan: {
        provider: "azure",
        action: "restrictSSHAccess",
        resourceType: "networkSecurityGroup",
        resourceName: "prod-nsg-ssh-001",
        steps: [
          "Restrict SSH access to trusted IP ranges.",
          "Verify public SSH access is removed.",
        ],
        riskLevel: "high",
        requiresApproval: true,
      },
    };

    await producer.send({
      topic: process.env.KAFKA_REMEDIATION_TOPIC,
      messages: [{ value: JSON.stringify(applyCommand) }],
    });

    console.log("Apply-mode remediation command sent successfully.");
    console.log(applyCommand);
  } catch (error) {
    console.error("Apply command producer error:", error.message);
  } finally {
    await producer.disconnect();
  }
}

sendApplyCommand();