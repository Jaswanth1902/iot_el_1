// ============================================================
// APP.JS — Core Application Logic & Real-Time Simulation
// ============================================================

// ── Vaccine Catalog ─────────────────────────────────────────
const VACCINE_CATALOG = {
  'Covaxin':    { min: 2,   max: 8,   unit: '°C', freezer: false, name: 'Covaxin (BBV152)',    manufacturer: 'Bharat Biotech' },
  'Covishield': { min: 2,   max: 8,   unit: '°C', freezer: false, name: 'Covishield',           manufacturer: 'Serum Institute' },
  'BCG':        { min: 2,   max: 8,   unit: '°C', freezer: false, name: 'BCG Vaccine',          manufacturer: 'SII / Serum' },
  'OPV':        { min: -20, max: -10, unit: '°C', freezer: true,  name: 'Oral Polio Vaccine',   manufacturer: 'Bharat Immunologicals' },
  'Hepatitis B':{ min: 2,   max: 8,   unit: '°C', freezer: false, name: 'Hepatitis B Vaccine',  manufacturer: 'Bharat Biotech' },
  'Rotavirus':  { min: 2,   max: 8,   unit: '°C', freezer: false, name: 'Rotavirus Vaccine',    manufacturer: 'Bharat Biotech' },
  'MMR':        { min: -20, max: -10, unit: '°C', freezer: true,  name: 'MMR Vaccine',          manufacturer: 'SII' },
  'Pentavalent':{ min: 2,   max: 8,   unit: '°C', freezer: false, name: 'Pentavalent Vaccine',  manufacturer: 'Biological E' },
};

// ── State ────────────────────────────────────────────────────
let currentVaccine = 'Covaxin';
let currentTemp    = 4.6;
let doorOpen       = false;
let tempInterval   = null;
let clockInterval  = null;
window.currentAlertFilter = 'all';

// ── DOM Ready ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const firebaseOk = initFirebase();
  if (firebaseOk) {
    const demoPill = document.getElementById('firebase-demo-pill');
    if (demoPill) demoPill.remove();
  }
  attachFirebaseListeners();
  initClock();
  initVaccineSelector();
  initTempDisplay();
  initTempChart('1h', currentVaccine);
  initMap();
  initAlerts();
  initDoorPanel();
  initKPIs();
  if (DEMO_MODE) {
    startTempSimulation();
  }
  initChartTabs();
  initAlertFilters();
  initRoleSelector();
  updateConnectionStatus();
  renderJourneyTimeline();
  renderAIInsights();
  updateSystemHealth();
});

// ── Clock ─────────────────────────────────────────────────────
function initClock() {
  function tick() {
    const now = new Date();
    const dateEl = document.getElementById('header-date');
    const timeEl = document.getElementById('header-time');
    const syncEl = document.getElementById('last-sync');
    if (dateEl) dateEl.textContent = now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    if (timeEl) timeEl.textContent = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    if (syncEl) syncEl.textContent = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  tick();
  clockInterval = setInterval(tick, 1000);
}

// ── Vaccine Selector ─────────────────────────────────────────
function initVaccineSelector() {
  const sel = document.getElementById('vaccine-select');
  if (!sel) return;

  // Populate dropdown
  Object.keys(VACCINE_CATALOG).forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    sel.appendChild(opt);
  });
  sel.value = currentVaccine;

  sel.addEventListener('change', () => {
    currentVaccine = sel.value;
    updateTempRangeDisplay();
    resetTempToSafeRange();
    updateTempChart(window.currentChartRange || '1h', currentVaccine);
    updateVaccineInfo();
  });

  updateVaccineInfo();
}

function updateVaccineInfo() {
  const vc = VACCINE_CATALOG[currentVaccine];
  const nameEl = document.getElementById('vaccine-name-display');
  const mfgEl  = document.getElementById('vaccine-mfg');
  if (nameEl) nameEl.textContent = vc.name;
  if (mfgEl)  mfgEl.textContent  = vc.manufacturer;
  updateTempRangeDisplay();
}

function updateTempRangeDisplay() {
  const vc  = VACCINE_CATALOG[currentVaccine];
  const el  = document.getElementById('temp-range-display');
  const minE = document.getElementById('temp-min');
  const maxE = document.getElementById('temp-max');
  if (el)   el.textContent  = `${vc.min}°C to ${vc.max}°C`;
  if (minE) minE.textContent = `${vc.min}°C`;
  if (maxE) maxE.textContent = `${vc.max}°C`;
}

function resetTempToSafeRange() {
  const vc = VACCINE_CATALOG[currentVaccine];
  currentTemp = (vc.min + vc.max) / 2 + (Math.random() - .5) * ((vc.max - vc.min) * .3);
  currentTemp = Math.round(currentTemp * 10) / 10;
  updateTempDisplay(currentTemp);
}

// ── Live Temperature Display ──────────────────────────────────
function initTempDisplay() {
  updateTempRangeDisplay();
  updateTempDisplay(currentTemp);
}

function updateTempDisplay(temp) {
  const vc = VACCINE_CATALOG[currentVaccine];
  const card = document.getElementById('live-temp-card');
  const valEl = document.getElementById('gauge-temp-val');
  const statusEl = document.getElementById('temp-status-badge');

  if (valEl) valEl.textContent = temp.toFixed(1);

  const isSafe    = temp >= vc.min && temp <= vc.max;
  const isAlert   = temp < (vc.min - 1.5) || temp > (vc.max + 1.5);
  const isWarning = !isSafe && !isAlert;

  // Remove all state classes
  if (card) {
    card.classList.remove('safe', 'alert', 'warning');
    if (isSafe)    card.classList.add('safe');
    else if (isAlert)   card.classList.add('alert');
    else           card.classList.add('warning');
  }

  if (statusEl) {
    statusEl.className = 'status-badge ' + (isSafe ? 'safe' : isAlert ? 'alert' : 'warning');
    statusEl.innerHTML = isSafe
      ? '<i class="fa-solid fa-circle-check"></i> SAFE'
      : isAlert
      ? '<i class="fa-solid fa-circle-exclamation"></i> TEMPERATURE ALERT'
      : '<i class="fa-solid fa-triangle-exclamation"></i> WARNING';
  }

  // Update SVG Arc Gauge Fill
  const fillArc = document.getElementById('gauge-fill-arc');
  if (fillArc) {
    const minLimit = vc.min - 5;
    const maxLimit = vc.max + 5;
    const pct = Math.max(0, Math.min(100, ((temp - minLimit) / (maxLimit - minLimit)) * 100));
    const offset = 188 - (pct / 100) * 188;
    fillArc.style.strokeDashoffset = offset;
    
    if (isSafe) fillArc.setAttribute('stroke', '#00e676');
    else if (isAlert) fillArc.setAttribute('stroke', '#f44336');
    else fillArc.setAttribute('stroke', '#ff9800');
  }

  // Update secondary sensor display
  const s2 = document.getElementById('sensor2-val');
  const avg = document.getElementById('sensor-avg-val');
  if (s2)  s2.textContent  = (temp - 0.2 + (Math.random()-.5)*.1).toFixed(1) + '°C';
  if (avg) avg.textContent = ((temp + temp - 0.2) / 2).toFixed(1) + '°C';
}

function startTempSimulation() {
  if (tempInterval) clearInterval(tempInterval);
  tempInterval = setInterval(() => {
    const vc = VACCINE_CATALOG[currentVaccine];
    const drift  = (Math.random() - .48) * .25;
    currentTemp  = Math.round((currentTemp + drift) * 10) / 10;

    // Gradual warm drift simulation
    if (Math.random() < .03) currentTemp = vc.max + Math.random() * 2;

    updateTempDisplay(currentTemp);
  }, 3000);
}

// ── Chart Tabs ────────────────────────────────────────────────
function initChartTabs() {
  document.querySelectorAll('.chart-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.chart-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const range = btn.dataset.range;
      window.currentChartRange = range;
      updateTempChart(range, currentVaccine);
    });
  });
}

// ── Door Panel ────────────────────────────────────────────────
function initDoorPanel() {
  renderDoorStatus();
  // Simulate occasional door events
  if (DEMO_MODE) {
    setInterval(() => {
      if (Math.random() < .005) toggleDoorDemo();
    }, 1000);
  }
}

function setDoorStatus(state) {
  doorOpen = (state === 'open');
  renderDoorStatus();
  logDoorEvent(state);
}

function toggleDoorDemo() {
  setDoorStatus(doorOpen ? 'closed' : 'open');
  if (doorOpen) pushAlert('door_open');
}

function renderDoorStatus() {
  const card = document.getElementById('door-status-card');
  const icon = document.getElementById('door-icon');
  const text = document.getElementById('door-status-text');
  const sensor = document.getElementById('door-sensor-indicator');

  if (!card) return;
  card.className = 'door-status-card ' + (doorOpen ? 'open' : 'closed');
  if (icon) icon.textContent = doorOpen ? '🔓' : '🔒';
  if (text) {
    text.className = 'door-status-text';
    text.textContent = doorOpen ? 'DOOR OPEN' : 'DOOR CLOSED';
  }
  if (sensor) {
    sensor.className = 'status-dot ' + (doorOpen ? 'err' : '');
  }
}

let doorLog = [
  { type: 'closed', time: new Date(Date.now() - 5400000), loc: 'Warehouse, Delhi' },
  { type: 'opened', time: new Date(Date.now() - 5100000), loc: 'Warehouse, Delhi' },
  { type: 'closed', time: new Date(Date.now() - 5000000), loc: 'Warehouse, Delhi' },
  { type: 'opened', time: new Date(Date.now() - 3600000), loc: 'En route NH-48' },
  { type: 'closed', time: new Date(Date.now() - 3450000), loc: 'En route NH-48' },
];

function logDoorEvent(state) {
  doorLog.unshift({ type: state === 'open' ? 'opened' : 'closed', time: new Date(), loc: 'En route to AIIMS' });
  renderDoorLog();
}

function renderDoorLog() {
  const container = document.getElementById('door-event-log');
  if (!container) return;
  container.innerHTML = doorLog.slice(0, 15).map(ev => `
    <div class="event-item ${ev.type}">
      <span class="event-icon">${ev.type === 'opened' ? '🔓' : '🔒'}</span>
      <div>
        <div style="font-weight:600;text-transform:capitalize;">Door ${ev.type}</div>
        <div class="event-time">${ev.time.toLocaleTimeString('en-IN')}</div>
        <div class="event-loc"><i class="fa-solid fa-location-dot" style="margin-right:.3rem;font-size:.6rem;color:var(--clr-blue-bright);"></i>${ev.loc}</div>
      </div>
    </div>
  `).join('');
}

// ── KPI Dashboard ─────────────────────────────────────────────
function initKPIs() {
  animateCounter('kpi-total-boxes', 0, 12, 1200);
  animateCounter('kpi-active-boxes', 0, 8, 1400);
  animateCounter('kpi-safe-boxes', 0, 7, 1600);
  animateCounter('kpi-alert-boxes', 0, 1, 1000);

  document.getElementById('kpi-avg-temp') && (document.getElementById('kpi-avg-temp').textContent = '4.8°C');
  document.getElementById('kpi-route-compliance') && (document.getElementById('kpi-route-compliance').textContent = '94.2%');
  document.getElementById('kpi-door-score') && (document.getElementById('kpi-door-score').textContent = '91/100');
  document.getElementById('kpi-coldchain-score') && (document.getElementById('kpi-coldchain-score').textContent = '87/100');

  // Mini sparklines
  ['mini-temp-chart','mini-route-chart','mini-door-chart','mini-chain-chart'].forEach((id, i) => {
    const colors = ['#42a5f5','#00e676','#ff9800','#00bcd4'];
    initMiniChart(id, colors[i]);
  });

  // Refresh KPIs every 30s with slight variation
  setInterval(() => {
    const avgT = (currentTemp - 0.2 + Math.random() * 0.4).toFixed(1);
    const el = document.getElementById('kpi-avg-temp');
    if (el) el.textContent = avgT + '°C';
  }, 30000);
}

function animateCounter(id, from, to, duration) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = performance.now();
  function update(now) {
    const t = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(from + (to - from) * easeOut(t));
    if (t < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}
function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

// ── Alert Filters ─────────────────────────────────────────────
function initAlertFilters() {
  document.querySelectorAll('.alert-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.alert-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      window.currentAlertFilter = btn.dataset.filter;
      renderAlerts(window.currentAlertFilter);
    });
  });
}

// ── Role Selector ─────────────────────────────────────────────
function initRoleSelector() {
  const sel = document.getElementById('role-select');
  if (!sel) return;
  sel.addEventListener('change', () => {
    const roleLabel = document.getElementById('role-label');
    if (roleLabel) roleLabel.textContent = sel.value;
    showNotification({ type: 'Role Changed', icon: 'fa-user-shield', desc: `Logged in as ${sel.value}`, priority: 'low' });
  });
}

// ── Connection Status ─────────────────────────────────────────
function updateConnectionStatus() {
  const online = navigator.onLine;
  const el = document.getElementById('internet-dot');
  const txt = document.getElementById('internet-status');
  if (el)  el.className = 'status-dot' + (online ? '' : ' err');
  if (txt) txt.textContent = online ? 'Online' : 'Offline';

  window.addEventListener('online',  () => updateConnectionStatus());
  window.addEventListener('offline', () => {
    updateConnectionStatus();
    pushAlert('internet_loss');
  });
}

// ── Journey Timeline ─────────────────────────────────────────
function renderJourneyTimeline() {
  const steps = [
    { time: '08:00 AM', event: 'Vaccine Box Loaded', detail: 'Central Vaccine Warehouse, Delhi', state: 'completed' },
    { time: '09:15 AM', event: 'Vehicle Departed', detail: 'Cold chain seal verified', state: 'completed' },
    { time: '10:30 AM', event: 'Checkpoint Passed', detail: 'NH-48 Cold Chain Checkpoint', state: 'completed' },
    { time: '11:45 AM', event: 'Distribution Hub', detail: 'Quality check completed', state: 'current' },
    { time: '01:30 PM', event: 'AIIMS Hospital', detail: 'Estimated arrival', state: 'pending' },
    { time: '02:00 PM', event: 'Vaccine Stored', detail: 'Cold storage handover', state: 'pending' },
  ];

  const container = document.getElementById('journey-timeline');
  if (!container) return;
  container.innerHTML = steps.map(s => `
    <div class="timeline-item">
      <div class="timeline-dot ${s.state}"></div>
      <div class="timeline-time">${s.time}</div>
      <div class="timeline-event">${s.event}</div>
      <div class="timeline-detail">${s.detail}</div>
    </div>
  `).join('');
}

// ── AI Insights ───────────────────────────────────────────────
function renderAIInsights() {
  const insights = [
    { type: 'warning', icon: 'fa-chart-line', text: 'Temperature is gradually increasing (+0.3°C over last 40 mins). Monitor closely.', action: 'Inspect refrigeration unit at next checkpoint' },
    { type: 'alert',   icon: 'fa-door-open',  text: 'Door opened 4 times in last 2 hours — above normal threshold of 2.', action: 'Verify with driver and document reason' },
    { type: 'info',    icon: 'fa-clock',      text: 'Vehicle is running 22 minutes behind schedule due to traffic on NH-48.', action: 'Update ETA for receiving hospital' },
    { type: 'tip',     icon: 'fa-shield-halved', text: 'Cold chain integrity maintained for 97.3% of journey so far.', action: 'Continue current protocol — performance is excellent' },
  ];

  const container = document.getElementById('ai-insights-list');
  if (!container) return;
  container.innerHTML = insights.map(ins => `
    <div class="ai-insight ${ins.type}">
      <i class="ai-insight-icon fa-solid ${ins.icon}"></i>
      <div>
        <div class="ai-insight-text">${ins.text}</div>
        <div class="ai-insight-action">
          <i class="fa-solid fa-lightbulb"></i> ${ins.action}
        </div>
      </div>
    </div>
  `).join('');

  // Risk meter
  const riskVal = 28; // 0-100
  const riskBar = document.getElementById('risk-bar');
  const riskScore = document.getElementById('risk-score-val');
  if (riskBar) riskBar.style.width = riskVal + '%';
  if (riskScore) {
    riskScore.textContent = riskVal;
    riskScore.className = 'risk-score ' + (riskVal < 35 ? 'low' : riskVal < 65 ? 'medium' : 'high');
  }
}

// ── System Health ─────────────────────────────────────────────
function updateSystemHealth() {
  const health = [
    { id: 'h-esp32',  icon: '📡', name: 'ESP32',    status: 'ok',   label: 'Online' },
    { id: 'h-gps',    icon: '🛰️', name: 'GPS',      status: 'ok',   label: 'Lock: 9 Sats' },
    { id: 'h-temp',   icon: '🌡️', name: 'Temp Sensor', status: 'ok', label: 'Active' },
    { id: 'h-door',   icon: '🚪', name: 'Door Sensor', status: 'ok', label: 'Connected' },
    { id: 'h-fb',     icon: '🔥', name: 'Firebase', status: DEMO_MODE ? 'warn' : 'ok', label: DEMO_MODE ? 'Demo Mode' : 'Connected' },
    { id: 'h-server', icon: '☁️', name: 'Server',   status: 'ok',   label: 'API Online' },
  ];

  const container = document.getElementById('system-health-grid');
  if (!container) return;
  container.innerHTML = health.map(h => `
    <div class="health-item">
      <div class="health-icon">${h.icon}</div>
      <div class="health-name">${h.name}</div>
      <div class="health-status ${h.status}">${h.label}</div>
    </div>
  `).join('');

  const overall = document.getElementById('overall-status-badge');
  if (overall) {
    overall.textContent = 'SYSTEM SAFE';
    overall.className = 'overall-badge safe';
  }
}

// ── Door Log Initialize ───────────────────────────────────────
setTimeout(() => renderDoorLog(), 100);

// ── Firebase Real-Time Listeners (activate when DEMO_MODE = false) ────
function attachFirebaseListeners() {
  if (DEMO_MODE || !rtdb) return;

  // Realtime Database single listener on vaccineBox
  rtdb.ref("vaccineBox").on("value", snapshot => {
    const data = snapshot.val();
    console.log("Firebase Data Received:", data);

    if (data) {
      // 1. Update live temperature & gauge
      if (data.temperature !== undefined && data.temperature !== null) {
        currentTemp = parseFloat(data.temperature);
        updateTempDisplay(currentTemp);
        if (typeof addTempToChart === 'function') {
          addTempToChart(currentTemp);
        }
      }

      // 2. Update door status
      if (data.door !== undefined && data.door !== null) {
        setDoorStatus(data.door === "OPEN" ? "open" : "closed");
      }

      // 3. Update GPS marker & map overlay
      if (data.latitude !== undefined && data.longitude !== undefined) {
        if (vehicleMarker) {
          vehicleMarker.setLatLng([data.latitude, data.longitude]);
        }
        if (typeof updateMapOverlay === 'function') {
          updateMapOverlay(data.latitude, data.longitude);
        }
      }

      // 4. Update timestamp display
      let timeStr = "";
      if (data.timestamp) {
        if (data.timestamp > 1000000000 && data.timestamp < 10000000000) {
          timeStr = new Date(data.timestamp * 1000).toLocaleTimeString('en-IN');
        } else if (data.timestamp > 1000000000000) {
          timeStr = new Date(data.timestamp).toLocaleTimeString('en-IN');
        } else {
          timeStr = data.timestamp.toString();
        }
      } else {
        timeStr = new Date().toLocaleTimeString('en-IN');
      }
      const vUpdated = document.getElementById('v-updated');
      if (vUpdated) vUpdated.textContent = timeStr;

      // 5. Update fleet table data for VB-001
      if (typeof FLEET_DATA !== 'undefined') {
        const mainBox = FLEET_DATA.find(b => b.id === 'VB-001');
        if (mainBox) {
          if (data.temperature !== undefined) mainBox.temp = parseFloat(data.temperature);
          if (data.door !== undefined) mainBox.door = data.door === "OPEN" ? "open" : "closed";
          if (typeof VACCINE_CATALOG !== 'undefined' && VACCINE_CATALOG[mainBox.vaccine]) {
            const vc = VACCINE_CATALOG[mainBox.vaccine];
            const isSafe = mainBox.temp >= vc.min && mainBox.temp <= vc.max;
            const isAlert = mainBox.temp < (vc.min - 1.5) || mainBox.temp > (vc.max + 1.5);
            mainBox.status = isSafe ? 'safe' : isAlert ? 'alert' : 'warning';
          }
          if (typeof renderFleetTable === 'function') {
            renderFleetTable();
          }
        }
      }
    }
  });

  // Alerts collection
  rtdb.ref('alerts').orderByChild('timestamp').limitToLast(20).on('child_added', snap => {
    const alert = snap.val();
    if (alert) pushAlert(alert.type || 'temp_high', alert.desc);
  });

  console.log('✅ Firebase real-time listeners attached');
}


