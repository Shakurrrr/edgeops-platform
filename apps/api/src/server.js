const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const serverless = require("serverless-http");

const app = express();
app.use(cors());
app.use(express.json());

const SERVICE_NAME = process.env.SERVICE_NAME || "edgeops-api";
const VERSION = process.env.VERSION || "v0.1.0";
const DEPLOYMENT = process.env.DEPLOYMENT || "stable";
const ENVIRONMENT = process.env.ENVIRONMENT || "dev";
const COMMIT = process.env.COMMIT || "local-dev";

function payload() {
  return {
    service: SERVICE_NAME,
    version: VERSION,
    deployment: DEPLOYMENT,
    commit: COMMIT,
    environment: ENVIRONMENT,
    timestamp: new Date().toISOString(),
    request_id: crypto.randomUUID(),
  };
}

/**
 * Structured logging helper (JSON logs for CloudWatch queryability\ in JSON format).
 */
function logEvent(eventType, data) {
  console.log(
    JSON.stringify({
      event_type: eventType,
      ...data,
    })
  );
}

app.get("/api/health", (req, res) => {
  const p = { status: "ok", ...payload() };

  logEvent("api_health", {
    path: req.path,
    method: req.method,
    user_agent: req.headers["user-agent"],
    ...p,
  });

  res.status(200).json(p);
});

app.get("/api/version", (req, res) => {
  const p = payload();

  logEvent("api_version", {
    path: req.path,
    method: req.method,
    user_agent: req.headers["user-agent"],
    ...p,
  });

  res.status(200).json(p);
});

if (require.main === module) {
  const port = process.env.PORT || 3001;
  app.listen(port, () => console.log(`API running on port ${port}`));
}

module.exports.handler = serverless(app);
