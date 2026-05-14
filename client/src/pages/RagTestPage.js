import { useEffect, useMemo, useState } from "react";
import { answerRagQuestion, getRagHealth } from "../services/api";
import "../App.css";

function formatTags(tags) {
  return Array.isArray(tags) && tags.length > 0 ? tags : [];
}

function formatOptionLabel(value) {
  if (!value) return "Unknown";

  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getSourceBadgeClass(documentType) {
  const normalizedType = documentType || "unknown";

  return `rag-source-badge rag-source-badge-${normalizedType}`;
}

function getSourceBadgeLabel(documentType) {
  return formatOptionLabel(documentType || "unknown").toUpperCase();
}

const ragPresets = [
  {
    label: "Kafka Source Search",
    query: "Where is Kafka initialized?",
    documentType: "source-code",
    projectArea: "aura-streaming",
    tag: "kafka",
    limit: 5,
  },
  {
    label: "RAG Routes Search",
    query: "Which file defines the RAG routes?",
    documentType: "source-code",
    projectArea: "aura-rag",
    tag: "routes",
    limit: 5,
  },
  {
    label: "Qdrant Config Search",
    query: "Where is Qdrant configured?",
    documentType: "source-code",
    projectArea: "aura-rag",
    tag: "qdrant",
    limit: 5,
  },
  {
    label: "Worker Validation Search",
    query: "How does the worker validate remediation commands?",
    documentType: "source-code",
    projectArea: "aura-remediation",
    tag: "worker",
    limit: 5,
  },
  {
    label: "Safety Boundary Search",
    query: "What should stay separate from the vector RAG branch?",
    documentType: "architecture",
    projectArea: "aura-rag",
    tag: "rag",
    limit: 5,
  },
  {
    label: "Telemetry/Tetragon Search",
    query: "What does Tetragon do in Aura?",
    documentType: "telemetry",
    projectArea: "aura-telemetry",
    tag: "tetragon",
    limit: 5,
  },
];

function RagTestPage() {
  const [query, setQuery] = useState(
    "What should stay separate from the vector RAG branch?"
  );
  const [limit, setLimit] = useState(5);
  const [documentType, setDocumentType] = useState("all");
  const [projectArea, setProjectArea] = useState("all");
  const [tag, setTag] = useState("all");
  const [activePresetLabel, setActivePresetLabel] = useState("");
  const [answerData, setAnswerData] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [healthLoading, setHealthLoading] = useState(false);
  const [error, setError] = useState("");

  const supportedFilters = health?.supportedFilters || {};

  const documentTypeOptions = useMemo(
    () =>
      supportedFilters.documentTypes || [
        "all",
        "general",
        "architecture",
        "streaming",
        "policy",
        "telemetry",
        "game-dev",
        "source-code",
      ],
    [supportedFilters.documentTypes]
  );

  const projectAreaOptions = useMemo(
    () =>
      supportedFilters.projectAreas || [
        "all",
        "aura",
        "aura-rag",
        "aura-streaming",
        "aura-remediation",
        "aura-telemetry",
        "planetary-extraction-noir",
      ],
    [supportedFilters.projectAreas]
  );

  const tagOptions = useMemo(
    () =>
      supportedFilters.tags || [
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
    [supportedFilters.tags]
  );

  const loadHealth = async () => {
    try {
      setHealthLoading(true);
      setError("");

      const response = await getRagHealth();
      setHealth(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load RAG health status."
      );
    } finally {
      setHealthLoading(false);
    }
  };

  const resetFilters = () => {
    setDocumentType("all");
    setProjectArea("all");
    setTag("all");
    setActivePresetLabel("");
  };

  const applyPreset = (preset) => {
    setQuery(preset.query);
    setDocumentType(preset.documentType);
    setProjectArea(preset.projectArea);
    setTag(preset.tag);
    setLimit(preset.limit);
    setActivePresetLabel(preset.label);
    setAnswerData(null);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!query.trim()) {
      setError("Please enter a question first.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setAnswerData(null);

      const response = await answerRagQuestion({
        query: query.trim(),
        limit: Number(limit),
        documentType,
        projectArea,
        tag,
      });

      setAnswerData(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to get RAG answer."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  return (
    <main className="page-container">
      <section className="page-header">
        <div>
          <p className="eyebrow">Local Vector RAG</p>
          <h1>Aura RAG Test Console</h1>
          <p className="page-description">
            Ask questions against the local Qdrant vector store. This page uses
            the backend endpoint <code>POST /api/rag/answer</code>.
          </p>
        </div>

        <button
          className="secondary-button"
          type="button"
          onClick={loadHealth}
          disabled={healthLoading}
        >
          {healthLoading ? "Checking..." : "Refresh Health"}
        </button>
      </section>

      <section className="dashboard-card">
        <h2>RAG Health</h2>

        {health ? (
          <div className="info-grid">
            <div className="info-tile">
              <span>Service</span>
              <strong>{health.service}</strong>
            </div>

            <div className="info-tile">
              <span>Collection</span>
              <strong>{health.qdrantCollection}</strong>
            </div>

            <div className="info-tile">
              <span>Embedding Model</span>
              <strong>{health.embeddingModel}</strong>
            </div>

            <div className="info-tile">
              <span>Chat Model</span>
              <strong>{health.chatModel}</strong>
            </div>
          </div>
        ) : (
          <p className="muted-text">
            Health status has not loaded yet. Make sure the backend and Qdrant
            are running.
          </p>
        )}
      </section>

      <section className="dashboard-card">
        <h2>Ask Aura RAG</h2>

        <div className="rag-preset-panel">
          <div className="rag-preset-header">
            <div>
              <p className="eyebrow">Demo Presets</p>
              <h3>Quick RAG Searches</h3>
            </div>

            <p className="muted-text">
              Pick a preset to auto-fill the question, source type, project area,
              tag, and result limit.
            </p>
          </div>

          <div className="rag-preset-grid">
            {ragPresets.map((preset) => (
              <button
                className={`rag-preset-button ${
                  activePresetLabel === preset.label ? "rag-preset-button-active" : ""
                }`}
                type="button"
                key={preset.label}
                onClick={() => applyPreset(preset)}
                disabled={loading}
              >
                <span>{preset.label}</span>
                <small>
                  {formatOptionLabel(preset.documentType)} ·{" "}
                  {formatOptionLabel(preset.projectArea)} ·{" "}
                  {formatOptionLabel(preset.tag)}
                </small>
              </button>
            ))}
          </div>
        </div>

        <form className="rag-form" onSubmit={handleSubmit}>
          <label className="form-label" htmlFor="rag-query">
            Question
          </label>

          <textarea
            id="rag-query"
            className="rag-textarea"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            rows={5}
            placeholder="Ask a question about Aura..."
          />

          <div className="rag-filter-grid">
            <div>
              <label className="form-label" htmlFor="rag-document-type">
                Document Type
              </label>
              <select
                id="rag-document-type"
                className="rag-select"
                value={documentType}
                onChange={(event) => setDocumentType(event.target.value)}
              >
                {documentTypeOptions.map((option) => (
                  <option value={option} key={option}>
                    {option === "all" ? "All Document Types" : formatOptionLabel(option)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label" htmlFor="rag-project-area">
                Project Area
              </label>
              <select
                id="rag-project-area"
                className="rag-select"
                value={projectArea}
                onChange={(event) => setProjectArea(event.target.value)}
              >
                {projectAreaOptions.map((option) => (
                  <option value={option} key={option}>
                    {option === "all" ? "All Project Areas" : formatOptionLabel(option)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label" htmlFor="rag-tag">
                Tag
              </label>
              <select
                id="rag-tag"
                className="rag-select"
                value={tag}
                onChange={(event) => setTag(event.target.value)}
              >
                {tagOptions.map((option) => (
                  <option value={option} key={option}>
                    {option === "all" ? "All Tags" : formatOptionLabel(option)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rag-controls">
            <label className="form-label" htmlFor="rag-limit">
              Result Limit
            </label>

            <input
              id="rag-limit"
              className="rag-limit-input"
              type="number"
              min="1"
              max="20"
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
            />

            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? "Asking..." : "Ask RAG"}
            </button>

            <button
              className="secondary-button"
              type="button"
              onClick={resetFilters}
              disabled={loading}
            >
              Reset Filters
            </button>
          </div>
        </form>

        {error && <p className="error-message">{error}</p>}
      </section>

      {answerData && (
        <section className="dashboard-card">
          <h2>Answer</h2>
          <p className="rag-answer">{answerData.answer}</p>

          <div className="rag-meta">
            <span>Collection: {answerData.collection}</span>
            <span>Embedding: {answerData.embeddingModel}</span>
            <span>Chat: {answerData.chatModel}</span>
            <span>Sources: {answerData.sources?.length || 0}</span>
            {answerData.filters && (
              <>
                <span>Doc Type: {answerData.filters.documentType}</span>
                <span>Area: {answerData.filters.projectArea}</span>
                <span>Tag: {answerData.filters.tag}</span>
              </>
            )}
          </div>
        </section>
      )}

      {answerData?.sources?.length === 0 && (
        <section className="dashboard-card">
          <h2>No Sources Found</h2>
          <p className="muted-text">
            No chunks matched this question and filter combination. Try using
            broader filters or ingesting more documents.
          </p>
        </section>
      )}

      {answerData?.sources?.length > 0 && (
        <section className="dashboard-card">
          <h2>Sources</h2>

          <div className="source-list">
            {answerData.sources.map((source) => (
              <div className="source-card source-card-detailed" key={source.id}>
                <div>
                  <div className="source-title-row">
                    <strong>{source.sourceFile}</strong>
                    <span className={getSourceBadgeClass(source.documentType)}>
                      {getSourceBadgeLabel(source.documentType)}
                    </span>
                  </div>

                  <p className="source-subtitle">
                    {source.projectArea || "unknown"}
                  </p>
                </div>

                <span>
                  Chunk: {source.chunkIndex}
                  {source.totalChunks ? ` / ${source.totalChunks}` : ""}
                </span>

                <span>Score: {Number(source.score).toFixed(4)}</span>

                {formatTags(source.tags).length > 0 && (
                  <div className="tag-list">
                    {source.tags.map((sourceTag) => (
                      <span
                        className="rag-tag"
                        key={`${source.id}-${sourceTag}`}
                      >
                        {sourceTag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {answerData?.results?.length > 0 && (
        <section className="dashboard-card">
          <h2>Retrieved Chunks</h2>

          <div className="chunk-list">
            {answerData.results.map((result) => (
              <article className="chunk-card" key={result.id}>
                <div className="chunk-card-header">
                  <div>
                    <div className="source-title-row">
                      <strong>{result.sourceFile}</strong>
                      <span className={getSourceBadgeClass(result.documentType)}>
                        {getSourceBadgeLabel(result.documentType)}
                      </span>
                    </div>

                    <p className="source-subtitle">
                      {result.projectArea || "unknown"} ·{" "}
                      {result.fileExtension || "no extension"}
                    </p>
                  </div>

                  <span>
                    Chunk {result.chunkIndex}
                    {result.totalChunks ? ` / ${result.totalChunks}` : ""}
                  </span>
                </div>

                {formatTags(result.tags).length > 0 && (
                  <div className="tag-list chunk-tags">
                    {result.tags.map((resultTag) => (
                      <span
                        className="rag-tag"
                        key={`${result.id}-${resultTag}`}
                      >
                        {resultTag}
                      </span>
                    ))}
                  </div>
                )}

                <pre>{result.text}</pre>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

export default RagTestPage;