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
let travelledPath = [];
let travelledPolyline = null;

// ── Route Waypoints (Bangalore JP Nagar → Banashankari Demo) ─────────────────
const ROUTE_WAYPOINTS = [
  { lat: 12.9100, lng: 77.5200, name: "Central Vaccine Warehouse", type: "warehouse" },
  { lat: 12.9130, lng: 77.5100, name: "Regional Distribution Hub", type: "hub" },
  { lat: 12.9170, lng: 77.5000, name: "Cold Chain Checkpoint", type: "checkpoint" },
  { lat: 12.9200, lng: 77.4900, name: "AIIMS Hospital", type: "hospital" },
];

const GEOFENCE_RADIUS_KM = 2.5;

// ── Custom Marker SVG ────────────────────────────────────────
function vehicleIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:44px;height:44px;
      display:flex;align-items:center;justify-content:center;
      filter: drop-shadow(3px 3px 0px #2E2721);
    ">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Truck body -->
        <rect x="2" y="10" width="24" height="20" rx="3" fill="#6B8EA8" />
        <rect x="26" y="16" width="12" height="14" rx="2" fill="#4E738E" />
        <!-- Window -->
        <rect x="28" y="18" width="8" height="6" rx="1" fill="#FCF8F2" />
        <!-- Wheels -->
        <circle cx="8" cy="30" r="4" fill="#2E2721" />
        <circle cx="30" cy="30" r="4" fill="#2E2721" />
      </svg>
    </div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

function waypointIcon(type, active = false) {
  const icons = { warehouse:'🏭', hub:'📦', checkpoint:'🔰', hospital:'🏥', center:'💉' };
  const colors = { warehouse:'#6B8EA8', hub:'#6FAAA3', checkpoint:'#DEB059', hospital:'#C96868', center:'#7BA582' };
  const color = colors[type] || '#6B8EA8';
  const size = active ? 36 : 28;
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:${active?'15':'12'}px;
      box-shadow: 3px 3px 0px #2E2721;
      border: 2px solid #2E2721;
      transition: all .2s;
    ">${icons[type] || '📍'}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// ── Initialize Map ───────────────────────────────────────────
function initMap() {
  if (leafletMap) return;

  leafletMap = L.map('leaflet-map', {
    zoomControl: true,
    attributionControl: false,
  }).setView([ROUTE_WAYPOINTS[0].lat, ROUTE_WAYPOINTS[0].lng], 13);

  // Theme-aware tile layer
  const isLight = document.body.classList.contains('light-theme');
  tileLayer = L.tileLayer(
    isLight 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' 
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', 
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
    color: '#2E2721', // Dark solid route line
    weight: 4,
    opacity: .85,
    dashArray: '8 8',
    lineJoin: 'round',
  }).addTo(leafletMap);

  // Completed portion overlay (traveled path tracked dynamically)
  travelledPath = [[ROUTE_WAYPOINTS[0].lat, ROUTE_WAYPOINTS[0].lng]];
  travelledPolyline = L.polyline(travelledPath, {
    color: '#7BA582', // Sage green completed path
    weight: 5,
    opacity: .95,
  }).addTo(leafletMap);

  // Waypoint markers
  ROUTE_WAYPOINTS.forEach((wp, idx) => {
    const active = idx === 0; // Jayanagar is active start
    const marker = L.marker([wp.lat, wp.lng], { icon: waypointIcon(wp.type, active) }).addTo(leafletMap);
    marker.bindPopup(`
      <div style="font-family:Outfit,sans-serif;padding:4px 0;font-weight:700;">
        <strong style="color:#4E738E;font-size:0.85rem;">${wp.name}</strong><br>
        <span style="font-size:.72rem;color:#5E5247;font-family:JetBrains Mono;">
          ${wp.lat.toFixed(4)}°N, ${wp.lng.toFixed(4)}°E
        </span>
      </div>
    `, { className: 'dark-popup', closeButton: false });
  });

  // Geofence circle around current location
  geofenceCircle = L.circle(
    [ROUTE_WAYPOINTS[0].lat, ROUTE_WAYPOINTS[0].lng],
    {
      radius: GEOFENCE_RADIUS_KM * 1000,
      color: '#6B8EA8',
      weight: 2,
      opacity: .6,
      fillColor: '#6B8EA8',
      fillOpacity: .1,
      dashArray: '6 6',
    }
  ).addTo(leafletMap);

  // Vehicle marker at initial position (Jayanagar start)
  const startPos = { lat: ROUTE_WAYPOINTS[0].lat, lng: ROUTE_WAYPOINTS[0].lng };
  vehicleMarker = L.marker([startPos.lat, startPos.lng], { icon: vehicleIcon() })
    .addTo(leafletMap)
    .bindPopup(`
      <div style="font-family:Outfit,sans-serif;font-weight:700;">
        <strong style="color:#4E738E;font-size:0.85rem;">Vaccine Transport</strong><br>
        <span style="font-size:.72rem;color:#5E5247;">Speed: 42 km/h · ETA: 35 min</span>
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
  let t = 0.0;
  let segStart = 0; let segEnd = 1;

  mapAnimInterval = setInterval(() => {
    t += 0.005;
    if (t >= 1) {
      t = 0;
      segStart = (segStart + 1) % (ROUTE_WAYPOINTS.length - 1);
      segEnd   = segStart + 1;

      // Loop animation: reset travelled path to warehouse start
      if (segStart === 0) {
        travelledPath = [[ROUTE_WAYPOINTS[0].lat, ROUTE_WAYPOINTS[0].lng]];
        if (travelledPolyline) {
          travelledPolyline.setLatLngs(travelledPath);
        }
      }
    }

    const pos = interpolatePosition(ROUTE_WAYPOINTS[segStart], ROUTE_WAYPOINTS[segEnd], t);
    addGpsLocation(pos.lat, pos.lng);
    updateVehicleStats(pos);
  }, 250);
}

function addGpsLocation(lat, lng) {
  if (!leafletMap) return;
  const newLatLng = L.latLng(lat, lng);

  // Avoid duplicate points
  if (travelledPath.length > 0) {
    const last = travelledPath[travelledPath.length - 1];
    if (Math.abs(last[0] - lat) < 0.0001 && Math.abs(last[1] - lng) < 0.0001) {
      return;
    }
  }

  travelledPath.push([lat, lng]);
  if (travelledPolyline) {
    travelledPolyline.addLatLng(newLatLng);
  }
  if (vehicleMarker) {
    vehicleMarker.setLatLng(newLatLng);
  }
  if (geofenceCircle) {
    geofenceCircle.setLatLng(newLatLng);
  }
  updateMapOverlay(lat, lng);
}

function updateMapOverlay(lat, lng) {
  const el = document.getElementById('map-coords');
  if (el) el.textContent = `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
  const addr = document.getElementById('map-address');
  if (addr) addr.textContent = 'En route to AIIMS Hospital, Bangalore';
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
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
  tileLayer.setUrl(url);
}
