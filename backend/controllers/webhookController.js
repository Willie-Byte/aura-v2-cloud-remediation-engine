const Alert = require("../models/Alert");
const AuditLog = require("../models/AuditLog");

const azureIssueTypeMap = {
  publicStorageAccess: {
    resourceType: "storageAccount",
    description: "Storage account allows public blob access",
    severity: "high",
  },
  publicSSHAccess: {
    resourceType: "networkSecurityGroup",
    description: "Network security group allows public SSH access on port 22",
    severity: "high",
  },
  publicRDPAccess: {
    resourceType: "networkSecurityGroup",
    description: "Network security group allows public RDP access on port 3389",
    severity: "high",
  },
  unencryptedDatabase: {
    resourceType: "sqlDatabase",
    description: "Database encryption is not enabled",
    severity: "critical",
  },
  weakTlsVersion: {
    resourceType: "appService",
    description: "Service allows weak TLS versions below 1.2",
    severity: "medium",
  },
  nonQuantumSafeCrypto: {
    resourceType: "appService",
    description:
      "Azure resource uses non-quantum-safe cryptography. Enforce TLS 1.3 with Kyber/ML-KEM hybrid key exchange.",
    severity: "critical",
  },
};

const awsIssueTypeMap = {
  publicStorageAccess: {
    resourceType: "s3Bucket",
    description: "S3 bucket allows public access",
    severity: "high",
  },
  publicSSHAccess: {
    resourceType: "securityGroup",
    description: "Security group allows public SSH access on port 22",
    severity: "high",
  },
  publicRDPAccess: {
    resourceType: "securityGroup",
    description: "Security group allows public RDP access on port 3389",
    severity: "high",
  },
  unencryptedDatabase: {
    resourceType: "rdsInstance",
    description: "RDS encryption is not enabled",
    severity: "critical",
  },
  weakTlsVersion: {
    resourceType: "loadBalancer",
    description: "Service allows weak TLS versions below 1.2",
    severity: "medium",
  },
  nonQuantumSafeCrypto: {
    resourceType: "applicationLoadBalancer",
    description:
      "AWS resource uses non-quantum-safe cryptography. Enforce TLS 1.3 with Kyber/ML-KEM hybrid key exchange where supported.",
    severity: "critical",
  },
};

const gcpIssueTypeMap = {
  publicStorageAccess: {
    resourceType: "cloudStorageBucket",
    description: "Cloud Storage bucket allows public access",
    severity: "high",
  },
  publicSSHAccess: {
    resourceType: "firewallRule",
    description: "Firewall rule allows public SSH access on port 22",
    severity: "high",
  },
  publicRDPAccess: {
    resourceType: "firewallRule",
    description: "Firewall rule allows public RDP access on port 3389",
    severity: "high",
  },
  unencryptedDatabase: {
    resourceType: "cloudSqlInstance",
    description: "Cloud SQL encryption is not enabled",
    severity: "critical",
  },
  weakTlsVersion: {
    resourceType: "loadBalancer",
    description: "Service allows weak TLS versions below 1.2",
    severity: "medium",
  },
  nonQuantumSafeCrypto: {
    resourceType: "gcpLoadBalancer",
    description:
      "GCP resource uses non-quantum-safe cryptography. Enforce TLS 1.3 with Kyber/ML-KEM hybrid key exchange where supported.",
    severity: "critical",
  },
};

const getNestedValue = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return undefined;
};

const buildMappedIssue = (payload, issueTypeMap) => {
  const issueType =
    getNestedValue(
      payload.issueType,
      payload.detail?.issueType,
      payload.metadata?.issueType
    ) || "publicStorageAccess";

  const mappedIssue = issueTypeMap[issueType] || {
    resourceType:
      getNestedValue(
        payload.resourceType,
        payload.detail?.resourceType,
        payload.detail?.service
      ) || "unknownResource",
    description:
      getNestedValue(
        payload.description,
        payload.detail?.description,
        payload.rawMessage
      ) || "Webhook alert received",
    severity:
      getNestedValue(
        payload.severity,
        payload.detail?.severity,
        payload.metadata?.severity
      ) || "medium",
  };

  return {
    issueType,
    mappedIssue,
  };
};

const buildCryptoMetadata = (payload) => {
  const harvestNowDecryptLaterRisk =
    getNestedValue(
      payload.harvestNowDecryptLaterRisk,
      payload.metadata?.harvestNowDecryptLaterRisk,
      payload.detail?.harvestNowDecryptLaterRisk,
      payload.detail?.metadata?.harvestNowDecryptLaterRisk
    ) === true;

  return {
    tlsVersion:
      getNestedValue(
        payload.tlsVersion,
        payload.detail?.tlsVersion,
        payload.metadata?.tlsVersion,
        payload.detail?.metadata?.tlsVersion
      ) || "",
    keyExchange:
      getNestedValue(
        payload.keyExchange,
        payload.detail?.keyExchange,
        payload.metadata?.keyExchange,
        payload.detail?.metadata?.keyExchange
      ) || "",
    encryptionProfile:
      getNestedValue(
        payload.encryptionProfile,
        payload.detail?.encryptionProfile,
        payload.metadata?.encryptionProfile,
        payload.detail?.metadata?.encryptionProfile
      ) || "",
    pqcReady: getNestedValue(
      payload.pqcReady,
      payload.detail?.pqcReady,
      payload.metadata?.pqcReady,
      payload.detail?.metadata?.pqcReady,
      null
    ),
    requiredStandard:
      getNestedValue(
        payload.requiredStandard,
        payload.detail?.requiredStandard,
        payload.metadata?.requiredStandard,
        payload.detail?.metadata?.requiredStandard
      ) || "",
    harvestNowDecryptLaterRisk,
  };
};

const buildCryptoDescription = (payload, fallbackDescription) => {
  const cryptoMetadata = buildCryptoMetadata(payload);

  const tlsVersion = cryptoMetadata.tlsVersion || "unknown";
  const keyExchange = cryptoMetadata.keyExchange || "unknown";
  const encryptionProfile =
    cryptoMetadata.encryptionProfile || "classical-only";

  if (
    payload.issueType === "nonQuantumSafeCrypto" ||
    payload.detail?.issueType === "nonQuantumSafeCrypto" ||
    payload.metadata?.issueType === "nonQuantumSafeCrypto" ||
    cryptoMetadata.harvestNowDecryptLaterRisk === true ||
    cryptoMetadata.pqcReady === false
  ) {
    return `Resource uses non-quantum-safe cryptography. Current profile: ${encryptionProfile}, TLS version: ${tlsVersion}, key exchange: ${keyExchange}. Enforce TLS 1.3 with Kyber/ML-KEM hybrid key exchange.`;
  }

  return fallbackDescription;
};

const normalizeProviderPayload = (payload, defaultSource, defaultCloudProvider) => {
  return {
    source: payload.source || defaultSource,
    cloudProvider: payload.cloudProvider || defaultCloudProvider,
    resourceType:
      payload.resourceType ||
      payload.detail?.resourceType ||
      payload.detail?.service,
    resourceName:
      payload.resourceName ||
      payload.resourceId ||
      payload.detail?.resourceName ||
      payload.detail?.resourceId ||
      payload.resources?.[0],
    severity: payload.severity || payload.detail?.severity,
    issueType: payload.issueType || payload.detail?.issueType,
    description: payload.description || payload.detail?.description,
    status: payload.status || "open",

    tlsVersion: payload.tlsVersion || payload.detail?.tlsVersion,
    keyExchange: payload.keyExchange || payload.detail?.keyExchange,
    encryptionProfile:
      payload.encryptionProfile || payload.detail?.encryptionProfile,
    pqcReady: payload.pqcReady ?? payload.detail?.pqcReady,
    requiredStandard:
      payload.requiredStandard || payload.detail?.requiredStandard,
    harvestNowDecryptLaterRisk:
      payload.harvestNowDecryptLaterRisk ||
      payload.detail?.harvestNowDecryptLaterRisk,

    metadata: payload.metadata || payload.detail?.metadata,
    rawMessage: payload.rawMessage || payload.detail?.rawMessage,
    detail: payload.detail,
    resources: payload.resources,
  };
};

const createWebhookAlert = async ({
  payload,
  issueTypeMap,
  defaultSource,
  defaultCloudProvider,
  successMessage,
  errorMessage,
  res,
}) => {
  try {
    const normalizedPayload = normalizeProviderPayload(
      payload,
      defaultSource,
      defaultCloudProvider
    );

    const { issueType, mappedIssue } = buildMappedIssue(
      normalizedPayload,
      issueTypeMap
    );

    const cryptoMetadata = buildCryptoMetadata(normalizedPayload);

    const resourceName =
      normalizedPayload.resourceName || "unknown-resource";

    const description = buildCryptoDescription(
      normalizedPayload,
      normalizedPayload.description ||
        normalizedPayload.rawMessage ||
        mappedIssue.description
    );

    const alert = new Alert({
      source: normalizedPayload.source || defaultSource,
      cloudProvider: normalizedPayload.cloudProvider || defaultCloudProvider,
      resourceType: normalizedPayload.resourceType || mappedIssue.resourceType,
      resourceName,
      severity: normalizedPayload.severity || mappedIssue.severity,
      issueType,
      description,
      status: normalizedPayload.status || "open",
      cryptoMetadata,
    });

    const savedAlert = await alert.save();

    await AuditLog.create({
      alertId: savedAlert._id,
      action: "ALERT_CREATED",
      message: `Webhook alert created for resource "${savedAlert.resourceName}" with issue type "${savedAlert.issueType}" from source "${savedAlert.source}".`,
    });

    res.status(201).json({
      message: successMessage,
      alert: savedAlert,
    });
  } catch (error) {
    console.error(`${defaultCloudProvider} webhook error:`, error);

    res.status(500).json({
      message: errorMessage,
      error: error.message,
    });
  }
};

// @desc    Handle Azure webhook alert intake
// @route   POST /api/webhooks/azure
// @access  Public
const handleAzureWebhook = async (req, res) => {
  await createWebhookAlert({
    payload: req.body,
    issueTypeMap: azureIssueTypeMap,
    defaultSource: "azure-event-grid",
    defaultCloudProvider: "azure",
    successMessage: "Azure webhook alert processed successfully",
    errorMessage: "Failed to process Azure webhook.",
    res,
  });
};

// @desc    Handle AWS webhook alert intake
// @route   POST /api/webhooks/aws
// @access  Public
const handleAwsWebhook = async (req, res) => {
  await createWebhookAlert({
    payload: req.body,
    issueTypeMap: awsIssueTypeMap,
    defaultSource: "aws-eventbridge",
    defaultCloudProvider: "aws",
    successMessage: "AWS webhook alert processed successfully",
    errorMessage: "Failed to process AWS webhook.",
    res,
  });
};

// @desc    Handle GCP webhook alert intake
// @route   POST /api/webhooks/gcp
// @access  Public
const handleGcpWebhook = async (req, res) => {
  await createWebhookAlert({
    payload: req.body,
    issueTypeMap: gcpIssueTypeMap,
    defaultSource: "gcp-eventarc",
    defaultCloudProvider: "gcp",
    successMessage: "GCP webhook alert processed successfully",
    errorMessage: "Failed to process GCP webhook.",
    res,
  });
};

module.exports = {
  handleAzureWebhook,
  handleAwsWebhook,
  handleGcpWebhook,
};