# Aura V2 Demo Checklist

Use this checklist to demo the current stable `main` branch of Aura V2.

## Current Stable Milestone

Aura V2 currently demonstrates:

- Event-driven Kafka remediation pipeline
- Kafka client stability improvements
- Node 22 runtime pinning through `.nvmrc`
- Local Vector RAG with Qdrant
- OpenAI embeddings
- RAG document ingestion
- Source-code ingestion for RAG
- Source-code filter options in the RAG API and frontend
- RAG health, query, and answer endpoints
- Frontend RAG test console
- Polished RAG preset cards for fast demos
- Active preset highlighting in the RAG UI
- RAG source type badges for source cards and retrieved chunks
- RAG answer source summary banner using `sourceSummary`
- One-command RAG refresh with `npm run rag:ingest:all`
- Clean Tetragon live telemetry bridge extracted from the old eBPF branch
- Local Tetragon bridge classification test with fixture-based events
- Local Tetragon bridge log replay test with tracked `.jsonl` fixture events
- Local Tetragon bridge mock publisher test for Kafka payload shape
- Tetragon AKS deployment guide for safe live bridge rollout
- Tetragon AKS validation checklist for controlled live bridge testing
- Tetragon telemetry normalizer flow documentation
- Tetragon unauthorizedPodExec normalizer support with local test
- Tetragon normalizer publisher payload test
- Tetragon local end-to-end test for the full local pipeline
- Tetragon local negative-path E2E test for ignored/non-suspicious events
- Tetragon local all-tests command for the full safety suite
- Tetragon GitHub Actions CI workflow for local safety tests
- Tetragon AKS dry-run validation helper
- Tetragon AKS validation checklist dry-run documentation
- Tetragon controlled AKS dry-run execution result documentation
- Azure AKS readiness recovery plan documentation
- Tetragon AKS readiness final status documentation
- Tetragon AKS dry-run recovery result documentation
- Clear safety boundaries between local RAG, Kafka, AKS, eBPF, and production remediation

## 1. Start From a Clean Main Branch

Run from the repo root:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike
git checkout main
git pull
git status
git log --oneline -5
```

Expected:

```text
On branch main
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean
```

The latest commits should include recent work such as:

```text
Merge pull request #67 from Willie-Byte/docs/finalize-controlled-simulator-and-approval-boundary-summary
Merge pull request #66 from Willie-Byte/docs/update-checklist-controlled-simulator-schedule-test
Merge pull request #65 from Willie-Byte/docs/document-controlled-simulator-schedule-test
Merge pull request #64 from Willie-Byte/docs/update-checklist-approval-runner-boundary
Merge pull request #63 from Willie-Byte/feature/verify-approval-to-runner-safety-boundary
```

## 2. Use the Correct Node Version

Run from the repo root:

```bash
nvm use
node -v
```

Expected:

```text
v22.x.x
```

Important: do not run Kafka tests on Node 24. KafkaJS may show `TimeoutNegativeWarning` on Node 24.

## 3. Start Qdrant

Start Docker Desktop or OrbStack first.

If the Qdrant container already exists:

```bash
docker start aura-qdrant
```

Verify Qdrant:

```bash
docker ps
curl http://localhost:6333
```

Expected response should mention:

```text
qdrant - vector search engine
```

Qdrant dashboard:

```text
http://localhost:6333/dashboard
```

## 4. Start the Backend

Open Terminal 1:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike
nvm use
cd backend
npm install
npm run dev
```

Expected backend:

```text
Server running on port 5001
```

Leave this terminal running.

## 5. Verify RAG Health

Open Terminal 2:

```bash
curl http://localhost:5001/api/rag/health
```

Expected response should include:

```text
"success":true
"service":"Aura RAG"
"qdrantCollection":"aura_rag_documents"
"embeddingModel":"text-embedding-3-small"
"chatModel":"gpt-4o-mini"
```

The supported filters should include:

```text
source-code
backend
frontend
react
express
routes
services
scripts
developer-tools
worker
```

If this fails with `Cannot GET /api/rag/health`, make sure:

- You are on `main`
- You pulled the latest changes
- The backend server was restarted after pulling
- `backend/routes/ragRoutes.js` exists
- `backend/server.js` includes the RAG route

## 6. Re-Ingest RAG Documents If Needed

To refresh all local RAG content in one step, run from the backend folder:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike/backend
npm run rag:ingest:all
```

This runs both document ingestion and source-code ingestion:

```bash
npm run rag:ingest
npm run rag:ingest:source
```

Expected output should end with:

```text
Aura RAG ingestion complete.
Aura source-code RAG ingestion complete.
Total source-code chunks ingested: 259
```

To refresh only architecture and project documents, run:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike/backend
npm run rag:ingest
```

This loads architecture and project documents from:

```text
backend/rag-documents
```

Current RAG documents include:

```text
aura-test.md
aura-vector-rag-architecture.md
aura-streaming-kafka-architecture.md
aura-remediation-policy-safety.md
aura-telemetry-ebpf-tetragon.md
aura-rag-document-index.md
```


## 7. Ingest Source Code for RAG

Aura can now ingest selected backend and frontend source-code files into Qdrant.

Run from the backend folder:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike/backend
npm run rag:ingest:source
```

Expected output should include something like:

```text
Starting Aura source-code RAG ingestion...
Found 58 source files to ingest.
Upserted 259 chunks into aura_rag_documents
Aura source-code RAG ingestion complete.
```

The source-code ingestion script should skip unsafe or noisy files and folders such as:

```text
.git
node_modules
build
dist
coverage
.env
.env.local
package-lock.json
```

It should ingest selected files from areas such as:

```text
backend/routes
backend/services
backend/streaming
backend/scripts
backend/server.js
client/src
README.md
AURA_V2_DEMO_CHECKLIST.md
```

## 8. Test RAG Search From Terminal

Run from the backend folder:

```bash
npm run rag:search -- "What should stay separate from the vector RAG branch?"
```

Expected answer should mention that the vector RAG system should stay separate from:

- AKS deployments
- Kafka streaming workers
- live Tetragon telemetry
- Rust eBPF enforcement code
- production remediation execution

## 9. Test Source-Code RAG Search From Terminal

Run these after source-code ingestion:

```bash
npm run rag:search -- "Where is Kafka initialized?"
```

Expected top sources should include:

```text
backend/streaming/kafkaClient.js
backend/streaming/producer.js
```

```bash
npm run rag:search -- "Which file defines the RAG routes?"
```

Expected top source:

```text
backend/routes/ragRoutes.js
```

```bash
npm run rag:search -- "Where is Qdrant configured?"
```

Expected top sources should include:

```text
backend/services/qdrantService.js
backend/scripts/testQdrantConnection.js
```

## 10. Test the RAG Answer API

Run:

```bash
curl -X POST http://localhost:5001/api/rag/answer \
 -H "Content-Type: application/json" \
 -d '{
   "query": "What should stay separate from the vector RAG branch?",
   "limit": 5,
   "documentType": "architecture",
   "projectArea": "aura-rag",
   "tag": "rag"
 }'
```

Expected response should include:

- generated answer
- source files
- chunk indexes
- similarity scores
- retrieved chunks

## 11. Test the Source-Code RAG Answer API

Run:

```bash
curl -X POST http://localhost:5001/api/rag/answer \
 -H "Content-Type: application/json" \
 -d '{
   "query": "Where is Kafka initialized?",
   "limit": 5,
   "documentType": "source-code",
   "projectArea": "aura-streaming",
   "tag": "kafka"
 }'
```

Expected response should cite source-code chunks related to Kafka initialization.

Another useful source-code API test:

```bash
curl -X POST http://localhost:5001/api/rag/answer \
 -H "Content-Type: application/json" \
 -d '{
   "query": "Which file defines the RAG routes?",
   "limit": 5,
   "documentType": "source-code",
   "projectArea": "aura-rag",
   "tag": "routes"
 }'
```

Expected response should mention:

```text
backend/routes/ragRoutes.js
```

## 12. Start the Frontend

Open Terminal 3:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike/client
npm install
npm start
```

Open:

```text
http://localhost:3000/rag-test
```

If the frontend cannot reach the backend, make sure `client/.env` contains:

```env
REACT_APP_API_URL=http://localhost:5001/api
```

Restart the React dev server after changing `.env`.

## 13. Use the RAG Preset Cards

The RAG test page now includes polished demo preset cards above the question form.

Use these presets for fast demos:

```text
Kafka Source Search
RAG Routes Search
Qdrant Config Search
Worker Validation Search
Safety Boundary Search
Telemetry/Tetragon Search
```

Each preset automatically fills in:

```text
Question
Document Type
Project Area
Tag
Result Limit
```

When a preset is selected, it should visually highlight as the active preset.

Recommended demo flow:

1. Click `Kafka Source Search`.
2. Confirm the question becomes:

```text
Where is Kafka initialized?
```

3. Confirm the filters become:

```text
Document Type: source-code
Project Area: aura-streaming
Tag: kafka
```

4. Click `Ask RAG`.
5. Confirm the sources include Kafka-related source-code chunks such as:

```text
backend/streaming/kafkaClient.js
backend/streaming/producer.js
```

Use the preset cards when presenting Aura because they make the RAG demo faster, cleaner, and less error-prone.

## 14. Verify RAG Source Type Badges

After running a RAG search, the Sources and Retrieved Chunks sections should show source type badges.

Expected badge examples:

```text
SOURCE CODE
ARCHITECTURE
STREAMING
POLICY
TELEMETRY
GAME DEV
GENERAL
UNKNOWN
```

Recommended badge test:

1. Open the RAG test page:

```text
http://localhost:3000/rag-test
```

2. Click `Kafka Source Search`.
3. Click `Ask RAG`.
4. Confirm the returned source cards show a `SOURCE CODE` badge.
5. Confirm the retrieved chunks also show a `SOURCE CODE` badge.

Architecture badge test:

1. Click `Safety Boundary Search`.
2. Click `Ask RAG`.
3. Confirm the returned source cards show an `ARCHITECTURE` badge.

Telemetry badge test:

1. Click `Telemetry/Tetragon Search`.
2. Click `Ask RAG`.
3. Confirm the returned source cards show a `TELEMETRY` badge.

The badges make it easier to explain whether Aura answered from source code, architecture documents, streaming documentation, policy documentation, or telemetry documentation.

## 15. Verify RAG Answer Source Summary

After running a RAG answer request, the Answer section should show a source summary banner above the answer text.

Expected banner examples:

```text
Answered from source-code chunks
Answered from architecture documents
Answered from telemetry documents
Answered from mixed documentation and source-code chunks
Answered from mixed documentation sources
No sources found
```

Recommended source summary test:

1. Open the RAG test page:

```text
http://localhost:3000/rag-test
```

2. Click `Kafka Source Search`.
3. Click `Ask RAG`.
4. Confirm the Answer card shows:

```text
Answered from source-code chunks
Source Code: 5
5 sources
```

The backend response should also include a `sourceSummary` object:

```json
{
  "mode": "source-code-only",
  "label": "Answered from source-code chunks",
  "totalSources": 5,
  "documentTypes": ["source-code"],
  "documentTypeCounts": {
    "source-code": 5
  }
}
```

This makes the demo clearer because the viewer can immediately tell whether Aura answered from source code, documentation, or mixed retrieved context.


## 16. Frontend RAG Demo Questions

Use the RAG test page at:

```text
http://localhost:3000/rag-test
```

### Architecture Test

Question:

```text
What is the purpose of the vector RAG branch?
```

Filters:

```text
Document Type: architecture
Project Area: aura-rag
Tag: rag
```

### Safety Boundary Test

Question:

```text
What should stay separate from the vector RAG branch?
```

Expected answer should mention AKS, Kafka workers, live Tetragon, Rust eBPF, and production remediation execution.

### Streaming Test

Question:

```text
How does the Kafka streaming pipeline work?
```

Filters:

```text
Document Type: streaming
Project Area: aura-streaming
Tag: kafka
```

### Policy Test

Question:

```text
What does the validator check?
```

Filters:

```text
Document Type: policy
Project Area: aura-remediation
Tag: validation
```

### Telemetry Test

Question:

```text
What does Tetragon do in Aura?
```

Filters:

```text
Document Type: telemetry
Project Area: aura-telemetry
Tag: tetragon
```

## 17. Frontend Source-Code RAG Demo Questions

Use these to prove Aura can answer implementation-level questions.

### Kafka Source-Code Test

Question:

```text
Where is Kafka initialized?
```

Filters:

```text
Document Type: source-code
Project Area: aura-streaming
Tag: kafka
```

Expected sources should include:

```text
backend/streaming/kafkaClient.js
```

### RAG Routes Source-Code Test

Question:

```text
Which file defines the RAG routes?
```

Filters:

```text
Document Type: source-code
Project Area: aura-rag
Tag: routes
```

Expected source:

```text
backend/routes/ragRoutes.js
```

### Qdrant Source-Code Test

Question:

```text
Where is Qdrant configured?
```

Filters:

```text
Document Type: source-code
Project Area: aura-rag
Tag: qdrant
```

Expected source:

```text
backend/services/qdrantService.js
```

### Worker Validation Source-Code Test

Question:

```text
How does the worker validate remediation commands?
```

Filters:

```text
Document Type: source-code
Project Area: aura-remediation
Tag: worker
```

Expected sources may include:

```text
backend/streaming/worker.js
backend/streaming/validator.js
backend/streaming/remediationPolicy.js
```

## 18. Test Kafka Stability

Open Terminal 2:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike
nvm use
cd backend
npm run stream:audit
```

Expected:

```text
[Kafka] Client initialized using local streaming/.env variables...
Audit consumer connected. Waiting for audit events...
```

Stop it with:

```text
Control + C
```

There should be no `TimeoutNegativeWarning` when using Node 22.

## 19. Optional Streaming Demo

Run from the backend folder:

```bash
npm run stream:full
```

This starts:

- audit consumer
- result consumer
- DLQ consumer
- approval consumer
- approval decision consumer
- telemetry normalizer
- worker
- orchestrator

In another backend terminal, send a test event:

```bash
node streaming/producer.js publicSSHAccess
```

Other examples:

```bash
node streaming/producer.js unencryptedDatabase
node streaming/producer.js weakTlsVersion
```

To test invalid command rejection:

```bash
npm run stream:bad-command
```

Expected result:

- command is rejected
- command is sent to DLQ
- audit event is published
- execution result has `status: rejected`


## 20. Verify Clean Tetragon Live Telemetry Bridge

PR #12 added the clean Tetragon bridge files without merging the older `ebpf-tetragon-live` branch directly.

Files added:

```text
backend/k8s/tetragon-bridge-daemonset.yaml
backend/streaming/tetragonBridge.js
backend/scripts/run-ebpf-approval-job.sh
```

What the bridge does:

- Runs as a Kubernetes DaemonSet in the `aura` namespace
- Tails Tetragon logs from `/var/run/cilium/tetragon/tetragon.log`
- Watches monitored namespaces such as `default`
- Detects suspicious process execution such as shells, curl, wget, netcat, Python, or commands like `whoami`, `uname`, `id`, `printenv`, and `cat /etc/passwd`
- Converts suspicious Tetragon `process_exec` events into Aura telemetry
- Publishes `unauthorizedPodExec` events to the Kafka `raw-telemetry` topic
- Keeps live eBPF telemetry separate from the local RAG system

Important safety note:

```text
Do not merge the old ebpf-tetragon-live branch directly.
```

That older branch was created before the polished RAG system and would remove or roll back important RAG files. The safe path is to extract only specific Tetragon files into clean branches created from current `main`.

To confirm the bridge files exist:

```bash
ls backend/k8s/tetragon-bridge-daemonset.yaml
ls backend/streaming/tetragonBridge.js
ls backend/scripts/run-ebpf-approval-job.sh
```

Expected:

```text
All three files should exist.
```

The helper script should also be executable:

```bash
ls -l backend/scripts/run-ebpf-approval-job.sh
```

Expected mode should include executable permissions, such as:

```text
-rwxr-xr-x
```


## 21. Verify Local Tetragon Bridge Classification Test

PR #14 added a safe local test path for the Tetragon bridge classification logic.

This test does not require:

- AKS
- live Tetragon logs
- a running DaemonSet
- live pod execution
- live Kafka publishing

Files added:

```text
backend/scripts/testTetragonBridgeClassification.js
backend/fixtures/tetragon/suspicious-process-exec.json
backend/fixtures/tetragon/non-suspicious-process-exec.json
backend/fixtures/tetragon/ignored-namespace-process-exec.json
```

The bridge file was also updated so it can be imported for testing without immediately starting Kafka or tailing a real Tetragon log file:

```text
backend/streaming/tetragonBridge.js
```

Run the local bridge classification test from the backend folder:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike/backend
npm run test:tetragon:bridge
```

Expected output:

```text
[tetragon-bridge-test] Starting local classification tests...
[tetragon-bridge-test] All local classification tests passed.
```

What the test verifies:

- `/bin/sh whoami` in the `default` namespace is classified as `unauthorizedPodExec`
- `/usr/bin/sleep 30` is ignored as non-suspicious
- suspicious execution in `kube-system` is ignored because it is outside the monitored namespace
- the classification logic works without live AKS or real Tetragon logs


## 22. Verify Local Tetragon Bridge Log Replay Test

PR #16 added a local replay test for the Tetragon bridge. This gives Aura a safer test step between isolated fixture classification and live AKS/Tetragon deployment.

This replay test does not require:

- AKS
- live Tetragon logs
- a running DaemonSet
- live pod execution
- live Kafka publishing

Files added:

```text
backend/fixtures/tetragon/sample-tetragon.jsonl
backend/scripts/replayTetragonBridgeLog.js
```

The fixture uses `.jsonl` instead of `.log` because `.log` files are ignored by the repository. This keeps the replay fixture trackable in Git.

The backend package now includes:

```json
"test:tetragon:replay": "node scripts/replayTetragonBridgeLog.js"
```

Run the replay test from the backend folder:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike/backend
npm run test:tetragon:replay
```

Expected output should include:

```text
[tetragon-replay] Starting local Tetragon log replay...
[tetragon-replay] WOULD_PUBLISH line=1 issueType=unauthorizedPodExec resource=default/aura-ebpf-test binary=/bin/sh args=whoami
[tetragon-replay] IGNORED line=2
[tetragon-replay] IGNORED line=3
[tetragon-replay] WOULD_PUBLISH line=4 issueType=unauthorizedPodExec resource=default/curl-test binary=/usr/bin/curl args=http://example.com
[tetragon-replay] Summary:
  totalLines=4
  wouldPublish=2
  ignored=2
  parseErrors=0
[tetragon-replay] Local replay test passed.
```

What the replay test verifies:

- suspicious `/bin/sh whoami` in the `default` namespace would publish `unauthorizedPodExec`
- normal `/usr/bin/sleep 30` is ignored
- suspicious execution in `kube-system` is ignored because it is outside the monitored namespace
- suspicious `/usr/bin/curl http://example.com` in the `default` namespace would publish `unauthorizedPodExec`
- replay can validate newline-delimited Tetragon events before live AKS testing

Recommended local Tetragon test flow:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike/backend
npm run test:tetragon:bridge
npm run test:tetragon:replay
```

Both tests should pass before moving toward live AKS bridge testing.


## 23. Verify Local Tetragon Bridge Mock Publisher Test

PR #19 added a local mock publisher test for the Tetragon bridge. This test verifies the Kafka publish payload shape without connecting to a real Kafka cluster.

This mock publisher test does not require:

- AKS
- live Tetragon logs
- a running DaemonSet
- live pod execution
- a real Kafka connection

Files updated or added:

```text
backend/streaming/tetragonBridge.js
backend/scripts/testTetragonBridgeMockPublisher.js
backend/package.json
```

The bridge now exports a helper:

```text
buildKafkaMessageFromTelemetry
```

The backend package now includes:

```json
"test:tetragon:mock-publisher": "node scripts/testTetragonBridgeMockPublisher.js"
```

Run the mock publisher test from the backend folder:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike/backend
npm run test:tetragon:mock-publisher
```

Expected output:

```text
[tetragon-mock-publisher-test] Starting mock publisher test...
[tetragon-mock-publisher-test] Mock publisher test passed.
```

What the mock publisher test verifies:

- Kafka topic is `raw-telemetry`
- Kafka message key is `default/aura-ebpf-test`
- Kafka message value is a JSON string
- payload includes `issueType: unauthorizedPodExec`
- payload includes `source: tetragon-ebpf`
- payload includes `resourceType: aksPod`
- payload includes `resourceName: default/aura-ebpf-test`
- payload includes suspicious process details like `/bin/sh` and `whoami`
- no real Kafka connection is required

Recommended local Tetragon test flow:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike/backend
npm run test:tetragon:bridge
npm run test:tetragon:replay
npm run test:tetragon:mock-publisher
```

All three tests should pass before moving toward live AKS or live Kafka testing.


## 24. Verify Tetragon AKS Deployment Guide

PR #21 added a dedicated AKS deployment guide for the clean Tetragon bridge.

Guide file:

```text
backend/docs/tetragon-aks-deployment.md
```

This guide documents the safe path for deploying the Tetragon bridge to AKS after local tests pass.

It covers:

- required local tests before live AKS deployment
- DaemonSet overview
- required `aura-config` ConfigMap
- required `aura-secrets` Secret
- Tetragon log hostPath expectations
- rollout and pod verification commands
- controlled suspicious process test guidance
- approval helper script usage
- troubleshooting and cleanup

Verify the guide exists:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike

ls backend/docs/tetragon-aks-deployment.md
grep -n "Aura Tetragon AKS Deployment Guide" backend/docs/tetragon-aks-deployment.md
grep -n "npm run test:tetragon:mock-publisher" backend/docs/tetragon-aks-deployment.md
```

Expected:

```text
backend/docs/tetragon-aks-deployment.md
1:# Aura Tetragon AKS Deployment Guide
```

Safety note:

```text
Do not connect live Tetragon telemetry to production remediation actions yet.
```

The safe order remains:

1. local classification test
2. local replay test
3. local mock publisher test
4. controlled AKS bridge deployment
5. controlled suspicious event test
6. Kafka telemetry verification
7. approval workflow verification
8. only then consider broader automation


## 25. Verify Tetragon AKS Validation Checklist

PR #23 added a controlled AKS validation checklist for testing the clean Tetragon bridge safely.

Checklist file:

```text
backend/docs/tetragon-aks-validation-checklist.md
```

This checklist is for validation only. It should not enable production remediation actions.

It covers:

- local safety tests before AKS validation
- Kubernetes context and node checks
- Aura namespace checks
- `aura-config` ConfigMap checks
- `aura-secrets` Secret checks
- Tetragon running checks
- bridge DaemonSet apply and rollout verification
- bridge startup log validation
- controlled suspicious process event validation
- raw telemetry verification
- approval flow separation
- cleanup and completion criteria

Verify the checklist exists:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike

ls backend/docs/tetragon-aks-validation-checklist.md
grep -n "Aura Tetragon AKS Validation Checklist" backend/docs/tetragon-aks-validation-checklist.md
grep -n "npm run test:tetragon:mock-publisher" backend/docs/tetragon-aks-validation-checklist.md
grep -n "No production remediation action was enabled" backend/docs/tetragon-aks-validation-checklist.md
```

Expected:

```text
backend/docs/tetragon-aks-validation-checklist.md
1:# Aura Tetragon AKS Validation Checklist
```

Safety note:

```text
This checklist validates the bridge without enabling production remediation actions.
```


## 26. Verify Tetragon Telemetry Normalizer Flow Doc

PR #25 added documentation for the safe flow from Tetragon bridge telemetry into Aura's telemetry normalizer.

Doc file:

```text
backend/docs/tetragon-telemetry-normalizer-flow.md
```

This doc explains:

- Tetragon bridge publishes suspicious process events to `raw-telemetry`
- telemetry normalizer consumes `KAFKA_RAW_TELEMETRY_TOPIC`
- telemetry normalizer publishes supported threats to `KAFKA_TOPIC`
- current limitation: `unauthorizedPodExec` is not mapped yet
- expected behavior: unsupported Tetragon telemetry may be ignored safely
- approval and remediation should remain separate from live detection
- future branch should add explicit normalizer support and tests

Verify the doc exists:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike

ls backend/docs/tetragon-telemetry-normalizer-flow.md
grep -n "Aura Tetragon Telemetry Normalizer Flow" backend/docs/tetragon-telemetry-normalizer-flow.md
grep -n "unauthorizedPodExec" backend/docs/tetragon-telemetry-normalizer-flow.md
grep -n "feature/tetragon-unauthorized-pod-exec-normalizer" backend/docs/tetragon-telemetry-normalizer-flow.md
```

Expected:

```text
backend/docs/tetragon-telemetry-normalizer-flow.md
1:# Aura Tetragon Telemetry Normalizer Flow
```

Important current limitation:

```text
The Tetragon bridge can publish unauthorizedPodExec to raw-telemetry, but telemetryNormalizer.js does not yet convert unauthorizedPodExec into a supported threat.
```

Safe next engineering step:

```text
Add explicit unauthorizedPodExec mapping and fixture-based normalizer tests before connecting this path to approval or remediation.
```


## 27. Verify Tetragon unauthorizedPodExec Normalizer Support

PR #27 added explicit telemetry normalizer support for Tetragon `unauthorizedPodExec` events.

Files updated or added:

```text
backend/streaming/telemetryNormalizer.js
backend/scripts/testTetragonTelemetryNormalizer.js
backend/package.json
```

The normalizer now maps this Tetragon telemetry shape:

```text
eventType=process_exec
resourceType=aksPod
issueType=unauthorizedPodExec
```

into this Aura threat type:

```text
unauthorizedPodExec
```

The backend package now includes:

```json
"test:tetragon:normalizer": "node scripts/testTetragonTelemetryNormalizer.js"
```

Verify the support exists:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike

grep -n "unauthorizedPodExec" backend/streaming/telemetryNormalizer.js
grep -n "test:tetragon:normalizer" backend/package.json
ls backend/scripts/testTetragonTelemetryNormalizer.js
```

Run all local Tetragon tests:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike/backend

npm run test:tetragon:bridge
npm run test:tetragon:replay
npm run test:tetragon:mock-publisher
npm run test:tetragon:normalizer
```

Expected final result:

```text
[tetragon-bridge-test] All local classification tests passed.
[tetragon-replay] Local replay test passed.
[tetragon-mock-publisher-test] Mock publisher test passed.
[tetragon-normalizer-test] Telemetry normalizer test passed.
```

What this verifies:

- suspicious Tetragon `process_exec` telemetry can become bridge telemetry
- bridge telemetry keeps `issueType: unauthorizedPodExec`
- telemetry normalizer maps `unauthorizedPodExec` into a supported Aura threat
- unsupported telemetry still returns `null`
- no automatic production remediation is enabled


## 28. Verify Tetragon Normalizer Publisher Payload Test

PR #29 added a local publisher payload test for normalized Tetragon `unauthorizedPodExec` threats.

Files updated or added:

```text
backend/streaming/telemetryNormalizer.js
backend/scripts/testTetragonTelemetryNormalizerPublisher.js
backend/package.json
```

The normalizer now exports:

```text
buildKafkaMessageFromThreat
```

The backend package now includes:

```json
"test:tetragon:normalizer-publisher": "node scripts/testTetragonTelemetryNormalizerPublisher.js"
```

Verify the support exists:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike

grep -n "buildKafkaMessageFromThreat" backend/streaming/telemetryNormalizer.js
ls backend/scripts/testTetragonTelemetryNormalizerPublisher.js
grep -n "test:tetragon:normalizer-publisher" backend/package.json
```

Run all local Tetragon tests:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike/backend

npm run test:tetragon:bridge
npm run test:tetragon:replay
npm run test:tetragon:mock-publisher
npm run test:tetragon:normalizer
npm run test:tetragon:normalizer-publisher
```

Expected final result:

```text
[tetragon-bridge-test] All local classification tests passed.
[tetragon-replay] Local replay test passed.
[tetragon-mock-publisher-test] Mock publisher test passed.
[tetragon-normalizer-test] Telemetry normalizer test passed.
[tetragon-normalizer-publisher-test] Normalizer publisher test passed.
```

What this verifies:

- normalized `unauthorizedPodExec` threats can become Kafka messages
- main threat topic is used through `KAFKA_TOPIC`
- Kafka message key uses the threat resource name
- Kafka message value is a JSON string
- threat payload preserves `issueType: unauthorizedPodExec`
- raw telemetry is preserved in the threat payload
- no live Kafka, AKS, approval, or remediation connection is required


## 29. Verify Tetragon Local End-to-End Test

PR #31 added a full local end-to-end test for the Tetragon pipeline.

Files updated or added:

```text
backend/scripts/testTetragonLocalEndToEnd.js
backend/package.json
```

The backend package now includes:

```json
"test:tetragon:e2e": "node scripts/testTetragonLocalEndToEnd.js"
```

This local E2E test verifies the full local chain:

```text
Tetragon fixture
→ bridge classifies unauthorizedPodExec
→ bridge builds raw telemetry Kafka message
→ normalizer builds Aura threat
→ normalizer builds final threat Kafka message
```

Verify the support exists:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike

ls backend/scripts/testTetragonLocalEndToEnd.js
grep -n "test:tetragon:e2e" backend/package.json
```

Run all local Tetragon tests:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike/backend

npm run test:tetragon:bridge
npm run test:tetragon:replay
npm run test:tetragon:mock-publisher
npm run test:tetragon:normalizer
npm run test:tetragon:normalizer-publisher
npm run test:tetragon:e2e
```

Expected final result:

```text
[tetragon-bridge-test] All local classification tests passed.
[tetragon-replay] Local replay test passed.
[tetragon-mock-publisher-test] Mock publisher test passed.
[tetragon-normalizer-test] Telemetry normalizer test passed.
[tetragon-normalizer-publisher-test] Normalizer publisher test passed.
[tetragon-e2e-test] Local end-to-end test passed.
```

What this verifies:

- suspicious Tetragon fixture can become bridge telemetry
- bridge telemetry can become a raw telemetry Kafka payload
- raw telemetry can become a normalized Aura threat
- normalized Aura threat can become a final threat Kafka payload
- no live Kafka, AKS, approval, worker, or production remediation connection is required


## 30. Verify Tetragon Local E2E Negative-Path Test

PR #33 added a local negative-path E2E test for ignored and non-suspicious Tetragon events.

Files updated or added:

```text
backend/scripts/testTetragonLocalEndToEndNegative.js
backend/package.json
```

The backend package now includes:

```json
"test:tetragon:e2e-negative": "node scripts/testTetragonLocalEndToEndNegative.js"
```

This negative-path test verifies:

```text
ignored namespace event
→ no bridge telemetry
→ no normalized threat
→ no publishable threat message

non-suspicious process event
→ no bridge telemetry
→ no normalized threat
→ no publishable threat message
```

Verify the support exists:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike

ls backend/scripts/testTetragonLocalEndToEndNegative.js
grep -n "test:tetragon:e2e-negative" backend/package.json
```

Run all local Tetragon tests:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike/backend

npm run test:tetragon:bridge
npm run test:tetragon:replay
npm run test:tetragon:mock-publisher
npm run test:tetragon:normalizer
npm run test:tetragon:normalizer-publisher
npm run test:tetragon:e2e
npm run test:tetragon:e2e-negative
```

Expected final result:

```text
[tetragon-bridge-test] All local classification tests passed.
[tetragon-replay] Local replay test passed.
[tetragon-mock-publisher-test] Mock publisher test passed.
[tetragon-normalizer-test] Telemetry normalizer test passed.
[tetragon-normalizer-publisher-test] Normalizer publisher test passed.
[tetragon-e2e-test] Local end-to-end test passed.
[tetragon-e2e-negative-test] Local negative-path test passed.
```

What this verifies:

- ignored namespace events stay ignored
- non-suspicious process events stay ignored
- unsupported process telemetry does not normalize into a threat
- publisher helpers reject null telemetry/threat payloads
- no live Kafka, AKS, approval, worker, or production remediation connection is required


## 31. Verify Tetragon Local Test Suite Script

PR #35 added a single command that runs the full local Tetragon safety suite.

File updated:

```text
backend/package.json
```

The backend package now includes:

```json
"test:tetragon:all": "npm run test:tetragon:bridge && npm run test:tetragon:replay && npm run test:tetragon:mock-publisher && npm run test:tetragon:normalizer && npm run test:tetragon:normalizer-publisher && npm run test:tetragon:e2e && npm run test:tetragon:e2e-negative"
```

Verify the script exists:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike

grep -n "test:tetragon:all" backend/package.json
```

Run the full local Tetragon suite:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike/backend

npm run test:tetragon:all
```

Expected final result:

```text
[tetragon-bridge-test] All local classification tests passed.
[tetragon-replay] Local replay test passed.
[tetragon-mock-publisher-test] Mock publisher test passed.
[tetragon-normalizer-test] Telemetry normalizer test passed.
[tetragon-normalizer-publisher-test] Normalizer publisher test passed.
[tetragon-e2e-test] Local end-to-end test passed.
[tetragon-e2e-negative-test] Local negative-path test passed.
```

What this verifies:

- the whole local Tetragon safety suite can run with one command
- positive path is covered
- negative path is covered
- no live Kafka, AKS, approval, worker, or production remediation connection is required


## 32. Verify Tetragon GitHub Actions CI Workflow

PR #37 added a GitHub Actions workflow that runs the local Tetragon safety suite automatically.

Workflow file:

```text
.github/workflows/tetragon-local-tests.yml
```

The workflow is named:

```text
Tetragon Local Safety Tests
```

The workflow runs:

```bash
npm run test:tetragon:all
```

It triggers on:

```text
pull_request changes touching backend/**
pull_request changes touching .github/workflows/tetragon-local-tests.yml
push to main touching backend/**
push to main touching .github/workflows/tetragon-local-tests.yml
```

Verify the workflow exists:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike

ls .github/workflows/tetragon-local-tests.yml
grep -n "Tetragon Local Safety Tests" .github/workflows/tetragon-local-tests.yml
grep -n "npm run test:tetragon:all" .github/workflows/tetragon-local-tests.yml
grep -n "node-version-file" .github/workflows/tetragon-local-tests.yml
```

Expected:

```text
.github/workflows/tetragon-local-tests.yml
1:name: Tetragon Local Safety Tests
run: npm run test:tetragon:all
node-version-file: ".nvmrc"
```

What this verifies:

- pull requests can automatically run the local Tetragon safety suite
- the suite runs from the backend folder
- the workflow uses the repo `.nvmrc`
- tests remain local only
- no live Kafka, AKS, approval, worker, or production remediation connection is required


## 33. Verify Tetragon AKS Dry-Run Validation Helper

PR #39 added a safe AKS dry-run validation helper for the Tetragon bridge.

Helper script:

```text
backend/scripts/tetragon-aks-dry-run-check.sh
```

This helper is designed to check readiness before live AKS validation.

It checks:

```text
current Kubernetes context
AKS node reachability
aura namespace
aura-config ConfigMap
aura-secrets Secret
Tetragon pods
local Tetragon bridge manifest
existing bridge DaemonSet status if already deployed
existing bridge pods if already deployed
```

Safety boundary:

```text
It does NOT apply manifests.
It does NOT delete resources.
It does NOT run pod exec commands.
It does NOT enable remediation.
```

Verify the script exists and is executable:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike

ls -l backend/scripts/tetragon-aks-dry-run-check.sh
grep -n "Aura Tetragon AKS Dry-Run Validation Check" backend/scripts/tetragon-aks-dry-run-check.sh
grep -n "It does NOT apply manifests" backend/scripts/tetragon-aks-dry-run-check.sh
grep -n "No production remediation action was enabled" backend/scripts/tetragon-aks-dry-run-check.sh
```

Run a local syntax check:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike

bash -n backend/scripts/tetragon-aks-dry-run-check.sh
```

Optional live dry-run check:

```bash
./backend/scripts/tetragon-aks-dry-run-check.sh
```

Only run the live dry-run check after confirming your `kubectl` context points to the intended AKS cluster.

What this verifies:

- AKS readiness can be checked before applying the bridge DaemonSet
- live deployment checks are separated from apply/delete/exec actions
- no production remediation action is enabled


## 34. Verify Tetragon AKS Validation Checklist Dry-Run Docs

PR #41 updated the dedicated AKS validation checklist so the dry-run helper appears before any bridge DaemonSet apply step.

Validation checklist file:

```text
backend/docs/tetragon-aks-validation-checklist.md
```

The checklist should now include:

```text
## 2. Run AKS Dry-Run Validation Helper
```

The dry-run helper should appear before:

```text
Apply the Bridge DaemonSet
```

Verify the dedicated AKS validation checklist:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike

grep -n "Run AKS Dry-Run Validation Helper" backend/docs/tetragon-aks-validation-checklist.md
grep -n "tetragon-aks-dry-run-check.sh" backend/docs/tetragon-aks-validation-checklist.md
grep -n "does NOT" backend/docs/tetragon-aks-validation-checklist.md
grep -n "Apply the Bridge DaemonSet" backend/docs/tetragon-aks-validation-checklist.md
grep -n "HEREDOC_MARKER_SHOULD_NOT_EXIST" backend/docs/tetragon-aks-validation-checklist.md
```

Expected ordering:

```text
Run AKS Dry-Run Validation Helper
...
Apply the Bridge DaemonSet
```

The final grep should return nothing.

What this verifies:

- the dedicated AKS validation checklist documents the dry-run helper
- dry-run validation is placed before live bridge apply instructions
- safety language clearly says the helper does not apply, delete, exec, or enable remediation
- live AKS validation remains controlled


## 35. Verify Tetragon Controlled AKS Dry-Run Execution Result

PR #43 documented the controlled AKS dry-run execution result.

Result file:

```text
backend/docs/aks-validation-runs/tetragon-aks-dry-run-2026-05-25.md
```

This run intentionally stopped before any live deployment action because AKS was not reachable.

Observed safe result:

```text
This is a safe blocked state.
No Tetragon bridge DaemonSet was applied.
No production remediation was enabled.
```

Verify the result file:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike

ls backend/docs/aks-validation-runs/tetragon-aks-dry-run-2026-05-25.md
grep -n "safe blocked state" backend/docs/aks-validation-runs/tetragon-aks-dry-run-2026-05-25.md
grep -n "No Tetragon bridge DaemonSet was applied" backend/docs/aks-validation-runs/tetragon-aks-dry-run-2026-05-25.md
grep -n "No production remediation was enabled" backend/docs/aks-validation-runs/tetragon-aks-dry-run-2026-05-25.md
grep -n "HEREDOC_MARKER_SHOULD_NOT_EXIST" backend/docs/aks-validation-runs/tetragon-aks-dry-run-2026-05-25.md
```

The final grep should return nothing.

What this verifies:

- the controlled AKS dry-run was attempted safely
- the intended Kubernetes context was confirmed before the readiness check
- AKS API server reachability failed before any apply step
- the cluster and node pool were observed in a failed provisioning state
- Azure credential refresh reported a read-only/disabled subscription state
- no Aura deployment was attempted
- no Tetragon bridge DaemonSet was applied
- no production remediation was enabled


## 36. Verify Azure AKS Readiness Recovery Plan

PR #45 added a dedicated recovery plan for the Azure/AKS readiness blocker discovered during the controlled Tetragon AKS dry-run.

Recovery plan file:

```text
backend/docs/azure-aks-readiness-recovery-plan.md
```

The recovery plan documents:

```text
ReadOnlyDisabledSubscription
Required Stop Conditions
safe blocked state
```

Verify the recovery plan:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike

ls backend/docs/azure-aks-readiness-recovery-plan.md
grep -n "Azure AKS Readiness Recovery Plan" backend/docs/azure-aks-readiness-recovery-plan.md
grep -n "ReadOnlyDisabledSubscription" backend/docs/azure-aks-readiness-recovery-plan.md
grep -n "Required Stop Conditions" backend/docs/azure-aks-readiness-recovery-plan.md
grep -n "safe blocked state" backend/docs/azure-aks-readiness-recovery-plan.md
grep -n "HEREDOC_MARKER_SHOULD_NOT_EXIST" backend/docs/azure-aks-readiness-recovery-plan.md
```

The final grep should return nothing.

What this verifies:

- Azure/AKS recovery is documented before another live dry-run attempt
- the subscription read-only/disabled blocker is documented
- AKS cluster and node pool failed provisioning states are documented
- kubectl timeout stop conditions are documented
- the project remains in a safe blocked state until Azure/AKS readiness is restored
- `kubectl apply`, pod exec, and remediation remain disabled until recovery checks pass


## 37. Verify Tetragon AKS Readiness Final Status

PR #47 added the final Tetragon/AKS readiness status document.

Final status file:

```text
backend/docs/tetragon-aks-readiness-final-status.md
```

The final status document confirms:

```text
Tetragon local safety and documentation phase is complete.
Live AKS validation is intentionally paused because Azure/AKS readiness failed.
The project is in a safe blocked state, not a failed Aura state.
No Tetragon bridge DaemonSet was applied.
```

Verify the final status document:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike

ls backend/docs/tetragon-aks-readiness-final-status.md
grep -n "Tetragon AKS Readiness Final Status" backend/docs/tetragon-aks-readiness-final-status.md
grep -n "safe blocked state" backend/docs/tetragon-aks-readiness-final-status.md
grep -n "Live AKS validation is intentionally paused" backend/docs/tetragon-aks-readiness-final-status.md
grep -n "No Tetragon bridge DaemonSet was applied" backend/docs/tetragon-aks-readiness-final-status.md
grep -n "HEREDOC_MARKER_SHOULD_NOT_EXIST" backend/docs/tetragon-aks-readiness-final-status.md
```

The final grep should return nothing.

What this verifies:

- the Tetragon local safety phase is complete
- GitHub Actions CI is in place
- the AKS dry-run helper exists
- the controlled AKS dry-run was attempted safely
- live AKS validation is paused until Azure/AKS readiness is restored
- no bridge DaemonSet was applied
- no pod exec or production remediation was enabled
- the next live action is outside the repo: restore Azure subscription and AKS API health before another dry-run


## 38. Verify Successful Tetragon AKS Dry-Run Recovery

PR #49 added the successful AKS recovery and dry-run pass result.

Recovery result file:

```text
backend/docs/aks-validation-runs/tetragon-aks-dry-run-recovery-2026-05-25.md
```

The recovery result confirms:

```text
QuotaExceeded was the AKS failure root cause.
AKS became reachable from the Mac.
The node returned Ready.
The local Tetragon safety suite passed.
The AKS dry-run helper passed.
No production remediation action was enabled.
```

Verify the recovery result document:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike

ls backend/docs/aks-validation-runs/tetragon-aks-dry-run-recovery-2026-05-25.md
grep -n "Tetragon AKS Dry-Run Recovery Result" backend/docs/aks-validation-runs/tetragon-aks-dry-run-recovery-2026-05-25.md
grep -n "QuotaExceeded" backend/docs/aks-validation-runs/tetragon-aks-dry-run-recovery-2026-05-25.md
grep -n "All dry-run checks passed" backend/docs/aks-validation-runs/tetragon-aks-dry-run-recovery-2026-05-25.md
grep -n "No production remediation action was enabled" backend/docs/aks-validation-runs/tetragon-aks-dry-run-recovery-2026-05-25.md
grep -n "HEREDOC_MARKER_SHOULD_NOT_EXIST" backend/docs/aks-validation-runs/tetragon-aks-dry-run-recovery-2026-05-25.md
```

The final grep should return nothing.

What this verifies:

- the failed AKS state was traced to Standard DCASv5 Family vCPU quota
- the subscription/AKS recovery path was completed
- AKS is reachable from the Mac
- the AKS node is Ready
- local Tetragon safety tests passed before live validation
- the AKS dry-run helper passed
- the bridge is already running
- production remediation remains disabled


## 39. Verify Tetragon Controlled Live Validation

PR #51 added the controlled live AKS validation result.

Live validation result file:

```text
backend/docs/aks-validation-runs/tetragon-controlled-live-validation-2026-05-25.md
```

The live validation result confirms:

```text
A real AKS pod exec event was generated in aura-lab.
Tetragon captured the process_exec event.
The Aura Tetragon bridge classified it as unauthorizedPodExec.
The bridge published the event to Kafka raw-telemetry.
The test pod was cleaned back down to 0.
Production remediation remained disabled.
```

Verify the bridge code detects direct exec binaries:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike

grep -n "whoami|id|uname" backend/streaming/tetragonBridge.js
```

Verify the AKS whoami regression fixture exists:

```bash
ls backend/fixtures/tetragon/aks-whoami-process-exec.json
```

Verify the live validation result document:

```bash
ls backend/docs/aks-validation-runs/tetragon-controlled-live-validation-2026-05-25.md
grep -n "Tetragon Controlled Live Validation Result" backend/docs/aks-validation-runs/tetragon-controlled-live-validation-2026-05-25.md
grep -n "v3-ebpf-whoami-fix" backend/docs/aks-validation-runs/tetragon-controlled-live-validation-2026-05-25.md
grep -n "Published unauthorizedPodExec to raw-telemetry" backend/docs/aks-validation-runs/tetragon-controlled-live-validation-2026-05-25.md
grep -n "production remediation disabled" backend/docs/aks-validation-runs/tetragon-controlled-live-validation-2026-05-25.md
grep -n "HEREDOC_MARKER_SHOULD_NOT_EXIST" backend/docs/aks-validation-runs/tetragon-controlled-live-validation-2026-05-25.md
```

The final grep should return nothing.

What this verifies:

- the real AKS event shape is now covered by a regression fixture
- direct `/usr/bin/whoami` process execution is detected
- the fixed bridge image was built and deployed
- the bridge published `unauthorizedPodExec` to `raw-telemetry`
- the controlled test pod was cleaned up
- production remediation remained disabled


## 40. Verify Tetragon Downstream Normalizer Flow

PR #53 added the downstream normalizer validation result.

Downstream validation result file:

```text
backend/docs/aks-validation-runs/tetragon-downstream-normalizer-flow-2026-05-26.md
```

The downstream validation confirms:

```text
The telemetry normalizer consumed the live Tetragon event from raw-telemetry.
The normalizer published a normalized unauthorizedPodExec threat.
The orchestrator consumed the threat and generated an investigation remediation command.
The worker validated the remediation command.
The worker detected requiresApproval: true.
The worker sent the command to the approval queue.
The results consumer recorded status: awaiting_approval.
No production remediation was enabled.
```

Verify the downstream validation document:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike

ls backend/docs/aks-validation-runs/tetragon-downstream-normalizer-flow-2026-05-26.md
grep -n "Tetragon Downstream Normalizer Flow Validation" backend/docs/aks-validation-runs/tetragon-downstream-normalizer-flow-2026-05-26.md
grep -n "raw-telemetry" backend/docs/aks-validation-runs/tetragon-downstream-normalizer-flow-2026-05-26.md
grep -n "Telemetry normalizer" backend/docs/aks-validation-runs/tetragon-downstream-normalizer-flow-2026-05-26.md
grep -n "threat-1779745557422" backend/docs/aks-validation-runs/tetragon-downstream-normalizer-flow-2026-05-26.md
grep -n "rem-1779745566993" backend/docs/aks-validation-runs/tetragon-downstream-normalizer-flow-2026-05-26.md
grep -n "approval-1779745567621" backend/docs/aks-validation-runs/tetragon-downstream-normalizer-flow-2026-05-26.md
grep -n "awaiting_approval" backend/docs/aks-validation-runs/tetragon-downstream-normalizer-flow-2026-05-26.md
grep -n "human_approval_required" backend/docs/aks-validation-runs/tetragon-downstream-normalizer-flow-2026-05-26.md
grep -n "HEREDOC_MARKER_SHOULD_NOT_EXIST" backend/docs/aks-validation-runs/tetragon-downstream-normalizer-flow-2026-05-26.md
```

The final grep should return nothing.

What this verifies:

- the real Tetragon bridge event was consumed from `raw-telemetry`
- the event was normalized into a threat
- the orchestrator generated a remediation command
- the worker routed the remediation to the approval queue
- the final result status was `awaiting_approval`
- no automatic destructive remediation occurred


## 41. Verify Tetragon Live Pipeline Final Status

PR #55 added the final live Tetragon pipeline status document.

Final status document:

```text
backend/docs/tetragon-live-pipeline-final-status.md
```

The final status document confirms:

```text
AKS pod exec was captured by Tetragon.
The Aura bridge classified unauthorizedPodExec.
The bridge published to Kafka raw-telemetry.
The telemetry normalizer created a normalized threat.
The orchestrator generated a safe investigation remediation command.
The worker validated the remediation command.
The worker routed the command to the approval queue.
The final result status was awaiting_approval.
Production remediation remained disabled.
```

Verify the final status document:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike

ls backend/docs/tetragon-live-pipeline-final-status.md
grep -n "Tetragon Live Pipeline Final Status" backend/docs/tetragon-live-pipeline-final-status.md
grep -n "LIVE PIPELINE VALIDATED SAFELY" backend/docs/tetragon-live-pipeline-final-status.md
grep -n "Awaiting approval result" backend/docs/tetragon-live-pipeline-final-status.md
grep -n "No production remediation was enabled" backend/docs/tetragon-live-pipeline-final-status.md
grep -n "HEREDOC_MARKER_SHOULD_NOT_EXIST" backend/docs/tetragon-live-pipeline-final-status.md
```

The final grep should return nothing.

What this verifies:

- the final live Tetragon pipeline status is documented
- the complete validated path is summarized in one place
- safety gates are documented
- production remediation remained disabled
- no additional live AKS event is required for the checklist update


## 42. Verify Aura V2 Demo Readiness Summary

PR #57 added the Aura V2 demo readiness summary.

Demo readiness summary document:

```text
backend/docs/aura-v2-demo-readiness-summary.md
```

The demo readiness summary confirms:

```text
Aura V2 is demo ready with safety boundaries.
The Tetragon live pipeline was validated safely.
Local RAG remains local-first.
Production remediation execution remains disabled.
Terraform apply remains disabled.
Destructive Kubernetes actions remain disabled.
Direct RAG-to-live-telemetry automation remains disabled.
```

Verify the demo readiness summary document:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike

ls backend/docs/aura-v2-demo-readiness-summary.md
grep -n "Aura V2 Demo Readiness Summary" backend/docs/aura-v2-demo-readiness-summary.md
grep -n "DEMO READY WITH SAFETY BOUNDARIES" backend/docs/aura-v2-demo-readiness-summary.md
grep -n "LIVE PIPELINE VALIDATED SAFELY" backend/docs/aura-v2-demo-readiness-summary.md
grep -n "Production remediation execution" backend/docs/aura-v2-demo-readiness-summary.md
grep -n "HEREDOC_MARKER_SHOULD_NOT_EXIST" backend/docs/aura-v2-demo-readiness-summary.md
```

The final grep should return nothing.

What this verifies:

- the demo readiness state is summarized in one document
- safe demo capabilities are listed
- disabled capabilities are listed
- the final Tetragon status document and main checklist are referenced
- no additional live AKS event is required for the checklist update


## 43. Verify Controlled Tetragon Simulator Manual Run

PR #61 added a controlled in-cluster Tetragon simulator CronJob and documented the first safe manual simulator validation.

Simulator manifest:

```text
backend/k8s/simulators/aura-telemetry-stimulator-cronjob.yaml
```

Validation result document:

```text
backend/docs/aks-validation-runs/tetragon-controlled-simulator-manual-run-2026-05-30.md
```

The simulator manifest confirms:

```text
suspend: true
/usr/bin/id
concurrencyPolicy: Forbid
backoffLimit: 0
ttlSecondsAfterFinished: 300
activeDeadlineSeconds: 60
```

The validation result confirms:

```text
CONTROLLED SIMULATOR VALIDATED SAFELY
manual-003
unauthorizedPodExec
awaiting_approval
human_approval_required
```

Verify the controlled simulator manifest and result document:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike

ls backend/k8s/simulators/aura-telemetry-stimulator-cronjob.yaml
ls backend/docs/aks-validation-runs/tetragon-controlled-simulator-manual-run-2026-05-30.md

grep -n "suspend: true" backend/k8s/simulators/aura-telemetry-stimulator-cronjob.yaml
grep -n "/usr/bin/id" backend/k8s/simulators/aura-telemetry-stimulator-cronjob.yaml
grep -n "CONTROLLED SIMULATOR VALIDATED SAFELY" backend/docs/aks-validation-runs/tetragon-controlled-simulator-manual-run-2026-05-30.md
grep -n "manual-003" backend/docs/aks-validation-runs/tetragon-controlled-simulator-manual-run-2026-05-30.md
grep -n "awaiting_approval" backend/docs/aks-validation-runs/tetragon-controlled-simulator-manual-run-2026-05-30.md
grep -n "human_approval_required" backend/docs/aks-validation-runs/tetragon-controlled-simulator-manual-run-2026-05-30.md
grep -n "HEREDOC_MARKER_SHOULD_NOT_EXIST" backend/docs/aks-validation-runs/tetragon-controlled-simulator-manual-run-2026-05-30.md
```

The final grep should return nothing.

What this verifies:

- the controlled simulator exists in source control
- the simulator is suspended by default
- the simulator runs a direct `/usr/bin/id` command
- the first manual simulator run was validated safely
- the resulting remediation still stopped at human approval
- no recurring 4-minute schedule is enabled yet


## 44. Verify Approval-to-Runner Safety Boundary

PR #63 added a dedicated approval-to-runner safety boundary document.

Safety boundary document:

```text
backend/docs/approval-to-runner-safety-boundary.md
```

Final finding:

```text
APPROVE DOES NOT RUN PRODUCTION APPLY
```

The approval path is currently:

```text
approval route
→ Kafka approval-decisions topic
→ approval decision consumer
→ simulated execution result
→ execution-results topic
```

The approval path is not currently:

```text
approval route
→ Terraform apply
→ kubectl mutation
→ Azure CLI mutation
→ production execution runner
```

Verify the safety boundary document:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike

ls backend/docs/approval-to-runner-safety-boundary.md

grep -n "APPROVE DOES NOT RUN PRODUCTION APPLY" backend/docs/approval-to-runner-safety-boundary.md
grep -n "simulation-only" backend/docs/approval-to-runner-safety-boundary.md
grep -n "executionMode: simulate" backend/docs/approval-to-runner-safety-boundary.md
grep -n "Final execution is still simulated for safety" backend/docs/approval-to-runner-safety-boundary.md
grep -n "HEREDOC_MARKER_SHOULD_NOT_EXIST" backend/docs/approval-to-runner-safety-boundary.md
```

The final grep should return nothing.

What this verifies:

- dashboard approval does not call a production runner
- approval decisions are still simulation-only
- approval decisions preserve `executionMode: simulate`
- approved decisions publish simulated execution results
- no production Terraform apply is currently wired to approval


## 45. Verify Controlled Tetragon Simulator Schedule Test

PR #65 documented the first short controlled schedule test for the suspended Tetragon simulator CronJob.

Schedule test result document:

```text
backend/docs/aks-validation-runs/tetragon-controlled-simulator-schedule-test-2026-05-30.md
```

Final schedule test status:

```text
CONTROLLED SIMULATOR SCHEDULE TEST VALIDATED SAFELY
```

The schedule test confirmed:

```text
scheduled job: aura-telemetry-stimulator-29669500
pod: aura-telemetry-stimulator-29669500-x2gg8
final result: awaiting_approval
reason: human_approval_required
APPROVE DOES NOT RUN PRODUCTION APPLY
```

Verify the schedule test document:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike

ls backend/docs/aks-validation-runs/tetragon-controlled-simulator-schedule-test-2026-05-30.md

grep -n "CONTROLLED SIMULATOR SCHEDULE TEST VALIDATED SAFELY" backend/docs/aks-validation-runs/tetragon-controlled-simulator-schedule-test-2026-05-30.md
grep -n "aura-telemetry-stimulator-29669500" backend/docs/aks-validation-runs/tetragon-controlled-simulator-schedule-test-2026-05-30.md
grep -n "aura-telemetry-stimulator-29669500-x2gg8" backend/docs/aks-validation-runs/tetragon-controlled-simulator-schedule-test-2026-05-30.md
grep -n "awaiting_approval" backend/docs/aks-validation-runs/tetragon-controlled-simulator-schedule-test-2026-05-30.md
grep -n "human_approval_required" backend/docs/aks-validation-runs/tetragon-controlled-simulator-schedule-test-2026-05-30.md
grep -n "APPROVE DOES NOT RUN PRODUCTION APPLY" backend/docs/aks-validation-runs/tetragon-controlled-simulator-schedule-test-2026-05-30.md
grep -n "HEREDOC_MARKER_SHOULD_NOT_EXIST" backend/docs/aks-validation-runs/tetragon-controlled-simulator-schedule-test-2026-05-30.md
```

The final grep should return nothing.

What this verifies:

- the simulator can be temporarily unsuspended for a planned schedule test
- one scheduled run completed successfully
- the CronJob was returned to suspended mode
- the scheduled telemetry reached the normalizer and worker
- the result still stopped at human approval
- approval still does not run production apply


## 46. Verify Controlled Simulator and Approval Boundary Final Summary

PR #67 added the final summary document for the controlled simulator and approval-to-runner safety boundary phase.

Final summary document:

```text
backend/docs/controlled-simulator-and-approval-boundary-summary.md
```

Final summary status:

```text
CONTROLLED SIMULATOR AND APPROVAL BOUNDARY VALIDATED SAFELY
```

The final summary confirms:

```text
CONTROLLED SIMULATOR VALIDATED SAFELY
CONTROLLED SIMULATOR SCHEDULE TEST VALIDATED SAFELY
APPROVE DOES NOT RUN PRODUCTION APPLY
Termux/Tailscale external bot: future work
```

Verify the final summary document:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike

ls backend/docs/controlled-simulator-and-approval-boundary-summary.md

grep -n "CONTROLLED SIMULATOR AND APPROVAL BOUNDARY VALIDATED SAFELY" backend/docs/controlled-simulator-and-approval-boundary-summary.md
grep -n "CONTROLLED SIMULATOR VALIDATED SAFELY" backend/docs/controlled-simulator-and-approval-boundary-summary.md
grep -n "CONTROLLED SIMULATOR SCHEDULE TEST VALIDATED SAFELY" backend/docs/controlled-simulator-and-approval-boundary-summary.md
grep -n "APPROVE DOES NOT RUN PRODUCTION APPLY" backend/docs/controlled-simulator-and-approval-boundary-summary.md
grep -n "Termux/Tailscale external bot: future work" backend/docs/controlled-simulator-and-approval-boundary-summary.md
grep -n "HEREDOC_MARKER_SHOULD_NOT_EXIST" backend/docs/controlled-simulator-and-approval-boundary-summary.md
```

The final grep should return nothing.

What this verifies:

- the controlled simulator phase has a final summary document
- manual simulator validation passed
- short scheduled simulator validation passed
- approval-to-runner boundary remains simulation-only
- approve does not run production apply
- external Termux/Tailscale bot testing remains future work


## 47. RAG-Only Demo Safety Settings

For a RAG-only demo, keep this in `backend/.env`:

```env
START_STREAM_BRIDGE=false
QDRANT_URL=http://localhost:6333
RAG_COLLECTION_NAME=aura_rag_documents
EMBEDDING_MODEL=text-embedding-3-small
RAG_CHAT_MODEL=gpt-4o-mini
```

Do not commit real `.env` files.

## 48. Safety Boundaries To Explain During Demo

Aura V2 is intentionally conservative.

For the current demo:

- RAG is local-first
- Qdrant runs locally
- Source-code ingestion only embeds selected local files
- Source-code ingestion skips `.env`, lockfiles, `node_modules`, build output, and Git metadata
- Kafka is tested separately
- Production remediation execution is not enabled
- The system should not modify live AKS resources
- The clean Tetragon bridge can publish live eBPF telemetry to Kafka, but it should remain separate from the local RAG system
- The local Tetragon bridge classification test can validate suspicious-event detection before AKS deployment
- The local Tetragon replay test can validate newline-delimited Tetragon events before live AKS deployment
- The local Tetragon mock publisher test can validate Kafka payload shape before live Kafka publishing
- The Tetragon AKS deployment guide documents controlled live bridge rollout steps
- The Tetragon AKS validation checklist documents live validation without production remediation
- The Tetragon telemetry normalizer flow doc explains the current unauthorizedPodExec mapping limitation
- The Tetragon unauthorizedPodExec normalizer test verifies safe local normalization support
- The Tetragon normalizer publisher test verifies safe local Kafka payload shape
- The Tetragon local E2E test verifies the full local pipeline without live services
- The Tetragon negative-path E2E test verifies ignored/non-suspicious events stay safe
- The Tetragon all-tests script runs the full local suite with one command
- The Tetragon CI workflow runs the local suite automatically on backend PRs
- The Tetragon AKS dry-run helper checks readiness before live validation
- The Tetragon AKS validation checklist places dry-run checks before live apply steps
- The Tetragon controlled AKS dry-run result documents the safe blocked state before live apply
- The Azure AKS readiness recovery plan documents the required stop conditions before another live dry-run
- The Tetragon AKS readiness final status marks live AKS validation as paused until Azure/AKS readiness is restored
- The Tetragon AKS dry-run recovery result documents that AKS became reachable, local tests passed, and the dry-run helper passed
- The Tetragon controlled live validation result proves real AKS pod exec telemetry can be classified and published to raw-telemetry safely
- The Tetragon downstream normalizer flow validation proves the event reached the normalizer, orchestrator, worker, approval queue, and awaiting_approval result safely
- The Tetragon live pipeline final status document summarizes the validated safe end-to-end live path and the remaining disabled capabilities
- The Aura V2 demo readiness summary explains what is safe to demo and what remains intentionally disabled
- The controlled Tetragon simulator exists but remains suspended by default until a deliberate schedule test is planned
- Dashboard approval remains simulation-only and does not run production apply
- The controlled simulator schedule test passed, but the simulator must remain suspended by default
- The controlled simulator and approval boundary phase is summarized in a final status document
- The system should not connect RAG directly to live Tetragon events yet
- Rust eBPF enforcement work stays separate from RAG
- Terraform apply mode is not production-ready

## 49. Good Demo Explanation

Use this short explanation:

```text
Aura V2 is an event-driven cloud remediation prototype. It uses Kafka to separate threat intake, AI-assisted remediation planning, validation, execution results, approval decisions, DLQ handling, and audit events. The system is safety-first, so real execution is blocked behind policy validation, simulation mode, and future approval controls.

The current main branch also adds a local Vector RAG system. Aura can answer project-specific questions using local architecture documents and selected source-code files stored in Qdrant with OpenAI embeddings. The RAG UI now includes polished preset cards, source type badges, and a source summary banner for fast demos, so a presenter can quickly show architecture, source-code, Kafka, Qdrant, worker-validation, safety-boundary, and Tetragon searches while clearly showing whether each answer came from source code, architecture documents, streaming documents, policy documents, telemetry documents, or mixed retrieved context. Aura also includes a clean Tetragon bridge, a local fixture-based classification test, a `.jsonl` log replay test, a mock Kafka publisher payload test, an AKS deployment guide, an AKS validation checklist, a telemetry normalizer flow doc, local unauthorizedPodExec normalizer support, a local normalizer publisher payload test, a full local E2E test, a local negative-path E2E test, a one-command local Tetragon safety suite, a GitHub Actions CI workflow, an AKS dry-run validation helper, dedicated AKS validation checklist dry-run documentation, a controlled AKS dry-run execution result showing a safe blocked state when AKS/subscription readiness failed, an Azure AKS readiness recovery plan documenting required stop conditions before another live dry-run, a final Tetragon/AKS readiness status document marking live AKS validation as paused until Azure/AKS health is restored, a successful AKS dry-run recovery result documenting the quota root cause, restored AKS reachability, passing local Tetragon safety tests, and passing dry-run helper, and a controlled live AKS validation result proving that a real pod exec event can be captured by Tetragon, classified by Aura as unauthorizedPodExec, and published to Kafka raw-telemetry while production remediation remains disabled, and a downstream normalizer validation result proving the same event safely flowed through raw-telemetry, normalization, orchestration, worker validation, the approval queue, and an awaiting_approval result without automatic destructive remediation, and a final live pipeline status document summarizing that the Tetragon live pipeline was validated safely while production remediation, Terraform apply, destructive Kubernetes actions, and direct RAG-to-live-telemetry automation remain disabled, and a demo readiness summary that clearly lists what Aura V2 can safely demonstrate now, and a controlled in-cluster simulator that can safely generate lab telemetry while remaining suspended by default, plus an approval-to-runner safety audit proving approve does not run production apply, and a short controlled schedule test proving the simulator can be briefly unsuspended and safely returned to suspended mode, with a final summary document wrapping the simulator and approval boundary phase.
```

## 50. Troubleshooting

### RAG health returns 404

Restart the backend after pulling latest `main`:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike/backend
npm run dev
```

Check that the RAG route file exists:

```bash
ls backend/routes/ragRoutes.js
```

### Missing Qdrant dependency

If you see:

```text
Cannot find module '@qdrant/js-client-rest'
```

Run:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike/backend
npm install
```

The dependency should already be committed in `package.json`.

### Missing RAG script

If you see:

```text
npm error Missing script: "rag:search"
```

Check `backend/package.json` and confirm it contains:

```json
"rag:test:qdrant": "node scripts/testQdrantConnection.js",
"rag:ingest": "node scripts/ingestRagDocuments.js",
"rag:ingest:source": "node scripts/ingestSourceCodeForRag.js",
"rag:ingest:all": "npm run rag:ingest && npm run rag:ingest:source",
"rag:search": "node scripts/searchRagDocuments.js",
"test:tetragon:bridge": "node scripts/testTetragonBridgeClassification.js",
"test:tetragon:replay": "node scripts/replayTetragonBridgeLog.js",
"test:tetragon:mock-publisher": "node scripts/testTetragonBridgeMockPublisher.js"
```

### RAG preset cards do not appear

Make sure you pulled the latest `main` and restarted the React dev server:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike
git checkout main
git pull
cd client
npm start
```

Then open:

```text
http://localhost:3000/rag-test
```

### Preset card does not highlight

Refresh the browser page and click the preset again.

The active preset should use the `rag-preset-button-active` class.

### RAG source badges do not appear

Make sure you pulled the latest `main` and restarted the React dev server:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike
git checkout main
git pull
cd client
npm start
```

Then run a preset search and check the Sources and Retrieved Chunks sections.

Expected source badge CSS classes include:

```text
rag-source-badge
rag-source-badge-source-code
rag-source-badge-architecture
rag-source-badge-streaming
rag-source-badge-policy
rag-source-badge-telemetry
```

### Local Tetragon bridge test fails

Run the test from the backend folder:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike/backend
npm run test:tetragon:bridge
```

If the script is missing, verify that PR #14 is included in your local `main` branch:

```bash
git log --oneline -5
```

The recent commits should include:

```text
Merge pull request #14 from Willie-Byte/feature/tetragon-bridge-local-test
```

Then verify the test files exist:

```bash
ls backend/scripts/testTetragonBridgeClassification.js
ls backend/fixtures/tetragon/suspicious-process-exec.json
ls backend/fixtures/tetragon/non-suspicious-process-exec.json
ls backend/fixtures/tetragon/ignored-namespace-process-exec.json
```

Expected test result:

```text
[tetragon-bridge-test] All local classification tests passed.
```

### Local Tetragon replay test fails

Run the replay test from the backend folder:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike/backend
npm run test:tetragon:replay
```

If the script or fixture is missing, verify that PR #16 is included in your local `main` branch:

```bash
git log --oneline -5
```

The recent commits should include:

```text
Merge pull request #16 from Willie-Byte/feature/tetragon-bridge-log-replay
```

Then verify the replay files exist:

```bash
ls backend/fixtures/tetragon/sample-tetragon.jsonl
ls backend/scripts/replayTetragonBridgeLog.js
grep -n "test:tetragon:replay" backend/package.json
```

Expected replay result:

```text
[tetragon-replay] Summary:
  totalLines=4
  wouldPublish=2
  ignored=2
  parseErrors=0
[tetragon-replay] Local replay test passed.
```

If the fixture path points to `sample-tetragon.log`, update it to `sample-tetragon.jsonl`. The `.log` extension is ignored by the repository and should not be used for tracked test fixtures.

### Local Tetragon mock publisher test fails

Run the mock publisher test from the backend folder:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike/backend
npm run test:tetragon:mock-publisher
```

If the script or helper is missing, verify that PR #19 is included in your local `main` branch:

```bash
git log --oneline -5
```

The recent commits should include:

```text
Merge pull request #19 from Willie-Byte/feature/tetragon-bridge-mock-publisher
```

Then verify the files and helper exist:

```bash
grep -n "buildKafkaMessageFromTelemetry" backend/streaming/tetragonBridge.js
ls backend/scripts/testTetragonBridgeMockPublisher.js
grep -n "test:tetragon:mock-publisher" backend/package.json
```

Expected result:

```text
[tetragon-mock-publisher-test] Mock publisher test passed.
```

This test should not require a real Kafka cluster.

### Controlled simulator and approval boundary final summary does not appear

Verify that PR #67 is included in your local `main` branch:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike
git checkout main
git pull
git log --oneline -6
```

The recent commits should include:

```text
Merge pull request #67 from Willie-Byte/docs/finalize-controlled-simulator-and-approval-boundary-summary
```

Then verify the final summary document exists:

```bash
ls backend/docs/controlled-simulator-and-approval-boundary-summary.md
grep -n "CONTROLLED SIMULATOR AND APPROVAL BOUNDARY VALIDATED SAFELY" backend/docs/controlled-simulator-and-approval-boundary-summary.md
grep -n "APPROVE DOES NOT RUN PRODUCTION APPLY" backend/docs/controlled-simulator-and-approval-boundary-summary.md
grep -n "Termux/Tailscale external bot: future work" backend/docs/controlled-simulator-and-approval-boundary-summary.md
```

Expected result:

```text
CONTROLLED SIMULATOR AND APPROVAL BOUNDARY VALIDATED SAFELY
APPROVE DOES NOT RUN PRODUCTION APPLY
Termux/Tailscale external bot: future work
```

### Controlled simulator schedule test does not appear

Verify that PR #65 is included in your local `main` branch:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike
git checkout main
git pull
git log --oneline -6
```

The recent commits should include:

```text
Merge pull request #65 from Willie-Byte/docs/document-controlled-simulator-schedule-test
```

Then verify the schedule test document exists:

```bash
ls backend/docs/aks-validation-runs/tetragon-controlled-simulator-schedule-test-2026-05-30.md
grep -n "CONTROLLED SIMULATOR SCHEDULE TEST VALIDATED SAFELY" backend/docs/aks-validation-runs/tetragon-controlled-simulator-schedule-test-2026-05-30.md
grep -n "aura-telemetry-stimulator-29669500" backend/docs/aks-validation-runs/tetragon-controlled-simulator-schedule-test-2026-05-30.md
grep -n "awaiting_approval" backend/docs/aks-validation-runs/tetragon-controlled-simulator-schedule-test-2026-05-30.md
grep -n "human_approval_required" backend/docs/aks-validation-runs/tetragon-controlled-simulator-schedule-test-2026-05-30.md
grep -n "APPROVE DOES NOT RUN PRODUCTION APPLY" backend/docs/aks-validation-runs/tetragon-controlled-simulator-schedule-test-2026-05-30.md
```

Expected result:

```text
CONTROLLED SIMULATOR SCHEDULE TEST VALIDATED SAFELY
aura-telemetry-stimulator-29669500
awaiting_approval
human_approval_required
APPROVE DOES NOT RUN PRODUCTION APPLY
```

### Approval-to-runner safety boundary does not appear

Verify that PR #63 is included in your local `main` branch:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike
git checkout main
git pull
git log --oneline -6
```

The recent commits should include:

```text
Merge pull request #63 from Willie-Byte/feature/verify-approval-to-runner-safety-boundary
```

Then verify the safety boundary document exists:

```bash
ls backend/docs/approval-to-runner-safety-boundary.md
grep -n "APPROVE DOES NOT RUN PRODUCTION APPLY" backend/docs/approval-to-runner-safety-boundary.md
grep -n "simulation-only" backend/docs/approval-to-runner-safety-boundary.md
grep -n "executionMode: simulate" backend/docs/approval-to-runner-safety-boundary.md
grep -n "Final execution is still simulated for safety" backend/docs/approval-to-runner-safety-boundary.md
```

Expected result:

```text
APPROVE DOES NOT RUN PRODUCTION APPLY
simulation-only
executionMode: simulate
Final execution is still simulated for safety
```

### Controlled Tetragon simulator validation does not appear

Verify that PR #61 is included in your local `main` branch:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike
git checkout main
git pull
git log --oneline -6
```

The recent commits should include:

```text
Merge pull request #61 from Willie-Byte/feature/controlled-tetragon-simulator-cron
```

Then verify the simulator manifest and validation document exist:

```bash
ls backend/k8s/simulators/aura-telemetry-stimulator-cronjob.yaml
ls backend/docs/aks-validation-runs/tetragon-controlled-simulator-manual-run-2026-05-30.md
grep -n "suspend: true" backend/k8s/simulators/aura-telemetry-stimulator-cronjob.yaml
grep -n "/usr/bin/id" backend/k8s/simulators/aura-telemetry-stimulator-cronjob.yaml
grep -n "CONTROLLED SIMULATOR VALIDATED SAFELY" backend/docs/aks-validation-runs/tetragon-controlled-simulator-manual-run-2026-05-30.md
grep -n "human_approval_required" backend/docs/aks-validation-runs/tetragon-controlled-simulator-manual-run-2026-05-30.md
```

Expected result:

```text
suspend: true
/usr/bin/id
CONTROLLED SIMULATOR VALIDATED SAFELY
human_approval_required
```

### Aura V2 demo readiness summary does not appear

Verify that PR #57 is included in your local `main` branch:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike
git checkout main
git pull
git log --oneline -5
```

The recent commits should include:

```text
Merge pull request #57 from Willie-Byte/docs/finalize-aura-v2-demo-readiness-summary
```

Then verify the demo readiness summary document exists:

```bash
ls backend/docs/aura-v2-demo-readiness-summary.md
grep -n "Aura V2 Demo Readiness Summary" backend/docs/aura-v2-demo-readiness-summary.md
grep -n "DEMO READY WITH SAFETY BOUNDARIES" backend/docs/aura-v2-demo-readiness-summary.md
grep -n "LIVE PIPELINE VALIDATED SAFELY" backend/docs/aura-v2-demo-readiness-summary.md
grep -n "Production remediation execution" backend/docs/aura-v2-demo-readiness-summary.md
```

Expected result:

```text
Aura V2 Demo Readiness Summary
DEMO READY WITH SAFETY BOUNDARIES
LIVE PIPELINE VALIDATED SAFELY
Production remediation execution
```

### Tetragon live pipeline final status does not appear

Verify that PR #55 is included in your local `main` branch:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike
git checkout main
git pull
git log --oneline -5
```

The recent commits should include:

```text
Merge pull request #55 from Willie-Byte/docs/finalize-tetragon-live-pipeline-status
```

Then verify the final status document exists:

```bash
ls backend/docs/tetragon-live-pipeline-final-status.md
grep -n "Tetragon Live Pipeline Final Status" backend/docs/tetragon-live-pipeline-final-status.md
grep -n "LIVE PIPELINE VALIDATED SAFELY" backend/docs/tetragon-live-pipeline-final-status.md
grep -n "No production remediation was enabled" backend/docs/tetragon-live-pipeline-final-status.md
```

Expected result:

```text
Tetragon Live Pipeline Final Status
LIVE PIPELINE VALIDATED SAFELY
No production remediation was enabled
```

### Tetragon downstream normalizer validation result does not appear

Verify that PR #53 is included in your local `main` branch:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike
git checkout main
git pull
git log --oneline -5
```

The recent commits should include:

```text
Merge pull request #53 from Willie-Byte/feature/validate-tetragon-downstream-normalizer-flow
```

Then verify the downstream validation document exists:

```bash
ls backend/docs/aks-validation-runs/tetragon-downstream-normalizer-flow-2026-05-26.md
grep -n "Tetragon Downstream Normalizer Flow Validation" backend/docs/aks-validation-runs/tetragon-downstream-normalizer-flow-2026-05-26.md
grep -n "awaiting_approval" backend/docs/aks-validation-runs/tetragon-downstream-normalizer-flow-2026-05-26.md
grep -n "human_approval_required" backend/docs/aks-validation-runs/tetragon-downstream-normalizer-flow-2026-05-26.md
```

Expected result:

```text
Tetragon Downstream Normalizer Flow Validation
awaiting_approval
human_approval_required
```

### Tetragon controlled live validation result does not appear

Verify that PR #51 is included in your local `main` branch:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike
git checkout main
git pull
git log --oneline -5
```

The recent commits should include:

```text
Merge pull request #51 from Willie-Byte/feature/tetragon-controlled-live-validation
```

Then verify the code fix, regression fixture, and live validation document exist:

```bash
grep -n "whoami|id|uname" backend/streaming/tetragonBridge.js
ls backend/fixtures/tetragon/aks-whoami-process-exec.json
ls backend/docs/aks-validation-runs/tetragon-controlled-live-validation-2026-05-25.md
grep -n "Tetragon Controlled Live Validation Result" backend/docs/aks-validation-runs/tetragon-controlled-live-validation-2026-05-25.md
grep -n "Published unauthorizedPodExec to raw-telemetry" backend/docs/aks-validation-runs/tetragon-controlled-live-validation-2026-05-25.md
```

Expected result:

```text
whoami|id|uname
aks-whoami-process-exec.json
Tetragon Controlled Live Validation Result
Published unauthorizedPodExec to raw-telemetry
```

### Tetragon AKS dry-run recovery result does not appear

Verify that PR #49 is included in your local `main` branch:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike
git checkout main
git pull
git log --oneline -5
```

The recent commits should include:

```text
Merge pull request #49 from Willie-Byte/docs/document-successful-tetragon-aks-dry-run-recovery
```

Then verify the recovery result file exists:

```bash
ls backend/docs/aks-validation-runs/tetragon-aks-dry-run-recovery-2026-05-25.md
grep -n "Tetragon AKS Dry-Run Recovery Result" backend/docs/aks-validation-runs/tetragon-aks-dry-run-recovery-2026-05-25.md
grep -n "QuotaExceeded" backend/docs/aks-validation-runs/tetragon-aks-dry-run-recovery-2026-05-25.md
grep -n "All dry-run checks passed" backend/docs/aks-validation-runs/tetragon-aks-dry-run-recovery-2026-05-25.md
grep -n "No production remediation action was enabled" backend/docs/aks-validation-runs/tetragon-aks-dry-run-recovery-2026-05-25.md
```

Expected result:

```text
Tetragon AKS Dry-Run Recovery Result
QuotaExceeded
All dry-run checks passed
No production remediation action was enabled
```

### Tetragon AKS readiness final status does not appear

Verify that PR #47 is included in your local `main` branch:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike
git checkout main
git pull
git log --oneline -5
```

The recent commits should include:

```text
Merge pull request #47 from Willie-Byte/docs/finalize-tetragon-aks-readiness-status
```

Then verify the final status file exists:

```bash
ls backend/docs/tetragon-aks-readiness-final-status.md
grep -n "Tetragon AKS Readiness Final Status" backend/docs/tetragon-aks-readiness-final-status.md
grep -n "safe blocked state" backend/docs/tetragon-aks-readiness-final-status.md
grep -n "Live AKS validation is intentionally paused" backend/docs/tetragon-aks-readiness-final-status.md
grep -n "No Tetragon bridge DaemonSet was applied" backend/docs/tetragon-aks-readiness-final-status.md
```

Expected result:

```text
Tetragon AKS Readiness Final Status
safe blocked state
Live AKS validation is intentionally paused
No Tetragon bridge DaemonSet was applied
```

### Azure AKS readiness recovery plan does not appear

Verify that PR #45 is included in your local `main` branch:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike
git checkout main
git pull
git log --oneline -5
```

The recent commits should include:

```text
Merge pull request #45 from Willie-Byte/docs/update-azure-aks-readiness-recovery-plan
```

Then verify the recovery plan exists:

```bash
ls backend/docs/azure-aks-readiness-recovery-plan.md
grep -n "Azure AKS Readiness Recovery Plan" backend/docs/azure-aks-readiness-recovery-plan.md
grep -n "ReadOnlyDisabledSubscription" backend/docs/azure-aks-readiness-recovery-plan.md
grep -n "Required Stop Conditions" backend/docs/azure-aks-readiness-recovery-plan.md
grep -n "safe blocked state" backend/docs/azure-aks-readiness-recovery-plan.md
```

Expected result:

```text
Azure AKS Readiness Recovery Plan
ReadOnlyDisabledSubscription
Required Stop Conditions
safe blocked state
```

### Tetragon controlled AKS dry-run result does not appear

Verify that PR #43 is included in your local `main` branch:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike
git checkout main
git pull
git log --oneline -5
```

The recent commits should include:

```text
Merge pull request #43 from Willie-Byte/feature/tetragon-controlled-aks-dry-run-execution
```

Then verify the result file exists:

```bash
ls backend/docs/aks-validation-runs/tetragon-aks-dry-run-2026-05-25.md
grep -n "safe blocked state" backend/docs/aks-validation-runs/tetragon-aks-dry-run-2026-05-25.md
grep -n "No Tetragon bridge DaemonSet was applied" backend/docs/aks-validation-runs/tetragon-aks-dry-run-2026-05-25.md
grep -n "No production remediation was enabled" backend/docs/aks-validation-runs/tetragon-aks-dry-run-2026-05-25.md
```

Expected result:

```text
This is a safe blocked state.
No Tetragon bridge DaemonSet was applied.
No production remediation was enabled.
```

### Tetragon AKS validation checklist dry-run section does not appear

Verify that PR #41 is included in your local `main` branch:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike
git checkout main
git pull
git log --oneline -5
```

The recent commits should include:

```text
Merge pull request #41 from Willie-Byte/docs/update-tetragon-aks-validation-dry-run-docs
```

Then verify the dry-run section exists before the apply step:

```bash
grep -n "Run AKS Dry-Run Validation Helper" backend/docs/tetragon-aks-validation-checklist.md
grep -n "tetragon-aks-dry-run-check.sh" backend/docs/tetragon-aks-validation-checklist.md
grep -n "does NOT" backend/docs/tetragon-aks-validation-checklist.md
grep -n "Apply the Bridge DaemonSet" backend/docs/tetragon-aks-validation-checklist.md
```

Expected ordering:

```text
Run AKS Dry-Run Validation Helper
Apply the Bridge DaemonSet
```

### Tetragon AKS dry-run helper does not appear

Verify that PR #39 is included in your local `main` branch:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike
git checkout main
git pull
git log --oneline -5
```

The recent commits should include:

```text
Merge pull request #39 from Willie-Byte/feature/tetragon-controlled-aks-validation-dry-run
```

Then verify the script exists:

```bash
ls -l backend/scripts/tetragon-aks-dry-run-check.sh
grep -n "Aura Tetragon AKS Dry-Run Validation Check" backend/scripts/tetragon-aks-dry-run-check.sh
grep -n "It does NOT apply manifests" backend/scripts/tetragon-aks-dry-run-check.sh
grep -n "No production remediation action was enabled" backend/scripts/tetragon-aks-dry-run-check.sh
```

Run a syntax check:

```bash
bash -n backend/scripts/tetragon-aks-dry-run-check.sh
```

### Tetragon GitHub Actions CI workflow does not appear

Verify that PR #37 is included in your local `main` branch:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike
git checkout main
git pull
git log --oneline -5
```

The recent commits should include:

```text
Merge pull request #37 from Willie-Byte/feature/tetragon-ci-workflow
```

Then verify the workflow exists:

```bash
ls .github/workflows/tetragon-local-tests.yml
grep -n "Tetragon Local Safety Tests" .github/workflows/tetragon-local-tests.yml
grep -n "npm run test:tetragon:all" .github/workflows/tetragon-local-tests.yml
grep -n "node-version-file" .github/workflows/tetragon-local-tests.yml
```

Expected result:

```text
node-version-file: ".nvmrc"
run: npm run test:tetragon:all
```

If the workflow fails on GitHub, open the Actions tab, select `Tetragon Local Safety Tests`, and check whether the failure happened during checkout, Node setup, dependency install, or the local Tetragon test suite.

### Tetragon all-tests script fails

Run the full local suite from the backend folder:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike/backend

npm run test:tetragon:all
```

If the script is missing, verify that PR #35 is included in your local `main` branch:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike
git checkout main
git pull
git log --oneline -5
```

The recent commits should include:

```text
Merge pull request #35 from Willie-Byte/feature/tetragon-local-test-suite-script
```

Then verify the script exists:

```bash
grep -n "test:tetragon:all" backend/package.json
```

Expected result:

```text
[tetragon-e2e-negative-test] Local negative-path test passed.
```

### Tetragon local E2E negative-path test fails

Run all Tetragon tests from the backend folder:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike/backend

npm run test:tetragon:bridge
npm run test:tetragon:replay
npm run test:tetragon:mock-publisher
npm run test:tetragon:normalizer
npm run test:tetragon:normalizer-publisher
npm run test:tetragon:e2e
npm run test:tetragon:e2e-negative
```

If the negative-path script is missing, verify that PR #33 is included in your local `main` branch:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike
git checkout main
git pull
git log --oneline -5
```

The recent commits should include:

```text
Merge pull request #33 from Willie-Byte/feature/tetragon-e2e-negative-path-test
```

Then verify the files and script exist:

```bash
ls backend/scripts/testTetragonLocalEndToEndNegative.js
grep -n "test:tetragon:e2e-negative" backend/package.json
```

Expected result:

```text
[tetragon-e2e-negative-test] Local negative-path test passed.
```

### Tetragon local E2E test fails

Run all Tetragon tests from the backend folder:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike/backend

npm run test:tetragon:bridge
npm run test:tetragon:replay
npm run test:tetragon:mock-publisher
npm run test:tetragon:normalizer
npm run test:tetragon:normalizer-publisher
npm run test:tetragon:e2e
```

If the E2E script is missing, verify that PR #31 is included in your local `main` branch:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike
git checkout main
git pull
git log --oneline -5
```

The recent commits should include:

```text
Merge pull request #31 from Willie-Byte/feature/tetragon-local-end-to-end-test
```

Then verify the files and script exist:

```bash
ls backend/scripts/testTetragonLocalEndToEnd.js
grep -n "test:tetragon:e2e" backend/package.json
```

Expected result:

```text
[tetragon-e2e-test] Local end-to-end test passed.
```

### Tetragon normalizer publisher test fails

Run all Tetragon tests from the backend folder:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike/backend

npm run test:tetragon:bridge
npm run test:tetragon:replay
npm run test:tetragon:mock-publisher
npm run test:tetragon:normalizer
npm run test:tetragon:normalizer-publisher
```

If the normalizer publisher script is missing, verify that PR #29 is included in your local `main` branch:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike
git checkout main
git pull
git log --oneline -5
```

The recent commits should include:

```text
Merge pull request #29 from Willie-Byte/feature/tetragon-normalizer-publisher-test
```

Then verify the files and script exist:

```bash
grep -n "buildKafkaMessageFromThreat" backend/streaming/telemetryNormalizer.js
ls backend/scripts/testTetragonTelemetryNormalizerPublisher.js
grep -n "test:tetragon:normalizer-publisher" backend/package.json
```

Expected result:

```text
[tetragon-normalizer-publisher-test] Normalizer publisher test passed.
```

### Tetragon unauthorizedPodExec normalizer test fails

Run all Tetragon tests from the backend folder:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike/backend

npm run test:tetragon:bridge
npm run test:tetragon:replay
npm run test:tetragon:mock-publisher
npm run test:tetragon:normalizer
```

If the normalizer script is missing, verify that PR #27 is included in your local `main` branch:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike
git checkout main
git pull
git log --oneline -5
```

The recent commits should include:

```text
Merge pull request #27 from Willie-Byte/feature/tetragon-unauthorized-pod-exec-normalizer
```

Then verify the files and script exist:

```bash
grep -n "unauthorizedPodExec" backend/streaming/telemetryNormalizer.js
grep -n "test:tetragon:normalizer" backend/package.json
ls backend/scripts/testTetragonTelemetryNormalizer.js
```

Expected result:

```text
[tetragon-normalizer-test] Telemetry normalizer test passed.
```

### Tetragon telemetry normalizer flow doc does not appear

Make sure PR #25 is included in your local `main` branch:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike
git checkout main
git pull
git log --oneline -5
```

The recent commits should include:

```text
Merge pull request #25 from Willie-Byte/feature/tetragon-telemetry-normalizer-docs
```

Then verify the doc exists:

```bash
ls backend/docs/tetragon-telemetry-normalizer-flow.md
grep -n "Aura Tetragon Telemetry Normalizer Flow" backend/docs/tetragon-telemetry-normalizer-flow.md
```

### Tetragon AKS validation checklist does not appear

Make sure PR #23 is included in your local `main` branch:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike
git checkout main
git pull
git log --oneline -5
```

The recent commits should include:

```text
Merge pull request #23 from Willie-Byte/feature/tetragon-aks-validation-checklist
```

Then verify the checklist exists:

```bash
ls backend/docs/tetragon-aks-validation-checklist.md
grep -n "Aura Tetragon AKS Validation Checklist" backend/docs/tetragon-aks-validation-checklist.md
```

### Tetragon AKS deployment guide does not appear

Make sure PR #21 is included in your local `main` branch:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike
git checkout main
git pull
git log --oneline -5
```

The recent commits should include:

```text
Merge pull request #21 from Willie-Byte/feature/tetragon-aks-deployment-docs
```

Then verify the guide exists:

```bash
ls backend/docs/tetragon-aks-deployment.md
grep -n "Aura Tetragon AKS Deployment Guide" backend/docs/tetragon-aks-deployment.md
```

### Tetragon bridge files do not appear

Make sure PR #12 is included in your local `main` branch:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike
git checkout main
git pull
git log --oneline -5
```

The recent commits should include:

```text
Merge pull request #12 from Willie-Byte/feature/tetragon-live-bridge-clean
```

Then verify the files:

```bash
ls backend/k8s/tetragon-bridge-daemonset.yaml
ls backend/streaming/tetragonBridge.js
ls backend/scripts/run-ebpf-approval-job.sh
```

### Tetragon bridge does not publish telemetry

Check the bridge configuration first:

```text
TETRAGON_LOG_PATH=/var/run/cilium/tetragon/tetragon.log
TETRAGON_MONITORED_NAMESPACES=default
TETRAGON_READ_FROM_START=false
KAFKA_RAW_TELEMETRY_TOPIC=raw-telemetry
```

Then check that:

- Tetragon is installed and writing logs on the AKS node
- The DaemonSet can mount `/var/run/cilium/tetragon`
- The monitored namespace matches the pod namespace being tested
- Kafka credentials are available through `aura-config` and `aura-secrets`
- The `raw-telemetry` topic exists
- The bridge logs show `[tetragon-bridge] Published unauthorizedPodExec`

### Qdrant is not reachable

Run:

```bash
docker start aura-qdrant
curl http://localhost:6333
```

### Source-code filters do not appear

Restart the backend and refresh the RAG health check:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike/backend
npm run dev
```

Then check:

```bash
curl http://localhost:5001/api/rag/health
```

The response should include:

```text
source-code
backend
frontend
routes
worker
```

### Source-code answers return no results

Run source-code ingestion again:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike/backend
npm run rag:ingest:source
```

Then try broader filters:

```text
Document Type: source-code
Project Area: all
Tag: all
```

### Kafka warning appears

Run from repo root:

```bash
nvm use
node -v
```

Expected:

```text
v22.x.x
```

Then run Kafka again.

### Streaming workers are stuck

Stop all streaming workers:

```bash
pkill -9 -f "streaming/"
pkill -9 -f "node streaming"
```

Verify:

```bash
ps aux | grep "streaming" | grep -v grep
```

## 51. Final Clean Check

Run:

```bash
cd ~/Desktop/Aura-V2-Streaming-Spike
git status
git log --oneline -5
```

Expected:

```text
On branch main
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean
```

Latest commits should include:

```text
Merge pull request #67 from Willie-Byte/docs/finalize-controlled-simulator-and-approval-boundary-summary
Merge pull request #66 from Willie-Byte/docs/update-checklist-controlled-simulator-schedule-test
Merge pull request #65 from Willie-Byte/docs/document-controlled-simulator-schedule-test
Merge pull request #64 from Willie-Byte/docs/update-checklist-approval-runner-boundary
Merge pull request #63 from Willie-Byte/feature/verify-approval-to-runner-safety-boundary
```

## 52. Recommended Next Branch

Next engineering branch:

```text
feature/persistent-audit-result-storage
```

Goal:

Move from log-only demo observability toward persistent audit/result storage for approval requests, execution results, and Tetragon simulator validation events.

Required before starting:

- `git status` is clean on `main`
- PR #67 is merged
- the final simulator and approval boundary summary exists
- the checklist includes the final simulator and approval boundary summary
- the CronJob is currently suspended
- production remediation remains disabled
- no Terraform apply is run
- no destructive kubectl actions are run

Recommended first design step:

```text
Define MongoDB models or collections for audit events, approval requests, approval decisions, and execution results before changing live consumers.
```


