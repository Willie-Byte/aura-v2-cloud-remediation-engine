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
    const text = fs.readFileSync(filePath, "utf8");
    const chunks = chunkText(text);

    console.log(`Processing ${sourceFile}: ${chunks.length} chunks`);

    for (let index = 0; index < chunks.length; index += 1) {
      const chunk = chunks[index];
      const embedding = await createEmbedding(chunk);

      allPoints.push({
        id: createPointId(sourceFile, index),
        vector: embedding,
        payload: {
          sourceFile,
          chunkIndex: index,
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