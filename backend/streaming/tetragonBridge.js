require("dotenv").config({ path: __dirname + "/.env" });

const fs = require("fs");
const kafka = require("./kafkaClient");

const producer = kafka.producer();

const LOG_PATH =
  process.env.TETRAGON_LOG_PATH || "/var/run/cilium/tetragon/tetragon.log";

const RAW_TOPIC = process.env.KAFKA_RAW_TELEMETRY_TOPIC || "raw-telemetry";

const MONITORED_NAMESPACES = (
  process.env.TETRAGON_MONITORED_NAMESPACES || "default,aura"
)
  .split(",")
  .map((namespace) => namespace.trim())
  .filter(Boolean);

const READ_FROM_START = process.env.TETRAGON_READ_FROM_START === "true";

let filePosition = 0;
let leftover = "";

function getProcessFromTetragonEvent(event) {
  return (
    event.process_exec?.process ||
    event.process_exit?.process ||
    event.process_kprobe?.process ||
    event.process ||
    {}
  );
}

function getPodFromProcess(process) {
  return process.pod || process.docker || {};
}

function isSuspiciousProcess(binary, args) {
  const normalizedBinary = String(binary || "").toLowerCase();
  const normalizedArgs = String(args || "").toLowerCase();

  const suspiciousBinaryPattern =
    /\/(sh|bash|ash|zsh|curl|wget|nc|ncat|python|python3|perl|ruby|node)$/;

  const suspiciousArgsPattern =
    /\b(whoami|uname|id|curl|wget|nc|ncat|cat \/etc\/passwd|printenv)\b/;

  return (
    suspiciousBinaryPattern.test(normalizedBinary) ||
    suspiciousArgsPattern.test(normalizedArgs)
  );
}

function classifyTetragonProcessExec(event) {
  if (!event.process_exec) {
    return null;
  }

  const process = getProcessFromTetragonEvent(event);
  const pod = getPodFromProcess(process);

  const namespace = pod.namespace || "unknown";
  const podName = pod.name || "unknown";
  const container = pod.container || {};
  const image = container.image || {};
  const binary = process.binary || "";
  const args = process.arguments || process.args || "";

  if (!MONITORED_NAMESPACES.includes(namespace)) {
    return null;
  }

  if (!isSuspiciousProcess(binary, args)) {
    return null;
  }

  const telemetryId = `telemetry-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;

  return {
    telemetryId,
    id: telemetryId,
    source: "tetragon-ebpf",
    eventType: "process_exec",
    cloudProvider: "azure",
    resourceType: "aksPod",
    resourceName: `${namespace}/${podName}`,
    severity: "high",
    issueType: "unauthorizedPodExec",
    namespace,
    podName,
    containerName: container.name || "unknown",
    imageName: image.name || "unknown",
    binary,
    arguments: args,
    nodeName: event.node_name || event.nodeName || "unknown",
    timestamp: event.time || new Date().toISOString(),
    detectedAt: event.time || new Date().toISOString(),
    description: `Live eBPF detected suspicious process execution in AKS pod ${namespace}/${podName}: ${binary} ${args}`,
    rawTetragonEvent: event,
  };
}

async function publishTelemetry(telemetry) {
  await producer.send({
    topic: RAW_TOPIC,
    messages: [
      {
        key: telemetry.resourceName,
        value: JSON.stringify(telemetry),
      },
    ],
  });

  console.log(
    `[tetragon-bridge] Published ${telemetry.issueType} to ${RAW_TOPIC}: ${telemetry.resourceName}`
  );
}

async function processLine(line) {
  const trimmed = line.trim();

  if (!trimmed) {
    return;
  }

  let event;

  try {
    event = JSON.parse(trimmed);
  } catch (error) {
    console.error("[tetragon-bridge] Failed to parse JSON line:", error.message);
    return;
  }

  const telemetry = classifyTetragonProcessExec(event);

  if (!telemetry) {
    return;
  }

  await publishTelemetry(telemetry);
}

async function readNewLines() {
  if (!fs.existsSync(LOG_PATH)) {
    console.log(`[tetragon-bridge] Waiting for log file: ${LOG_PATH}`);
    return;
  }

  const stats = fs.statSync(LOG_PATH);

  if (stats.size < filePosition) {
    console.log("[tetragon-bridge] Log rotation detected. Resetting position.");
    filePosition = 0;
    leftover = "";
  }

  if (stats.size === filePosition) {
    return;
  }

  const stream = fs.createReadStream(LOG_PATH, {
    start: filePosition,
    end: stats.size - 1,
    encoding: "utf8",
  });

  filePosition = stats.size;

  let chunk = "";

  for await (const data of stream) {
    chunk += data;
  }

  const combined = leftover + chunk;
  const lines = combined.split("\n");

  leftover = lines.pop() || "";

  for (const line of lines) {
    await processLine(line);
  }
}

async function start() {
  console.log("[tetragon-bridge] Starting Tetragon to Kafka bridge");
  console.log(`[tetragon-bridge] Log path: ${LOG_PATH}`);
  console.log(`[tetragon-bridge] Raw telemetry topic: ${RAW_TOPIC}`);
  console.log(
    `[tetragon-bridge] Monitored namespaces: ${MONITORED_NAMESPACES.join(", ")}`
  );

  await producer.connect();

  if (fs.existsSync(LOG_PATH) && !READ_FROM_START) {
    filePosition = fs.statSync(LOG_PATH).size;
    console.log("[tetragon-bridge] Starting from end of current log file");
  }

  setInterval(() => {
    readNewLines().catch((error) => {
      console.error("[tetragon-bridge] Read loop error:", error);
    });
  }, 2000);
}

async function shutdown() {
  console.log("[tetragon-bridge] Shutting down...");
  await producer.disconnect();
  process.exit(0);
}

if (require.main === module) {
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  start().catch(async (error) => {
    console.error("[tetragon-bridge] Fatal startup error:", error);
    try {
      await producer.disconnect();
    } catch (_) {}
    process.exit(1);
  });
}

module.exports = {
  classifyTetragonProcessExec,
  getPodFromProcess,
  getProcessFromTetragonEvent,
  isSuspiciousProcess,
};
