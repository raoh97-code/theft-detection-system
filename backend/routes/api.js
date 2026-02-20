import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sharedPath = path.join(__dirname, "../../shared");
const posPath = path.join(__dirname, "../../pos-simulator");

router.get("/alerts", (req, res) => {
  const data = fs.readFileSync(path.join(sharedPath, "alerts.json"));
  res.json(JSON.parse(data));
});

router.get("/events", (req, res) => {
  const data = fs.readFileSync(path.join(sharedPath, "events.json"));
  res.json(JSON.parse(data));
});

router.get("/pos-logs", (req, res) => {
  const data = fs.readFileSync(path.join(posPath, "pos_logs.json"));
  res.json(JSON.parse(data));
});

export default router;