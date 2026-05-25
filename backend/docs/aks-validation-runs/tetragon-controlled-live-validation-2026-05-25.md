# Tetragon Controlled Live Validation Result - 2026-05-25

## Purpose

This document records the successful controlled live validation of Aura V2's AKS Tetragon bridge.

The goal was to prove that a real Kubernetes exec event inside the monitored AKS namespace can be detected by Tetragon, classified by the Aura bridge, and published to Kafka raw telemetry.

## Branch

```text
feature/tetragon-controlled-live-validation
```

## Safety Conditions

This validation was controlled and limited.

Safety boundaries:

```text
No production remediation was enabled.
No Terraform apply was run.
No destructive kubectl action was run.
Only a controlled kubectl exec whoami test was performed.
The test deployment was scaled back to 0 after validation.
```

## Pre-Validation State

AKS was recovered and reachable.

The Tetragon bridge DaemonSet was running in the `aura` namespace.

The bridge was configured to monitor:

```text
aura-lab
```

The test deployment existed in `aura-lab`:

```text
attack-lab
```

Before validation, the deployment was scaled to 1 for the controlled test.

## Bridge Image Fix

The first live test showed that Tetragon captured `/usr/bin/whoami`, but the bridge did not publish it because the bridge classified `whoami` only when it appeared in arguments, not when it appeared as the direct binary.

Code fix:

```text
backend/streaming/tetragonBridge.js
```

The suspicious binary pattern was updated to include:

```text
whoami
id
uname
```

Regression test added:

```text
backend/fixtures/tetragon/aks-whoami-process-exec.json
backend/scripts/testTetragonBridgeClassification.js
```

The full local Tetragon suite passed after the fix:

```bash
npm run test:tetragon:all
```

## Fixed Image Built And Deployed

New image tag:

```text
aurav2registry17722.azurecr.io/aura-backend:v3-ebpf-whoami-fix
```

The Tetragon bridge DaemonSet was updated with:

```bash
kubectl set image daemonset/aura-tetragon-bridge   -n aura   aura-tetragon-bridge=aurav2registry17722.azurecr.io/aura-backend:v3-ebpf-whoami-fix
```

Rollout result:

```text
daemon set "aura-tetragon-bridge" successfully rolled out
```

Verified running image:

```text
aurav2registry17722.azurecr.io/aura-backend:v3-ebpf-whoami-fix
```

## Controlled Live Event

Command:

```bash
POD_NAME=$(kubectl get pods -n aura-lab -l app=attack-lab -o jsonpath='{.items[0].metadata.name}')

kubectl exec -n aura-lab "$POD_NAME" -- whoami
```

Observed output:

```text
curl_user
```

## Successful Bridge Publish

Bridge log confirmed:

```text
[tetragon-bridge] Published unauthorizedPodExec to raw-telemetry: aura-lab/attack-lab-74675467f6-sg5gd
```

This proves the live flow worked:

```text
AKS pod exec
Tetragon process_exec event
Aura Tetragon bridge classification
Kafka raw-telemetry publish
```

## Cleanup

The test deployment was scaled back down:

```bash
kubectl scale deployment attack-lab -n aura-lab --replicas=0
```

Final cleanup state:

```text
No resources found in aura-lab namespace.
attack-lab READY 0/0
```

Final bridge confirmation:

```text
[tetragon-bridge] Monitored namespaces: aura-lab
[tetragon-bridge] Published unauthorizedPodExec to raw-telemetry: aura-lab/attack-lab-74675467f6-sg5gd
```

## Final Result

Controlled live validation succeeded.

Final status:

```text
AKS reachable
Tetragon running
Aura bridge running fixed image
Real pod exec detected
unauthorizedPodExec published to raw-telemetry
test pod cleaned up
production remediation disabled
```

## Next Recommended Step

The next step is to document this result in the main demo checklist and then decide whether to validate the downstream Kafka consumer/normalizer path.

Recommended next branch after this PR merges:

```text
docs/update-checklist-tetragon-controlled-live-validation
```

