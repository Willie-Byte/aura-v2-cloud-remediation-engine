require("dotenv").config();

const { qdrantClient, RAG_COLLECTION_NAME } = require("../services/qdrantService");
const { createEmbedding, EMBEDDING_MODEL } = require("../services/embeddingService");

const DEFAULT_QUERY =
  "What is the purpose of the vector RAG branch in Aura V2?";

async function main() {
  const query = process.argv.slice(2).join(" ") || DEFAULT_QUERY;

  console.log("Starting Aura RAG search...");
  console.log("Collection:", RAG_COLLECTION_NAME);
  console.log("Embedding model:", EMBEDDING_MODEL);
  console.log("Query:", query);

  const queryVector = await createEmbedding(query);

  const results = await qdrantClient.search(RAG_COLLECTION_NAME, {
    vector: queryVector,
    limit: 5,
    with_payload: true,
  });

  if (!results || results.length === 0) {
    console.log("No matching chunks found.");
    return;
  }

  console.log(`Found ${results.length} matching chunk(s):`);

  results.forEach((result, index) => {
    console.log("\n----------------------------------------");
    console.log(`Result #${index + 1}`);
    console.log("Score:", result.score);
    console.log("Source file:", result.payload?.sourceFile);
    console.log("Chunk index:", result.payload?.chunkIndex);
    console.log("Text:");
    console.log(result.payload?.text);
  });

  console.log("\nAura RAG search complete.");
}

main().catch((error) => {
  console.error("RAG search failed.");
  console.error(error);
  process.exit(1);
});