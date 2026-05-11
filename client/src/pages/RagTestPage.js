import { useEffect, useState } from "react";
import { answerRagQuestion, getRagHealth } from "../services/api";
import "../App.css";

function formatTags(tags) {
  return Array.isArray(tags) && tags.length > 0 ? tags : [];
}

function RagTestPage() {
  const [query, setQuery] = useState(
    "What should stay separate from the vector RAG branch?"
  );
  const [limit, setLimit] = useState(5);
  const [answerData, setAnswerData] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [healthLoading, setHealthLoading] = useState(false);
  const [error, setError] = useState("");

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
          </div>
        </section>
      )}

      {answerData?.sources?.length > 0 && (
        <section className="dashboard-card">
          <h2>Sources</h2>

          <div className="source-list">
            {answerData.sources.map((source) => (
              <div className="source-card source-card-detailed" key={source.id}>
                <div>
                  <strong>{source.sourceFile}</strong>
                  <p className="source-subtitle">
                    {source.documentType || "unknown"} ·{" "}
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
                    {source.tags.map((tag) => (
                      <span className="rag-tag" key={`${source.id}-${tag}`}>
                        {tag}
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
                    <strong>{result.sourceFile}</strong>
                    <p className="source-subtitle">
                      {result.documentType || "unknown"} ·{" "}
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
                    {result.tags.map((tag) => (
                      <span className="rag-tag" key={`${result.id}-${tag}`}>
                        {tag}
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