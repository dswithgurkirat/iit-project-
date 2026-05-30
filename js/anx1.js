/* ══════════════════════════════════════
   ANNEXURE I — SAND SOURCES
   ══════════════════════════════════════ */

// --- 1. TEMPLATE DOWNLOAD ---
function downloadSectionTemplate(sectionType) {
  let csvContent = "";
  let filename = "";

  switch(sectionType) {
    case 'A':
      csvContent = "River Name/M-Sand Plant,Total Stretch of River (in KM),Type of River (Perennial or Non Perennial)\n";
      filename = "Table_A_Rivers_Template.csv";
      break;
    case 'B':
      csvContent = "b) De-Siltation Location (Lakes/Ponds/Dams etc.),,,,,,,\n,,,,,,,\nName of Reservoir/Dams,Maintain/Controlled by State Govt./PSU etc.,Latitude,Longitude,District,Tehsil,Village,Size (Ha)\n";
      filename = "Table_B_DeSiltation_Template.csv";
      break;
    case 'C':
      csvContent = "Owner,SL. No,Area (Ha),District,Tehsil,Village,Agricultural Land (Yes/No)\n";
      filename = "Table_C_Patta_Lands_Template.csv";
      break;
    case 'D':
      csvContent = "Plant Name,Owner,District,Tehsil,Village,Geo-location,Quantity Tonnes/Annum\n";
      filename = "Table_D_MSand_Template.csv";
      break;
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// --- 2. EXCEL UPLOAD PARSING ---
function handleSectionUpload(event, sectionType) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
      
      if (rows.length === 0) {
        toast("The uploaded file is empty.", "warn");
        return;
      }

      processExcelData(rows, sectionType);
    } catch (error) {
      toast("Error parsing file. Please ensure it is a valid Excel or CSV file.", "error");
      console.error(error);
    }
    event.target.value = ''; 
  };
  reader.readAsArrayBuffer(file);
}

function processExcelData(rows, sectionType) {
  const validRows = rows.filter(row => row.some(cell => String(cell !== undefined && cell !== null ? cell : "").trim() !== ""));
  let startIndex = 0; 

  const headerIdx = validRows.findIndex(row => {
    const rowStr = row.map(c => String(c || '')).join(' ').toLowerCase();
    if (sectionType === 'A') return rowStr.includes('river');
    if (sectionType === 'B') return rowStr.includes('reservoir');
    if (sectionType === 'C') return rowStr.includes('owner');
    if (sectionType === 'D') return rowStr.includes('plant');
    return false;
  });

  if (headerIdx >= 0) {
    startIndex = headerIdx + 1;
  }

  const dataRows = validRows.slice(startIndex);
  
  if(dataRows.length === 0) {
    toast("No data found after the header in the uploaded file.", "warn");
    return;
  }
  
  let tableId = '';
  if (sectionType === 'A') tableId = 'anx1-rivers';
  if (sectionType === 'B') tableId = 'anx1-desilt';
  if (sectionType === 'C') tableId = 'anx1-patta';
  if (sectionType === 'D') tableId = 'anx1-msand';

  const tbody = document.getElementById(tableId).querySelector('tbody');
  tbody.innerHTML = ''; 

  dataRows.forEach(rowData => {
    while (rowData.length < 8) rowData.push(""); 

    let cellDataArray = [];
    const actionBtn = "<button class='btn btn-xs btn-danger' onclick='delRow(this)' style='display:inline-flex;align-items:center;justify-content:center;padding:4px;'><i data-lucide='trash-2' style='width:12px;height:12px;'></i></button>";

    if (sectionType === 'A') {
      let typeVal = String(rowData[2] || "").trim();
      let isNonPerennial = typeVal.toLowerCase().includes("non");
      let typeSelect = `<select><option ${!isNonPerennial ? 'selected' : ''}>Perennial</option><option ${isNonPerennial ? 'selected' : ''}>Non-Perennial</option></select>`;
      cellDataArray = [rowData[0], rowData[1], typeSelect, actionBtn];
    } 
    else if (sectionType === 'B') {
      cellDataArray = [rowData[0], rowData[1], rowData[2], rowData[3], rowData[4], rowData[5], rowData[6], rowData[7], actionBtn];
    } 
    else if (sectionType === 'C') {
      let agVal = String(rowData[6] || "").trim().toLowerCase();
      let agSelect = `<select><option ${agVal === 'yes' ? 'selected' : ''}>Yes</option><option ${agVal === 'no' ? 'selected' : ''}>No</option></select>`;
      cellDataArray = [rowData[0], rowData[1], rowData[2], rowData[3], rowData[4], rowData[5], agSelect, actionBtn];
    } 
    else if (sectionType === 'D') {
      cellDataArray = [rowData[0], rowData[1], rowData[2], rowData[3], rowData[4], rowData[5], rowData[6], actionBtn];
    }
    addRowAnx1(tableId, cellDataArray);
  });
  toast(`Uploaded section ${sectionType} data successfully`, 'success');
}

function addRowAnx1(tableId, cellDataArray) {
  const tbody = document.querySelector('#' + tableId + ' tbody');
  if (!tbody) return;
  const tr = document.createElement('tr');
  
  cellDataArray.forEach((data) => {
    const td = document.createElement('td');
    let dataStr = String(data !== undefined && data !== null ? data : '').trim();

    if (dataStr === '' && !dataStr.includes('<button') && !dataStr.includes('<select')) {
      dataStr = 'NUL';
    }

    if (!dataStr.includes('<button') && !dataStr.includes('<select')) {
      td.contentEditable = "true";
      td.textContent = dataStr;
    } else {
      td.innerHTML = dataStr;
    }
    tr.appendChild(td);
  });
  
  tbody.appendChild(tr);
  if (window.initLucide) window.initLucide();
}

// --- 3. FLAWLESS PAGINATED PDF GENERATOR ---
function exportAnx1PDF(btn) {
  if (typeof html2pdf === 'undefined') {
    const originalText = btn ? btn.innerText : 'Downloading...';
    if (btn) btn.innerText = "Loading PDF Engine...";
    
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    
    script.onload = () => {
      if (btn) btn.innerText = originalText;
      executePDFExport();
    };
    
    script.onerror = () => {
      if (btn) btn.innerText = originalText;
      toast("Failed to load PDF engine. Please check your internet connection.", "error");
    };
    
    document.head.appendChild(script);
  } else {
    executePDFExport();
  }
}

function executePDFExport() {
  const mainView = document.getElementById('view-anx1');
  const originalBodyPadding = document.body.style.padding;
  const originalBodyBg = document.body.style.backgroundColor;

  mainView.style.display = 'none';
  document.body.style.padding = '0';
  document.body.style.backgroundColor = '#ffffff';

  const printElement = document.createElement('div');
  printElement.id = 'pdf-render-container';
  printElement.style.width = '100%';
  printElement.style.maxWidth = '1000px'; 
  printElement.style.margin = '0 auto';
  printElement.style.fontFamily = 'Arial, Helvetica, sans-serif';
  printElement.style.color = '#000000';
  printElement.style.backgroundColor = '#ffffff';

  let html = `
    <div style="text-align: center; margin-bottom: 20px; padding-top: 10px;">
      <h2 style="margin: 0 0 5px 0; font-size: 22px; font-weight: bold; text-decoration: underline;">Annexure-I</h2>
      <h3 style="margin: 0; font-size: 16px; font-weight: normal;">Details of Sand/M-Sand Sources</h3>
    </div>
  `;

  const addTable = (tableId, sectionTitle, headers) => {
    let tableHtml = `<div style="margin-bottom: 25px; page-break-inside: avoid;">
      <h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">${sectionTitle}</h4>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #000;">
        <thead>
          <tr style="page-break-inside: avoid;">`;
    
    headers.forEach(h => {
      tableHtml += `<th style="border: 1px solid #000; padding: 6px; text-align: left; font-weight: bold; background-color: #f5f5f5;">${h}</th>`;
    });
    
    tableHtml += `</tr></thead><tbody>`;
    
    const rows = document.querySelectorAll(`#${tableId} tbody tr`);
    if(rows.length === 0) {
       tableHtml += `<tr style="page-break-inside: avoid;"><td colspan="${headers.length}" style="border: 1px solid #000; padding: 6px; text-align: center;">Data not provided</td></tr>`;
    } else {
      rows.forEach(row => {
        tableHtml += `<tr style="page-break-inside: avoid;">`;
        const cells = row.querySelectorAll('td');
        
        for(let i = 0; i < cells.length - 1; i++) {
           let val = "";
           const select = cells[i].querySelector('select');
           if (select) {
              val = select.value;
           } else {
              val = cells[i].innerText.trim();
           }
           tableHtml += `<td style="border: 1px solid #000; padding: 6px;">${val}</td>`;
        }
        tableHtml += `</tr>`;
      });
    }
    
    tableHtml += `</tbody></table></div>`;
    return tableHtml;
  };

  html += addTable('anx1-rivers', 'a) Rivers:', ['River Name/M-Sand Plant', 'Total Stretch of River (in KM)', 'Type of River (Perennial or Non Perennial)']);
  html += addTable('anx1-desilt', 'b) De-Siltation Location (Lakes/Ponds/Dams etc.):', ['Name of Reservoir/Dams', 'Maintain/Controlled by State Govt./PSU etc.', 'Latitude', 'Longitude', 'District', 'Tehsil', 'Village', 'Size (Ha)']);
  html += addTable('anx1-patta', 'c) Patta lands/Khatedari land:', ['Owner', 'SL. No', 'Area (Ha)', 'District', 'Tehsil', 'Village', 'Agricultural Land (Yes/No)']);
  html += addTable('anx1-msand', 'd) M-Sand Plants:', ['Plant Name', 'Owner', 'District', 'Tehsil', 'Village', 'Geo-location', 'Quantity Tonnes/Annum']);
  
  printElement.innerHTML = html;
  document.body.appendChild(printElement);

  const opt = {
    margin:       10,
    filename:     'Annexure_1_Sources.pdf',
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, windowWidth: document.body.scrollWidth },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak:    { mode: ['css', 'legacy'], avoid: ['tr', 'h4'] }
  };

  html2pdf().set(opt).from(printElement).save().then(() => {
    document.body.removeChild(printElement);
    document.body.style.padding = originalBodyPadding;
    document.body.style.backgroundColor = originalBodyBg;
    mainView.style.display = '';
    toast('PDF downloaded successfully!', 'success');
  }).catch(err => {
    console.error("PDF Error: ", err);
    if(document.body.contains(printElement)) document.body.removeChild(printElement);
    document.body.style.padding = originalBodyPadding;
    document.body.style.backgroundColor = originalBodyBg;
    mainView.style.display = '';
    toast('Failed to generate PDF', 'error');
  });
}

// --- 4. HANDLE PDF UPLOAD & PREVIEW ---
function renderPdfUploadUIAnx1() {
  const nameEl = document.getElementById('anx1-uploaded-filename');
  const dlBtn = document.getElementById('anx1-download-btn');
  const delBtn = document.getElementById('anx1-delete-btn');
  const previewBtn = document.getElementById('anx1-preview-btn');
  const previewSection = document.getElementById('pdf-preview-section');
  const iframe = document.getElementById('pdf-iframe');
  
  if (!nameEl || !dlBtn) return;

  if (!S.activeProject) {
    nameEl.style.display = 'none';
    dlBtn.style.display = 'none';
    if (delBtn) delBtn.style.display = 'none';
    if (previewBtn) previewBtn.style.display = 'none';
    if (previewSection) previewSection.style.display = 'none';
    return;
  }

  const pdfName = S.activeProject.anx1PdfName;

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
      const fileURL = `/api/download-pdf?projectId=${S.activeProject.id}&annexureId=anx1&inline=true`;
      if (iframe.src !== window.location.origin + fileURL && !iframe.src.includes(fileURL)) {
        iframe.src = fileURL;
      }
    }
  }

  if (window.initLucide) window.initLucide();
}

function togglePDFPreviewAnx1() {
  const previewSection = document.getElementById('pdf-preview-section');
  const iframe = document.getElementById('pdf-iframe');
  if (!previewSection || !iframe) return;

  if (previewSection.style.display === 'block') {
    previewSection.style.display = 'none';
    if (iframe.src.startsWith('blob:')) {
      URL.revokeObjectURL(iframe.src);
    }
    iframe.src = '';
  } else {
    if (S.activeProject && S.activeProject.anx1PdfName) {
      const fileURL = `/api/download-pdf?projectId=${S.activeProject.id}&annexureId=anx1&inline=true`;
      iframe.src = fileURL;
      previewSection.style.display = 'block';
    }
  }
}

async function deletePdfAnx1() {
  if (!S.activeProject) return;
  
  if (!confirm("Are you sure you want to delete the uploaded PDF? This will remove the file from the server.")) {
    return;
  }
  
  // Hide preview and clear iframe first to release Windows file lock
  const previewSection = document.getElementById('pdf-preview-section');
  const iframe = document.getElementById('pdf-iframe');
  if (previewSection) previewSection.style.display = 'none';
  if (iframe) {
    if (iframe.src.startsWith('blob:')) {
      URL.revokeObjectURL(iframe.src);
    }
    iframe.src = '';
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
        annexureId: 'anx1'
      })
    });
    const data = await res.json();
    if (data.success) {
      S.activeProject.anx1PdfName = null;
      const pIdx = S.projects.findIndex(p => p.id === S.activeProject.id);
      if (pIdx !== -1) {
        S.projects[pIdx].anx1PdfName = null;
      }
      
      renderPdfUploadUIAnx1();
      toast("PDF deleted successfully.", "success");
    } else {
      toast("Failed to delete PDF: " + (data.error || "Unknown error"), "danger");
    }
  } catch(err) {
    toast("Error deleting PDF: " + err.message, "danger");
  }
}

function handlePDFUpload(event) {
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
          annexureId: 'anx1'
        })
      });
      const data = await res.json();
      if (data.success) {
        S.activeProject.anx1PdfName = file.name;
        const pIdx = S.projects.findIndex(p => p.id === S.activeProject.id);
        if (pIdx !== -1) {
          S.projects[pIdx].anx1PdfName = file.name;
        }
        
        const fileURL = URL.createObjectURL(file);
        const iframe = document.getElementById('pdf-iframe');
        const previewSection = document.getElementById('pdf-preview-section');
        if (iframe && previewSection) {
          iframe.src = fileURL;
          previewSection.style.display = 'block';
        }
        
        renderPdfUploadUIAnx1();
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

function closePDFPreview() {
  const previewSection = document.getElementById('pdf-preview-section');
  const iframe = document.getElementById('pdf-iframe');
  
  if (previewSection) previewSection.style.display = 'none';
  if (iframe) {
    if (iframe.src.startsWith('blob:')) {
      URL.revokeObjectURL(iframe.src);
    }
    iframe.src = '';
  }
}

function downloadPdfAnx1() {
  if (!S.activeProject) {
    toast('Please select and open a project first.', 'warn');
    return;
  }
  if (!S.activeProject.anx1PdfName) {
    toast('No PDF has been uploaded for this project yet. Please upload a PDF first.', 'warn');
    return;
  }
  const a = document.createElement('a');
  a.href = `/api/download-pdf?projectId=${S.activeProject.id}&annexureId=anx1`;
  a.download = S.activeProject.anx1PdfName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
