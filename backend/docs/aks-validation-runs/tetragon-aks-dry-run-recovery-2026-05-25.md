# Tetragon AKS Dry-Run Recovery Result - 2026-05-25

## Purpose

This document records the successful recovery of AKS readiness after the earlier blocked Tetragon AKS dry-run.

The previous AKS validation attempt was intentionally stopped in a safe blocked state because the cluster and node pool were unhealthy. After Azure subscription, quota, and cluster reconciliation work, AKS became reachable again and the dry-run helper passed.

## Starting Point

Earlier validation was blocked because AKS was not ready.

Observed earlier state:

```text
AKS powerState: Running
AKS provisioningState: Failed
nodepool1 powerState: Running
nodepool1 provisioningState: Failed
kubectl get nodes: timeout
```

Observed root cause from latest AKS operation details:

```text
QuotaExceeded
standardDCASv5Family Cores quota
Location: eastus
Current Limit: 0
Additional Required: 2
Minimum New Limit Required: 2
```

The AKS node pool uses:

```text
Standard_DC2as_v5
```

That VM size requires Standard DCASv5 Family vCPU quota in East US.

## Recovery Actions Completed

The following recovery actions were completed before rerunning validation:

```text
Azure subscription was upgraded/fixed enough for az aks get-credentials to work.
AKS quota issue was identified as Standard DCASv5 Family vCPU quota in East US.
AKS reconcile/update was run after quota recovery.
AKS cluster provisioning moved to Succeeded.
nodepool1 provisioning moved to Succeeded.
kubectl access from the Mac was restored.
```

## AKS Connectivity Verified From Mac

Command:

```bash
az aks get-credentials   --resource-group rg-aura-v2-dev   --name aks-aura-v2-dev   --overwrite-existing

kubectl get nodes --request-timeout=15s
```

Observed result:

```text
Merged "aks-aura-v2-dev" as current context in /Users/wilsongaldamez/.kube/config

NAME                                STATUS   ROLES    AGE     VERSION
aks-nodepool1-16572230-vmss000002   Ready    <none>   9m44s   v1.34.6
```

## Local Tetragon Safety Suite Passed

Before the AKS dry-run helper was rerun, the local Tetragon safety suite was executed from the backend folder.

Command:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike/backend

npm run test:tetragon:all
```

Observed successful tests:

```text
test:tetragon:bridge passed
test:tetragon:replay passed
test:tetragon:mock-publisher passed
test:tetragon:normalizer passed
test:tetragon:normalizer-publisher passed
test:tetragon:e2e passed
test:tetragon:e2e-negative passed
```

Final observed result:

```text
[tetragon-e2e-negative-test] Local negative-path test passed.
```

## AKS Dry-Run Helper Passed

The AKS dry-run helper was checked for shell syntax and then executed.

Commands:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike

bash -n backend/scripts/tetragon-aks-dry-run-check.sh

./backend/scripts/tetragon-aks-dry-run-check.sh
```

Observed successful checks:

```text
PASS: Current Kubernetes context
PASS: AKS nodes are reachable
PASS: Aura namespace exists
PASS: Aura ConfigMap exists
PASS: Aura Secret exists
PASS: Tetragon pods are visible somewhere in the cluster
PASS: Tetragon bridge manifest exists locally
PASS: Tetragon bridge DaemonSet status if already deployed
PASS: Tetragon bridge pods if already deployed
```

Observed dry-run summary:

```text
All dry-run checks passed.
No production remediation action was enabled.
```

## Current AKS/Tetragon State

Current verified AKS state:

```text
Kubernetes context: aks-aura-v2-dev
Node: aks-nodepool1-16572230-vmss000002
Node status: Ready
Kubernetes version: v1.34.6
```

Current verified Aura/Tetragon state:

```text
namespace aura exists
aura-config exists
aura-secrets exists
kube-system tetragon pod is running
kube-system tetragon-operator pod is running
aura-tetragon-bridge DaemonSet exists
aura-tetragon-bridge pod is running
```

## Safety Outcome

This was still a dry-run validation step.

Confirmed safety outcome:

```text
No new manifests were applied by the dry-run helper.
No Kubernetes resources were deleted by the dry-run helper.
No pod exec commands were run by the dry-run helper.
No production remediation action was enabled.
```

## Result

The previous safe blocked state has been resolved for AKS readiness.

Current status:

```text
AKS reachable from Mac
node Ready
local Tetragon safety suite passed
AKS dry-run helper passed
Tetragon bridge already running
production remediation still disabled
```

## Next Recommended Step

The next safe engineering step is controlled live validation, not production remediation.

Before any live validation:

```text
Confirm local tests still pass.
Confirm the dry-run helper still passes.
Confirm the monitored namespace is correct.
Confirm production remediation is disabled.
Confirm no destructive action is enabled.
```

Recommended next branch:

```text
feature/resume-after-azure-aks-readiness-restored
```

