# Tetragon Live Pipeline Final Status

## Purpose

This document summarizes the final live Tetragon pipeline status for Aura V2 after the successful AKS controlled live validation and downstream normalizer validation.

The goal is to provide one clear final status document showing what was proven, what remains intentionally gated, and what should not be enabled yet.

## Branch

```text
docs/finalize-tetragon-live-pipeline-status
```

## Final Validated Live Flow

Aura V2 successfully validated the following live pipeline:

```text
AKS pod exec
Tetragon process_exec
Aura Tetragon bridge
Kafka raw-telemetry
Telemetry normalizer
Normalized threat
Orchestrator
AI remediation command
Worker validation
Approval queue
Awaiting approval result
```

## Source Validation Documents

This final status is based on the following validation records:

```text
backend/docs/aks-validation-runs/tetragon-controlled-live-validation-2026-05-25.md
backend/docs/aks-validation-runs/tetragon-downstream-normalizer-flow-2026-05-26.md
```

## AKS And Tetragon Status

AKS was recovered and reachable.

The AKS node was Ready.

Tetragon was running in the cluster.

The Aura Tetragon bridge was running in the `aura` namespace and monitoring:

```text
aura-lab
```

The controlled test pod was:

```text
aura-lab/attack-lab-74675467f6-sg5gd
```

The controlled live command was:

```bash
kubectl exec -n aura-lab "$POD_NAME" -- whoami
```

Observed output:

```text
curl_user
```

## Bridge Classification Status

The bridge successfully classified the live Tetragon process execution as:

```text
unauthorizedPodExec
```

The bridge published the event to:

```text
raw-telemetry
```

Successful bridge marker:

```text
[tetragon-bridge] Published unauthorizedPodExec to raw-telemetry: aura-lab/attack-lab-74675467f6-sg5gd
```

## Bridge Image Status

The live bridge required a classifier fix for direct process binaries such as:

```text
/usr/bin/whoami
/usr/bin/id
/usr/bin/uname
```

The fixed image used for the bridge was:

```text
aurav2registry17722.azurecr.io/aura-backend:v3-ebpf-whoami-fix
```

The normalizer and other services could still process the event safely with the existing deployed backend image.

## Downstream Normalizer Status

The telemetry normalizer consumed the live bridge event from:

```text
raw-telemetry
```

The normalized threat was:

```text
threat-1779745557422
```

Threat fields included:

```text
source: tetragon-ebpf
cloudProvider: azure
resourceType: aksPod
resourceName: aura-lab/attack-lab-74675467f6-sg5gd
severity: high
issueType: unauthorizedPodExec
status: open
```

The normalizer preserved the original event under `rawTelemetry`.

Audit events confirmed:

```text
RAW_TELEMETRY_RECEIVED
TELEMETRY_NORMALIZED_TO_THREAT
```

## Orchestrator Status

The orchestrator consumed the normalized threat and generated a safe investigation remediation command.

Remediation ID:

```text
rem-1779745566993
```

Action:

```text
investigateUnauthorizedPodExec
```

Target resource:

```text
aura-lab/attack-lab-74675467f6-sg5gd
```

Audit events confirmed:

```text
THREAT_RECEIVED
REMEDIATION_GENERATED
```

## Worker And Approval Gate Status

The worker consumed the remediation command from:

```text
remediation-commands
```

The remediation plan required human approval:

```text
requiresApproval: true
riskLevel: high
executionMode: simulate
```

The worker did not directly execute remediation.

Instead, it routed the command to the approval queue.

Approval ID:

```text
approval-1779745567621
```

Approval status:

```text
awaiting_approval
```

Reason:

```text
human_approval_required
```

Audit event confirmed:

```text
REMEDIATION_AWAITING_APPROVAL
```

## Result Status

The results consumer received a status record showing the remediation stopped at approval gating.

Result ID:

```text
result-1779745568041
```

Final result status:

```text
awaiting_approval
```

Safe result details:

```text
reason: human_approval_required
message: Remediation command requires human approval and was sent to the approval queue.
requiresApproval: true
```

This was not an automatic production remediation.

It was a safe approval-gating result.

## Safety Boundaries

The following safety boundaries remained intact:

```text
No Terraform apply was run.
No destructive Kubernetes action was run.
No production remediation was enabled.
The test pod was scaled back to 0.
The remediation command required human approval.
The worker routed the command to the approval queue.
The final result status was awaiting_approval.
RAG was not connected directly to live Tetragon events.
```

## Current Final Status

Final live Tetragon pipeline status:

```text
LIVE PIPELINE VALIDATED SAFELY
```

Validated capabilities:

```text
Real AKS exec event capture
Tetragon process_exec telemetry
Aura bridge classification
Kafka raw-telemetry publish
Telemetry normalization
Threat creation
Orchestrator remediation planning
Worker validation
Approval queue routing
Awaiting approval result
```

Not enabled:

```text
Production remediation execution
Terraform apply
Destructive Kubernetes actions
Direct RAG-to-live-telemetry automation
```

## Recommended Next Step

The next step should remain conservative.

Recommended next branch:

```text
docs/update-checklist-tetragon-live-pipeline-final-status
```

Goal:

```text
Update the main demo checklist with this final live pipeline status document.
```

No additional live AKS event is required for that checklist update.

