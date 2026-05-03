#!/bin/bash

set -e

echo "Deleting old PQC telemetry job if it exists..."
kubectl delete job aura-telemetry-pqc-job -n aura --ignore-not-found

echo "Starting PQC telemetry job..."
kubectl apply -f k8s/telemetry-pqc-job.yaml

echo "Waiting for telemetry job to complete..."
kubectl wait --for=condition=complete job/aura-telemetry-pqc-job -n aura --timeout=90s

echo "Telemetry job logs:"
kubectl logs -n aura job/aura-telemetry-pqc-job

echo ""
echo "Waiting 45 seconds for orchestrator, worker, and approval queue..."
sleep 45

echo ""
echo "Recent pipeline IDs:"
echo "--------------------"

echo ""
echo "Telemetry normalizer:"
kubectl logs -n aura deployment/aura-telemetry-normalizer --since=10m --tail=500 | grep -E "Raw telemetry|Telemetry normalized|telemetry-|threat-" || true

echo ""
echo "Orchestrator:"
kubectl logs -n aura deployment/aura-orchestrator --since=10m --tail=500 | grep -E "Threat received|AI remediation|threat-|rem-|remediationId" || true

echo ""
echo "Worker:"
kubectl logs -n aura deployment/aura-worker --since=10m --tail=500 | grep -E "Remediation command|remediationId|threatId|approvalId|Command sent" || true

echo ""
echo "Approval consumer:"
kubectl logs -n aura deployment/aura-approval-consumer --since=10m --tail=500 | grep -E "Approval request|approvalId|remediationId|threatId" || true

echo ""
echo "Next step:"
echo "Copy the newest remediationId, threatId, and approvalId above, then run:"
echo "./scripts/run-approval-job.sh <remediationId> <threatId> <approvalId>"