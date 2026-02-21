/* ===================================== */
/* AUTH GUARD                            */
/* ===================================== */

// If the user didn't come through the login page, send them back.
// location.replace() removes dashboard from browser history so the
// back-button cannot return here after sign-out.
if (!sessionStorage.getItem('loggedIn')) {
  window.location.replace('login.html');
}

/* ===================================== */
/* CONFIG                                */
/* ===================================== */

// BASE_URL will be defined in api.js — e.g. const BASE_URL = "http://localhost:3000";

/* ===================================== */
/* CAMERA VIEW SWITCHING                 */
/* ===================================== */

function handleCameraChange(value) {
  const singleView = document.getElementById('singleCameraView');
  const allView = document.getElementById('allCamerasView');
  const cam1sec = document.getElementById('singleCam1');
  const cam2sec = document.getElementById('singleCam2');

  if (value === 'all') {
    // Switch to grid view
    singleView.classList.add('hidden');
    allView.classList.remove('hidden');
  } else {
    // Switch to single view and show the right camera sub-section
    singleView.classList.remove('hidden');
    allView.classList.add('hidden');

    if (value === 'cam1') {
      cam1sec.classList.remove('hidden');
      cam2sec.classList.add('hidden');
    } else if (value === 'cam2') {
      cam2sec.classList.remove('hidden');
      cam1sec.classList.add('hidden');
    }
  }
}

/* ===================================== */
/* SIGN OUT                              */
/* ===================================== */

function signOut() {
  sessionStorage.removeItem('loggedIn');
  window.location.replace('login.html');
}

/* ===================================== */
/* MAXIMIZE / MINIMIZE CAMERA MODAL      */
/* ===================================== */

function maximizeCam(camId, camName, srcVideoId) {
  const modal = document.getElementById('maximizeModal');
  const modalVideo = document.getElementById('modalVideo');
  const modalLabel = document.getElementById('modalFeedLabel');

  document.getElementById('modalCamLabel').textContent = '📷 ' + camName;
  modalLabel.textContent = camName + ' Feed';

  // If the tile already has a video loaded, mirror it in the modal
  if (srcVideoId) {
    const srcVideo = document.getElementById(srcVideoId);
    if (srcVideo && srcVideo.src && !srcVideo.classList.contains('hidden')) {
      modalVideo.src = srcVideo.src;
      modalVideo.currentTime = srcVideo.currentTime;
      modalVideo.classList.remove('hidden');
      modalLabel.classList.add('hidden');
      // Keep both in sync — pause source while modal is open
      srcVideo.pause();
    } else {
      modalVideo.src = '';
      modalVideo.classList.add('hidden');
      modalLabel.classList.remove('hidden');
    }
  } else {
    modalVideo.src = '';
    modalVideo.classList.add('hidden');
    modalLabel.classList.remove('hidden');
  }

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function minimizeCam() {
  const modal = document.getElementById('maximizeModal');
  const modalVideo = document.getElementById('modalVideo');
  modal.classList.add('hidden');
  modalVideo.pause();
  modalVideo.src = '';
  modalVideo.classList.add('hidden');
  document.getElementById('modalFeedLabel').classList.remove('hidden');
  document.body.style.overflow = '';
}

/* ===================================== */
/* VIDEO FILE LOADER                     */
/* ===================================== */

/**
 * Maps every video element ID to:
 *   camKey   — which camera this belongs to (cam1 | cam2)
 *   paired   — the other video element for the same camera
 *   label    — the placeholder label to hide when a video is loaded
 *   pairedLabel — the placeholder label on the paired element
 */
const CAM_PAIRS = {
  videoSingleCam1: { camKey: 'cam1', paired: 'videoCam1', label: 'labelSingleCam1', pairedLabel: 'labelCam1' },
  videoCam1: { camKey: 'cam1', paired: 'videoSingleCam1', label: 'labelCam1', pairedLabel: 'labelSingleCam1' },
  videoSingleCam2: { camKey: 'cam2', paired: 'videoCam2', label: 'labelSingleCam2', pairedLabel: 'labelCam2' },
  videoCam2: { camKey: 'cam2', paired: 'videoSingleCam2', label: 'labelCam2', pairedLabel: 'labelSingleCam2' },
};

// Stores the active object-URL per camera so we can revoke it on reload
const _camObjectURLs = { cam1: null, cam2: null };

// Tracks which grid cameras have a video loaded
const _allCamsLoaded = { cam1: false, cam2: false };

/**
 * Called when the user picks a video file.
 * Applies the chosen video to BOTH the triggering slot and its paired slot
 * so the feed persists when switching between single-camera and all-cameras views.
 *
 * videoElId — id of the <video> element that triggered the load
 * inputEl   — the <input type="file"> element
 */
function loadVideoFile(videoElId, inputEl) {
  const file = inputEl.files[0];
  if (!file) return;

  const info = CAM_PAIRS[videoElId];
  if (!info) return;

  // Revoke the previous URL for this camera to avoid memory leaks
  if (_camObjectURLs[info.camKey]) {
    URL.revokeObjectURL(_camObjectURLs[info.camKey]);
  }

  const url = URL.createObjectURL(file);
  _camObjectURLs[info.camKey] = url;

  // Apply to BOTH the triggering element and its pair
  [videoElId, info.paired].forEach((vid, i) => {
    const videoEl = document.getElementById(vid);
    if (!videoEl) return;

    videoEl._objectURL = url;
    videoEl.src = url;
    videoEl.loop = false;
    videoEl.muted = false;
    videoEl.classList.remove('hidden');

    // Hide the matching placeholder label
    const labelId = i === 0 ? info.label : info.pairedLabel;
    const labelEl = document.getElementById(labelId);
    if (labelEl) labelEl.classList.add('hidden');
  });

  // For single-camera views: auto-play the triggering element
  // For all-cameras grid (videoCam1 / videoCam2): do NOT auto-play — use the shared button
  const isGridVideo = (videoElId === 'videoCam1' || videoElId === 'videoCam2');
  const isPairedGrid = (info.paired === 'videoCam1' || info.paired === 'videoCam2');

  if (!isGridVideo) {
    // Triggered from a single-cam slot — play that slot
    document.getElementById(videoElId)?.play().catch(() => { });
  }
  // If triggered from a grid slot OR the paired element is a grid video,
  // mark that grid camera as loaded and refresh the shared button state
  if (isGridVideo || isPairedGrid) {
    const gridCamId = isGridVideo ? videoElId : info.paired;
    const gridKey = gridCamId === 'videoCam1' ? 'cam1' : 'cam2';
    _allCamsLoaded[gridKey] = true;
    _updateAllCamsBtn();
  }

  // Reset input so the same file can be re-selected if needed
  inputEl.value = '';
}

/**
 * Refreshes the shared Play All button — enabled if at least one grid camera has a video.
 * Updates hint text to reflect how many cameras are loaded.
 */
function _updateAllCamsBtn() {
  const btn = document.getElementById('allCamsPlayBtn');
  const hint = document.querySelector('.all-cams-hint');
  if (!btn) return;

  const loadedCount = Object.values(_allCamsLoaded).filter(Boolean).length;
  btn.disabled = loadedCount === 0;

  if (hint) {
    if (loadedCount === 0) {
      hint.textContent = 'Load a video file in each camera to enable playback';
    } else if (loadedCount === 1) {
      hint.textContent = '1 of 2 cameras loaded';
    } else {
      hint.textContent = 'Both cameras loaded';
    }
  }
}

/**
 * Shared play/pause toggle for both grid camera feeds.
 * Playing: pauses both. Paused/stopped: plays both.
 */
function toggleAllCamsPlayback() {
  const v1 = document.getElementById('videoCam1');
  const v2 = document.getElementById('videoCam2');
  const icon = document.getElementById('allCamsPlayIcon');
  const label = document.getElementById('allCamsPlayLabel');

  // Determine current state: if any loaded video is playing, treat as playing
  const isPlaying = [v1, v2].some(v => v && !v.paused && !v.ended && v.readyState > 2);

  if (isPlaying) {
    if (v1 && _allCamsLoaded.cam1) v1.pause();
    if (v2 && _allCamsLoaded.cam2) v2.pause();
    if (icon) icon.textContent = '▶';
    if (label) label.textContent = 'Play All';
  } else {
    if (v1 && _allCamsLoaded.cam1) v1.play().catch(() => { });
    if (v2 && _allCamsLoaded.cam2) v2.play().catch(() => { });
    if (icon) icon.textContent = '⏸';
    if (label) label.textContent = 'Pause All';
  }

  // Keep icon in sync when videos naturally end
  [v1, v2].forEach(v => {
    if (!v) return;
    v.onended = () => {
      const anyPlaying = [v1, v2].some(x => x && !x.paused && !x.ended);
      if (!anyPlaying) {
        if (icon) icon.textContent = '▶';
        if (label) label.textContent = 'Play All';
      }
    };
  });
}

// Close modal with Escape key
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') minimizeCam();
});

/* ===================================== */
/* ELEMENT REFERENCES                    */
/* ===================================== */

const backendStatus = document.getElementById('backendStatus');
const localTime = document.getElementById('localTime');

// Legacy status elements (kept for backward-compat)
const statusElement = document.getElementById('systemStatus');
const personElement = document.getElementById('personStatus');
const drawerElement = document.getElementById('drawerStatus');
const popup = document.getElementById('popupAlert');

// New log list elements
const transactionList = document.getElementById('transactionList');
const errorList = document.getElementById('errorList');
const billingList = document.getElementById('billingList');
const personList = document.getElementById('personList');

let lastAlertTime = null;

/* ===================================== */
/* AUDIO SETUP                           */
/* ===================================== */

let audioCtx = new (window.AudioContext || window.webkitAudioContext)();

document.addEventListener('click', () => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
});

/**
 * Standard alert beep (existing behaviour)
 */
function playAlertSound() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(900, audioCtx.currentTime);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.6, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1);
  osc.start();
  osc.stop(audioCtx.currentTime + 1);
}

/**
 * Urgent repeating alarm for RED / theft transactions
 */
function playTheftAlarm() {
  const duration = 2.5;    // seconds total
  const beepLength = 0.18;
  const gap = 0.12;

  let t = audioCtx.currentTime;
  for (let i = 0; i < 5; i++) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1100, t);
    osc.frequency.setValueAtTime(800, t + beepLength / 2);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + beepLength);

    osc.start(t);
    osc.stop(t + beepLength);

    t += beepLength + gap;
  }
}

/* ===================================== */
/* TIME UPDATE                           */
/* ===================================== */

setInterval(() => {
  localTime.innerText = new Date().toLocaleTimeString();
}, 1000);

/* ===================================== */
/* BACKEND STATUS CHECK                  */
/* ===================================== */

async function checkBackend() {
  try {
    await fetch('http://localhost:3000');
    backendStatus.className = 'status-indicator online';
    backendStatus.innerText = '● Backend Online';
  } catch {
    backendStatus.className = 'status-indicator offline';
    backendStatus.innerText = '● Backend Offline';
  }
}

/* ===================================== */
/* HELPER: FORMAT TIMESTAMP              */
/* ===================================== */

function fmtTime(ts) {
  if (!ts) return '--:--:--';
  return new Date(ts).toLocaleTimeString();
}

/* ===================================== */
/* RENDER: BILLING LOGS                  */
/* ===================================== */

/**
 * Expected billing log shape (MongoDB/JSON):
 * { _id, timestamp: ISOString, item: string, amount: number, cashier?: string }
 */
function renderBillingLogs(logs) {
  const el = billingList;
  if (!logs || logs.length === 0) {
    el.innerHTML = `<div class="txn-row txn-placeholder">
      <span class="txn-time">--:--:--</span>
      <span class="txn-msg muted">No billing records yet.</span>
    </div>`;
    document.getElementById('billingCount').textContent = '0 entries';
    return;
  }

  el.innerHTML = '';
  logs.slice().reverse().forEach(log => {
    const row = document.createElement('div');
    row.className = 'txn-row txn-green';
    row.innerHTML = `
      <span class="txn-time">${fmtTime(log.timestamp)}</span>
      <span class="txn-msg">${log.item || 'Item'} — ₹${(log.amount ?? 0).toFixed(2)}
        ${log.cashier ? `<span style="color:#4B5563"> · ${log.cashier}</span>` : ''}
      </span>`;
    el.appendChild(row);
  });

  document.getElementById('billingCount').textContent = logs.length + ' entries';
}

/* ===================================== */
/* RENDER: PERSON LOGS                   */
/* ===================================== */

/**
 * Expected person log shape (MongoDB/JSON):
 * { _id, timestamp: ISOString, event: string, camera?: string, confidence?: number }
 */
function renderPersonLogs(logs) {
  const el = personList;
  if (!logs || logs.length === 0) {
    el.innerHTML = `<div class="txn-row txn-placeholder">
      <span class="txn-time">--:--:--</span>
      <span class="txn-msg muted">No person events yet.</span>
    </div>`;
    document.getElementById('personCount').textContent = '0 entries';
    return;
  }

  el.innerHTML = '';
  logs.slice().reverse().forEach(log => {
    const row = document.createElement('div');
    row.className = 'txn-row txn-placeholder';
    const conf = log.confidence !== undefined ? ` (${log.confidence}%)` : '';
    const cam = log.camera ? ` · ${log.camera}` : '';
    row.innerHTML = `
      <span class="txn-time">${fmtTime(log.timestamp)}</span>
      <span class="txn-msg">${log.event || 'Event'}${conf}
        <span style="color:#4B5563">${cam}</span>
      </span>`;
    el.appendChild(row);
  });

  document.getElementById('personCount').textContent = logs.length + ' entries';
}

/* ===================================== */
/* RENDER: TRANSACTION OVERVIEW          */
/* ===================================== */

/**
 * Expected transaction shape (MongoDB/JSON):
 * { _id, timestamp: ISOString, type: 'legitimate'|'suspicious'|'theft', message: string, confidence?: number }
 */
function renderTransactions(txns) {
  const el = transactionList;
  if (!txns || txns.length === 0) {
    el.innerHTML = `<div class="txn-row txn-placeholder">
      <span class="txn-time">--:--:--</span>
      <span class="txn-msg muted">Awaiting transaction data...</span>
    </div>`;
    return;
  }

  el.innerHTML = '';
  let lastTheft = null;

  txns.slice().reverse().forEach(txn => {
    let cssClass = 'txn-placeholder';
    let badgeClass = '';
    let badgeText = '';

    if (txn.type === 'legitimate') {
      cssClass = 'txn-green'; badgeClass = 'green'; badgeText = '● Legitimate';
    } else if (txn.type === 'suspicious') {
      cssClass = 'txn-yellow'; badgeClass = 'yellow'; badgeText = '⚠ Suspicious';
    } else if (txn.type === 'theft') {
      cssClass = 'txn-red'; badgeClass = 'red'; badgeText = '🔴 Theft';
      if (!lastTheft) lastTheft = txn;
    }

    const conf = txn.confidence !== undefined ? ` · ${txn.confidence}%` : '';
    const row = document.createElement('div');
    row.className = `txn-row ${cssClass}`;
    row.innerHTML = `
      <span class="txn-time">${fmtTime(txn.timestamp)}</span>
      <span class="txn-badge ${badgeClass}">${badgeText}</span>
      <span class="txn-msg">${txn.message || '—'}${conf}</span>`;
    el.appendChild(row);
  });

  // Fire theft popup for the newest theft event
  if (lastTheft && lastTheft.timestamp !== lastAlertTime) {
    lastAlertTime = lastTheft.timestamp;
    showTheftAlert(lastTheft);
  }
}

/* ===================================== */
/* RENDER: PREVIOUS ERROR LOGS           */
/* ===================================== */

/**
 * Error logs are a filtered subset of transactions where type === 'theft'
 * OR they can come from their own endpoint:
 * { _id, timestamp: ISOString, type: string, message: string, camera?: string }
 */
function renderErrorLogs(errors) {
  const el = errorList;
  if (!errors || errors.length === 0) {
    el.innerHTML = `<div class="txn-row txn-placeholder">
      <span class="txn-time">--:--:--</span>
      <span class="txn-msg muted">No errors recorded yet.</span>
    </div>`;
    document.getElementById('errorCount').textContent = '0 errors';
    return;
  }

  el.innerHTML = '';
  errors.slice().reverse().forEach(err => {
    const isTheft = err.type === 'theft';
    const row = document.createElement('div');
    const cam = err.camera ? ` · ${err.camera}` : '';
    row.className = `txn-row ${isTheft ? 'txn-red' : 'txn-yellow'}`;
    row.innerHTML = `
      <span class="txn-time">${fmtTime(err.timestamp)}</span>
      <span class="txn-badge ${isTheft ? 'red' : 'yellow'}">${isTheft ? '🔴 Theft' : '⚠ Error'}</span>
      <span class="txn-msg">${err.message || err.type || '—'}
        <span style="color:#4B5563">${cam}</span>
      </span>`;
    el.appendChild(row);
  });

  document.getElementById('errorCount').textContent = errors.length + ' errors';
}

/* ===================================== */
/* THEFT ALERT POPUP                     */
/* ===================================== */

function showTheftAlert(txn) {
  const popup = document.getElementById('theftAlertPopup');
  document.getElementById('theftMessage').textContent = txn.message || 'Unauthorized access detected.';
  document.getElementById('theftConfidence').textContent = txn.confidence !== undefined
    ? 'Confidence: ' + txn.confidence + '%' : '';
  document.getElementById('theftTimestamp').textContent = fmtTime(txn.timestamp);

  popup.classList.remove('hidden');
  playTheftAlarm();

  // Auto-dismiss after 12 seconds
  setTimeout(() => popup.classList.add('hidden'), 12000);
}

function dismissTheftAlert() {
  document.getElementById('theftAlertPopup').classList.add('hidden');
}

/* ===================================== */
/* LEGACY POPUP (backward-compat)        */
/* ===================================== */

function showPopup(alert) {
  document.getElementById('alertType').innerText = alert.type;
  document.getElementById('alertConfidence').innerText = 'Confidence: ' + alert.confidence + '%';
  popup.classList.remove('hidden');
  playAlertSound();
  setTimeout(() => popup.classList.add('hidden'), 5000);
}

/* ===================================== */
/* FETCH DATA FROM BACKEND               */
/* ===================================== */

async function fetchData() {
  try {
    // ── Transaction overview + error logs ──────────────────────────
    // TODO: replace with real endpoint when backend is ready
    // const txnRes    = await fetch(`${BASE_URL}/transactions`);
    // const txns      = await txnRes.json();
    // renderTransactions(txns);
    // renderErrorLogs(txns.filter(t => t.type === 'theft' || t.type === 'suspicious'));

    // ── Billing logs ───────────────────────────────────────────────
    // TODO: replace with real endpoint
    // const billRes  = await fetch(`${BASE_URL}/billing-logs`);
    // const bills    = await billRes.json();
    // renderBillingLogs(bills);

    // ── Person logs ────────────────────────────────────────────────
    // TODO: replace with real endpoint
    // const personRes = await fetch(`${BASE_URL}/person-logs`);
    // const persons   = await personRes.json();
    // renderPersonLogs(persons);

    // ── Legacy alerts/events (existing behaviour) ──────────────────
    const alertsRes = await fetch(`${BASE_URL}/alerts`);
    const eventsRes = await fetch(`${BASE_URL}/events`);
    const alerts = await alertsRes.json();
    const events = await eventsRes.json();

    if (events.length > 0) {
      const last = events[events.length - 1];
      if (personElement)
        personElement.innerText = 'Person: ' + (last.person_detected ? 'Present' : 'Not Detected');
      if (drawerElement)
        drawerElement.innerText = 'Drawer: ' + (last.type === 'drawer_open' ? 'Open' : 'Closed');
    }

    if (alerts && alerts.length > 0) {
      if (statusElement) { statusElement.className = 'status abnormal'; statusElement.innerText = 'ABNORMAL'; }
      const latestAlert = alerts[alerts.length - 1];
      if (latestAlert.time !== lastAlertTime) {
        lastAlertTime = latestAlert.time;
        showPopup(latestAlert);
      }
    } else {
      if (statusElement) { statusElement.className = 'status normal'; statusElement.innerText = 'NORMAL'; }
    }

  } catch (err) {
    console.log('Fetch error:', err.message);
  }
}

/* ===================================== */
/* MAIN LOOP                             */
/* ===================================== */

setInterval(() => {
  checkBackend();
  fetchData();
}, 2000);