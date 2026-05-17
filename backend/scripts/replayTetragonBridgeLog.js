const fs = require("fs");
const path = require("path");

const { classifyTetragonProcessExec } = require("../streaming/tetragonBridge");

const fixturePath =
  process.argv[2] ||
  path.join(__dirname, "..", "fixtures", "tetragon", "sample-tetragon.log");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function replayLogFile(filePath) {
  console.log("[tetragon-replay] Starting local Tetragon log replay...");
  console.log(`[tetragon-replay] Fixture: ${filePath}`);

  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const telemetryEvents = [];
  const ignoredEvents = [];
  const parseErrors = [];

  for (const [index, line] of lines.entries()) {
    try {
      const event = JSON.parse(line);
      const telemetry = classifyTetragonProcessExec(event);

      if (telemetry) {
        telemetryEvents.push({
          line: index + 1,
          telemetry,
        });

        console.log(
          `[tetragon-replay] WOULD_PUBLISH line=${index + 1} issueType=${telemetry.issueType} resource=${telemetry.resourceName} binary=${telemetry.binary} args=${telemetry.arguments}`
        );
      } else {
        ignoredEvents.push(index + 1);
        console.log(`[tetragon-replay] IGNORED line=${index + 1}`);
      }
    } catch (error) {
      parseErrors.push({
        line: index + 1,
        error: error.message,
      });

      console.log(
        `[tetragon-replay] PARSE_ERROR line=${index + 1} error=${error.message}`
      );
    }
  }

  console.log("[tetragon-replay] Summary:");
  console.log(`  totalLines=${lines.length}`);
  console.log(`  wouldPublish=${telemetryEvents.length}`);
  console.log(`  ignored=${ignoredEvents.length}`);
  console.log(`  parseErrors=${parseErrors.length}`);

  return {
    totalLines: lines.length,
    telemetryEvents,
    ignoredEvents,
    parseErrors,
  };
}

try {
  const result = replayLogFile(fixturePath);

  assert(result.totalLines === 4, "Expected 4 log lines.");
  assert(result.telemetryEvents.length === 2, "Expected 2 publishable telemetry events.");
  assert(result.ignoredEvents.length === 2, "Expected 2 ignored events.");
  assert(result.parseErrors.length === 0, "Expected 0 parse errors.");

  const resources = result.telemetryEvents.map((entry) => entry.telemetry.resourceName);

  assert(
    resources.includes("default/aura-ebpf-test"),
    "Expected default/aura-ebpf-test to be publishable."
  );

  assert(
    resources.includes("default/curl-test"),
    "Expected default/curl-test to be publishable."
  );

  console.log("[tetragon-replay] Local replay test passed.");
} catch (error) {
  console.error("[tetragon-replay] Failed:", error.message);
  process.exit(1);
}
