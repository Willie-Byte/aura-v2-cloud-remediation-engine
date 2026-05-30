# Persistent Audit and Result Storage Summary

## Purpose

This document records the first persistent storage phase for Aura V2 streaming observability.

The goal was to move beyond log-only Kafka consumers and persist key streaming events into MongoDB while preserving Aura V2's safety boundary.

## Branch

```text
docs/document-persistent-audit-result-storage
```

## Source PR

```text
PR #69: feature/persistent-audit-result-storage
```

## Final Status

```text
PERSISTENT AUDIT AND RESULT STORAGE ADDED SAFELY
```

## What Was Added

PR #69 added MongoDB persistence for the main streaming observability topics.

Persistent models:

```text
backend/models/StreamingAuditEvent.js
backend/models/ExecutionResult.js
backend/models/ApprovalRequest.js
backend/models/ApprovalDecision.js
```

Shared streaming database helper:

```text
backend/streaming/streamingDb.js
```

## Persisted Kafka Topics

The following streaming topics now have MongoDB persistence:

```text
audit-log              → StreamingAuditEvent
execution-results      → ExecutionResult
approval-queue         → ApprovalRequest
approval-decisions     → ApprovalDecision
```

## Consumer Updates

The following consumers were updated:

```text
backend/streaming/auditConsumer.js
backend/streaming/resultConsumer.js
backend/streaming/approvalConsumer.js
backend/streaming/approvalDecisionConsumer.js
```

### Audit Consumer

`auditConsumer.js` now persists audit events into:

```text
StreamingAuditEvent
```

Verification marker:

```text
Audit event persisted to MongoDB.
```

### Result Consumer

`resultConsumer.js` now persists execution results into:

```text
ExecutionResult
```

Verification marker:

```text
Execution result persisted to MongoDB.
```

### Approval Consumer

`approvalConsumer.js` now persists approval requests into:

```text
ApprovalRequest
```

Verification marker:

```text
Approval request persisted to MongoDB.
```

### Approval Decision Consumer

`approvalDecisionConsumer.js` now persists approval decisions into:

```text
ApprovalDecision
```

Verification marker:

```text
Approval decision persisted to MongoDB.
```

## Duplicate Protection

The persistence models include duplicate protection using Kafka metadata:

```text
topic
partition
offset
```

This prevents the same consumed Kafka message from being stored repeatedly if a consumer restarts or reprocesses an offset.

Duplicate-safe log markers include:

```text
already persisted
```

## Safety Boundary Preserved

This persistence phase does not enable production remediation execution.

The approval decision consumer still contains:

```text
Final execution is still simulated for safety.
```

Aura V2 remains:

```text
approval-gated
simulation-only after approval
not wired to production Terraform apply
not wired to destructive kubectl actions
not wired to Azure CLI mutation from approval
```

## Validation

Syntax checks passed for:

```text
backend/models/StreamingAuditEvent.js
backend/models/ExecutionResult.js
backend/models/ApprovalRequest.js
backend/models/ApprovalDecision.js
backend/streaming/streamingDb.js
backend/streaming/resultConsumer.js
backend/streaming/approvalConsumer.js
backend/streaming/auditConsumer.js
backend/streaming/approvalDecisionConsumer.js
```

The existing Tetragon test suite passed:

```text
npm run test:tetragon:all
```

Final test result:

```text
All local Tetragon safety tests passed.
```

## Final Conclusion

Aura V2 now has persistent MongoDB storage for the main streaming observability path.

Current status:

```text
live telemetry: yes
Kafka streaming: yes
approval routing: yes
persistent audit storage: yes
persistent result storage: yes
persistent approval request storage: yes
persistent approval decision storage: yes
production apply: no
post-approval execution: simulated only
```

## Recommended Next Step

The next phase should expose this persistent storage safely through read-only API endpoints or admin dashboard views.

Recommended branch:

```text
feature/read-only-streaming-observability-api
```

Recommended first endpoints:

```text
GET /api/streaming/audit-events
GET /api/streaming/execution-results
GET /api/streaming/approval-requests
GET /api/streaming/approval-decisions
```

These routes should be read-only and should not create, approve, reject, or execute remediations.

