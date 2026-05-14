const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const { startStreamBridge } = require("./streaming/streamBridge");

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/alerts", require("./routes/alertRoutes"));
app.use("/api/remediations", require("./routes/remediationRoutes"));
app.use("/api/audit-logs", require("./routes/auditLogRoutes"));
app.use("/api/webhooks", require("./routes/webhookRoutes"));
app.use("/api/streaming", require("./routes/streamingRoutes"));
app.use(
  "/api/streaming-approvals",
  require("./routes/streamingApprovalRoutes")
);

// Local Vector RAG routes
app.use("/api/rag", require("./routes/ragRoutes"));

// Test route
app.get("/", (req, res) => {
  res.send("Aura backend is running...");
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  if (String(process.env.START_STREAM_BRIDGE).toLowerCase() === "true") {
    startStreamBridge();
    console.log("Aura V2 stream bridge enabled.");
  } else {
    console.log("Aura V2 stream bridge disabled for this server process.");
  }
});