# Tetragon AKS Readiness Final Status

## Purpose

This document summarizes the current Tetragon/AKS readiness status for Aura V2.

The goal is to clearly mark the Tetragon local safety phase as complete while showing that live AKS validation is paused until Azure subscription and AKS API readiness are restored.

## Current Status

The Tetragon local safety workflow is complete and documented.

Completed items:

```text
Tetragon bridge local classification test
Tetragon log replay test
Tetragon mock publisher test
Tetragon telemetry normalizer test
Tetragon normalizer publisher test
Tetragon local end-to-end test
Tetragon negative-path end-to-end test
One-command local test suite
GitHub Actions CI workflow
AKS dry-run validation helper
AKS validation checklist dry-run step
Controlled AKS dry-run execution result
Azure AKS readiness recovery plan
```

## Local Safety Suite

The project includes a one-command local Tetragon safety suite:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike/backend

npm run test:tetragon:all
```

This suite validates the local Tetragon pipeline without requiring live AKS, live Kafka, pod exec, bridge deployment, or production remediation.

The suite includes:

```text
test:tetragon:bridge
test:tetragon:replay
test:tetragon:mock-publisher
test:tetragon:normalizer
test:tetragon:normalizer-publisher
test:tetragon:e2e
test:tetragon:e2e-negative
```

## CI Status

The repository includes a GitHub Actions workflow for the local Tetragon safety suite:

```text
.github/workflows/tetragon-local-tests.yml
```

The workflow runs:

```bash
npm run test:tetragon:all
```

This helps prevent backend changes from breaking the local Tetragon safety path.

## AKS Dry-Run Helper

The repository includes a non-destructive AKS readiness helper:

```text
backend/scripts/tetragon-aks-dry-run-check.sh
```

The helper is intended to check readiness only.

It must not:

```text
apply manifests
delete resources
restart workloads
run pod exec commands
enable remediation
```

## Controlled AKS Dry-Run Result

A controlled AKS dry-run was attempted and documented here:

```text
backend/docs/aks-validation-runs/tetragon-aks-dry-run-2026-05-25.md
```

The run confirmed the correct Kubernetes context:

```text
aks-aura-v2-dev
```

The run stopped during AKS node reachability checks because the Kubernetes API server was not reachable.

Observed blocker:

```text
kubectl get nodes
dial tcp 52.226.109.252:443: i/o timeout
```

The AKS cluster and node pool were observed in failed provisioning states.

Observed AKS state:

```text
powerState: Running
provisioningState: Failed
```

Observed node pool state:

```text
nodepool1
powerState: Running
provisioningState: Failed
```

Azure credential refresh also reported:

```text
ReadOnlyDisabledSubscription
```

## Safety Outcome

The result is a safe blocked state.

No live deployment action was performed.

Confirmed safety outcome:

```text
No Tetragon bridge DaemonSet was applied.
No pod exec command was run.
No production remediation was enabled.
No Kubernetes resources were deleted.
No workloads were restarted.
```

## Recovery Plan

The Azure/AKS recovery plan is documented here:

```text
backend/docs/azure-aks-readiness-recovery-plan.md
```

The recovery plan documents:

```text
Azure subscription checks
AKS provisioning checks
node pool provisioning checks
AKS API reachability checks
credential refresh checks
required stop conditions
safe blocked state
```

## Required Stop Conditions

Live AKS validation must remain paused if any of these are observed:

```text
ReadOnlyDisabledSubscription
AKS provisioningState: Failed
nodepool provisioningState: Failed
kubectl get nodes timeout
wrong Kubernetes context
unexpected production subscription
unexpected production cluster
```

## Next Live Action

The next live action is outside the repository.

Before any new AKS dry-run or bridge validation, Azure must be fixed first:

```text
Azure subscription must allow write actions.
AKS cluster provisioningState must be Succeeded.
AKS node pool provisioningState must be Succeeded.
kubectl get nodes must return Ready nodes.
```

Only after those checks pass should the dry-run helper be used again.

## Next Engineering Step

The next repository-level engineering step should not be bridge deployment.

The next valid repository step is to keep documentation synchronized and clearly mark live AKS validation as paused until Azure/AKS readiness is restored.

Recommended next checklist update:

```text
docs/update-checklist-tetragon-aks-readiness-final-status
```

## Final Summary

The Tetragon local safety and documentation phase is complete.

Live AKS validation is intentionally paused because Azure/AKS readiness failed.

The project is in a safe blocked state, not a failed Aura state.

