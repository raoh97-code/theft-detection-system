/* ===================================== */
/* CONFIG */
/* ===================================== */



/* ===================================== */
/* ELEMENT REFERENCES */
/* ===================================== */

const backendStatus = document.getElementById("backendStatus");
const localTime = document.getElementById("localTime");

const statusElement = document.getElementById("systemStatus");
const personElement = document.getElementById("personStatus");
const drawerElement = document.getElementById("drawerStatus");
const posList = document.getElementById("posList");
const popup = document.getElementById("popupAlert");

let lastAlertTime = null;

/* ===================================== */
/* AUDIO SETUP */
/* ===================================== */

let audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Resume audio when user interacts (browser security fix)
document.addEventListener("click", () => {
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
});

function playAlertSound() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = "square";
  osc.frequency.setValueAtTime(900, audioCtx.currentTime);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  gain.gain.setValueAtTime(0.6, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1);

  osc.start();
  osc.stop(audioCtx.currentTime + 1);
}

/* ===================================== */
/* TIME UPDATE */
/* ===================================== */

setInterval(() => {
  localTime.innerText = new Date().toLocaleTimeString();
}, 1000);

/* ===================================== */
/* BACKEND STATUS CHECK */
/* ===================================== */

async function checkBackend() {
  try {
    await fetch("http://localhost:3000");
    backendStatus.className = "status-indicator online";
    backendStatus.innerText = "● Backend Online";
  } catch {
    backendStatus.className = "status-indicator offline";
    backendStatus.innerText = "● Backend Offline";
  }
}

/* ===================================== */
/* FETCH DATA FROM BACKEND */
/* ===================================== */

async function fetchData() {
  try {
    const alertsRes = await fetch(`${BASE_URL}/alerts`);
    const eventsRes = await fetch(`${BASE_URL}/events`);
    const posRes = await fetch(`${BASE_URL}/pos-logs`);

    const alerts = await alertsRes.json();
    const events = await eventsRes.json();
    const logs = await posRes.json();

    console.log("ALERTS:", alerts);

    /* ---------- POS LOGS ---------- */
    posList.innerHTML = "";
    logs.forEach(log => {
      const li = document.createElement("li");
      li.innerText =
        new Date(log.timestamp).toLocaleTimeString() + " - " + log.event;
      posList.appendChild(li);
    });

    /* ---------- EVENTS ---------- */
    if (events.length > 0) {
      const last = events[events.length - 1];

      personElement.innerText =
        "Person: " + (last.person_detected ? "Present" : "Not Detected");

      drawerElement.innerText =
        "Drawer: " + (last.type === "drawer_open" ? "Open" : "Closed");
    }

    /* ---------- ALERT HANDLING ---------- */
    if (alerts && alerts.length > 0) {
      statusElement.className = "status abnormal";
      statusElement.innerText = "ABNORMAL";

      const latestAlert = alerts[alerts.length - 1];

      if (latestAlert.time !== lastAlertTime) {
        lastAlertTime = latestAlert.time;
        showPopup(latestAlert);
      }

    } else {
      statusElement.className = "status normal";
      statusElement.innerText = "NORMAL";
    }

  } catch (err) {
    console.log("Fetch error:", err.message);
  }
}

/* ===================================== */
/* POPUP DISPLAY */
/* ===================================== */

function showPopup(alert) {
  document.getElementById("alertType").innerText = alert.type;
  document.getElementById("alertConfidence").innerText =
    "Confidence: " + alert.confidence + "%";

  popup.classList.remove("hidden");

  playAlertSound(); // 🔊 SOUND TRIGGER

  setTimeout(() => {
    popup.classList.add("hidden");
  }, 5000);
}

/* ===================================== */
/* MAIN LOOP */
/* ===================================== */

setInterval(() => {
  checkBackend();
  fetchData();
}, 2000);