const fs = require("fs");
const path = require("path");

const { classifyTetragonProcessExec } = require("../streaming/tetragonBridge");
const {
  buildThreatFromTelemetry,
  mapTelemetryToIssueType,
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
  console.log("[tetragon-normalizer-test] Starting telemetry normalizer test...");

  const suspiciousEvent = readFixture("suspicious-process-exec.json");
  const telemetry = classifyTetragonProcessExec(suspiciousEvent);

  assert(telemetry, "Expected suspicious fixture to produce telemetry.");
  assert(
    telemetry.issueType === "unauthorizedPodExec",
    "Expected bridge telemetry issueType to be unauthorizedPodExec."
  );

  const issueType = mapTelemetryToIssueType(telemetry);

  assert(
    issueType === "unauthorizedPodExec",
    "Expected normalizer to map telemetry to unauthorizedPodExec."
  );

  const threat = buildThreatFromTelemetry(telemetry);

  assert(threat, "Expected unauthorizedPodExec telemetry to produce a threat.");

  assert(
    threat.issueType === "unauthorizedPodExec",
    "Expected threat issueType to be unauthorizedPodExec."
  );

  assert(
    threat.resourceType === "aksPod",
    "Expected threat resourceType to be aksPod."
  );

  assert(
    threat.resourceName === "default/aura-ebpf-test",
    "Expected threat resourceName to be default/aura-ebpf-test."
  );

  assert(
    threat.source === "tetragon-ebpf",
    "Expected threat source to be tetragon-ebpf."
  );

  assert(
    threat.severity === "high",
    "Expected threat severity to be high."
  );

  assert(
    threat.description.includes("AKS pod default/aura-ebpf-test"),
    "Expected threat description to mention the AKS pod."
  );

  assert(
    threat.description.includes("/bin/sh"),
    "Expected threat description to mention suspicious binary."
  );

  assert(
    threat.description.includes("whoami"),
    "Expected threat description to mention suspicious arguments."
  );

  assert(
    threat.rawTelemetry.issueType === "unauthorizedPodExec",
    "Expected rawTelemetry to preserve unauthorizedPodExec."
  );

  const unsupportedTelemetry = {
    source: "test",
    eventType: "process_exec",
    resourceType: "aksPod",
    issueType: "nonSuspiciousProcess",
    resourceName: "default/normal-pod",
  };

  assert(
    buildThreatFromTelemetry(unsupportedTelemetry) === null,
    "Expected unsupported telemetry to stay ignored."
  );

  console.log("[tetragon-normalizer-test] Telemetry normalizer test passed.");
}

try {
  run();
} catch (error) {
  console.error("[tetragon-normalizer-test] Failed:", error.message);
  process.exit(1);
}
