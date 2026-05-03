const {
  getPolicyForIssueType,
  getExpectedAction,
  getAllowedActions,
  isSupportedIssueType,
} = require("./remediationPolicy");

function validateRemediationPlan(command, errors) {
  const plan = command.remediationPlan;

  if (!plan || typeof plan !== "object") {
    errors.push("Missing remediationPlan.");
    return;
  }

  if (plan.provider !== command.cloudProvider) {
    errors.push(
      `remediationPlan.provider "${plan.provider}" does not match cloudProvider "${command.cloudProvider}".`
    );
  }

  if (plan.action !== command.action) {
    errors.push(
      `remediationPlan.action "${plan.action}" does not match action "${command.action}".`
    );
  }

  if (plan.resourceType !== command.resourceType) {
    errors.push(
      `remediationPlan.resourceType "${plan.resourceType}" does not match resourceType "${command.resourceType}".`
    );
  }

  if (plan.resourceName !== command.targetResource) {
    errors.push(
      `remediationPlan.resourceName "${plan.resourceName}" does not match targetResource "${command.targetResource}".`
    );
  }

  if (!Array.isArray(plan.steps) || plan.steps.length === 0) {
    errors.push("remediationPlan.steps must be a non-empty array.");
  } else {
    const invalidStep = plan.steps.find(
      (step) => typeof step !== "string" || step.trim().length === 0
    );

    if (invalidStep !== undefined) {
      errors.push("remediationPlan.steps must only contain non-empty strings.");
    }
  }

  if (!plan.riskLevel) {
    errors.push("Missing remediationPlan.riskLevel.");
  }

  if (plan.requiresApproval !== true) {
    errors.push("remediationPlan.requiresApproval must be true.");
  }
}

function validateAgenticValidation(command, errors) {
  const validation = command.agenticValidation;

  if (!validation || typeof validation !== "object") {
    errors.push("Missing agenticValidation. AI-audited remediation is required.");
    return;
  }

  if (validation.enabled !== true) {
    errors.push("agenticValidation.enabled must be true.");
  }

  if (!validation.auditStatus) {
    errors.push("Missing agenticValidation.auditStatus.");
  } else if (!["PASS", "CORRECTED"].includes(validation.auditStatus)) {
    errors.push(
      `agenticValidation.auditStatus "${validation.auditStatus}" is not allowed. Expected "PASS" or "CORRECTED".`
    );
  }

  if (!validation.auditNotes) {
    errors.push("Missing agenticValidation.auditNotes.");
  }

  if (!validation.validatedAt) {
    errors.push("Missing agenticValidation.validatedAt.");
  }
}

function validatePqcRemediation(command, errors) {
  if (command.issueType !== "nonQuantumSafeCrypto") {
    return;
  }

  const plan = command.remediationPlan || {};
  const stepsText = Array.isArray(plan.steps) ? plan.steps.join(" ") : "";
  const remediationText = `${command.generatedCode || ""} ${stepsText}`.toLowerCase();

  const mentionsTls13 =
    remediationText.includes("tls 1.3") ||
    remediationText.includes("tls1.3");

  const mentionsPqc =
    remediationText.includes("ml-kem") ||
    remediationText.includes("kyber") ||
    remediationText.includes("pqc") ||
    remediationText.includes("post-quantum") ||
    remediationText.includes("quantum-safe");

  const mentionsHybrid =
    remediationText.includes("hybrid") ||
    remediationText.includes("hybrid key exchange");

  if (command.action !== "enforcePQCTls1_3") {
    errors.push(
      'PQC remediation must use action "enforcePQCTls1_3".'
    );
  }

  if (plan.riskLevel !== "critical") {
    errors.push(
      'PQC remediation must have remediationPlan.riskLevel set to "critical".'
    );
  }

  if (plan.requiresApproval !== true) {
    errors.push("PQC remediation must require human approval.");
  }

  if (!mentionsTls13) {
    errors.push("PQC remediation must mention TLS 1.3.");
  }

  if (!mentionsPqc) {
    errors.push("PQC remediation must mention ML-KEM, Kyber, PQC, post-quantum, or quantum-safe cryptography.");
  }

  if (!mentionsHybrid) {
    errors.push("PQC remediation must mention hybrid key exchange or hybrid cryptography.");
  }
}

function validateRemediationCommand(command) {
  const errors = [];

  if (!command || typeof command !== "object") {
    return {
      valid: false,
      errors: ["Command payload must be a valid object."],
    };
  }

  const allowedActions = getAllowedActions();

  if (!command.remediationId) {
    errors.push("Missing remediationId.");
  }

  if (!command.threatId) {
    errors.push("Missing threatId.");
  }

  if (!command.action) {
    errors.push("Missing action.");
  } else if (!allowedActions.includes(command.action)) {
    errors.push(`Action "${command.action}" is not allowed.`);
  }

  if (!command.targetResource) {
    errors.push("Missing targetResource.");
  }

  if (!command.resourceType) {
    errors.push("Missing resourceType.");
  }

  if (!command.cloudProvider) {
    errors.push("Missing cloudProvider.");
  }

  if (!command.issueType) {
    errors.push("Missing issueType.");
  } else if (!isSupportedIssueType(command.issueType)) {
    errors.push(`Issue type "${command.issueType}" is not supported.`);
  }

  if (command.issueType && isSupportedIssueType(command.issueType)) {
    const expectedAction = getExpectedAction(command.issueType);

    if (command.action && command.action !== expectedAction) {
      errors.push(
        `Action "${command.action}" does not match issueType "${command.issueType}". Expected "${expectedAction}".`
      );
    }

    const policy = getPolicyForIssueType(command.issueType);

    if (
      command.resourceType &&
      policy &&
      policy.allowedResourceTypes.length > 0 &&
      !policy.allowedResourceTypes.includes(command.resourceType)
    ) {
      errors.push(
        `Resource type "${command.resourceType}" is not allowed for issueType "${command.issueType}". Expected one of: ${policy.allowedResourceTypes.join(
          ", "
        )}.`
      );
    }
  }

  if (!command.status) {
    errors.push("Missing status.");
  } else if (command.status !== "pending") {
    errors.push(`Status "${command.status}" is not allowed. Expected "pending".`);
  }

  if (!command.executionMode) {
    errors.push("Missing executionMode.");
  } else if (command.executionMode !== "simulate") {
    errors.push(
      `Execution mode "${command.executionMode}" is not allowed. Only "simulate" is currently supported.`
    );
  }

  if (!command.generatedAt) {
    errors.push("Missing generatedAt.");
  }

  if (!command.generatedCode) {
    errors.push("Missing generatedCode.");
  }

  validateRemediationPlan(command, errors);
  validateAgenticValidation(command, errors);
  validatePqcRemediation(command, errors);

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateRemediationCommand,
};