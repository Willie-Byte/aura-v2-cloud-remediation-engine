# Aura Streaming Kafka Architecture

## Purpose

Aura V2 uses a Kafka-based streaming architecture to decouple threat ingestion, AI remediation planning, validation, execution simulation, approval decisions, audit logging, and result tracking.

The streaming layer exists so Aura does not depend on one synchronous request-response flow. Instead, events move through Kafka topics and each service handles one part of the remediation lifecycle.

## Current Streaming Goal

The current goal is to prove the event-driven remediation pipeline before connecting real cloud execution, live AKS enforcement, or production eBPF telemetry.

The streaming system is designed to stay simulation-first until validation, approval, audit logging, and execution safety are mature.

## Kafka Topics

Aura V2 currently uses these major Kafka topics:

- threat-ingest
- remediation-commands
- remediation-dlq
- audit-log
- execution-results
- approval-requests
- approval-decisions
- raw-telemetry

## Main Streaming Components

### Producer

The producer creates test threat events and publishes them to Kafka.

Example use cases include:

- public SSH exposure
- public RDP exposure
- weak TLS configuration
- unencrypted database
- public storage access

### Telemetry Producer

The telemetry producer simulates security telemetry events before live telemetry is connected.

It can represent events such as:

- SSH activity
- PQC-related crypto risk
- suspicious workload behavior

### Telemetry Normalizer

The telemetry normalizer converts raw telemetry into Aura threat events.

Its job is to take lower-level telemetry and reshape it into the standard alert format that Aura understands.

### Orchestrator

The orchestrator consumes threat events from Kafka.

It calls the AI remediation service to generate a remediation plan, then uses the policy layer to determine the allowed remediation action.

The AI does not freely choose dangerous actions. Policy and validation control the final execution behavior.

### Worker

The worker consumes remediation commands.

It validates the command, checks the issue type, checks the action, checks the resource type, checks the execution mode, and then either simulates execution or rejects the command.

Unsafe commands are not executed.

### Dead-Letter Queue

Invalid commands are sent to the remediation-dlq topic.

This allows rejected events to be preserved for debugging, review, and audit visibility.

### Audit Consumer

The audit consumer listens for audit events.

Audit events describe important lifecycle actions such as threat received, remediation generated, command received, command rejected, command executed, and duplicate skipped.

### Result Consumer

The result consumer listens for execution outcomes.

Execution results can include:

- executed
- rejected
- skipped_duplicate
- awaiting_approval

### Approval Consumers

Approval consumers handle human approval workflows.

High-risk remediation actions can be routed to an approval topic before being executed or simulated.

## Safety Rules

Aura V2 currently follows these safety rules:

1. Prefer simulation mode.
2. Do not allow uncontrolled apply mode.
3. Reject malformed commands.
4. Reject unsupported issue types.
5. Reject action and resource mismatches.
6. Send invalid commands to the DLQ.
7. Publish audit events for important lifecycle actions.
8. Publish execution results for both success and failure.
9. Require human approval for risky actions.
10. Keep live AKS, Tetragon, and eBPF enforcement separate until the pipeline is reliable.

## Current End-to-End Flow

The current streaming flow works like this:

1. A producer publishes a threat event to threat-ingest.
2. The orchestrator consumes the threat event.
3. The orchestrator asks AI for a remediation plan.
4. The policy layer selects or validates the allowed action.
5. The orchestrator publishes a command to remediation-commands.
6. The worker consumes the command.
7. The worker validates the command.
8. If valid, the worker simulates execution.
9. If invalid, the worker sends the command to remediation-dlq.
10. The worker publishes audit events.
11. The worker publishes execution results.
12. The frontend Streaming Monitor displays the lifecycle.

## Why Kafka Matters

Kafka allows Aura V2 to separate responsibilities across multiple services.

This makes the system easier to scale, debug, observe, and extend.

Instead of one backend trying to do everything at once, Aura can have separate services for:

- telemetry ingestion
- normalization
- orchestration
- remediation generation
- validation
- approval
- execution
- audit logging
- result tracking

## Current Boundary

The streaming system is still a prototype.

It should not perform real production remediation yet.

It should not directly modify live AKS resources.

It should not directly connect experimental Rust eBPF enforcement to production.

It should remain simulation-first until dry-run validation, isolated execution, approval gates, and durable audit storage are complete.

## Recommended Questions

Use the RAG system to ask:

- How does the Kafka streaming pipeline work?
- What does the orchestrator do?
- What does the worker validate?
- Why does Aura use a dead-letter queue?
- What topics does Aura V2 use?
- Why is simulation mode important?
- What should stay separate from live AKS and eBPF systems?
