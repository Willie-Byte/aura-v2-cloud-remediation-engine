require("dotenv").config();

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const { ensureRagCollection, upsertChunks } = require("../services/qdrantService");
const { chunkText } = require("../services/ragChunkerService");
const { createEmbedding, EMBEDDING_MODEL } = require("../services/embeddingService");

const PROJECT_ROOT = path.join(__dirname, "..", "..");

const ALLOWED_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".json",
  ".md",
  ".css",
  ".html",
  ".yaml",
  ".yml",
  ".sh",
]);

const SKIPPED_DIRECTORIES = new Set([
  ".git",
  "node_modules",
  "build",
  "dist",
  "coverage",
  ".next",
  ".turbo",
  ".cache",
  "logs",
]);

const SKIPPED_FILES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  ".env",
  ".env.local",
  ".env.production",
  ".env.development",
]);

const INCLUDED_PATH_PREFIXES = [
  "backend/routes",
  "backend/services",
  "backend/streaming",
  "backend/scripts",
  "backend/server.js",
  "client/src",
  "AURA_V2_DEMO_CHECKLIST.md",
  "README.md",
];

function normalizeRelativePath(filePath) {
  return path.relative(PROJECT_ROOT, filePath).replace(/\\/g, "/");
}

function shouldSkipDirectory(directoryName) {
  return SKIPPED_DIRECTORIES.has(directoryName);
}

function isAllowedExtension(filePath) {
  return ALLOWED_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function isSkippedFile(filePath) {
  const fileName = path.basename(filePath);
  return SKIPPED_FILES.has(fileName);
}

function isIncludedPath(filePath) {
  const relativePath = normalizeRelativePath(filePath);

  return INCLUDED_PATH_PREFIXES.some((prefix) => {
    return relativePath === prefix || relativePath.startsWith(`${prefix}/`);
  });
}

function getSourceCodeFiles(directory) {
  const results = [];

  if (!fs.existsSync(directory)) {
    return results;
  }

  const entries = fs.readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (shouldSkipDirectory(entry.name)) {
        continue;
      }

      results.push(...getSourceCodeFiles(fullPath));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (!isIncludedPath(fullPath)) {
      continue;
    }

    if (isSkippedFile(fullPath)) {
      continue;
    }

    if (!isAllowedExtension(fullPath)) {
      continue;
    }

    results.push(fullPath);
  }

  return results.sort();
}

function createPointId(sourceFile, chunkIndex) {
  const hash = crypto
    .createHash("sha256")
    .update(`source-code:${sourceFile}:${chunkIndex}`)
    .digest("hex");

  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    hash.slice(12, 16),
    hash.slice(16, 20),
    hash.slice(20, 32),
  ].join("-");
}

function inferSourceMetadata(relativePath) {
  const normalizedPath = relativePath.toLowerCase();

  const metadata = {
    documentType: "source-code",
    projectArea: "aura",
    tags: ["aura", "source-code"],
  };

  if (normalizedPath.includes("rag")) {
    metadata.projectArea = "aura-rag";
    metadata.tags.push("rag", "qdrant", "embeddings");
  }

  if (normalizedPath.includes("kafka") || normalizedPath.includes("streaming")) {
    metadata.projectArea = "aura-streaming";
    metadata.tags.push("streaming", "kafka", "event-driven");
  }

  if (
    normalizedPath.includes("policy") ||
    normalizedPath.includes("remediation") ||
    normalizedPath.includes("validator") ||
    normalizedPath.includes("worker")
  ) {
    metadata.projectArea = "aura-remediation";
    metadata.tags.push("policy", "remediation", "validation", "worker");
  }

  if (
    normalizedPath.includes("tetragon") ||
    normalizedPath.includes("ebpf") ||
    normalizedPath.includes("telemetry") ||
    normalizedPath.includes("aks")
  ) {
    metadata.projectArea = "aura-telemetry";
    metadata.tags.push("telemetry", "tetragon", "ebpf", "aks");
  }

  if (normalizedPath.startsWith("client/src")) {
    metadata.tags.push("frontend", "react");
  }

  if (normalizedPath.startsWith("backend/routes")) {
    metadata.tags.push("backend", "express", "routes");
  }

  if (normalizedPath.startsWith("backend/services")) {
    metadata.tags.push("backend", "services");
  }

  if (normalizedPath.startsWith("backend/scripts")) {
    metadata.tags.push("scripts", "developer-tools");
  }

  return {
    ...metadata,
    tags: [...new Set(metadata.tags)],
  };
}

function createSourceHeader(relativePath) {
  return [
    `Source file: ${relativePath}`,
    `Purpose: This chunk comes from Aura V2 source code and can be used to answer implementation questions.`,
    "",
  ].join("\n");
}

async function main() {
  console.log("Starting Aura source-code RAG ingestion...");
  console.log("Project root:", PROJECT_ROOT);
  console.log("Embedding model:", EMBEDDING_MODEL);

  await ensureRagCollection();

  const files = getSourceCodeFiles(PROJECT_ROOT);

  if (files.length === 0) {
    console.log("No supported source files found.");
    return;
  }

  console.log(`Found ${files.length} source files to ingest.`);

  const allPoints = [];

  for (const filePath of files) {
    const relativePath = normalizeRelativePath(filePath);
    const fileExtension = path.extname(filePath).toLowerCase();
    const rawText = fs.readFileSync(filePath, "utf8");

    if (!rawText.trim()) {
      continue;
    }

    const text = `${createSourceHeader(relativePath)}${rawText}`;
    const chunks = chunkText(text, {
      chunkSize: 1600,
      overlap: 250,
    });

    const metadata = inferSourceMetadata(relativePath);

    console.log(
      `Processing ${relativePath}: ${chunks.length} chunks | area=${metadata.projectArea}`
    );

    for (let index = 0; index < chunks.length; index += 1) {
      const chunk = chunks[index];
      const embedding = await createEmbedding(chunk);

      allPoints.push({
        id: createPointId(relativePath, index),
        vector: embedding,
        payload: {
          sourceFile: relativePath,
          fileExtension,
          documentType: metadata.documentType,
          projectArea: metadata.projectArea,
          tags: metadata.tags,
          chunkIndex: index,
          totalChunks: chunks.length,
          text: chunk,
          characterLength: chunk.length,
          ingestedAt: new Date().toISOString(),
          ingestionType: "source-code",
        },
      });
    }
  }

  await upsertChunks(allPoints);

  console.log("Aura source-code RAG ingestion complete.");
  console.log(`Total source-code chunks ingested: ${allPoints.length}`);
}

main().catch((error) => {
  console.error("Source-code RAG ingestion failed.");
  console.error(error);
  process.exit(1);
});
