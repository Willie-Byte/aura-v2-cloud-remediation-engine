const express = require("express");
const OpenAI = require("openai");

const { qdrantClient, RAG_COLLECTION_NAME } = require("../services/qdrantService");
const { createEmbedding, EMBEDDING_MODEL } = require("../services/embeddingService");

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CHAT_MODEL = process.env.RAG_CHAT_MODEL || "gpt-4o-mini";

function normalizeLimit(limit) {
  return Number.isInteger(limit) && limit > 0 && limit <= 20 ? limit : 5;
}

function normalizeTags(tags) {
  return Array.isArray(tags) ? tags : [];
}

async function searchRagChunks(query, limit = 5) {
  const queryVector = await createEmbedding(query.trim());

  const results = await qdrantClient.search(RAG_COLLECTION_NAME, {
    vector: queryVector,
    limit: normalizeLimit(limit),
    with_payload: true,
  });

  return results.map((result) => ({
    id: result.id,
    score: result.score,
    sourceFile: result.payload?.sourceFile,
    fileExtension: result.payload?.fileExtension,
    documentType: result.payload?.documentType || "unknown",
    projectArea: result.payload?.projectArea || "unknown",
    tags: normalizeTags(result.payload?.tags),
    chunkIndex: result.payload?.chunkIndex,
    totalChunks: result.payload?.totalChunks,
    text: result.payload?.text,
    characterLength: result.payload?.characterLength,
    ingestedAt: result.payload?.ingestedAt,
  }));
}

function buildContext(results) {
  if (!results || results.length === 0) {
    return "No retrieved context was found.";
  }

  return results
    .map((result, index) => {
      return [
        `Source ${index + 1}`,
        `File: ${result.sourceFile || "unknown"}`,
        `Document Type: ${result.documentType || "unknown"}`,
        `Project Area: ${result.projectArea || "unknown"}`,
        `Tags: ${result.tags?.length ? result.tags.join(", ") : "none"}`,
        `Chunk: ${result.chunkIndex ?? "unknown"} of ${result.totalChunks ?? "unknown"}`,
        `Score: ${result.score}`,
        "Content:",
        result.text || "",
      ].join("\n");
    })
    .join("\n\n---\n\n");
}

router.post("/query", async (req, res) => {
  try {
    const { query, limit } = req.body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "A non-empty query string is required.",
      });
    }

    const results = await searchRagChunks(query, limit);

    return res.json({
      success: true,
      collection: RAG_COLLECTION_NAME,
      embeddingModel: EMBEDDING_MODEL,
      query: query.trim(),
      count: results.length,
      results,
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

router.post("/answer", async (req, res) => {
  try {
    const { query, limit } = req.body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "A non-empty query string is required.",
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "OPENAI_API_KEY is missing from the backend environment.",
      });
    }

    const results = await searchRagChunks(query, limit);
    const context = buildContext(results);

    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content:
            "You are Aura's local RAG assistant. Answer only using the retrieved context. If the context is not enough, say what is missing. Keep the answer concise, technical, and safe. When the user asks whether this branch should connect to AKS, Kafka, live Tetragon, or eBPF systems, default to a conservative interpretation: it should stay local unless the retrieved context explicitly says it is ready to connect. Do not imply future integration is approved. Do not claim that live AKS, Kafka, Tetragon, or eBPF changes were made unless the retrieved context explicitly says so.",
        },
        {
          role: "user",
          content: [
            "Question:",
            query.trim(),
            "",
            "Retrieved context:",
            context,
          ].join("\n"),
        },
      ],
    });

    const answer = completion.choices?.[0]?.message?.content || "";

    return res.json({
      success: true,
      collection: RAG_COLLECTION_NAME,
      embeddingModel: EMBEDDING_MODEL,
      chatModel: CHAT_MODEL,
      query: query.trim(),
      answer,
      sources: results.map((result) => ({
        id: result.id,
        score: result.score,
        sourceFile: result.sourceFile,
        fileExtension: result.fileExtension,
        documentType: result.documentType,
        projectArea: result.projectArea,
        tags: result.tags,
        chunkIndex: result.chunkIndex,
        totalChunks: result.totalChunks,
      })),
      results,
    });
  } catch (error) {
    console.error("RAG answer failed:", error);

    return res.status(500).json({
      success: false,
      message: "RAG answer failed.",
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
      chatModel: CHAT_MODEL,
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