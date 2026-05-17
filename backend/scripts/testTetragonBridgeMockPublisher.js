const fs = require("fs");
const path = require("path");

const {
  buildKafkaMessageFromTelemetry,
  classifyTetragonProcessExec,
} = require("../streaming/tetragonBridge");

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
  console.log("[tetragon-mock-publisher-test] Starting mock publisher test...");

  const suspiciousEvent = readFixture("suspicious-process-exec.json");
  const telemetry = classifyTetragonProcessExec(suspiciousEvent);

  assert(telemetry, "Expected suspicious fixture to produce telemetry.");

  const kafkaMessage = buildKafkaMessageFromTelemetry(telemetry);

  assert(
    kafkaMessage.topic === "raw-telemetry",
    "Expected topic to be raw-telemetry."
  );

  assert(
    Array.isArray(kafkaMessage.messages),
    "Expected messages to be an array."
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
    "Expected payload issueType to be unauthorizedPodExec."
  );

  assert(
    parsedValue.source === "tetragon-ebpf",
    "Expected payload source to be tetragon-ebpf."
  );

  assert(
    parsedValue.resourceType === "aksPod",
    "Expected payload resourceType to be aksPod."
  );

  assert(
    parsedValue.resourceName === "default/aura-ebpf-test",
    "Expected payload resourceName to be default/aura-ebpf-test."
  );

  assert(
    parsedValue.binary === "/bin/sh",
    "Expected payload binary to be /bin/sh."
  );

  assert(
    parsedValue.arguments === "whoami",
    "Expected payload arguments to be whoami."
  );

  console.log("[tetragon-mock-publisher-test] Mock publisher test passed.");
}

try {
  run();
} catch (error) {
  console.error("[tetragon-mock-publisher-test] Failed:", error.message);
  process.exit(1);
}
