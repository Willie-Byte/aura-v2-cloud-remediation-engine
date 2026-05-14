# Aura Telemetry eBPF Tetragon Architecture

## Purpose

Aura V2 uses telemetry to detect cloud and Kubernetes security events before turning them into remediation workflows.

The telemetry layer is responsible for observing runtime behavior, normalizing events, and sending security signals into the Aura streaming pipeline.

The goal is to safely connect live runtime signals to Aura without allowing experimental telemetry or eBPF logic to directly modify production systems.

## Current Telemetry Direction

Aura is moving from simulated telemetry toward live runtime telemetry.

The current live telemetry direction uses:

- AKS for Kubernetes workloads
- Tetragon for runtime observability
- eBPF-based event visibility
- Kafka for event transport
- a telemetry normalizer to convert raw events into Aura threat events

The telemetry system should remain separate from remediation execution until detection quality, event normalization, validation, and approval gates are reliable.

## What Tetragon Does

Tetragon is used to observe runtime activity inside Kubernetes environments.

It can detect events such as:

- process execution
- command execution inside pods
- suspicious shell activity
- workload behavior
- file or network-related activity depending on policy
- unauthorized kubectl exec patterns

Tetragon gives Aura visibility into what is happening inside the cluster without requiring Aura to directly control the kernel.

## What eBPF Provides

eBPF allows safe programs to observe kernel-level events.

For Aura, eBPF is useful because it can provide low-level visibility into runtime activity such as process execution and network behavior.

However, eBPF development must be handled carefully because mistakes at the kernel level can crash or destabilize the Linux environment.

## Mac Development Boundary

Wilson develops on a Mac, but eBPF code should run inside Linux.

The safe workflow is:

1. Use macOS for coding, Git, VS Code, and project management.
2. Use a Linux VM or AKS node for kernel-level testing.
3. Keep eBPF experiments isolated from the live Aura namespace.
4. Use Tetragon first for observability before writing custom enforcement logic.
5. Avoid pushing experimental eBPF enforcement into production.

This protects the Mac host and keeps kernel-level experiments disposable.

## AKS Telemetry Lab

Aura’s telemetry lab can use AKS as the runtime environment.

AKS provides Kubernetes nodes where Tetragon can observe workload behavior.

A safe telemetry lab should use a separate namespace such as:

- aura-lab

The telemetry lab should not directly modify production namespaces.

The lab should be used to test:

- unauthorized pod exec detection
- suspicious command execution
- process execution events
- event forwarding to Kafka
- telemetry normalization
- dashboard visibility

## Tetragon Bridge

A Tetragon bridge can tail or collect Tetragon events and forward them to Kafka.

The bridge should publish raw telemetry to a topic such as:

- raw-telemetry

The telemetry normalizer can then consume raw telemetry and produce normalized Aura threat events.

This keeps raw telemetry separate from normalized security findings.

## Telemetry Normalizer

The telemetry normalizer converts raw runtime events into Aura’s internal threat format.

Its responsibilities include:

1. Read raw telemetry events.
2. Identify relevant security signals.
3. Map raw event fields into Aura alert fields.
4. Assign an issue type.
5. Set a resource type.
6. Add severity.
7. Add a useful description.
8. Publish the normalized event into the threat ingestion pipeline.

Example issue types may include:

- unauthorizedPodExec
- suspiciousShellActivity
- suspiciousProcessExecution
- riskyRuntimeBehavior

## Current Safe Event Flow

A safe telemetry flow works like this:

1. Tetragon observes runtime activity inside AKS.
2. The Tetragon bridge forwards raw events to Kafka.
3. Raw telemetry is published to raw-telemetry.
4. The telemetry normalizer consumes raw-telemetry.
5. The normalizer converts the event into an Aura threat event.
6. The normalized threat is published to threat-ingest.
7. The orchestrator consumes the threat.
8. Aura generates or selects a remediation plan.
9. The worker validates the remediation command.
10. The remediation remains simulation-first unless approval and safety gates allow more.

## Unauthorized Pod Exec Example

An unauthorized pod exec event may represent someone opening a shell inside a Kubernetes pod.

Aura should treat this as a detection signal first.

The system should not immediately kill pods, block users, or change cluster policy without validation and approval.

A safe response may include:

- create an alert
- record the namespace, pod, container, and command
- mark the issue type as unauthorizedPodExec
- generate an investigation plan
- send the event to the streaming pipeline
- require human approval before any disruptive action

## Why Telemetry Must Stay Separate

Telemetry and enforcement are not the same thing.

Telemetry means observing events.

Enforcement means changing or blocking behavior.

Aura should first prove telemetry quality before allowing enforcement.

The telemetry layer should stay separate from:

- production remediation execution
- Rust eBPF enforcement code
- direct AKS modifications
- live namespace changes
- uncontrolled apply mode

## Rust eBPF Boundary

The Rust eBPF branch should remain separate from the vector RAG branch and the live Aura namespace.

Rust eBPF experiments should be tested inside a disposable Linux VM or isolated lab environment.

The safe workflow is:

1. Build basic eBPF examples locally in Linux.
2. Test simple process execution hooks.
3. Confirm logging and event capture.
4. Avoid blocking or enforcement behavior at first.
5. Avoid loading experimental programs into production nodes.
6. Keep Tetragon as the stable observability layer while custom eBPF matures.

## Safety Rules

Aura telemetry should follow these rules:

1. Observe first, enforce later.
2. Keep Tetragon stable and separate from experimental eBPF.
3. Do not push custom eBPF enforcement into production.
4. Do not modify live AKS resources from the RAG branch.
5. Normalize telemetry before remediation.
6. Require validation before any remediation command.
7. Require human approval before disruptive actions.
8. Keep simulation mode as the default.
9. Preserve raw telemetry for debugging.
10. Publish audit events when telemetry leads to remediation.

## Recommended Questions

Use the RAG system to ask:

- What does Tetragon do in Aura?
- Why should eBPF testing happen inside Linux?
- How does raw telemetry become an Aura threat event?
- What is the telemetry normalizer responsible for?
- Why should telemetry stay separate from enforcement?
- What is an unauthorized pod exec event?
- Why should the Rust eBPF branch stay isolated?
