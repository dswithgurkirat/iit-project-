// ── INDEXEDDB PERSISTENCE FALLBACK FOR VERCEL/STATIC HOSTS ──
const DB_NAME = 'DSR_Local_DB';
const DB_VERSION = 1;
const STORE_NAME = 'pdf_uploads';

function getDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = function(e) {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
    request.onsuccess = function(e) {
      resolve(e.target.result);
    };
    request.onerror = function(e) {
      reject(e.target.error);
    };
  });
}

async function savePDFToDB(projectId, annexureId, fileName, pdfBase64) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const key = `${projectId}_${annexureId}`;
    const request = store.put({ key: key, fileName: fileName, pdf: pdfBase64 });
    request.onsuccess = () => resolve(true);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function getPDFFromDB(projectId, annexureId) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const key = `${projectId}_${annexureId}`;
    const request = store.get(key);
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function deletePDFFromDB(projectId, annexureId) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const key = `${projectId}_${annexureId}`;
    const request = store.delete(key);
    request.onsuccess = () => resolve(true);
    request.onerror = (e) => reject(e.target.error);
  });
}

function b64toBlob(b64Data, contentType='', sliceSize=512) {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  return new Blob(byteArrays, {type: contentType});
}

async function getPDFLocalURL(projectId, annexureId) {
  try {
    const dbData = await getPDFFromDB(projectId, annexureId);
    if (dbData && dbData.pdf) {
      const blob = b64toBlob(dbData.pdf, 'application/pdf');
      return URL.createObjectURL(blob);
    }
  } catch (e) {
    console.error('Error loading PDF from DB:', e);
  }
  return null;
}

// Intercept window.fetch
const originalFetch = window.fetch;
window.fetch = async function(resource, options) {
  const url = typeof resource === 'string' ? resource : (resource instanceof Request ? resource.url : '');
  
  if (url.includes('/api/upload-pdf')) {
    try {
      const body = JSON.parse(options.body);
      const { projectId, fileName, pdf, annexureId = 'anx3' } = body;
      
      if (projectId) {
        if (fileName === null || pdf === null) {
          await deletePDFFromDB(projectId, annexureId);
        } else {
          await savePDFToDB(projectId, annexureId, fileName, pdf);
        }
      }
    } catch (e) {
      console.error('Failed to intercept upload to IndexedDB:', e);
    }
    
    try {
      const res = await originalFetch.call(window, resource, options);
      if (res.ok) return res;
    } catch (err) {
      console.warn('Backend fetch failed, returning local mock success:', err);
    }
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (url.includes('/api/projects')) {
    if (options && options.method === 'POST') {
      try {
        localStorage.setItem('dsr_projects', options.body);
      } catch (e) {
        console.error('Failed to save projects to localStorage:', e);
      }
      
      try {
        const res = await originalFetch.call(window, resource, options);
        if (res.ok) return res;
      } catch (err) {
        console.warn('Backend projects save failed, returning local mock success:', err);
      }
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // GET method
      try {
        const res = await originalFetch.call(window, resource, options);
        if (res.ok) {
          const clone = res.clone();
          const data = await clone.text();
          localStorage.setItem('dsr_projects', data);
          return res;
        }
      } catch (err) {
        console.warn('Backend projects load failed, falling back to localStorage:', err);
      }
      
      const localData = localStorage.getItem('dsr_projects');
      if (localData) {
        return new Response(localData, {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  }
  
  return originalFetch.call(window, resource, options);
};

// Intercept iframe src setter to support local URL lookup
const originalIFrameSrcSetter = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'src').set;
Object.defineProperty(HTMLIFrameElement.prototype, 'src', {
  set: async function(url) {
    if (typeof url === 'string' && url.includes('/api/download-pdf')) {
      const urlObj = new URL(url, window.location.origin);
      const projectId = urlObj.searchParams.get('projectId');
      const annexureId = urlObj.searchParams.get('annexureId') || 'anx3';
      
      const localUrl = await getPDFLocalURL(projectId, annexureId);
      if (localUrl) {
        originalIFrameSrcSetter.call(this, localUrl);
        return;
      }
    }
    originalIFrameSrcSetter.call(this, url);
  },
  get: function() {
    return Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'src').get.call(this);
  }
});

// Intercept window.open
const originalWindowOpen = window.open;
window.open = async function(url, target, features) {
  if (typeof url === 'string' && url.includes('/api/download-pdf')) {
    const urlObj = new URL(url, window.location.origin);
    const projectId = urlObj.searchParams.get('projectId');
    const annexureId = urlObj.searchParams.get('annexureId') || 'anx3';
    
    const dbData = await getPDFFromDB(projectId, annexureId);
    if (dbData && dbData.pdf) {
      const blob = b64toBlob(dbData.pdf, 'application/pdf');
      const localUrl = URL.createObjectURL(blob);
      return originalWindowOpen.call(window, localUrl, target, features);
    }
  }
  return originalWindowOpen.call(window, url, target, features);
};

// Intercept all download links clicked for PDFs
document.addEventListener('click', async function(e) {
  const a = e.target.closest('a');
  if (a && a.href && a.href.includes('/api/download-pdf')) {
    const urlObj = new URL(a.href, window.location.origin);
    const projectId = urlObj.searchParams.get('projectId');
    const annexureId = urlObj.searchParams.get('annexureId') || 'anx3';
    
    const dbData = await getPDFFromDB(projectId, annexureId);
    if (dbData && dbData.pdf) {
      e.preventDefault();
      const blob = b64toBlob(dbData.pdf, 'application/pdf');
      const localUrl = URL.createObjectURL(blob);
      
      const tempLink = document.createElement('a');
      tempLink.href = localUrl;
      tempLink.download = a.download || `${annexureId}.pdf`;
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      URL.revokeObjectURL(localUrl);
    }
  }
}, true);

/* ══════════════════════════════════════
   STATE
══════════════════════════════════════ */
const S = {
  user: null,
  role: 'user',
  activeProject: null,
  pendingOTPsigId: null,
  projects: [],
  chapters: [
    { id:1, name:'CHAPTER 1 — INTRODUCTION', summary:'Overview of the district and purpose of the DSR under EMGSM 2020 guidelines.' },
    { id:2, name:'CHAPTER 2 — OVERVIEW OF MINING ACTIVITIES IN THE DISTRICT', summary:'Current and historical sand mining activities, lease details, and district statistics.' },
    { id:3, name:'CHAPTER 3 — PROCESS OF DEPOSITION OF SEDIMENTS IN THE RIVERS OF THE DISTRICT', summary:'River morphology, sedimentation rates, and annual replenishment estimates.' },
    { id:4, name:'CHAPTER 4 — GENERAL PROFILE OF THE DISTRICT', summary:'Geographic, demographic, and administrative profile of the district.' },
    { id:5, name:'CHAPTER 5 — PHYSIOGRAPHY OF THE DISTRICT', summary:'Terrain, drainage patterns, river systems, and physical features.' },
    { id:6, name:'CHAPTER 6 — GEOLOGY AND MINERAL WEALTH', summary:'Geological formations, mineral deposits, and subsurface characteristics.' },
    { id:7, name:'CHAPTER 7 — ESTIMATION OF DEPOSITS AND REPLENISHMENT STUDIES', summary:'Scientific estimation of available sand deposits and annual natural replenishment.' },
    { id:8, name:'CHAPTER 8 — TRANSPORT', summary:'Transportation infrastructure, road conditions, and logistics for mining operations.' },
    { id:9, name:'CHAPTER 9 — REMEDIAL MEASURE TO MITIGATE THE IMPACT OF MINING', summary:'Environmental safeguards, monitoring mechanisms, and impact mitigation plans.' },
    { id:10, name:'CHAPTER 10 — CONCLUSION', summary:'Summary findings, recommendations, and compliance declarations.' }
  ],
  plates: [
    { id:101, name:'Plate 1 — Pre/Post Monsoon Cross Section', summary:'Auto-generated elevation chart for sand volume calculation.', graphId: 'g1' },
    { id:102, name:'Plate 2 — Geological Subsurface Map', summary:'Detailed lithological boundaries and soil types.', graphId: '' }
  ],
  graphs: [
    { 
      id: 'g1', 
      name: 'PO_JL_NR_ST_28', 
      dist: '0,25,50',
      post: '227.76,227.75,227.65',
      red: '224.30', 
      thal: '223.40', 
      area: '1.60', 
      noMine: '0', 
      bulk: '1.52', 
      pct: '60',
      calcThick: '3.0',
      hasSubGraph: false,
      subName: 'PR_JL_NR_ST_28',
      subDist: '0,25,50',
      subElev: '227.59,227.39,227.26',
      subRed: '224.30',
      subThal: '223.40'
    }
  ],
  graphCharts: {},
  signatures: [
    { id:1, role:'Sub-Divisional Officer', name:'Rajinder Kumar', dept:'Revenue Department, Jalandhar', order:1, signed:true, signedAt:'May 20, 2026 · 10:32 AM', method:'Aadhaar eSign' },
    { id:2, role:'District Mining Officer', name:'Dr. Suresh Verma', dept:'Dept. of Geology & Mining, Punjab', order:2, signed:false, signedAt:null, method:null },
    { id:3, role:'Deputy Commissioner', name:'IAS Officer (Deputed)', dept:'DC Office, Jalandhar', order:3, signed:false, signedAt:null, method:null },
    { id:4, role:'Director, Mining', name:'Director of Mines', dept:'Punjab State Mining Directorate', order:4, signed:false, signedAt:null, method:null },
    { id:5, role:'Principal Secretary', name:'Principal Secretary (Mines)', dept:'Govt. of Punjab', order:5, signed:false, signedAt:null, method:null }
  ],
  demandDistricts: ['Jalandhar', 'Ludhiana', 'Mansa', 'Hoshiarpur', 'Pathankot', 'Rupnagar', 'Tarn Taran'],
  summarySources: [
    'River bed (Existing)','River bed (New Proposed)','Agriculture land, pattas etc. (Existing)',
    'Desilting sites (ponds, lakes, dams etc.) (Proposed)','Desilting sites (ponds, lakes, dams etc.) (Existing)',
    'M-sand (Proposed)','M-sand (Existing)','Clusters (Existing & Proposed)'
  ],
  auctionData: [],
  uploadedPDFs: {},
  frontMatter: {
    title: 'District Survey Report for Sand Mining',
    district: 'Jalandhar',
    state: 'Punjab',
    year: '2025-26',
    version: 'Final Draft',
    preparedBy: 'Sub-Divisional Committee, Jalandhar District',
    assistedBy: 'RSP Green Development and Laboratories Pvt. Ltd.',
    preface: 'This District Survey Report (DSR) for Jalandhar District has been prepared in compliance with the Enforcement and Monitoring Guidelines for Sand Mining (EMGSM) 2020. The report provides a comprehensive assessment of sand mining activities, river morphology, mineral deposits, replenishment studies, and transportation routes within the district.',
    acknowledgement: 'The Sub-Divisional Committee of Jalandhar District acknowledges the support of the Punjab State Government, Department of Geology and Mining, and all field surveyors who contributed to this report.'
  }
};
