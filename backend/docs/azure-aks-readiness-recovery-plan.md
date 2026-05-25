# Azure AKS Readiness Recovery Plan

## Purpose

This document records the recovery plan for restoring Azure and AKS readiness before attempting another Tetragon AKS dry-run or any live bridge validation.

The previous controlled dry-run confirmed that the Aura safety process worked correctly: validation stopped before any apply, pod exec, deletion, restart, or remediation action.

## Current Blocker Summary

The controlled AKS dry-run could not continue because the Kubernetes API server was not reachable.

Observed AKS context:

```text
aks-aura-v2-dev
```

Observed dry-run blocker:

```text
kubectl get nodes
dial tcp 52.226.109.252:443: i/o timeout
```

Observed manual Kubernetes check failure:

```text
kubectl get nodes --request-timeout=15s
Unable to connect to the server: net/http: request canceled while waiting for connection
```

Observed AKS cluster state:

```text
name: aks-aura-v2-dev
powerState: Running
provisioningState: Failed
kubernetesVersion: 1.34
currentKubernetesVersion: 1.34.6
```

Observed node pool state:

```text
name: nodepool1
powerState: Running
provisioningState: Failed
count: 1
vmSize: Standard_DC2as_v5
mode: System
```

Observed VM scale set state:

```text
aks-nodepool1-16572230-vmss
provisioningState: Succeeded
capacity: 1
```

Observed credential refresh blocker:

```text
ReadOnlyDisabledSubscription
The subscription 2fe02849-5506-41f3-afb0-c2b33a61e120 is disabled and therefore marked as read only.
```

## Safety Rule

Do not continue to live AKS validation until Azure and AKS readiness are restored.

Do not run:

```bash
kubectl apply
kubectl exec
kubectl delete
kubectl rollout restart
az aks update
az aks start
./backend/scripts/tetragon-aks-dry-run-check.sh
```

until the subscription and AKS API server are confirmed healthy.

## Recovery Step 1: Confirm Azure Subscription Status

Run:

```bash
az account show --output json
az account list --all --output table
```

Confirm:

```text
subscription id matches the AKS resource subscription
state is Enabled
billing is active
subscription is not disabled
subscription is not read-only
```

If Azure CLI says `Enabled` but AKS commands report `ReadOnlyDisabledSubscription`, check the Azure Portal directly.

Portal checks:

```text
Azure Portal
Subscriptions
Azure subscription 1
Overview
Billing
Payment method
Spending limit
Disabled/read-only warnings
Resource provider status
```

## Recovery Step 2: Confirm AKS Resource State

Run:

```bash
az aks show   --resource-group rg-aura-v2-dev   --name aks-aura-v2-dev   --query "{name:name, powerState:powerState.code, provisioningState:provisioningState, kubernetesVersion:kubernetesVersion, currentKubernetesVersion:currentKubernetesVersion, fqdn:fqdn}"   --output table
```

Expected healthy state:

```text
PowerState: Running
ProvisioningState: Succeeded
```

Do not continue if `provisioningState` is still `Failed`.

## Recovery Step 3: Confirm Node Pool State

Run:

```bash
az aks nodepool list   --resource-group rg-aura-v2-dev   --cluster-name aks-aura-v2-dev   --query "[].{name:name, powerState:powerState.code, provisioningState:provisioningState, count:count, vmSize:vmSize, mode:mode}"   --output table
```

Expected healthy state:

```text
nodepool1
PowerState: Running
ProvisioningState: Succeeded
```

Do not continue if the node pool is still `Failed`.

## Recovery Step 4: Confirm AKS API Server Reachability

Only after the subscription, cluster, and node pool look healthy, run:

```bash
kubectl config current-context
kubectl get nodes --request-timeout=15s
```

Expected:

```text
current context is aks-aura-v2-dev
kubectl returns node information
nodes are Ready
```

Do not continue if `kubectl get nodes` times out.

## Recovery Step 5: Refresh Credentials Only After Subscription Is Healthy

Only after the subscription issue is resolved, run:

```bash
az aks get-credentials   --resource-group rg-aura-v2-dev   --name aks-aura-v2-dev   --overwrite-existing
```

Expected:

```text
Merged aks-aura-v2-dev as current context
```

If this still reports `ReadOnlyDisabledSubscription`, stop and return to Azure subscription recovery.

## Recovery Step 6: Rerun Local Safety Suite

Before any AKS dry-run retry, run:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike/backend

npm run test:tetragon:all
```

Expected:

```text
Local Tetragon safety suite passes.
```

## Recovery Step 7: Rerun Only the Dry-Run Helper

Only after all prior recovery checks pass, run from the repo root:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike

bash -n backend/scripts/tetragon-aks-dry-run-check.sh
./backend/scripts/tetragon-aks-dry-run-check.sh
```

The dry-run helper may check readiness, but it must remain non-destructive.

It must not:

```text
apply manifests
delete resources
restart workloads
run pod exec commands
enable remediation
```

## Required Stop Conditions

Stop immediately if any of these are observed:

```text
ReadOnlyDisabledSubscription
AKS provisioningState: Failed
nodepool provisioningState: Failed
kubectl get nodes timeout
wrong Kubernetes context
unexpected production subscription
unexpected production cluster
```

## Next Valid Engineering Step

Only after AKS readiness is restored and the dry-run helper passes should the project move toward controlled live bridge validation.

Until then, the correct project state is:

```text
safe blocked state
no bridge DaemonSet applied
no pod exec performed
no production remediation enabled
```

