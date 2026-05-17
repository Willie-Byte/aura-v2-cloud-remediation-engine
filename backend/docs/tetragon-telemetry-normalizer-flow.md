# Aura Tetragon Telemetry Normalizer Flow

This document explains how Tetragon bridge telemetry should flow into Aura's telemetry normalizer safely.

This is documentation only. It does not enable production remediation actions.

## Purpose

The Tetragon bridge publishes suspicious AKS process execution events into Kafka as raw telemetry.

The telemetry normalizer consumes raw telemetry, maps supported telemetry patterns into Aura threat objects, and publishes supported threats into the main Aura threat/remediation pipeline.

## Current Flow

The intended flow is:

```text
Tetragon eBPF logs
  -> aura-tetragon-bridge
  -> Kafka raw-telemetry topic
  -> aura-telemetry-normalizer
  -> Kafka main threat topic
  -> orchestrator / approval / worker flow
```

## Files Involved

Tetragon bridge:

```text
backend/streaming/tetragonBridge.js
```

Telemetry normalizer:

```text
backend/streaming/telemetryNormalizer.js
```

Telemetry normalizer Kubernetes deployment:

```text
backend/k8s/telemetry-normalizer-deployment.yaml
```

ConfigMap topic setting:

```text
backend/k8s/aura-configmap.yaml
```

Relevant package script:

```json
"stream:telemetry-normalizer": "node streaming/telemetryNormalizer.js"
```

## Kafka Topics

The Tetragon bridge publishes to the raw telemetry topic:

```text
KAFKA_RAW_TELEMETRY_TOPIC=raw-telemetry
```

The telemetry normalizer consumes from:

```text
process.env.KAFKA_RAW_TELEMETRY_TOPIC
```

The telemetry normalizer publishes normalized threats to:

```text
process.env.KAFKA_TOPIC
```

## Tetragon Bridge Event Shape

The Tetragon bridge currently produces telemetry shaped like this:

```json
{
  "source": "tetragon-ebpf",
  "eventType": "process_exec",
  "cloudProvider": "azure",
  "resourceType": "aksPod",
  "resourceName": "default/aura-ebpf-test",
  "severity": "high",
  "issueType": "unauthorizedPodExec",
  "namespace": "default",
  "podName": "aura-ebpf-test",
  "binary": "/bin/sh",
  "arguments": "whoami"
}
```

## Current Normalizer Limitation

The current telemetry normalizer maps these issue types:

```text
publicSSHAccess
publicRDPAccess
publicStorageAccess
unencryptedDatabase
weakTlsVersion
nonQuantumSafeCrypto
```

At the time of this document, the normalizer does not yet map this Tetragon pattern:

```text
eventType=process_exec
resourceType=aksPod
issueType=unauthorizedPodExec
```

Because of that, a Tetragon bridge event can be received from `raw-telemetry`, but the normalizer may log:

```text
Telemetry did not match a supported threat rule.
```

That is expected until `unauthorizedPodExec` mapping is intentionally added to `telemetryNormalizer.js`.

## Safe Verification Path

Before testing live AKS telemetry, run all local Tetragon tests:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike/backend

npm run test:tetragon:bridge
npm run test:tetragon:replay
npm run test:tetragon:mock-publisher
```

Expected:

```text
[tetragon-bridge-test] All local classification tests passed.
[tetragon-replay] Local replay test passed.
[tetragon-mock-publisher-test] Mock publisher test passed.
```

## Run the Telemetry Normalizer Locally

From the backend folder:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike/backend

npm run stream:telemetry-normalizer
```

Expected startup output:

```text
Telemetry normalizer connected. Waiting for raw telemetry...
```

The normalizer should subscribe to:

```text
raw-telemetry
```

through:

```text
KAFKA_RAW_TELEMETRY_TOPIC
```

## Deploy the Telemetry Normalizer on AKS

From the backend folder:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike/backend

kubectl apply -f k8s/telemetry-normalizer-deployment.yaml
```

Verify deployment:

```bash
kubectl rollout status deployment/aura-telemetry-normalizer -n aura
kubectl get pods -n aura -l app=aura-telemetry-normalizer
```

Check logs:

```bash
kubectl logs -n aura -l app=aura-telemetry-normalizer --tail=100
```

Expected startup log:

```text
Telemetry normalizer connected. Waiting for raw telemetry...
```

## What to Check After a Tetragon Event

After the Tetragon bridge publishes an `unauthorizedPodExec` event, check bridge logs:

```bash
kubectl logs -n aura -l app=aura-tetragon-bridge --tail=100
```

Expected bridge log:

```text
[tetragon-bridge] Published unauthorizedPodExec to raw-telemetry
```

Then check telemetry normalizer logs:

```bash
kubectl logs -n aura -l app=aura-telemetry-normalizer --tail=100
```

Current expected behavior may be:

```text
Raw telemetry received
Telemetry did not match a supported threat rule.
```

This means the bridge-to-raw-telemetry path worked, but the normalizer does not yet support converting `unauthorizedPodExec` into a threat.

## Audit Events

The normalizer publishes audit events for:

```text
RAW_TELEMETRY_RECEIVED
TELEMETRY_IGNORED
TELEMETRY_NORMALIZED_TO_THREAT
TELEMETRY_PARSE_FAILED
```

For unsupported Tetragon telemetry, expected audit behavior is:

```text
RAW_TELEMETRY_RECEIVED
TELEMETRY_IGNORED
```

## Do Not Enable Production Remediation Yet

Do not connect live `unauthorizedPodExec` detections to automatic remediation until the mapping is deliberately implemented and tested.

The safe order is:

1. Confirm local Tetragon classification test.
2. Confirm local Tetragon replay test.
3. Confirm local mock publisher test.
4. Confirm bridge publishes to `raw-telemetry`.
5. Confirm normalizer receives the raw telemetry.
6. Document unsupported mapping behavior.
7. Add a dedicated normalizer mapping test in a future branch.
8. Only then consider connecting the flow to approval/remediation.

## Future Engineering Work

A future branch can add explicit support for `unauthorizedPodExec`.

Recommended future branch:

```text
feature/tetragon-unauthorized-pod-exec-normalizer
```

Expected future work:

- Add `unauthorizedPodExec` mapping in `mapTelemetryToIssueType`.
- Add threat description for `unauthorizedPodExec`.
- Add fixture-based tests for Tetragon telemetry normalization.
- Confirm unsupported telemetry still gets ignored safely.
- Confirm no remediation action is triggered automatically.
- Keep approval flow separate from live detection.
