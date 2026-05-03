require("dotenv").config({ path: __dirname + "/.env" });
const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "aura-v2-producer",
  brokers: [process.env.KAFKA_BROKER],
  ssl: true,
  sasl: {
    mechanism: "plain",
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD,
  },
});

const producer = kafka.producer();

const threatTemplates = {
  publicStorageAccess: {
    cloudProvider: "azure",
    resourceType: "storageAccount",
    resourceName: "prod-storage-v2-001",
    severity: "high",
    issueType: "publicStorageAccess",
    description: "Storage account allows public blob access.",
  },
  publicSSHAccess: {
    cloudProvider: "azure",
    resourceType: "networkSecurityGroup",
    resourceName: "prod-nsg-ssh-001",
    severity: "high",
    issueType: "publicSSHAccess",
    description: "Network security group allows public SSH access on port 22.",
  },
  publicRDPAccess: {
    cloudProvider: "azure",
    resourceType: "networkSecurityGroup",
    resourceName: "prod-nsg-rdp-001",
    severity: "high",
    issueType: "publicRDPAccess",
    description: "Network security group allows public RDP access on port 3389.",
  },
  unencryptedDatabase: {
    cloudProvider: "azure",
    resourceType: "sqlDatabase",
    resourceName: "prod-sql-db-001",
    severity: "critical",
    issueType: "unencryptedDatabase",
    description: "SQL database encryption is not enabled.",
  },
  weakTlsVersion: {
    cloudProvider: "azure",
    resourceType: "appService",
    resourceName: "prod-app-service-001",
    severity: "medium",
    issueType: "weakTlsVersion",
    description: "App Service allows weak TLS versions below TLS 1.2.",
  },
};

function buildFakeThreat(issueType) {
  const selectedTemplate =
    threatTemplates[issueType] || threatTemplates.publicStorageAccess;

  return {
    id: `threat-${Date.now()}`,
    source: "simulated-ebpf",
    ...selectedTemplate,
    status: "open",
    timestamp: new Date().toISOString(),
  };
}

async function sendFakeThreat() {
  try {
    const issueTypeArg = process.argv[2] || "publicStorageAccess";
    const fakeThreat = buildFakeThreat(issueTypeArg);

    await producer.connect();
    console.log("Producer connected to Kafka.");

    await producer.send({
      topic: process.env.KAFKA_TOPIC,
      messages: [{ value: JSON.stringify(fakeThreat) }],
    });

    console.log("Fake threat sent successfully.");
    console.log(fakeThreat);
  } catch (error) {
    console.error("Producer error:", error.message);
  } finally {
    await producer.disconnect();
  }
}

sendFakeThreat();