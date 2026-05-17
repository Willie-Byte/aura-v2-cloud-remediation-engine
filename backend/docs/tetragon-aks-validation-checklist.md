# Aura Tetragon AKS Validation Checklist

Use this checklist to validate the clean Tetragon bridge on AKS in a controlled way.

This checklist is for validation only. It should not enable production remediation actions.

## 1. Confirm Local Safety Tests Pass First

Run from the backend folder:

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

Do not continue to live AKS validation until all three tests pass.

## 2. Confirm Current Kubernetes Context

Run:

```bash
kubectl config current-context
kubectl get nodes
```

Expected:

```text
The current context should point to the intended AKS cluster.
AKS nodes should be Ready.
```

Stop if the current context points to the wrong cluster.

## 3. Confirm Aura Namespace Exists

Run:

```bash
kubectl get namespace aura
```

If it does not exist, apply the namespace manifest from the backend folder:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike/backend

kubectl apply -f k8s/aura-namespace.yaml
```

## 4. Confirm Aura ConfigMap and Secret Exist

Run:

```bash
kubectl get configmap aura-config -n aura
kubectl get secret aura-secrets -n aura
```

Expected:

```text
aura-config exists
aura-secrets exists
```

The Tetragon bridge DaemonSet uses both resources through `envFrom`.

Do not commit real secret values.

## 5. Confirm Tetragon Is Running

Run:

```bash
kubectl get pods -A | grep tetragon
```

Expected:

```text
Tetragon pods should be running before the Aura bridge is deployed.
```

If Tetragon is not installed or not running, stop here and fix Tetragon first.

## 6. Confirm Bridge Manifest Exists

Run from the repo root:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike

ls backend/k8s/tetragon-bridge-daemonset.yaml
```

Expected:

```text
backend/k8s/tetragon-bridge-daemonset.yaml
```

## 7. Review Bridge Settings Before Apply

Inspect the DaemonSet:

```bash
sed -n '1,180p' backend/k8s/tetragon-bridge-daemonset.yaml
```

Confirm:

```text
namespace: aura
image: aurav2registry17722.azurecr.io/aura-backend:v2-ebpf-amd64
command: node streaming/tetragonBridge.js
TETRAGON_LOG_PATH=/var/run/cilium/tetragon/tetragon.log
TETRAGON_MONITORED_NAMESPACES=default
TETRAGON_READ_FROM_START=false
```

If the test namespace is not `default`, update `TETRAGON_MONITORED_NAMESPACES` before applying.

## 8. Apply the Bridge DaemonSet

Run from the backend folder:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike/backend

kubectl apply -f k8s/tetragon-bridge-daemonset.yaml
```

Expected:

```text
daemonset.apps/aura-tetragon-bridge created
```

or:

```text
daemonset.apps/aura-tetragon-bridge configured
```

## 9. Verify DaemonSet Rollout

Run:

```bash
kubectl rollout status daemonset/aura-tetragon-bridge -n aura
```

Expected:

```text
daemon set "aura-tetragon-bridge" successfully rolled out
```

Then check pods:

```bash
kubectl get pods -n aura -l app=aura-tetragon-bridge -o wide
```

Expected:

```text
Bridge pods should be Running.
```

## 10. Check Bridge Startup Logs

Run:

```bash
kubectl logs -n aura -l app=aura-tetragon-bridge --tail=100
```

Expected logs should include:

```text
[tetragon-bridge] Starting Tetragon to Kafka bridge
[tetragon-bridge] Log path: /var/run/cilium/tetragon/tetragon.log
[tetragon-bridge] Raw telemetry topic: raw-telemetry
[tetragon-bridge] Monitored namespaces: default
```

If the bridge says it is waiting for the log file, verify that Tetragon is writing logs on the node.

## 11. Controlled Suspicious Event Test

Only run this in a safe test pod and monitored namespace.

The current bridge default watches:

```text
default
```

A controlled suspicious command should look like:

```text
/bin/sh whoami
```

Expected bridge behavior:

```text
The bridge classifies the process execution as unauthorizedPodExec.
The bridge publishes the event to raw-telemetry.
```

Expected bridge log:

```text
[tetragon-bridge] Published unauthorizedPodExec to raw-telemetry
```

## 12. Verify Raw Telemetry Pipeline Separately

The bridge publishes to:

```text
raw-telemetry
```

Verify the telemetry path without enabling production remediation actions.

Recommended checks:

```bash
kubectl logs -n aura -l app=aura-tetragon-bridge --tail=100
kubectl logs -n aura -l app=telemetry-normalizer --tail=100
```

Expected:

```text
The bridge should show a Published unauthorizedPodExec message.
The telemetry normalizer should process the raw telemetry if it is running.
```

## 13. Keep Approval Flow Separate

Do not automatically approve live detections during bridge validation.

If testing approval manually, use the helper script only after confirming the telemetry event is expected:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike/backend

./scripts/run-ebpf-approval-job.sh <remediationId> <threatId> <approvalId> [targetResource]
```

Default target resource example:

```text
default/aura-ebpf-test
```

The helper script uses:

```text
k8s/approval-producer-job.yaml
```

## 14. Failure Checks

### Bridge pod is stuck or crashing

Run:

```bash
kubectl describe pods -n aura -l app=aura-tetragon-bridge
kubectl logs -n aura -l app=aura-tetragon-bridge --tail=100
```

Check for:

```text
ImagePullBackOff
CrashLoopBackOff
missing aura-config
missing aura-secrets
missing Tetragon log path
Kafka connection errors
```

### No suspicious event is detected

Check:

```text
The test pod is in a monitored namespace.
The event is a process_exec event.
The command includes a suspicious binary or argument.
Tetragon is actually logging the process execution.
The bridge pod can read /var/run/cilium/tetragon/tetragon.log.
```

### Namespace is ignored

Check the DaemonSet value:

```text
TETRAGON_MONITORED_NAMESPACES
```

If testing in `aura-lab`, the value should include:

```text
aura-lab
```

## 15. Cleanup

Remove the bridge after validation if you do not need it running:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike/backend

kubectl delete -f k8s/tetragon-bridge-daemonset.yaml
```

Verify removal:

```bash
kubectl get pods -n aura -l app=aura-tetragon-bridge
```

Expected:

```text
No resources found
```

## 16. Validation Completion Criteria

This validation is complete only when:

```text
Local classification test passed.
Local replay test passed.
Local mock publisher test passed.
Bridge DaemonSet deployed successfully.
Bridge pod logs show correct startup config.
Controlled suspicious event produced unauthorizedPodExec.
Bridge published to raw-telemetry.
No production remediation action was enabled.
Cleanup was completed if the bridge is not needed.
```

## 17. Safe Next Step

After this validation checklist is complete, the next safe step is to document or test the telemetry normalizer path separately.

Do not jump directly to automatic remediation.
