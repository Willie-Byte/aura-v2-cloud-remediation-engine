#!/bin/bash

set -e

REMEDIATION_ID="$1"
THREAT_ID="$2"
APPROVAL_ID="$3"
TARGET_RESOURCE="${4:-default/aura-ebpf-test}"

if [ -z "$REMEDIATION_ID" ] || [ -z "$THREAT_ID" ] || [ -z "$APPROVAL_ID" ]; then
  echo "Usage: ./scripts/run-ebpf-approval-job.sh <remediationId> <threatId> <approvalId> [targetResource]"
  exit 1
fi

kubectl delete configmap aura-approval-run -n aura --ignore-not-found

kubectl create configmap aura-approval-run \
  -n aura \
  --from-literal=DECISION=approve \
  --from-literal=REMEDIATION_ID="$REMEDIATION_ID" \
  --from-literal=THREAT_ID="$THREAT_ID" \
  --from-literal=APPROVAL_ID="$APPROVAL_ID" \
  --from-literal=TARGET_RESOURCE="$TARGET_RESOURCE" \
  --from-literal=RESOURCE_TYPE=aksPod \
  --from-literal=CLOUD_PROVIDER=azure \
  --from-literal=ISSUE_TYPE=unauthorizedPodExec \
  --from-literal=ACTION=investigateUnauthorizedPodExec \
  --from-literal=RISK_LEVEL=high

kubectl delete job aura-approval-producer-job -n aura --ignore-not-found
kubectl apply -f k8s/approval-producer-job.yaml
kubectl wait --for=condition=complete job/aura-approval-producer-job -n aura --timeout=90s
kubectl logs -n aura job/aura-approval-producer-job
