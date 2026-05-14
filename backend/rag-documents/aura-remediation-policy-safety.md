# Aura Remediation Policy and Safety Architecture

## Purpose

Aura V2 uses a remediation policy and validation layer to prevent unsafe AI-generated actions from being executed directly.

The policy layer acts as the rulebook for what remediation actions are allowed, which resource types they apply to, and which issue types they can safely respond to.

The goal is to keep AI useful for generating remediation plans while preventing it from freely choosing dangerous cloud actions.

## Why Policy Matters

AI-generated remediation must be controlled by deterministic rules.

Aura should not blindly trust generated remediation text.

Instead, Aura uses policy and validation to decide whether a command is safe enough to simulate, reject, or route through human approval.

This helps prevent:

- incorrect remediation actions
- unsafe cloud changes
- action and resource mismatches
- unsupported issue types
- uncontrolled apply mode
- accidental production changes
- AI hallucinated execution paths

## Current Policy Responsibilities

The remediation policy layer is responsible for:

1. Defining supported issue types.
2. Mapping issue types to expected remediation actions.
3. Defining allowed resource types.
4. Describing the reason for each remediation action.
5. Helping the orchestrator choose safe actions.
6. Helping the worker validate commands before execution.
7. Keeping dangerous or unsupported commands out of execution.

## Supported Issue Types

Aura V2 currently supports issue types such as:

- publicStorageAccess
- publicSSHAccess
- publicRDPAccess
- unencryptedDatabase
- weakTlsVersion
- unauthorizedPodExec

## Example Policy Mappings

Example mappings include:

- publicStorageAccess maps to disablePublicAccess on a storageAccount
- publicSSHAccess maps to restrictSSHAccess on a networkSecurityGroup
- publicRDPAccess maps to restrictRDPAccess on a networkSecurityGroup
- unencryptedDatabase maps to enableDatabaseEncryption on a sqlDatabase
- weakTlsVersion maps to enforceModernTLS on an appService
- unauthorizedPodExec maps to investigateUnauthorizedPodExec on an aksPod

These mappings prevent the AI from pairing the wrong action with the wrong type of cloud resource.

## Validator Responsibilities

The validator checks remediation commands before the worker can process them.

The validator should check:

1. The command payload is a valid object.
2. Required fields are present.
3. The issue type is supported.
4. The action is allowed.
5. The issue type matches the expected action.
6. The resource type matches the policy.
7. The status value is valid.
8. The execution mode is valid.
9. A remediation plan exists when required.
10. Approval-required actions go through the approval queue.

## Worker Safety Behavior

The worker should not execute unsafe commands.

The worker currently follows this behavior:

1. Consume a remediation command.
2. Validate the command.
3. If valid and safe, simulate the remediation.
4. If invalid, reject the command.
5. Send rejected commands to the remediation-dlq topic.
6. Publish audit events for important lifecycle actions.
7. Publish execution results for success and failure.
8. Skip duplicate remediation commands when the same remediation ID appears again.

## Dead-Letter Queue

The dead-letter queue is used when a command fails validation.

Invalid commands are sent to:

- remediation-dlq

This preserves rejected commands for debugging, audit review, and future replay analysis.

A rejected command should also produce:

- an audit event
- an execution result with status rejected
- a reason explaining why the command was rejected

## Execution Modes

Aura V2 is simulation-first.

The safest current execution mode is:

- simulate

Dangerous or future execution modes may include:

- plan
- apply
- active-apply

Aura should not use real apply mode until dry-run validation, isolated execution, human approval, and persistent audit storage are complete.

## Approval Rules

Some remediation actions should require human approval before execution.

Approval is important for high-risk actions because even a technically valid command can still have business or operational risk.

Approval workflows should be used when:

- the command could affect production resources
- the command could remove access
- the command could change networking rules
- the command could impact availability
- the command could affect live AKS workloads
- the remediation is uncertain or low-confidence

## Audit Events

The policy and validation flow should produce audit events such as:

- REMEDIATION_COMMAND_RECEIVED
- REMEDIATION_EXECUTED
- REMEDIATION_REJECTED_TO_DLQ
- REMEDIATION_DUPLICATE_SKIPPED
- REMEDIATION_AWAITING_APPROVAL
- REMEDIATION_APPROVED
- REMEDIATION_REJECTED

Audit events make it easier to understand why a remediation was accepted, rejected, skipped, or routed for approval.

## Execution Results

Execution results should describe the final outcome of a remediation command.

Common statuses include:

- executed
- rejected
- skipped_duplicate
- awaiting_approval

Execution results are separate from audit logs because they represent the outcome of the remediation lifecycle.

## Safety Boundary

The remediation policy system is still part of a prototype.

It should not perform real production remediation yet.

It should not directly modify live AKS resources.

It should not bypass human approval for risky changes.

It should not allow AI-generated commands to execute without validation.

It should not connect experimental Rust eBPF enforcement to production apply workflows.

## Recommended Questions

Use the RAG system to ask:

- Why does Aura need a remediation policy layer?
- What does the validator check?
- What happens when a remediation command fails validation?
- Why does Aura use a dead-letter queue?
- Why is simulation mode important?
- What issue types does Aura currently support?
- What should require human approval?
