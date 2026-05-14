const { QdrantClient } = require("@qdrant/js-client-rest");

const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";
const RAG_COLLECTION_NAME = process.env.RAG_COLLECTION_NAME || "aura_rag_documents";
const VECTOR_SIZE = 1536;

const qdrantClient = new QdrantClient({
  url: QDRANT_URL,
});

async function ensureRagCollection() {
  const collections = await qdrantClient.getCollections();
  const exists = collections.collections.some(
    (collection) => collection.name === RAG_COLLECTION_NAME
  );

  if (!exists) {
    await qdrantClient.createCollection(RAG_COLLECTION_NAME, {
      vectors: {
        size: VECTOR_SIZE,
        distance: "Cosine",
      },
    });

    console.log(`Created Qdrant collection: ${RAG_COLLECTION_NAME}`);
  } else {
    console.log(`Qdrant collection already exists: ${RAG_COLLECTION_NAME}`);
  }

  return RAG_COLLECTION_NAME;
}

async function upsertChunks(points) {
  if (!points || points.length === 0) {
    console.log("No points to upsert.");
    return;
  }

  await qdrantClient.upsert(RAG_COLLECTION_NAME, {
    wait: true,
    points,
  });

  console.log(`Upserted ${points.length} chunks into ${RAG_COLLECTION_NAME}`);
}

module.exports = {
  qdrantClient,
  ensureRagCollection,
  upsertChunks,
  RAG_COLLECTION_NAME,
};