Your branch is up to date with 'origin/main'.
Already up to date.
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
Switched to a new branch 'docs/update-checklist-tetragon-local-test'
(base) wilsongaldamez@Wilsons-MacBook-Pro Aura-V2-Streaming-Spike % cd ~/Desktop/Aura-V2-Streaming-Spike

python3 - <<'PY'
from pathlib import Path

path = Path("AURA_V2_DEMO_CHECKLIST.md")
text = path.read_text()

text = text.replace(
"""- Clean Tetragon live telemetry bridge extracted from the old eBPF branch
- Clear safety boundaries between local RAG, Kafka, AKS, eBPF, and production remediation""",
"""- Clean Tetragon live telemetry bridge extracted from the old eBPF branch
- Local Tetragon bridge classification test with fixture-based events
- Local Tetragon bridge log replay test with `.jsonl` fixture events
- Clear safety boundaries between local RAG, Kafka, AKS, eBPF, and production remediation"""
)

text = text.replace(
"""Merge pull request #12 from Willie-Byte/feature/tetragon-live-bridge-clean
Merge pull request #11 from Willie-Byte/feature/rag-ingest-all-script
Merge pull request #10 from Willie-Byte/docs/update-checklist-rag-source-summary
Merge pull request #9 from Willie-Byte/feature/rag-answer-source-mode
Merge pull request #8 from Willie-Byte/docs/update-checklist-rag-source-badges""",
"""Merge pull request #16 from Willie-Byte/feature/tetragon-bridge-log-replay
Merge pull request #15 from Willie-Byte/docs/update-checklist-tetragon-local-test
Merge pull request #14 from Willie-Byte/feature/tetragon-bridge-local-test
Merge pull request #13 from Willie-Byte/docs/update-checklist-tetragon-bridge
Merge pull request #12 from Willie-Byte/feature/tetragon-live-bridge-clean"""
)

insert_after = """Expected mode should include executable permissions, such as:

```text
-rwxr-xr-x
heredoc> 
heredoc> 
heredoc> 
heredoc> 
 *  History restored 

(base) wilsongaldamez@Wilsons-MacBook-Pro Aura-V2-Streaming-Spike % 
(base) wilsongaldamez@Wilsons-MacBook-Pro Aura-V2-Streaming-Spike % cd ~/Desktop/Aura-V2-Streaming-Spike

python3 - <<'PY'
from pathlib import Path

path = Path("AURA_V2_DEMO_CHECKLIST.md")
text = path.read_text()

text = text.replace(
"""- Clean Tetragon live telemetry bridge extracted from the old eBPF branch
- Clear safety boundaries between local RAG, Kafka, AKS, eBPF, and production remediation""",
"""- Clean Tetragon live telemetry bridge extracted from the old eBPF branch
- Local Tetragon bridge classification test with fixture-based events
- Local Tetragon bridge log replay test with `.jsonl` fixture events
- Clear safety boundaries between local RAG, Kafka, AKS, eBPF, and production remediation"""
)

text = text.replace(
"""Merge pull request #12 from Willie-Byte/feature/tetragon-live-bridge-clean
Merge pull request #11 from Willie-Byte/feature/rag-ingest-all-script
Merge pull request #10 from Willie-Byte/docs/update-checklist-rag-source-summary
Merge pull request #9 from Willie-Byte/feature/rag-answer-source-mode
Merge pull request #8 from Willie-Byte/docs/update-checklist-rag-source-badges""",
"""Merge pull request #14 from Willie-Byte/feature/tetragon-bridge-local-test
Merge pull request #13 from Willie-Byte/docs/update-checklist-tetragon-bridge
Merge pull request #12 from Willie-Byte/feature/tetragon-live-bridge-clean
Merge pull request #11 from Willie-Byte/feature/rag-ingest-all-script
Merge pull request #10 from Willie-Byte/docs/update-checklist-rag-source-summary"""
)

insert_after = """Expected mode should include executable permissions, such as:

```text
-rwxr-xr-x
heredoc> 
(base) wilsongaldamez@Wilsons-MacBook-Pro Aura-V2-Streaming-Spike % cd ~/Desktop/Aura-V2-Streaming-Spike

git status
git diff AURA_V2_DEMO_CHECKLIST.md

grep -n "test:tetragon:bridge" AURA_V2_DEMO_CHECKLIST.md
grep -n "Verify Local Tetragon Bridge Classification Test" AURA_V2_DEMO_CHECKLIST.md
grep -n "feature/tetragon-bridge-log-replay" AURA_V2_DEMO_CHECKLIST.md
On branch docs/update-checklist-tetragon-local-test
nothing to commit, working tree clean
(base) wilsongaldamez@Wilsons-MacBook-Pro Aura-V2-Streaming-Spike % git add AURA_V2_DEMO_CHECKLIST.md
git commit -m "Update checklist with local Tetragon bridge test"
git push -u origin docs/update-checklist-tetragon-local-test
git status
On branch docs/update-checklist-tetragon-local-test
nothing to commit, working tree clean
Total 0 (delta 0), reused 0 (delta 0), pack-reused 0 (from 0)
remote: 
remote: Create a pull request for 'docs/update-checklist-tetragon-local-test' on GitHub by visiting:
remote:      https://github.com/Willie-Byte/aura-v2-cloud-remediation-engine/pull/new/docs/update-checklist-tetragon-local-test
remote: 
To https://github.com/Willie-Byte/aura-v2-cloud-remediation-engine.git
 * [new branch]      docs/update-checklist-tetragon-local-test -> docs/update-checklist-tetragon-local-test
branch 'docs/update-checklist-tetragon-local-test' set up to track 'origin/docs/update-checklist-tetragon-local-test'.
On branch docs/update-checklist-tetragon-local-test
Your branch is up to date with 'origin/docs/update-checklist-tetragon-local-test'.

nothing to commit, working tree clean
(base) wilsongaldamez@Wilsons-MacBook-Pro Aura-V2-Streaming-Spike % git add AURA_V2_DEMO_CHECKLIST.md
git commit -m "Update checklist with local Tetragon bridge test"
git push -u origin docs/update-checklist-tetragon-local-test
git status
On branch docs/update-checklist-tetragon-local-test
Your branch is up to date with 'origin/docs/update-checklist-tetragon-local-test'.

nothing to commit, working tree clean
branch 'docs/update-checklist-tetragon-local-test' set up to track 'origin/docs/update-checklist-tetragon-local-test'.
Everything up-to-date
On branch docs/update-checklist-tetragon-local-test
Your branch is up to date with 'origin/docs/update-checklist-tetragon-local-test'.

nothing to commit, working tree clean
(base) wilsongaldamez@Wilsons-MacBook-Pro Aura-V2-Streaming-Spike % cd ~/Desktop/Aura-V2-Streaming-Spike
git checkout docs/update-checklist-tetragon-local-test

python3 - <<'PY'
from pathlib import Path

path = Path("AURA_V2_DEMO_CHECKLIST.md")
text = path.read_text()

text = text.replace(
"- Clean Tetragon live telemetry bridge extracted from the old eBPF branch\n- Clear safety boundaries between local RAG, Kafka, AKS, eBPF, and production remediation",
"- Clean Tetragon live telemetry bridge extracted from the old eBPF branch\n- Local Tetragon bridge classification test with fixture-based events\n- Clear safety boundaries between local RAG, Kafka, AKS, eBPF, and production remediation"
)

text = text.replace(
"""Merge pull request #12 from Willie-Byte/feature/tetragon-live-bridge-clean
Merge pull request #11 from Willie-Byte/feature/rag-ingest-all-script
Merge pull request #10 from Willie-Byte/docs/update-checklist-rag-source-summary
Merge pull request #9 from Willie-Byte/feature/rag-answer-source-mode
Merge pull request #8 from Willie-Byte/docs/update-checklist-rag-source-badges""",
"""Merge pull request #14 from Willie-Byte/feature/tetragon-bridge-local-test
Merge pull request #13 from Willie-Byte/docs/update-checklist-tetragon-bridge
Merge pull request #12 from Willie-Byte/feature/tetragon-live-bridge-clean
Merge pull request #11 from Willie-Byte/feature/rag-ingest-all-script
Merge pull request #10 from Willie-Byte/docs/update-checklist-rag-source-summary"""
)

insert_after = """Expected mode should include executable permissions, such as:

```text
-rwxr-xr-x
heredoc> 
heredoc> 
heredoc> 
(base) wilsongaldamez@Wilsons-MacBook-Pro Aura-V2-Streaming-Spike % cd ~/Desktop/Aura-V2-Streaming-Spike

cp ~/Downloads/AURA_V2_DEMO_CHECKLIST_UPDATED_TETRAGON_LOCAL_TEST.md ./AURA_V2_DEMO_CHECKLIST.md

git status
git diff AURA_V2_DEMO_CHECKLIST.md

git add AURA_V2_DEMO_CHECKLIST.md
git commit -m "Update checklist with local Tetragon bridge test"
git push -u origin docs/update-checklist-tetragon-local-test
git status
On branch docs/update-checklist-tetragon-local-test
Your branch is up to date with 'origin/docs/update-checklist-tetragon-local-test'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   AURA_V2_DEMO_CHECKLIST.md

no changes added to commit (use "git add" and/or "git commit -a")
diff --git a/AURA_V2_DEMO_CHECKLIST.md b/AURA_V2_DEMO_CHECKLIST.md
index 84a924d..8fda03f 100644
--- a/AURA_V2_DEMO_CHECKLIST.md
+++ b/AURA_V2_DEMO_CHECKLIST.md
@@ -22,6 +22,7 @@ Aura V2 currently demonstrates:
 - RAG answer source summary banner using `sourceSummary`
 - One-command RAG refresh with `npm run rag:ingest:all`
 - Clean Tetragon live telemetry bridge extracted from the old eBPF branch
+- Local Tetragon bridge classification test with fixture-based events
 - Clear safety boundaries between local RAG, Kafka, AKS, eBPF, and production remediation
 
 ## 1. Start From a Clean Main Branch
@@ -47,11 +48,11 @@ nothing to commit, working tree clean
 The latest commits should include recent work such as:
 
 ```text
+Merge pull request #14 from Willie-Byte/feature/tetragon-bridge-local-test
+Merge pull request #13 from Willie-Byte/docs/update-checklist-tetragon-bridge
 Merge pull request #12 from Willie-Byte/feature/tetragon-live-bridge-clean
 Merge pull request #11 from Willie-Byte/feature/rag-ingest-all-script
 Merge pull request #10 from Willie-Byte/docs/update-checklist-rag-source-summary
-Merge pull request #9 from Willie-Byte/feature/rag-answer-source-mode
-Merge pull request #8 from Willie-Byte/docs/update-checklist-rag-source-badges
 ```
 
 ## 2. Use the Correct Node Version
@@ -847,7 +848,56 @@ Expected mode should include executable permissions, such as:
 ```
 
 
-## 21. RAG-Only Demo Safety Settings
+## 21. Verify Local Tetragon Bridge Classification Test
+
+PR #14 added a safe local test path for the Tetragon bridge classification logic.
+
+This test does not require:
+
+- AKS
+- live Tetragon logs
+- a running DaemonSet
+- live pod execution
+- live Kafka publishing
+
+Files added:
+
+```text
+backend/scripts/testTetragonBridgeClassification.js
+backend/fixtures/tetragon/suspicious-process-exec.json
+backend/fixtures/tetragon/non-suspicious-process-exec.json
+backend/fixtures/tetragon/ignored-namespace-process-exec.json
+```
+
+The bridge file was also updated so it can be imported for testing without immediately starting Kafka or tailing a real Tetragon log file:
+
+```text
+backend/streaming/tetragonBridge.js
+```
+
+Run the local bridge classification test from the backend folder:
+
+```bash
+cd ~/Desktop/Aura-V2-Streaming-Spike/backend
+npm run test:tetragon:bridge
+```
+
+Expected output:
+
+```text
+[tetragon-bridge-test] Starting local classification tests...
+[tetragon-bridge-test] All local classification tests passed.
+```
+
+What the test verifies:
+
+- `/bin/sh whoami` in the `default` namespace is classified as `unauthorizedPodExec`
+- `/usr/bin/sleep 30` is ignored as non-suspicious
+- suspicious execution in `kube-system` is ignored because it is outside the monitored namespace
+- the classification logic works without live AKS or real Tetragon logs
+
+
+## 23. RAG-Only Demo Safety Settings
 
 For a RAG-only demo, keep this in `backend/.env`:
 
@@ -861,7 +911,7 @@ RAG_CHAT_MODEL=gpt-4o-mini
 
 Do not commit real `.env` files.
 
-## 22. Safety Boundaries To Explain During Demo
+## 24. Safety Boundaries To Explain During Demo
 
 Aura V2 is intentionally conservative.
 
@@ -875,21 +925,22 @@ For the current demo:
 - Production remediation execution is not enabled
 - The system should not modify live AKS resources
 - The clean Tetragon bridge can publish live eBPF telemetry to Kafka, but it should remain separate from the local RAG system
+- The local Tetragon bridge classification test can validate suspicious-event detection before AKS deployment
 - The system should not connect RAG directly to live Tetragon events yet
 - Rust eBPF enforcement work stays separate from RAG
 - Terraform apply mode is not production-ready
 
-## 23. Good Demo Explanation
+## 25. Good Demo Explanation
 
 Use this short explanation:
 
 ```text
 Aura V2 is an event-driven cloud remediation prototype. It uses Kafka to separate threat intake, AI-assisted remediation planning, validation, execution results, approval dec
isions, DLQ handling, and audit events. The system is safety-first, so real execution is blocked behind policy validation, simulation mode, and future approval controls.
 
-The current main branch also adds a local Vector RAG system. Aura can answer project-specific questions using local architecture documents and selected source-code files stor
ed in Qdrant with OpenAI embeddings. The RAG UI now includes polished preset cards and source type badges for fast demos, so a presenter can quickly show architecture, source-
code, Kafka, Qdrant, worker-validation, safety-boundary, and Tetragon searches while clearly showing whether each answer came from source code, architecture documents, streami
ng documents, policy documents, or telemetry documents.
:
+What the test verifies:
+
+- `/bin/sh whoami` in the `default` namespace is classified as `unauthorizedPodExec`
+- `/usr/bin/sleep 30` is ignored as non-suspicious
+- suspicious execution in `kube-system` is ignored because it is outside the monitored namespace
+- the classification logic works without live AKS or real Tetragon logs
+
+
+## 23. RAG-Only Demo Safety Settings
 
 For a RAG-only demo, keep this in `backend/.env`:
 
@@ -861,7 +911,7 @@ RAG_CHAT_MODEL=gpt-4o-mini
 
 Do not commit real `.env` files.
 
-## 22. Safety Boundaries To Explain During Demo
+## 24. Safety Boundaries To Explain During Demo
 
 Aura V2 is intentionally conservative.
 
@@ -875,21 +925,22 @@ For the current demo:
 - Production remediation execution is not enabled
 - The system should not modify live AKS resources
 - The clean Tetragon bridge can publish live eBPF telemetry to Kafka, but it should remain separate from the local RAG system
+- The local Tetragon bridge classification test can validate suspicious-event detection before AKS deployment
 - The system should not connect RAG directly to live Tetragon events yet
 - Rust eBPF enforcement work stays separate from RAG
 - Terraform apply mode is not production-ready
 
-## 23. Good Demo Explanation
+## 25. Good Demo Explanation
 
 Use this short explanation:
 
 ```text
 Aura V2 is an event-driven cloud remediation prototype. It uses Kafka to separate threat intake, AI-assisted remediation planning, validation, execution results, approval decisions, DLQ handling, and audit events. The system is safety-first, so real execution is blocked behind policy validation, simulation mode, and future approval controls.
 
-The current main branch also adds a local Vector RAG system. Aura can answer project-specific questions using local architecture documents and selected source-code files stored in Qdrant with OpenAI embeddings. The RAG UI now includes polished preset cards and source type badges for fast demos, so a presenter can quickly show architecture, source-code, Kafka, Qdrant, worker-validation, safety-boundary, and Tetragon searches while clearly showing whether each answer came from source code, architecture documents, streaming documents, policy documents, or telemetry documents.

(base) wilsongaldamez@Wilsons-MacBook-Pro Aura-V2-Streaming-Spike % cd ~/Desktop/Aura-V2-Streaming-Spike

cp ~/Downloads/AURA_V2_DEMO_CHECKLIST_UPDATED_TETRAGON_LOCAL_TEST.md ./AURA_V2_DEMO_CHECKLIST.md

git status
git diff AURA_V2_DEMO_CHECKLIST.md

git add AURA_V2_DEMO_CHECKLIST.md
git commit -m "Update checklist with local Tetragon bridge test"
git push -u origin docs/update-checklist-tetragon-local-test
git status
On branch docs/update-checklist-tetragon-local-test
Your branch is up to date with 'origin/docs/update-checklist-tetragon-local-test'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   AURA_V2_DEMO_CHECKLIST.md

no changes added to commit (use "git add" and/or "git commit -a")
diff --git a/AURA_V2_DEMO_CHECKLIST.md b/AURA_V2_DEMO_CHECKLIST.md
index 84a924d..8fda03f 100644
--- a/AURA_V2_DEMO_CHECKLIST.md
+++ b/AURA_V2_DEMO_CHECKLIST.md
@@ -22,6 +22,7 @@ Aura V2 currently demonstrates:
 - RAG answer source summary banner using `sourceSummary`
 - One-command RAG refresh with `npm run rag:ingest:all`
 - Clean Tetragon live telemetry bridge extracted from the old eBPF branch
+- Local Tetragon bridge classification test with fixture-based events
 - Clear safety boundaries between local RAG, Kafka, AKS, eBPF, and production remediation
 
 ## 1. Start From a Clean Main Branch
@@ -47,11 +48,11 @@ nothing to commit, working tree clean
 The latest commits should include recent work such as:
 
 ```text
+Merge pull request #14 from Willie-Byte/feature/tetragon-bridge-local-test
+Merge pull request #13 from Willie-Byte/docs/update-checklist-tetragon-bridge
 Merge pull request #12 from Willie-Byte/feature/tetragon-live-bridge-clean
 Merge pull request #11 from Willie-Byte/feature/rag-ingest-all-script
 Merge pull request #10 from Willie-Byte/docs/update-checklist-rag-source-summary
-Merge pull request #9 from Willie-Byte/feature/rag-answer-source-mode
-Merge pull request #8 from Willie-Byte/docs/update-checklist-rag-source-badges
 ```
 
 ## 2. Use the Correct Node Version
@@ -847,7 +848,56 @@ Expected mode should include executable permissions, such as:
 ```
 
 
-## 21. RAG-Only Demo Safety Settings
+## 21. Verify Local Tetragon Bridge Classification Test
+
+PR #14 added a safe local test path for the Tetragon bridge classification logic.
+
+This test does not require:
+
+- AKS
+- live Tetragon logs
+- a running DaemonSet
+- live pod execution
+- live Kafka publishing
+
[docs/update-checklist-tetragon-local-test bebeeb5] Update checklist with local Tetragon bridge test
 1 file changed, 108 insertions(+), 20 deletions(-)
Enumerating objects: 5, done.
Counting objects: 100% (5/5), done.
Delta compression using up to 14 threads
Compressing objects: 100% (3/3), done.
Writing objects: 100% (3/3), 1.50 KiB | 1.50 MiB/s, done.
Total 3 (delta 2), reused 0 (delta 0), pack-reused 0 (from 0)
remote: Resolving deltas: 100% (2/2), completed with 2 local objects.
To https://github.com/Willie-Byte/aura-v2-cloud-remediation-engine.git
   8d503aa..bebeeb5  docs/update-checklist-tetragon-local-test -> docs/update-checklist-tetragon-local-test
branch 'docs/update-checklist-tetragon-local-test' set up to track 'origin/docs/update-checklist-tetragon-local-test'.
On branch docs/update-checklist-tetragon-local-test
Your branch is up to date with 'origin/docs/update-checklist-tetragon-local-test'.

nothing to commit, working tree clean
(base) wilsongaldamez@Wilsons-MacBook-Pro Aura-V2-Streaming-Spike % cd ~/Desktop/Aura-V2-Streaming-Spike

git status
git log --oneline -5

grep -n "test:tetragon:bridge" AURA_V2_DEMO_CHECKLIST.md
grep -n "Verify Local Tetragon Bridge Classification Test" AURA_V2_DEMO_CHECKLIST.md
grep -n "feature/tetragon-bridge-log-replay" AURA_V2_DEMO_CHECKLIST.md
On branch docs/update-checklist-tetragon-local-test
Your branch is up to date with 'origin/docs/update-checklist-tetragon-local-test'.

nothing to commit, working tree clean
bebeeb5 (HEAD -> docs/update-checklist-tetragon-local-test, origin/docs/update-checklist-tetragon-local-test) Update checklist with local Tetragon bridge test
8d503aa (origin/main, main) Merge pull request #14 from Willie-Byte/feature/tetragon-bridge-local-test
aed6e89 (origin/feature/tetragon-bridge-local-test) Add local Tetragon bridge classification test
c220bc6 Merge pull request #13 from Willie-Byte/docs/update-checklist-tetragon-bridge
28d2ee7 (origin/docs/update-checklist-tetragon-bridge) Update checklist with Tetragon bridge
882:npm run test:tetragon:bridge
993:"test:tetragon:bridge": "node scripts/testTetragonBridgeClassification.js",
"test:tetragon:replay": "node scripts/replayTetragonBridgeLog.js"
1051:npm run test:tetragon:bridge
851:## 21. Verify Local Tetragon Bridge Classification Test
1242:feature/tetragon-bridge-log-replay
(base) wilsongaldamez@Wilsons-MacBook-Pro Aura-V2-Streaming-Spike % cd ~/Desktop/Aura-V2-Streaming-Spike

git checkout main
git pull
git branch -d docs/update-checklist-tetragon-local-test

git status
git log --oneline -5 
Switched to branch 'main'
Your branch is up to date with 'origin/main'.
remote: Enumerating objects: 1, done.
remote: Counting objects: 100% (1/1), done.
remote: Total 1 (delta 0), reused 0 (delta 0), pack-reused 0 (from 0)
Unpacking objects: 100% (1/1), 937 bytes | 937.00 KiB/s, done.
From https://github.com/Willie-Byte/aura-v2-cloud-remediation-engine
   8d503aa..0045bc5  main       -> origin/main
Updating 8d503aa..0045bc5
Fast-forward
 AURA_V2_DEMO_CHECKLIST.md | 128 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++--------------------
 1 file changed, 108 insertions(+), 20 deletions(-)
Deleted branch docs/update-checklist-tetragon-local-test (was bebeeb5).
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
0045bc5 (HEAD -> main, origin/main) Merge pull request #15 from Willie-Byte/docs/update-checklist-tetragon-local-test
bebeeb5 (origin/docs/update-checklist-tetragon-local-test) Update checklist with local Tetragon bridge test
8d503aa Merge pull request #14 from Willie-Byte/feature/tetragon-bridge-local-test
aed6e89 (origin/feature/tetragon-bridge-local-test) Add local Tetragon bridge classification test
c220bc6 Merge pull request #13 from Willie-Byte/docs/update-checklist-tetragon-bridge
(base) wilsongaldamez@Wilsons-MacBook-Pro Aura-V2-Streaming-Spike % git checkout -b feature/tetragon-bridge-log-replay
Switched to a new branch 'feature/tetragon-bridge-log-replay'
(base) wilsongaldamez@Wilsons-MacBook-Pro Aura-V2-Streaming-Spike % cd ~/Desktop/Aura-V2-Streaming-Spike

sed -n '1,280p' backend/streaming/tetragonBridge.js
cat backend/scripts/testTetragonBridgeClassification.js
cat backend/package.json
require("dotenv").config({ path: __dirname + "/.env" });

const fs = require("fs");
const kafka = require("./kafkaClient");

const producer = kafka.producer();

const LOG_PATH =
  process.env.TETRAGON_LOG_PATH || "/var/run/cilium/tetragon/tetragon.log";

const RAW_TOPIC = process.env.KAFKA_RAW_TELEMETRY_TOPIC || "raw-telemetry";

const MONITORED_NAMESPACES = (
  process.env.TETRAGON_MONITORED_NAMESPACES || "default,aura"
)
  .split(",")
  .map((namespace) => namespace.trim())
  .filter(Boolean);

const READ_FROM_START = process.env.TETRAGON_READ_FROM_START === "true";

let filePosition = 0;
let leftover = "";

function getProcessFromTetragonEvent(event) {
  return (
    event.process_exec?.process ||
    event.process_exit?.process ||
    event.process_kprobe?.process ||
    event.process ||
    {}
  );
}

function getPodFromProcess(process) {
  return process.pod || process.docker || {};
}

function isSuspiciousProcess(binary, args) {
  const normalizedBinary = String(binary || "").toLowerCase();
  const normalizedArgs = String(args || "").toLowerCase();

  const suspiciousBinaryPattern =
    /\/(sh|bash|ash|zsh|curl|wget|nc|ncat|python|python3|perl|ruby|node)$/;

  const suspiciousArgsPattern =
    /\b(whoami|uname|id|curl|wget|nc|ncat|cat \/etc\/passwd|printenv)\b/;

  return (
    suspiciousBinaryPattern.test(normalizedBinary) ||
    suspiciousArgsPattern.test(normalizedArgs)
  );
}

function classifyTetragonProcessExec(event) {
  if (!event.process_exec) {
    return null;
  }

  const process = getProcessFromTetragonEvent(event);
  const pod = getPodFromProcess(process);

  const namespace = pod.namespace || "unknown";
  const podName = pod.name || "unknown";
  const container = pod.container || {};
  const image = container.image || {};
  const binary = process.binary || "";
  const args = process.arguments || process.args || "";

  if (!MONITORED_NAMESPACES.includes(namespace)) {
    return null;
  }

  if (!isSuspiciousProcess(binary, args)) {
    return null;
  }

  const telemetryId = `telemetry-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;

  return {
    telemetryId,
    id: telemetryId,
    source: "tetragon-ebpf",
    eventType: "process_exec",
    cloudProvider: "azure",
    resourceType: "aksPod",
    resourceName: `${namespace}/${podName}`,
    severity: "high",
    issueType: "unauthorizedPodExec",
    namespace,
    podName,
    containerName: container.name || "unknown",
    imageName: image.name || "unknown",
    binary,
    arguments: args,
    nodeName: event.node_name || event.nodeName || "unknown",
    timestamp: event.time || new Date().toISOString(),
    detectedAt: event.time || new Date().toISOString(),
    description: `Live eBPF detected suspicious process execution in AKS pod ${namespace}/${podName}: ${binary} ${args}`,
    rawTetragonEvent: event,
  };
}

async function publishTelemetry(telemetry) {
  await producer.send({
    topic: RAW_TOPIC,
    messages: [
      {
        key: telemetry.resourceName,
        value: JSON.stringify(telemetry),
      },
    ],
  });

  console.log(
    `[tetragon-bridge] Published ${telemetry.issueType} to ${RAW_TOPIC}: ${telemetry.resourceName}`
  );
}

async function processLine(line) {
  const trimmed = line.trim();

  if (!trimmed) {
    return;
  }

  let event;

  try {
    event = JSON.parse(trimmed);
  } catch (error) {
    console.error("[tetragon-bridge] Failed to parse JSON line:", error.message);
    return;
  }

  const telemetry = classifyTetragonProcessExec(event);

  if (!telemetry) {
    return;
  }

  await publishTelemetry(telemetry);
}

async function readNewLines() {
  if (!fs.existsSync(LOG_PATH)) {
    console.log(`[tetragon-bridge] Waiting for log file: ${LOG_PATH}`);
    return;
  }

  const stats = fs.statSync(LOG_PATH);

  if (stats.size < filePosition) {
    console.log("[tetragon-bridge] Log rotation detected. Resetting position.");
    filePosition = 0;
    leftover = "";
  }

  if (stats.size === filePosition) {
    return;
  }

  const stream = fs.createReadStream(LOG_PATH, {
    start: filePosition,
    end: stats.size - 1,
    encoding: "utf8",
  });

  filePosition = stats.size;

  let chunk = "";

  for await (const data of stream) {
    chunk += data;
  }

  const combined = leftover + chunk;
  const lines = combined.split("\n");

  leftover = lines.pop() || "";

  for (const line of lines) {
    await processLine(line);
  }
}

async function start() {
  console.log("[tetragon-bridge] Starting Tetragon to Kafka bridge");
  console.log(`[tetragon-bridge] Log path: ${LOG_PATH}`);
  console.log(`[tetragon-bridge] Raw telemetry topic: ${RAW_TOPIC}`);
  console.log(
    `[tetragon-bridge] Monitored namespaces: ${MONITORED_NAMESPACES.join(", ")}`
  );

  await producer.connect();

  if (fs.existsSync(LOG_PATH) && !READ_FROM_START) {
    filePosition = fs.statSync(LOG_PATH).size;
    console.log("[tetragon-bridge] Starting from end of current log file");
  }

  setInterval(() => {
    readNewLines().catch((error) => {
      console.error("[tetragon-bridge] Read loop error:", error);
    });
  }, 2000);
}

async function shutdown() {
  console.log("[tetragon-bridge] Shutting down...");
  await producer.disconnect();
  process.exit(0);
}

if (require.main === module) {
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  start().catch(async (error) => {
    console.error("[tetragon-bridge] Fatal startup error:", error);
    try {
      await producer.disconnect();
    } catch (_) {}
    process.exit(1);
  });
}

module.exports = {
  classifyTetragonProcessExec,
  getPodFromProcess,
  getProcessFromTetragonEvent,
  isSuspiciousProcess,
};
const fs = require("fs");
const path = require("path");

const {
  classifyTetragonProcessExec,
  isSuspiciousProcess,
} = require("../streaming/tetragonBridge");

function readFixture(filename) {
  const fixturePath = path.join(
    __dirname,
    "..",
    "fixtures",
    "tetragon",
    filename
  );

  return JSON.parse(fs.readFileSync(fixturePath, "utf8"));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function run() {
  console.log("[tetragon-bridge-test] Starting local classification tests...");

  assert(
    isSuspiciousProcess("/bin/sh", "whoami") === true,
    "Expected /bin/sh whoami to be suspicious."
  );

  assert(
    isSuspiciousProcess("/usr/bin/sleep", "30") === false,
    "Expected /usr/bin/sleep 30 to be non-suspicious."
  );

  const suspiciousEvent = readFixture("suspicious-process-exec.json");
  const suspiciousTelemetry = classifyTetragonProcessExec(suspiciousEvent);

  assert(
    suspiciousTelemetry,
    "Expected suspicious fixture to produce telemetry."
  );

  assert(
    suspiciousTelemetry.issueType === "unauthorizedPodExec",
    "Expected issueType to be unauthorizedPodExec."
  );

  assert(
    suspiciousTelemetry.resourceName === "default/aura-ebpf-test",
    "Expected resourceName to be default/aura-ebpf-test."
  );

  assert(
    suspiciousTelemetry.binary === "/bin/sh",
    "Expected binary to be /bin/sh."
  );

  const normalEvent = readFixture("non-suspicious-process-exec.json");
  const normalTelemetry = classifyTetragonProcessExec(normalEvent);

  assert(
    normalTelemetry === null,
    "Expected non-suspicious fixture to be ignored."
  );

  const ignoredNamespaceEvent = readFixture(
    "ignored-namespace-process-exec.json"
  );
  const ignoredNamespaceTelemetry =
    classifyTetragonProcessExec(ignoredNamespaceEvent);

  assert(
    ignoredNamespaceTelemetry === null,
    "Expected kube-system namespace fixture to be ignored."
  );

  console.log("[tetragon-bridge-test] All local classification tests passed.");
}

try {
  run();
} catch (error) {
  console.error("[tetragon-bridge-test] Failed:", error.message);
  process.exit(1);
}
{
  "name": "backend",
  "version": "1.0.0",
  "description": "Aura V2 backend and streaming prototype",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "stream:producer": "node streaming/producer.js",
    "stream:telemetry": "node streaming/telemetryProducer.js ssh",
    "stream:telemetry:ssh": "node streaming/telemetryProducer.js ssh",
    "stream:telemetry:pqc": "node streaming/telemetryProducer.js pqc",
    "stream:telemetry-normalizer": "node streaming/telemetryNormalizer.js",
    "stream:bad-command": "node streaming/badCommandProducer.js",
    "stream:apply-test": "node streaming/applyCommandProducer.js",
    "stream:approve": "node streaming/approvalDecisionProducer.js approve",
    "stream:reject": "node streaming/approvalDecisionProducer.js reject",
    "stream:orchestrator": "node streaming/orchestrator.js",
    "stream:worker": "node streaming/worker.js",
    "stream:audit": "node streaming/auditConsumer.js",
    "stream:results": "node streaming/resultConsumer.js",
    "stream:dlq": "node streaming/dlqConsumer.js",
    "stream:approval": "node streaming/approvalConsumer.js",
    "stream:approval-decisions": "node streaming/approvalDecisionConsumer.js",
    "stream:demo": "concurrently \"npm run stream:audit\" \"npm run stream:results\" \"npm run stream:approval\" \"npm run stream:approval-decisions\" \"npm run stream:telemetry-normalizer\" \"npm run stream:worker\" \"npm run stream:orchestrator\"",
    "stream:full": "concurrently \"npm run stream:audit\" \"npm run stream:results\" \"npm run stream:dlq\" \"npm run stream:approval\" \"npm run stream:approval-decisions\" \"npm run stream:telemetry-normalizer\" \"npm run stream:worker\" \"npm run stream:orchestrator\"",
    "rag:ingest:source": "node scripts/ingestSourceCodeForRag.js",
    "rag:test:qdrant": "node scripts/testQdrantConnection.js",
    "rag:ingest": "node scripts/ingestRagDocuments.js",
    "rag:search": "node scripts/searchRagDocuments.js",
    "rag:ingest:all": "npm run rag:ingest && npm run rag:ingest:source",
    "test:tetragon:bridge": "node scripts/testTetragonBridgeClassification.js",
"test:tetragon:replay": "node scripts/replayTetragonBridgeLog.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "type": "commonjs",
  "dependencies": {
    "@azure/identity": "^4.13.1",
    "@azure/keyvault-secrets": "^4.11.1",
    "@qdrant/js-client-rest": "^1.18.0",
    "cors": "^2.8.6",
    "dotenv": "^17.4.2",
    "express": "^5.2.1",
    "kafkajs": "^2.2.4",
    "mongoose": "^9.4.1",
    "octokit": "^5.0.5",
    "openai": "^6.34.0"
  },
  "devDependencies": {
    "concurrently": "^9.0.1",
    "nodemon": "^3.1.14"
  },
  "engines": {
    "node": ">=22 <24",
    "npm": ">=10"
  }
}
(base) wilsongaldamez@Wilsons-MacBook-Pro Aura-V2-Streaming-Spike % cd ~/Desktop/Aura-V2-Streaming-Spike

cat > backend/fixtures/tetragon/sample-tetragon.log <<'EOF'
{"time":"2026-05-17T16:00:00Z","node_name":"aks-nodepool1-12345678-vmss000001","process_exec":{"process":{"binary":"/bin/sh","arguments":"whoami","pod":{"namespace":"default","name":"aura-ebpf-test","container":{"name":"test-container","image":{"name":"busybox:latest"}}}}}}
{"time":"2026-05-17T16:01:00Z","node_name":"aks-nodepool1-12345678-vmss000001","process_exec":{"process":{"binary":"/usr/bin/sleep","arguments":"30","pod":{"namespace":"default","name":"normal-pod","container":{"name":"normal-container","image":{"name":"busybox:latest"}}}}}}
{"time":"2026-05-17T16:02:00Z","node_name":"aks-nodepool1-12345678-vmss000001","process_exec":{"process":{"binary":"/bin/bash","arguments":"id","pod":{"namespace":"kube-system","name":"ignored-pod","container":{"name":"ignored-container","image":{"name":"busybox:latest"}}}}}}
{"time":"2026-05-17T16:03:00Z","node_name":"aks-nodepool1-12345678-vmss000001","process_exec":{"process":{"binary":"/usr/bin/curl","arguments":"http://example.com","pod":{"namespace":"default","name":"curl-test","container":{"name":"curl-container","image":{"name":"curlimages/curl:latest"}}}}}}
EOF
(base) wilsongaldamez@Wilsons-MacBook-Pro Aura-V2-Streaming-Spike % >....                                                                                                      
    }
  }

  console.log("[tetragon-replay] Summary:");
  console.log(`  totalLines=${lines.length}`);
  console.log(`  wouldPublish=${telemetryEvents.length}`);
  console.log(`  ignored=${ignoredEvents.length}`);
  console.log(`  parseErrors=${parseErrors.length}`);

  return {
    totalLines: lines.length,
    telemetryEvents,
    ignoredEvents,
    parseErrors,
  };
}

try {
  const result = replayLogFile(fixturePath);

  assert(result.totalLines === 4, "Expected 4 log lines.");
  assert(result.telemetryEvents.length === 2, "Expected 2 publishable telemetry events.");
  assert(result.ignoredEvents.length === 2, "Expected 2 ignored events.");
  assert(result.parseErrors.length === 0, "Expected 0 parse errors.");

  const resources = result.telemetryEvents.map((entry) => entry.telemetry.resourceName);

  assert(
    resources.includes("default/aura-ebpf-test"),
    "Expected default/aura-ebpf-test to be publishable."
  );

  assert(
    resources.includes("default/curl-test"),
    "Expected default/curl-test to be publishable."
  );

  console.log("[tetragon-replay] Local replay test passed.");
} catch (error) {
  console.error("[tetragon-replay] Failed:", error.message);
  process.exit(1);
}
EOF
(base) wilsongaldamez@Wilsons-MacBook-Pro Aura-V2-Streaming-Spike % node - <<'NODE'
const fs = require("fs");

const path = "backend/package.json";
const pkg = JSON.parse(fs.readFileSync(path, "utf8"));

pkg.scripts = pkg.scripts || {};
pkg.scripts["test:tetragon:replay"] = "node scripts/replayTetragonBridgeLog.js";

fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + "\n");
NODE
(base) wilsongaldamez@Wilsons-MacBook-Pro Aura-V2-Streaming-Spike % cd ~/Desktop/Aura-V2-Streaming-Spike

git status
git diff --stat

git add backend/fixtures/tetragon/sample-tetragon.log \
        backend/scripts/replayTetragonBridgeLog.js \
        backend/package.json

git commit -m "Add local Tetragon bridge log replay test"

git push -u origin feature/tetragon-bridge-log-replay

git status
On branch feature/tetragon-bridge-log-replay
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   backend/package.json

Untracked files:
  (use "git add <file>..." to include in what will be committed)
        backend/scripts/replayTetragonBridgeLog.js

no changes added to commit (use "git add" and/or "git commit -a")
 backend/package.json | 3 ++-
 1 file changed, 2 insertions(+), 1 deletion(-)
The following paths are ignored by one of your .gitignore files:
backend/fixtures/tetragon/sample-tetragon.log
hint: Use -f if you really want to add them.
hint: Disable this message with "git config advice.addIgnoredFile false"
[feature/tetragon-bridge-log-replay 478b297] Add local Tetragon bridge log replay test
 2 files changed, 100 insertions(+), 1 deletion(-)
 create mode 100644 backend/scripts/replayTetragonBridgeLog.js
Enumerating objects: 10, done.
Counting objects: 100% (10/10), done.
Delta compression using up to 14 threads
Compressing objects: 100% (6/6), done.
Writing objects: 100% (6/6), 1.51 KiB | 1.51 MiB/s, done.
Total 6 (delta 4), reused 0 (delta 0), pack-reused 0 (from 0)
remote: Resolving deltas: 100% (4/4), completed with 4 local objects.
remote: 
remote: Create a pull request for 'feature/tetragon-bridge-log-replay' on GitHub by visiting:
remote:      https://github.com/Willie-Byte/aura-v2-cloud-remediation-engine/pull/new/feature/tetragon-bridge-log-replay
remote: 
To https://github.com/Willie-Byte/aura-v2-cloud-remediation-engine.git
 * [new branch]      feature/tetragon-bridge-log-replay -> feature/tetragon-bridge-log-replay
branch 'feature/tetragon-bridge-log-replay' set up to track 'origin/feature/tetragon-bridge-log-replay'.
On branch feature/tetragon-bridge-log-replay
Your branch is up to date with 'origin/feature/tetragon-bridge-log-replay'.

nothing to commit, working tree clean
(base) wilsongaldamez@Wilsons-MacBook-Pro Aura-V2-Streaming-Spike % cd ~/Desktop/Aura-V2-Streaming-Spike

git status
ls backend/fixtures/tetragon/sample-tetragon.log
git ls-files backend/fixtures/tetragon/sample-tetragon.log
On branch feature/tetragon-bridge-log-replay
Your branch is up to date with 'origin/feature/tetragon-bridge-log-replay'.

nothing to commit, working tree clean
backend/fixtures/tetragon/sample-tetragon.log
(base) wilsongaldamez@Wilsons-MacBook-Pro Aura-V2-Streaming-Spike % git add backend/fixtures/tetragon/sample-tetragon.log
git commit -m "Add Tetragon replay fixture log"
git push
The following paths are ignored by one of your .gitignore files:
backend/fixtures/tetragon/sample-tetragon.log
hint: Use -f if you really want to add them.
hint: Disable this message with "git config advice.addIgnoredFile false"
On branch feature/tetragon-bridge-log-replay
Your branch is up to date with 'origin/feature/tetragon-bridge-log-replay'.

nothing to commit, working tree clean
Everything up-to-date
(base) wilsongaldamez@Wilsons-MacBook-Pro Aura-V2-Streaming-Spike % cd ~/Desktop/Aura-V2-Streaming-Spike

mv backend/fixtures/tetragon/sample-tetragon.log backend/fixtures/tetragon/sample-tetragon.jsonl

python3 - <<'PY'
from pathlib import Path

path = Path("backend/scripts/replayTetragonBridgeLog.js")
text = path.read_text()
text = text.replace("sample-tetragon.log", "sample-tetragon.jsonl")
path.write_text(text)
PY
(base) wilsongaldamez@Wilsons-MacBook-Pro Aura-V2-Streaming-Spike % cd backend
npm run test:tetragon:bridge
npm run test:tetragon:replay

> backend@1.0.0 test:tetragon:bridge
> node scripts/testTetragonBridgeClassification.js

◇ injected env (23) from streaming/.env // tip: ⌘ suppress logs { quiet: true }
◇ injected env (0) from streaming/.env // tip: ◈ encrypted .env [www.dotenvx.com]
[tetragon-bridge-test] Starting local classification tests...
[tetragon-bridge-test] All local classification tests passed.

> backend@1.0.0 test:tetragon:replay
> node scripts/replayTetragonBridgeLog.js

◇ injected env (23) from streaming/.env // tip: ⌘ override existing { override: true }
◇ injected env (0) from streaming/.env // tip: ⌘ custom filepath { path: '/custom/path/.env' }
[tetragon-replay] Starting local Tetragon log replay...
[tetragon-replay] Fixture: /Users/wilsongaldamez/Desktop/Aura-V2-Streaming-Spike/backend/fixtures/tetragon/sample-tetragon.jsonl
[tetragon-replay] WOULD_PUBLISH line=1 issueType=unauthorizedPodExec resource=default/aura-ebpf-test binary=/bin/sh args=whoami
[tetragon-replay] IGNORED line=2
[tetragon-replay] IGNORED line=3
[tetragon-replay] WOULD_PUBLISH line=4 issueType=unauthorizedPodExec resource=default/curl-test binary=/usr/bin/curl args=http://example.com
[tetragon-replay] Summary:
  totalLines=4
  wouldPublish=2
  ignored=2
  parseErrors=0
[tetragon-replay] Local replay test passed.
(base) wilsongaldamez@Wilsons-MacBook-Pro backend % 