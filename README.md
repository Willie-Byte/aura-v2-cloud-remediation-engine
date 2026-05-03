# Aura V2 Streaming Spike

## Overview

Aura V2 is a streaming architecture prototype built to evolve Aura beyond the webhook-based design used in Aura V1. Instead of relying on a synchronous request-response backend flow, this version proves that threats, AI-generated remediation commands, validation, execution results, dead-letter handling, and audit events can move across a decoupled Kafka backbone.

This prototype focuses on the architectural core of an event-driven remediation system. The goal is to validate a safer, more scalable, and more observable pipeline before connecting real cloud execution or real telemetry sources.

Aura V2 follows a pipeline-first strategy: build the “dumb machine” first, prove each stage works independently, then gradually add intelligence, validation, execution safety, and eventually real telemetry.

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
9. Dangerous `apply` execution requests are blocked.
10. Duplicate remediation commands can be detected and skipped.
11. Audit events are streamed into a dedicated audit topic.
12. Execution outcomes are streamed into a dedicated execution results topic.
13. A frontend Streaming Monitor can display stream health, Kafka topics, audit events, execution results, rejected commands, and execution mode.

## Current Build Status

Aura V2 is currently in Step 3 of the pipeline-first strategy.

- Step 1: Dumb Pipe — Complete
- Step 2: AI Brain — Prototype Complete
- Step 3: Gate & Muscle — In Progress
- Step 4: Real Sensors / eBPF — Not Started

Completed Step 3 features include:

- shared remediation policy layer
- issue type to action validation
- resource type validation
- simulation-only execution mode
- apply-mode rejection test
- DLQ handling
- rejected execution results
- audit event tracking
- frontend streaming monitor visibility

Not completed yet:

- real Terraform payload generation
- AST or Terraform plan validation
- Terraform dry-run execution
- isolated execution runner
- real Azure OIDC-based execution
- real eBPF telemetry ingestion

## Kafka Topics Used

The prototype currently uses five Kafka topics:

- `threat-ingest`  
  Receives incoming threat events.

- `remediation-commands`  
  Receives remediation commands published by the orchestrator.

- `remediation-dlq`  
  Receives invalid remediation commands that fail validation.

- `audit-log`  
  Receives audit events for major system actions.

- `execution-results`  
  Receives execution outcome events from the worker.

## Current End-to-End Flow

The current end-to-end flow is:

1. `producer.js` publishes a fake threat event to `threat-ingest`.
2. `orchestrator.js` consumes the threat event.
3. The orchestrator calls the AI remediation service.
4. The AI writes a safe remediation plan, but it does not choose the action.
5. The system chooses the approved action from `remediationPolicy.js`.
6. The orchestrator publishes the remediation command to `remediation-commands`.
7. `worker.js` consumes the remediation command.
8. The worker validates the command using `validator.js`.
9. If valid, the worker simulates execution and publishes an execution result.
10. If invalid, the worker sends the command to `remediation-dlq`.
11. Rejected commands also publish an execution result with `status: rejected`.
12. The worker publishes audit events for lifecycle actions.
13. `auditConsumer.js`, `dlqConsumer.js`, and `resultConsumer.js` can be used to observe the system output.
14. The frontend Streaming Monitor can display stream health, results, audit events, and safety status.

## Files in `backend/streaming`

- `producer.js`  
  Simulates a threat source and publishes fake threat events.

- `orchestrator.js`  
  Acts as the orchestrator. Consumes threat events, calls the AI remediation service, and publishes remediation commands.

- `aiRemediationService.js`  
  Uses OpenAI to generate a safe remediation plan. The AI only writes the plan text. It does not choose the final action or execution mode.

- `remediationPolicy.js`  
  Shared policy rulebook for supported issue types, expected actions, allowed resource types, and descriptions.

- `validator.js`  
  Validates remediation command structure, supported issue types, expected actions, resource types, status, and execution mode.

- `worker.js`  
  Consumes remediation commands, validates them, handles duplicates, simulates execution, publishes results, and sends invalid commands to DLQ.

- `badCommandProducer.js`  
  Sends an intentionally invalid remediation command to prove the validator and DLQ path work.

- `applyCommandProducer.js`  
  Sends an intentionally dangerous `executionMode: "apply"` command to prove real execution is blocked.

- `dlqConsumer.js`  
  Listens to the dead-letter queue topic.

- `auditProducer.js`  
  Publishes audit events to the audit topic.

- `auditConsumer.js`  
  Listens to the audit topic.

- `resultConsumer.js`  
  Listens to the execution results topic.

- `kafkaClient.js`  
  Shared Kafka client configuration used across the streaming services.

## Remediation Policy Layer

The shared remediation policy acts as the system rulebook.

Current supported mappings:

| Issue Type | Expected Action | Allowed Resource Type |
|---|---|---|
| `publicStorageAccess` | `disablePublicAccess` | `storageAccount` |
| `publicSSHAccess` | `restrictSSHAccess` | `networkSecurityGroup` |
| `publicRDPAccess` | `restrictRDPAccess` | `networkSecurityGroup` |
| `unencryptedDatabase` | `enableDatabaseEncryption` | `sqlDatabase` |
| `weakTlsVersion` | `enforceModernTLS` | `appService` |

This prevents the AI from freely choosing dangerous or incorrect remediation actions.

## Validation Layer

The validation layer currently checks:

- command payload must be a valid object
- required command fields
- supported issue type
- allowed action type
- issue type must match the expected action
- resource type must match the policy
- status must be `pending`
- execution mode must be `simulate`
- generated remediation plan must exist

The worker currently rejects any command that requests:

```text
executionMode: "apply"

Only this execution mode is allowed right now:

executionMode: "simulate"

This is intentional. Aura V2 should not perform real cloud changes until Terraform dry-run validation, isolated execution, and real approval controls exist.

Dead-Letter Queue

If a remediation command fails validation, it is not executed.

Instead, the worker publishes the rejected payload to:

remediation-dlq

The worker also publishes:

an audit event with REMEDIATION_REJECTED_TO_DLQ
an execution result with status: rejected

This ensures invalid commands are preserved for review instead of disappearing from the system.

Execution Modes

Aura V2 now includes an explicit execution mode field.

Current supported mode:

simulate

Future possible modes:

plan
apply

Current behavior:

Execution Mode	Current Result
simulate	Allowed
plan	Rejected
apply	Rejected

The applyCommandProducer.js file exists to prove that apply mode is blocked.

Idempotency

The worker currently includes in-memory idempotency protection using a Set of processed remediation IDs.

This allows the worker to skip duplicate remediation commands instead of executing the same action twice.

In a production-grade version, this should move to a durable store such as Redis, PostgreSQL, or another distributed coordination mechanism.

Audit Logging

Aura V2 publishes audit events for important system actions such as:

THREAT_RECEIVED
REMEDIATION_GENERATED
REMEDIATION_COMMAND_RECEIVED
REMEDIATION_EXECUTED
REMEDIATION_DUPLICATE_SKIPPED
REMEDIATION_REJECTED_TO_DLQ
REMEDIATION_GENERATION_FAILED

This makes the pipeline observable and creates a foundation for future dashboards or replayable event history.

Execution Results

The worker publishes execution outcomes into:

execution-results

Execution results can include statuses such as:

executed
rejected
skipped_duplicate

This separates execution outcomes from raw logs and makes the final state of remediation actions part of the event stream.

Example rejected result:

{
  "status": "rejected",
  "executionMode": "apply",
  "details": {
    "reason": "validation_failed",
    "message": "Remediation command failed validation and was sent to the DLQ."
  }
}

Example executed result:

{
  "status": "executed",
  "executionMode": "simulate",
  "details": {
    "message": "Simulated remediation executed successfully."
  }
}
Frontend Streaming Monitor

The frontend includes a Streaming Monitor page that displays:

stream bridge status
Kafka topic names
audit event count
execution result count
latest execution status
execution mode
resource type
rejected reason
audit event timeline
raw event payload details

This page makes the event-driven pipeline easier to understand without reading terminal logs.

Environment Variables

The streaming prototype uses a .env file inside backend/streaming.

Example:

KAFKA_BROKER=your_bootstrap_server_here:9092
KAFKA_USERNAME=your_api_key
KAFKA_PASSWORD=your_api_secret

KAFKA_TOPIC=threat-ingest
KAFKA_REMEDIATION_TOPIC=remediation-commands
KAFKA_DLQ_TOPIC=remediation-dlq
KAFKA_AUDIT_TOPIC=audit-log
KAFKA_RESULTS_TOPIC=execution-results

OPENAI_API_KEY=your_openai_api_key

Do not commit real API keys or secrets to GitHub.

How to Run

Run the streaming services from the backend folder.

Start the full streaming system
npm run stream:full

This starts:

audit consumer
result consumer
DLQ consumer
worker
orchestrator
Send a normal threat event

In a second terminal:

node streaming/producer.js publicSSHAccess

Other supported examples:

node streaming/producer.js unencryptedDatabase
node streaming/producer.js weakTlsVersion
Send an invalid action test
npm run stream:bad-command

Expected result:

command is rejected
command is sent to DLQ
audit event is published
execution result has status: rejected
Send a dangerous apply-mode test
npm run stream:apply-test

Expected result:

command is rejected
command is sent to DLQ
audit event is published
execution result has status: rejected
rejection reason says only simulate mode is supported
NPM Scripts

Useful scripts from the backend folder:

npm run stream:producer
npm run stream:bad-command
npm run stream:apply-test
npm run stream:orchestrator
npm run stream:worker
npm run stream:audit
npm run stream:results
npm run stream:dlq
npm run stream:demo
npm run stream:full
Example Happy Path

Start the full stream:

npm run stream:full

Send a valid threat:

node streaming/producer.js publicSSHAccess

Expected result:

A threat is published.
The orchestrator receives the threat.
AI generates safe remediation plan text.
The policy layer selects restrictSSHAccess.
The worker validates the command.
The worker simulates execution.
An execution result is published with status: executed.
Audit events are produced.
Example Invalid Action Path

Run:

npm run stream:bad-command

Expected result:

A command is published with the wrong action.
The worker rejects the command.
The payload is sent to remediation-dlq.
An audit event is published.
An execution result is published with status: rejected.
Example Apply-Mode Rejection Path

Run:

npm run stream:apply-test

Expected result:

A command is published with executionMode: "apply".
The worker rejects it.
The payload is sent to remediation-dlq.
An audit event is published.
An execution result is published with status: rejected.

This proves Aura V2 refuses real execution while the system is still in simulation mode.

Example Duplicate Path

If the same remediation command is published twice with the same remediation ID:

The first command executes.
The second command is skipped.
An audit event is published for the duplicate skip.
An execution result is published with status: skipped_duplicate.
Why Aura V2 Exists

Aura V1 proved the product and workflow story:

multi-cloud alert intake
AI remediation generation
dashboard and alert pages
webhook-driven orchestration

Aura V2 exists to prove the next architectural step:

event-driven flow
decoupled services
resilient failure handling
replayable system activity
clearer execution boundaries
safer AI-assisted remediation
observable audit and execution streams
What Comes Next

Potential next steps for Aura V2 include:

Durable idempotency storage.
Stronger schema validation.
Structured remediation payloads instead of only plan text.
Terraform plan generation.
Terraform or AST-based validation.
Dry-run execution with terraform plan.
Isolated execution runner.
Human approval before apply.
Real Azure OIDC-based execution.
Real eBPF or cloud telemetry ingestion.
Persistent audit/result storage.
More advanced frontend monitoring.
Summary

Aura V2 is not a full product replacement yet. It is an architectural proof of concept that demonstrates how Aura can evolve from a webhook-based application into an event-driven remediation system with stronger safety, observability, and execution boundaries.

The current system proves the most important foundation:

events move through Kafka
AI can generate remediation plans
policy controls the final action
the worker validates commands before execution
invalid or dangerous commands are rejected
rejected commands are preserved in the DLQ
execution results are published for both success and failure
the frontend can monitor the stream lifecycle