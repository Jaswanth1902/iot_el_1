// ============================================================
// CHARTS.JS — Temperature Trend & Analytics Charts
// ============================================================

let tempChart = null;
let currentRange = '1h';

// ── Data Generators ────────────────────────────────────────
function generateTempData(range, vaccine) {
  const config = VACCINE_CATALOG[vaccine] || VACCINE_CATALOG['Covaxin'];
  const { min, max } = config;
  const mid = (min + max) / 2;

  const points = { '1h': 60, '6h': 72, '24h': 96, '7d': 84 }[range];
  const labels = [];
  const data   = [];
  const now = new Date();

  const totalMinutes = { '1h': 60, '6h': 360, '24h': 1440, '7d': 10080 }[range];
  const step = totalMinutes / points;

  for (let i = points - 1; i >= 0; i--) {
    const t = new Date(now - i * step * 60000);
    labels.push(formatChartLabel(t, range));

    // Simulate realistic temperature variation
    const noise = (Math.random() - .5) * (max - min) * .4;
    const drift = Math.sin(i / (points / 6)) * ((max - min) * .15);
    let val = mid + noise + drift;

    // Occasionally spike outside range for realism
    if (Math.random() < .03) val = max + Math.random() * 2.5;

    val = Math.round(val * 10) / 10;
    data.push(val);
  }
  return { labels, data, min, max };
}

function formatChartLabel(date, range) {
  if (range === '1h')  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  if (range === '6h')  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  if (range === '24h') return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  if (range === '7d')  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  return '';
}

// ── Create / Update Temperature Chart ──────────────────────
function initTempChart(range, vaccine) {
  const { labels, data, min, max } = generateTempData(range, vaccine);
  const ctx = document.getElementById('tempChart').getContext('2d');

  const styles = getComputedStyle(document.body);
  const normalColor = styles.getPropertyValue('--clr-blue').trim() || '#6B8EA8';
  const alertColor = styles.getPropertyValue('--clr-red').trim() || '#C96868';
  const warningColor = styles.getPropertyValue('--clr-orange').trim() || '#DEB059';
  const textColor = styles.getPropertyValue('--clr-text').trim() || '#2E2721';
  const axisColor = styles.getPropertyValue('--clr-text-dim').trim() || '#5E5247';
  const gridColor = styles.getPropertyValue('--clr-border').trim() || '#E4D8C7';
  const tooltipBg = styles.getPropertyValue('--clr-card').trim() || '#FFFFFF';
  const tooltipBorder = styles.getPropertyValue('--clr-shadow').trim() || '#2E2721';

  const pointColors = data.map(v => (v < min || v > max) ? alertColor : normalColor);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Temperature (°C)',
        data,
        fill: true,
        backgroundColor: normalColor + '15', // Flat 8% opacity fill
        borderColor: normalColor,
        borderWidth: 3,
        tension: .4,
        pointBackgroundColor: pointColors,
        pointBorderColor: 'transparent',
        pointRadius: data.map(v => (v < min || v > max) ? 5 : 3),
        pointHoverRadius: 6,
      },
      {
        label: `Max Safe (${max}°C)`,
        data: Array(data.length).fill(max),
        borderColor: alertColor,
        borderWidth: 2,
        borderDash: [6, 6],
        fill: false,
        pointRadius: 0,
        tension: 0,
      },
      {
        label: `Min Safe (${min}°C)`,
        data: Array(data.length).fill(min),
        borderColor: warningColor,
        borderWidth: 2,
        borderDash: [6, 6],
        fill: false,
        pointRadius: 0,
        tension: 0,
      }
    ]
  };

  if (tempChart) {
    tempChart.data = chartData;
    tempChart.options.plugins.legend.labels.color = textColor;
    tempChart.options.plugins.tooltip.backgroundColor = tooltipBg;
    tempChart.options.plugins.tooltip.bodyColor = axisColor;
    tempChart.options.plugins.tooltip.titleColor = textColor;
    tempChart.options.plugins.tooltip.borderColor = tooltipBorder;
    tempChart.options.scales.x.ticks.color = axisColor;
    tempChart.options.scales.x.grid.color = gridColor;
    tempChart.options.scales.y.ticks.color = axisColor;
    tempChart.options.scales.y.grid.color = gridColor;
    
    tempChart.update('active');
    return;
  }

  tempChart = new Chart(ctx, {
    type: 'line',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            color: textColor,
            font: { size: 11, family: 'Outfit' },
            boxWidth: 14,
            padding: 10,
          }
        },
        tooltip: {
          backgroundColor: tooltipBg,
          titleColor: textColor,
          bodyColor: axisColor,
          borderColor: tooltipBorder,
          borderWidth: 2,
          padding: 10,
          callbacks: {
            label: ctx => {
              const v = ctx.raw;
              const [mn, mx] = [min, max];
              const status = (v < mn || v > mx) ? ' ⚠ OUT OF RANGE' : ' ✓ Safe';
              return ` ${ctx.dataset.label}: ${v}°C${ctx.datasetIndex === 0 ? status : ''}`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: axisColor, font: { size: 10, family: 'Outfit' }, maxTicksLimit: 10 },
          grid: { color: gridColor },
        },
        y: {
          ticks: { color: axisColor, font: { size: 10, family: 'Outfit' }, callback: v => `${v}°C` },
          grid: { color: gridColor },
        }
      }
    }
  });
}

function updateTempChart(range, vaccine) {
  currentRange = range;
  initTempChart(range, vaccine);
}

// ── Mini Sparkline for KPI Cards ───────────────────────────
let miniCharts = {};
function initMiniChart(canvasId, color = '#6B8EA8') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const pts = Array.from({ length: 12 }, () => Math.random() * 30 + 50);

  miniCharts[canvasId] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: pts.map((_, i) => i),
      datasets: [{ data: pts, borderColor: color, borderWidth: 2, fill: true, backgroundColor: color + '15', pointRadius: 0, tension: .4 }]
    },
    options: {
      responsive: false, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { display: false }, y: { display: false } },
      animation: { duration: 600 }
    }
  });
}

function updateChartsTheme(theme) {
  if (!tempChart) return;
  const styles = getComputedStyle(document.body);
  const textColor = styles.getPropertyValue('--clr-text').trim();
  const axisColor = styles.getPropertyValue('--clr-text-dim').trim();
  const gridColor = styles.getPropertyValue('--clr-border').trim();
  const tooltipBg = styles.getPropertyValue('--clr-card').trim();
  const tooltipBorder = styles.getPropertyValue('--clr-shadow').trim();
  
  tempChart.options.plugins.legend.labels.color = textColor;
  tempChart.options.plugins.tooltip.backgroundColor = tooltipBg;
  tempChart.options.plugins.tooltip.bodyColor = axisColor;
  tempChart.options.plugins.tooltip.titleColor = textColor;
  tempChart.options.plugins.tooltip.borderColor = tooltipBorder;
  
  tempChart.options.scales.x.ticks.color = axisColor;
  tempChart.options.scales.x.grid.color = gridColor;
  tempChart.options.scales.y.ticks.color = axisColor;
  tempChart.options.scales.y.grid.color = gridColor;
  
  tempChart.update();
}

// ── Append Live Temperature to Chart ───────────────────────
function addTempToChart(temp) {
  if (!tempChart) return;
  const now = new Date();
  const label = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  
  // Add new data point
  tempChart.data.labels.push(label);
  tempChart.data.datasets[0].data.push(temp);
  
  // Shift old points if we exceed 20 points
  if (tempChart.data.labels.length > 20) {
    tempChart.data.labels.shift();
    tempChart.data.datasets[0].data.shift();
  }
  
  // Update point colors depending on safety threshold
  const vc = VACCINE_CATALOG[currentVaccine];
  const alertColor = 'rgba(244,67,54,.7)';
  const normalColor = 'rgba(66,165,245,1)';
  
  tempChart.data.datasets[0].pointBackgroundColor = tempChart.data.datasets[0].data.map(
    v => (v < vc.min || v > vc.max) ? alertColor : normalColor
  );
  tempChart.data.datasets[0].pointRadius = tempChart.data.datasets[0].data.map(
    v => (v < vc.min || v > vc.max) ? 5 : 3
  );
  
  // Keep boundaries lines matching current dataset length
  tempChart.data.datasets[1].data = Array(tempChart.data.datasets[0].data.length).fill(vc.max);
  tempChart.data.datasets[2].data = Array(tempChart.data.datasets[0].data.length).fill(vc.min);
  
  tempChart.update();
}
