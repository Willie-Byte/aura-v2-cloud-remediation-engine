const fs = require("fs");
const path = require("path");

process.env.KAFKA_TOPIC = process.env.KAFKA_TOPIC || "security-threats";

const {
  buildKafkaMessageFromTelemetry,
  classifyTetragonProcessExec,
} = require("../streaming/tetragonBridge");

const {
  buildKafkaMessageFromThreat,
  buildThreatFromTelemetry,
} = require("../streaming/telemetryNormalizer");

function readFixture(filename) {
  const fixturePath = path.join(
    __dirname,
    "..",
    "fixtures",
    "tetragon",
    filename
  );

  return JSON.parse(fs.readFileSync(fixturePath, "utf8"));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function run() {
  console.log("[tetragon-e2e-test] Starting local end-to-end test...");

  const suspiciousEvent = readFixture("suspicious-process-exec.json");

  const telemetry = classifyTetragonProcessExec(suspiciousEvent);

  assert(telemetry, "Expected suspicious fixture to produce bridge telemetry.");

  assert(
    telemetry.issueType === "unauthorizedPodExec",
    "Expected bridge telemetry issueType to be unauthorizedPodExec."
  );

  assert(
    telemetry.resourceName === "default/aura-ebpf-test",
    "Expected bridge telemetry resourceName to be default/aura-ebpf-test."
  );

  assert(
    telemetry.source === "tetragon-ebpf",
    "Expected bridge telemetry source to be tetragon-ebpf."
  );

  const rawTelemetryKafkaMessage = buildKafkaMessageFromTelemetry(telemetry);

  assert(
    rawTelemetryKafkaMessage.topic === "raw-telemetry",
    "Expected raw telemetry Kafka topic to be raw-telemetry."
  );

  assert(
    rawTelemetryKafkaMessage.messages.length === 1,
    "Expected exactly one raw telemetry Kafka message."
  );

  const [rawTelemetryMessage] = rawTelemetryKafkaMessage.messages;

  assert(
    rawTelemetryMessage.key === "default/aura-ebpf-test",
    "Expected raw telemetry Kafka key to be default/aura-ebpf-test."
  );

  assert(
    typeof rawTelemetryMessage.value === "string",
    "Expected raw telemetry Kafka value to be a JSON string."
  );

  const parsedRawTelemetry = JSON.parse(rawTelemetryMessage.value);

  assert(
    parsedRawTelemetry.issueType === "unauthorizedPodExec",
    "Expected parsed raw telemetry to preserve unauthorizedPodExec."
  );

  assert(
    parsedRawTelemetry.binary === "/bin/sh",
    "Expected parsed raw telemetry to preserve binary."
  );

  assert(
    parsedRawTelemetry.arguments === "whoami",
    "Expected parsed raw telemetry to preserve arguments."
  );

  const threat = buildThreatFromTelemetry(parsedRawTelemetry);

  assert(threat, "Expected raw telemetry to normalize into a threat.");

  assert(
    threat.issueType === "unauthorizedPodExec",
    "Expected normalized threat issueType to be unauthorizedPodExec."
  );

  assert(
    threat.resourceType === "aksPod",
    "Expected normalized threat resourceType to be aksPod."
  );

  assert(
    threat.resourceName === "default/aura-ebpf-test",
    "Expected normalized threat resourceName to be default/aura-ebpf-test."
  );

  assert(
    threat.status === "open",
    "Expected normalized threat status to be open."
  );

  assert(
    threat.rawTelemetry.issueType === "unauthorizedPodExec",
    "Expected normalized threat to preserve raw telemetry."
  );

  const threatKafkaMessage = buildKafkaMessageFromThreat(threat);

  assert(
    threatKafkaMessage.topic === process.env.KAFKA_TOPIC,
    "Expected final threat Kafka topic to match KAFKA_TOPIC."
  );

  assert(
    threatKafkaMessage.messages.length === 1,
    "Expected exactly one final threat Kafka message."
  );

  const [threatMessage] = threatKafkaMessage.messages;

  assert(
    threatMessage.key === "default/aura-ebpf-test",
    "Expected final threat Kafka key to be default/aura-ebpf-test."
  );

  assert(
    typeof threatMessage.value === "string",
    "Expected final threat Kafka value to be a JSON string."
  );

  const parsedThreat = JSON.parse(threatMessage.value);

  assert(
    parsedThreat.issueType === "unauthorizedPodExec",
    "Expected final threat payload issueType to be unauthorizedPodExec."
  );

  assert(
    parsedThreat.source === "tetragon-ebpf",
    "Expected final threat payload source to be tetragon-ebpf."
  );

  assert(
    parsedThreat.rawTelemetry.binary === "/bin/sh",
    "Expected final threat payload rawTelemetry binary to be /bin/sh."
  );

  assert(
    parsedThreat.rawTelemetry.arguments === "whoami",
    "Expected final threat payload rawTelemetry arguments to be whoami."
  );

  console.log("[tetragon-e2e-test] Local end-to-end test passed.");
}

try {
  run();
} catch (error) {
  console.error("[tetragon-e2e-test] Failed:", error.message);
  process.exit(1);
}