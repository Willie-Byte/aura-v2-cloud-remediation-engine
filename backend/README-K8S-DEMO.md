# Aura V2 Kubernetes + KEDA Demo

Aura V2 is an autonomous cloud remediation demo that processes simulated cloud security telemetry through Kafka, generates an AI-assisted remediation plan, requires human approval, and publishes a final simulated execution result.

This demo focuses on detecting non-quantum-safe cryptography on an Azure App Service and generating a remediation plan to enforce TLS 1.3 with Kyber/ML-KEM hybrid key exchange.

## Architecture Flow

```text
PQC Telemetry Job
  → raw-telemetry Kafka topic
  → Telemetry Normalizer
  → threat-ingest Kafka topic
  → Orchestrator
  → remediation-commands Kafka topic
  → Worker
  → approval-queue Kafka topic
  → Approval Consumer
  → Approval Producer Job
  → approval-decisions Kafka topic
  → Approval Decision Consumer
  → execution-results Kafka topic
  → Results Consumer
