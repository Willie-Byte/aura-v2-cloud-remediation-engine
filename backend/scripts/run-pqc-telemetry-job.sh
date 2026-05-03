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
echo "Recent pipeline IDs:"
echo "--------------------"

echo ""
echo "Telemetry normalizer:"
kubectl logs -n aura deployment/aura-telemetry-normalizer --since=5m | grep -E "Raw telemetry|Telemetry normalized|telemetry-|threat-" || true

echo ""
echo "Orchestrator:"
kubectl logs -n aura deployment/aura-orchestrator --since=5m | grep -E "Threat received|AI remediation|threat-|rem-" || true

echo ""
echo "Worker:"
kubectl logs -n aura deployment/aura-worker --since=5m | grep -E "Remediation command|remediationId|threatId|approvalId|Command sent" || true

echo ""
echo "Approval consumer:"
kubectl logs -n aura deployment/aura-approval-consumer --since=5m | grep -E "Approval request|approvalId|remediationId|threatId" || true
