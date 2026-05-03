/* GenAI 동아리 공통 JS v2 */
const CFG = {
  API_URL: 'YOUR_APPS_SCRIPT_URL_HERE',
  get isMock(){ return this.API_URL === 'YOUR_APPS_SCRIPT_URL_HERE'; }
};
async function apiGet(p){ const r=await fetch(`${CFG.API_URL}?${new URLSearchParams(p)}`); return r.json(); }
async function apiPost(b){ const r=await fetch(CFG.API_URL,{method:'POST',body:JSON.stringify(b)}); return r.json(); }

let _tt;
function toast(msg,type=''){
  let el=document.getElementById('toast');
  if(!el){el=document.createElement('div');el.id='toast';document.body.appendChild(el);}
  el.textContent=msg; el.className='show '+(type||'');
  clearTimeout(_tt); _tt=setTimeout(()=>el.className='',3000);
}
function openModal(id){document.getElementById(id).classList.add('open')}
function closeModal(id){document.getElementById(id).classList.remove('open')}
document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.overlay.open').forEach(o=>o.classList.remove('open'))});
document.addEventListener('click',e=>{if(e.target.classList.contains('overlay'))e.target.classList.remove('open')});

const LOADING=`<div class="loading-row"><div class="spin"></div>불러오는 중...</div>`;
const emptyHTML=(icon,msg)=>`<div class="empty-st"><div class="ei">${icon}</div><p>${msg}</p></div>`;
const DAYS=['일','월','화','수','목','금','토'];
function fmtDate(s){if(!s)return'';const d=new Date(s);if(isNaN(d))return s;const mm=d.getMonth()+1,dd=d.getDate(),hh=String(d.getHours()).padStart(2,'0'),mi=String(d.getMinutes()).padStart(2,'0');return`${mm}/${dd} ${hh}:${mi}`}
function fmtDateShort(s){if(!s)return'';const d=new Date(s);return isNaN(d)?s:`${d.getFullYear()}.${d.getMonth()+1}.${d.getDate()}`}
function dDay(s){if(!s)return'';const diff=Math.ceil((new Date(s)-new Date())/86400000);return diff<0?'마감':diff===0?'D-day':`D-${diff}`}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function formatPhone(el){let v=el.value.replace(/\D/g,'').slice(0,11);if(v.length>7)v=v.slice(0,3)+'-'+v.slice(3,7)+'-'+v.slice(7);else if(v.length>3)v=v.slice(0,3)+'-'+v.slice(3);el.value=v}
function formatBirth(el){let v=el.value.replace(/\D/g,'').slice(0,8);if(v.length>6)v=v.slice(0,4)+'-'+v.slice(4,6)+'-'+v.slice(6);else if(v.length>4)v=v.slice(0,4)+'-'+v.slice(4);el.value=v}
async function confirm2(msg){return new Promise(r=>{r(window.confirm(msg))})}
function cacheSet(k,d,t=300){localStorage.setItem(k,JSON.stringify({data:d,exp:Date.now()+t*1000}))}
function cacheGet(k){try{const r=JSON.parse(localStorage.getItem(k));return r&&r.exp>Date.now()?r.data:null}catch{return null}}

document.addEventListener('DOMContentLoaded',()=>{
  // active nav
  const p=location.pathname.split('/').pop();
  document.querySelectorAll('.sidebar-link[data-p]').forEach(el=>el.classList.toggle('active',el.dataset.p===p));
  document.querySelectorAll('.nav-links a').forEach(el=>el.classList.toggle('active',el.getAttribute('href')&&el.getAttribute('href').includes(p)));
  // mock banner
  if(CFG.isMock){const b=document.getElementById('mock-banner');if(b)b.style.display='block';}
});
