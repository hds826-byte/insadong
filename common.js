/* ═══════════════════════════════════════════════════
   GenAI 학습동아리 — 공통 JS
═══════════════════════════════════════════════════ */

/* ── CONFIG ── */
const CFG = {
  API_URL: 'YOUR_APPS_SCRIPT_URL_HERE',
  get isMock() { return this.API_URL === 'YOUR_APPS_SCRIPT_URL_HERE'; }
};

/* ── API HELPERS ── */
async function apiGet(params) {
  const r = await fetch(`${CFG.API_URL}?${new URLSearchParams(params)}`);
  return r.json();
}
async function apiPost(body) {
  const r = await fetch(CFG.API_URL, {method:'POST', body: JSON.stringify(body)});
  return r.json();
}

/* ── TOAST ── */
let _toastTmr;
function toast(msg, type = '') {
  let el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; document.body.appendChild(el); }
  el.textContent = msg;
  el.className = 'show ' + type;
  clearTimeout(_toastTmr);
  _toastTmr = setTimeout(() => el.className = '', 3200);
}

/* ── MODAL ── */
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.addEventListener('keydown', e => {
  if (e.key === 'Escape')
    document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open'));
});
document.addEventListener('click', e => {
  if (e.target.classList.contains('overlay')) e.target.classList.remove('open');
});

/* ── SPINNER HTML ── */
const SPINNER = `<div class="spinner-wrap"><div class="spinner"></div>불러오는 중...</div>`;
const emptyHTML = (icon, msg) => `<div class="empty-state"><div class="ei">${icon}</div><p>${msg}</p></div>`;

/* ── DATE UTILS ── */
const DAYS_KO = ['일','월','화','수','목','금','토'];
function fmtDate(str) {
  if (!str) return '';
  const d = new Date(str);
  if (isNaN(d)) return str;
  const mm = d.getMonth()+1, dd = d.getDate();
  const hh = String(d.getHours()).padStart(2,'0');
  const mi = String(d.getMinutes()).padStart(2,'0');
  return `${mm}/${dd} ${hh}:${mi}`;
}
function fmtDateShort(str) {
  if (!str) return '';
  const d = new Date(str);
  if (isNaN(d)) return str;
  return `${d.getFullYear()}.${d.getMonth()+1}.${d.getDate()}`;
}
function dDay(str) {
  if (!str) return '';
  const diff = Math.ceil((new Date(str) - new Date()) / 86400000);
  if (diff < 0) return '마감';
  if (diff === 0) return 'D-day';
  return `D-${diff}`;
}

/* ── HTML ESCAPE ── */
function esc(s) {
  return String(s||'')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── SIDEBAR ACTIVE ── */
function setSidebarActive() {
  const path = location.pathname.split('/').pop();
  document.querySelectorAll('.sidebar-item[data-page]').forEach(el => {
    el.classList.toggle('active', el.dataset.page === path);
  });
}

/* ── INPUT FORMATTERS ── */
function formatPhone(el) {
  let v = el.value.replace(/\D/g,'').slice(0,11);
  if (v.length > 7) v = v.slice(0,3)+'-'+v.slice(3,7)+'-'+v.slice(7);
  else if (v.length > 3) v = v.slice(0,3)+'-'+v.slice(3);
  el.value = v;
}
function formatBirth(el) {
  let v = el.value.replace(/\D/g,'').slice(0,8);
  if (v.length > 6) v = v.slice(0,4)+'-'+v.slice(4,6)+'-'+v.slice(6);
  else if (v.length > 4) v = v.slice(0,4)+'-'+v.slice(4);
  el.value = v;
}

/* ── CONFIRM DIALOG ── */
function confirm2(msg) {
  return new Promise(res => {
    if (window.confirm) res(window.confirm(msg));
    else res(true);
  });
}

/* ── LOCALSTORAGE CACHE ── */
function cacheSet(key, data, ttl = 300) {
  localStorage.setItem(key, JSON.stringify({ data, exp: Date.now() + ttl * 1000 }));
}
function cacheGet(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  const obj = JSON.parse(raw);
  return obj.exp > Date.now() ? obj.data : null;
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  setSidebarActive();
  if (CFG.isMock) {
    const banner = document.getElementById('config-banner');
    if (banner) banner.style.display = 'block';
  }
});
