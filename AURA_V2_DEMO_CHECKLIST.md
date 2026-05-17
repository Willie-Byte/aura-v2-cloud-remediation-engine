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
Merge pull request #17 from Willie-Byte/docs/update-checklist-tetragon-replay
Merge pull request #16 from Willie-Byte/feature/tetragon-bridge-log-replay
Merge pull request #15 from Willie-Byte/docs/update-checklist-tetragon-local-test
Merge pull request #14 from Willie-Byte/feature/tetragon-bridge-local-test
Merge pull request #13 from Willie-Byte/docs/update-checklist-tetragon-bridge
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


## 23. RAG-Only Demo Safety Settings

For a RAG-only demo, keep this in `backend/.env`:

```env
START_STREAM_BRIDGE=false
QDRANT_URL=http://localhost:6333
RAG_COLLECTION_NAME=aura_rag_documents
EMBEDDING_MODEL=text-embedding-3-small
RAG_CHAT_MODEL=gpt-4o-mini
```

Do not commit real `.env` files.

## 24. Safety Boundaries To Explain During Demo

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
- The system should not connect RAG directly to live Tetragon events yet
- Rust eBPF enforcement work stays separate from RAG
- Terraform apply mode is not production-ready

## 25. Good Demo Explanation

Use this short explanation:

```text
Aura V2 is an event-driven cloud remediation prototype. It uses Kafka to separate threat intake, AI-assisted remediation planning, validation, execution results, approval decisions, DLQ handling, and audit events. The system is safety-first, so real execution is blocked behind policy validation, simulation mode, and future approval controls.

The current main branch also adds a local Vector RAG system. Aura can answer project-specific questions using local architecture documents and selected source-code files stored in Qdrant with OpenAI embeddings. The RAG UI now includes polished preset cards, source type badges, and a source summary banner for fast demos, so a presenter can quickly show architecture, source-code, Kafka, Qdrant, worker-validation, safety-boundary, and Tetragon searches while clearly showing whether each answer came from source code, architecture documents, streaming documents, policy documents, telemetry documents, or mixed retrieved context. Aura also includes a clean Tetragon bridge, a local fixture-based classification test, and a `.jsonl` log replay test so suspicious eBPF process events can be validated safely before live AKS testing.
```

## 26. Troubleshooting

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
"test:tetragon:replay": "node scripts/replayTetragonBridgeLog.js"
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

## 27. Final Clean Check

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
Merge pull request #17 from Willie-Byte/docs/update-checklist-tetragon-replay
Merge pull request #16 from Willie-Byte/feature/tetragon-bridge-log-replay
Merge pull request #15 from Willie-Byte/docs/update-checklist-tetragon-local-test
Merge pull request #14 from Willie-Byte/feature/tetragon-bridge-local-test
Merge pull request #13 from Willie-Byte/docs/update-checklist-tetragon-bridge
```

## 28. Recommended Next Branch

Next engineering branch:

```text
feature/tetragon-bridge-mock-publisher
```

Goal:

Add a safe mock publisher test for the Tetragon bridge so the bridge can verify the telemetry that would be sent to Kafka without connecting to a real Kafka cluster.

Possible improvements:

- Export or isolate a function that turns replayed Tetragon lines into publishable telemetry objects
- Add a mock publisher that records would-publish messages in memory
- Assert the correct Kafka topic would be used, such as `raw-telemetry`
- Assert the correct message key would be used, such as `default/aura-ebpf-test`
- Assert ignored events are not published
- Keep live Kafka and AKS deployment separate from local publisher testing
