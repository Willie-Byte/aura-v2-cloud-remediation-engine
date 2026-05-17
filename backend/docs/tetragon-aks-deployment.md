# Aura Tetragon AKS Deployment Guide

This guide documents the safe path for deploying the clean Aura Tetragon bridge to Azure Kubernetes Service after all local Tetragon tests pass.

## Purpose

The Tetragon bridge connects live eBPF process telemetry from AKS into Aura's Kafka remediation pipeline.

The bridge:

- runs as a Kubernetes DaemonSet
- tails the Tetragon log file from the AKS node
- watches monitored namespaces such as `default`
- classifies suspicious process execution
- converts suspicious events into Aura telemetry
- publishes `unauthorizedPodExec` events to the Kafka `raw-telemetry` topic

## Safety Boundary

Do not deploy or test the live AKS bridge until these local tests pass:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike/backend

npm run test:tetragon:bridge
npm run test:tetragon:replay
npm run test:tetragon:mock-publisher
```

These tests verify:

- Tetragon process execution classification
- newline-delimited Tetragon log replay
- Kafka publish payload shape
- ignored namespace behavior
- suspicious process detection
- local-only testing without AKS or Kafka

## Deployment Files

The main Kubernetes deployment file is:

```text
backend/k8s/tetragon-bridge-daemonset.yaml
```

The bridge entry point is:

```text
backend/streaming/tetragonBridge.js
```

The optional approval helper script is:

```text
backend/scripts/run-ebpf-approval-job.sh
```

## DaemonSet Overview

The DaemonSet is named:

```text
aura-tetragon-bridge
```

It runs in the namespace:

```text
aura
```

It uses this backend image:

```text
aurav2registry17722.azurecr.io/aura-backend:v2-ebpf-amd64
```

It starts the bridge with:

```text
node streaming/tetragonBridge.js
```

## Required Runtime Configuration

The DaemonSet sets these environment variables directly:

```text
TETRAGON_LOG_PATH=/var/run/cilium/tetragon/tetragon.log
TETRAGON_MONITORED_NAMESPACES=default
TETRAGON_READ_FROM_START=false
```

It also expects these Kubernetes resources to exist:

```text
ConfigMap: aura-config
Secret: aura-secrets
```

These should provide the same Kafka and Aura environment variables used by the rest of the streaming system.

## Required Host Path

The bridge mounts the Tetragon log directory from the AKS node:

```text
/var/run/cilium/tetragon
```

The expected log file is:

```text
/var/run/cilium/tetragon/tetragon.log
```

## Pre-Deployment Checks

Before applying the DaemonSet, confirm the namespace exists:

```bash
kubectl get namespace aura
```

Confirm the config and secret exist:

```bash
kubectl get configmap aura-config -n aura
kubectl get secret aura-secrets -n aura
```

Confirm Tetragon is installed and running:

```bash
kubectl get pods -A | grep tetragon
```

Confirm the bridge manifest exists locally:

```bash
ls backend/k8s/tetragon-bridge-daemonset.yaml
```

## Deploy the Bridge

From the backend folder:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike/backend

kubectl apply -f k8s/tetragon-bridge-daemonset.yaml
```

Verify rollout:

```bash
kubectl rollout status daemonset/aura-tetragon-bridge -n aura
```

Check pods:

```bash
kubectl get pods -n aura -l app=aura-tetragon-bridge -o wide
```

Check logs:

```bash
kubectl logs -n aura -l app=aura-tetragon-bridge --tail=100
```

Expected startup logs should mention:

```text
[tetragon-bridge] Starting Tetragon to Kafka bridge
[tetragon-bridge] Log path: /var/run/cilium/tetragon/tetragon.log
[tetragon-bridge] Raw telemetry topic: raw-telemetry
[tetragon-bridge] Monitored namespaces: default
```

## Controlled Test Event

Only run controlled test events in a safe lab namespace or approved test pod.

The current DaemonSet watches:

```text
default
```

A suspicious command such as this should be classified as suspicious if it appears in Tetragon process execution logs:

```text
/bin/sh whoami
```

The bridge should publish telemetry similar to:

```text
issueType=unauthorizedPodExec
resourceType=aksPod
source=tetragon-ebpf
```

Expected bridge log after detection:

```text
[tetragon-bridge] Published unauthorizedPodExec to raw-telemetry
```

## Approval Helper Script

The helper script is:

```text
backend/scripts/run-ebpf-approval-job.sh
```

Usage:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike/backend

./scripts/run-ebpf-approval-job.sh <remediationId> <threatId> <approvalId> [targetResource]
```

Example target resource:

```text
default/aura-ebpf-test
```

The script creates a temporary ConfigMap named:

```text
aura-approval-run
```

Then it runs:

```text
k8s/approval-producer-job.yaml
```

The approval job sends an approval decision for an `unauthorizedPodExec` remediation flow.

## Troubleshooting

### Bridge pod is not starting

Check pod events:

```bash
kubectl describe pods -n aura -l app=aura-tetragon-bridge
```

Check image pull errors:

```bash
kubectl get pods -n aura -l app=aura-tetragon-bridge
```

Confirm the image exists in ACR:

```text
aurav2registry17722.azurecr.io/aura-backend:v2-ebpf-amd64
```

### Bridge cannot find Tetragon logs

Check bridge logs:

```bash
kubectl logs -n aura -l app=aura-tetragon-bridge --tail=100
```

If it shows:

```text
[tetragon-bridge] Waiting for log file
```

Then confirm Tetragon is writing logs on the node and that this path exists:

```text
/var/run/cilium/tetragon/tetragon.log
```

### No telemetry is published

Check:

- `TETRAGON_MONITORED_NAMESPACES` matches the namespace being tested
- the event is a `process_exec` event
- the process is suspicious enough to match bridge logic
- Kafka config is present in `aura-config`
- Kafka secrets are present in `aura-secrets`
- the `raw-telemetry` topic exists

### Wrong namespace is ignored

The bridge intentionally ignores namespaces not listed in:

```text
TETRAGON_MONITORED_NAMESPACES
```

The current DaemonSet default is:

```text
default
```

Update the DaemonSet if you want to monitor another test namespace.

## Cleanup

To remove the bridge from the backend folder:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike/backend

kubectl delete -f k8s/tetragon-bridge-daemonset.yaml
```

Verify removal:

```bash
kubectl get pods -n aura -l app=aura-tetragon-bridge
```

## Recommended Deployment Rule

Do not connect live Tetragon telemetry to production remediation actions yet.

The safe order is:

1. local classification test
2. local replay test
3. local mock publisher test
4. controlled AKS bridge deployment
5. controlled suspicious event test
6. Kafka telemetry verification
7. approval workflow verification
8. only then consider broader automation
