// ============================================================
// MAPS.JS — Leaflet.js Interactive GPS Map
// ============================================================

let leafletMap = null;
let vehicleMarker = null;
let routePolyline = null;
let geofenceCircle = null;
let tileLayer = null;
let routeIndex = 0;
let mapAnimInterval = null;

// ── Route Waypoints (Delhi → Hospital Demo) ─────────────────
const ROUTE_WAYPOINTS = [
  { lat: 28.6448, lng: 77.2167, name: "Central Vaccine Warehouse", type: "warehouse" },
  { lat: 28.6292, lng: 77.2182, name: "Regional Distribution Hub", type: "hub" },
  { lat: 28.6139, lng: 77.2090, name: "Cold Chain Checkpoint", type: "checkpoint" },
  { lat: 28.5985, lng: 77.2178, name: "AIIMS Hospital", type: "hospital" },
  { lat: 28.5921, lng: 77.2100, name: "PHC Vaccination Center", type: "center" },
];

const GEOFENCE_RADIUS_KM = 2.5;

// ── Custom Marker SVG ────────────────────────────────────────
function vehicleIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:36px;height:36px;
      background:linear-gradient(135deg,#1565c0,#00bcd4);
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      box-shadow:0 0 20px rgba(0,188,212,.6);
      border:3px solid #fff;
      display:flex;align-items:center;justify-content:center;
    "><span style="transform:rotate(45deg);font-size:14px;">🚛</span></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });
}

function waypointIcon(type, active = false) {
  const icons = { warehouse:'🏭', hub:'📦', checkpoint:'🔰', hospital:'🏥', center:'💉' };
  const colors = { warehouse:'#1565c0', hub:'#00bcd4', checkpoint:'#ff9800', hospital:'#f44336', center:'#00e676' };
  const color = colors[type] || '#42a5f5';
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${active?'32':'26'}px;height:${active?'32':'26'}px;
      background:${color}22;
      border:2px solid ${color};
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:${active?'14':'11'}px;
      box-shadow:0 0 ${active?'14':'6'}px ${color}66;
      transition:all .3s;
    ">${icons[type] || '📍'}</div>`,
    iconSize: [active ? 32 : 26, active ? 32 : 26],
    iconAnchor: [(active ? 32 : 26) / 2, (active ? 32 : 26) / 2],
  });
}

// ── Initialize Map ───────────────────────────────────────────
function initMap() {
  if (leafletMap) return;

  leafletMap = L.map('leaflet-map', {
    zoomControl: true,
    attributionControl: false,
  }).setView([ROUTE_WAYPOINTS[1].lat, ROUTE_WAYPOINTS[1].lng], 13);

  // Theme-aware tile layer
  const isLight = document.body.classList.contains('light-theme');
  tileLayer = L.tileLayer(
    isLight 
      ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', 
    {
      maxZoom: 19,
      attribution: '© CartoDB'
    }
  ).addTo(leafletMap);

  // Attribution custom
  L.control.attribution({ prefix: '© CartoDB | OpenStreetMap' }).addTo(leafletMap);

  // Draw route polyline
  const routeCoords = ROUTE_WAYPOINTS.map(wp => [wp.lat, wp.lng]);
  routePolyline = L.polyline(routeCoords, {
    color: '#42a5f5',
    weight: 3.5,
    opacity: .75,
    dashArray: '8 6',
    lineJoin: 'round',
  }).addTo(leafletMap);

  // Completed portion overlay
  L.polyline(routeCoords.slice(0, 2), {
    color: '#00e676',
    weight: 4,
    opacity: .85,
  }).addTo(leafletMap);

  // Waypoint markers
  ROUTE_WAYPOINTS.forEach((wp, idx) => {
    const active = idx === 1; // currently at hub
    const marker = L.marker([wp.lat, wp.lng], { icon: waypointIcon(wp.type, active) }).addTo(leafletMap);
    marker.bindPopup(`
      <div style="font-family:Inter,sans-serif;padding:4px 0;">
        <strong style="color:#42a5f5;">${wp.name}</strong><br>
        <span style="font-size:.75rem;color:#8bacc8;">
          ${wp.lat.toFixed(4)}°N, ${wp.lng.toFixed(4)}°E
        </span>
      </div>
    `, { className: 'dark-popup', closeButton: false });
  });

  // Geofence circle around current location
  geofenceCircle = L.circle(
    [ROUTE_WAYPOINTS[1].lat, ROUTE_WAYPOINTS[1].lng],
    {
      radius: GEOFENCE_RADIUS_KM * 1000,
      color: '#1e88e5',
      weight: 1.5,
      opacity: .4,
      fillColor: '#42a5f5',
      fillOpacity: .05,
      dashArray: '6 4',
    }
  ).addTo(leafletMap);

  // Vehicle marker at initial position
  const startPos = interpolatePosition(ROUTE_WAYPOINTS[0], ROUTE_WAYPOINTS[1], .6);
  vehicleMarker = L.marker([startPos.lat, startPos.lng], { icon: vehicleIcon() })
    .addTo(leafletMap)
    .bindPopup(`
      <div style="font-family:Inter,sans-serif;">
        <strong style="color:#42a5f5;">Vaccine Transport Vehicle</strong><br>
        <span style="font-size:.75rem;color:#8bacc8;">Speed: 42 km/h · ETA: 35 min</span>
      </div>
    `);

  // Animate vehicle (only in DEMO MODE)
  if (DEMO_MODE) {
    startVehicleAnimation();
  }

  // Fit bounds
  leafletMap.fitBounds(routePolyline.getBounds(), { padding: [40, 40] });

  // Update map overlay info
  updateMapOverlay(startPos.lat, startPos.lng);
}

function interpolatePosition(a, b, t) {
  return {
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t,
  };
}

function startVehicleAnimation() {
  if (mapAnimInterval) clearInterval(mapAnimInterval);
  let t = 0.6; // start midway between wp 0 and 1
  let segStart = 0; let segEnd = 1;

  mapAnimInterval = setInterval(() => {
    t += 0.002;
    if (t >= 1) {
      t = 0;
      segStart = (segStart + 1) % (ROUTE_WAYPOINTS.length - 1);
      segEnd   = segStart + 1;
    }

    const pos = interpolatePosition(ROUTE_WAYPOINTS[segStart], ROUTE_WAYPOINTS[segEnd], t);
    if (vehicleMarker) vehicleMarker.setLatLng([pos.lat, pos.lng]);

    // Update sidebar
    updateMapOverlay(pos.lat, pos.lng);
    updateVehicleStats(pos);
  }, 200);
}

function updateMapOverlay(lat, lng) {
  const el = document.getElementById('map-coords');
  if (el) el.textContent = `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
  const addr = document.getElementById('map-address');
  if (addr) addr.textContent = 'En route to AIIMS Hospital, New Delhi';
}

function updateVehicleStats(pos) {
  // Simulated vehicle stats
  const speed = (38 + Math.random() * 12).toFixed(0);
  const dist  = (12.4 + Math.random() * .1).toFixed(1);
  const eta   = Math.floor(28 + Math.random() * 6);

  setEl('v-speed',   speed + ' km/h');
  setEl('v-dist',    dist  + ' km');
  setEl('v-eta',     eta   + ' min');
  setEl('v-updated', new Date().toLocaleTimeString('en-IN'));
}

function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function updateMapTileLayer(theme) {
  if (!leafletMap || !tileLayer) return;
  const url = theme === 'light'
    ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  tileLayer.setUrl(url);
}
