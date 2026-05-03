const express = require("express");
const router = express.Router();
const {
  handleAzureWebhook,
  handleAwsWebhook,
  handleGcpWebhook,
} = require("../controllers/webhookController");

router.post("/azure", handleAzureWebhook);
router.post("/aws", handleAwsWebhook);
router.post("/gcp", handleGcpWebhook);

module.exports = router;