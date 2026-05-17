const fs = require("fs");
const path = require("path");

process.env.KAFKA_TOPIC = process.env.KAFKA_TOPIC || "security-threats";

const { classifyTetragonProcessExec } = require("../streaming/tetragonBridge");
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
  console.log(
    "[tetragon-normalizer-publisher-test] Starting normalizer publisher test..."
  );

  const suspiciousEvent = readFixture("suspicious-process-exec.json");
  const telemetry = classifyTetragonProcessExec(suspiciousEvent);
  const threat = buildThreatFromTelemetry(telemetry);

  assert(threat, "Expected Tetragon telemetry to produce a normalized threat.");

  const kafkaMessage = buildKafkaMessageFromThreat(threat);

  assert(
    kafkaMessage.topic === process.env.KAFKA_TOPIC,
    "Expected Kafka message topic to match KAFKA_TOPIC."
  );

  assert(
    Array.isArray(kafkaMessage.messages),
    "Expected Kafka messages to be an array."
  );

  assert(
    kafkaMessage.messages.length === 1,
    "Expected exactly one Kafka message."
  );

  const [message] = kafkaMessage.messages;

  assert(
    message.key === "default/aura-ebpf-test",
    "Expected Kafka message key to be default/aura-ebpf-test."
  );

  assert(
    typeof message.value === "string",
    "Expected Kafka message value to be a JSON string."
  );

  const parsedValue = JSON.parse(message.value);

  assert(
    parsedValue.issueType === "unauthorizedPodExec",
    "Expected threat payload issueType to be unauthorizedPodExec."
  );

  assert(
    parsedValue.resourceType === "aksPod",
    "Expected threat payload resourceType to be aksPod."
  );

  assert(
    parsedValue.resourceName === "default/aura-ebpf-test",
    "Expected threat payload resourceName to be default/aura-ebpf-test."
  );

  assert(
    parsedValue.source === "tetragon-ebpf",
    "Expected threat payload source to be tetragon-ebpf."
  );

  assert(
    parsedValue.status === "open",
    "Expected threat payload status to be open."
  );

  assert(
    parsedValue.rawTelemetry.issueType === "unauthorizedPodExec",
    "Expected rawTelemetry to preserve unauthorizedPodExec."
  );

  console.log(
    "[tetragon-normalizer-publisher-test] Normalizer publisher test passed."
  );
}

try {
  run();
} catch (error) {
  console.error("[tetragon-normalizer-publisher-test] Failed:", error.message);
  process.exit(1);
}
