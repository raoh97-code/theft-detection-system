import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/* ============================= */
/* PATH FIX (CRITICAL) */
/* ============================= */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sharedPath = path.join(__dirname, "../shared");
const posPath = path.join(__dirname, "../pos-simulator");

const eventsFile = path.join(sharedPath, "events.json");
const alertsFile = path.join(sharedPath, "alerts.json");
const posFile = path.join(posPath, "pos_logs.json");

/* ============================= */
/* SAFE JSON READ */
/* ============================= */

function readJSON(filePath) {
  try {
    if (!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath, "utf-8");
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.log("JSON Read Error:", err.message);
    return [];
  }
}

/* ============================= */
/* SAFE JSON WRITE */
/* ============================= */

function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.log("JSON Write Error:", err.message);
  }
}

/* ============================= */
/* ANOMALY DETECTION LOGIC */
/* ============================= */

function detectAnomalies(events, posLogs) {
  const alerts = [];

  events.forEach(event => {

    // Find matching POS log within 2 seconds window
    const matchingLog = posLogs.find(log => {
      return (
        Math.abs(new Date(event.timestamp) - new Date(log.timestamp)) < 2000
      );
    });

    /* -------- 1. Drawer Open Without POS -------- */
    if (event.type === "drawer_open" && !matchingLog) {
      alerts.push({
        type: "Unauthorized Drawer Access",
        confidence: 90,
        time: event.timestamp
      });
    }

    /* -------- 2. Suspicious Cash Motion -------- */
    if (event.type === "cash_motion" && event.suspicious === true) {
      alerts.push({
        type: "Suspicious Cash Handling",
        confidence: 85,
        time: event.timestamp
      });
    }

    /* -------- 3. Drawer Open But No Person -------- */
    if (event.type === "drawer_open" && event.person_detected === false) {
      alerts.push({
        type: "Drawer Tampering Detected",
        confidence: 95,
        time: event.timestamp
      });
    }

  });

  return alerts;
}

/* ============================= */
/* DETECTION LOOP */
/* ============================= */

let lastEventHash = "";

export function startDetectionLoop() {
  setInterval(() => {
    try {

      // Read raw file to detect change
      const eventsRaw = fs.readFileSync(eventsFile, "utf-8");

      // Skip if no change
      if (eventsRaw === lastEventHash) return;

      lastEventHash = eventsRaw;

      const events = eventsRaw ? JSON.parse(eventsRaw) : [];
      const posLogs = readJSON(posFile);

      const alerts = detectAnomalies(events, posLogs);

      writeJSON(alertsFile, alerts);

      if (alerts.length > 0) {
        console.log("🚨 ALERT:", alerts[alerts.length - 1].type);
      }

    } catch (err) {
      console.log("Waiting for AI engine data...");
    }

  }, 2000);
}