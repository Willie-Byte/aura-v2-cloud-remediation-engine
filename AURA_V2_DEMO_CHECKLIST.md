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
- RAG health, query, and answer endpoints
- Frontend RAG test console
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

The latest commits should include:

```text
Add Qdrant client dependency for local RAG
Merge pull request #3 from Willie-Byte/feature/vector-rag-clean
Update backend package lock for Node 22
Merge pull request #2 from Willie-Byte/fix/kafka-stability
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

This loads documents from:

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

## 7. Test RAG Search From Terminal

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

## 8. Test the RAG Answer API

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

## 9. Start the Frontend

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

## 10. Frontend RAG Demo Questions

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

## 11. Test Kafka Stability

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

## 12. Optional Streaming Demo

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

## 13. RAG-Only Demo Safety Settings

For a RAG-only demo, keep this in `backend/.env`:

```env
START_STREAM_BRIDGE=false
QDRANT_URL=http://localhost:6333
RAG_COLLECTION_NAME=aura_rag_documents
EMBEDDING_MODEL=text-embedding-3-small
RAG_CHAT_MODEL=gpt-4o-mini
```

Do not commit real `.env` files.

## 14. Safety Boundaries To Explain During Demo

Aura V2 is intentionally conservative.

For the current demo:

- RAG is local-first
- Qdrant runs locally
- Kafka is tested separately
- Production remediation execution is not enabled
- The system should not modify live AKS resources
- The system should not connect RAG directly to live Tetragon events yet
- Rust eBPF enforcement work stays separate from RAG
- Terraform apply mode is not production-ready

## 15. Good Demo Explanation

Use this short explanation:

```text
Aura V2 is an event-driven cloud remediation prototype. It uses Kafka to separate threat intake, AI-assisted remediation planning, validation, execution results, approval decisions, DLQ handling, and audit events. The system is safety-first, so real execution is blocked behind policy validation, simulation mode, and future approval controls.

The current main branch also adds a local Vector RAG system. Aura can answer project-specific questions using local architecture documents stored in Qdrant with OpenAI embeddings. This lets the system explain its own architecture, safety boundaries, remediation policy, Kafka flow, and telemetry plan without connecting RAG to live infrastructure yet.
```

## 16. Troubleshooting

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

### Qdrant is not reachable

Run:

```bash
docker start aura-qdrant
curl http://localhost:6333
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

## 17. Final Clean Check

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

## 18. Recommended Next Branch

Next engineering branch:

```text
feature/rag-source-code-ingestion
```

Goal:

Allow Aura to ingest selected source code files so it can answer questions like:

- Where is Kafka initialized?
- Which file defines RAG routes?
- How does the worker validate remediation commands?
- What frontend page calls the RAG answer endpoint?
- Which files define the remediation safety policy?
