# Tetragon Controlled Simulator Schedule Test - 2026-05-30

## Purpose

This document records the first short controlled schedule test for the Aura V2 Tetragon simulator CronJob.

The goal was to verify that the suspended simulator can be briefly enabled, allowed to run one scheduled cycle, then immediately returned to a suspended state without enabling continuous attack traffic or production remediation.

## Branch

```text
docs/document-controlled-simulator-schedule-test
```

## Related Documents

```text
backend/k8s/simulators/aura-telemetry-stimulator-cronjob.yaml
backend/docs/aks-validation-runs/tetragon-controlled-simulator-manual-run-2026-05-30.md
backend/docs/approval-to-runner-safety-boundary.md
```

## Pre-Test Safety State

Before the schedule test:

```text
CronJob: aura-telemetry-stimulator
Namespace: aura-lab
SUSPEND: True
ACTIVE: 0
Jobs: none
Pods: none
```

The repository was clean and on `main` before the documentation branch was created.

Production remediation remained disabled.

## Schedule Test Procedure

The CronJob was temporarily unsuspended:

```text
kubectl patch cronjob aura-telemetry-stimulator -n aura-lab -p '{"spec":{"suspend":false}}'
```

The CronJob immediately showed:

```text
SUSPEND: False
ACTIVE: 1
```

A single scheduled job appeared and completed:

```text
aura-telemetry-stimulator-29669500
```

The watch was stopped after the job completed.

The CronJob was immediately suspended again:

```text
kubectl patch cronjob aura-telemetry-stimulator -n aura-lab -p '{"spec":{"suspend":true}}'
```

After suspension:

```text
SUSPEND: True
ACTIVE: 0
```

## Scheduled Job

Job:

```text
aura-telemetry-stimulator-29669500
```

Pod:

```text
aura-telemetry-stimulator-29669500-x2gg8
```

Pod output:

```text
uid=1000 gid=0(root) groups=0(root)
```

## Bridge Result

The Tetragon bridge published the scheduled simulator event to Kafka `raw-telemetry`:

```text
[tetragon-bridge] Published unauthorizedPodExec to raw-telemetry: aura-lab/aura-telemetry-stimulator-29669500-x2gg8
```

## Normalizer Result

The telemetry normalizer created:

```text
threat-1780170056115
```

The normalized threat used:

```text
resourceName: aura-lab/aura-telemetry-stimulator-29669500-x2gg8
issueType: unauthorizedPodExec
description: Live eBPF detected suspicious process execution in AKS pod aura-lab/aura-telemetry-stimulator-29669500-x2gg8: /usr/bin/id
```

## Worker And Approval Result

The worker received the remediation command:

```text
rem-1780170061154
```

The worker required human approval and sent the command to the approval queue.

Approval ID:

```text
approval-1780170061793
```

Final result status:

```text
awaiting_approval
```

Final result reason:

```text
human_approval_required
```

## Approval-To-Runner Boundary

The approval-to-runner safety boundary remained valid.

```text
APPROVE DOES NOT RUN PRODUCTION APPLY
```

This schedule test did not trigger Terraform apply, destructive kubectl actions, Azure CLI mutation, or a production execution runner.

The approval path remains simulation-only.

## Cleanup

After the scheduled run, the CronJob was returned to:

```text
suspend: true
```

A later cleanup check confirmed:

```text
SUSPEND: True
ACTIVE: 0
No jobs
No pods
```

## Final Validation Result

The controlled schedule test was successful.

Final status:

```text
CONTROLLED SIMULATOR SCHEDULE TEST VALIDATED SAFELY
```

The scheduled simulator can run a short controlled cycle and produce live telemetry without leaving the CronJob active.

## Safety Conclusion

The safe operating model is:

```text
keep CronJob suspended by default
temporarily unsuspend only for a planned test
allow one or two cycles at most
immediately suspend again
verify no jobs or pods remain
do not use Termux or Tailscale yet
do not enable production remediation
```

