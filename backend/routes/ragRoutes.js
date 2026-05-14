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

function buildQdrantFilter({ documentType, projectArea, tag }) {
  const must = [];

  if (documentType && documentType !== "all") {
    must.push({
      key: "documentType",
      match: {
        value: documentType,
      },
    });
  }

  if (projectArea && projectArea !== "all") {
    must.push({
      key: "projectArea",
      match: {
        value: projectArea,
      },
    });
  }

  if (tag && tag !== "all") {
    must.push({
      key: "tags",
      match: {
        value: tag,
      },
    });
  }

  if (must.length === 0) {
    return undefined;
  }

  return { must };
}

async function searchRagChunks(query, limit = 5, filters = {}) {
  const queryVector = await createEmbedding(query.trim());
  const qdrantFilter = buildQdrantFilter(filters);

  const searchPayload = {
    vector: queryVector,
    limit: normalizeLimit(limit),
    with_payload: true,
  };

  if (qdrantFilter) {
    searchPayload.filter = qdrantFilter;
  }

  const results = await qdrantClient.search(RAG_COLLECTION_NAME, searchPayload);

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

function extractFilters(body) {
  return {
    documentType: body.documentType || "all",
    projectArea: body.projectArea || "all",
    tag: body.tag || "all",
  };
}

function buildSourceSummary(results) {
  const documentTypeCounts = {};
  const projectAreaCounts = {};
  const tagCounts = {};

  for (const result of results || []) {
    const documentType = result.documentType || "unknown";
    const projectArea = result.projectArea || "unknown";

    documentTypeCounts[documentType] = (documentTypeCounts[documentType] || 0) + 1;
    projectAreaCounts[projectArea] = (projectAreaCounts[projectArea] || 0) + 1;

    for (const tag of normalizeTags(result.tags)) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }

  const documentTypes = Object.keys(documentTypeCounts);
  let mode = "no-sources";
  let label = "No sources found";

  if (documentTypes.length === 1) {
    const onlyType = documentTypes[0];

    if (onlyType === "source-code") {
      mode = "source-code-only";
      label = "Answered from source-code chunks";
    } else {
      mode = `${onlyType}-only`;
      label = `Answered from ${onlyType} documents`;
    }
  } else if (documentTypes.length > 1) {
    const hasSourceCode = documentTypes.includes("source-code");

    mode = hasSourceCode ? "mixed-with-source-code" : "mixed-documentation";
    label = hasSourceCode
      ? "Answered from mixed documentation and source-code chunks"
      : "Answered from mixed documentation sources";
  }

  return {
    mode,
    label,
    totalSources: results?.length || 0,
    documentTypes,
    documentTypeCounts,
    projectAreaCounts,
    tagCounts,
  };
}

router.post("/query", async (req, res) => {
  try {
    const { query, limit } = req.body;
    const filters = extractFilters(req.body);

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "A non-empty query string is required.",
      });
    }

    const results = await searchRagChunks(query, limit, filters);
    const sourceSummary = buildSourceSummary(results);

    return res.json({
      success: true,
      collection: RAG_COLLECTION_NAME,
      embeddingModel: EMBEDDING_MODEL,
      query: query.trim(),
      filters,
      count: results.length,
      sourceSummary,
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
    const filters = extractFilters(req.body);

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

    const results = await searchRagChunks(query, limit, filters);
    const sourceSummary = buildSourceSummary(results);
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
            "Applied filters:",
            JSON.stringify(filters, null, 2),
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
      filters,
      sourceSummary,
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
      supportedFilters: {
        documentTypes: [
          "all",
          "general",
          "architecture",
          "streaming",
          "policy",
          "telemetry",
          "game-dev",
          "source-code",
        ],
        projectAreas: [
          "all",
          "aura",
          "aura-rag",
          "aura-streaming",
          "aura-remediation",
          "aura-telemetry",
          "planetary-extraction-noir",
        ],
        tags: [
          "all",
          "aura",
          "rag",
          "qdrant",
          "embeddings",
          "local-rag",
          "architecture",
          "streaming",
          "kafka",
          "event-driven",
          "policy",
          "remediation",
          "validation",
          "tetragon",
          "ebpf",
          "aks",
          "telemetry",
          "game-dev",
          "godot",
          "extraction-shooter",
          "source-code",
          "backend",
          "frontend",
          "react",
          "express",
          "routes",
          "services",
          "scripts",
          "developer-tools",
          "worker",
        ],
      },
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