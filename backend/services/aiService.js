const { AzureOpenAI } = require("openai");

const client = new AzureOpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  deployment: process.env.AZURE_OPENAI_DEPLOYMENT,
  apiVersion: process.env.AZURE_OPENAI_API_VERSION,
});

function safeJsonParse(content, fallbackMessage) {
  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`${fallbackMessage}: ${content}`);
  }
}

async function auditTerraformRemediationWithAI({ alert, remediationJson }) {
  const auditPrompt = `
You are Aura's Terraform security auditor.

Review this AI-generated Terraform remediation before it is saved for human approval.

Alert details:
- Cloud Provider: ${alert.cloudProvider}
- Resource Type: ${alert.resourceType}
- Resource Name: ${alert.resourceName}
- Issue Type: ${alert.issueType}
- Description: ${alert.description}
- Severity: ${alert.severity}

Generated remediation JSON:
${JSON.stringify(remediationJson, null, 2)}

Return rules:
- If the Terraform is valid, safe, specific, and matches the alert, return JSON exactly like this:
{
  "auditStatus": "PASS",
  "generatedCode": "<same Terraform code>",
  "explanation": "<same or improved explanation>",
  "auditNotes": "AI auditor approved the generated Terraform remediation."
}

- If the Terraform is unsafe, invalid, vague, or does not match the alert, return JSON exactly like this:
{
  "auditStatus": "CORRECTED",
  "generatedCode": "<corrected Terraform code>",
  "explanation": "<corrected short explanation>",
  "auditNotes": "<short explanation of what was corrected>"
}

Security rules:
- Return valid JSON only
- Do not wrap JSON in markdown
- Do not include code fences
- Do not recommend destructive changes
- Do not delete production resources
- Do not disable logging
- Do not weaken encryption
- Do not open public network access
- Use secure defaults
- Keep the remediation focused on the alert issue type
`;

  const response = await client.chat.completions.create({
    model: process.env.AZURE_OPENAI_DEPLOYMENT,
    messages: [
      {
        role: "system",
        content:
          "You are a strict Terraform security auditor. You only return valid JSON.",
      },
      {
        role: "user",
        content: auditPrompt,
      },
    ],
    temperature: 0.1,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content;
  const parsed = safeJsonParse(
    content,
    "Failed to parse AI Terraform audit JSON"
  );

  return {
    auditStatus: parsed.auditStatus || "CORRECTED",
    generatedCode:
      parsed.generatedCode ||
      remediationJson.generatedCode ||
      "# No remediation generated",
    explanation:
      parsed.explanation ||
      remediationJson.explanation ||
      "No explanation returned by the AI auditor.",
    auditNotes:
      parsed.auditNotes ||
      "AI auditor reviewed the Terraform remediation.",
  };
}

const generateRemediationFromAI = async (alert) => {
  const prompt = `
You are a cloud security remediation assistant.

Generate a Terraform remediation for this cloud security alert.

Alert details:
- Cloud Provider: ${alert.cloudProvider}
- Resource Type: ${alert.resourceType}
- Resource Name: ${alert.resourceName}
- Issue Type: ${alert.issueType}
- Description: ${alert.description}
- Severity: ${alert.severity}

Rules:
- Return valid JSON only
- Do not wrap JSON in markdown
- Do not include code fences
- The JSON must contain exactly:
  - generatedCode
  - explanation
- generatedCode must contain Terraform code
- explanation must be a short plain-English explanation
- Use secure defaults
- Do not delete production resources
- Do not disable logging
- Do not weaken encryption
- Do not open public network access
`;

  const response = await client.chat.completions.create({
    model: process.env.AZURE_OPENAI_DEPLOYMENT,
    messages: [
      {
        role: "system",
        content:
          "You generate secure Terraform remediations for cloud security alerts. You only return valid JSON.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content;

  const parsed = safeJsonParse(
    content,
    "Failed to parse AI remediation JSON"
  );

  const initialRemediation = {
    generatedCode: parsed.generatedCode || "# No remediation generated",
    explanation:
      parsed.explanation || "No explanation returned by the AI service.",
  };

  const auditedRemediation = await auditTerraformRemediationWithAI({
    alert,
    remediationJson: initialRemediation,
  });

  return {
    generatedCode: auditedRemediation.generatedCode,
    explanation: auditedRemediation.explanation,
    auditStatus: auditedRemediation.auditStatus,
    auditNotes: auditedRemediation.auditNotes,
    agenticValidation: {
      enabled: true,
      auditStatus: auditedRemediation.auditStatus,
      auditNotes: auditedRemediation.auditNotes,
      validatedAt: new Date().toISOString(),
    },
  };
};

module.exports = {
  generateRemediationFromAI,
};