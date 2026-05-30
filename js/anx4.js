/* ══════════════════════════════════════
   ANNEXURE IV — TRANSPORTATION ROUTES
   Supports multiple dynamic tables, context-aware Excel operations,
   and portrait PDF generation.
 ══════════════════════════════════════ */

// ── Default data (Example data for table pre-filling) ──
const defaultRoutes = [
  [1, "Jalandhar Sutlej -\n1 Vill- Kadiana,\nBlock- Phillaur", "A-A'", 43, "NA", 0.73, "Unpaved", "Unpaved", "Lease Owner", "Route Map\nattached"],
  [2, "Jalandhar Sutlej -\n2 Vill- Kadiana,\nBlock- Phillaur", "B-B'", 315, "NA", 0.48, "Unpaved", "Unpaved", "Lease Owner", "Route Map\nattached"],
  [3, "Jalandhar Sutlej -\n3 Vill- Chhaula,\nBlock- Phillaur", "C-C'", 127, "NA", 2.1, "Unpaved", "Unpaved", "Lease Owner", "Route Map\nattached"],
];

const defaultClusters = [
  ["Cluster Jalandhar Sutlej -\n1,2 Vill- Kadiana,\nBlock- Phillaur", "A-A', B-B'", 358, "NA", 0.73, "Unpaved", "Unpaved", "Lease Owner", "Route Map\nattached"],
  ["Cluster Jalandhar Beas -\n3,4 Vill- Chhaula,\nBlock- Phillaur", "C-C' TO F-\nF'", 343, "NA", 2.1, "Unpaved", "Unpaved", "Lease Owner", "Route Map\nattached"],
];

const roadOptions = ["Unpaved", "Black Topped", "Metalled", "WBM", "Other"];
const constructorOptions = ["Lease Owner", "Govt", "Govt./Lease Owner"];

// ── Helpers ──
function makeSelect(options, selected) {
  let html = `<select>`;
  options.forEach(o => {
    html += `<option${o === selected ? " selected" : ""}>${o}</option>`;
  });
  return html + `</select>`;
}

function delRow(btn) {
  btn.closest('tr').remove();
}

// ── Row Generators ──
function renderRouteRow(data) {
  const [sl, lease, route, tpLease, tpAll, len, roadType, recom, constr, map] = data;
  return `<tr>
    <td contenteditable="true">${sl}</td>
    <td contenteditable="true" style="text-align:left;white-space:pre-wrap">${lease}</td>
    <td contenteditable="true">${route}</td>
    <td contenteditable="true">${tpLease}</td>
    <td contenteditable="true">${tpAll}</td>
    <td contenteditable="true">${len}</td>
    <td>${makeSelect(roadOptions, roadType)}</td>
    <td>${makeSelect(roadOptions, recom)}</td>
    <td>${makeSelect(constructorOptions, constr)}</td>
    <td contenteditable="true" style="white-space:pre-wrap">${map}</td>
    <td>
      <button class="btn btn-xs btn-danger" onclick="delRow(this)" style="display:inline-flex; align-items:center; justify-content:center; padding:4px;">
        <i data-lucide="trash-2" style="width:12px; height:12px;"></i>
      </button>
    </td>
  </tr>`;
}

// ── Cluster Row Generator ──
function renderClusterRow(data) {
  const [cluster, route, tpCluster, tpAll, len, roadType, recom, constr, map] = data;
  return `<tr>
    <td contenteditable="true" style="text-align:left;white-space:pre-wrap">${cluster}</td>
    <td contenteditable="true">${route}</td>
    <td contenteditable="true">${tpCluster}</td>
    <td contenteditable="true">${tpAll}</td>
    <td contenteditable="true">${len}</td>
    <td>${makeSelect(roadOptions, roadType)}</td>
    <td>${makeSelect(roadOptions, recom)}</td>
    <td>${makeSelect(constructorOptions, constr)}</td>
    <td contenteditable="true" style="white-space:pre-wrap">${map}</td>
    <td>
      <button class="btn btn-xs btn-danger" onclick="delRow(this)" style="display:inline-flex; align-items:center; justify-content:center; padding:4px;">
        <i data-lucide="trash-2" style="width:12px; height:12px;"></i>
      </button>
    </td>
  </tr>`;
}

// ── Context-Aware Row Adders ──
function addAnx4Row(btn) {
  let tbody;
  if (btn) {
    tbody = btn.closest('.card').querySelector('.route-table-body');
  } else {
    tbody = document.querySelector('.route-table-body');
  }
  if (!tbody) return;
  const n = tbody.rows.length + 1;
  tbody.insertAdjacentHTML("beforeend", renderRouteRow([n, "", "", "", "", "", "Unpaved", "Unpaved", "Lease Owner", "Route Map attached"]));
  if (window.initLucide) window.initLucide();
}

function addAnx4ClusterRow(btn) {
  let tbody;
  if (btn) {
    tbody = btn.closest('.card').querySelector('.cluster-table-body');
  } else {
    tbody = document.querySelector('.cluster-table-body');
  }
  if (!tbody) return;
  tbody.insertAdjacentHTML("beforeend", renderClusterRow(["", "", "", "", "", "Unpaved", "Unpaved", "Lease Owner", "Route Map attached"]));
  if (window.initLucide) window.initLucide();
}

// ── Dynamic Table Blocks Generators ──
function addRouteTableBlock(prefill = false) {
  const container = document.getElementById("individual-routes-container");
  if (!container) return;
  
  const tableIdx = container.querySelectorAll(".table-block-card").length + 1;
  const title = tableIdx === 1 ? "Individual Lease Routes" : `Individual Lease Routes - Table ${tableIdx}`;
  
  const cardHtml = `
  <div class="card table-block-card" style="margin-bottom:24px;" data-type="individual">
    <div class="card-hd" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
      <div class="card-title-group" style="display:flex; align-items:center; gap:8px;">
        <span class="card-title" contenteditable="true" style="font-weight: 600; border-bottom: 1px dashed var(--border-2); outline: none;">${title}</span>
        <span class="text-soft" style="font-size:11px;">(Click to edit title)</span>
      </div>
      <div style="display:flex; gap:8px; align-items:center;">
        <button class="btn btn-excel-template btn-xs" onclick="downloadRouteTemplate(this)" style="display:inline-flex; align-items:center; gap:6px;">
          <i data-lucide="file-spreadsheet" style="width:12px; height:12px;"></i>
          <span>Routes Template</span>
        </button>
        <label class="btn btn-excel-upload btn-xs" style="cursor:pointer; margin-bottom:0; display:inline-flex; align-items:center; gap:6px;">
          <i data-lucide="upload" style="width:12px; height:12px;"></i>
          <span>Upload Routes</span>
          <input type="file" accept=".xlsx,.xls" hidden onchange="uploadRoutes(event, this)">
        </label>
        <button class="btn btn-xs btn-outline" style="display:inline-flex; align-items:center; gap:6px;" onclick="addAnx4Row(this)">
          <i data-lucide="plus" style="width:12px; height:12px;"></i>
          <span>Add Row</span>
        </button>
        <button class="btn btn-xs btn-danger btn-delete-table" onclick="deleteTableBlock(this)" style="display:inline-flex; align-items:center; gap:6px;">
          <i data-lucide="trash-2" style="width:12px; height:12px;"></i>
          <span>Delete Table</span>
        </button>
      </div>
    </div>
    <div class="card-bd">
      <div class="tbl-wrap">
        <table class="anx-tbl" style="min-width:1100px">
          <thead>
            <tr>
              <th style="width:50px">Sl.No.</th>
              <th style="min-width:160px">Lease No.</th>
              <th style="min-width:90px">Transportation Route No.</th>
              <th style="min-width:80px">Number of Tippers/day<br>(of lease)</th>
              <th style="min-width:80px">Number of tippers/day<br>(of all leases on route)</th>
              <th style="min-width:80px">Length of Route (Km)</th>
              <th style="min-width:100px">Type of Road</th>
              <th style="min-width:110px">Recommendation for road</th>
              <th style="min-width:110px">The road will be constructed by</th>
              <th style="min-width:100px">Route Map &amp; Location</th>
              <th style="width:50px">Action</th>
            </tr>
          </thead>
          <tbody class="route-table-body">
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
  
  container.insertAdjacentHTML("beforeend", cardHtml);
  
  const addedCard = container.lastElementChild;
  const tbody = addedCard.querySelector(".route-table-body");
  
  if (prefill) {
    tbody.innerHTML = defaultRoutes.map(renderRouteRow).join("");
  } else {
    tbody.innerHTML = renderRouteRow([1, "", "", "", "", "", "Unpaved", "Unpaved", "Lease Owner", "Route Map attached"]);
  }
  
  updateDeleteButtonsVisibility("individual");
  if (window.initLucide) window.initLucide();
}

function addClusterTableBlock(prefill = false) {
  const container = document.getElementById("cluster-routes-container");
  if (!container) return;
  
  const tableIdx = container.querySelectorAll(".table-block-card").length + 1;
  const title = tableIdx === 1 ? "Cluster Transportation Routes" : `Cluster Transportation Routes - Table ${tableIdx}`;
  
  const cardHtml = `
  <div class="card table-block-card" style="margin-bottom:24px;" data-type="cluster">
    <div class="card-hd" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
      <div class="card-title-group" style="display:flex; align-items:center; gap:8px;">
        <span class="card-title" contenteditable="true" style="font-weight: 600; border-bottom: 1px dashed var(--border-2); outline: none;">${title}</span>
        <span class="text-soft" style="font-size:11px;">(Click to edit title)</span>
      </div>
      <div style="display:flex; gap:8px; align-items:center;">
        <button class="btn btn-excel-template btn-xs" onclick="downloadClusterTemplate(this)" style="display:inline-flex; align-items:center; gap:6px;">
          <i data-lucide="file-spreadsheet" style="width:12px; height:12px;"></i>
          <span>Cluster Template</span>
        </button>
        <label class="btn btn-excel-upload btn-xs" style="cursor:pointer; margin-bottom:0; display:inline-flex; align-items:center; gap:6px;">
          <i data-lucide="upload" style="width:12px; height:12px;"></i>
          <span>Upload Cluster</span>
          <input type="file" accept=".xlsx,.xls" hidden onchange="uploadClusters(event, this)">
        </label>
        <button class="btn btn-xs btn-outline" style="display:inline-flex; align-items:center; gap:6px;" onclick="addAnx4ClusterRow(this)">
          <i data-lucide="plus" style="width:12px; height:12px;"></i>
          <span>Add Row</span>
        </button>
        <button class="btn btn-xs btn-danger btn-delete-table" onclick="deleteTableBlock(this)" style="display:inline-flex; align-items:center; gap:6px;">
          <i data-lucide="trash-2" style="width:12px; height:12px;"></i>
          <span>Delete Table</span>
        </button>
      </div>
    </div>
    <div class="card-bd">
      <div class="tbl-wrap">
        <table class="anx-tbl" style="min-width:1000px">
          <thead>
            <tr>
              <th style="min-width:130px">Cluster No</th>
              <th style="min-width:90px">Transportation Route No</th>
              <th style="min-width:80px">Number of tippers/day<br>(of cluster)</th>
              <th style="min-width:80px">Number of tippers/day<br>(of all clusters on route)</th>
              <th style="min-width:80px">Length of Route in KM</th>
              <th style="min-width:100px">Type of Road</th>
              <th style="min-width:110px">Recommendation for road</th>
              <th style="min-width:110px">The road will be constructed by</th>
              <th style="min-width:100px">Route Map &amp; Location</th>
              <th style="width:50px">Action</th>
            </tr>
          </thead>
          <tbody class="cluster-table-body">
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
  
  container.insertAdjacentHTML("beforeend", cardHtml);
  
  const addedCard = container.lastElementChild;
  const tbody = addedCard.querySelector(".cluster-table-body");
  
  if (prefill) {
    tbody.innerHTML = defaultClusters.map(renderClusterRow).join("");
  } else {
    tbody.innerHTML = renderClusterRow(["", "", "", "", "", "Unpaved", "Unpaved", "Lease Owner", "Route Map attached"]);
  }
  
  updateDeleteButtonsVisibility("cluster");
  if (window.initLucide) window.initLucide();
}

function deleteTableBlock(btn) {
  const card = btn.closest('.card');
  const container = card.parentElement;
  const type = card.getAttribute('data-type');
  
  const count = container.querySelectorAll(".table-block-card").length;
  if (count <= 1) {
    toast("You cannot delete the last remaining table.", "warn");
    return;
  }
  
  if (confirm("Are you sure you want to delete this entire table block?")) {
    card.remove();
    updateDeleteButtonsVisibility(type);
    toast("Table block deleted.", "success");
  }
}

function updateDeleteButtonsVisibility(type) {
  const container = document.getElementById(type === "individual" ? "individual-routes-container" : "cluster-routes-container");
  if (!container) return;
  
  const cards = container.querySelectorAll(".table-block-card");
  cards.forEach(card => {
    const delBtn = card.querySelector(".btn-delete-table");
    if (delBtn) {
      delBtn.style.display = cards.length <= 1 ? "none" : "inline-flex";
    }
  });
}

// ── Initializers ──
function initRoutesTable() {
  const container = document.getElementById("individual-routes-container");
  if (!container) return;
  container.innerHTML = "";
  addRouteTableBlock(true); // pre-populate with default examples
}

function initClustersTable() {
  const container = document.getElementById("cluster-routes-container");
  if (!container) return;
  container.innerHTML = "";
  addClusterTableBlock(true); // pre-populate with default examples
}

// ── Context-Aware Excel Template Downloads ──
function downloadRouteTemplate(btn) {
  const card = btn ? btn.closest('.card') : document.querySelector('.table-block-card[data-type="individual"]');
  if (!card) return;
  const tbody = card.querySelector('.route-table-body');
  const title = card.querySelector('.card-title').textContent.trim();
  
  const wb = XLSX.utils.book_new();
  const headers = ["Sl.No", "Lease No.", "Transportation Route No.", "Number of Tippers/day of lease",
    "Number of tippers/day of all leases on route", "Length of Route (Km)",
    "Type of Road (Black Topped/Unpaved)", "Recommendation for road (Black Topped/Unpaved)",
    "The road will be constructed by Govt./Lease Owner", "Route Map & Location"];
  
  const rows = tbody.querySelectorAll("tr");
  const data = Array.from(rows).map(tr => {
    const cells = tr.querySelectorAll("td");
    return [
      cells[0].textContent.trim(),
      cells[1].textContent.trim(),
      cells[2].textContent.trim(),
      cells[3].textContent.trim(),
      cells[4].textContent.trim(),
      cells[5].textContent.trim(),
      cells[6].querySelector("select").value,
      cells[7].querySelector("select").value,
      cells[8].querySelector("select").value,
      cells[9].textContent.trim(),
    ];
  });
  
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  ws['!cols'] = [8,30,16,16,18,12,18,20,22,18].map(w => ({wch:w}));
  XLSX.utils.book_append_sheet(wb, ws, "Transportation_Routes");
  
  const safeFilename = title.replace(/[^a-z0-9]/gi, '_') + "_Template.xlsx";
  XLSX.writeFile(wb, safeFilename);
  toast(`${title} Excel downloaded ✓`, "success");
}

function downloadClusterTemplate(btn) {
  const card = btn ? btn.closest('.card') : document.querySelector('.table-block-card[data-type="cluster"]');
  if (!card) return;
  const tbody = card.querySelector('.cluster-table-body');
  const title = card.querySelector('.card-title').textContent.trim();
  
  const wb = XLSX.utils.book_new();
  const headers = ["Cluster No", "Transportation Route No", "Number of tippers/day of cluster",
    "Number of tippers/day of all clusters on route", "Length of Route in KM",
    "Type of Road (Black Topped/Unpaved)", "Recommendation for road (Black Topped/Unpaved)",
    "The road will be constructed by Govt/Lease Owner", "Route Map & Location"];
  
  const rows = tbody.querySelectorAll("tr");
  const data = Array.from(rows).map(tr => {
    const cells = tr.querySelectorAll("td");
    return [
      cells[0].textContent.trim(),
      cells[1].textContent.trim(),
      cells[2].textContent.trim(),
      cells[3].textContent.trim(),
      cells[4].textContent.trim(),
      cells[5].querySelector("select").value,
      cells[6].querySelector("select").value,
      cells[7].querySelector("select").value,
      cells[8].textContent.trim(),
    ];
  });
  
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  ws['!cols'] = [24,18,18,20,14,18,20,22,18].map(w => ({wch:w}));
  XLSX.utils.book_append_sheet(wb, ws, "Cluster_Routes");
  
  const safeFilename = title.replace(/[^a-z0-9]/gi, '_') + "_Template.xlsx";
  XLSX.writeFile(wb, safeFilename);
  toast(`${title} Excel downloaded ✓`, "success");
}

// ── Context-Aware Excel Upload ──
function uploadRoutes(event, btn) {
  const file = event.target.files[0];
  if (!file) return;
  const card = btn ? btn.closest('.card') : document.querySelector('.table-block-card[data-type="individual"]');
  if (!card) return;
  const tbody = card.querySelector('.route-table-body');
  const title = card.querySelector('.card-title').textContent.trim();
  
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const wb = XLSX.read(e.target.result, {type:"binary"});
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, {header:1, defval:""});
      if (rows.length < 2) { toast("No data rows found", "warn"); return; }
      const dataRows = rows.slice(1).filter(r => r.some(c => c !== ""));
      tbody.innerHTML = dataRows.map(r => renderRouteRow([
        r[0]||"", r[1]||"", r[2]||"", r[3]||"", r[4]||"", r[5]||"",
        r[6]||"Unpaved", r[7]||"Unpaved", r[8]||"Lease Owner", r[9]||"Route Map attached"
      ])).join("");
      if (window.initLucide) window.initLucide();
      toast(`Loaded ${dataRows.length} route(s) into ${title} ✓`, "success");
    } catch(err) { toast("Error reading file: " + err.message, "error"); }
  };
  reader.readAsBinaryString(file);
  event.target.value = "";
}

function uploadClusters(event, btn) {
  const file = event.target.files[0];
  if (!file) return;
  const card = btn ? btn.closest('.card') : document.querySelector('.table-block-card[data-type="cluster"]');
  if (!card) return;
  const tbody = card.querySelector('.cluster-table-body');
  const title = card.querySelector('.card-title').textContent.trim();
  
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const wb = XLSX.read(e.target.result, {type:"binary"});
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, {header:1, defval:""});
      if (rows.length < 2) { toast("No data rows found", "warn"); return; }
      const dataRows = rows.slice(1).filter(r => r.some(c => c !== ""));
      tbody.innerHTML = dataRows.map(r => renderClusterRow([
        r[0]||"", r[1]||"", r[2]||"", r[3]||"", r[4]||"",
        r[5]||"Unpaved", r[6]||"Unpaved", r[7]||"Lease Owner", r[8]||"Route Map attached"
      ])).join("");
      if (window.initLucide) window.initLucide();
      toast(`Loaded ${dataRows.length} cluster route(s) into ${title} ✓`, "success");
    } catch(err) { toast("Error reading file: " + err.message, "error"); }
  };
  reader.readAsBinaryString(file);
  event.target.value = "";
}

// ── Multi-Table PDF Export (Portrait Layout - Pure Black & White) ──
function exportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  
  const pageW = doc.internal.pageSize.getWidth(); // 210mm
  const pageH = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 12; 

  const drawnPages = new Set();

  // Reusable function to draw borders and headers on each page (Pure Black & White)
  function drawFurnitureForPage(pageNum) {
    if (drawnPages.has(pageNum)) return;
    drawnPages.add(pageNum);

    // Outer Border (Black)
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.rect(margin, margin, pageW - (margin * 2), pageH - (margin * 2));

    // Header Text (Black)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0); // Pure Black
    doc.text("Enforcement & Monitoring Guidelines for Sand Mining", pageW - margin - 2, margin + 5, { align: "right" });

    // Footer Elements (Black)
    const footerY = pageH - margin - 15;
    
    // Horizontal separator line for footer inside the border
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.line(margin, footerY, pageW - margin, footerY);

    // Footer Text
    doc.setFont("times", "bold");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0); // Pure Black
    doc.text("PREPARED BY: SUB-DIVISIONAL COMMITTEE OF JALANDHAR DISTRICT", pageW / 2, footerY + 5, { align: "center" });
    doc.text("ASSISTED BY: RSP GREEN DEVELOPMENT AND LABORATORIES PVT. LTD", pageW / 2, footerY + 9, { align: "center" });

    // Page Number
    const finalPageNum = 341 + pageNum; 
    doc.setFontSize(10);
    doc.text(String(finalPageNum), pageW - margin + 3, pageH - margin + 4, { align: "right" });
  }

  let currentY = margin + 20;

  // Title: "Annexure-IV"
  doc.setFont("times", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0); // Pure Black
  doc.text("Annexure-IV", pageW - margin - 15, currentY, { align: "right" });
  currentY += 8;

  // Subtitle
  doc.setFontSize(10);
  doc.text(">  Transportation Routes for individual leases and leases in Cluster:", margin + 8, currentY);
  currentY += 6;

  const routeCards = document.getElementById("individual-routes-container")?.querySelectorAll(".table-block-card") || [];
  
  routeCards.forEach((card, cardIdx) => {
    const titleText = card.querySelector(".card-title").textContent.trim();
    const tbody = card.querySelector(".route-table-body");
    if (!tbody) return;

    // Check if title + header + 2 rows (approx 50mm) fit on the page before printing
    if (currentY + 50 > pageH - 25) {
      doc.addPage();
      currentY = margin + 20;
    }

    doc.setFont("times", "bold");
    doc.setFontSize(10);
    doc.text(`Table ${cardIdx + 1}: ${titleText}`, margin + 8, currentY);
    currentY += 5;

    const routeHead = [[
      "SL.N\no", 
      "Lease No.", 
      "Transport\nation\nRoute No.", 
      "Num\nber\nof\nTipp\ners\n/days\nof\nlease", 
      "Numbe\nr of\ntippers\n/days of\nall the\nlease on\nroute", 
      "Length\nof the\nRoute\nin Km", 
      "Type of\nRoad\n(Black\nTopped/\nunpaved)", 
      "Recomme\nndation\nfor road\n(Black\nTopped/\nunpaved)", 
      "The road will\nbe constructed\nby Govt./ Lease\nOwner", 
      "Route Map &\nLocation"
    ]];

    const rows = tbody.querySelectorAll("tr");
    const routeData = Array.from(rows).map(tr => {
      const cells = tr.querySelectorAll("td");
      return [
        cells[0].textContent.trim(),
        cells[1].textContent.trim(),
        cells[2].textContent.trim(),
        cells[3].textContent.trim(),
        cells[4].textContent.trim(),
        cells[5].textContent.trim(),
        cells[6].querySelector("select").value,
        cells[7].querySelector("select").value,
        cells[8].querySelector("select").value,
        cells[9].textContent.trim(),
      ];
    });

    doc.autoTable({
      head: routeHead,
      body: routeData,
      startY: currentY,
      margin: { top: margin + 12, bottom: 25, left: margin + 2, right: margin + 2 },
      theme: 'grid',
      styles: {
        font: "times", 
        fontSize: 9, 
        cellPadding: 1.2,
        valign: "middle", 
        halign: "center", 
        lineColor: [0, 0, 0], 
        lineWidth: 0.3,
        textColor: [0, 0, 0],
        overflow: "linebreak"
      },
      headStyles: { 
        fillColor: false, // Pure White Header Background
        textColor: [0, 0, 0], 
        fontStyle: "bold", 
        fontSize: 9,
        halign: "center"
      },
      alternateRowStyles: { fillColor: false },
      columnStyles: {
        0: { cellWidth: 9 }, 
        1: { halign: "left", cellWidth: 32 }, 
        2: { cellWidth: 15 }, 
        3: { cellWidth: 12 }, 
        4: { cellWidth: 14 }, 
        5: { cellWidth: 12 }, 
        6: { cellWidth: 17 }, 
        7: { cellWidth: 20 }, 
        8: { cellWidth: 28 }, 
        9: { cellWidth: 23 }  
      },
      didDrawPage: (data) => {
        drawFurnitureForPage(data.pageNumber);
      }
    });

    currentY = doc.lastAutoTable.finalY + 12;
  });

  const clusterCards = document.getElementById("cluster-routes-container")?.querySelectorAll(".table-block-card") || [];

  clusterCards.forEach((card, cardIdx) => {
    const titleText = card.querySelector(".card-title").textContent.trim();
    const tbody = card.querySelector(".cluster-table-body");
    if (!tbody) return;

    // Check if title + header + 2 rows (approx 50mm) fit on the page before printing
    if (currentY + 50 > pageH - 25) {
      doc.addPage();
      currentY = margin + 20;
    }

    doc.setFont("times", "bold");
    doc.setFontSize(10);
    doc.text(`Cluster Table ${cardIdx + 1}: ${titleText}`, margin + 8, currentY);
    currentY += 5;

    const clusterHead = [[
      "Cluster No", 
      "Transporta\ntion Route\nNo", 
      "Num\nber\nof\ntippe\nrs\n/day\nof\nclust\ner", 
      "Numbe\nr of\ntipper\ns /day\nof a l l\nthe\ncluster\ns on\nroute", 
      "Leng\nth of\nRout\ne in\nKM", 
      "Type of\nRoad\n(Black\nTopped/\nunpaved)", 
      "Recomm\nendation\nfor road\n(Black\nTopped/\nunpaved\n)", 
      "The road\nwill be\nConstru\ncted by\nGovt/Le\na Se\nOwner", 
      "Route Map\n& Locati on"
    ]];

    const rows = tbody.querySelectorAll("tr");
    const clusterData = Array.from(rows).map(tr => {
      const cells = tr.querySelectorAll("td");
      return [
        cells[0].textContent.trim(),
        cells[1].textContent.trim(),
        cells[2].textContent.trim(),
        cells[3].textContent.trim(),
        cells[4].textContent.trim(),
        cells[5].querySelector("select").value,
        cells[6].querySelector("select").value,
        cells[7].querySelector("select").value,
        cells[8].textContent.trim(),
      ];
    });

    doc.autoTable({
      head: clusterHead,
      body: clusterData,
      startY: currentY,
      margin: { top: margin + 12, bottom: 25, left: margin + 2, right: margin + 2 },
      theme: 'grid',
      styles: {
        font: "times", 
        fontSize: 9, 
        cellPadding: 1.5,
        valign: "middle", 
        halign: "center", 
        lineColor: [0, 0, 0], 
        lineWidth: 0.3,
        textColor: [0, 0, 0],
        overflow: "linebreak"
      },
      headStyles: { 
        fillColor: false, // Pure White Header Background
        textColor: [0, 0, 0], 
        fontStyle: "bold", 
        fontSize: 9,
        halign: "center"
      },
      alternateRowStyles: { fillColor: false },
      columnStyles: {
        0: { halign: "center", cellWidth: 35 }, 
        1: { cellWidth: 18 }, 
        2: { cellWidth: 12 }, 
        3: { cellWidth: 17 }, 
        4: { cellWidth: 12 }, 
        5: { cellWidth: 20 }, 
        6: { cellWidth: 22 }, 
        7: { cellWidth: 22 }, 
        8: { cellWidth: 24 }  
      },
      didDrawPage: (data) => {
        drawFurnitureForPage(data.pageNumber);
      }
    });

    currentY = doc.lastAutoTable.finalY + 12;
  });

  doc.save("Annexure_IV_Transportation_Routes.pdf");
  toast("PDF Exported with exact formatting successfully!", "success");
}

// Initializer execution binding
setTimeout(() => {
  if (document.getElementById('individual-routes-container')) {
    initRoutesTable();
    initClustersTable();
  }
}, 100);

// ── PDF UPLOAD & PREVIEW (ANNEXURE IV) ──
function renderPdfUploadUIAnx4() {
  const nameEl = document.getElementById('anx4-uploaded-filename');
  const dlBtn = document.getElementById('anx4-download-btn');
  const delBtn = document.getElementById('anx4-delete-btn');
  const previewBtn = document.getElementById('anx4-preview-btn');
  const previewSection = document.getElementById('pdf-preview-section-anx4');
  const iframe = document.getElementById('pdf-iframe-anx4');
  
  if (!nameEl || !dlBtn) return;

  if (!S.activeProject) {
    nameEl.style.display = 'none';
    dlBtn.style.display = 'none';
    if (delBtn) delBtn.style.display = 'none';
    if (previewBtn) previewBtn.style.display = 'none';
    if (previewSection) previewSection.style.display = 'none';
    return;
  }

  const pdfName = S.activeProject.anx4PdfName;

  if (!pdfName) {
    nameEl.style.display = 'none';
    dlBtn.style.display = 'none';
    if (delBtn) delBtn.style.display = 'none';
    if (previewBtn) previewBtn.style.display = 'none';
    if (previewSection) {
      previewSection.style.display = 'none';
      if (iframe) iframe.src = '';
    }
  } else {
    nameEl.textContent = pdfName;
    nameEl.style.display = 'inline-block';
    dlBtn.style.display = 'inline-flex';
    if (delBtn) delBtn.style.display = 'inline-flex';
    if (previewBtn) previewBtn.style.display = 'inline-flex';
    
    if (previewSection && previewSection.style.display === 'block' && iframe) {
      const fileURL = `/api/download-pdf?projectId=${S.activeProject.id}&annexureId=anx4&inline=true`;
      if (iframe.src !== window.location.origin + fileURL && !iframe.src.includes(fileURL)) {
        iframe.src = fileURL;
      }
    }
  }

  if (window.initLucide) window.initLucide();
}

function togglePDFPreviewAnx4() {
  const previewSection = document.getElementById('pdf-preview-section-anx4');
  const iframe = document.getElementById('pdf-iframe-anx4');
  if (!previewSection || !iframe) return;

  if (previewSection.style.display === 'block') {
    previewSection.style.display = 'none';
    if (iframe.src.startsWith('blob:')) {
      URL.revokeObjectURL(iframe.src);
    }
    iframe.src = '';
  } else {
    if (S.activeProject && S.activeProject.anx4PdfName) {
      const fileURL = `/api/download-pdf?projectId=${S.activeProject.id}&annexureId=anx4&inline=true`;
      iframe.src = fileURL;
      previewSection.style.display = 'block';
    }
  }
}

function handlePDFUploadAnx4(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.name.toLowerCase().endsWith('.pdf')) {
    toast('Error: Only PDF files are allowed.', 'danger');
    event.target.value = '';
    return;
  }

  toast('Uploading PDF...', 'info');

  const reader = new FileReader();
  reader.onload = async function(e) {
    const base64Data = e.target.result.split(',')[1];
    try {
      const res = await fetch('/api/upload-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: S.activeProject.id,
          fileName: file.name,
          pdf: base64Data,
          annexureId: 'anx4'
        })
      });
      const data = await res.json();
      if (data.success) {
        S.activeProject.anx4PdfName = file.name;
        const pIdx = S.projects.findIndex(p => p.id === S.activeProject.id);
        if (pIdx !== -1) {
          S.projects[pIdx].anx4PdfName = file.name;
        }
        
        const fileURL = URL.createObjectURL(file);
        const iframe = document.getElementById('pdf-iframe-anx4');
        const previewSection = document.getElementById('pdf-preview-section-anx4');
        if (iframe && previewSection) {
          iframe.src = fileURL;
          previewSection.style.display = 'block';
        }
        
        renderPdfUploadUIAnx4();
        toast('PDF uploaded and preview loaded!', 'success');
      } else {
        toast('Failed to upload PDF: ' + (data.error || 'Unknown error'), 'danger');
      }
    } catch(err) {
      toast('Error uploading PDF: ' + err.message, 'danger');
    }
    event.target.value = '';
  };
  reader.readAsDataURL(file);
}

async function deletePdfAnx4() {
  if (!S.activeProject) return;
  
  if (!confirm("Are you sure you want to delete the uploaded PDF? This will remove the file from the server.")) {
    return;
  }
  
  toast("Deleting PDF...", "info");
  try {
    const res = await fetch(`/api/upload-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: S.activeProject.id,
        fileName: null,
        pdf: null,
        annexureId: 'anx4'
      })
    });
    const data = await res.json();
    if (data.success) {
      S.activeProject.anx4PdfName = null;
      const pIdx = S.projects.findIndex(p => p.id === S.activeProject.id);
      if (pIdx !== -1) {
        S.projects[pIdx].anx4PdfName = null;
      }
      
      renderPdfUploadUIAnx4();
      toast("PDF deleted successfully.", "success");
    } else {
      toast("Failed to delete PDF: " + (data.error || "Unknown error"), "danger");
    }
  } catch(err) {
    toast("Error deleting PDF: " + err.message, "danger");
  }
}

closePDFPreviewAnx4 = function() {
  const previewSection = document.getElementById('pdf-preview-section-anx4');
  const iframe = document.getElementById('pdf-iframe-anx4');
  
  if (previewSection) previewSection.style.display = 'none';
  if (iframe) {
    if (iframe.src.startsWith('blob:')) {
      URL.revokeObjectURL(iframe.src);
    }
    iframe.src = '';
  }
}

function downloadPdfAnx4() {
  if (!S.activeProject) {
    toast('Please select and open a project first.', 'warn');
    return;
  }
  if (!S.activeProject.anx4PdfName) {
    toast('No PDF has been uploaded for this project yet. Please upload a PDF first.', 'warn');
    return;
  }
  const a = document.createElement('a');
  a.href = `/api/download-pdf?projectId=${S.activeProject.id}&annexureId=anx4`;
  a.download = S.activeProject.anx4PdfName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
