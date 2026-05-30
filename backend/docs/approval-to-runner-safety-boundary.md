# Approval-to-Runner Safety Boundary

## Purpose

This document records the safety audit of Aura V2's post-approval execution path.

The goal was to verify whether clicking approve can trigger production remediation, Terraform apply, destructive kubectl actions, Azure CLI mutation, or a real execution runner.

## Final Finding

Aura V2 is not fully armed for production execution.

The current approval path is simulation-only.

```text
APPROVE DOES NOT RUN PRODUCTION APPLY
```

## Verified Boundary

The current flow is:

```text
approval route
→ Kafka approval-decisions topic
→ approval decision consumer
→ simulated execution result
→ execution-results topic
```

The current flow is not:

```text
approval route
→ Terraform apply
→ kubectl mutation
→ Azure CLI mutation
→ production execution runner
```

## Code Findings

### Validator

`backend/streaming/validator.js` requires:

```text
executionMode: simulate
```

Any other execution mode is rejected.

### Approval Decision Producer

`backend/streaming/approvalDecisionProducer.js` creates approval decisions with:

```text
executionMode: simulate
```

### Dashboard Approval Route

`backend/routes/streamingApprovalRoutes.js` also creates approval decisions with:

```text
executionMode: simulate
```

The route publishes to:

```text
KAFKA_APPROVAL_DECISIONS_TOPIC
```

It does not call Terraform, kubectl, Azure CLI, child_process, spawn, or a production runner.

### Approval Decision Consumer

`backend/streaming/approvalDecisionConsumer.js` logs:

```text
Final execution is still simulated for safety.
```

For approved decisions, it publishes an execution result with:

```text
status: executed
reason: human_approved
message: Human reviewer approved the remediation. Final execution was simulated successfully.
```

This is a simulated result, not production apply.

## Search Results

The audit did not find a custom production execution runner outside dependency files.

The relevant runtime files are:

```text
backend/streaming/worker.js
backend/streaming/approvalDecisionConsumer.js
backend/streaming/approvalConsumer.js
backend/streaming/approvalDecisionProducer.js
backend/routes/streamingApprovalRoutes.js
```

Searches for dangerous runtime execution paths did not identify a production approval-to-apply path.

The grep results did find `kubectl apply` and `kubectl delete` references, but those were in documentation and helper scripts for deployment or validation, not in the approval decision runtime path.

## Safety Conclusion

Current status:

```text
live detection: yes
remediation planning: yes
approval routing: yes
post-approval simulated result: yes
production apply: no
real execution runner: no
```

## Recommendation

Do not add production execution until the following exist:

```text
isolated execution runner
dry-run-only Terraform plan validation
persistent audit/result storage
strict approval records
role-based approval permissions
explicit environment gate for apply mode
manual break-glass procedure
rollback plan
```

Until then, keep Aura V2 described as:

```text
a safety-gated live detection and remediation-planning system with simulated post-approval execution
```
\n