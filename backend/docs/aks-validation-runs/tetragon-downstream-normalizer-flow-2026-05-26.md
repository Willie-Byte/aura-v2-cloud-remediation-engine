# Tetragon Downstream Normalizer Flow Validation - 2026-05-26

## Purpose

This document records the downstream validation after the successful controlled live Tetragon AKS bridge test.

The goal was to verify what happened after the Aura Tetragon bridge published a real `unauthorizedPodExec` event to Kafka `raw-telemetry`.

## Branch

```text
feature/validate-tetragon-downstream-normalizer-flow
```

## Starting Point

Previous validation proved:

```text
AKS pod exec
Tetragon process_exec event
Aura Tetragon bridge classification
Kafka raw-telemetry publish
```

This validation checked the downstream path after `raw-telemetry`.

## Running Deployments

The following Aura deployments were running in the `aura` namespace:

```text
aura-approval-consumer
aura-approval-decisions
aura-audit-consumer
aura-dlq-consumer
aura-orchestrator
aura-results-consumer
aura-telemetry-normalizer
aura-worker
```

## Raw Telemetry Consumed

The telemetry normalizer consumed the live Tetragon bridge event from:

```text
raw-telemetry
```

The raw telemetry payload included:

```text
source: tetragon-ebpf
eventType: process_exec
resourceType: aksPod
resourceName: aura-lab/attack-lab-74675467f6-sg5gd
issueType: unauthorizedPodExec
namespace: aura-lab
podName: attack-lab-74675467f6-sg5gd
containerName: curl
imageName: docker.io/curlimages/curl:latest
binary: /usr/bin/whoami
nodeName: aks-nodepool1-16572230-vmss000002
```

## Telemetry Normalized Into Threat

The telemetry normalizer published a normalized threat.

Threat ID:

```text
threat-1779745557422
```

Confirmed normalized threat fields:

```text
source: tetragon-ebpf
cloudProvider: azure
resourceType: aksPod
resourceName: aura-lab/attack-lab-74675467f6-sg5gd
severity: high
issueType: unauthorizedPodExec
status: open
```

The normalizer also preserved the original telemetry under `rawTelemetry`.

Audit events published:

```text
RAW_TELEMETRY_RECEIVED
TELEMETRY_NORMALIZED_TO_THREAT
```

## Orchestrator Consumed Threat

The Aura orchestrator consumed the normalized threat from the downstream threat topic.

The orchestrator generated an AI remediation command.

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

Audit events published:

```text
THREAT_RECEIVED
REMEDIATION_GENERATED
```

## Worker Gated Remediation Behind Human Approval

The worker consumed the remediation command from:

```text
remediation-commands
```

The remediation plan required approval:

```text
requiresApproval: true
riskLevel: high
executionMode: simulate
```

The worker did not directly execute the remediation.

Instead, it sent the command to the approval queue.

Approval ID:

```text
approval-1779745567621
```

Approval queue status:

```text
awaiting_approval
```

Reason:

```text
human_approval_required
```

Audit event published:

```text
REMEDIATION_AWAITING_APPROVAL
```

## Results Consumer Confirmed Safe Status

The results consumer received an execution result, but the status was not a completed execution.

Result ID:

```text
result-1779745568041
```

Safe result status:

```text
awaiting_approval
```

Safe details:

```text
reason: human_approval_required
message: Remediation command requires human approval and was sent to the approval queue.
requiresApproval: true
```

This means the result was a safe approval-gating status record, not an automatic destructive remediation.

## Final Flow Confirmed

The complete validated flow was:

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

## Safety Result

Final safety status:

```text
No Terraform apply was run.
No destructive Kubernetes action was run.
No production remediation was enabled.
The test pod had already been scaled back to 0.
The remediation command required approval.
The worker routed the command to the approval queue.
The final result status was awaiting_approval.
```

## Conclusion

Downstream normalizer flow validation succeeded.

Aura V2 safely processed a real live AKS Tetragon `unauthorizedPodExec` event through the downstream Kafka pipeline and stopped at human approval.

