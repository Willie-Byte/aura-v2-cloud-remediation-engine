# Tetragon AKS Dry-Run Execution Result - 2026-05-25

## Branch

feature/tetragon-controlled-aks-dry-run-execution

## Purpose

Run the controlled AKS dry-run helper against the intended AKS development cluster without applying the Tetragon bridge DaemonSet or enabling remediation.

## Safety Boundary

No live deployment action was performed.

The dry-run did not:

- apply manifests
- delete resources
- restart workloads
- run pod exec commands
- enable production remediation

## Kubernetes Context

The active Kubernetes context was confirmed as:

```text
aks-aura-v2-dev
```

Available contexts included:

```text
aks-aura-v2-dev
docker-desktop
minikube
```

## Dry-Run Helper

The dry-run helper script was syntax checked successfully:

```bash
bash -n backend/scripts/tetragon-aks-dry-run-check.sh
```

Then the dry-run helper was started:

```bash
./backend/scripts/tetragon-aks-dry-run-check.sh
```

The helper confirmed the current Kubernetes context:

```text
PASS: Current Kubernetes context
aks-aura-v2-dev
```

The helper stopped during the AKS node reachability check because the Kubernetes API server could not be reached.

Observed error:

```text
dial tcp 52.226.109.252:443: i/o timeout
```

A manual Kubernetes node check also failed:

```bash
kubectl get nodes --request-timeout=15s
```

Observed result:

```text
Unable to connect to the server: net/http: request canceled while waiting for connection
```

## AKS State

The AKS cluster was found in this state:

```text
name: aks-aura-v2-dev
powerState: Running
provisioningState: Failed
kubernetesVersion: 1.34
currentKubernetesVersion: 1.34.6
```

The node pool was found in this state:

```text
name: nodepool1
powerState: Running
provisioningState: Failed
count: 1
vmSize: Standard_DC2as_v5
mode: System
```

The backing VM scale set appeared healthy:

```text
aks-nodepool1-16572230-vmss
provisioningState: Succeeded
capacity: 1
```

The VMSS instance also appeared healthy:

```text
aks-nodepool1-16572230-vmss_1
provisioningState: Succeeded
```

## Azure Subscription / Credential Issue

The Azure CLI account showed the subscription as enabled:

```text
Azure subscription 1
state: Enabled
subscription id: 2fe02849-5506-41f3-afb0-c2b33a61e120
```

The AKS resource also belongs to the same subscription:

```text
/subscriptions/2fe02849-5506-41f3-afb0-c2b33a61e120/resourcegroups/rg-aura-v2-dev/providers/Microsoft.ContainerService/managedClusters/aks-aura-v2-dev
```

However, refreshing AKS credentials failed:

```text
ReadOnlyDisabledSubscription
The subscription 2fe02849-5506-41f3-afb0-c2b33a61e120 is disabled and therefore marked as read only.
```

## Result

The controlled AKS dry-run did not pass because AKS was not reachable and Azure reported the subscription as read-only/disabled for write actions.

This is a safe blocked state.

No Aura deployment was attempted.

No Tetragon bridge DaemonSet was applied.

No production remediation was enabled.

## Conclusion

Aura did not fail.

The dry-run safety system worked correctly by stopping before any live deployment or remediation action.

## Next Action

Resolve the Azure subscription / AKS provisioning issue before any live AKS validation continues.

Recommended checks:

- review subscription status in Azure Portal
- check billing, payment, spending limit, or disabled subscription status
- review AKS cluster provisioning failure
- confirm whether the subscription is truly enabled for write actions
- confirm AKS API server reachability
- rerun only the dry-run helper after Azure/AKS readiness is restored

