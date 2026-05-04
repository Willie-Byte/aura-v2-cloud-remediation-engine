const remediationPolicy = {
  publicStorageAccess: {
    expectedAction: "disablePublicAccess",
    allowedResourceTypes: [
      "storageAccount",
      "s3Bucket",
      "cloudStorageBucket",
    ],
    riskLevel: "medium",
    severityScore: 20,
    requiresApproval: true,
    category: "data_exposure",
    description:
      "Disable public access on cloud storage resources to prevent unauthorized data exposure.",
    remediationGoal:
      "Ensure storage resources are private by default and only accessible through approved identities or trusted networks.",
  },

  publicSSHAccess: {
    expectedAction: "restrictSSHAccess",
    allowedResourceTypes: [
      "networkSecurityGroup",
      "securityGroup",
      "firewallRule",
    ],
    riskLevel: "high",
    severityScore: 35,
    requiresApproval: true,
    category: "network_exposure",
    description:
      "Restrict SSH access to trusted IP ranges and remove public 0.0.0.0/0 exposure on port 22.",
    remediationGoal:
      "Reduce the attack surface by allowing SSH only from approved administrator networks.",
  },

  publicRDPAccess: {
    expectedAction: "restrictRDPAccess",
    allowedResourceTypes: [
      "networkSecurityGroup",
      "securityGroup",
      "firewallRule",
    ],
    riskLevel: "high",
    severityScore: 35,
    requiresApproval: true,
    category: "network_exposure",
    description:
      "Restrict RDP access to trusted IP ranges and remove public 0.0.0.0/0 exposure on port 3389.",
    remediationGoal:
      "Reduce the attack surface by allowing RDP only from approved administrator networks.",
  },

  unencryptedDatabase: {
    expectedAction: "enableDatabaseEncryption",
    allowedResourceTypes: [
      "sqlDatabase",
      "rdsInstance",
      "cloudSqlInstance",
    ],
    riskLevel: "critical",
    severityScore: 45,
    requiresApproval: true,
    category: "data_protection",
    description:
      "Enable encryption on database resources to protect sensitive data at rest.",
    remediationGoal:
      "Ensure databases use encryption at rest with managed keys or approved customer-managed keys.",
  },

  weakTlsVersion: {
    expectedAction: "enforceModernTLS",
    allowedResourceTypes: [
      "appService",
      "applicationGateway",
      "apiManagement",
      "loadBalancer",
      "cloudFrontDistribution",
      "applicationLoadBalancer",
      "gcpLoadBalancer",
    ],
    riskLevel: "medium",
    severityScore: 30,
    requiresApproval: true,
    category: "crypto_hardening",
    description:
      "Enforce TLS 1.2 or newer and disable legacy TLS versions that expose services to downgrade or weak cryptographic risks.",
    remediationGoal:
      "Ensure public-facing services reject weak TLS versions and use modern secure transport settings.",
  },


  unauthorizedPodExec: {
    expectedAction: "investigateUnauthorizedPodExec",
    allowedResourceTypes: [
      "aksPod",
      "kubernetesPod",
      "container",
    ],
    riskLevel: "high",
    severityScore: 40,
    requiresApproval: true,
    category: "runtime_security",
    description:
      "Investigate suspicious process execution inside an AKS pod detected by live eBPF telemetry. Validate whether the exec activity was authorized, inspect the workload, review Kubernetes RBAC, and recommend least-privilege restrictions before enforcement.",
    remediationGoal:
      "Create a safe, human-reviewed runtime security response for suspicious pod exec activity without automatically disrupting production workloads.",
  },

  nonQuantumSafeCrypto: {
    expectedAction: "enforcePQCTls1_3",
    allowedResourceTypes: [
      "appService",
      "applicationGateway",
      "keyVault",
      "apiManagement",
      "loadBalancer",
      "cloudFrontDistribution",
      "applicationLoadBalancer",
      "kmsKey",
      "secretManager",
      "gcpLoadBalancer",
      "gcpKmsKey",
      "gcpSecretManager",
    ],
    riskLevel: "critical",
    severityScore: 50,
    requiresApproval: true,
    category: "post_quantum_crypto",
    description:
      "Enforce TLS 1.3 with Kyber/ML-KEM hybrid key exchange to reduce harvest-now-decrypt-later risk.",
    remediationGoal:
      "Move sensitive services toward quantum-resistant cryptographic posture by enforcing TLS 1.3 and PQC-ready hybrid key exchange where supported.",
    pqcRequired: true,
    requiredStandard: "TLS1.3_ML-KEM_HYBRID",
    threatModel:
      "Harvest-now-decrypt-later attacks where encrypted traffic is captured today and decrypted later using future quantum capabilities.",
  },
};

function getPolicyForIssueType(issueType) {
  return remediationPolicy[issueType] || null;
}

function getExpectedAction(issueType) {
  return remediationPolicy[issueType]?.expectedAction || null;
}

function getAllowedActions() {
  return [
    ...new Set(
      Object.values(remediationPolicy).map((policy) => policy.expectedAction)
    ),
  ];
}

function isSupportedIssueType(issueType) {
  return Boolean(remediationPolicy[issueType]);
}

function getAllowedResourceTypes(issueType) {
  return remediationPolicy[issueType]?.allowedResourceTypes || [];
}

function getRiskLevel(issueType) {
  return remediationPolicy[issueType]?.riskLevel || "medium";
}

function getSeverityScore(issueType) {
  return remediationPolicy[issueType]?.severityScore || 10;
}

function requiresApproval(issueType) {
  return remediationPolicy[issueType]?.requiresApproval !== false;
}

function isPqcRequired(issueType) {
  return remediationPolicy[issueType]?.pqcRequired === true;
}

function getRemediationGoal(issueType) {
  return remediationPolicy[issueType]?.remediationGoal || null;
}

function getPolicyCategory(issueType) {
  return remediationPolicy[issueType]?.category || "general_security";
}

module.exports = {
  remediationPolicy,
  getPolicyForIssueType,
  getExpectedAction,
  getAllowedActions,
  getAllowedResourceTypes,
  getRiskLevel,
  getSeverityScore,
  requiresApproval,
  isSupportedIssueType,
  isPqcRequired,
  getRemediationGoal,
  getPolicyCategory,
};