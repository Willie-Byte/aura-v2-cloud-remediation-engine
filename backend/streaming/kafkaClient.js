require("dotenv").config({ path: __dirname + "/.env" });

process.env.KAFKAJS_NO_PARTITIONER_WARNING =
  process.env.KAFKAJS_NO_PARTITIONER_WARNING || "1";

const os = require("os");
const { Kafka, Partitioners, logLevel } = require("kafkajs");
const { DefaultAzureCredential } = require("@azure/identity");
const { SecretClient } = require("@azure/keyvault-secrets");

let kafkaInstance = null;
let kafkaConfigPromise = null;

function shouldUseAzureKeyVault() {
  return String(process.env.USE_AZURE_KEY_VAULT).toLowerCase() === "true";
}

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
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
    process.env.KAFKA_LOG_LEVEL || "WARN"
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

function createKafkaLogCreator() {
  return () => ({ namespace, level, label, log }) => {
    const message = log.message || "";

    const noisyMessages = [
      "Response without match",
      "KafkaJS v2.0.0 switched default partitioner",
    ];

    if (noisyMessages.some((noisyMessage) => message.includes(noisyMessage))) {
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

async function getKafkaInstance() {
  if (kafkaInstance) {
    return kafkaInstance;
  }

  const kafkaConfig = await loadKafkaConfig();
  const clientId = buildClientId();

  kafkaInstance = new Kafka({
    clientId,
    brokers: [kafkaConfig.broker],
    ssl: true,
    sasl: {
      mechanism: "plain",
      username: kafkaConfig.username,
      password: kafkaConfig.password,
    },
    connectionTimeout: Number(process.env.KAFKA_CONNECTION_TIMEOUT_MS) || 15000,
    authenticationTimeout:
      Number(process.env.KAFKA_AUTH_TIMEOUT_MS) || 15000,
    requestTimeout: Number(process.env.KAFKA_REQUEST_TIMEOUT_MS) || 45000,
    retry: {
      retries: Number(process.env.KAFKA_RETRIES) || 10,
      initialRetryTime:
        Number(process.env.KAFKA_INITIAL_RETRY_TIME_MS) || 500,
      maxRetryTime:
        Number(process.env.KAFKA_MAX_RETRY_TIME_MS) || 30000,
      factor: Number(process.env.KAFKA_RETRY_FACTOR) || 0.2,
      multiplier: Number(process.env.KAFKA_RETRY_MULTIPLIER) || 2,
    },
    logLevel: getKafkaLogLevel(),
    logCreator: createKafkaLogCreator(),
  });

  console.log(
    shouldUseAzureKeyVault()
      ? `Kafka client initialized using Azure Key Vault secrets. clientId=${clientId}`
      : `Kafka client initialized using local environment variables. clientId=${clientId}`
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
        sessionTimeout:
          Number(process.env.KAFKA_SESSION_TIMEOUT_MS) || 30000,
        heartbeatInterval:
          Number(process.env.KAFKA_HEARTBEAT_INTERVAL_MS) || 3000,
        rebalanceTimeout:
          Number(process.env.KAFKA_REBALANCE_TIMEOUT_MS) || 60000,
        allowAutoTopicCreation: false,
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
      return consumerClient.run(payload);
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