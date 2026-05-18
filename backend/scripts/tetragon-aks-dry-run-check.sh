#!/usr/bin/env bash

set -u

echo "=================================================="
echo " Aura Tetragon AKS Dry-Run Validation Check"
echo "=================================================="
echo
echo "This script only checks AKS/Tetragon readiness."
echo "It does NOT apply manifests."
echo "It does NOT delete resources."
echo "It does NOT run pod exec commands."
echo "It does NOT enable remediation."
echo

FAILURES=0

check() {
  local description="$1"
  local command="$2"

  echo "--------------------------------------------------"
  echo "CHECK: $description"
  echo "COMMAND: $command"
  echo

  if eval "$command"; then
    echo
    echo "PASS: $description"
  else
    echo
    echo "WARN/FAIL: $description"
    FAILURES=$((FAILURES + 1))
  fi

  echo
}

check "Current Kubernetes context" "kubectl config current-context"
check "AKS nodes are reachable" "kubectl get nodes"
check "Aura namespace exists" "kubectl get namespace aura"
check "Aura ConfigMap exists" "kubectl get configmap aura-config -n aura"
check "Aura Secret exists" "kubectl get secret aura-secrets -n aura"
check "Tetragon pods are visible somewhere in the cluster" "kubectl get pods -A | grep tetragon"
check "Tetragon bridge manifest exists locally" "test -f backend/k8s/tetragon-bridge-daemonset.yaml"
check "Tetragon bridge DaemonSet status if already deployed" "kubectl get daemonset aura-tetragon-bridge -n aura"
check "Tetragon bridge pods if already deployed" "kubectl get pods -n aura -l app=aura-tetragon-bridge -o wide"

echo "=================================================="
echo " Dry-Run Summary"
echo "=================================================="

if [ "$FAILURES" -eq 0 ]; then
  echo "All dry-run checks passed."
  echo "No production remediation action was enabled."
  exit 0
fi

echo "$FAILURES check(s) returned WARN/FAIL."
echo "Review the output before doing any live AKS validation."
echo "No production remediation action was enabled."
exit 1
