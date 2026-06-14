// ============================================================
// FLEET.JS — Fleet Overview Table Management & Filtering
// ============================================================

const FLEET_DATA = [
  { id: 'VB-001', vaccine: 'Covaxin', temp: 4.6, status: 'safe', location: 'En route to AIIMS', driver: 'Rajesh Kumar', eta: '35 min', door: 'closed', battery: 18 },
  { id: 'VB-002', vaccine: 'Covishield', temp: 5.2, status: 'safe', location: 'Central Warehouse', driver: 'Amit Singh', eta: 'Arrived', door: 'closed', battery: 92 },
  { id: 'VB-003', vaccine: 'OPV', temp: -15.4, status: 'safe', location: 'En route NH-48', driver: 'Vijay Yadav', eta: '1h 10m', door: 'closed', battery: 45 },
  { id: 'VB-004', vaccine: 'BCG', temp: 1.2, status: 'alert', location: 'Sector 62 Hub', driver: 'Sanjay Dutt', eta: 'Delayed', door: 'open', battery: 82 },
  { id: 'VB-005', vaccine: 'Hepatitis B', temp: 6.1, status: 'safe', location: 'AIIMS Hospital', driver: 'Vikram Singh', eta: 'Arrived', door: 'closed', battery: 88 },
  { id: 'VB-006', vaccine: 'Rotavirus', temp: 9.8, status: 'alert', location: 'NH-48 Checkpoint', driver: 'Pankaj Kumar', eta: '50 min', door: 'closed', battery: 12 },
  { id: 'VB-007', vaccine: 'MMR', temp: -8.5, status: 'alert', location: 'Airport Cargo', driver: 'Sunil Sharma', eta: '2h 15m', door: 'closed', battery: 67 },
  { id: 'VB-008', vaccine: 'Pentavalent', temp: 4.2, status: 'safe', location: 'Sector 15 Hub', driver: 'Anil Gupta', eta: '15 min', door: 'closed', battery: 55 },
  { id: 'VB-009', vaccine: 'Covaxin', temp: 7.9, status: 'warning', location: 'En route NH-48', driver: 'Deepak Rao', eta: '1h 40m', door: 'closed', battery: 34 },
  { id: 'VB-010', vaccine: 'Covishield', temp: 3.5, status: 'safe', location: 'Apollo Hospital', driver: 'Manish Kumar', eta: 'Arrived', door: 'closed', battery: 79 },
  { id: 'VB-011', vaccine: 'OPV', temp: -12.1, status: 'safe', location: 'Warehouse Delhi', driver: 'Rakesh Roshan', eta: 'Arrived', door: 'closed', battery: 94 },
  { id: 'VB-012', vaccine: 'BCG', temp: 4.9, status: 'safe', location: 'Max Hospital', driver: 'Suresh Raina', eta: 'Arrived', door: 'closed', battery: 81 }
];

let currentFleetFilter = 'all';

function initFleetTable() {
  renderFleetTable();
  // Set up periodic temp updates for mock fleet
  if (DEMO_MODE) {
    setInterval(() => {
      FLEET_DATA.forEach(box => {
        // Sync VB-001 (which is the main tracked vaccine container) with the main currentTemp/currentVaccine/doorOpen
        if (box.id === 'VB-001') {
          box.temp = typeof currentTemp !== 'undefined' ? currentTemp : box.temp;
          box.vaccine = typeof currentVaccine !== 'undefined' ? currentVaccine : box.vaccine;
          box.door = typeof doorOpen !== 'undefined' ? (doorOpen ? 'open' : 'closed') : box.door;
          
          if (typeof VACCINE_CATALOG !== 'undefined' && VACCINE_CATALOG[box.vaccine]) {
            const vc = VACCINE_CATALOG[box.vaccine];
            const isSafe = box.temp >= vc.min && box.temp <= vc.max;
            const isAlert = box.temp < (vc.min - 1.5) || box.temp > (vc.max + 1.5);
            box.status = isSafe ? 'safe' : isAlert ? 'alert' : 'warning';
          }
        } else {
          // Drifts for other boxes
          const drift = (Math.random() - 0.5) * 0.2;
          box.temp = Math.round((box.temp + drift) * 10) / 10;
          // Keep OPV/MMR frozen, others refrigerated
          if (box.vaccine === 'OPV' || box.vaccine === 'MMR') {
            if (box.temp > -10) box.status = 'warning';
            if (box.temp > -8.5) box.status = 'alert';
            if (box.temp <= -10) box.status = 'safe';
          } else {
            if (box.temp > 8 || box.temp < 2) {
              box.status = 'warning';
            }
            if (box.temp > 9.5 || box.temp < 0.5) {
              box.status = 'alert';
            }
            if (box.temp >= 2 && box.temp <= 8) {
              box.status = 'safe';
            }
          }
        }
      });
      renderFleetTable();
    }, 5000);
  }
}

function renderFleetTable() {
  const tbody = document.getElementById('fleet-tbody');
  if (!tbody) return;

  const filtered = FLEET_DATA.filter(box => {
    if (currentFleetFilter === 'all') return true;
    if (currentFleetFilter === 'safe') return box.status === 'safe';
    if (currentFleetFilter === 'alert') return box.status === 'alert' || box.status === 'warning';
    if (currentFleetFilter === 'transit') return box.eta !== 'Arrived';
    return true;
  });

  tbody.innerHTML = filtered.map(box => {
    const statusPillClass = box.status;
    const statusPillText = box.status.toUpperCase();
    const tempDotClass = box.status;
    const doorIcon = box.door === 'open' ? '🔓' : '🔒';
    const doorColor = box.door === 'open' ? 'var(--clr-red-lt)' : 'var(--clr-green)';

    return `
      <tr>
        <td class="mono" style="font-weight:700;color:var(--clr-blue-bright);">${box.id}</td>
        <td>${box.vaccine}</td>
        <td>
          <div class="temp-indicator">
            <span class="temp-dot ${tempDotClass}"></span>
            <span class="mono">${box.temp.toFixed(1)}°C</span>
          </div>
        </td>
        <td>
          <span class="box-status-pill ${statusPillClass}">${statusPillText}</span>
        </td>
        <td>${box.location}</td>
        <td>${box.driver}</td>
        <td>${box.eta}</td>
        <td style="color:${doorColor};font-size:1.1rem;text-align:center;">${doorIcon}</td>
        <td>
          <div style="display:flex;align-items:center;gap:.3rem;">
            <span class="mono" style="font-size:.7rem;color:${box.battery < 20 ? 'var(--clr-red-lt)' : 'inherit'};">${box.battery}%</span>
            <div class="mini-progress" style="width:30px;margin:0;height:3px;">
              <div class="mini-progress-bar" style="width:${box.battery}%;background:${box.battery < 20 ? 'var(--clr-red)' : 'var(--clr-green)'};"></div>
            </div>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterFleet(type, btn) {
  currentFleetFilter = type;
  if (btn) {
    const parent = btn.parentElement;
    parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  renderFleetTable();
}

function refreshFleetTable() {
  if (typeof showNotification === 'function') {
    showNotification({
      type: 'Fleet Sync',
      icon: 'fa-rotate',
      desc: 'Fleet telemetry data updated successfully.',
      priority: 'low'
    });
  }
  // Add slight randomized variations
  FLEET_DATA.forEach(box => {
    if (box.id !== 'VB-001') {
      box.temp = Math.round((box.temp + (Math.random() - 0.5) * 0.4) * 10) / 10;
      if (box.battery > 0 && Math.random() < 0.2) box.battery -= 1;
    }
  });
  renderFleetTable();
}

document.addEventListener('DOMContentLoaded', () => {
  initFleetTable();
});
