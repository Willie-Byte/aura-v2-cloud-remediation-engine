const fs = require("fs");
const path = require("path");

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

function assertNoBridgeTelemetry(event, fixtureName) {
  const telemetry = classifyTetragonProcessExec(event);

  assert(
    telemetry === null,
    `Expected ${fixtureName} to produce no bridge telemetry.`
  );

  return telemetry;
}

function assertNoThreatFromTelemetry(telemetry, label) {
  const threat = buildThreatFromTelemetry(telemetry);

  assert(threat === null, `Expected ${label} to produce no normalized threat.`);

  return threat;
}

function run() {
  console.log("[tetragon-e2e-negative-test] Starting local negative-path test...");

  const ignoredNamespaceEvent = readFixture("ignored-namespace-process-exec.json");
  const nonSuspiciousEvent = readFixture("non-suspicious-process-exec.json");

  const ignoredNamespaceTelemetry = assertNoBridgeTelemetry(
    ignoredNamespaceEvent,
    "ignored-namespace-process-exec.json"
  );

  const nonSuspiciousTelemetry = assertNoBridgeTelemetry(
    nonSuspiciousEvent,
    "non-suspicious-process-exec.json"
  );

  assert(
    ignoredNamespaceTelemetry === null,
    "Expected ignored namespace telemetry to be null."
  );

  assert(
    nonSuspiciousTelemetry === null,
    "Expected non-suspicious telemetry to be null."
  );

  const unsupportedTelemetry = {
    source: "test",
    eventType: "process_exec",
    cloudProvider: "azure",
    resourceType: "aksPod",
    resourceName: "default/normal-pod",
    severity: "low",
    issueType: "nonSuspiciousProcess",
    namespace: "default",
    podName: "normal-pod",
    binary: "/usr/bin/sleep",
    arguments: "30",
  };

  const unsupportedThreat = assertNoThreatFromTelemetry(
    unsupportedTelemetry,
    "unsupported process_exec telemetry"
  );

  assert(
    unsupportedThreat === null,
    "Expected unsupported telemetry to stay null at threat stage."
  );

  let bridgePublishErrorCaught = false;

  try {
    buildKafkaMessageFromTelemetry(null);
  } catch (error) {
    bridgePublishErrorCaught = error.message.includes(
      "Telemetry must include resourceName."
    );
  }

  assert(
    bridgePublishErrorCaught,
    "Expected bridge publisher helper to reject null telemetry."
  );

  let threatPublishErrorCaught = false;

  try {
    buildKafkaMessageFromThreat(null);
  } catch (error) {
    threatPublishErrorCaught = error.message.includes(
      "Threat must include resourceName."
    );
  }

  assert(
    threatPublishErrorCaught,
    "Expected normalizer publisher helper to reject null threat."
  );

  console.log("[tetragon-e2e-negative-test] Local negative-path test passed.");
}

try {
  run();
} catch (error) {
  console.error("[tetragon-e2e-negative-test] Failed:", error.message);
  process.exit(1);
}
