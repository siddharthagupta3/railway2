/**
 * signup.js — Login + Register (frontend-only mode)
 */
'use strict';

/* ─── Config ─────────────────────────────────────────────────── */
const REDIRECT_DELAY = 1500;
const byId = (id) => document.getElementById(id);

/* ─── Redirect if already logged in ─────────────────────────── */
(function checkAlreadyLoggedIn() {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  if (isLoggedIn) {
    window.location.replace('../dashboard/dash.html');
  }
})();

/* ─── Panel Switching ────────────────────────────────────────── */
function showLoginPanel() {
  const loginPanel    = byId('loginPanel');
  const registerPanel = byId('registerPanel');
  if (loginPanel)    loginPanel.style.display = 'flex';
  if (registerPanel) registerPanel.style.display = 'none';
  window.history.replaceState(null, '', '#login');
}

function showRegisterPanel() {
  const loginPanel    = byId('loginPanel');
  const registerPanel = byId('registerPanel');
  if (loginPanel)    loginPanel.style.display = 'none';
  if (registerPanel) registerPanel.style.display = 'flex';
  window.history.replaceState(null, '', '#register');
}

function bindPanelSwitching() {
  byId('showRegister')?.addEventListener('click', (e) => { e.preventDefault(); showRegisterPanel(); });
  byId('showLogin')?.addEventListener('click',    (e) => { e.preventDefault(); showLoginPanel(); });
}

/* ─── Validation Helpers ─────────────────────────────────────── */
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function validatePhone(phone) {
  return /^[\d\s\-\+\(\)]+$/.test(phone) && phone.length >= 10;
}
function formatPhone(value) {
  let digits = value.replace(/\D/g, '');
  if (digits.length > 6) return `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6,10)}`;
  if (digits.length > 3) return `${digits.slice(0,3)}-${digits.slice(3)}`;
  return digits;
}

/* ─── Feedback UI ────────────────────────────────────────────── */
function showSuccess(message) {
  const el   = byId('successMessage');
  const text = byId('successText');
  if (!el || !text) return;
  text.textContent = message;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 4000);
}

function closeSuccess() {
  byId('successMessage')?.classList.remove('show');
}

function showError(message) {
  // Remove existing errors
  document.querySelectorAll('.api-error-toast').forEach(e => e.remove());

  const error = document.createElement('div');
  error.className = 'api-error-toast';
  error.innerHTML = `<i class="fas fa-exclamation-circle"></i><span>${message}</span><button>&times;</button>`;
  error.style.cssText = `
    position:fixed;top:20px;right:20px;background:#ef4444;color:white;
    padding:14px 18px;border-radius:10px;display:flex;align-items:center;
    gap:10px;z-index:9999;box-shadow:0 8px 24px rgba(239,68,68,0.35);
    font-weight:600;max-width:380px;animation:slideDown .3s ease;
  `;
  error.querySelector('button').onclick = () => error.remove();
  document.body.appendChild(error);
  setTimeout(() => error.remove(), 6000);
}

/* ─── Button Loading State ───────────────────────────────────── */
function setButtonLoading(btn, loading, originalText) {
  if (!btn) return;
  btn.disabled = loading;
  if (loading) {
    btn.dataset.originalText = btn.querySelector('span')?.textContent || originalText;
    if (btn.querySelector('span')) btn.querySelector('span').textContent = 'Please wait...';
    btn.style.opacity = '0.7';
  } else {
    if (btn.querySelector('span') && btn.dataset.originalText) {
      btn.querySelector('span').textContent = btn.dataset.originalText;
    }
    btn.style.opacity = '1';
  }
}

/* ─── Save Auth Tokens ───────────────────────────────────────── */
function saveAuthData(data) {
  localStorage.setItem('authToken',     data.accessToken);
  localStorage.setItem('refreshToken',  data.refreshToken || '');
  localStorage.setItem('isLoggedIn',    'true');
  localStorage.setItem('currentUser',   JSON.stringify(data.user));
  localStorage.setItem('currentUser_email', data.user.email);
  localStorage.setItem('userFirstName', data.user.firstName);
}

/* ─── Login Handler ──────────────────────────────────────────── */
async function handleLogin(event) {
  event.preventDefault();

  const email      = byId('loginEmail')?.value.trim()    || '';
  const password   = byId('loginPassword')?.value.trim() || '';
  const rememberMe = byId('rememberMe')?.checked;
  const submitBtn  = event.target.querySelector('button[type="submit"]');

  if (!validateEmail(email))  return showError('Please enter a valid email address.');
  if (password.length < 6)    return showError('Password must be at least 6 characters.');

  setButtonLoading(submitBtn, true, 'Login');

  try {
    const data = {
      success: true,
      accessToken: 'mock_access_token',
      refreshToken: 'mock_refresh_token',
      user: { firstName: email.split('@')[0] || 'User', email: email, role: 'user' }
    };

    saveAuthData(data);
    if (rememberMe) localStorage.setItem('rememberMe_email', email);

    showSuccess(`✅ Welcome back, ${data.user.firstName}! Redirecting...`);
    event.target.reset();

    setTimeout(() => {
      window.location.href = '../dashboard/dash.html';
    }, REDIRECT_DELAY);
  } catch (err) {
    showError('Login failed.');
  } finally {
    setButtonLoading(submitBtn, false, 'Login');
  }
}

/* ─── Register Handler ───────────────────────────────────────── */
async function handleRegister(event) {
  event.preventDefault();

  const first           = byId('firstName')?.value.trim()         || '';
  const last            = byId('lastName')?.value.trim()          || '';
  const email           = byId('registerEmail')?.value.trim()     || '';
  const phone           = byId('phone')?.value.trim()             || '';
  const password        = byId('registerPassword')?.value         || '';
  const confirmPassword = byId('confirmPassword')?.value          || '';
  const agreedToTerms   = !!byId('agreeTerms')?.checked;
  const submitBtn       = event.target.querySelector('button[type="submit"]');

  if (!first || !last)          return showError('Please enter your full name.');
  if (!validateEmail(email))    return showError('Please enter a valid email address.');
  if (!validatePhone(phone))    return showError('Please enter a valid phone number (min 10 digits).');
  if (password.length < 8)      return showError('Password must be at least 8 characters.');
  if (!/[A-Z]/.test(password))  return showError('Password must contain at least one uppercase letter.');
  if (!/[0-9]/.test(password))  return showError('Password must contain at least one number.');
  if (password !== confirmPassword) return showError('Passwords do not match.');
  if (!agreedToTerms)           return showError('Please agree to the Terms & Conditions.');

  setButtonLoading(submitBtn, true, 'Create Account');

  try {
    const data = {
      success: true,
      accessToken: 'mock_access_token',
      refreshToken: 'mock_refresh_token',
      user: { firstName: first, lastName: last, email: email, phone: phone, role: 'user' }
    };

    saveAuthData(data);

    showSuccess(`🎉 Account created! Welcome, ${data.user.firstName}! Redirecting...`);
    event.target.reset();

    setTimeout(() => {
      window.location.href = '../dashboard/dash.html';
    }, REDIRECT_DELAY);
  } catch (err) {
    showError('Registration failed.');
  } finally {
    setButtonLoading(submitBtn, false, 'Create Account');
  }
}

/* ─── Password Strength ──────────────────────────────────────── */
function checkPasswordStrength() {
  const pass = byId('registerPassword')?.value || '';
  const map = {
    weak:   { text: 'Weak',   color: '#ef4444', width: '33%' },
    medium: { text: 'Medium', color: '#f59e0b', width: '66%' },
    strong: { text: 'Strong', color: '#10b981', width: '100%' },
  };
  let score = 0;
  if (pass.length >= 8)         score++;
  if (/[A-Z]/.test(pass))       score++;
  if (/[a-z]/.test(pass))       score++;
  if (/[0-9]/.test(pass))       score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;
  const level = score <= 2 ? 'weak' : score <= 4 ? 'medium' : 'strong';
  const s = map[level];
  const fill = document.querySelector('.strength-fill');
  const text = document.querySelector('.strength-text');
  if (fill) { fill.style.width = s.width; fill.style.backgroundColor = s.color; }
  if (text) { text.textContent = s.text; text.style.color = s.color; }
}

function checkPasswordMatch() {
  const pass    = byId('registerPassword')?.value || '';
  const confirm = byId('confirmPassword');
  if (!confirm || confirm.value.length === 0) return;
  confirm.style.borderColor = pass === confirm.value ? '#10b981' : '#ef4444';
}

function togglePassword(fieldId) {
  const field = byId(fieldId);
  const icon  = field?.nextElementSibling?.querySelector('i');
  if (!field || !icon) return;
  field.type = field.type === 'password' ? 'text' : 'password';
  icon.classList.toggle('fa-eye');
  icon.classList.toggle('fa-eye-slash');
}

/* ─── Restore remembered email ───────────────────────────────── */
function restoreSavedLoginEmail() {
  const saved = localStorage.getItem('rememberMe_email');
  if (!saved) return;
  const emailInput  = byId('loginEmail');
  const rememberBox = byId('rememberMe');
  if (emailInput)  emailInput.value = saved;
  if (rememberBox) rememberBox.checked = true;
}

/* ─── Phone formatter ────────────────────────────────────────── */
function attachPhoneFormatter() {
  const phoneInput = byId('phone');
  if (!phoneInput) return;
  phoneInput.addEventListener('input', (e) => {
    e.target.value = formatPhone(e.target.value);
  });
}

/* ─── Social login (UI only — real OAuth not implemented) ─────── */
function handleSocialLogin(event) {
  event.preventDefault();
  const btn = event.target.closest('button');
  if (!btn) return;
  const provider = [...btn.classList].find(c => ['google','facebook','github'].includes(c)) || 'social';
  showError(`${provider.charAt(0).toUpperCase() + provider.slice(1)} OAuth not configured yet. Please use email login.`);
}

/* ─── Bind all events ────────────────────────────────────────── */
function bindFormEvents() {
  byId('loginForm')?.addEventListener('submit',    handleLogin);
  byId('registerForm')?.addEventListener('submit', handleRegister);
  byId('registerPassword')?.addEventListener('input', checkPasswordStrength);
  byId('confirmPassword')?.addEventListener('input',  checkPasswordMatch);
  byId('closeSuccessBtn')?.addEventListener('click',  closeSuccess);
  document.querySelectorAll('.social-btn').forEach((b) => b.addEventListener('click', handleSocialLogin));
  document.querySelectorAll('.toggle-password').forEach((b) => {
    b.addEventListener('click', () => {
      const fieldId = b.getAttribute('data-toggle-target');
      if (fieldId) togglePassword(fieldId);
    });
  });
}

/* ─── Init ───────────────────────────────────────────────────── */
function initAuth() {
  showLoginPanel();
  bindPanelSwitching();
  bindFormEvents();
  restoreSavedLoginEmail();
  attachPhoneFormatter();
}

document.addEventListener('DOMContentLoaded', initAuth);

// Expose for inline HTML use
window.togglePassword = togglePassword;
window.closeSuccess   = closeSuccess;
