require("dotenv").config({ path: __dirname + "/.env" });

process.env.KAFKAJS_NO_PARTITIONER_WARNING =
  process.env.KAFKAJS_NO_PARTITIONER_WARNING || "1";

const os = require("os");
const { Kafka, Partitioners, logLevel } = require("kafkajs");
const { DefaultAzureCredential } = require("@azure/identity");
const { SecretClient } = require("@azure/keyvault-secrets");

let kafkaInstance = null;
let kafkaConfigPromise = null;

const DEFAULT_KAFKA_LOG_LEVEL = "WARN";

function shouldUseAzureKeyVault() {
  return String(process.env.USE_AZURE_KEY_VAULT).toLowerCase() === "true";
}

function getBooleanEnv(name, defaultValue = false) {
  const value = process.env[name];

  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  return ["true", "1", "yes", "y"].includes(String(value).toLowerCase());
}

function getNumberEnv(name, defaultValue) {
  const rawValue = process.env[name];

  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return defaultValue;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    console.warn(
      `[Kafka] Invalid numeric env value for ${name}: ${rawValue}. Using default ${defaultValue}.`
    );
    return defaultValue;
  }

  return parsedValue;
}

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Check backend/streaming/.env or Azure Key Vault settings.`
    );
  }

  return value;
}

function getProcessRole() {
  const scriptPath = process.argv[1] || "unknown-process";
  const scriptName = scriptPath
    .split("/")
    .pop()
    .replace(".js", "");

  return scriptName || "unknown-process";
}

function buildClientId() {
  const baseClientId = process.env.KAFKA_CLIENT_ID || "aura-v2";
  const role = getProcessRole();
  const host = os.hostname().replace(/[^a-zA-Z0-9-_]/g, "-");
  const pid = process.pid;

  return `${baseClientId}-${role}-${host}-${pid}`;
}

function getKafkaLogLevel() {
  const configuredLevel = String(
    process.env.KAFKA_LOG_LEVEL || DEFAULT_KAFKA_LOG_LEVEL
  ).toUpperCase();

  const levels = {
    NOTHING: logLevel.NOTHING,
    ERROR: logLevel.ERROR,
    WARN: logLevel.WARN,
    INFO: logLevel.INFO,
    DEBUG: logLevel.DEBUG,
  };

  return levels[configuredLevel] ?? logLevel.WARN;
}

function shouldSuppressKafkaLog(message) {
  const suppressConnectionNoise = getBooleanEnv(
    "KAFKA_SUPPRESS_CONNECTION_NOISE",
    true
  );

  const alwaysNoisyMessages = [
    "Response without match",
    "KafkaJS v2.0.0 switched default partitioner",
  ];

  const connectionNoiseMessages = [
    "Connection error: read ECONNRESET",
    "Client network socket disconnected before secure TLS connection was established",
    "The coordinator is not aware of this member, re-joining the group",
    "Response Heartbeat",
    "Restarting the consumer",
  ];

  if (alwaysNoisyMessages.some((item) => message.includes(item))) {
    return true;
  }

  if (
    suppressConnectionNoise &&
    connectionNoiseMessages.some((item) => message.includes(item))
  ) {
    return true;
  }

  return false;
}

function createKafkaLogCreator() {
  return () => ({ namespace, level, label, log }) => {
    const message = log.message || "";

    if (shouldSuppressKafkaLog(message)) {
      return;
    }

    const logPayload = {
      level: label,
      namespace,
      message,
    };

    if (log.broker) {
      logPayload.broker = log.broker;
    }

    if (log.groupId) {
      logPayload.groupId = log.groupId;
    }

    if (log.clientId) {
      logPayload.clientId = log.clientId;
    }

    if (level <= logLevel.ERROR) {
      console.error("[Kafka]", logPayload);
      return;
    }

    if (level <= logLevel.WARN) {
      console.warn("[Kafka]", logPayload);
      return;
    }

    console.log("[Kafka]", logPayload);
  };
}

async function getSecretFromKeyVault(secretClient, secretName) {
  const secret = await secretClient.getSecret(secretName);

  if (!secret.value) {
    throw new Error(`Azure Key Vault secret "${secretName}" has no value.`);
  }

  return secret.value;
}

async function loadKafkaConfigFromEnv() {
  return {
    broker: requireEnv("KAFKA_BROKER"),
    username: requireEnv("KAFKA_USERNAME"),
    password: requireEnv("KAFKA_PASSWORD"),
  };
}

async function loadKafkaConfigFromAzureKeyVault() {
  const keyVaultUrl =
    process.env.AZURE_KEY_VAULT_URL || process.env.KEY_VAULT_URL;

  if (!keyVaultUrl) {
    throw new Error(
      "USE_AZURE_KEY_VAULT is true, but AZURE_KEY_VAULT_URL is missing."
    );
  }

  const brokerSecretName =
    process.env.KAFKA_BROKER_SECRET_NAME || "KAFKA-BROKER";

  const usernameSecretName =
    process.env.KAFKA_USERNAME_SECRET_NAME || "KAFKA-USERNAME";

  const passwordSecretName =
    process.env.KAFKA_PASSWORD_SECRET_NAME || "KAFKA-PASSWORD";

  const credential = new DefaultAzureCredential();
  const secretClient = new SecretClient(keyVaultUrl, credential);

  const [broker, username, password] = await Promise.all([
    getSecretFromKeyVault(secretClient, brokerSecretName),
    getSecretFromKeyVault(secretClient, usernameSecretName),
    getSecretFromKeyVault(secretClient, passwordSecretName),
  ]);

  return {
    broker,
    username,
    password,
  };
}

async function loadKafkaConfig() {
  if (!kafkaConfigPromise) {
    kafkaConfigPromise = shouldUseAzureKeyVault()
      ? loadKafkaConfigFromAzureKeyVault()
      : loadKafkaConfigFromEnv();
  }

  return kafkaConfigPromise;
}

function describeKafkaMode() {
  return shouldUseAzureKeyVault()
    ? "Azure Key Vault secrets"
    : "local streaming/.env variables";
}

async function getKafkaInstance() {
  if (kafkaInstance) {
    return kafkaInstance;
  }

  const kafkaConfig = await loadKafkaConfig();
  const clientId = buildClientId();

  kafkaInstance = new Kafka({
    clientId,
    brokers: [kafkaConfig.broker],
    ssl: getBooleanEnv("KAFKA_SSL", true),
    sasl: {
      mechanism: process.env.KAFKA_SASL_MECHANISM || "plain",
      username: kafkaConfig.username,
      password: kafkaConfig.password,
    },
    connectionTimeout: getNumberEnv("KAFKA_CONNECTION_TIMEOUT_MS", 30000),
    authenticationTimeout: getNumberEnv("KAFKA_AUTH_TIMEOUT_MS", 30000),
    requestTimeout: getNumberEnv("KAFKA_REQUEST_TIMEOUT_MS", 60000),
    enforceRequestTimeout: true,
    retry: {
      retries: getNumberEnv("KAFKA_RETRIES", 5),
      initialRetryTime: getNumberEnv("KAFKA_INITIAL_RETRY_TIME_MS", 1000),
      maxRetryTime: getNumberEnv("KAFKA_MAX_RETRY_TIME_MS", 30000),
      factor: Number(process.env.KAFKA_RETRY_FACTOR) || 0.2,
      multiplier: Number(process.env.KAFKA_RETRY_MULTIPLIER) || 2,
    },
    logLevel: getKafkaLogLevel(),
    logCreator: createKafkaLogCreator(),
  });

  console.log(
    `[Kafka] Client initialized using ${describeKafkaMode()}. clientId=${clientId}`
  );

  return kafkaInstance;
}

function producer(producerConfig = {}) {
  let producerInstance = null;
  let connected = false;

  async function getProducerInstance() {
    if (!producerInstance) {
      const kafka = await getKafkaInstance();

      producerInstance = kafka.producer({
        createPartitioner: Partitioners.LegacyPartitioner,
        allowAutoTopicCreation: false,
        idempotent: false,
        maxInFlightRequests: getNumberEnv("KAFKA_PRODUCER_MAX_IN_FLIGHT", 1),
        ...producerConfig,
      });
    }

    return producerInstance;
  }

  return {
    async connect() {
      if (connected) {
        return;
      }

      const producerClient = await getProducerInstance();
      await producerClient.connect();
      connected = true;
    },

    async send(payload) {
      const producerClient = await getProducerInstance();

      if (!connected) {
        await producerClient.connect();
        connected = true;
      }

      return producerClient.send(payload);
    },

    async disconnect() {
      if (!producerInstance || !connected) {
        return;
      }

      await producerInstance.disconnect();
      connected = false;
    },
  };
}

function consumer(consumerConfig = {}) {
  let consumerInstance = null;
  let connected = false;

  async function getConsumerInstance() {
    if (!consumerInstance) {
      const kafka = await getKafkaInstance();

      consumerInstance = kafka.consumer({
        sessionTimeout: getNumberEnv("KAFKA_SESSION_TIMEOUT_MS", 45000),
        heartbeatInterval: getNumberEnv("KAFKA_HEARTBEAT_INTERVAL_MS", 5000),
        rebalanceTimeout: getNumberEnv("KAFKA_REBALANCE_TIMEOUT_MS", 90000),
        maxWaitTimeInMs: getNumberEnv("KAFKA_MAX_WAIT_TIME_MS", 5000),
        allowAutoTopicCreation: false,
        retry: {
          retries: getNumberEnv("KAFKA_CONSUMER_RETRIES", 5),
          initialRetryTime: getNumberEnv(
            "KAFKA_CONSUMER_INITIAL_RETRY_TIME_MS",
            1000
          ),
          maxRetryTime: getNumberEnv("KAFKA_CONSUMER_MAX_RETRY_TIME_MS", 30000),
          factor: Number(process.env.KAFKA_CONSUMER_RETRY_FACTOR) || 0.2,
          multiplier:
            Number(process.env.KAFKA_CONSUMER_RETRY_MULTIPLIER) || 2,
        },
        ...consumerConfig,
      });
    }

    return consumerInstance;
  }

  return {
    async connect() {
      if (connected) {
        return;
      }

      const consumerClient = await getConsumerInstance();
      await consumerClient.connect();
      connected = true;
    },

    async subscribe(payload) {
      const consumerClient = await getConsumerInstance();
      return consumerClient.subscribe(payload);
    },

    async run(payload) {
      const consumerClient = await getConsumerInstance();

      return consumerClient.run({
        autoCommit: true,
        partitionsConsumedConcurrently: getNumberEnv(
          "KAFKA_PARTITIONS_CONSUMED_CONCURRENTLY",
          1
        ),
        ...payload,
      });
    },

    async stop() {
      if (!consumerInstance) {
        return;
      }

      return consumerInstance.stop();
    },

    async disconnect() {
      if (!consumerInstance || !connected) {
        return;
      }

      await consumerInstance.disconnect();
      connected = false;
    },
  };
}

module.exports = {
  producer,
  consumer,
  getKafkaInstance,
  loadKafkaConfig,
};