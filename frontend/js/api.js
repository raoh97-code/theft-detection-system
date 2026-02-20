const BASE_URL = "http://localhost:3000/api";

async function getAlerts() {
  const res = await fetch(`${BASE_URL}/alerts`);
  return res.json();
}

async function getEvents() {
  const res = await fetch(`${BASE_URL}/events`);
  return res.json();
}

async function getPOSLogs() {
  const res = await fetch(`${BASE_URL}/pos-logs`);
  return res.json();
}