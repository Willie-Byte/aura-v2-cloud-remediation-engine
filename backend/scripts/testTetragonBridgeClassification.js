const fs = require("fs");
const path = require("path");

const {
  classifyTetragonProcessExec,
  isSuspiciousProcess,
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
  console.log("[tetragon-bridge-test] Starting local classification tests...");

  assert(
    isSuspiciousProcess("/bin/sh", "whoami") === true,
    "Expected /bin/sh whoami to be suspicious."
  );

  assert(
    isSuspiciousProcess("/usr/bin/sleep", "30") === false,
    "Expected /usr/bin/sleep 30 to be non-suspicious."
  );

  const suspiciousEvent = readFixture("suspicious-process-exec.json");
  const suspiciousTelemetry = classifyTetragonProcessExec(suspiciousEvent);

  assert(
    suspiciousTelemetry,
    "Expected suspicious fixture to produce telemetry."
  );

  assert(
    suspiciousTelemetry.issueType === "unauthorizedPodExec",
    "Expected issueType to be unauthorizedPodExec."
  );

  assert(
    suspiciousTelemetry.resourceName === "default/aura-ebpf-test",
    "Expected resourceName to be default/aura-ebpf-test."
  );

  assert(
    suspiciousTelemetry.binary === "/bin/sh",
    "Expected binary to be /bin/sh."
  );

  const normalEvent = readFixture("non-suspicious-process-exec.json");
  const normalTelemetry = classifyTetragonProcessExec(normalEvent);

  assert(
    normalTelemetry === null,
    "Expected non-suspicious fixture to be ignored."
  );

  const ignoredNamespaceEvent = readFixture(
    "ignored-namespace-process-exec.json"
  );
  const ignoredNamespaceTelemetry =
    classifyTetragonProcessExec(ignoredNamespaceEvent);

  assert(
    ignoredNamespaceTelemetry === null,
    "Expected kube-system namespace fixture to be ignored."
  );

  console.log("[tetragon-bridge-test] All local classification tests passed.");
}

try {
  run();
} catch (error) {
  console.error("[tetragon-bridge-test] Failed:", error.message);
  process.exit(1);
}
