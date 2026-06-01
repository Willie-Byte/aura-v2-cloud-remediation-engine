# Controlled Bot-to-Dashboard Validation Summary

## CONTROLLED BOT-TO-DASHBOARD VALIDATION SUCCEEDED SAFELY

This document records the successful controlled validation of the Aura V2 live eBPF-to-dashboard flow.

The validation proved that a harmless simulator job can move through the live AKS/Tetragon/Kafka pipeline, persist into MongoDB, appear through the read-only API, appear in the frontend Observability dashboard, and become visible in the Streaming Monitor approval workflow.

No production remediation was executed.

No Terraform apply was run.

No destructive kubectl action was run.

No cloud infrastructure mutation was performed.

---

## Branch

```text
docs/document-controlled-bot-to-dashboard-validation
```

---

## Related implementation PRs

```text
PR #72  Add read-only streaming observability API routes
PR #75  Add read-only streaming observability dashboard
PR #78  Polish read-only streaming observability dashboard
PR #81  Load persistent streaming approval data in monitor
```

---

## Controlled validation path

The verified path was:

```text
controlled simulator job
→ Tetragon eBPF process_exec detection
→ aura-tetragon-bridge
→ Kafka raw-telemetry
→ telemetry normalizer
→ Kafka threat-ingest
→ orchestrator
→ remediation command
→ worker
→ approval queue
→ execution result
→ Kafka audit-log / execution-results / approval-queue
→ MongoDB persistence
→ read-only streaming API
→ frontend Observability dashboard
→ Streaming Monitor approval controls
```

---

## Controlled simulator job

The validation used a harmless simulator job created from the suspended CronJob:

```bash
kubectl create job aura-telemetry-stimulator-bot-validation-004 \
  --from=cronjob/aura-telemetry-stimulator \
  -n aura-lab
```

The simulator command was harmless:

```text
/usr/bin/id
```

The simulator was isolated to:

```text
namespace: aura-lab
purpose: controlled-tetragon-simulation
```

---

## Detection proof

The Tetragon bridge detected the simulator pod and published the event:

```text
[tetragon-bridge] Published unauthorizedPodExec to raw-telemetry:
aura-lab/aura-telemetry-stimulator-bot-validation-004-bn6cz
```

The detected resource was:

```text
aura-lab/aura-telemetry-stimulator-bot-validation-004-bn6cz
```

The event type was:

```text
unauthorizedPodExec
```

The detected binary was:

```text
/usr/bin/id
```

---

## Normalizer and orchestrator proof

The telemetry normalizer received the raw Tetragon event and produced a threat.

The orchestrator received the normalized threat and generated a remediation command.

The generated action was:

```text
investigateUnauthorizedPodExec
```

The remediation was investigative and simulated. It did not execute enforcement.

---

## Worker and approval gate proof

The worker routed the remediation to the approval queue.

The execution result status was:

```text
awaiting_approval
```

The execution mode was:

```text
simulate
```

The approval reason was:

```text
human_approval_required
```

The worker published:

```text
REMEDIATION_AWAITING_APPROVAL
execution-results
approval-queue
```

---

## MongoDB persistence proof

After fixing AKS secret configuration and MongoDB Atlas network access, the persistence consumers successfully wrote records to MongoDB.

Confirmed persistence log messages included:

```text
Audit event persisted to MongoDB.
Execution result persisted to MongoDB.
Approval request persisted to MongoDB.
```

The persisted validation resource was:

```text
aura-lab/aura-telemetry-stimulator-bot-validation-004-bn6cz
```

---

## Read-only API proof

The read-only API returned persisted records for the controlled validation.

Relevant endpoints:

```text
GET /api/streaming/audit-events
GET /api/streaming/execution-results
GET /api/streaming/approval-requests
GET /api/streaming/approval-decisions
```

Observed API data included:

```text
targetResource: aura-lab/aura-telemetry-stimulator-bot-validation-004-bn6cz
executionMode: simulate
status: awaiting_approval
reason: human_approval_required
issueType: unauthorizedPodExec
resourceType: aksPod
cloudProvider: azure
```

---

## Frontend Observability dashboard proof

The frontend Observability dashboard successfully displayed the persisted validation data.

Dashboard route:

```text
/streaming-observability
```

Filter used:

```text
bot-validation-004
```

The dashboard displayed persisted audit records from the Mongo-backed API.

The Observability dashboard remained read-only and did not expose approval, rejection, execution, Terraform apply, kubectl mutation, or cloud mutation controls.

---

## Streaming Monitor approval-control proof

The Streaming Monitor was updated to read persistent Mongo-backed streaming data instead of only cached in-memory streaming state.

Dashboard route:

```text
/streaming-monitor
```

The Streaming Monitor now loads:

```text
GET /api/streaming/audit-events
GET /api/streaming/execution-results
GET /api/streaming/approval-requests
GET /api/streaming/approval-decisions
```

The monitor can now display approval-ready records from MongoDB, including the controlled bot validation record.

The approval and rejection controls are located in the Streaming Monitor, not the Observability dashboard.

---

## Safety boundary

The validation remained inside the safe demo boundary:

```text
executionMode: simulate
status: awaiting_approval
reason: human_approval_required
```

The system did not run:

```text
terraform apply
kubectl delete
kubectl patch
kubectl apply
production remediation
cloud mutation
destructive action
credential extraction
external attack
```

The validation used a controlled simulator job only.

---

## Issues found and fixed during validation

### 1. Persistence consumers initially used an old image

The AKS consumer deployments initially ran an older backend image that did not include MongoDB persistence code.

Fixed by building and deploying:

```text
aurav2registry17722.azurecr.io/aura-backend:v3-persistence-observability
```

### 2. AKS rollout was blocked by CPU pressure

The small AKS node did not have enough spare CPU for RollingUpdate surge pods.

Fixed by switching the four persistence consumer deployments to a Recreate rollout strategy.

### 3. MongoDB secret initially pointed to host.docker.internal

The AKS `MONGO_URI` initially pointed to:

```text
host.docker.internal
```

That hostname does not work from AKS.

Fixed by updating `aura-secrets` with the correct MongoDB Atlas URI.

### 4. MongoDB Atlas initially blocked AKS traffic

MongoDB Atlas blocked the AKS outbound IP until network access was allowed.

Fixed by allowing the AKS egress IP in MongoDB Atlas Network Access.

### 5. Kafka secret values were overwritten during Mongo secret repair

Recreating `aura-secrets` from `backend/.env` restored MongoDB but temporarily removed Kafka values.

Fixed by restoring:

```text
KAFKA_BROKER
KAFKA_USERNAME
KAFKA_PASSWORD
MONGO_URI
```

### 6. Streaming Monitor used cached endpoints

The Observability dashboard showed persistent records, but the Streaming Monitor did not because it used cached streaming endpoints.

Fixed by updating Streaming Monitor to load persistent Mongo-backed streaming data.

---

## Verification commands

### Verify API records

```bash
curl -s "http://localhost:5001/api/streaming/audit-events?limit=5" | python3 -m json.tool

curl -s "http://localhost:5001/api/streaming/execution-results?limit=5" | python3 -m json.tool

curl -s "http://localhost:5001/api/streaming/approval-requests?limit=5" | python3 -m json.tool
```

### Verify frontend

```text
http://localhost:3000/streaming-observability
http://localhost:3000/streaming-monitor
```

Filter:

```text
bot-validation-004
```

---

## Final result

```text
CONTROLLED BOT-TO-DASHBOARD VALIDATION SUCCEEDED SAFELY
```

Aura V2 successfully demonstrated a safe live validation path from controlled simulator execution to frontend dashboard visibility.

The final state is safe, observable, persisted, and approval-gated.

