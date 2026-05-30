/* ══════════════════════════════════════
   TABLES & ANNEXURES HELPERS
══════════════════════════════════════ */
function delRow(btn) { btn.closest('tr').remove(); }

function addRow(tableId, cells) {
  const tbody=document.querySelector('#'+tableId+' tbody');
  if (!tbody) return;
  const tr=document.createElement('tr');
  tr.innerHTML=cells.map(c=>{
    let val = String(c !== undefined && c !== null ? c : '').trim();
    if (val === '' && !val.includes('<button') && !val.includes('<select')) {
      val = 'NUL';
    }
    return `<td contenteditable>${val}</td>`;
  }).join('');
  tbody.appendChild(tr);
  if (window.initLucide) window.initLucide();
}


function downloadAnxTemplate(n) {
  toast(`⬇ Annexure ${toRoman(n)} Excel template downloaded`,'success');
}

function handleAnxUpload(e,n) {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheets = workbook.SheetNames;
      if (!sheets.length) throw new Error('No sheets found in Excel file');

      const tableIds = getAnnexureTableIds(n);
      let updated = 0;

      sheets.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        const tableId = findAnnexureTableId(n, sheetName, tableIds);
        if (tableId && populateTableFromSheet(tableId, rows)) updated += 1;
      });

      if (!updated && tableIds.length && sheets.length === 1) {
        const sheet = workbook.Sheets[sheets[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        if (populateTableFromSheet(tableIds[0], rows)) updated = 1;
      }

      if (!updated) throw new Error('No matching annexure table found');
      toast(`✅ Annexure ${toRoman(n)} uploaded and ${updated} table(s) updated`,'success');
    } catch (err) {
      console.error(err);
      toast(`⚠️ Upload failed: ${err.message}`,'error');
    }
  };
  reader.readAsArrayBuffer(file);
  e.target.value = '';
}

function getAnnexureTableIds(n) {
  return {
    1: ['anx1-rivers','anx1-desilt','anx1-patta','anx1-msand'],
    2: ['anx2-leases','anx2-patta','anx2-desilt','anx2-msand'],
    3: ['anx3-clusters','anx3-contiguous'],
    4: ['anx4-routes','anx4-cluster-routes'],
    5: ['anx5-benchmarks'],
    6: ['anx6-final-clusters'],
    7: ['anx7-patta-final']
  }[n] || [];
}

function findAnnexureTableId(n, sheetName, tableIds) {
  const key = String(sheetName || '').trim().toLowerCase();
  const patterns = {
    'anx1-rivers': ['river','rivers','source','sources'],
    'anx1-desilt': ['desilt','de-silt','reservoir','lake','pond','dam'],
    'anx1-patta': ['patta','khatedari','land'],
    'anx1-msand': ['m-sand','msand','plant'],
    'anx2-leases': ['lease','leases','river','rivers'],
    'anx2-patta': ['patta','khatedari','land'],
    'anx2-desilt': ['desilt','de-silt','reservoir','lake','pond','dam'],
    'anx2-msand': ['m-sand','msand','plant'],
    'anx3-clusters': ['cluster'],
    'anx3-contiguous': ['contiguous'],
    'anx4-routes': ['route','routes','lease'],
    'anx4-cluster-routes': ['cluster route','cluster routes'],
    'anx5-benchmarks': ['bench','benchmark','cors'],
    'anx6-final-clusters': ['final cluster','cluster summary'],
    'anx7-patta-final': ['patta']
  };

  for (const tableId of tableIds) {
    const keys = patterns[tableId] || [];
    if (keys.some(k => key.includes(k))) return tableId;
  }
  return tableIds[0] || null;
}

function populateTableFromSheet(tableId, rows) {
  const table = document.getElementById(tableId);
  if (!table) return false;
  const tbody = table.querySelector('tbody');
  if (!tbody) return false;

  const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.innerText.trim().toLowerCase());
  const cleanRows = rows.filter(row => Array.isArray(row) && row.some(cell => String(cell || '').trim() !== ''));
  if (!cleanRows.length) return false;

  const firstRow = cleanRows[0].map(cell => String(cell || '').trim().toLowerCase());
  const isHeaderRow = firstRow.every((value, index) => {
    const header = headers[index] || '';
    return value && (header.includes(value) || value.includes(header));
  });
  if (isHeaderRow) cleanRows.shift();

  tbody.innerHTML = '';
  cleanRows.forEach(row => {
    const tr = document.createElement('tr');
    headers.forEach((_, index) => {
      let value = row[index] !== undefined ? String(row[index]).trim() : '';
      if (value === '') value = 'NUL';
      const escaped = value.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      tr.insertAdjacentHTML('beforeend', `<td contenteditable>${escaped}</td>`);
    });
    if (headers.includes('action')) {
      tr.insertAdjacentHTML('beforeend', `<td><button class="btn btn-xs btn-danger" onclick="delRow(this)" style="display:inline-flex;align-items:center;justify-content:center;padding:4px;"><i data-lucide="trash-2" style="width:12px;height:12px;"></i></button></td>`);
    }
    tbody.appendChild(tr);
  });
  if (window.initLucide) window.initLucide();
  return true;
}

function handleTableUpload(e) {
  const f = e.target.files[0]; if (!f) return;
  const sel = document.getElementById('table-upload-select');
  const tableId = sel ? sel.value : null;
  if (!tableId) { toast('Select a table first','warn'); return; }
  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      if (populateTableFromSheet(tableId, rows)) toast('✅ Table updated from Excel','success');
      else toast('No data found in sheet','warn');
    } catch (err) { console.error(err); toast('⚠️ Upload failed','error'); }
  };
  reader.readAsArrayBuffer(f);
  e.target.value = '';
}

function exportAnxPDF(n) { toast(`📄 Annexure ${typeof n==='number'?toRoman(n):n} PDF exported`,'success'); }

function toRoman(n) { return ['I','II','III','IV','V','VI','VII'][n-1]||n; }

function switchAnxTab(id, btn) {
  ['coords','benchmark','final-clusters','patta-final','desilt-final'].forEach(t=>{
    const el=document.getElementById('anx-tab-'+t); if(el) el.style.display=t===id?'block':'none';
  });
  const tabs = document.querySelectorAll('.feature-tab');
  tabs.forEach(b=>b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

/* ══════════════════════════════════════
   DEMAND TABLE
══════════════════════════════════════ */
function initDemandTable() {
  const tbody=document.getElementById('demand-tbody'); if(!tbody) return;
  tbody.innerHTML=S.demandDistricts.map((d,i)=>`
    <tr>
      <td>${i+1}</td><td>${d}</td>
      <td contenteditable class="num" oninput="updateDemandTotals()">0</td>
      <td contenteditable class="num" oninput="updateDemandTotals()">0</td>
      <td contenteditable class="num" oninput="updateDemandTotals()">0</td>
      <td contenteditable class="num" oninput="updateDemandTotals()">0</td>
      <td contenteditable class="num" oninput="updateDemandTotals()">0</td>
      <td contenteditable class="num" oninput="updateDemandTotals()">0</td>
    </tr>`).join('');
}

function addDemandRow() {
  const tbody=document.getElementById('demand-tbody');
  if (!tbody) return;
  const n=tbody.rows.length+1;
  tbody.insertAdjacentHTML('beforeend',`<tr><td>${n}</td><td contenteditable>New District</td>${Array(6).fill('<td contenteditable class="num" oninput="updateDemandTotals()">0</td>').join('')}</tr>`);
}

function updateDemandTotals() {
  const tbody=document.getElementById('demand-tbody'); if(!tbody) return;
  for (let col=0;col<6;col++) {
    const cells=[...tbody.querySelectorAll(`tr td:nth-child(${col+3})`)];
    const total=cells.reduce((s,c)=>s+(parseFloat(c.textContent)||0),0);
    const el=document.getElementById('dt-'+col); if(el) el.textContent=fmtN(total,0);
  }
}

function exportDemandExcel() { toast('⬇ Demand table Excel downloaded','success'); }
function exportDemandPDF() { toast('📄 Demand table PDF exported','success'); }

/* ══════════════════════════════════════
   SUMMARY TABLE
══════════════════════════════════════ */
function initSummaryTable() {
  const tbody=document.getElementById('summary-tbody'); if(!tbody) return;
  tbody.innerHTML=S.summarySources.map(s=>`
    <tr>
      <td contenteditable>${s}</td>
      <td contenteditable class="num" oninput="updateSummaryTotals()">0</td>
      <td contenteditable class="num" oninput="updateSummaryTotals()">0</td>
      <td contenteditable class="num" oninput="updateSummaryTotals()">0</td>
      <td contenteditable class="num" oninput="updateSummaryTotals()">0</td>
      <td><button class="btn btn-xs btn-danger" onclick="delRow(this)" style="display:inline-flex;align-items:center;justify-content:center;padding:4px;"><i data-lucide="trash-2" style="width:12px;height:12px;"></i></button></td>
    </tr>`).join('');
  if (window.initLucide) window.initLucide();
}

function addSummaryRow() {
  const tbody=document.getElementById('summary-tbody');
  if (!tbody) return;
  tbody.insertAdjacentHTML('beforeend',`<tr>
    <td contenteditable>New Source</td>
    <td contenteditable class="num" oninput="updateSummaryTotals()">0</td>
    <td contenteditable class="num" oninput="updateSummaryTotals()">0</td>
    <td contenteditable class="num" oninput="updateSummaryTotals()">0</td>
    <td contenteditable class="num" oninput="updateSummaryTotals()">0</td>
    <td><button class="btn btn-xs btn-danger" onclick="delRow(this)" style="display:inline-flex;align-items:center;justify-content:center;padding:4px;"><i data-lucide="trash-2" style="width:12px;height:12px;"></i></button></td>
  </tr>`);
  if (window.initLucide) window.initLucide();
}

function updateSummaryTotals() {
  const tbody=document.getElementById('summary-tbody'); if(!tbody) return;
  const ids=['sum-sites','sum-area','sum-excav','sum-excav60'];
  ids.forEach((id,col)=>{
    const cells=[...tbody.querySelectorAll(`tr td:nth-child(${col+2})`)];
    const total=cells.reduce((s,c)=>s+(parseFloat(c.textContent)||0),0);
    const el=document.getElementById(id); if(el) el.textContent=fmtN(total,2);
  });
}

function exportSummaryPDF() { toast('📄 Summary table PDF exported','success'); }

/* ══════════════════════════════════════
   AUCTION TABLE
══════════════════════════════════════ */
function initAuctionTable() {
  const tbody=document.getElementById('auction-tbody'); if(!tbody) return;
  tbody.innerHTML=`<tr>
    <td contenteditable>1</td>
    <td contenteditable>Jalandhar Sutlej-1, Vill-Kadiana</td>
    <td><select><option>PMS</option><option>CMS</option><option>S</option><option>C</option><option>RSM</option></select></td>
    <td contenteditable>01-Apr-2023</td><td contenteditable>15-Apr-2023</td>
    <td contenteditable>285000</td><td contenteditable>142500</td><td contenteditable>142500</td>
    <td contenteditable>Active</td><td contenteditable>—</td><td contenteditable>—</td>
    <td contenteditable>Running as per schedule</td>
    <td><button class="btn btn-xs btn-danger" onclick="delRow(this)" style="display:inline-flex;align-items:center;justify-content:center;padding:4px;"><i data-lucide="trash-2" style="width:12px;height:12px;"></i></button></td>
  </tr>`;
  if (window.initLucide) window.initLucide();
}

function addAuctionRow() {
  const tbody=document.getElementById('auction-tbody');
  if (!tbody) return;
  const n=tbody.rows.length+1;
  tbody.insertAdjacentHTML('beforeend',`<tr>
    <td contenteditable>${n}</td>
    <td contenteditable>Site Name ${n}</td>
    <td><select><option>PMS</option><option>CMS</option><option>S</option><option>C</option><option>RSM</option></select></td>
    <td contenteditable>—</td><td contenteditable>—</td>
    <td contenteditable>0</td><td contenteditable>0</td><td contenteditable>0</td>
    <td contenteditable>Pending</td><td contenteditable>—</td><td contenteditable>—</td>
    <td contenteditable>—</td>
    <td><button class="btn btn-xs btn-danger" onclick="delRow(this)" style="display:inline-flex;align-items:center;justify-content:center;padding:4px;"><i data-lucide="trash-2" style="width:12px;height:12px;"></i></button></td>
  </tr>`);
  if (window.initLucide) window.initLucide();
}

function exportAuctionPDF() { toast('📄 Auctioned sites PDF exported','success'); }
