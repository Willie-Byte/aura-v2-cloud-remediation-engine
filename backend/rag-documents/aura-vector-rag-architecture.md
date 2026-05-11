# Aura Vector RAG Architecture

## Purpose

The feature/vector-rag branch adds a local retrieval-augmented generation layer to Aura V2.

This branch is designed to run locally first using:

- Local Node/Express backend
- Local Qdrant vector database
- OpenAI embeddings
- Local test documents and architecture blueprints

The goal is to let Aura answer technical questions using project-specific context before integrating with production infrastructure.

## Safety Boundary

The vector RAG branch should not modify live AKS resources.

The vector RAG branch should not connect directly to live Tetragon events yet.

The vector RAG branch should not change the Rust eBPF interception branch.

The vector RAG branch should remain separate from:

- AKS deployments
- Kafka streaming workers
- live Tetragon telemetry
- Rust eBPF enforcement code
- production remediation execution

## Current Local RAG Flow

The current local RAG flow works like this:

1. Documents are placed inside backend/rag-documents.
2. npm run rag:ingest reads the documents.
3. The chunker splits each document into text chunks.
4. The embedding service creates vectors with OpenAI embeddings.
5. The Qdrant service stores vectors and metadata inside the aura_rag_documents collection.
6. npm run rag:search can search Qdrant from the terminal.
7. POST /api/rag/query can search Qdrant through Express.
8. POST /api/rag/answer can retrieve chunks and generate a final answer using OpenAI.

## Current API Endpoints

GET /api/rag/health checks the Qdrant connection and available collections.

POST /api/rag/query accepts a query and returns matching chunks from Qdrant.

POST /api/rag/answer accepts a query, retrieves matching chunks, and returns a generated answer with sources.

## Integration Plan

Phase 1 is local-only RAG.

Phase 2 can add a frontend RAG test page.

Phase 3 can ingest more Aura documents, including architecture notes, remediation policy descriptions, and safe deployment plans.

Phase 4 can add stronger source filtering and metadata.

Phase 5 can connect RAG to Kafka alerts only after the local RAG system is reliable.

The RAG layer should not be connected to live remediation actions until the retrieval, source attribution, and safety rules are tested.

## Recommended Usage

Use the RAG system to answer questions like:

- What is the purpose of the vector RAG branch?
- Should this branch connect to live AKS resources?
- What endpoints are available for local RAG?
- How does the ingestion pipeline work?
- What should stay separate from the Rust eBPF branch?
