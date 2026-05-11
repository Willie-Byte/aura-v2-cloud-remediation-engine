import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "/api",
});

export const getAlerts = () => API.get("/alerts");
export const getAlertById = (id) => API.get(`/alerts/${id}`);
export const createAlert = (alertData) => API.post("/alerts", alertData);
export const generateFix = (id) => API.post(`/alerts/${id}/generate-fix`);
export const getQuantumRisk = () => API.get("/alerts/quantum-risk");

export const getRemediationsByAlertId = (alertId) =>
  API.get(`/remediations/alert/${alertId}`);

export const approveRemediation = (id) =>
  API.patch(`/remediations/${id}/approve`);

export const rejectRemediation = (id) =>
  API.patch(`/remediations/${id}/reject`);

export const deployRemediation = (id) =>
  API.patch(`/remediations/${id}/deploy`);

export const getAuditLogsByAlertId = (alertId) =>
  API.get(`/audit-logs/alert/${alertId}`);

export const getStreamingStatus = () => API.get("/streaming/status");

export const getStreamingAuditSummary = () =>
  API.get("/streaming/audit-summary");

export const getStreamingExecutionResults = () =>
  API.get("/streaming/execution-results");

export const sendStreamingApprovalDecision = (decisionPayload) =>
  API.post("/streaming-approvals/decision", decisionPayload);

// Local Vector RAG API
export const getRagHealth = () => API.get("/rag/health");

export const queryRag = (queryPayload) =>
  API.post("/rag/query", queryPayload);

export const answerRagQuestion = (queryPayload) =>
  API.post("/rag/answer", queryPayload);

export default API;