/* ══════════════════════════════════════
   GRAPHS — CROSS SECTION
   ══════════════════════════════════════ */

function isDarkMode() {
  return document.documentElement.classList.contains('dark');
}

function chartAxisColor() {
  return isDarkMode() ? '#ffffff' : '#000000';
}

function chartGridColor() {
  return isDarkMode() ? 'rgba(255, 255, 255, 0.12)' : '#eeeeee';
}

function chartLabelColor() {
  return isDarkMode() ? '#ffffff' : '#000000';
}

function chartTooltipOptions() {
  const dark = isDarkMode();
  return {
    mode: 'index',
    intersect: false,
    backgroundColor: dark ? '#131f3d' : '#ffffff',
    titleColor: dark ? '#ffffff' : '#0f172a',
    bodyColor: dark ? '#e2e8f0' : '#334155',
    borderColor: dark ? '#3d5294' : '#cbd5e1',
    borderWidth: 1
  };
}

function addGraph() {
  const id = 'g' + Date.now();
  S.graphs.push({ 
    id, 
    name: 'PO_JL_NR_ST_28', 
    dist: '0,25,50',
    post: '227.76,227.75,227.65',
    red: '224.30', 
    thal: '223.40', 
    area: '1.60', 
    noMine: '0', 
    bulk: '1.52', 
    pct: '60',
    calcThick: '3.0', // Override thickness for volume calculation
    hasSubGraph: false, // Optional Pre-Monsoon comparison graph
    subName: 'PR_JL_NR_ST_28',
    subDist: '0,25,50',
    subElev: '227.59,227.39,227.26',
    subRed: '224.30',
    subThal: '223.40'
  });
  renderGraphs();
  
  const platesEl = document.getElementById('view-plates');
  if(platesEl && platesEl.classList.contains('active')) renderPlates();
}

function renderGraphs() {
  Object.values(S.graphCharts).forEach(c => { try { c && c.destroy(); } catch(e) {} });
  S.graphCharts = {};
  const el = document.getElementById('graph-list'); if (!el) return;
  el.innerHTML = S.graphs.map(g => buildGraphHTML(g)).join('');
  S.graphs.forEach(g => drawGraph(g));
}

function calcGraph(g) {
  const dist = (String(g.dist || '')).split(',').map(Number).filter(v => !isNaN(v));
  const post = (String(g.post || '')).split(',').map(Number).filter(v => !isNaN(v));
  
  // Sub-graph data arrays (support both sub-graph specific keys and original 'pre' properties)
  const subDistSrc = g.subDist !== undefined ? g.subDist : g.dist;
  const subDist = (String(subDistSrc || '')).split(',').map(Number).filter(v => !isNaN(v));
  
  const subElevSrc = g.subElev !== undefined ? g.subElev : g.pre;
  const subElev = (String(subElevSrc || '')).split(',').map(Number).filter(v => !isNaN(v));
  
  const red = Number(g.red) || 0;
  const thal = Number(g.thal) || 0;
  
  const subRed = g.subRed !== undefined ? Number(g.subRed) : red;
  const subThal = g.subThal !== undefined ? Number(g.subThal) : thal;
  
  const area = Number(g.area) || 0;
  const noMine = Number(g.noMine) || 0;
  const bulk = Number(g.bulk) || 1.52;
  const pct = Number(g.pct) || 60;
  
  // Calculate Pre Thickness (Sub-graph)
  const thickPre = subElev.map(e => Math.max(0, e - subRed));
  const avgThickPre = thickPre.length ? thickPre.reduce((a, b) => a + b, 0) / thickPre.length : 0;

  // Calculate Post Thickness (Main Graph)
  const thickPost = post.map(e => Math.max(0, e - red));
  const avgThickPost = thickPost.length ? thickPost.reduce((a, b) => a + b, 0) / thickPost.length : 0;
  
  // Thickness used for calculations (fallback to Post avg if override is empty)
  const activeCalcThick = g.calcThick && !isNaN(Number(g.calcThick)) ? Number(g.calcThick) : avgThickPost;

  const pArea = Math.max(0, area - noMine);
  const volume = pArea * 10000 * activeCalcThick;
  const tonnes = volume * bulk;
  const allowed = tonnes * (pct / 100);

  return { dist, post, subDist, subElev, thickPre, avgThickPre, thickPost, avgThickPost, activeCalcThick, pArea, volume, tonnes, allowed, red, thal, subRed, subThal };
}

function buildGraphHTML(g) {
  const o = calcGraph(g);
  
  // Layout logic for single vs comparison graphs
  const canvasHTML = g.hasSubGraph 
    ? `<div style="display:flex; flex-direction:column; gap:10px;">
         <div style="position:relative"><span class="graph-canvas-label">${g.name || 'Post Monsoon'}</span><canvas id="canvas-${g.id}-post" height="120"></canvas></div>
         <div style="position:relative"><span class="graph-canvas-label">${g.subName || 'Pre Monsoon'}</span><canvas id="canvas-${g.id}-pre" height="120"></canvas></div>
       </div>`
    : `<canvas id="canvas-${g.id}-post" height="200"></canvas>`;

  return `
  <div class="graph-block" id="gs-${g.id}">
    <div class="graph-block-hd">
      <div style="flex:1; display:flex; gap:15px; align-items:center;">
        <span style="font-weight:700; color:#4fd1c5; text-transform:uppercase; font-size:12px;">Main Graph (Post-Monsoon)</span>
        <input value="${g.name}" placeholder="Main Graph Name" oninput="updateG('${g.id}','name',this.value)" style="background:rgba(255,255,255,0.1);border:none;color:#fff;padding:4px 8px;border-radius:4px;font-size:13px;width:150px;font-family:inherit;outline:none;">
      </div>
      <button class="btn btn-xs btn-danger" style="margin-right: 8px;" onclick="generatePDF('${g.id}')">Download PDF Report</button>
      <button class="btn btn-xs btn-danger" onclick="deleteGraph('${g.id}')">Delete Section</button>
    </div>
    <div class="graph-block-bd">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
        <div class="field-group">
          <div class="field"><label style="color:rgba(255,255,255,.6)">Distance Array (m)</label><input value="${g.dist}" oninput="updateG('${g.id}','dist',this.value)" style="background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.15);color:#fff"></div>
          <div class="field"><label style="color:rgba(255,255,255,.6)">Elevation Array (m)</label><input value="${g.post}" oninput="updateG('${g.id}','post',this.value)" style="background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.15);color:#fff"></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;align-content:start">
          <div class="field"><label style="color:rgba(255,255,255,.6)">Red Line (m)</label><input type="number" step="0.01" value="${g.red}" oninput="updateG('${g.id}','red',this.value)" style="background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.15);color:#fff"></div>
          <div class="field"><label style="color:rgba(255,255,255,.6)">Thalweg (m)</label><input type="number" step="0.01" value="${g.thal}" oninput="updateG('${g.id}','thal',this.value)" style="background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.15);color:#fff"></div>
          <div class="field"><label style="color:rgba(255,255,255,.6)">Total Area (Ha)</label><input type="number" step="0.01" value="${g.area}" oninput="updateG('${g.id}','area',this.value)" style="background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.15);color:#fff"></div>
          <div class="field"><label style="color:rgba(255,255,255,.6)">No-Mine (Ha)</label><input type="number" step="0.01" value="${g.noMine}" oninput="updateG('${g.id}','noMine',this.value)" style="background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.15);color:#fff"></div>
          <div class="field"><label style="color:rgba(255,255,255,.6)">Density (g/cc)</label><input type="number" step="0.01" value="${g.bulk}" oninput="updateG('${g.id}','bulk',this.value)" style="background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.15);color:#fff"></div>
          <div class="field"><label style="color:rgba(255,255,255,.6)">Mining %</label><input type="number" value="${g.pct}" oninput="updateG('${g.id}','pct',this.value)" style="background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.15);color:#fff"></div>
          <div class="field" style="grid-column: span 3;"><label style="color:#facc15">Calculation Thickness Override (m)</label><input type="number" step="0.01" value="${g.calcThick || ''}" placeholder="Defaults to Post Avg if empty" oninput="updateG('${g.id}','calcThick',this.value)" style="background:rgba(250,204,21,.1);border-color:rgba(250,204,21,.3);color:#facc15"></div>
        </div>
      </div>
      
      ${g.hasSubGraph ? `
        <div style="background: rgba(238, 195, 74, 0.05); border: 1px dashed rgba(238, 195, 74, 0.3); padding: 12px; margin-bottom: 16px; border-radius: 6px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <strong style="color:#eec34a; font-size:13px;">Sub-Graph for Comparison (Pre-Monsoon)</strong>
            <button class="btn btn-xs btn-danger" onclick="updateG('${g.id}', 'hasSubGraph', false)">Remove Comparison</button>
          </div>
          <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px; margin-bottom: 10px;">
            <div class="field"><label>Pre Name</label><input value="${g.subName || ''}" oninput="updateG('${g.id}','subName',this.value)" style="background:rgba(255,255,255,.08);color:#fff;border-color:rgba(255,255,255,.15);"></div>
            <div class="field"><label>Pre Distance (m)</label><input value="${g.subDist || ''}" oninput="updateG('${g.id}','subDist',this.value)" style="background:rgba(255,255,255,.08);color:#fff;border-color:rgba(255,255,255,.15);"></div>
            <div class="field"><label>Pre Elevation (m)</label><input value="${g.subElev || ''}" oninput="updateG('${g.id}','subElev',this.value)" style="background:rgba(255,255,255,.08);color:#fff;border-color:rgba(255,255,255,.15);"></div>
          </div>
          <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px;">
            <div class="field"><label>Pre Red Line (m)</label><input type="number" step="0.01" value="${g.subRed !== undefined ? g.subRed : g.red}" oninput="updateG('${g.id}','subRed',this.value)" style="background:rgba(255,255,255,.08);color:#fff;border-color:rgba(255,255,255,.15);"></div>
            <div class="field"><label>Pre Thalweg (m)</label><input type="number" step="0.01" value="${g.subThal !== undefined ? g.subThal : g.thal}" oninput="updateG('${g.id}','subThal',this.value)" style="background:rgba(255,255,255,.08);color:#fff;border-color:rgba(255,255,255,.15);"></div>
          </div>
        </div>
      ` : `
        <div style="margin-bottom: 16px;">
          <button class="btn btn-xs btn-outline" style="background: rgba(238, 195, 74, 0.12); color: #eec34a; border: 1px dashed #eec34a;" onclick="updateG('${g.id}', 'hasSubGraph', true)">+ Add Sub-Graph for Comparison (Pre-Monsoon)</button>
        </div>
      `}
      
      <div style="display:grid;grid-template-columns:1.5fr 0.5fr;gap:16px">
        <div class="graph-canvas-wrap" style="background:var(--card); border: 1px solid var(--border); border-radius:8px; padding:10px;">${canvasHTML}</div>
        <div>
          <div class="kpi-grid">
            <div class="kpi-item"><div class="kpi-lbl">Post Avg Thick</div><div class="kpi-val">${o.avgThickPost.toFixed(2)}<span class="kpi-unit"> m</span></div></div>
            ${g.hasSubGraph ? `<div class="kpi-item"><div class="kpi-lbl">Pre Avg Thick</div><div class="kpi-val">${o.avgThickPre.toFixed(2)}<span class="kpi-unit"> m</span></div></div>` : ''}
            <div class="kpi-item"><div class="kpi-lbl">Potential Area</div><div class="kpi-val">${o.pArea.toFixed(2)}<span class="kpi-unit"> Ha</span></div></div>
            <div class="kpi-item"><div class="kpi-lbl">Total Excav.</div><div class="kpi-val">${fmtN(o.allowed,0)}<span class="kpi-unit"> MT</span></div></div>
          </div>
          <div class="result-bar" style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); padding: 12px; border-radius: 8px;">
            <div class="result-lbl" style="font-size: 11px; color: #10b981; font-weight: 600; text-transform: uppercase;">Allowed Excavation (${g.pct}%)</div>
            <div class="result-val" style="font-size: 20px; font-weight: 700; color: #34d399;">${fmtN(o.allowed,2)} MT</div>
            <div style="font-size:10px;color:var(--teal-2);margin-top:2px">= ${fmtN(o.pArea,2)} Ha × 10000 × ${o.activeCalcThick.toFixed(2)}m × ${g.bulk} × ${g.pct}%</div>
          </div>
          <div class="tbl-wrap" style="margin-top:10px;max-height:150px;overflow-y:auto">
            <table class="tbl" style="font-size:11px">
              <thead><tr><th>Dist</th><th>Post</th><th>Thick</th></tr></thead>
              <tbody>${o.dist.map((d,i)=>`<tr><td>${d}</td><td>${o.post[i]??'—'}</td><td>${(o.thickPost[i]??0).toFixed(2)}</td></tr>`).join('')}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function drawGraph(g) {
  const o = calcGraph(g);
  
  // Calculate independent Y-axis bounds
  const postY = [...o.post, o.red, o.thal].filter(v => !isNaN(v));
  const postMin = Math.min(...postY);
  const postMax = Math.max(...postY);
  const postPad = (postMax - postMin) * 0.2 || 1;
  const postYMin = Math.floor(postMin - postPad);
  const postYMax = Math.ceil(postMax + postPad);

  const preY = [...(g.hasSubGraph ? o.subElev : []), o.subRed, o.subThal].filter(v => !isNaN(v));
  const preMin = Math.min(...preY);
  const preMax = Math.max(...preY);
  const prePad = (preMax - preMin) * 0.2 || 1;
  const preYMin = Math.floor(preMin - prePad);
  const preYMax = Math.ceil(preMax + prePad);

  const uiPointLabelsPlugin = {
    id: 'uiPointLabels',
    afterDatasetsDraw(chart) {
      const ctx = chart.ctx;
      chart.data.datasets.forEach((dataset, i) => {
        if (dataset.label && dataset.label.includes('Elevation')) {
          const meta = chart.getDatasetMeta(i);
          meta.data.forEach((element, index) => {
            ctx.fillStyle = chartLabelColor();
            ctx.font = '11px "Times New Roman"'; 
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            const val = dataset.data[index];
            if(val !== undefined) ctx.fillText(Number(val).toFixed(2), element.x + 8, element.y - 6);
          });
        }
      });
    }
  };

  const buildUIChart = (canvasId, dists, datasets, yMin, yMax) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    return new Chart(canvas, {
      type: 'line',
      data: { labels: dists, datasets },
      plugins: [uiPointLabelsPlugin],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: isDarkMode(),
            labels: {
              color: chartAxisColor(),
              font: { family: 'Inter', size: 11 }
            }
          },
          tooltip: chartTooltipOptions()
        },
        scales: {
          x: {
            ticks: { color: chartAxisColor(), font: { family: 'Times New Roman' } },
            grid: { color: chartGridColor() }
          },
          y: {
            min: yMin,
            max: yMax,
            ticks: { color: chartAxisColor(), font: { family: 'Times New Roman' } },
            grid: { color: chartGridColor() }
          }
        }
      }
    });
  };

  // Draw Post Graph (Main graph uses its own dynamic bounds)
  if (document.getElementById('canvas-'+g.id+'-post') && o.dist.length >= 2) {
    const redArrPost = o.dist.map(() => o.red);
    const thalArrPost = o.dist.map(() => o.thal);
    S.graphCharts[g.id + '_post'] = buildUIChart('canvas-'+g.id+'-post', o.dist, [
      { label: 'Post monsoon Elevation', data: o.post, borderColor: '#da8b4e', backgroundColor: '#da8b4e', pointBackgroundColor: '#8ba3b5', tension: 0.1, pointRadius: 4, borderWidth: 1.5, fill: false },
      { label: 'Red Line', data: redArrPost, borderColor: '#de3b3b', pointBackgroundColor: '#e37878', borderWidth: 1.5, pointRadius: 4, fill: false },
      { label: 'Thalweg', data: thalArrPost, borderColor: '#3b8bba', pointBackgroundColor: '#7db1e3', borderWidth: 1.5, pointRadius: 4, fill: false }
    ], postYMin, postYMax);
  }

  // Draw Pre Graph (Sub graph uses its own independent bounds)
  if (g.hasSubGraph && document.getElementById('canvas-'+g.id+'-pre') && o.subDist.length >= 2) {
    const redArrPre = o.subDist.map(() => o.subRed);
    const thalArrPre = o.subDist.map(() => o.subThal);
    S.graphCharts[g.id + '_pre'] = buildUIChart('canvas-'+g.id+'-pre', o.subDist, [
      { label: 'Pre monsoon Elevation', data: o.subElev, borderColor: '#eec34a', backgroundColor: '#eec34a', pointBackgroundColor: '#aab6c2', tension: 0.1, pointRadius: 4, borderWidth: 1.5, fill: false },
      { label: 'Red Line', data: redArrPre, borderColor: '#de3b3b', pointBackgroundColor: '#e37878', borderWidth: 1.5, pointRadius: 4, fill: false },
      { label: 'Thalweg', data: thalArrPre, borderColor: '#3b8bba', pointBackgroundColor: '#7db1e3', borderWidth: 1.5, pointRadius: 4, fill: false }
    ], preYMin, preYMax);
  }
}

function updateG(id, key, val) {
  const g = S.graphs.find(x => x.id === id); 
  if (!g) return;
  
  if (key === 'hasSubGraph') {
    val = (val === 'true' || val === true);
  }
  g[key] = val;
  
  if (key === 'hasSubGraph' && val === true) {
    if (g.subRed === undefined) g.subRed = g.red;
    if (g.subThal === undefined) g.subThal = g.thal;
  }
  
  clearTimeout(g._t);
  g._t = setTimeout(() => { 
    try { S.graphCharts[id + '_pre']?.destroy(); } catch(e) {} 
    try { S.graphCharts[id + '_post']?.destroy(); } catch(e) {} 
    const block = document.getElementById('gs-'+id);
    if (block) { 
      block.outerHTML = buildGraphHTML(g); 
      drawGraph(g); 
    }
  }, 400);
}

function deleteGraph(id) {
  customConfirm('Delete this cross section graph?', () => {
    S.graphs = S.graphs.filter(g => g.id !== id);
    try { S.graphCharts[id + '_pre']?.destroy(); } catch(e) {}
    try { S.graphCharts[id + '_post']?.destroy(); } catch(e) {}
    delete S.graphCharts[id + '_pre'];
    delete S.graphCharts[id + '_post'];
    const el = document.getElementById('gs-'+id); 
    if (el) el.remove();
    toast('Cross section deleted successfully', 'success');
    
    const platesEl = document.getElementById('view-plates');
    if(platesEl && platesEl.classList.contains('active')) renderPlates();
  });
}

function buildPdfChartHelper(g, o, type, canvasEl) {
  const isPre = type === 'pre';
  const dists = isPre ? o.subDist : o.dist;
  const elevs = isPre ? o.subElev : o.post;
  
  // Calculate independent Y-axis bounds
  const postY = [...o.post, o.red, o.thal].filter(v => !isNaN(v));
  const postMin = Math.min(...postY);
  const postMax = Math.max(...postY);
  const postPad = (postMax - postMin) * 0.2 || 1;
  const postYMin = Math.floor(postMin - postPad);
  const postYMax = Math.ceil(postMax + postPad);

  const preY = [...(g.hasSubGraph ? o.subElev : []), o.subRed, o.subThal].filter(v => !isNaN(v));
  const preMin = Math.min(...preY);
  const preMax = Math.max(...preY);
  const prePad = (preMax - preMin) * 0.2 || 1;
  const preYMin = Math.floor(preMin - prePad);
  const preYMax = Math.ceil(preMax + prePad);

  const yMin = isPre ? preYMin : postYMin;
  const yMax = isPre ? preYMax : postYMax;
  
  const redArr = isPre ? dists.map(() => o.subRed) : dists.map(() => o.red);
  const thalArr = isPre ? dists.map(() => o.subThal) : dists.map(() => o.thal);

  const pdfPointLabelsPlugin = {
    id: 'pdfPointLabels',
    afterDatasetsDraw(chart) {
      const ctx = chart.ctx;
      chart.data.datasets.forEach((dataset, i) => {
        if (dataset.label && dataset.label.includes('Elevation')) {
          const meta = chart.getDatasetMeta(i);
          meta.data.forEach((element, index) => {
            ctx.fillStyle = '#000';
            ctx.font = '11px "Times New Roman"';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            const val = dataset.data[index];
            if(val !== undefined) ctx.fillText(Number(val).toFixed(2), element.x + 8, element.y - 6);
          });
        }
      });
    }
  };

  const chartDatasets = isPre 
    ? [{ label: 'Pre monsoon Elevation', data: elevs, borderColor: '#eec34a', backgroundColor: '#eec34a', pointBackgroundColor: '#8ba3b5', tension: 0.1, pointRadius: 4, borderWidth: 1.5, fill: false }]
    : [{ label: 'Post monsoon Elevation', data: elevs, borderColor: '#da8b4e', backgroundColor: '#da8b4e', pointBackgroundColor: '#8ba3b5', tension: 0.1, pointRadius: 4, borderWidth: 1.5, fill: false }];
  
  chartDatasets.push(
    { label: 'Red Line', data: redArr, borderColor: '#de3b3b', backgroundColor: '#de3b3b', pointBackgroundColor: '#e37878', borderWidth: 1.5, pointRadius: 4, fill: false },
    { label: 'Thalweg', data: thalArr, borderColor: '#3b8bba', backgroundColor: '#3b8bba', pointBackgroundColor: '#7db1e3', borderWidth: 1.5, pointRadius: 4, fill: false }
  );

  return new Chart(canvasEl, {
    type: 'line',
    data: { labels: dists, datasets: chartDatasets },
    plugins: [pdfPointLabelsPlugin],
    options: {
      animation: false,
      responsive: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#000', font: { family: 'Times New Roman', size: 10 } }, grid: { color: '#e5e5e5' } },
        y: { min: yMin, max: yMax, ticks: { color: '#000', font: { family: 'Times New Roman', size: 10 } }, grid: { color: '#e5e5e5' } }
      }
    }
  });
}

function buildGraphPdfPageHTML(g, o, imgPost, imgPre, pageNum) {
  const mathStr = `${o.pArea.toFixed(2)}*10000*${o.activeCalcThick.toFixed(1)}*${g.bulk}=${o.tonnes.toFixed(2)} Tonnes`;
  const allowedStr = o.allowed.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0});

  if (g.hasSubGraph) {
    const maxLen = Math.max(o.dist.length, o.subDist.length);
    let dualTableRows = '';
    for (let i = 0; i < maxLen; i++) {
      const preVal = o.thickPre[i] !== undefined ? o.thickPre[i].toFixed(2) : '-';
      const postVal = o.thickPost[i] !== undefined ? o.thickPost[i].toFixed(2) : '-';
      dualTableRows += `<tr>
        <td style="background: #f1f3fa; border: 1px solid #fff; padding: 4px;">${postVal}</td>
        <td style="background: #f1f3fa; border: 1px solid #fff; padding: 4px;">${preVal}</td>
      </tr>`;
    }

    return `
      <div class="pdf-page-container" id="pdf-container" style="width: 1040px; height: 710px; position: relative; background: #fff; color: #000; font-family: 'Times New Roman', serif; box-sizing: border-box; font-size: 15px; margin: 0; overflow: hidden;">
        <div style="position: absolute; top: 50px; left: 20px; width: 330px; line-height: 1.3;">
          <div><b>Source-</b> Primary Data generated<br>by DGPS<br>Hi- Target DGPS ( Model No.<br>V30plus)</div>
          <div style="font-size: 18px; font-weight: bold; margin: 15px 0 10px 0;">Calculation</div>
          <div style="padding-left: 18px; position: relative;"><span style="position:absolute;left:0;">➢</span><b>Total Area: ${g.area}Ha.(Source:Table no. 7.2)</b></div>
          <div style="padding-left: 18px; position: relative; margin-bottom: 8px; margin-top: 8px;"><span style="position:absolute;left:0;">➢</span><b>No mining area: ${g.noMine} Ha.</b> &nbsp;&nbsp;&nbsp;&nbsp;(Source: Page No 84)</div>
          <div style="padding-left: 18px; font-size: 14px;">Potential area(Ha.): Total area(Ha.)- No mining Area(Ha.)<br>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${g.area}-${g.noMine}=${o.pArea.toFixed(2)} Ha.</div>
          
          <div style="padding-left: 18px; position: relative; margin-top: 15px;"><span style="position:absolute;left:0;">➢</span>Potential Area(Ha.):${o.pArea.toFixed(2)}</div>
          <div style="padding-left: 18px; position: relative;"><span style="position:absolute;left:0;">➢</span>Average Thickness:${o.activeCalcThick.toFixed(1)}</div>
          <div style="padding-left: 18px; position: relative;"><span style="position:absolute;left:0;">➢</span>Bulk Density:${g.bulk}</div>
          
          <div style="margin: 4px 0 4px 0; font-size: 15px; letter-spacing: -0.2px;">${mathStr}</div>
          <div style="padding-left: 18px; position: relative;"><span style="position:absolute;left:0;">➢</span>Total excavation in Tonnes<br>&nbsp;&nbsp;&nbsp;(Considering ${g.pct}% as per EMGSM,<br>&nbsp;&nbsp;&nbsp;2020)=${allowedStr}</div>

          <div style="margin-top: 70px; margin-left: 20px;">
            <div style="display:flex; align-items:center; margin-bottom:6px;"><span style="display:inline-block; width:35px; height:3px; background:#de3b3b; margin-right:8px;"></span> Red Line</div>
            <div style="display:flex; align-items:center; margin-bottom:6px;"><span style="display:inline-block; width:35px; height:3px; background:#da8b4e; margin-right:8px;"></span> Post monsoon Elevation</div>
            <div style="display:flex; align-items:center; margin-bottom:6px;"><span style="display:inline-block; width:35px; height:3px; background:#eec34a; margin-right:8px;"></span> Pre monsoon Elevation</div>
            <div style="display:flex; align-items:center; margin-bottom:6px;"><span style="display:inline-block; width:35px; height:3px; background:#3b8bba; margin-right:8px;"></span> Thalweg line</div>
          </div>
        </div>

        <div style="position: absolute; top: 480px; left: 320px; font-size: 16px; transform: rotate(-90deg); transform-origin: left top;">Elevation (m)</div>

        <div style="position: absolute; top: 35px; left: 360px; width: 480px; text-align: center;">
          <div style="font-size: 18px;">Cross Section Sand Bar</div>
          <div style="font-size: 16px; font-weight: bold; margin-bottom: 5px;">${g.name || 'Post Monsoon'}</div>
          <img src="${imgPost}" style="width: 100%; margin-bottom: 20px;" />
          
          <div style="font-size: 16px; font-weight: bold; margin-bottom: 5px;">${g.subName || 'Pre Monsoon'}</div>
          <img src="${imgPre}" style="width: 100%; margin-bottom: 5px;" />
          <div style="font-size: 16px;">Distance of the sand bar from river bank towards river (m)</div>
        </div>

        <div style="position: absolute; top: 120px; right: 20px; width: 180px; text-align: center; font-size: 16px;">
          <div style="text-align:left; margin-left:10px;">Post Monsoon<br>Average Thickness:${o.avgThickPost.toFixed(2)}</div>
          
          <table style="width: 100%; border-collapse: collapse; text-align: center; font-size: 12px; margin-top: 100px; margin-bottom: 100px;">
            <tr>
              <th style="background: #e4e7f2; border: 1px solid #fff; padding: 4px; font-weight: normal;">Post-<br>Thickness</th>
              <th style="background: #e4e7f2; border: 1px solid #fff; padding: 4px; font-weight: normal;">Pre-<br>Thickness</th>
            </tr>
            ${dualTableRows}
            <tr>
              <td style="background: #e4e7f2; border: 1px solid #fff; padding: 4px; font-weight: bold;">${o.avgThickPost.toFixed(2)}</td>
              <td style="background: #e4e7f2; border: 1px solid #fff; padding: 4px; font-weight: bold;">${o.avgThickPre.toFixed(2)}</td>
            </tr>
          </table>

          <div style="text-align:left; margin-left:10px;">Pre Monsoon<br>Average Thickness:${o.avgThickPre.toFixed(2)}</div>
        </div>

        <div style="position: absolute; bottom: 30px; left: 330px; width: 650px; font-size: 13px; line-height: 1.3;">
          Note: The levels given in the cross- section as observed in the field has been checked and found<br>nearly matching with the office record.
        </div>
        <div style="position: absolute; bottom: -5px; right: 0; font-size: 20px; font-weight: bold; padding: 5px; background: #fff;">${pageNum}</div>
        <div style="position: absolute; top: 20px; left: 20px; width: 1000px; height: 670px; border: 1px solid #000; pointer-events: none;"></div>
      </div>
    `;
  } else {
    const singleTableRows = o.dist.map((d, i) => `<tr><td style="background: #f1f3fa; border: 1px solid #fff; padding: 4px;">${o.thickPost[i] !== undefined ? o.thickPost[i].toFixed(2) : '-'}</td></tr>`).join('');

    return `
      <div class="pdf-page-container" id="pdf-container" style="width: 1040px; height: 710px; position: relative; background: #fff; color: #000; font-family: 'Times New Roman', serif; box-sizing: border-box; font-size: 15px; margin: 0; overflow: hidden;">
        <div style="position: absolute; top: 10px; left: 0; width: 100%; text-align: center; font-size: 18px;">Cross Section Sand Bar</div>
        <div style="position: absolute; top: 35px; left: 0; width: 100%; text-align: center; font-size: 17px; font-weight: bold;">${g.name}</div>
        <div style="position: absolute; top: 70px; left: 20px; width: 330px; line-height: 1.3;">
          <div><b>Source-</b> Primary Data generated<br>by DGPS<br>Hi- Target DGPS ( Model No.<br>V30plus)</div>
          <div style="font-size: 18px; font-weight: bold; margin: 15px 0 10px 0;">Calculation</div>
          <div style="padding-left: 18px; position: relative;"><span style="position:absolute;left:0;">➢</span><b>Total Area: ${g.area} Ha.</b>(Source: Table 7.2 )</div>
          <div style="padding-left: 18px; position: relative; margin-bottom: 8px;"><span style="position:absolute;left:0;">➢</span><b>No mining area: ${g.noMine}Ha.</b> (Source: Page No 88)</div>
          <div style="padding-left: 18px;">Potential area(Ha.): Total area(Ha.)- No mining Area(Ha.)<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${g.area}-${g.noMine}=${o.pArea.toFixed(2)} Ha.</div>
          <div style="padding-left: 18px; position: relative; margin-top: 8px;"><span style="position:absolute;left:0;">➢</span>Potential Area(Ha.):${o.pArea.toFixed(2)}</div>
          <div style="padding-left: 18px; position: relative;"><span style="position:absolute;left:0;">➢</span>Average Thickness:${o.activeCalcThick.toFixed(2)}</div>
          <div style="padding-left: 18px; position: relative;"><span style="position:absolute;left:0;">➢</span>Bulk Density:${g.bulk}</div>
          <div style="margin: 4px 0 4px 0; font-size: 15px; letter-spacing: -0.2px;">${mathStr.replace('Tonnes', 'Ton<br>nes')}</div>
          <div style="padding-left: 18px; position: relative;"><span style="position:absolute;left:0;">➢</span>Total excavation in Tonnes<br>(Considering ${g.pct}% as per EMGSM,<br>2020)=${allowedStr}</div>
          <div style="margin-top: 40px;">
            <div style="display:flex; align-items:center; margin-bottom:6px;"><span style="display:inline-block; width:35px; height:3px; background:#de3b3b; margin-right:8px;"></span> Red Line</div>
            <div style="display:flex; align-items:center; margin-bottom:6px;"><span style="display:inline-block; width:35px; height:3px; background:#da8b4e; margin-right:8px;"></span> Post monsoon Elevation</div>
            <div style="display:flex; align-items:center; margin-bottom:6px;"><span style="display:inline-block; width:35px; height:3px; background:#3b8bba; margin-right:8px;"></span> Thalweg line</div>
          </div>
        </div>
        <div style="position: absolute; top: 85px; left: 360px; width: 550px; text-align: center;">
          <img src="${imgPost}" style="width: 100%; margin-bottom: 5px;" />
          <div style="font-size: 16px;">Distance of the sand bar from river bank towards river (m)</div>
        </div>
        <div style="position: absolute; top: 180px; right: 20px; width: 110px;">
          <table style="width: 100%; border-collapse: collapse; text-align: center; font-size: 13px;">
            <tr><th style="background: #e4e7f2; border: 1px solid #fff; padding: 4px; font-weight: normal;">Post -Thickness</th></tr>
            ${singleTableRows}
            <tr><td style="background: #f1f3fa; border: 1px solid #fff; padding: 4px; font-weight: bold;">${o.avgThickPost.toFixed(2)}</td></tr>
          </table>
        </div>
        <div style="position: absolute; top: 375px; right: -15px; width: 220px; text-align: center; font-size: 16px; line-height: 1.3;">
          Post Monsoon<br>Average Thickness: ${o.avgThickPost.toFixed(2)}
        </div>
        <div style="position: absolute; bottom: 40px; left: 360px; width: 550px; font-size: 13px; line-height: 1.3;">
          Note: The levels given in the cross- section as observed in the field has been checked and found<br>nearly matching with the office record.
        </div>
        <div style="position: absolute; bottom: -5px; right: 0; font-size: 20px; font-weight: bold; padding: 5px; background: #fff;">${pageNum}</div>
        <div style="position: absolute; top: 5px; left: 5px; width: 1025px; height: 695px; border: 1px solid #000; pointer-events: none;"></div>
      </div>
    `;
  }
}

function generatePDF(id) {
  const g = S.graphs.find(x => x.id === id);
  if (!g) return;
  const o = calcGraph(g);
  
  toast('Generating PDF, please wait...', 'success');

  let imgPre = '';
  let imgPost = '';
  
  if (g.hasSubGraph) {
    const canPre = document.createElement('canvas'); canPre.width = 460; canPre.height = 200;
    const canPost = document.createElement('canvas'); canPost.width = 460; canPost.height = 200;
    document.body.appendChild(canPre); document.body.appendChild(canPost);
    canPre.style.display = 'none'; canPost.style.display = 'none';

    const chartPre = buildPdfChartHelper(g, o, 'pre', canPre);
    const chartPost = buildPdfChartHelper(g, o, 'post', canPost);
    imgPre = chartPre.toBase64Image();
    imgPost = chartPost.toBase64Image();
    chartPre.destroy(); chartPost.destroy();
    canPre.remove(); canPost.remove();
  } else {
    const canPost = document.createElement('canvas'); canPost.width = 600; canPost.height = 280;
    document.body.appendChild(canPost); canPost.style.display = 'none';
    
    const chartPost = buildPdfChartHelper(g, o, 'post', canPost);
    imgPost = chartPost.toBase64Image();
    chartPost.destroy(); canPost.remove();
  }

  const pageNum = g.hasSubGraph ? 159 : 170;
  const templateHTML = buildGraphPdfPageHTML(g, o, imgPost, imgPre, pageNum);

  const template = document.createElement('div');
  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.top = '-9999px';
  wrapper.appendChild(template);
  template.innerHTML = templateHTML; 
  document.body.appendChild(wrapper);

  const opt = {
    margin:       0.1,
    filename:     `${(g.hasSubGraph ? g.subName : g.name).replace(/\s+/g, '_')}_Report.pdf`,
    image:        { type: 'jpeg', quality: 1.0 },
    html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
    jsPDF:        { unit: 'in', format: 'a4', orientation: 'landscape' }
  };

  html2pdf().set(opt).from(template.querySelector('#pdf-container')).save().then(() => {
    wrapper.remove();
    toast('PDF successfully generated and downloaded!', 'success');
  }).catch(err => {
    console.error(err);
    wrapper.remove();
    toast('Failed to generate PDF', 'danger');
  });
}

function generateAllGraphsPDF() {
  if (!S.graphs || S.graphs.length === 0) {
    toast('No cross section graphs available to download.', 'error');
    return;
  }
  
  toast('Generating PDF for all cross sections, please wait...', 'success');

  const pagesHTML = [];
  
  for (let idx = 0; idx < S.graphs.length; idx++) {
    const g = S.graphs[idx];
    const o = calcGraph(g);
    
    let imgPre = '';
    let imgPost = '';
    
    if (g.hasSubGraph) {
      const canPre = document.createElement('canvas'); canPre.width = 460; canPre.height = 200;
      const canPost = document.createElement('canvas'); canPost.width = 460; canPost.height = 200;
      document.body.appendChild(canPre); document.body.appendChild(canPost);
      canPre.style.display = 'none'; canPost.style.display = 'none';

      const chartPre = buildPdfChartHelper(g, o, 'pre', canPre);
      const chartPost = buildPdfChartHelper(g, o, 'post', canPost);
      imgPre = chartPre.toBase64Image();
      imgPost = chartPost.toBase64Image();
      chartPre.destroy(); chartPost.destroy();
      canPre.remove(); canPost.remove();
    } else {
      const canPost = document.createElement('canvas'); canPost.width = 600; canPost.height = 280;
      document.body.appendChild(canPost); canPost.style.display = 'none';

      const chartPost = buildPdfChartHelper(g, o, 'post', canPost);
      imgPost = chartPost.toBase64Image();
      chartPost.destroy(); canPost.remove();
    }

    const pageHTML = buildGraphPdfPageHTML(g, o, imgPost, imgPre, 159 + idx);
    pagesHTML.push(pageHTML);
  }

  const templateHTML = `
    <div id="all-pdf-container" style="background:#fff;">
      ${pagesHTML.join('\n<div class="html2pdf__page-break"></div>\n')}
    </div>
  `;

  const template = document.createElement('div');
  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.top = '-9999px';
  wrapper.appendChild(template);
  template.innerHTML = templateHTML; 
  document.body.appendChild(wrapper);

  const opt = {
    margin:       0.1,
    filename:     `All_Cross_Sections_Report.pdf`,
    image:        { type: 'jpeg', quality: 1.0 },
    html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
    jsPDF:        { unit: 'in', format: 'a4', orientation: 'landscape' },
    pagebreak:    { mode: ['css', 'legacy'] }
  };

  html2pdf().set(opt).from(template.querySelector('#all-pdf-container')).save().then(() => {
    wrapper.remove();
    toast('All cross section graphs PDF generated and downloaded!', 'success');
  }).catch(err => {
    console.error(err);
    wrapper.remove();
    toast('Failed to generate PDF', 'danger');
  });
}