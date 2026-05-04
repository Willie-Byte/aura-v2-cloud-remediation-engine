# Aura V2 — Autonomous Cloud Remediation Engine

Aura V2 is an enterprise-style cloud security remediation platform that detects cloud misconfigurations and live runtime security events, normalizes them into actionable threats, generates AI-assisted remediation plans, requires human approval, and publishes final simulated execution results with audit visibility.

The project demonstrates a real-time security pipeline using Node.js, Express, MongoDB, React, Kafka, Azure AKS, Kubernetes, Tetragon eBPF telemetry, and AI-assisted remediation planning.

## Project Status

Aura V2 currently supports two major demo paths:

1. Live runtime security detection with Tetragon eBPF on Azure AKS.
2. Simulated cloud posture and post-quantum cryptography readiness telemetry.

The live eBPF flow has been tested end-to-end:

```text
Real AKS pod exec
  → Tetragon eBPF process_exec event
  → Aura Tetragon bridge
  → Kafka raw-telemetry topic
  → Telemetry normalizer
  → unauthorizedPodExec threat
  → AI remediation orchestrator
  → Worker validation
  → Human approval queue
  → Dashboard approval
  → Final simulated execution result
```

Final execution is intentionally kept in `simulate` mode for safety.

## What Aura Demonstrates

Aura is designed to show how an enterprise remediation engine can combine runtime detection, cloud security posture management, AI-assisted remediation planning, human approval, and auditability.

Key capabilities include:

* Live eBPF monitoring on AKS with Tetragon.
* Suspicious pod exec detection.
* Kafka-based event streaming.
* Telemetry normalization into security threats.
* AI-generated remediation plans.
* Agentic validation of remediation output.
* Human approval gates before final execution.
* Safe simulated execution mode.
* Dashboard-based approval workflow.
* MongoDB persistence for alerts and audit logs.
* Webhook ingestion for Azure, AWS, and GCP-style events.
* Quantum risk reporting and PQC readiness simulation.
* Kubernetes deployment manifests for AKS.
* Docker support for local development and containerized deployment.

## Architecture

```text
                    ┌──────────────────────────┐
                    │  AKS Workloads / Lab Pod  │
                    └─────────────┬────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │      Tetragon eBPF        │
                    │   process_exec telemetry  │
                    └─────────────┬────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │ Aura Tetragon Bridge      │
                    │ tetragonBridge.js         │
                    └─────────────┬────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │ Kafka: raw-telemetry      │
                    └─────────────┬────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │ Telemetry Normalizer      │
                    │ telemetryNormalizer.js    │
                    └─────────────┬────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │ Kafka: threat-ingest      │
                    └─────────────┬────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │ Orchestrator              │
                    │ AI remediation planning   │
                    └─────────────┬────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │ Kafka: remediation-commands│
                    └─────────────┬────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │ Worker                    │
                    │ validation + approval gate│
                    └─────────────┬────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │ Kafka: approval-queue     │
                    └─────────────┬────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │ React Dashboard Approval  │
                    └─────────────┬────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │ Kafka: approval-decisions │
                    └─────────────┬────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │ Approval Decision Consumer│
                    │ simulated final execution │
                    └─────────────┬────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │ Kafka: execution-results  │
                    └─────────────┬────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │ Streaming Monitor / Audit │
                    └──────────────────────────┘
```

## Tech Stack

### Backend

* Node.js
* Express
* MongoDB / Mongoose
* KafkaJS
* OpenAI / Azure OpenAI integration
* Tetragon log bridge
* Kubernetes deployment manifests

### Frontend

* React
* React Router
* Axios
* Dashboard pages for:

  * Alerts
  * Alert Details
  * Quantum Risk
  * Webhook Events
  * Streaming Monitor

### Infrastructure

* Azure AKS
* Azure Container Registry
* Kubernetes
* Tetragon eBPF
* Helm
* Docker
* Confluent Cloud Kafka or compatible Kafka cluster

## Main Features

### 1. Live eBPF Runtime Security

Aura can monitor live AKS runtime activity using Tetragon. The Tetragon bridge tails the Tetragon JSON log, filters monitored namespaces, detects suspicious process execution, and publishes normalized telemetry to Kafka.

Example suspicious commands include:

```text
whoami
uname -a
cat /etc/passwd
printenv
curl
wget
sh
bash
```

Detected runtime activity is mapped into the `unauthorizedPodExec` issue type.

### 2. AI Remediation Planning

The orchestrator receives normalized threats and generates a remediation command using AI. The output is validated against approved remediation policy before moving forward.

For runtime pod exec detections, Aura generates an investigation-focused plan instead of destructive actions. Recommended actions include:

* Verify whether the pod exec activity was authorized.
* Review pod, container, and process evidence.
* Inspect Kubernetes RBAC roles and bindings.
* Recommend least-privilege access controls.
* Preserve auditability.

### 3. Human Approval Gate

High-risk remediations are not executed automatically. They are routed to an approval queue and displayed in the dashboard.

A reviewer can approve or reject the remediation from the Streaming Monitor page.

### 4. Safe Simulated Execution

Aura intentionally keeps final execution in `simulate` mode. This means the pipeline behaves like a real enterprise remediation system, but it does not make destructive infrastructure changes.

This is useful for:

* Portfolio demonstrations.
* Classroom security labs.
* Safe attack simulation.
* Runtime detection training.
* Approval workflow validation.

### 5. Streaming Monitor Dashboard

The Streaming Monitor page shows:

* Stream bridge status.
* Raw telemetry count.
* Live eBPF runtime events.
* Normalized threat count.
* Awaiting approvals.
* Human decisions.
* Execution results.
* Audit timeline.
* Raw telemetry details.
* eBPF evidence.
* Approval decision details.

### 6. Quantum Risk and PQC Readiness

Aura also includes a post-quantum cryptography readiness demo. It can process simulated crypto telemetry for non-quantum-safe services and recommend TLS 1.3 with Kyber/ML-KEM hybrid key exchange where supported.

This gives the project both runtime security and future-facing cryptography governance coverage.

### 7. Webhook Intake

Aura supports webhook-style alert ingestion for:

* Azure Event Grid-style payloads.
* AWS EventBridge-style payloads.
* GCP Eventarc-style payloads.

Webhook alerts are normalized into the same Alert model used by dashboard workflows.

## Repository Structure

```text
Aura-V2-Streaming-Spike/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── alertController.js
│   │   ├── auditLogController.js
│   │   ├── remediationController.js
│   │   └── webhookController.js
│   ├── models/
│   │   ├── Alert.js
│   │   ├── AuditLog.js
│   │   └── Remediation.js
│   ├── routes/
│   │   ├── alertRoutes.js
│   │   ├── auditLogRoutes.js
│   │   ├── remediationRoutes.js
│   │   ├── streamingApprovalRoutes.js
│   │   ├── streamingRoutes.js
│   │   └── webhookRoutes.js
│   ├── services/
│   │   ├── aiService.js
│   │   └── githubService.js
│   ├── streaming/
│   │   ├── aiRemediationService.js
│   │   ├── approvalConsumer.js
│   │   ├── approvalDecisionConsumer.js
│   │   ├── approvalDecisionProducer.js
│   │   ├── applyCommandProducer.js
│   │   ├── auditConsumer.js
│   │   ├── auditProducer.js
│   │   ├── badCommandProducer.js
│   │   ├── dlqConsumer.js
│   │   ├── kafkaClient.js
│   │   ├── orchestrator.js
│   │   ├── remediationPolicy.js
│   │   ├── resultConsumer.js
│   │   ├── streamBridge.js
│   │   ├── streamState.js
│   │   ├── telemetryNormalizer.js
│   │   ├── telemetryProducer.js
│   │   ├── tetragonBridge.js
│   │   ├── validator.js
│   │   └── worker.js
│   ├── k8s/
│   │   ├── aura-namespace.yaml
│   │   ├── aura-configmap.yaml
│   │   ├── approval-consumer-deployment.yaml
│   │   ├── approval-decision-consumer-deployment.yaml
│   │   ├── approval-producer-job.yaml
│   │   ├── audit-consumer-deployment.yaml
│   │   ├── dlq-consumer-deployment.yaml
│   │   ├── orchestrator-deployment.yaml
│   │   ├── results-consumer-deployment.yaml
│   │   ├── telemetry-normalizer-deployment.yaml
│   │   ├── telemetry-pqc-job.yaml
│   │   ├── tetragon-bridge-daemonset.yaml
│   │   ├── worker-deployment.yaml
│   │   └── keda-worker-scaledobject.yaml
│   ├── scripts/
│   │   ├── run-approval-job.sh
│   │   ├── run-ebpf-approval-job.sh
│   │   └── run-pqc-telemetry-job.sh
│   ├── Dockerfile
│   └── server.js
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ConfirmModal.js
│   │   │   └── CreateAlertForm.js
│   │   ├── pages/
│   │   │   ├── AlertDetailsPage.js
│   │   │   ├── AlertsPage.js
│   │   │   ├── QuantumRiskPage.js
│   │   │   ├── StreamingMonitorPage.js
│   │   │   └── WebhookEventsPage.js
│   │   ├── services/
│   │   │   └── api.js
│   │   └── App.js
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
└── README.md
```

## Environment Variables

Create a `.env` file for the backend and streaming services.

Example:

```env
PORT=5001
MONGO_URI=mongodb://localhost:27017/aura-v2

KAFKA_CLIENT_ID=aura-v2
KAFKA_BROKER=your-kafka-broker:9092
KAFKA_USERNAME=your-kafka-username
KAFKA_PASSWORD=your-kafka-password

KAFKA_RAW_TELEMETRY_TOPIC=raw-telemetry
KAFKA_TOPIC=threat-ingest
KAFKA_REMEDIATION_TOPIC=remediation-commands
KAFKA_APPROVAL_TOPIC=approval-queue
KAFKA_APPROVAL_DECISIONS_TOPIC=approval-decisions
KAFKA_RESULTS_TOPIC=execution-results
KAFKA_AUDIT_TOPIC=audit-log
KAFKA_DLQ_TOPIC=remediation-dlq

START_STREAM_BRIDGE=true
PERSIST_STREAMING_THREATS_TO_MONGO=true

OPENAI_API_KEY=your-openai-api-key

AZURE_OPENAI_API_KEY=your-azure-openai-key
AZURE_OPENAI_ENDPOINT=your-azure-openai-endpoint
AZURE_OPENAI_DEPLOYMENT=your-deployment-name
AZURE_OPENAI_API_VERSION=2024-02-15-preview

GITHUB_TOKEN=your-github-token
GITHUB_OWNER=your-github-username-or-org
GITHUB_REPO=your-remediation-repo
GITHUB_BASE_BRANCH=main
```

For the frontend:

```env
REACT_APP_API_URL=http://localhost:5001/api
```

Do not commit real secrets to GitHub.

## Local Development

### 1. Start the backend

```bash
cd backend
npm install
START_STREAM_BRIDGE=true \
PERSIST_STREAMING_THREATS_TO_MONGO=true \
node server.js
```

The backend should run on:

```text
http://localhost:5001
```

### 2. Start the frontend

```bash
cd client
npm install
REACT_APP_API_URL=http://localhost:5001/api npm start
```

The frontend should run on:

```text
http://localhost:3000
```

### 3. Open the dashboard

```text
http://localhost:3000
```

Important pages:

```text
/                         Alerts dashboard
/alerts/:id               Alert details
/quantum-risk             Quantum risk report
/webhook-events           Webhook event history
/streaming-monitor        Streaming monitor and approval workflow
```

## Docker

Build the backend image:

```bash
cd backend
docker build -t aura-backend:local .
```

On Apple Silicon Macs, build an AMD64 image for AKS:

```bash
docker buildx build \
  --platform linux/amd64 \
  -t <your-acr>.azurecr.io/aura-backend:v2-ebpf-amd64 \
  --push .
```

Build the frontend image:

```bash
cd client
docker build -t aura-frontend:local .
```

## Kubernetes / AKS Deployment

### 1. Connect to AKS

```bash
az aks get-credentials \
  --resource-group <resource-group> \
  --name <aks-cluster-name> \
  --overwrite-existing
```

### 2. Apply namespace and config

```bash
cd backend
kubectl apply -f k8s/aura-namespace.yaml
kubectl apply -f k8s/aura-configmap.yaml
```

Create your Kubernetes secret from your real values before deploying workloads.

Do not commit production secrets.

### 3. Apply Aura workloads

```bash
kubectl apply -f k8s/telemetry-normalizer-deployment.yaml
kubectl apply -f k8s/orchestrator-deployment.yaml
kubectl apply -f k8s/worker-deployment.yaml
kubectl apply -f k8s/approval-consumer-deployment.yaml
kubectl apply -f k8s/approval-decision-consumer-deployment.yaml
kubectl apply -f k8s/audit-consumer-deployment.yaml
kubectl apply -f k8s/results-consumer-deployment.yaml
kubectl apply -f k8s/dlq-consumer-deployment.yaml
```

### 4. Verify pods

```bash
kubectl get pods -n aura
kubectl get deployments -n aura
```

## Installing Tetragon on AKS

Add the Cilium Helm repo and install Tetragon:

```bash
helm repo add cilium https://helm.cilium.io
helm repo update

helm upgrade --install tetragon cilium/tetragon -n kube-system

kubectl rollout status -n kube-system ds/tetragon -w
```

Verify Tetragon:

```bash
kubectl get pods -n kube-system -l app.kubernetes.io/name=tetragon -o wide
kubectl logs -n kube-system -l app.kubernetes.io/name=tetragon -c export-stdout --tail=50
```

## Deploying the Aura Tetragon Bridge

The bridge runs as a DaemonSet and reads:

```text
/var/run/cilium/tetragon/tetragon.log
```

Apply it:

```bash
cd backend
kubectl apply -f k8s/tetragon-bridge-daemonset.yaml
```

Check logs:

```bash
kubectl get pods -n aura -l app=aura-tetragon-bridge -o wide
kubectl logs -n aura -l app=aura-tetragon-bridge --tail=100
```

The bridge should show:

```text
[tetragon-bridge] Starting Tetragon to Kafka bridge
[tetragon-bridge] Log path: /var/run/cilium/tetragon/tetragon.log
[tetragon-bridge] Raw telemetry topic: raw-telemetry
[tetragon-bridge] Monitored namespaces: default
```

## Live eBPF Demo

### 1. Create a test deployment

```bash
kubectl create deployment aura-ebpf-test \
  --image=curlimages/curl \
  -- sleep 3600
```

Wait for it:

```bash
kubectl get pods
```

### 2. Trigger a harmless exec event

```bash
kubectl exec -it deploy/aura-ebpf-test -- sh -c 'whoami && uname -a'
```

### 3. Verify the Tetragon bridge published the event

```bash
kubectl logs -n aura -l app=aura-tetragon-bridge --since=5m --tail=100
```

Expected log:

```text
[tetragon-bridge] Published unauthorizedPodExec to raw-telemetry: default/aura-ebpf-test-...
```

### 4. Verify the full Aura pipeline

```bash
kubectl logs -n aura deployment/aura-telemetry-normalizer --since=10m --tail=100
kubectl logs -n aura deployment/aura-orchestrator --since=10m --tail=100
kubectl logs -n aura deployment/aura-worker --since=10m --tail=100
kubectl logs -n aura deployment/aura-approval-consumer --since=10m --tail=100
```

Expected flow:

```text
RAW_TELEMETRY_RECEIVED
TELEMETRY_NORMALIZED_TO_THREAT
THREAT_RECEIVED
REMEDIATION_GENERATED
REMEDIATION_COMMAND_RECEIVED
REMEDIATION_AWAITING_APPROVAL
```

### 5. Approve from the dashboard

Open:

```text
http://localhost:3000/streaming-monitor
```

Find the `awaiting_approval` result and click `Approve`.

Then verify:

```bash
kubectl logs -n aura deployment/aura-approval-decisions --since=10m --tail=100
kubectl logs -n aura deployment/aura-results-consumer --since=10m --tail=100
```

Expected final result:

```text
status: executed
executionMode: simulate
decision: approve
```

### 6. Clean up

```bash
kubectl delete deployment aura-ebpf-test
```

## Safe Lab Namespace for Security Training

For classroom or family lab practice, use a dedicated namespace instead of testing in production namespaces.

```bash
kubectl create namespace aura-lab

kubectl set env daemonset/aura-tetragon-bridge \
  TETRAGON_MONITORED_NAMESPACES=aura-lab \
  -n aura

kubectl rollout restart daemonset/aura-tetragon-bridge -n aura
kubectl rollout status daemonset/aura-tetragon-bridge -n aura
```

Create a lab target:

```bash
kubectl -n aura-lab create deployment attack-lab \
  --image=curlimages/curl \
  -- sleep 3600
```

Safe practice commands:

```bash
kubectl -n aura-lab exec -it deploy/attack-lab -- sh -c 'whoami && uname -a'
kubectl -n aura-lab exec -it deploy/attack-lab -- sh -c 'cat /etc/passwd | head'
kubectl -n aura-lab exec -it deploy/attack-lab -- sh -c 'printenv'
kubectl -n aura-lab exec -it deploy/attack-lab -- sh -c 'curl -I https://example.com'
```

Clean up:

```bash
kubectl delete namespace aura-lab
```

Only run tests against infrastructure you own or have permission to use.

## PQC Simulation Demo

Aura also includes a post-quantum cryptography simulation path.

Run the PQC telemetry job:

```bash
cd backend
./scripts/run-pqc-telemetry-job.sh
```

The script prints the latest remediation ID, threat ID, and approval ID.

Approve manually with:

```bash
./scripts/run-approval-job.sh <remediationId> <threatId> <approvalId>
```

## Manual eBPF Approval Fallback

If the dashboard is not available, the eBPF approval script can approve a known remediation manually:

```bash
cd backend
./scripts/run-ebpf-approval-job.sh <remediationId> <threatId> <approvalId> [targetResource]
```

Example:

```bash
./scripts/run-ebpf-approval-job.sh \
  rem-123 \
  threat-123 \
  approval-123 \
  default/aura-ebpf-test
```

## Safety Validation Tests

### Bad command test

The bad command producer intentionally sends a remediation with the wrong action for its issue type. The worker should reject it and send it to the DLQ.

```bash
cd backend
node streaming/badCommandProducer.js
```

Watch the DLQ:

```bash
kubectl logs -n aura deployment/aura-dlq-consumer --since=10m --tail=100
```

### Apply mode rejection test

The apply command producer intentionally sends `executionMode: apply`. The validator should reject it because Aura currently allows only simulated execution.

```bash
cd backend
node streaming/applyCommandProducer.js
```

Expected behavior:

```text
Execution mode "apply" is not allowed. Only "simulate" is currently supported.
```

## API Endpoints

### Alerts

```text
GET    /api/alerts
POST   /api/alerts
GET    /api/alerts/:id
POST   /api/alerts/:id/generate-fix
GET    /api/alerts/quantum-risk
```

### Remediations

```text
GET    /api/remediations/alert/:alertId
PATCH  /api/remediations/:id/approve
PATCH  /api/remediations/:id/reject
PATCH  /api/remediations/:id/deploy
```

### Audit Logs

```text
GET    /api/audit-logs/alert/:alertId
```

### Webhooks

```text
POST   /api/webhooks/azure
POST   /api/webhooks/aws
POST   /api/webhooks/gcp
```

### Streaming Monitor

```text
GET    /api/streaming/status
GET    /api/streaming/audit-summary
GET    /api/streaming/execution-results
POST   /api/streaming-approvals/decision
POST   /api/streaming-approvals/approve
POST   /api/streaming-approvals/reject
```

## Dashboard Pages

```text
/                    Security Alerts
/alerts/:id          Alert details and remediation workflow
/quantum-risk        Quantum risk report
/webhook-events      Webhook event history
/streaming-monitor   Live Kafka/eBPF streaming monitor
```

## Important Security Notes

* Do not commit real `.env` files.
* Do not commit Kafka credentials.
* Do not commit OpenAI or Azure OpenAI keys.
* Do not commit GitHub tokens.
* Keep final execution in `simulate` mode unless a production-grade approval and rollback model is built.
* Only run attack simulations against environments you own or have explicit permission to test.
* Use a dedicated namespace such as `aura-lab` for training.
* Avoid destructive commands in lab pods.

## Demo Script

A clear demo narrative:

```text
Aura is no longer only using simulated telemetry. I deployed Tetragon on AKS and connected it to Aura through a live eBPF bridge. When I exec into a real AKS pod, Tetragon captures the process_exec event. Aura converts that into an unauthorizedPodExec threat, generates a safe AI remediation plan, validates it, routes it to human approval, and publishes the final simulated execution result after approval from the dashboard.
```

## Current Milestone

Completed:

```text
✅ Live eBPF monitoring on AKS
✅ Tetragon installed and exporting process_exec events
✅ Aura Tetragon bridge publishing to Kafka
✅ Telemetry normalizer mapping eBPF events to unauthorizedPodExec
✅ AI remediation generation
✅ Worker validation and approval gate
✅ Dashboard approval workflow
✅ Final simulated execution result
✅ Streaming Monitor visibility
✅ Mongo alert persistence support
✅ PQC simulation support
✅ Multi-cloud webhook intake support
```

## Future Enhancements

Potential next steps:

* Add authentication and RBAC to the dashboard.
* Add dedicated lab mode controls in the UI.
* Add namespace allowlists and deny lists from the dashboard.
* Persist approval queue items directly to MongoDB.
* Add WebSocket or SSE live updates instead of polling.
* Add richer Tetragon policy filters.
* Add network_connect event classification.
* Add runtime severity scoring based on process, namespace, user, and image.
* Add GitHub PR generation for Kubernetes RBAC hardening recommendations.
* Add Terraform plan previews for cloud posture remediations.
* Add KEDA autoscaling based on Kafka queue depth.

## License

This project is for educational, portfolio, and security engineering demonstration purposes.

## Author

Wilson Galdamez

GitHub: Willie-Byte
