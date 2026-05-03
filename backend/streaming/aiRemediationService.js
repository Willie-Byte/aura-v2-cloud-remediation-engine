require("dotenv").config({ path: __dirname + "/.env" });
const OpenAI = require("openai");
const {
  getPolicyForIssueType,
  getExpectedAction,
} = require("./remediationPolicy");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function extractJson(text) {
  if (!text) {
    throw new Error("AI returned an empty remediation response.");
  }

  const trimmed = text.trim();

  if (trimmed.startsWith("```")) {
    return trimmed
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
  }

  return trimmed;
}

function normalizeSteps(steps, fallbackStep) {
  if (!Array.isArray(steps)) {
    return [fallbackStep];
  }

  const cleanedSteps = steps
    .filter((step) => typeof step === "string")
    .map((step) => step.trim())
    .filter(Boolean);

  return cleanedSteps.length > 0 ? cleanedSteps : [fallbackStep];
}

async function auditRemediationWithAI({
  threat,
  policy,
  expectedAction,
  remediationJson,
}) {
  const auditPrompt = `
You are Aura's Terraform and cloud security remediation auditor.

Review this AI-generated remediation JSON before it is allowed into the remediation pipeline.

Threat:
${JSON.stringify(threat, null, 2)}

Approved policy:
${JSON.stringify(policy, null, 2)}

Expected action:
${expectedAction}

Generated remediation JSON:
${JSON.stringify(remediationJson, null, 2)}

Return rules:
- If the remediation is valid, safe, specific, and follows the expected action, return exactly:
PASS
- If the remediation is unsafe, invalid, vague, or does not match the expected action, return ONLY corrected valid JSON with this exact shape:
{
  "generatedCode": "<corrected safe remediation plan text>",
  "steps": [
    "<safe step 1>",
    "<safe step 2>",
    "<safe step 3>"
  ]
}

Security rules:
- Do not use markdown
- Do not wrap the response in triple backticks
- Do not change the cloud provider
- Do not change the issue type
- Do not change the resource name
- Do not change the expected action
- Do not recommend destructive changes
- Do not recommend apply mode
- The remediation must be safe for human review
- The remediation must match this expected action: ${expectedAction}
`;

  const auditResponse = await client.responses.create({
    model: "gpt-4.1-mini",
    input: auditPrompt,
  });

  const auditText = auditResponse.output_text?.trim();

  if (!auditText) {
    throw new Error("AI auditor returned an empty response.");
  }

  if (auditText === "PASS") {
    return {
      remediationJson,
      auditStatus: "PASS",
      auditNotes: "AI auditor approved the generated remediation.",
    };
  }

  const cleanAuditJson = extractJson(auditText);

  let correctedJson;
  try {
    correctedJson = JSON.parse(cleanAuditJson);
  } catch (error) {
    throw new Error(
      `Failed to parse AI auditor corrected JSON: ${cleanAuditJson}`
    );
  }

  return {
    remediationJson: correctedJson,
    auditStatus: "CORRECTED",
    auditNotes: "AI auditor corrected the generated remediation.",
  };
}

async function generateRemediationCommandFromAI(threat) {
  const policy = getPolicyForIssueType(threat.issueType);
  const expectedAction = getExpectedAction(threat.issueType);

  if (!policy || !expectedAction) {
    throw new Error(`Unsupported issueType for AI remediation: ${threat.issueType}`);
  }

  const prompt = `
You are Aura V2, an autonomous cloud remediation planner.

Given this threat event, write a short safe remediation plan as valid JSON.

Threat:
${JSON.stringify(threat, null, 2)}

Approved policy:
${JSON.stringify(policy, null, 2)}

Return ONLY valid JSON with this exact shape:
{
  "generatedCode": "<short safe remediation plan text>",
  "steps": [
    "<safe step 1>",
    "<safe step 2>",
    "<safe step 3>"
  ]
}

Rules:
- Only return JSON
- Do not use markdown
- Do not wrap the response in triple backticks
- Do not choose the action
- Do not choose the execution mode
- Do not change the resource name
- Do not change the cloud provider
- Do not change the issue type
- generatedCode should describe how to safely perform this action: ${expectedAction}
- steps should be short, safe, reviewable steps for this remediation
- generatedCode and steps should follow this policy description: ${policy.description}
`;

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
  });

  const rawText = response.output_text?.trim();
  const cleanJson = extractJson(rawText);

  let parsed;
  try {
    parsed = JSON.parse(cleanJson);
  } catch (error) {
    throw new Error(`Failed to parse AI remediation JSON: ${cleanJson}`);
  }

  const auditResult = await auditRemediationWithAI({
    threat,
    policy,
    expectedAction,
    remediationJson: parsed,
  });

  parsed = auditResult.remediationJson;

  const fallbackGeneratedCode =
    `# AI remediation for ${threat.resourceName}\n# Action: ${expectedAction}`;

  const generatedCode = parsed.generatedCode || fallbackGeneratedCode;

  const remediationPlan = {
    provider: threat.cloudProvider,
    action: expectedAction,
    resourceType: threat.resourceType,
    resourceName: threat.resourceName,
    steps: normalizeSteps(parsed.steps, generatedCode),
    riskLevel: policy.riskLevel || "medium",
    requiresApproval:
      typeof policy.requiresApproval === "boolean"
        ? policy.requiresApproval
        : true,
  };

  return {
    remediationId: `rem-${Date.now()}`,
    threatId: threat.id,
    action: expectedAction,
    targetResource: threat.resourceName,
    resourceType: threat.resourceType,
    cloudProvider: threat.cloudProvider,
    issueType: threat.issueType,
    status: "pending",
    executionMode: "simulate",
    generatedAt: new Date().toISOString(),
    generatedCode,
    remediationPlan,
    agenticValidation: {
      enabled: true,
      auditStatus: auditResult.auditStatus,
      auditNotes: auditResult.auditNotes,
      validatedAt: new Date().toISOString(),
    },
  };
}

module.exports = {
  generateRemediationCommandFromAI,
};