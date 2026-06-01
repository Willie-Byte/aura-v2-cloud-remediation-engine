# Final Demo Readiness: Controlled Observability Pipeline

## FINAL DEMO READINESS CONFIRMED FOR CONTROLLED OBSERVABILITY

This document summarizes the final demo-ready state of the Aura V2 controlled observability pipeline.

The current system demonstrates a safe, approval-gated, observable cloud remediation workflow from controlled AKS simulator activity through live eBPF detection, Kafka streaming, MongoDB persistence, read-only APIs, and frontend dashboard visibility.

The system remains safe for demo use because the validated remediation flow stays in simulation mode and stops at the human approval boundary.

No production remediation is executed.

No Terraform apply is run.

No destructive kubectl action is run.

No cloud infrastructure mutation is performed.

---

## Branch

```text
docs/final-demo-readiness-controlled-observability
```

---

## Demo-ready capabilities

Aura V2 is now ready to demonstrate the following controlled observability capabilities:

```text
live AKS simulator event
Tetragon eBPF detection
aura-tetragon-bridge publishing
Kafka topic flow
telemetry normalization
AI remediation generation
worker approval gate
MongoDB persistence
read-only streaming API
frontend Observability dashboard
Streaming Monitor approval controls
```

---

## Completed foundation

The following implementation and documentation work has been merged into `main`:

```text
PR #69  Persistent audit and result storage
PR #70  Persistent audit/result storage documentation
PR #71  Checklist update for persistent audit/result storage
PR #72  Read-only streaming observability API
PR #73  Read-only streaming observability API documentation
PR #74  Checklist update for read-only streaming observability API
PR #75  Frontend streaming observability dashboard
PR #76  Frontend streaming observability dashboard documentation
PR #77  Checklist update for frontend streaming observability dashboard
PR #78  Frontend observability dashboard polish
PR #79  Frontend observability dashboard polish documentation
PR #80  Checklist update for frontend observability dashboard polish
PR #81  Streaming Monitor persistent approval data
PR #82  Controlled bot-to-dashboard validation documentation
PR #83  Checklist update for controlled bot-to-dashboard validation
```

---

## End-to-end validated flow

The validated path is:

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

## Controlled validation proof

The successful controlled validation resource was:

```text
aura-lab/aura-telemetry-stimulator-bot-validation-004-bn6cz
```

The controlled simulator command was harmless:

```text
/usr/bin/id
```

The validation namespace was:

```text
aura-lab
```

The event type was:

```text
unauthorizedPodExec
```

The detected resource type was:

```text
aksPod
```

The cloud provider was:

```text
azure
```

---

## Safety boundary

The final validated state remained:

```text
executionMode: simulate
status: awaiting_approval
reason: human_approval_required
```

This means the demo proves visibility, detection, streaming, persistence, and approval gating without executing production changes.

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

---

## Read-only Observability dashboard

The Observability dashboard route is:

```text
/streaming-observability
```

It uses read-only persistent endpoints:

```text
GET /api/streaming/audit-events
GET /api/streaming/execution-results
GET /api/streaming/approval-requests
GET /api/streaming/approval-decisions
```

The Observability dashboard is intentionally GET-only.

It does not approve, reject, execute, apply Terraform, mutate Kubernetes resources, or mutate cloud infrastructure.

Use the dashboard filter:

```text
bot-validation-004
```

Expected proof:

```text
Audit Events show persisted records for bot-validation-004.
Execution Results show simulate / awaiting_approval records.
Approval Requests show human_approval_required records.
```

---

## Streaming Monitor approval controls

The Streaming Monitor route is:

```text
/streaming-monitor
```

The Streaming Monitor now loads persistent Mongo-backed records instead of relying only on cached in-memory data.

It uses:

```text
GET /api/streaming/audit-events
GET /api/streaming/execution-results
GET /api/streaming/approval-requests
GET /api/streaming/approval-decisions
```

Approval/rejection controls are intentionally located in the Streaming Monitor, not the read-only Observability dashboard.

The approval decision route is:

```text
POST /api/streaming-approvals/decision
```

For the current controlled demo boundary, approval decisions are still part of the simulated approval-gated workflow and do not represent production apply.

---

## Persistent API proof commands

Use these commands while the local backend is running:

```bash
curl -s "http://localhost:5001/api/streaming/audit-events?limit=5" | python3 -m json.tool

curl -s "http://localhost:5001/api/streaming/execution-results?limit=5" | python3 -m json.tool

curl -s "http://localhost:5001/api/streaming/approval-requests?limit=5" | python3 -m json.tool
```

Expected fields:

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

## Frontend demo steps

Start the backend:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike/backend
npm run dev
```

Start the frontend:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike/client
npm start
```

Open:

```text
http://localhost:3000/streaming-observability
```

Filter:

```text
bot-validation-004
```

Then open:

```text
http://localhost:3000/streaming-monitor
```

Confirm that persistent approval-ready records are visible and approval controls appear in the monitor.

---

## Demo explanation

Use this explanation during the demo:

```text
Aura V2 detected a controlled simulator command inside AKS using live Tetragon eBPF telemetry.
The bridge published the event to Kafka.
The telemetry normalizer converted the raw event into a normalized threat.
The orchestrator generated an investigative remediation plan.
The worker did not execute production remediation.
Instead, it routed the command to the human approval queue and published an awaiting_approval execution result.
The consumers persisted audit events, execution results, and approval requests into MongoDB.
The read-only API exposed those persisted records.
The Observability dashboard displayed them without mutation controls.
The Streaming Monitor displayed the same persistent approval-ready records with approval controls.
The entire flow stayed in simulate mode and did not run Terraform apply or mutate cloud resources.
```

---

## Known operational notes

### AKS image version

The persistence-capable backend image used during validation was:

```text
aurav2registry17722.azurecr.io/aura-backend:v3-persistence-observability
```

### Rollout strategy

The four persistence consumer deployments were switched to Recreate strategy because the small AKS node did not have enough CPU headroom for RollingUpdate surge pods.

Affected consumers:

```text
aura-audit-consumer
aura-results-consumer
aura-approval-consumer
aura-approval-decisions
```

### Secrets and connectivity

During validation, the following were required:

```text
MONGO_URI reachable from AKS
KAFKA_BROKER present
KAFKA_USERNAME present
KAFKA_PASSWORD present
MongoDB Atlas network access allowing AKS egress IP
```

### Credential hygiene

Kafka and MongoDB values appeared during debugging output. Rotate Confluent and MongoDB credentials before treating the environment as long-lived or shared.

---

## What is demo-ready

The following are demo-ready:

```text
controlled simulator detection
Tetragon bridge publishing
Kafka stream flow
normalizer/orchestrator/worker processing
approval-gated simulation boundary
MongoDB persistence
read-only streaming API
Observability dashboard
Streaming Monitor persistent approval records
master checklist validation references
```

---

## What is not claimed

This demo does not claim:

```text
production auto-remediation
live Terraform apply
destructive Kubernetes remediation
cloud resource mutation
fully hardened production security posture
credential rotation completed
multi-node production scaling
```

---

## Final status

```text
FINAL DEMO READINESS CONFIRMED FOR CONTROLLED OBSERVABILITY
```

The Aura V2 controlled observability pipeline is ready for a safe demo.

The demo proves end-to-end visibility and approval-gated remediation flow while preserving a non-destructive simulation boundary.

