require("dotenv").config({ path: __dirname + "/.env" });
const kafka = require("./kafkaClient");
const { publishAuditEvent } = require("./auditProducer");

const consumer = kafka.consumer({
  groupId: "aura-v2-telemetry-normalizer-group",
});

const producer = kafka.producer();

function mapTelemetryToIssueType(telemetry) {
  if (
    telemetry.issueType === "unauthorizedPodExec" ||
    (
      telemetry.source === "tetragon-ebpf" &&
      telemetry.eventType === "process_exec" &&
      telemetry.resourceType === "aksPod"
    ) ||
    (
      telemetry.source === "tetragon-ebpf" &&
      telemetry.eventType === "unauthorized_pod_exec_detected"
    )
  ) {
    return "unauthorizedPodExec";
  }

  if (
    telemetry.eventType === "network_exposure_detected" &&
    telemetry.resourceType === "networkSecurityGroup" &&
    telemetry.observedPort === 22 &&
    telemetry.protocol === "tcp" &&
    telemetry.exposure === "public"
  ) {
    return "publicSSHAccess";
  }

  if (
    telemetry.eventType === "network_exposure_detected" &&
    telemetry.resourceType === "networkSecurityGroup" &&
    telemetry.observedPort === 3389 &&
    telemetry.protocol === "tcp" &&
    telemetry.exposure === "public"
  ) {
    return "publicRDPAccess";
  }

  if (
    telemetry.eventType === "storage_exposure_detected" &&
    telemetry.resourceType === "storageAccount" &&
    telemetry.exposure === "public"
  ) {
    return "publicStorageAccess";
  }

  if (
    telemetry.eventType === "database_encryption_disabled" &&
    telemetry.resourceType === "sqlDatabase"
  ) {
    return "unencryptedDatabase";
  }

  if (
    telemetry.eventType === "weak_tls_detected" &&
    telemetry.resourceType === "appService"
  ) {
    return "weakTlsVersion";
  }

  if (
    telemetry.eventType === "non_quantum_safe_crypto_detected" &&
    ["appService", "applicationGateway", "keyVault", "apiManagement", "loadBalancer"].includes(
      telemetry.resourceType
    )
  ) {
    return "nonQuantumSafeCrypto";
  }

  if (
    telemetry.pqcReady === false &&
    telemetry.metadata?.harvestNowDecryptLaterRisk === true
  ) {
    return "nonQuantumSafeCrypto";
  }

  return null;
}

function getThreatDescription(issueType, telemetry) {
  const descriptionMap = {
    unauthorizedPodExec:
      `Live eBPF detected suspicious process execution inside AKS pod ${
        telemetry.resourceName || "unknown-pod"
      }. Binary: ${telemetry.binary || "unknown"}, arguments: ${
        telemetry.arguments || "none"
      }.`,
    publicSSHAccess:
      "Network security group allows public SSH access on port 22.",
    publicRDPAccess:
      "Network security group allows public RDP access on port 3389.",
    publicStorageAccess: "Storage account allows public access.",
    unencryptedDatabase: "SQL database encryption is not enabled.",
    weakTlsVersion: "App Service allows weak TLS versions below TLS 1.2.",
    nonQuantumSafeCrypto:
      `Resource uses non-quantum-safe cryptography. Current profile: ${
        telemetry.encryptionProfile || "classical-only"
      }, TLS version: ${telemetry.tlsVersion || "unknown"}, key exchange: ${
        telemetry.keyExchange || "unknown"
      }. Enforce TLS 1.3 with Kyber/ML-KEM hybrid key exchange.`,
  };

  return descriptionMap[issueType] || "Supported security issue detected.";
}

function buildThreatFromTelemetry(telemetry) {
  const issueType = mapTelemetryToIssueType(telemetry);

  if (!issueType) {
    return null;
  }

  return {
    id: `threat-${Date.now()}`,
    source: telemetry.source || "unknown-telemetry-source",
    sourceTelemetryId: telemetry.telemetryId || telemetry.id,
    cloudProvider: telemetry.cloudProvider || "azure",
    resourceType: telemetry.resourceType,
    resourceName: telemetry.resourceName,
    severity: telemetry.severity || "medium",
    issueType,
    description: telemetry.description || getThreatDescription(issueType, telemetry),
    status: "open",
    timestamp: telemetry.detectedAt || telemetry.timestamp || new Date().toISOString(),
    evidence: {
      namespace: telemetry.namespace,
      podName: telemetry.podName,
      containerName: telemetry.containerName,
      imageName: telemetry.imageName,
      binary: telemetry.binary,
      arguments: telemetry.arguments,
      nodeName: telemetry.nodeName,
      eventType: telemetry.eventType,
    },
    rawTelemetry: telemetry,
  };
}

async function runTelemetryNormalizer() {
  try {
    await consumer.connect();
    await producer.connect();

    console.log("Telemetry normalizer connected. Waiting for raw telemetry...");

    await consumer.subscribe({
      topic: process.env.KAFKA_RAW_TELEMETRY_TOPIC,
      fromBeginning: false,
    });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        let telemetry;

        try {
          telemetry = JSON.parse(message.value.toString());
        } catch (error) {
          console.error("Failed to parse telemetry payload:", error.message);

          await publishAuditEvent("TELEMETRY_PARSE_FAILED", {
            topic,
            partition,
            error: error.message,
            rawValue: message.value?.toString(),
          });

          return;
        }

        console.log("\nRaw telemetry received");
        console.log("Topic:", topic);
        console.log("Partition:", partition);
        console.log("Payload:", telemetry);

        await publishAuditEvent("RAW_TELEMETRY_RECEIVED", {
          topic,
          partition,
          telemetry,
        });

        const threat = buildThreatFromTelemetry(telemetry);

        if (!threat) {
          console.log("Telemetry did not match a supported threat rule.");

          await publishAuditEvent("TELEMETRY_IGNORED", {
            reason: "unsupported_telemetry_pattern",
            telemetry,
          });

          return;
        }

        await producer.send({
          topic: process.env.KAFKA_TOPIC,
          messages: [
            {
              key: threat.resourceName,
              value: JSON.stringify(threat),
            },
          ],
        });

        console.log("Telemetry normalized into threat and published.");
        console.log(threat);

        await publishAuditEvent("TELEMETRY_NORMALIZED_TO_THREAT", {
          sourceTelemetryId: telemetry.telemetryId || telemetry.id,
          threat,
        });
      },
    });
  } catch (error) {
    console.error("Telemetry normalizer error:", error.message);
  }
}

runTelemetryNormalizer();
