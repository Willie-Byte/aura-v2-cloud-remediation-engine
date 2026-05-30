# Tetragon Controlled Simulator Manual Run - 2026-05-30

## Purpose

This document records the first controlled simulator validation for Aura V2's AKS Tetragon pipeline.

The goal was to move beyond a one-off manual `kubectl exec` test and prove that a dedicated in-cluster simulator can safely generate Tetragon telemetry while production remediation remains disabled.

## Branch

```text
feature/controlled-tetragon-simulator-cron
```

## Simulator Manifest

```text
backend/k8s/simulators/aura-telemetry-stimulator-cronjob.yaml
```

## Safety Controls

The simulator CronJob was applied in a suspended state.

```text
suspend: true
concurrencyPolicy: Forbid
backoffLimit: 0
ttlSecondsAfterFinished: 300
activeDeadlineSeconds: 60
runAsNonRoot: true
allowPrivilegeEscalation: false
readOnlyRootFilesystem: true
```

The CronJob did not run automatically.

## Pre-Flight State

AKS node was Ready.

Aura services were Running in the `aura` namespace.

The `aura-lab` namespace had no active pods before the manual simulator run.

The legacy `attack-lab` deployment was scaled to 0/0.

The Tetragon bridge was scoped to:

```text
TETRAGON_MONITORED_NAMESPACES: aura-lab
TETRAGON_READ_FROM_START: false
```

Production stream bridge startup remained disabled:

```text
START_STREAM_BRIDGE: "false"
```

## Manual Test History

### manual-001

The first manual simulator run used multiple commands:

```text
whoami
id
uname -a
```

Result:

```text
The bridge published multiple unauthorizedPodExec events.
```

Conclusion:

```text
The simulator worked, but it was too noisy for a recurring schedule.
```

### manual-002

The second manual simulator run reduced the command block to one explicit command inside a shell wrapper:

```text
id
```

Result:

```text
The bridge still published two events because Tetragon observed both the shell wrapper and the id command.
```

Conclusion:

```text
The simulator needed to remove the shell wrapper.
```

### manual-003

The final manual simulator run executed the command directly:

```text
/usr/bin/id
```

Manual job:

```text
aura-telemetry-stimulator-manual-003
```

Pod:

```text
aura-telemetry-stimulator-manual-003-fxb4j
```

Pod output:

```text
uid=1000 gid=0(root) groups=0(root)
```

Bridge result:

```text
[tetragon-bridge] Published unauthorizedPodExec to raw-telemetry: aura-lab/aura-telemetry-stimulator-manual-003-fxb4j
```

## Downstream Flow For manual-003

The telemetry normalizer created:

```text
threat-1780168421015
```

The normalized threat used:

```text
resourceName: aura-lab/aura-telemetry-stimulator-manual-003-fxb4j
issueType: unauthorizedPodExec
description: Live eBPF detected suspicious process execution in AKS pod aura-lab/aura-telemetry-stimulator-manual-003-fxb4j: /usr/bin/id
```

The orchestrator generated:

```text
rem-1780168425288
```

The remediation action was:

```text
investigateUnauthorizedPodExec
```

The worker routed the remediation to human approval.

Approval ID:

```text
approval-1780168425673
```

Final result status:

```text
awaiting_approval
```

Final result reason:

```text
human_approval_required
```

## Cleanup

The manual job was deleted:

```text
kubectl delete job aura-telemetry-stimulator-manual-003 -n aura-lab
```

Final namespace state:

```text
CronJob remained suspended.
ACTIVE = 0.
No jobs remained.
No pods remained.
```

## Final Validation Result

The controlled simulator manual run was successful.

Final status:

```text
CONTROLLED SIMULATOR VALIDATED SAFELY
```

The simulator can generate live Tetragon telemetry from inside `aura-lab`.

The event flows through:

```text
Tetragon bridge
Kafka raw-telemetry
Telemetry normalizer
Threat ingest
Orchestrator
Remediation command
Worker validation
Approval queue
Execution result
```

The pipeline still stops at:

```text
awaiting_approval
human_approval_required
```

## Recommendation

Do not enable the recurring 4-minute schedule until this result is merged and the checklist is updated.

The next safe step is to document and merge this validation first.

After merge, a short controlled schedule test may be run by temporarily setting:

```text
suspend: false
```

Then immediately returning it to:

```text
suspend: true
```

after one or two scheduled cycles.

