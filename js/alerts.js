// ============================================================
// ALERTS.JS — Alert Engine, Sound, Notifications
// ============================================================

const ALERTS_DATA = [];
let alertIdCounter = 1;
let sirenAudio = null;
let sirenPlaying = false;

// ── Alert Definitions ───────────────────────────────────────
const ALERT_TEMPLATES = {
  temp_high: {
    type: 'Temperature Alert',
    icon: 'fa-thermometer-full',
    priority: 'critical',
    desc: 'Temperature exceeded safe upper limit',
    action: 'Activate backup refrigeration immediately',
  },
  temp_low: {
    type: 'Temperature Alert',
    icon: 'fa-thermometer-empty',
    priority: 'high',
    desc: 'Temperature dropped below safe lower limit',
    action: 'Check refrigeration unit and insulation',
  },
  door_open: {
    type: 'Door Security Alert',
    icon: 'fa-door-open',
    priority: 'critical',
    desc: 'Unauthorized vaccine box access detected',
    action: 'Verify with driver and log access event',
  },
  gps_deviation: {
    type: 'GPS Route Deviation',
    icon: 'fa-route',
    priority: 'high',
    desc: 'Vehicle has deviated from approved cold chain route',
    action: 'Contact driver and reroute to approved path',
  },
  sensor_failure: {
    type: 'Sensor Failure',
    icon: 'fa-exclamation-triangle',
    priority: 'high',
    desc: 'Temperature sensor 2 reporting intermittent readings',
    action: 'Switch to backup sensor and schedule maintenance',
  },
  battery_low: {
    type: 'Battery Alert',
    icon: 'fa-battery-quarter',
    priority: 'medium',
    desc: 'Device battery level at 18% — charge required soon',
    action: 'Connect to vehicle power supply',
  },
  internet_loss: {
    type: 'Connectivity Alert',
    icon: 'fa-wifi',
    priority: 'medium',
    desc: 'Internet connection lost for 3 minutes — data syncing paused',
    action: 'Check SIM card and mobile data settings',
  },
  cold_chain_ok: {
    type: 'Cold Chain Status',
    icon: 'fa-check-circle',
    priority: 'low',
    desc: 'Cold chain integrity maintained — all parameters normal',
    action: 'No action required',
  },
};

// ── Pre-populated Demo Alerts ───────────────────────────────
const DEMO_ALERTS = [
  { ...ALERT_TEMPLATES.temp_high, time: minsAgo(3),  resolved: false, id: 1 },
  { ...ALERT_TEMPLATES.door_open, time: minsAgo(12), resolved: false, id: 2 },
  { ...ALERT_TEMPLATES.gps_deviation, time: minsAgo(28), resolved: true, id: 3, priority: 'high' },
  { ...ALERT_TEMPLATES.battery_low, time: minsAgo(45), resolved: false, id: 4 },
  { ...ALERT_TEMPLATES.internet_loss, time: minsAgo(67), resolved: true, id: 5 },
  { ...ALERT_TEMPLATES.sensor_failure, time: minsAgo(90), resolved: false, id: 6 },
  { ...ALERT_TEMPLATES.cold_chain_ok, time: minsAgo(120), resolved: true, id: 7 },
];

function minsAgo(mins) {
  return new Date(Date.now() - mins * 60000);
}

// ── Initialize Alerts ───────────────────────────────────────
function initAlerts() {
  ALERTS_DATA.push(...DEMO_ALERTS);
  renderAlerts('all');
  startAlertSimulation();
}

// ── Render Alerts ───────────────────────────────────────────
function renderAlerts(filter = 'all') {
  const list = document.getElementById('alerts-list');
  if (!list) return;

  let filtered = [...ALERTS_DATA].sort((a, b) => b.time - a.time);
  if (filter === 'critical') filtered = filtered.filter(a => a.priority === 'critical');
  if (filter === 'unresolved') filtered = filtered.filter(a => !a.resolved);
  if (filter === 'temperature') filtered = filtered.filter(a => a.type.includes('Temperature'));
  if (filter === 'door') filtered = filtered.filter(a => a.type.includes('Door'));
  if (filter === 'gps') filtered = filtered.filter(a => a.type.includes('GPS'));

  list.innerHTML = filtered.map(alert => `
    <div class="alert-item ${alert.resolved ? 'resolved' : alert.priority}"
         onclick="toggleAlertResolved(${alert.id})">
      <div>
        <span class="alert-priority-badge">
          ${alert.resolved ? '✓ Resolved' : alert.priority.toUpperCase()}
        </span>
      </div>
      <div class="alert-body">
        <div class="alert-type">
          <i class="fa-solid ${alert.icon}" style="margin-right:.35rem;"></i>${alert.type}
        </div>
        <div class="alert-desc">${alert.desc}</div>
        <div class="alert-action">
          <i class="fa-solid fa-arrow-right"></i> ${alert.action}
        </div>
      </div>
      <div class="alert-time">${formatAlertTime(alert.time)}</div>
    </div>
  `).join('') || '<div style="text-align:center;color:var(--clr-text-muted);padding:2rem;font-size:.8rem;">No alerts matching filter</div>';

  // Update alert count badge
  const unresolved = ALERTS_DATA.filter(a => !a.resolved).length;
  const badge = document.getElementById('alert-count-badge');
  if (badge) {
    badge.textContent = unresolved;
    badge.style.display = unresolved > 0 ? 'inline-flex' : 'none';
  }
}

function formatAlertTime(date) {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function toggleAlertResolved(id) {
  const alert = ALERTS_DATA.find(a => a.id === id);
  if (alert) {
    alert.resolved = !alert.resolved;
    renderAlerts(window.currentAlertFilter || 'all');
  }
}

// ── Push New Alert ──────────────────────────────────────────
function pushAlert(templateKey, customMsg = null) {
  const template = ALERT_TEMPLATES[templateKey];
  if (!template) return;
  const newAlert = {
    ...template,
    desc: customMsg || template.desc,
    time: new Date(),
    resolved: false,
    id: ++alertIdCounter + 100,
  };
  ALERTS_DATA.unshift(newAlert);
  renderAlerts(window.currentAlertFilter || 'all');
  showNotification(newAlert);

  if (newAlert.priority === 'critical') triggerSiren();
}

// ── In-App Notification ─────────────────────────────────────
function showNotification(alert) {
  const container = document.getElementById('notification-container');
  if (!container) return;

  const level = alert.priority === 'critical' ? 'critical' :
                alert.priority === 'high'     ? 'warning'  : 'info';

  const div = document.createElement('div');
  div.className = `notification ${level}`;
  div.innerHTML = `
    <i class="notif-icon fa-solid ${alert.icon}"></i>
    <div>
      <div class="notif-title">${alert.type}</div>
      <div class="notif-msg">${alert.desc}</div>
    </div>
    <button class="notif-close" onclick="dismissNotification(this.parentElement)">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;
  container.appendChild(div);
  setTimeout(() => dismissNotification(div), 7000);
}

function dismissNotification(el) {
  if (!el || !el.parentElement) return;
  el.classList.add('out');
  setTimeout(() => el.remove(), 320);
}

// ── Siren Sound ─────────────────────────────────────────────
function triggerSiren() {
  if (sirenPlaying) return;
  sirenPlaying = true;

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.value = .15;
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + .4);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + .8);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 1.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.5);
    osc.onended = () => { sirenPlaying = false; };
  } catch(e) {
    sirenPlaying = false;
  }

  // Red flashing on door card
  const doorCard = document.getElementById('door-status-card');
  if (doorCard) {
    doorCard.style.animation = 'red-flash .5s ease-in-out 4';
    setTimeout(() => doorCard.style.animation = '', 2100);
  }
}

// ── Simulate Random Alerts in Demo ─────────────────────────
function startAlertSimulation() {
  if (!DEMO_MODE) return;
  // Trigger a door alert after 20 sec
  setTimeout(() => {
    pushAlert('door_open');
    setDoorStatus('open');
  }, 20000);

  // Trigger temp alert after 45 sec
  setTimeout(() => {
    pushAlert('temp_high', 'Temperature reached 9.2°C — exceeding 8°C safe limit');
  }, 45000);

  // Battery warning after 80 sec
  setTimeout(() => {
    pushAlert('battery_low');
  }, 80000);
}
