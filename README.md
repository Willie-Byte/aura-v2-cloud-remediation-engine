# Aura V2 Streaming Spike

## Overview

Aura V2 is a streaming architecture prototype built to evolve Aura beyond the webhook-based design used in Aura V1. Instead of relying on a synchronous request-response backend flow, this version proves that threats, AI-generated remediation commands, validation, execution results, dead-letter handling, approval decisions, and audit events can move across a decoupled Kafka backbone.

This prototype focuses on the architectural core of an event-driven remediation system. The goal is to validate a safer, more scalable, and more observable pipeline before connecting real cloud execution or real telemetry sources.

Aura V2 follows a pipeline-first strategy: build the first, prove each stage works independently, then gradually add intelligence, validation, execution safety, and eventually real telemetry.

## What This Prototype Proves

Aura V2 currently proves the following:

1. A threat event can be published into Kafka.
2. An orchestrator can consume that threat event.
3. The orchestrator can use AI to generate a remediation plan.
4. The system uses a shared remediation policy rulebook before execution.
5. A worker can consume remediation commands and validate them.
6. Invalid remediation commands are rejected and sent to a dead-letter queue.
7. Rejected commands also produce execution result records.
8. Valid remediation commands can be executed in safe simulation mode.
9. Dangerous execution requests can be blocked or isolated behind approval.
10. Duplicate remediation commands can be detected and skipped.
11. Human approval can gate higher-risk remediation flows.
12. Audit events are streamed into a dedicated audit topic.
13. Execution outcomes are streamed into a dedicated execution results topic.
14. A frontend Streaming Monitor can display stream health, Kafka topics, audit events, execution results, rejected commands, and execution mode.
15. A local Vector RAG system can answer project-specific questions from local architecture documents.

## Current Build Status

Aura V2 is currently in Step 3 of the pipeline-first strategy.

- Step 1: Dumb Pipe Prototype Complete
- Step 3: Gate & Muscle Early Lab Work / Not Production-Ready

Completed Step 3 features include:

- shared remediation policy layer
- issue type to action validation
- resource type validation
- simulation-first execution mode
- apply-mode rejection test
- DLQ handling
- rejected execution results
- audit event tracking
- approval queue flow
- frontend streaming monitor visibility
- local Vector RAG branch with Qdrant and OpenAI embeddings

Not completed yet:

- production Terraform payload generation
- AST or Terraform plan validation
- Terraform dry-run execution
- isolated execution runner
- real Azure OIDC-based execution
- production eBPF enforcement
- production remediation apply mode
- durable idempotency storage
- persistent audit/result storage

## Kafka Topics Used

The prototype currently uses these Kafka topics:

- `threat-ingest` Receives remediation commands published by the orchestrator.
- `remediation-dlq` Receives audit events for major system actions.
- `execution-results` Receives remediation actions that require human approval.
- `approval-decisions` Receives raw telemetry events before normalization.

## Current End-to-End Flow

The current end-to-end flow is:

1. `producer.js` or a telemetry producer publishes a threat event to `threat-ingest`.
2. `orchestrator.js` consumes the threat event.
3. The orchestrator calls the AI remediation service.
4. The AI writes a safe remediation plan, but it does not freely choose the final execution path.
5. The system chooses or validates the approved action from `remediationPolicy.js`.
6. The orchestrator publishes the remediation command to `remediation-commands`.
7. `worker.js` consumes the remediation command.
8. The worker validates the command using `validator.js`.
9. If valid and safe, the worker simulates execution and publishes an execution result.
10. If invalid, the worker sends the command to `remediation-dlq`.
11. If human approval is required, the command is routed through the approval flow.
12. Rejected commands also publish an execution result with `status: rejected`.
13. The worker publishes audit events for lifecycle actions.
14. `auditConsumer.js`, `dlqConsumer.js`, and `resultConsumer.js` can be used to observe the system output.
15. The frontend Streaming Monitor can display stream health, results, audit events, and safety status.

## Files in `backend/streaming`

- `producer.js` Publishes simulated telemetry events such as SSH, PQC, or security events.
- `badCommandProducer.js` Sends an intentionally dangerous execution command to prove unsafe execution paths are blocked or controlled.
- `approvalDecisionProducer.js` Consumes threat events, calls the AI remediation service, and publishes remediation commands.
- `aiRemediationService.js` Shared policy rulebook for supported issue types, expected actions, allowed resource types, and descriptions.
- `validator.js` Consumes remediation commands, validates them, handles duplicates, simulates execution, publishes results, and sends invalid commands to the DLQ.
- `approvalConsumer.js` Consumes approve or reject decisions and publishes the corresponding execution result.
- `dlqConsumer.js` Publishes audit events to the audit topic.
- `auditConsumer.js` Listens to the execution results topic.
- `telemetryNormalizer.js` Shared Kafka client configuration used across the streaming services.

## Remediation Policy Layer

The shared remediation policy acts as the system rulebook.

Current supported mappings include:

| Issue Type | Expected Action | Allowed Resource Type |
|---|---|---|
| `publicStorageAccess` | `disablePublicAccess` | `storageAccount` |
| `publicSSHAccess` | `restrictSSHAccess` | `networkSecurityGroup` |
| `publicRDPAccess` | `restrictRDPAccess` | `networkSecurityGroup` |
| `unencryptedDatabase` | `enableDatabaseEncryption` | `sqlDatabase` |
| `weakTlsVersion` | `enforceModernTLS` | `appService` |
| `unauthorizedPodExec` | `investigateUnauthorizedPodExec` | `aksPod` |

This prevents the AI from freely choosing dangerous or incorrect remediation actions.

## Validation Layer

The validation layer currently checks:

- command payload must be a valid object
- required command fields
- supported issue type
- allowed action type
- issue type must match the expected action
- resource type must match the policy
- status must be valid
- execution mode must be allowed
- generated remediation plan must exist when required
- approval-required actions must go through the approval queue

The worker rejects unsafe or malformed commands instead of executing them.

## Execution Modes

Aura V2 includes an explicit execution mode field.

Current safe mode:

```text
simulate
```

Future possible modes:

```text
plan
apply
active-apply
```

Current behavior is intentionally conservative. Aura V2 should not perform real cloud changes until Terraform dry-run validation, isolated execution, strong approval controls, and production audit storage exist.

## Dead-Letter Queue

If a remediation command fails validation, it is not executed.

Instead, the worker publishes the rejected payload to:

```text
remediation-dlq
```

The worker also publishes:

- an audit event with `REMEDIATION_REJECTED_TO_DLQ`
- an execution result with `status: rejected`

This ensures invalid commands are preserved for review instead of disappearing from the system.

## Idempotency

The worker currently includes in-memory idempotency protection using a `Set` of processed remediation IDs.

This allows the worker to skip duplicate remediation commands instead of executing the same action twice.

In a production-grade version, this should move to a durable store such as Redis, PostgreSQL, or another distributed coordination mechanism.

## Audit Logging

Aura V2 publishes audit events for important system actions such as:

```text
THREAT_RECEIVED
REMEDIATION_GENERATED
REMEDIATION_COMMAND_RECEIVED
REMEDIATION_EXECUTED
REMEDIATION_DUPLICATE_SKIPPED
REMEDIATION_REJECTED_TO_DLQ
REMEDIATION_GENERATION_FAILED
REMEDIATION_AWAITING_APPROVAL
REMEDIATION_APPROVED
REMEDIATION_REJECTED
```

This makes the pipeline observable and creates a foundation for future dashboards or replayable event history.

## Execution Results

The worker publishes execution outcomes into:

```text
execution-results
```

Execution results can include statuses such as:

```text
executed
rejected
skipped_duplicate
awaiting_approval
```

This separates execution outcomes from raw logs and makes the final state of remediation actions part of the event stream.

Example rejected result:

```json
{
 "status": "rejected",
 "executionMode": "apply",
 "details": {
   "reason": "validation_failed",
   "message": "Remediation command failed validation and was sent to the DLQ."
 }
}
```

Example simulated execution result:

```json
{
 "status": "executed",
 "executionMode": "simulate",
 "details": {
   "message": "Simulated remediation executed successfully."
 }
}
```

Example approval-required result:

```json
{
 "status": "awaiting_approval",
 "details": {
   "reason": "human_approval_required",
   "message": "Remediation command requires human approval and was sent to the approval queue."
 }
}
```

## Frontend Streaming Monitor

The frontend includes a Streaming Monitor page that displays:

- stream bridge status
- Kafka topic names
- audit event count
- execution result count
- latest execution status
- execution mode
- resource type
- rejected reason
- audit event timeline
- raw event payload details

This page makes the event-driven pipeline easier to understand without reading terminal logs.

## Local Vector RAG Feature

Aura V2 includes a local retrieval-augmented generation layer on the `feature/vector-rag` branch.

This feature lets Aura answer project-specific technical questions using local documents stored in a Qdrant vector database. The RAG layer is designed to run locally first and remain separate from live infrastructure until retrieval quality, source attribution, and safety boundaries are tested.

## What the RAG Feature Adds

The local RAG feature currently supports:

- local Qdrant vector database through Docker
- OpenAI embeddings for document chunks
- local document ingestion from `backend/rag-documents`
- terminal-based semantic search
- Express API endpoints for RAG health, retrieval, and generated answers
- frontend RAG Test page
- source display and retrieved chunk visibility
- metadata inference for ingested chunks
- source filtering by document type, project area, and tag

## RAG Safety Boundary

The vector RAG branch is local-only right now.

It should not modify live AKS resources.

It should not connect directly to live Tetragon events.

It should not modify the Rust eBPF interception branch.

It should remain separate from:

- AKS deployments
- Kafka streaming workers
- live Tetragon telemetry
- Rust eBPF enforcement code
- production remediation execution

The RAG layer may eventually connect to Kafka alerts, but only after the local RAG system is reliable and the safety rules are tested.

## Local Qdrant Setup

Start Docker Desktop or OrbStack first.

If the Qdrant container already exists, run:

```bash
docker start aura-qdrant
```

If the Qdrant container does not exist yet, run:

```bash
docker run -d \
 --name aura-qdrant \
 -p 6333:6333 \
 -p 6334:6334 \
 qdrant/qdrant
```

Check that Qdrant is running:

```bash
docker ps
curl http://localhost:6333
```

Expected response:

```json
{
 "title": "qdrant - vector search engine"
}
```

Qdrant dashboard:

```text
http://localhost:6333/dashboard
```

## Backend Environment Variables

Create or update `backend/.env`:

```env
OPENAI_API_KEY=your_openai_api_key_here
QDRANT_URL=http://localhost:6333
RAG_COLLECTION_NAME=aura_rag_documents
EMBEDDING_MODEL=text-embedding-3-small
RAG_CHAT_MODEL=gpt-4o-mini
START_STREAM_BRIDGE=false
```

Do not commit real `.env` files or API keys to GitHub.

## Backend RAG Scripts

Run these commands from the `backend` folder.

Test the Qdrant connection:

```bash
npm run rag:test:qdrant
```

Ingest documents from `backend/rag-documents`:

```bash
npm run rag:ingest
```

Search the vector database from the terminal:

```bash
npm run rag:search -- "What should stay separate from the vector RAG branch?"
```

## RAG Document Folder

Documents are stored in:

```text
backend/rag-documents
```

Supported file types include:

```text
.txt
.md
.js
.jsx
.ts
.tsx
.json
.yaml
.yml
.gd
.py
.sh
```

Current RAG documents include:

- `aura-test.md`
- `aura-vector-rag-architecture.md`
- `aura-streaming-kafka-architecture.md`
- `aura-remediation-policy-safety.md`
- `aura-telemetry-ebpf-tetragon.md`
- `aura-rag-document-index.md`

## RAG API Endpoints

The Express backend exposes the RAG API under:

```text
/api/rag
```

Health check:

```http
GET /api/rag/health
```

Retrieve matching chunks:

```http
POST /api/rag/query
```

Example request:

```json
{
 "query": "What should stay separate from the vector RAG branch?",
 "limit": 5,
 "documentType": "architecture",
 "projectArea": "aura-rag",
 "tag": "rag"
}
```

Generate an answer using retrieved chunks:

```http
POST /api/rag/answer
```

Example request:

```json
{
 "query": "What is the current local RAG flow in Aura V2?",
 "limit": 5,
 "documentType": "architecture",
 "projectArea": "aura-rag",
 "tag": "rag"
}
```

The answer endpoint returns:

- generated answer
- source files
- chunk indexes
- similarity scores
- retrieved text chunks
- document type
- project area
- tags

## Frontend RAG Test Page

The frontend includes a RAG Test page:

```text
/rag-test
```

Local URL:

```text
http://localhost:3000/rag-test
```

The page displays:

- RAG health status
- Qdrant collection name
- embedding model
- chat model
- generated answer
- source list
- retrieved chunks
- document type filters
- project area filters
- tag filters

## Frontend Environment Variables

For local frontend development, create `client/.env`:

```env
REACT_APP_API_URL=http://localhost:5001/api
```

A safe example file is available at:

```text
client/.env.example
```

Do not commit `client/.env`.

## Local RAG Flow

The current local RAG flow works like this:

1. Place documents inside `backend/rag-documents`.
2. Run `npm run rag:ingest`.
3. The chunker splits each document into text chunks.
4. The embedding service creates vectors with OpenAI embeddings.
5. The Qdrant service stores vectors and metadata in `aura_rag_documents`.
6. `npm run rag:search` can search Qdrant from the terminal.
7. `POST /api/rag/query` can search Qdrant through Express.
8. `POST /api/rag/answer` can retrieve chunks and generate a final answer.
9. The frontend `/rag-test` page can call the answer endpoint from the browser.
10. The frontend can filter sources by document type, project area, and tag.

## Example RAG Question

Question:

```text
What should stay separate from the vector RAG branch?
```

Expected answer:

```text
The vector RAG branch should stay separate from AKS deployments, Kafka streaming workers, live Tetragon telemetry, Rust eBPF enforcement code, and production remediation execution.
```

## Demoing the Local Vector RAG Branch

Use this checklist to demo the `feature/vector-rag` branch safely.

### 1. Confirm you are on the correct branch

```bash
git status
```

Expected:

```text
On branch feature/vector-rag
nothing to commit, working tree clean
```

### 2. Start Qdrant

If the Qdrant container already exists:

```bash
docker start aura-qdrant
```

Verify Qdrant:

```bash
docker ps
curl http://localhost:6333
```

Expected response should include:

```text
qdrant - vector search engine
```

### 3. Start the backend in RAG-only mode

From the backend folder:

```bash
cd backend
source .env
npm run dev
```

The backend should run on:

```text
http://localhost:5001
```

For a RAG-only demo, make sure the stream bridge is disabled:

```env
START_STREAM_BRIDGE=false
```

Do not run `npm run stream:full` unless intentionally testing Kafka.

### 4. Verify RAG health

In another terminal:

```bash
curl http://localhost:5001/api/rag/health
```

Expected response should include:

```text
Aura RAG
aura_rag_documents
text-embedding-3-small
gpt-4o-mini
```

### 5. Re-ingest documents if needed

From the backend folder:

```bash
npm run rag:ingest
```

This loads documents from:

```text
backend/rag-documents
```

### 6. Start the frontend

From the client folder:

```bash
cd client
npm start
```

Open:

```text
http://localhost:3000/rag-test
```

### 7. Test the RAG filters

Architecture test:

```text
Document Type: Architecture
Project Area: Aura RAG
Tag: RAG
Question: What documents are available in this RAG system?
```

Streaming test:

```text
Document Type: Streaming
Project Area: Aura Streaming
Tag: Kafka
Question: How does the Kafka streaming pipeline work?
```

Policy test:

```text
Document Type: Policy
Project Area: Aura Remediation
Tag: Validation
Question: What does the validator check?
```

Telemetry test:

```text
Document Type: Telemetry
Project Area: Aura Telemetry
Tag: Tetragon
Question: What does Tetragon do in Aura?
```

### 8. Safety boundaries

The local Vector RAG branch should not:

- modify live AKS resources
- connect directly to live Tetragon events
- execute production remediation actions
- run Rust eBPF enforcement code
- run uncontrolled Kafka streaming workers during a RAG-only demo

For RAG demos, keep Kafka off unless specifically testing the streaming system.

## RAG Troubleshooting

If Qdrant is not reachable, check Docker:

```bash
docker ps
curl http://localhost:6333
```

If OpenAI calls fail, check the backend environment without printing the full key:

```bash
echo ${OPENAI_API_KEY:0:7}
```

Expected prefix:

```text
sk-proj
```

If the frontend returns 404 for RAG requests, make sure `client/.env` points to the backend:

```env
REACT_APP_API_URL=http://localhost:5001/api
```

Then restart the React dev server.

If ingestion fails because of missing credentials, make sure `OPENAI_API_KEY` is set in the backend environment.

If Qdrant rejects point IDs, make sure the ingestion script uses UUID-style IDs instead of raw SHA-256 strings.

If Kafka errors appear during a RAG-only demo, stop streaming processes and make sure the stream bridge is disabled:

```bash
pkill -9 -f "streaming/"
pkill -9 -f "node streaming"
```

Then verify no streaming workers are running:

```bash
ps aux | grep "streaming" | grep -v grep
```

## Environment Variables

The streaming prototype uses environment variables for Kafka, OpenAI, and local service configuration.

Example backend variables:

```env
KAFKA_BROKER=your_bootstrap_server_here:9092
KAFKA_USERNAME=your_api_key
KAFKA_PASSWORD=your_api_secret

KAFKA_TOPIC=threat-ingest
KAFKA_REMEDIATION_TOPIC=remediation-commands
KAFKA_DLQ_TOPIC=remediation-dlq
KAFKA_AUDIT_TOPIC=audit-log
KAFKA_RESULTS_TOPIC=execution-results

OPENAI_API_KEY=your_openai_api_key
QDRANT_URL=http://localhost:6333
RAG_COLLECTION_NAME=aura_rag_documents
START_STREAM_BRIDGE=false
```

Do not commit real API keys or secrets to GitHub.

## How to Run the Streaming System

Run the streaming services from the `backend` folder.

Start the full streaming system:

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

Send a normal threat event in a second terminal:

```bash
node streaming/producer.js publicSSHAccess
```

Other supported examples:

```bash
node streaming/producer.js unencryptedDatabase
node streaming/producer.js weakTlsVersion
```

Send an invalid action test:

```bash
npm run stream:bad-command
```

Expected result:

- command is rejected
- command is sent to DLQ
- audit event is published
- execution result has `status: rejected`

Send a dangerous apply-mode test:

```bash
npm run stream:apply-test
```

Expected result:

- command is rejected or routed through safety controls
- unsafe execution is not performed directly
- audit event is published
- execution result records the safety outcome

## NPM Scripts

Useful scripts from the `backend` folder:

```bash
npm run stream:producer
npm run stream:bad-command
npm run stream:apply-test
npm run stream:approve
npm run stream:reject
npm run stream:orchestrator
npm run stream:worker
npm run stream:audit
npm run stream:results
npm run stream:dlq
npm run stream:approval
npm run stream:approval-decisions
npm run stream:demo
npm run stream:full
npm run rag:test:qdrant
npm run rag:ingest
npm run rag:search
```

## Example Happy Path

Start the full stream:

```bash
npm run stream:full
```

Send a valid threat:

```bash
node streaming/producer.js publicSSHAccess
```

Expected result:

1. A threat is published.
2. The orchestrator receives the threat.
3. AI generates safe remediation plan text.
4. The policy layer selects the expected action.
5. The worker validates the command.
6. The worker simulates execution or routes the action through approval.
7. An execution result is published.
8. Audit events are produced.

## Example Invalid Action Path

Run:

```bash
npm run stream:bad-command
```

Expected result:

1. A command is published with the wrong action.
2. The worker rejects the command.
3. The payload is sent to `remediation-dlq`.
4. An audit event is published.
5. An execution result is published with `status: rejected`.

## Example Apply-Mode Rejection Path

Run:

```bash
npm run stream:apply-test
```

Expected result:

1. A command is published with an unsafe execution mode.
2. The worker rejects it or routes it through safety controls.
3. The payload is sent to `remediation-dlq` if invalid.
4. An audit event is published.
5. An execution result is published with the safety outcome.

This proves Aura V2 refuses uncontrolled real execution while the system is still in prototype mode.

## Example Duplicate Path

If the same remediation command is published twice with the same remediation ID:

1. The first command executes or is processed.
2. The second command is skipped.
3. An audit event is published for the duplicate skip.
4. An execution result is published with `status: skipped_duplicate`.

## Why Aura V2 Exists

Aura V1 proved the product and workflow story:

- multi-cloud alert intake
- AI remediation generation
- dashboard and alert pages
- webhook-driven orchestration

Aura V2 exists to prove the next architectural step:

- event-driven flow
- decoupled services
- resilient failure handling
- replayable system activity
- clearer execution boundaries
- safer AI-assisted remediation
- observable audit and execution streams
- local RAG over project-specific architecture documents

## What Comes Next

Potential next steps for Aura V2 include:

- durable idempotency storage
- stronger schema validation
- structured remediation payloads instead of only plan text
- Terraform plan generation
- Terraform or AST-based validation
- dry-run execution with `terraform plan`
- isolated execution runner
- human approval before apply
- real Azure OIDC-based execution
- real eBPF or cloud telemetry ingestion
- persistent audit/result storage
- stronger RAG metadata and source filtering
- RAG connection to Kafka alerts after local validation
- more advanced frontend monitoring

## Summary

Aura V2 is not a full product replacement yet. It is an architectural proof of concept that demonstrates how Aura can evolve from a webhook-based application into an event-driven remediation system with stronger safety, observability, and execution boundaries.

The current system proves the most important foundation:

- events move through Kafka
- AI can generate remediation plans
- policy controls the final action
- the worker validates commands before execution
- invalid or dangerous commands are rejected
- rejected commands are preserved in the DLQ
- approval can gate risky remediations
- execution results are published for both success and failure
- local RAG can answer questions from project architecture documents
- the frontend can monitor the stream lifecycle and test the local RAG system