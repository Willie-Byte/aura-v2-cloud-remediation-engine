require("dotenv").config({ path: __dirname + "/.env" });
const kafka = require("./kafkaClient");

const producer = kafka.producer();

function getTelemetryMode() {
  const mode = process.argv[2];

  if (!mode) {
    return "ssh";
  }

  if (!["ssh", "pqc"].includes(mode)) {
    throw new Error('Telemetry mode must be either "ssh" or "pqc".');
  }

  return mode;
}

function buildSshTelemetryEvent() {
  return {
    telemetryId: `telemetry-${Date.now()}`,
    source: "simulated-ebpf",
    eventType: "network_exposure_detected",
    cloudProvider: "azure",
    resourceType: "networkSecurityGroup",
    resourceName: "prod-nsg-ssh-001",
    observedPort: 22,
    protocol: "tcp",
    exposure: "public",
    sourceIpRange: "0.0.0.0/0",
    severity: "high",
    rawMessage:
      "Simulated eBPF telemetry detected public SSH exposure on Azure network security group prod-nsg-ssh-001.",
    detectedAt: new Date().toISOString(),
    metadata: {
      sensor: "local-ebpf-simulator",
      environment: "local-demo",
      region: "eastus",
      confidence: 0.94,
    },
  };
}

function buildPqcTelemetryEvent() {
  return {
    telemetryId: `telemetry-${Date.now()}`,
    source: "simulated-crypto-scanner",
    eventType: "non_quantum_safe_crypto_detected",
    cloudProvider: "azure",
    resourceType: "appService",
    resourceName: "prod-api-app-service-001",
    tlsVersion: "TLS1.2",
    keyExchange: "RSA-2048",
    encryptionProfile: "classical-only",
    pqcReady: false,
    requiredStandard: "TLS1.3_ML-KEM_HYBRID",
    severity: "critical",
    rawMessage:
      "Simulated crypto scanner detected classical-only TLS configuration on Azure App Service prod-api-app-service-001. Enforce TLS 1.3 with Kyber/ML-KEM hybrid key exchange.",
    detectedAt: new Date().toISOString(),
    metadata: {
      sensor: "local-pqc-crypto-simulator",
      environment: "local-demo",
      region: "eastus",
      confidence: 0.97,
      harvestNowDecryptLaterRisk: true,
      recommendedAction: "enforcePQCTls1_3",
    },
  };
}

function buildTelemetryEvent() {
  const mode = getTelemetryMode();

  if (mode === "pqc") {
    return buildPqcTelemetryEvent();
  }

  return buildSshTelemetryEvent();
}

async function sendTelemetryEvent() {
  try {
    await producer.connect();
    console.log("Telemetry producer connected to Kafka.");

    const telemetryEvent = buildTelemetryEvent();

    await producer.send({
      topic: process.env.KAFKA_RAW_TELEMETRY_TOPIC,
      messages: [
        {
          key: telemetryEvent.resourceName,
          value: JSON.stringify(telemetryEvent),
        },
      ],
    });

    console.log("Raw telemetry event sent successfully.");
    console.log(telemetryEvent);
  } catch (error) {
    console.error("Telemetry producer error:", error.message);
  } finally {
    await producer.disconnect();
  }
}

sendTelemetryEvent();