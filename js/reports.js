// ============================================================
// REPORTS.JS — PDF / CSV / Excel Export
// ============================================================

function generateReportData(type) {
  const now = new Date();
  const vaccineName = document.getElementById('vaccine-select')?.value || 'Covaxin';
  return {
    title: `Cold Chain ${type} Report`,
    vaccine: vaccineName,
    generated: now.toLocaleString('en-IN'),
    period: type,
    summary: {
      avgTemp: '4.8°C',
      minTemp: '3.1°C',
      maxTemp: '8.9°C',
      alerts: ALERTS_DATA.filter(a => !a.resolved).length,
      doorEvents: 7,
      routeCompliance: '94.2%',
      coldChainScore: '87/100',
    },
    tempLogs: Array.from({ length: 10 }, (_, i) => ({
      time: new Date(now - (i * 3600000)).toLocaleTimeString('en-IN'),
      temp: (3.5 + Math.random() * 5).toFixed(1),
      status: Math.random() > .15 ? 'Safe' : 'Alert',
      location: 'En route to AIIMS',
    }))
  };
}

// ── CSV Export ───────────────────────────────────────────────
function exportCSV(type) {
  const data = generateReportData(type);
  const rows = [
    ['Time', 'Temperature (°C)', 'Status', 'Location'],
    ...data.tempLogs.map(r => [r.time, r.temp, r.status, r.location])
  ];
  const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const header = `# Smart Vaccine Cold Chain - ${data.title}\n# Generated: ${data.generated}\n# Vaccine: ${data.vaccine}\n\n`;
  downloadFile(header + csv, `cold_chain_${type.toLowerCase()}_report.csv`, 'text/csv');
  showNotification({ type: 'Report Generated', icon: 'fa-file-csv', desc: `${type} CSV report downloaded successfully`, priority: 'low' });
}

// ── PDF Export ───────────────────────────────────────────────
function exportPDF(type) {
  const data = generateReportData(type);

  // Build printable HTML and trigger print dialog
  const printWin = window.open('', '_blank', 'width=800,height=600');
  printWin.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${data.title}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a2a3a; padding: 2rem; }
        h1 { font-size: 1.5rem; color: #1565c0; border-bottom: 3px solid #1565c0; padding-bottom: .5rem; margin-bottom: 1rem; }
        h2 { font-size: 1rem; color: #1565c0; margin: 1.25rem 0 .5rem; }
        .meta { font-size: .8rem; color: #555; margin-bottom: 1.5rem; }
        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: .75rem; margin-bottom: 1.5rem; }
        .kpi { background: #f0f6ff; border: 1px solid #c5d8f6; border-radius: 8px; padding: .75rem; text-align: center; }
        .kpi-v { font-size: 1.4rem; font-weight: 700; color: #1565c0; }
        .kpi-l { font-size: .7rem; color: #555; margin-top: .2rem; }
        table { width: 100%; border-collapse: collapse; font-size: .8rem; }
        th { background: #1565c0; color: #fff; padding: .6rem; text-align: left; }
        td { padding: .5rem; border-bottom: 1px solid #e2edf9; }
        tr:nth-child(even) td { background: #f7faff; }
        .alert { color: #c0392b; font-weight: 600; }
        .safe  { color: #27ae60; }
        footer { margin-top: 2rem; font-size: .7rem; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 1rem; }
      </style>
    </head>
    <body>
      <h1>🧊 ${data.title}</h1>
      <div class="meta">
        Generated: ${data.generated} &nbsp;|&nbsp; Vaccine: ${data.vaccine} &nbsp;|&nbsp; Period: ${data.period}
      </div>
      <h2>Summary KPIs</h2>
      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-v">${data.summary.avgTemp}</div><div class="kpi-l">Avg Temp</div></div>
        <div class="kpi"><div class="kpi-v">${data.summary.minTemp}</div><div class="kpi-l">Min Temp</div></div>
        <div class="kpi"><div class="kpi-v">${data.summary.maxTemp}</div><div class="kpi-l">Max Temp</div></div>
        <div class="kpi"><div class="kpi-v">${data.summary.alerts}</div><div class="kpi-l">Active Alerts</div></div>
        <div class="kpi"><div class="kpi-v">${data.summary.doorEvents}</div><div class="kpi-l">Door Events</div></div>
        <div class="kpi"><div class="kpi-v">${data.summary.routeCompliance}</div><div class="kpi-l">Route Compliance</div></div>
        <div class="kpi"><div class="kpi-v">${data.summary.coldChainScore}</div><div class="kpi-l">Cold Chain Score</div></div>
      </div>
      <h2>Temperature Log</h2>
      <table>
        <thead><tr><th>Time</th><th>Temperature</th><th>Status</th><th>Location</th></tr></thead>
        <tbody>
          ${data.tempLogs.map(r => `
            <tr>
              <td>${r.time}</td>
              <td><strong>${r.temp}°C</strong></td>
              <td class="${r.status === 'Alert' ? 'alert' : 'safe'}">${r.status}</td>
              <td>${r.location}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <footer>
        Smart Vaccine Cold Chain Monitoring System &nbsp;·&nbsp; 
        Report generated automatically &nbsp;·&nbsp; ${data.generated}
      </footer>
    </body>
    </html>
  `);
  printWin.document.close();
  setTimeout(() => { printWin.focus(); printWin.print(); }, 500);
  showNotification({ type: 'PDF Report', icon: 'fa-file-pdf', desc: 'PDF report opened for printing', priority: 'low' });
}

// ── Excel (XLSX-like CSV) Export ─────────────────────────────
function exportExcel(type) {
  // Export as TSV which Excel opens natively
  const data = generateReportData(type);
  const rows = [
    [`Smart Vaccine Cold Chain - ${data.title}`],
    [`Generated: ${data.generated}`],
    [`Vaccine: ${data.vaccine}`],
    [],
    ['SUMMARY'],
    ['Metric', 'Value'],
    ['Average Temperature', data.summary.avgTemp],
    ['Minimum Temperature', data.summary.minTemp],
    ['Maximum Temperature', data.summary.maxTemp],
    ['Active Alerts', data.summary.alerts],
    ['Door Events', data.summary.doorEvents],
    ['Route Compliance', data.summary.routeCompliance],
    ['Cold Chain Score', data.summary.coldChainScore],
    [],
    ['TEMPERATURE LOG'],
    ['Time', 'Temperature (°C)', 'Status', 'Location'],
    ...data.tempLogs.map(r => [r.time, r.temp, r.status, r.location])
  ];
  const tsv = rows.map(r => r.join('\t')).join('\n');
  downloadFile(tsv, `cold_chain_${type.toLowerCase()}_report.xls`, 'application/vnd.ms-excel');
  showNotification({ type: 'Excel Report', icon: 'fa-file-excel', desc: `${type} Excel report downloaded`, priority: 'low' });
}

// ── Utility ──────────────────────────────────────────────────
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
