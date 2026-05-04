require("dotenv").config({ path: __dirname + "/.env" });

const kafka = require("./kafkaClient");
const {
  addAuditEvent,
  addExecutionResult,
} = require("./streamState");
const Alert = require("../models/Alert");
const AuditLog = require("../models/AuditLog");

const auditTopic = process.env.KAFKA_AUDIT_TOPIC || "audit-log";
const resultsTopic = process.env.KAFKA_RESULTS_TOPIC || "execution-results";
const persistThreatsToMongo =
  String(process.env.PERSIST_STREAMING_THREATS_TO_MONGO || "true").toLowerCase() ===
  "true";

const auditConsumer = kafka.consumer({
  groupId: "aura-v2-bridge-audit-group",
});

const resultConsumer = kafka.consumer({
  groupId: "aura-v2-bridge-results-group",
});

let bridgeStarted = false;

function getThreatFromAuditEvent(auditEvent) {
  if (auditEvent?.eventType !== "TELEMETRY_NORMALIZED_TO_THREAT") {
    return null;
  }

  return auditEvent.payload?.threat || null;
}

function buildEvidence(threat) {
  return (
    threat.evidence ||
    threat.rawTelemetry?.evidence ||
    {
      namespace: threat.rawTelemetry?.namespace,
      podName: threat.rawTelemetry?.podName,
      containerName: threat.rawTelemetry?.containerName,
      imageName: threat.rawTelemetry?.imageName,
      binary: threat.rawTelemetry?.binary,
      arguments: threat.rawTelemetry?.arguments,
      nodeName: threat.rawTelemetry?.nodeName,
    }
  );
}

function normalizeSeverity(severity) {
  const allowed = ["low", "medium", "high", "critical"];
  return allowed.includes(severity) ? severity : "medium";
}

function normalizeCloudProvider(cloudProvider) {
  const allowed = ["azure", "aws", "gcp"];
  return allowed.includes(cloudProvider) ? cloudProvider : "azure";
}

async function findExistingAlert(threat, sourceTelemetryId) {
  if (sourceTelemetryId) {
    const existingByTelemetryId = await Alert.findOne({ sourceTelemetryId });

    if (existingByTelemetryId) {
      return existingByTelemetryId;
    }
  }

  return Alert.findOne({
    source: threat.source || "tetragon-ebpf",
    resourceName: threat.resourceName,
    issueType: threat.issueType,
    status: "open",
  });
}

async function persistNormalizedThreatToMongo(auditEvent) {
  if (!persistThreatsToMongo) {
    return;
  }

  const threat = getThreatFromAuditEvent(auditEvent);

  if (!threat) {
    return;
  }

  const sourceTelemetryId =
    threat.sourceTelemetryId ||
    auditEvent.payload?.sourceTelemetryId ||
    threat.rawTelemetry?.telemetryId ||
    threat.rawTelemetry?.id ||
    "";

  const existingAlert = await findExistingAlert(threat, sourceTelemetryId);

  if (existingAlert) {
    console.log("[StreamBridge] Normalized threat already persisted:", {
      alertId: existingAlert._id,
      sourceTelemetryId,
      issueType: threat.issueType,
      resourceName: threat.resourceName,
    });
    return;
  }

  const alert = await Alert.create({
    source: threat.source || "tetragon-ebpf",
    cloudProvider: normalizeCloudProvider(threat.cloudProvider),
    resourceType: threat.resourceType || "aksPod",
    resourceName: threat.resourceName || "unknown-resource",
    severity: normalizeSeverity(threat.severity),
    issueType: threat.issueType || "unknownIssue",
    description: threat.description || "Streaming security threat detected.",
    status: "open",
    sourceTelemetryId,
    evidence: buildEvidence(threat),
    rawTelemetry: threat.rawTelemetry || {},
    streamingMetadata: {
      normalizedThreatId: threat.id || "",
      ingestionPath: "kafka-stream-bridge",
      kafkaAuditEventId: auditEvent.eventId || "",
    },
    detectedAt: threat.timestamp || new Date(),
  });

  await AuditLog.create({
    alertId: alert._id,
    action: "ALERT_CREATED",
    message: `Streaming alert created from ${threat.source || "unknown-source"} for resource "${alert.resourceName}" with issue type "${alert.issueType}".`,
  });

  console.log("[StreamBridge] Normalized threat persisted as Mongo alert:", {
    alertId: alert._id,
    sourceTelemetryId,
    issueType: alert.issueType,
    resourceName: alert.resourceName,
  });
}

async function startStreamBridge() {
  if (bridgeStarted) {
    console.log("Aura V2 stream bridge already started.");
    return;
  }

  bridgeStarted = true;

  try {
    console.log("Starting Aura V2 stream bridge...");
    console.log(`Bridge audit topic: ${auditTopic}`);
    console.log(`Bridge results topic: ${resultsTopic}`);
    console.log(
      `Persist normalized streaming threats to MongoDB: ${persistThreatsToMongo}`
    );

    await auditConsumer.connect();
    console.log("Bridge audit consumer connected.");

    await resultConsumer.connect();
    console.log("Bridge results consumer connected.");

    await auditConsumer.subscribe({
      topic: auditTopic,
      fromBeginning: false,
    });

    await resultConsumer.subscribe({
      topic: resultsTopic,
      fromBeginning: false,
    });

    await auditConsumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const auditEvent = JSON.parse(message.value.toString());
          addAuditEvent(auditEvent);

          await persistNormalizedThreatToMongo(auditEvent);

          console.log("[StreamBridge] Audit event cached:", {
            topic,
            partition,
            eventType: auditEvent.eventType,
            eventId: auditEvent.eventId,
            timestamp: auditEvent.timestamp,
          });
        } catch (error) {
          console.error("[StreamBridge] Failed to cache audit event:", error.message);
        }
      },
    });

    await resultConsumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const resultEvent = JSON.parse(message.value.toString());
          addExecutionResult(resultEvent);

          console.log("[StreamBridge] Execution result cached:", {
            topic,
            partition,
            resultId: resultEvent.resultId,
            remediationId: resultEvent.remediationId,
            threatId: resultEvent.threatId,
            status: resultEvent.status,
          });
        } catch (error) {
          console.error("[StreamBridge] Failed to cache execution result:", error.message);
        }
      },
    });

    console.log("Aura V2 stream bridge started.");
  } catch (error) {
    bridgeStarted = false;
    console.error("Failed to start stream bridge:", error);
  }
}

module.exports = {
  startStreamBridge,
};
