require("dotenv").config();

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const { ensureRagCollection, upsertChunks } = require("../services/qdrantService");
const { chunkText } = require("../services/ragChunkerService");
const { createEmbedding, EMBEDDING_MODEL } = require("../services/embeddingService");

const RAG_DOCS_DIR = path.join(__dirname, "..", "rag-documents");

const ALLOWED_EXTENSIONS = new Set([
  ".txt",
  ".md",
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".json",
  ".yaml",
  ".yml",
  ".gd",
  ".py",
  ".sh",
]);

function getSupportedFiles(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
    return [];
  }

  return fs
    .readdirSync(directory)
    .filter((fileName) => ALLOWED_EXTENSIONS.has(path.extname(fileName).toLowerCase()))
    .map((fileName) => path.join(directory, fileName));
}

function createPointId(sourceFile, chunkIndex) {
  const hash = crypto
    .createHash("sha256")
    .update(`${sourceFile}:${chunkIndex}`)
    .digest("hex");

  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    hash.slice(12, 16),
    hash.slice(16, 20),
    hash.slice(20, 32),
  ].join("-");
}

function inferDocumentMetadata(sourceFile) {
  const normalizedFileName = sourceFile.toLowerCase();

  const metadata = {
    documentType: "general",
    projectArea: "aura",
    tags: ["aura"],
  };

  if (normalizedFileName.includes("rag")) {
    metadata.documentType = "architecture";
    metadata.projectArea = "aura-rag";
    metadata.tags.push("rag", "qdrant", "embeddings", "local-rag");
  }

  if (normalizedFileName.includes("architecture")) {
    metadata.documentType = "architecture";
    metadata.tags.push("architecture");
  }

  if (
    normalizedFileName.includes("stream") ||
    normalizedFileName.includes("kafka") ||
    normalizedFileName.includes("event")
  ) {
    metadata.documentType = "streaming";
    metadata.projectArea = "aura-streaming";
    metadata.tags.push("streaming", "kafka", "event-driven");
  }

  if (
    normalizedFileName.includes("policy") ||
    normalizedFileName.includes("remediation")
  ) {
    metadata.documentType = "policy";
    metadata.projectArea = "aura-remediation";
    metadata.tags.push("policy", "remediation", "validation");
  }

  if (
    normalizedFileName.includes("tetragon") ||
    normalizedFileName.includes("ebpf") ||
    normalizedFileName.includes("aks")
  ) {
    metadata.documentType = "telemetry";
    metadata.projectArea = "aura-telemetry";
    metadata.tags.push("tetragon", "ebpf", "aks", "telemetry");
  }

  if (
    normalizedFileName.includes("game") ||
    normalizedFileName.includes("godot") ||
    normalizedFileName.includes("planetary") ||
    normalizedFileName.endsWith(".gd")
  ) {
    metadata.documentType = "game-dev";
    metadata.projectArea = "planetary-extraction-noir";
    metadata.tags.push("game-dev", "godot", "extraction-shooter");
  }

  return {
    ...metadata,
    tags: [...new Set(metadata.tags)],
  };
}

async function main() {
  console.log("Starting Aura RAG ingestion...");
  console.log("Documents folder:", RAG_DOCS_DIR);
  console.log("Embedding model:", EMBEDDING_MODEL);

  await ensureRagCollection();

  const files = getSupportedFiles(RAG_DOCS_DIR);

  if (files.length === 0) {
    console.log("No supported documents found.");
    console.log("Add files to backend/rag-documents/ and run npm run rag:ingest again.");
    return;
  }

  const allPoints = [];

  for (const filePath of files) {
    const sourceFile = path.basename(filePath);
    const fileExtension = path.extname(sourceFile).toLowerCase();
    const text = fs.readFileSync(filePath, "utf8");
    const chunks = chunkText(text);
    const documentMetadata = inferDocumentMetadata(sourceFile);

    console.log(
      `Processing ${sourceFile}: ${chunks.length} chunks | type=${documentMetadata.documentType} | area=${documentMetadata.projectArea}`
    );

    for (let index = 0; index < chunks.length; index += 1) {
      const chunk = chunks[index];
      const embedding = await createEmbedding(chunk);

      allPoints.push({
        id: createPointId(sourceFile, index),
        vector: embedding,
        payload: {
          sourceFile,
          fileExtension,
          documentType: documentMetadata.documentType,
          projectArea: documentMetadata.projectArea,
          tags: documentMetadata.tags,
          chunkIndex: index,
          totalChunks: chunks.length,
          text: chunk,
          characterLength: chunk.length,
          ingestedAt: new Date().toISOString(),
        },
      });
    }
  }

  await upsertChunks(allPoints);

  console.log("Aura RAG ingestion complete.");
}

main().catch((error) => {
  console.error("RAG ingestion failed.");
  console.error(error);
  process.exit(1);
});