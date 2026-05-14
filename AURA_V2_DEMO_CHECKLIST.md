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
Merge pull request #6 from Willie-Byte/feature/rag-ui-presets
Update Aura V2 demo checklist with source code RAG
Merge pull request #5 from Willie-Byte/feature/rag-source-code-filters
Merge pull request #4 from Willie-Byte/feature/rag-source-code-ingestion
Add Aura V2 demo checklist
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

Run from the backend folder:

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
Upserted 241 chunks into aura_rag_documents
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

## 14. Frontend RAG Demo Questions

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

## 15. Frontend Source-Code RAG Demo Questions

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

## 16. Test Kafka Stability

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

## 17. Optional Streaming Demo

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

## 18. RAG-Only Demo Safety Settings

For a RAG-only demo, keep this in `backend/.env`:

```env
START_STREAM_BRIDGE=false
QDRANT_URL=http://localhost:6333
RAG_COLLECTION_NAME=aura_rag_documents
EMBEDDING_MODEL=text-embedding-3-small
RAG_CHAT_MODEL=gpt-4o-mini
```

Do not commit real `.env` files.

## 19. Safety Boundaries To Explain During Demo

Aura V2 is intentionally conservative.

For the current demo:

- RAG is local-first
- Qdrant runs locally
- Source-code ingestion only embeds selected local files
- Source-code ingestion skips `.env`, lockfiles, `node_modules`, build output, and Git metadata
- Kafka is tested separately
- Production remediation execution is not enabled
- The system should not modify live AKS resources
- The system should not connect RAG directly to live Tetragon events yet
- Rust eBPF enforcement work stays separate from RAG
- Terraform apply mode is not production-ready

## 20. Good Demo Explanation

Use this short explanation:

```text
Aura V2 is an event-driven cloud remediation prototype. It uses Kafka to separate threat intake, AI-assisted remediation planning, validation, execution results, approval decisions, DLQ handling, and audit events. The system is safety-first, so real execution is blocked behind policy validation, simulation mode, and future approval controls.

The current main branch also adds a local Vector RAG system. Aura can answer project-specific questions using local architecture documents and selected source-code files stored in Qdrant with OpenAI embeddings. The RAG UI now includes polished preset cards for fast demos, so a presenter can quickly show architecture, source-code, Kafka, Qdrant, worker-validation, safety-boundary, and Tetragon searches without manually setting every filter.
```

## 21. Troubleshooting

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
"rag:search": "node scripts/searchRagDocuments.js"
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

## 22. Final Clean Check

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
Merge pull request #6 from Willie-Byte/feature/rag-ui-presets
Update Aura V2 demo checklist with source code RAG
Merge pull request #5 from Willie-Byte/feature/rag-source-code-filters
Merge pull request #4 from Willie-Byte/feature/rag-source-code-ingestion
Add Aura V2 demo checklist
```

## 23. Recommended Next Branch

Next engineering branch:

```text
feature/rag-source-badges
```

Goal:

Improve the RAG sources and retrieved chunks UI so Aura can make it clearer when an answer came from:

- architecture documents
- source-code chunks
- streaming documentation
- policy documentation
- telemetry documentation
- mixed architecture and source-code results

Possible improvements:

- Add a visible `ingestionType` field to returned results
- Show `source-code` chunks with a code-focused badge
- Show `architecture`, `streaming`, `policy`, and `telemetry` badges
- Add clearer visual separation between documentation answers and source-code answers
- Keep the current preset cards as the fast demo entry point