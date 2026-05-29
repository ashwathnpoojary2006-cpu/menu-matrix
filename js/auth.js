// ============================================
// MenuMatrix — Authentication
// ============================================

const AUTH_API = 'http://127.0.0.1:5000/api/auth';

// ===== STORAGE HELPERS (safe — never crash on corrupt data) =====
function isLoggedIn() {
  return !!localStorage.getItem('menumatrix_token');
}

function getToken() {
  return localStorage.getItem('menumatrix_token') || '';
}

function getUser() {
  try {
    const raw = localStorage.getItem('menumatrix_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    localStorage.removeItem('menumatrix_user');
    return null;
  }
}

function saveSession(token, user) {
  localStorage.setItem('menumatrix_token', token);
  localStorage.setItem('menumatrix_user', JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem('menumatrix_token');
  localStorage.removeItem('menumatrix_user');
}

// ===== LOGIN =====
async function handleLogin(e) {
  e.preventDefault();

  const btn   = document.getElementById('loginBtn');
  const errEl = document.getElementById('loginError');
  const email = (document.getElementById('loginEmail').value || '').trim();
  const pwd   = document.getElementById('loginPassword').value || '';

  errEl.textContent = '';

  // Client-side validation
  if (!email) { errEl.textContent = 'Please enter your email'; return; }
  if (!email.includes('@')) { errEl.textContent = 'Please enter a valid email'; return; }
  if (!pwd)   { errEl.textContent = 'Please enter your password'; return; }

  btn.disabled = true;
  btn.querySelector('span').textContent = 'Signing in…';

  try {
    const res  = await fetch(`${AUTH_API}/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password: pwd }),
    });
    const data = await res.json();

    if (res.ok && data.success) {
      saveSession(data.token, data.user);
      showToast('Welcome back, ' + data.user.name + '!');
      setTimeout(() => {
        if (data.user.is_admin) {
          window.location.href = 'admin.html';
        } else {
          const redirect = new URLSearchParams(window.location.search).get('redirect');
          window.location.href = redirect || 'index.html';
        }
      }, 600);
    } else {
      errEl.textContent = data.error || 'Login failed. Please check your email and password.';
      btn.disabled = false;
      btn.querySelector('span').textContent = 'Sign In';
    }
  } catch (err) {
    errEl.textContent = 'Cannot connect to server. Make sure the backend is running on port 5000.';
    btn.disabled = false;
    btn.querySelector('span').textContent = 'Sign In';
    console.error('[LOGIN]', err);
  }
}

// ===== SIGNUP =====
async function handleSignup(e) {
  e.preventDefault();

  const btn   = document.getElementById('signupBtn');
  const errEl = document.getElementById('signupError');
  const name  = (document.getElementById('signupName').value  || '').trim();
  const email = (document.getElementById('signupEmail').value || '').trim();
  const phone = (document.getElementById('signupPhone').value || '').trim();
  const pwd   = document.getElementById('signupPassword').value || '';

  errEl.textContent = '';

  // Client-side validation
  if (!name)  { errEl.textContent = 'Please enter your name'; return; }
  if (!email) { errEl.textContent = 'Please enter your email'; return; }
  if (!email.includes('@')) { errEl.textContent = 'Please enter a valid email'; return; }
  if (!pwd || pwd.length < 6) {
    errEl.textContent = 'Password must be at least 6 characters';
    return;
  }

  btn.disabled = true;
  btn.querySelector('span').textContent = 'Creating account…';

  try {
    const res  = await fetch(`${AUTH_API}/register`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, email, phone, password: pwd }),
    });
    const data = await res.json();

    if (res.ok && data.success) {
      saveSession(data.token, data.user);
      showToast('Account created! Welcome, ' + data.user.name + '!');
      setTimeout(() => {
        const redirect = new URLSearchParams(window.location.search).get('redirect');
        window.location.href = redirect || 'index.html';
      }, 600);
    } else {
      errEl.textContent = data.error || 'Registration failed. Please try again.';
      btn.disabled = false;
      btn.querySelector('span').textContent = 'Create Account';
    }
  } catch (err) {
    errEl.textContent = 'Cannot connect to server. Make sure the backend is running on port 5000.';
    btn.disabled = false;
    btn.querySelector('span').textContent = 'Create Account';
    console.error('[SIGNUP]', err);
  }
}

// ===== LOGOUT =====
function logout() {
  clearSession();
  window.location.href = 'login.html';
}

// ===== TAB SWITCHING =====
function switchTab(tab) {
  const loginForm  = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const loginTab   = document.getElementById('loginTab');
  const signupTab  = document.getElementById('signupTab');
  const indicator  = document.getElementById('tabIndicator');

  if (tab === 'login') {
    if (loginForm)  loginForm.style.display  = '';
    if (signupForm) signupForm.style.display = 'none';
    if (loginTab)   loginTab.classList.add('active');
    if (signupTab)  signupTab.classList.remove('active');
    if (indicator)  indicator.style.transform = 'translateX(0)';
  } else {
    if (loginForm)  loginForm.style.display  = 'none';
    if (signupForm) signupForm.style.display = '';
    if (loginTab)   loginTab.classList.remove('active');
    if (signupTab)  signupTab.classList.add('active');
    if (indicator)  indicator.style.transform = 'translateX(100%)';
  }
}

// ===== PASSWORD TOGGLE =====
function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
  } else {
    input.type = 'password';
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
  }
}

// ===== TOAST =====
function showToast(msg) {
  const toast    = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  if (!toast || !toastMsg) return;
  toastMsg.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ===== REQUIRE AUTH =====
function requireAuth(redirectTo) {
  if (!isLoggedIn()) {
    window.location.href = 'login.html?redirect=' + encodeURIComponent(redirectTo || window.location.pathname);
    return false;
  }
  return true;
}

// ===== NAVBAR USER DROPDOWN =====
function updateNavbarAuth() {
  const user = getUser();
  const area = document.getElementById('navUserArea');

  if (area) {
    if (user && isLoggedIn()) {
      const initial = (user.name || 'U').charAt(0).toUpperCase();
      const firstName = (user.name || '').split(' ')[0];
      area.innerHTML = `
        <a href="bookings.html" style="font-size:.85rem;color:var(--text-secondary);text-decoration:none;white-space:nowrap;margin-right:15px;font-weight:600;">My Bookings</a>
        <div class="nav-user">
          <button class="nav-user-btn" onclick="this.closest('.nav-user').classList.toggle('open')">
            <div class="nav-user-avatar">${initial}</div>
            <span class="nav-user-name">${firstName}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="nav-user-dropdown">
            <div class="nav-user-dropdown-header">
              <div class="nav-user-avatar-lg">${initial}</div>
              <div>
                <div class="nav-user-fullname">${user.name}</div>
                <div class="nav-user-email">${user.email}</div>
              </div>
            </div>
            <div class="nav-user-dropdown-divider"></div>
            ${user.is_admin ? `
            <a href="admin.html" class="nav-user-dropdown-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Admin Panel
            </a>` : ''}
            <a href="bookings.html" class="nav-user-dropdown-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/></svg>
              My Bookings
            </a>
            <a href="function.html" class="nav-user-dropdown-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Book Event
            </a>
            <button class="nav-user-dropdown-item logout-item" onclick="logout()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Sign Out
            </button>
          </div>
        </div>`;
    } else {
      area.innerHTML = `
        <a href="function.html" class="nav-cta" style="margin-right:0;">Book Now
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
        <a href="login.html" style="font-size:.82rem;font-weight:600;color:var(--purple);text-decoration:none;padding:7px 16px;border:1px solid rgba(124,58,237,.35);border-radius:999px;margin-left:10px;display:inline-block;white-space:nowrap;transition:all 0.3s;" onmouseover="this.style.borderColor='var(--purple)';this.style.background='rgba(124,58,237,0.04)'" onmouseout="this.style.borderColor='rgba(124,58,237,.35)';this.style.background='transparent'">Login</a>`;
    }
    return;
  }

  const navCta = document.querySelector('.nav-cta');
  if (!navCta) return;
  if (!user)  return;

  const userEl = document.createElement('div');
  userEl.className = 'nav-user';
  const initial = (user.name || 'U').charAt(0).toUpperCase();
  const firstName = (user.name || '').split(' ')[0];

  userEl.innerHTML = `
    <button class="nav-user-btn" onclick="this.closest('.nav-user').classList.toggle('open')">
      <div class="nav-user-avatar">${initial}</div>
      <span class="nav-user-name">${firstName}</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
    </button>
    <div class="nav-user-dropdown">
      <div class="nav-user-dropdown-header">
        <div class="nav-user-avatar-lg">${initial}</div>
        <div>
          <div class="nav-user-fullname">${user.name}</div>
          <div class="nav-user-email">${user.email}</div>
        </div>
      </div>
      <div class="nav-user-dropdown-divider"></div>
      ${user.is_admin ? `
      <a href="admin.html" class="nav-user-dropdown-item">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        Admin Panel
      </a>` : ''}
      <a href="bookings.html" class="nav-user-dropdown-item">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/></svg>
        My Bookings
      </a>
      <a href="function.html" class="nav-user-dropdown-item">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        Book Event
      </a>
      <button class="nav-user-dropdown-item logout-item" onclick="logout()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Sign Out
      </button>
    </div>`;

  navCta.parentNode.replaceChild(userEl, navCta);
}

// ===== AUTO INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  const onLoginPage = !!document.getElementById('loginForm');
  const forceStay = new URLSearchParams(window.location.search).get('force') === '1';

  if (onLoginPage && isLoggedIn() && !forceStay) {
    // Verify token is still valid with the backend before redirecting.
    // If backend is unreachable (e.g. opened via Live Server without Flask running),
    // clear the stale session and show the login form instead of redirecting.
    try {
      const res = await fetch('http://127.0.0.1:5000/api/auth/check', {
        headers: { 'Authorization': 'Bearer ' + getToken() },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          const user = data.user || getUser();
          if (user && user.is_admin) {
            window.location.href = 'admin.html';
          } else {
            const redirect = new URLSearchParams(window.location.search).get('redirect');
            window.location.href = redirect || 'index.html';
          }
          return;
        }
      }
      // Token rejected by server — clear stale session and show login
      clearSession();
    } catch (e) {
      // Backend unreachable (Live Server, no Flask) — clear stale session, show login
      clearSession();
      console.info('[AUTH] Backend unreachable — showing login form');
    }
  }

  updateNavbarAuth();

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    const nu = document.querySelector('.nav-user');
    if (nu && !nu.contains(e.target)) nu.classList.remove('open');
  });
});
