/* GenAI 동아리 공통 JS
 * ↓↓↓ Apps Script 웹 앱 URL을 여기에 입력하세요 ↓↓↓ */
const CFG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbzF2cRuKxJmUQ0dgOZMPkbYjadgKDU0OFDpghPByhhyQ7uI54IFyax4gh7pYrANk6ZWzg/exec',
  get isMock() { return this.API_URL === 'YOUR_APPS_SCRIPT_URL_HERE'; }
};

// Content-Type: text/plain → CORS preflight 없이 Apps Script POST 가능
async function apiGet(p, ms = 7000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(`${CFG.API_URL}?${new URLSearchParams(p)}`, { signal: ctrl.signal });
    clearTimeout(timer);
    return r.json();
  } catch(e) {
    clearTimeout(timer);
    throw e;
  }
}
async function apiPost(b, ms = 7000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(CFG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(b),
      signal: ctrl.signal
    });
    clearTimeout(timer);
    return r.json();
  } catch(e) {
    clearTimeout(timer);
    throw e;
  }
}

let _tt;
function toast(msg, type = '') {
  let el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; document.body.appendChild(el); }
  el.textContent = msg; el.className = 'show ' + (type || '');
  clearTimeout(_tt); _tt = setTimeout(() => el.className = '', 3000);
}
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open'));
});
document.addEventListener('click', e => {
  if (e.target.classList.contains('overlay')) e.target.classList.remove('open');
});

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
function fmtDate(s) {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d)) return s;
  return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}
function fmtDateShort(s) {
  if (!s) return '';
  const d = new Date(s);
  return isNaN(d) ? s : `${d.getFullYear()}.${d.getMonth()+1}.${d.getDate()}`;
}
function dDay(s) {
  if (!s) return '';
  const diff = Math.ceil((new Date(s) - new Date()) / 86400000);
  return diff < 0 ? '마감' : diff === 0 ? 'D-day' : `D-${diff}`;
}
function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function cacheSet(k, d, t = 300) { localStorage.setItem(k, JSON.stringify({ data: d, exp: Date.now() + t * 1000 })); }
function cacheGet(k) {
  try { const r = JSON.parse(localStorage.getItem(k)); return r && r.exp > Date.now() ? r.data : null; }
  catch { return null; }
}

document.addEventListener('DOMContentLoaded', () => {
  const p = location.pathname.split('/').pop();
  document.querySelectorAll('.nav-links a').forEach(el =>
    el.classList.toggle('active', !!(el.getAttribute('href') && el.getAttribute('href').includes(p)))
  );
  if (CFG.isMock) {
    ['config-banner', 'mock-banner'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'block';
    });
  }
});
