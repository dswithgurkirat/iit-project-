/* ══════════════════════════════════════
   PROJECTS & DASHBOARD
══════════════════════════════════════ */
let currentDistrictFilter = 'ALL';

function updateProjectBadgeCount() {
  const badgeEl = document.getElementById('badge-projs');
  if (badgeEl) badgeEl.textContent = S.projects.length;
}

function filterDashboardByDistrict(val) {
  currentDistrictFilter = val;
  
  // Update selector UI value if it is changed programmatically
  const selector = document.getElementById('dash-district-filter');
  if (selector && selector.value !== val) selector.value = val;
  
  renderDashboard();
  renderProjects();
}

function renderDashboard() {
  const filteredProjs = currentDistrictFilter === 'ALL'
    ? S.projects
    : S.projects.filter(p => p.district === currentDistrictFilter);

  const done = filteredProjs.filter(p=>p.progress===100).length;
  const pend = S.signatures.filter(s=>!s.signed).length;
  
  const totalEl = document.getElementById('d-total');
  const doneEl = document.getElementById('d-done');
  const sigsEl = document.getElementById('d-sigs');
  const pdfsEl = document.getElementById('d-pdfs');
  
  if (totalEl) totalEl.textContent = filteredProjs.length;
  if (doneEl) doneEl.textContent = done;
  if (sigsEl) sigsEl.textContent = pend;
  if (pdfsEl) pdfsEl.textContent = done + (filteredProjs.length > 0 ? 1 : 0);
  
  const el = document.getElementById('dash-recent');
  if (el) {
    if (filteredProjs.length === 0) {
      el.innerHTML = `<div style="text-align:center; padding: 24px; color:var(--text-soft); font-size:13px;">No projects yet. Use <strong>+ Create New DSR Project</strong> to add one${currentDistrictFilter !== 'ALL' ? ` for ${currentDistrictFilter}` : ''}.</div>`;
    } else {
      el.innerHTML = filteredProjs.slice(0,3).map(p=>`
        <div class="file-item" style="margin-bottom:8px;cursor:pointer" onclick="openProject(${p.id})">
          <div class="file-icon" style="background:${p.progress===100?'rgba(22,163,74,0.12)':'rgba(37,99,235,0.12)'}; color:${p.progress===100?'var(--green)':'var(--primary)'}"><i data-lucide="${p.progress===100?'check-circle':'file-text'}"></i></div>
          <div class="file-info" style="flex:1; min-width:0;">
            <div class="file-name" style="display:flex; align-items:center; gap:8px;">
              ${p.title}
              ${getDistrictBadgeHTML(p.district)}
            </div>
            <div class="file-meta">${p.district} District · ${p.year}</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px; flex-shrink:0;">
            <span class="badge ${p.status==='Completed'?'badge-green':p.status==='In Progress'?'badge-amber':'badge-red'}">${p.status}</span>
            <span style="font-size:10px;color:var(--text-faint)">${p.progress}%</span>
            <button type="button" class="btn btn-danger btn-xs" onclick="deleteProject(${p.id}, event)" title="Delete project">Delete</button>
          </div>
        </div>`).join('');
    }
  }
  
  // Sync active district highlights on dashboard
  updateActiveDistrictUI(S.activeProject ? S.activeProject.district : 'Punjab');
  renderDistrictLegends();
  if (typeof refreshDistrictBadgesInDOM === 'function') refreshDistrictBadgesInDOM();
  initLucide();
}

function renderProjects() {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;
  
  const filteredProjs = currentDistrictFilter === 'ALL'
    ? S.projects
    : S.projects.filter(p => p.district === currentDistrictFilter);

  if (filteredProjs.length === 0) {
    const districtHint = currentDistrictFilter === 'ALL' ? '' : ` for ${currentDistrictFilter}`;
    grid.innerHTML = `<div class="card" style="grid-column: span 2; text-align:center; padding: 48px 24px; border:1px solid var(--border);"><h3 style="color:var(--text-mid); margin-bottom:8px;">No DSR Projects Yet</h3><p style="color:var(--text-soft); font-size:13.5px;">Click <strong>+ New Project</strong> to create your first district survey report${districtHint}.</p></div>`;
    return;
  }

  grid.innerHTML = filteredProjs.map(p=>`
    <div class="proj-card">
      <div class="proj-card-top" style="cursor:pointer" onclick="openProject(${p.id})">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:8px;">
          <h3 style="font-size:14px; font-weight:700; color:var(--text);">${p.title}</h3>
          ${getDistrictBadgeHTML(p.district)}
        </div>
        <p style="font-size:12px; color:var(--text-soft);">${p.district} District · ${p.year}</p>
      </div>
      <div class="proj-card-bd">
        <div class="proj-meta">
          <span class="badge badge-navy">${p.mineral}</span>
          ${renderRiverTags(p.rivers)}
          <span class="badge ${p.status==='Completed'?'badge-green':p.status==='In Progress'?'badge-amber':'badge-red'}">${p.status}</span>
        </div>
        <div style="font-size:10.5px;color:var(--text-faint);margin-bottom:10px">Created: ${p.createdAt} · Sigs: ${p.signatures}/5</div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
          <div class="progress-bar" style="flex:1"><div class="progress-fill" style="width:${p.progress}%;background:${p.progress===100?'var(--green)':'linear-gradient(90deg,var(--teal),var(--teal-2))'}"></div></div>
          <span style="font-size:11px;font-weight:700;color:var(--text)">${p.progress}%</span>
        </div>
        <div class="proj-card-actions">
          <button type="button" class="btn btn-outline btn-sm" style="flex:1" onclick="openProject(${p.id})">Open Project</button>
          <button type="button" class="btn btn-danger btn-sm" onclick="deleteProject(${p.id}, event)"><i data-lucide="trash-2"></i> Delete Project</button>
        </div>
      </div>
    </div>`).join('');
  renderDistrictLegends();
  if (typeof refreshDistrictBadgesInDOM === 'function') refreshDistrictBadgesInDOM();
  initLucide();
}

function openProject(id) {
  S.activeProject = S.projects.find(p=>p.id===id);
  ['report-nav','annexure-nav','tables-nav','finalize-nav'].forEach(n=>{
    const el=document.getElementById(n); if(el) el.style.display='block';
  });
  const dist = S.activeProject.district;
  
  // Update active district highlights globally
  updateActiveDistrictUI(dist);
  if (typeof updateActiveProjectCardUI === 'function') updateActiveProjectCardUI();
  
  // Filter context to active district
  filterDashboardByDistrict(dist);
  
  const fmDistEl = document.getElementById('fm-district');
  if (fmDistEl) fmDistEl.value=dist;
  
  showView('front-matter',null);
  toast('Opened: '+dist+' DSR Project','info');
}

function newProjectModal() { 
  const el = document.getElementById('modal-project');
  if (el) el.classList.add('open'); 
}

async function saveProjectsBackend() {
  try {
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(S.projects)
    });
  } catch (err) {
    console.error('Failed to save projects to backend:', err);
  }
}

function deleteProject(id, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const proj = S.projects.find(p => p.id === id);
  if (!proj) return;

  customConfirm(
    `Permanently delete "${proj.title}" (${proj.district} District)? This action cannot be undone.`,
    () => {
      const wasActive = S.activeProject && S.activeProject.id === id;
      S.projects = S.projects.filter(p => p.id !== id);
      saveProjectsBackend();

      if (wasActive) {
        S.activeProject = null;
        ['report-nav', 'annexure-nav', 'tables-nav', 'finalize-nav'].forEach(n => {
          const el = document.getElementById(n);
          if (el) el.style.display = 'none';
        });
        updateActiveDistrictUI('Punjab');
        if (typeof updateActiveProjectCardUI === 'function') updateActiveProjectCardUI();
      }

      renderProjects();
      renderDashboard();
      updateProjectBadgeCount();
      renderDistrictLegends();
      toast(`Project "${proj.title}" has been deleted.`, 'success');
    }
  );
}

function createProject() {
  const title = document.getElementById('proj-title').value || `District Survey Report — ${document.getElementById('proj-district').value}`;
  const proj = {
    id: Date.now(), title,
    district: document.getElementById('proj-district').value,
    year: document.getElementById('proj-year').value,
    mineral: document.getElementById('proj-mineral').value,
    rivers: document.getElementById('proj-rivers').value||'Not specified',
    progress:0, status:'Not Completed', createdAt: new Date().toLocaleString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}), signatures:0
  };
  S.projects.unshift(proj);
  saveProjectsBackend();
  closeModal('modal-project');
  document.getElementById('proj-title').value = '';
  document.getElementById('proj-rivers').value = '';
  renderProjects();
  renderDashboard();
  updateProjectBadgeCount();
  openProject(proj.id);
  toast('DSR Project created successfully!','success');
}
