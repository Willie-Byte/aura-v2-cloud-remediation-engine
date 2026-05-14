# Aura RAG Document Index

## Purpose

This document is the index for Aura V2's local Vector RAG knowledge base.

It explains which documents are currently available, what each document covers, and which filters should be used when asking questions through the RAG Test Console.

The index helps Aura answer questions about the structure of the local RAG system itself.

## Current RAG Documents

### Aura Vector RAG Architecture

File:

- aura-vector-rag-architecture.md

Use this document for questions about:

- local RAG purpose
- Qdrant usage
- OpenAI embeddings
- document ingestion
- semantic search
- RAG API endpoints
- frontend RAG test page
- local-only safety boundaries
- future Kafka integration planning

Recommended filters:

- Document Type: Architecture
- Project Area: Aura RAG
- Tag: RAG
- Tag: Qdrant
- Tag: Architecture

Example questions:

- What is the purpose of the vector RAG branch?
- How does local RAG ingestion work?
- What endpoints are available for RAG?
- Should this branch connect to live AKS resources?

## Aura Streaming Kafka Architecture

File:

- aura-streaming-kafka-architecture.md

Use this document for questions about:

- Kafka topics
- event-driven architecture
- threat ingestion
- remediation commands
- audit events
- execution results
- dead-letter queue behavior
- approval decisions
- orchestrator responsibilities
- worker responsibilities
- simulation-first streaming flow

Recommended filters:

- Document Type: Streaming
- Project Area: Aura Streaming
- Tag: Kafka
- Tag: Event Driven

Example questions:

- How does the Kafka streaming pipeline work?
- What does the orchestrator do?
- What does the worker validate?
- Why does Aura use a dead-letter queue?
- What topics does Aura V2 use?

## Aura Remediation Policy and Safety Architecture

File:

- aura-remediation-policy-safety.md

Use this document for questions about:

- remediation policy
- validator responsibilities
- safe issue type mappings
- action and resource validation
- simulation mode
- approval requirements
- rejected commands
- dead-letter queue behavior
- audit events
- execution result statuses

Recommended filters:

- Document Type: Policy
- Project Area: Aura Remediation
- Tag: Remediation
- Tag: Validation
- Tag: Policy

Example questions:

- Why does Aura need a remediation policy layer?
- What does the validator check?
- What happens when a remediation command fails validation?
- Why is simulation mode important?
- What should require human approval?

## Aura Telemetry eBPF Tetragon Architecture

File:

- aura-telemetry-ebpf-tetragon.md

Use this document for questions about:

- Tetragon
- eBPF visibility
- AKS telemetry
- runtime observability
- raw telemetry
- telemetry normalization
- unauthorized pod exec detection
- Linux VM development boundaries
- Rust eBPF isolation
- telemetry versus enforcement

Recommended filters:

- Document Type: Telemetry
- Project Area: Aura Telemetry
- Tag: Tetragon
- Tag: eBPF
- Tag: AKS
- Tag: Telemetry

Example questions:

- What does Tetragon do in Aura?
- Why should eBPF testing happen inside Linux?
- How does raw telemetry become an Aura threat event?
- What is the telemetry normalizer responsible for?
- Why should telemetry stay separate from enforcement?

## General Test Document

File:

- aura-test.md

Use this document for quick local testing.

It confirms that:

- Aura V2 is an autonomous cloud remediation engine.
- The vector RAG branch should run locally with Qdrant first.
- The vector RAG branch should stay separate from Rust eBPF interception work.

Recommended filters:

- Document Type: General
- Project Area: Aura
- Tag: Aura

## Current Safe Boundaries

The local Vector RAG system should remain read-only and local-first.

It should not:

- modify live AKS resources
- connect directly to live Tetragon events
- execute remediation actions
- bypass the Kafka safety pipeline
- modify the Rust eBPF branch
- push experimental eBPF enforcement into production
- perform production apply-mode remediation

The RAG layer can help explain architecture, policy, telemetry, and streaming design, but it should not perform live infrastructure changes.

## Recommended Filter Strategy

Use Architecture / Aura RAG filters for local RAG questions.

Use Streaming / Aura Streaming / Kafka filters for Kafka pipeline questions.

Use Policy / Aura Remediation / Validation filters for validator and safety questions.

Use Telemetry / Aura Telemetry / Tetragon or eBPF filters for AKS, Tetragon, and runtime observability questions.

Use All Documents when asking broad system questions that need multiple architecture areas.

## Recommended Questions

Use the RAG system to ask:

- What documents are available in this RAG system?
- Which filter should I use for Kafka questions?
- Which filter should I use for eBPF questions?
- Which filter should I use for validator questions?
- What should stay local-only in the vector RAG branch?
- What are the main safety boundaries across Aura V2?
