# Controlled Simulator and Approval Boundary Summary

## Purpose

This document summarizes the completed Aura V2 controlled simulator and approval-to-runner safety boundary phase.

The goal of this phase was to prove that Aura V2 can safely generate recurring-style live telemetry in AKS while keeping production remediation disabled and ensuring that approval does not trigger real cloud changes.

## Final Status

```text
CONTROLLED SIMULATOR AND APPROVAL BOUNDARY VALIDATED SAFELY
```

## What Was Added

Aura V2 now includes a controlled in-cluster simulator CronJob:

```text
backend/k8s/simulators/aura-telemetry-stimulator-cronjob.yaml
```

The simulator is designed to run in the `aura-lab` namespace and generate a safe Tetragon-detectable process execution event.

The simulator command is:

```text
/usr/bin/id
```

The CronJob is suspended by default:

```text
suspend: true
```

## Manual Simulator Validation

Manual simulator validation was documented in:

```text
backend/docs/aks-validation-runs/tetragon-controlled-simulator-manual-run-2026-05-30.md
```

Final manual validation status:

```text
CONTROLLED SIMULATOR VALIDATED SAFELY
```

The manual validation proved that the simulator can generate live AKS telemetry and send it through:

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

The result stopped safely at:

```text
awaiting_approval
human_approval_required
```

## Short Schedule Test Validation

The short controlled schedule test was documented in:

```text
backend/docs/aks-validation-runs/tetragon-controlled-simulator-schedule-test-2026-05-30.md
```

Final schedule test status:

```text
CONTROLLED SIMULATOR SCHEDULE TEST VALIDATED SAFELY
```

The schedule test temporarily changed the simulator CronJob from:

```text
suspend: true
```

to:

```text
suspend: false
```

One scheduled job ran:

```text
aura-telemetry-stimulator-29669500
```

Scheduled pod:

```text
aura-telemetry-stimulator-29669500-x2gg8
```

The CronJob was then returned to:

```text
suspend: true
```

Final result:

```text
awaiting_approval
human_approval_required
```

## Approval-To-Runner Boundary

The approval-to-runner boundary was documented in:

```text
backend/docs/approval-to-runner-safety-boundary.md
```

Final approval boundary finding:

```text
APPROVE DOES NOT RUN PRODUCTION APPLY
```

The current approval path is:

```text
approval route
→ Kafka approval-decisions topic
→ approval decision consumer
→ simulated execution result
→ execution-results topic
```

The current approval path is not:

```text
approval route
→ Terraform apply
→ kubectl mutation
→ Azure CLI mutation
→ production execution runner
```

## Current Safety Model

Current Aura V2 status:

```text
live AKS detection: yes
controlled simulator: yes
manual simulator run: passed
short schedule test: passed
approval routing: yes
post-approval result: simulated only
production Terraform apply: no
destructive kubectl actions: no
Azure CLI mutation from approval: no
Termux/Tailscale external bot: future work
```

## Required Safety Boundaries

The following boundaries remain required:

```text
keep the simulator suspended by default
only unsuspend during planned tests
watch logs during scheduled tests
return the CronJob to suspend: true immediately after test cycles
verify no jobs or pods remain
keep approval simulation-only
do not enable production apply
do not connect Termux/Tailscale external traffic yet
```

## Final Conclusion

Aura V2 is now validated as:

```text
a safety-gated live detection and remediation-planning system with a controlled in-cluster simulator and simulated post-approval execution
```

It is not a production autonomous remediation executor yet.

Production execution remains future work and should only be added after:

```text
isolated execution runner
Terraform plan-only validation
persistent audit/result storage
role-based approval permissions
explicit apply-mode environment gate
rollback procedure
manual break-glass process
```

