const express = require("express");

const { qdrantClient, RAG_COLLECTION_NAME } = require("../services/qdrantService");
const { createEmbedding, EMBEDDING_MODEL } = require("../services/embeddingService");

const router = express.Router();

router.post("/query", async (req, res) => {
  try {
    const { query, limit } = req.body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "A non-empty query string is required.",
      });
    }

    const searchLimit = Number.isInteger(limit) && limit > 0 && limit <= 20 ? limit : 5;

    const queryVector = await createEmbedding(query.trim());

    const results = await qdrantClient.search(RAG_COLLECTION_NAME, {
      vector: queryVector,
      limit: searchLimit,
      with_payload: true,
    });

    return res.json({
      success: true,
      collection: RAG_COLLECTION_NAME,
      embeddingModel: EMBEDDING_MODEL,
      query: query.trim(),
      count: results.length,
      results: results.map((result) => ({
        id: result.id,
        score: result.score,
        sourceFile: result.payload?.sourceFile,
        chunkIndex: result.payload?.chunkIndex,
        text: result.payload?.text,
        characterLength: result.payload?.characterLength,
        ingestedAt: result.payload?.ingestedAt,
      })),
    });
  } catch (error) {
    console.error("RAG query failed:", error);

    return res.status(500).json({
      success: false,
      message: "RAG query failed.",
      error: error.message,
    });
  }
});

router.get("/health", async (req, res) => {
  try {
    const collections = await qdrantClient.getCollections();

    return res.json({
      success: true,
      service: "Aura RAG",
      qdrantCollection: RAG_COLLECTION_NAME,
      embeddingModel: EMBEDDING_MODEL,
      collections,
    });
  } catch (error) {
    console.error("RAG health check failed:", error);

    return res.status(500).json({
      success: false,
      message: "RAG health check failed.",
      error: error.message,
    });
  }
});

module.exports = router;