const StreamingAuditEvent = require("../models/StreamingAuditEvent");
const ExecutionResult = require("../models/ExecutionResult");
const ApprovalRequest = require("../models/ApprovalRequest");
const ApprovalDecision = require("../models/ApprovalDecision");

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

function getPaginationOptions(req) {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const requestedLimit = Number.parseInt(req.query.limit, 10) || DEFAULT_LIMIT;
  const limit = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

function buildRegexFilter(value) {
  if (!value) {
    return undefined;
  }

  return { $regex: String(value), $options: "i" };
}

function buildCommonFilters(req, allowedFields = []) {
  const filter = {};

  for (const field of allowedFields) {
    if (req.query[field]) {
      filter[field] = buildRegexFilter(req.query[field]);
    }
  }

  return filter;
}

function formatPagination({ page, limit, total }) {
  return {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  };
}

async function listDocuments({ req, res, model, filter, dataKey }) {
  try {
    const { page, limit, skip } = getPaginationOptions(req);

    const [items, total] = await Promise.all([
      model
        .find(filter)
        .sort({ receivedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      model.countDocuments(filter),
    ]);

    res.status(200).json({
      count: items.length,
      pagination: formatPagination({ page, limit, total }),
      [dataKey]: items,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
}

async function getStreamingAuditEvents(req, res) {
  const filter = buildCommonFilters(req, ["eventType", "topic", "key"]);

  await listDocuments({
    req,
    res,
    model: StreamingAuditEvent,
    filter,
    dataKey: "events",
  });
}

async function getStreamingExecutionResults(req, res) {
  const filter = buildCommonFilters(req, [
    "resultId",
    "remediationId",
    "threatId",
    "targetResource",
    "issueType",
    "status",
    "reason",
    "executionMode",
  ]);

  await listDocuments({
    req,
    res,
    model: ExecutionResult,
    filter,
    dataKey: "results",
  });
}

async function getStreamingApprovalRequests(req, res) {
  const filter = buildCommonFilters(req, [
    "approvalId",
    "remediationId",
    "threatId",
    "targetResource",
    "issueType",
    "status",
    "reason",
    "executionMode",
  ]);

  await listDocuments({
    req,
    res,
    model: ApprovalRequest,
    filter,
    dataKey: "requests",
  });
}

async function getStreamingApprovalDecisions(req, res) {
  const filter = buildCommonFilters(req, [
    "decisionId",
    "approvalId",
    "remediationId",
    "threatId",
    "decision",
    "decidedBy",
    "targetResource",
    "issueType",
    "executionMode",
  ]);

  await listDocuments({
    req,
    res,
    model: ApprovalDecision,
    filter,
    dataKey: "decisions",
  });
}

module.exports = {
  getStreamingAuditEvents,
  getStreamingExecutionResults,
  getStreamingApprovalRequests,
  getStreamingApprovalDecisions,
};
