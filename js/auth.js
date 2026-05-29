/* ══════════════════════════════════════
   AUTH
 ══════════════════════════════════════ */
function switchAuthMode(mode) {
  const facultyTab = document.getElementById('tab-btn-faculty');
  const authorityTab = document.getElementById('tab-btn-authority');
  const facultyForm = document.getElementById('auth-form-faculty');
  const authorityForm = document.getElementById('auth-form-authority');

  if (facultyTab && authorityTab && facultyForm && authorityForm) {
    facultyTab.classList.toggle('active', mode === 'faculty');
    authorityTab.classList.toggle('active', mode === 'authority');
    facultyForm.classList.toggle('active', mode === 'faculty');
    authorityForm.classList.toggle('active', mode === 'authority');
  }
  
  if (window.initLucide) initLucide();
}

// Keep legacy switchAuthTab for backward compatibility or signup redirection
function switchAuthTab(t) {
  switchAuthMode(t === 'signup' ? 'faculty' : 'faculty');
}

function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-pass').value;
  const role = document.getElementById('login-role').value;
  const err = document.getElementById('login-error');
  if (!email || !pass) { err.style.display='block'; err.textContent='Please fill all fields.'; return; }
  err.style.display='none';
  S.user = { name: email.split('@')[0].replace(/\./g,' ').replace(/\b\w/g,c=>c.toUpperCase()), email, role };
  S.role = role;
  if (role==='authority') showAuthorityScreen();
  else showAppScreen();
}

function doAuthorityVerify() {
  const nicId = document.getElementById('auth-nic-id').value.trim();
  const pin = document.getElementById('auth-security-pin').value;
  const err = document.getElementById('auth-error');
  if (!nicId || !pin) {
    err.style.display = 'block';
    err.textContent = 'Please enter both NIC ID and Security PIN.';
    return;
  }
  err.style.display = 'none';
  // Demo Login verification - sets authority credentials
  S.user = { name: 'Dr. Suresh Verma', email: 'dmo@punjab.gov.in', role: 'authority' };
  S.role = 'authority';
  showAuthorityScreen();
}

function doAuthorityQuickLogin() {
  S.user = { name:'Dr. Suresh Verma', email:'dmo@punjab.gov.in', role:'authority' };
  S.role = 'authority';
  showAuthorityScreen();
}

function togglePinReveal() {
  const pinInput = document.getElementById('auth-security-pin');
  if (pinInput) {
    pinInput.type = pinInput.type === 'password' ? 'text' : 'password';
  }
}

function doSignup() {
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const pass = document.getElementById('signup-pass').value;
  const err = document.getElementById('signup-error');
  const ok = document.getElementById('signup-success');
  if (!name||!email||!pass) { err.style.display='block'; err.textContent='Please fill all required fields.'; return; }
  if (pass.length<6) { err.style.display='block'; err.textContent='Password must be at least 6 characters.'; return; }
  err.style.display='none'; ok.style.display='block'; ok.textContent='Account created! You can now log in.';
  setTimeout(()=>switchAuthMode('faculty'),1500);
}

function doLogout() {
  S.user=null; S.role='user';
  viewHistory = [];
  currentViewId = 'dashboard';
  const backBtn = document.getElementById('tb-back-btn');
  if (backBtn) backBtn.style.display = 'none';
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-auth').classList.add('active');
  switchAuthMode('faculty');
  if (typeof applyTheme === 'function') {
    applyTheme('light', false);
  }
  if (typeof updateDarkModeIcon === 'function') {
    updateDarkModeIcon();
  }
}

function showAppScreen() {
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-app').classList.add('active');
  if (typeof initThemeFromStorage === 'function') {
    initThemeFromStorage();
  }
  if (typeof updateDarkModeIcon === 'function') updateDarkModeIcon();
  const init = S.user.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
  document.getElementById('sb-avatar').textContent = init;
  document.getElementById('sb-uname').textContent = S.user.name;
  document.getElementById('sb-urole').textContent = S.role==='admin'?'System Admin':S.role==='reviewer'?'Section Reviewer':'Report Coordinator';
  initApp();
  if (window.initLucide) initLucide();
}

function showAuthorityScreen() {
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-authority').classList.add('active');
  document.getElementById('auth-user-label').textContent = S.user.name + ' · Authority';
  renderAuthorityReports();
  if (typeof initThemeFromStorage === 'function') {
    initThemeFromStorage();
  }
  if (typeof updateDarkModeIcon === 'function') updateDarkModeIcon();
  if (window.initLucide) initLucide();
}
