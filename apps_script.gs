// ═══════════════════════════════════════════════════════════════
//  GenAI 학습동아리 포털 — Google Apps Script 백엔드
//  사용법: Google Sheets → 확장 프로그램 → Apps Script → 붙여넣기
//          → 저장 → 배포 → 웹 앱으로 배포
// ═══════════════════════════════════════════════════════════════

// ★ 스프레드시트 URL에서 /d/ 뒤 ID 값을 복사해 붙여넣으세요.
// 예: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA.../edit
//                                             ↑ 이 부분
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';

// ── 공통 유틸 ──────────────────────────────────────────────────

function out(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function sha256(str) {
  return Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, str, Utilities.Charset.UTF_8
  ).map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
}

function newId() { return Utilities.getUuid(); }

// Sheets가 날짜/시간 문자열을 Date 객체로 자동변환하므로, 읽을 때 로컬 포맷으로 복원
function fmtDate(v) {
  if (!v) return '';
  if (v instanceof Date) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, '0');
    const d = String(v.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(v);
}
function fmtTime(v) {
  if (!v) return '';
  if (v instanceof Date) {
    return `${String(v.getHours()).padStart(2,'0')}:${String(v.getMinutes()).padStart(2,'0')}`;
  }
  return String(v);
}

// getActiveSpreadsheet()는 웹 앱 실행 컨텍스트에서 null을 반환할 수 있으므로
// openById()를 우선 사용하고, ID 미설정 시 getActiveSpreadsheet()로 폴백
function getSpreadsheet() {
  if (SPREADSHEET_ID && SPREADSHEET_ID !== 'YOUR_SPREADSHEET_ID_HERE') {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('스프레드시트를 찾을 수 없습니다. SPREADSHEET_ID를 설정하거나 Extensions > Apps Script로 열어주세요.');
  return ss;
}

function getSheet(name) { return getSpreadsheet().getSheetByName(name); }

function allRows(name) {
  const sh = getSheet(name);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn())
    .getValues().filter(r => r[0] !== '' && r[0] !== null);
}

// ── GET 라우터 ──────────────────────────────────────────────────

function doGet(e) {
  try {
    const p = e.parameter || {};
    switch (p.action) {
      case 'login':          return out(handleLogin(p));
      case 'getVoteOptions': return out(getVoteOptions());
      case 'getVotes':       return out(getVotes());
      case 'getNews':        return out(getNews());
      case 'getContests':    return out(getContests());
      case 'getOpinions':    return out(getOpinions());
      case 'setup':          return out(setup());
      default:               return out({ error: '알 수 없는 action: ' + p.action });
    }
  } catch (err) {
    return out({ error: err.toString() });
  }
}

// ── POST 라우터 ─────────────────────────────────────────────────
// 프론트에서 Content-Type: text/plain 으로 보내므로 preflight 없음

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    switch (body.action) {
      case 'register':      return out(handleRegister(body));
      case 'addVote':       return out(handleAddVote(body));
      case 'addOpinion':    return out(handleAddOpinion(body));
      case 'deleteOpinion': return out(handleDeleteOpinion(body));
      default:              return out({ error: '알 수 없는 action: ' + body.action });
    }
  } catch (err) {
    return out({ error: err.toString() });
  }
}

// ── 로그인 ──────────────────────────────────────────────────────

function handleLogin(p) {
  if (!p.email || !p.password) return { error: '이메일과 비밀번호를 입력해 주세요.' };
  const hash = sha256(p.password);
  const row = allRows('members').find(r => r[3] === p.email && r[4] === hash);
  if (!row) return { error: '이메일 또는 비밀번호가 올바르지 않습니다.' };
  return { success: true, user: { name: row[1], email: row[3], dept: row[2], role: row[7] } };
}

// ── 회원가입 ────────────────────────────────────────────────────

function handleRegister(body) {
  if (!body.name || !body.email || !body.password) return { error: '필수 항목을 입력해 주세요.' };
  const rows = allRows('members');
  if (rows.find(r => r[3] === body.email)) return { error: '이미 가입된 이메일입니다.' };
  const sh = getSheet('members');
  sh.appendRow([
    newId(), body.name, body.dept || '', body.email,
    sha256(body.password), body.phone || '', body.intro || '',
    'member', new Date().toISOString()
  ]);
  return { success: true };
}

// ── 투표 옵션 ────────────────────────────────────────────────────
// vote_options 시트: id | date(YYYY-MM-DD) | time | label

function getVoteOptions() {
  return allRows('vote_options').map(r => ({
    id: String(r[0]), date: fmtDate(r[1]), time: fmtTime(r[2]), label: r[3] || ''
  }));
}

// ── 투표 결과 ────────────────────────────────────────────────────
// 반환: { optionId: [voter1, voter2, ...], ... }

function getVotes() {
  const result = {};
  allRows('votes').forEach(r => {
    const oid = String(r[1]);
    if (!result[oid]) result[oid] = [];
    if (!result[oid].includes(r[2])) result[oid].push(r[2]);
  });
  return result;
}

// ── 투표 저장 ────────────────────────────────────────────────────

function handleAddVote(body) {
  if (!body.voter) return { error: '이름을 입력해 주세요.' };
  const ids = Array.isArray(body.optionIds) ? body.optionIds : [];
  if (!ids.length) return { error: '날짜를 선택해 주세요.' };
  const sh = getSheet('votes');
  const existing = allRows('votes');
  let added = 0;
  ids.forEach(oid => {
    // 같은 투표자 + 옵션 중복 방지
    if (!existing.find(r => String(r[1]) === String(oid) && r[2] === body.voter)) {
      sh.appendRow([newId(), String(oid), body.voter, new Date().toISOString()]);
      added++;
    }
  });
  return { success: true, added };
}

// ── 뉴스 ─────────────────────────────────────────────────────────
// news 시트: id | title | source | url | published_at

function getNews() {
  const rows = allRows('news');
  // 최신순 10개
  return rows.slice(-50).reverse().slice(0, 10).map(r => ({
    id: r[0], title: r[1], source: r[2], url: r[3],
    published_at: r[4] instanceof Date ? r[4].toISOString() : (r[4] ? String(r[4]) : '')
  }));
}

// ── 뉴스 자동 수집 (매일 오전 7시 트리거) ────────────────────────

function fetchNews() {
  const FEEDS = [
    'https://news.google.com/rss/search?q=%EC%83%9D%EC%84%B1%ED%98%95+AI+%EC%B1%97GPT&hl=ko&gl=KR&ceid=KR:ko',
    'https://news.google.com/rss/search?q=%EC%83%9D%EC%84%B1%ED%98%95AI+%ED%99%9C%EC%9A%A9&hl=ko&gl=KR&ceid=KR:ko'
  ];
  const sh = getSheet('news');
  const existingUrls = new Set(allRows('news').map(r => r[3]));
  let added = 0;

  FEEDS.forEach(feedUrl => {
    try {
      const xml = UrlFetchApp.fetch(feedUrl, { muteHttpExceptions: true }).getContentText();
      const doc = XmlService.parse(xml);
      const items = doc.getRootElement().getChild('channel').getChildren('item');
      items.slice(0, 8).forEach(item => {
        const title  = item.getChildText('title') || '';
        const link   = item.getChildText('link')  || '';
        const src    = item.getChild('source') ? item.getChild('source').getText() : 'Google 뉴스';
        const pubStr = item.getChildText('pubDate') || '';
        if (title && link && !existingUrls.has(link)) {
          sh.appendRow([newId(), title, src, link, pubStr ? new Date(pubStr).toISOString() : new Date().toISOString()]);
          existingUrls.add(link);
          added++;
        }
      });
    } catch (err) { Logger.log('RSS 오류: ' + err); }
  });

  // 300행 초과 시 오래된 것부터 삭제
  const total = sh.getLastRow();
  if (total > 301) sh.deleteRows(2, total - 301);

  Logger.log('뉴스 수집 완료: ' + added + '건 추가');
  return added;
}

// ── 공모전 ───────────────────────────────────────────────────────
// contests 시트: id | title | organizer | category | deadline | prize | url | description

function getContests() {
  return allRows('contests').map(r => ({
    id: r[0], title: r[1], organizer: r[2], category: r[3],
    deadline: fmtDate(r[4]), prize: r[5], url: r[6], description: r[7] || ''
  }));
}

// ── 의견 목록 ────────────────────────────────────────────────────
// opinions 시트: id | author | content | passwordHash | timestamp

function getOpinions() {
  return allRows('opinions').map(r => ({
    id: r[0], author: r[1], content: r[2], timestamp: r[4]
  }));
}

// ── 의견 등록 ────────────────────────────────────────────────────

function handleAddOpinion(body) {
  if (!body.author || !body.content) return { error: '이름과 내용을 입력해 주세요.' };
  if (!body.password) return { error: '삭제용 비밀번호를 설정해 주세요.' };
  const sh = getSheet('opinions');
  sh.appendRow([newId(), body.author, body.content, sha256(body.password), new Date().toISOString()]);
  return { success: true };
}

// ── 의견 삭제 ────────────────────────────────────────────────────

function handleDeleteOpinion(body) {
  if (!body.id || !body.password) return { error: '잘못된 요청입니다.' };
  const sh = getSheet('opinions');
  const rows = sh.getDataRange().getValues();
  const hash = sha256(body.password);
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(body.id)) {
      if (rows[i][3] !== hash) return { error: '비밀번호가 올바르지 않습니다.' };
      sh.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { error: '해당 의견을 찾을 수 없습니다.' };
}

// ── 초기 시트 설정 ───────────────────────────────────────────────
// 최초 1회 실행: setup() 함수를 직접 실행하거나 ?action=setup 으로 호출

function setup() {
  const SCHEMA = {
    members:      ['id','name','dept','email','passwordHash','phone','intro','role','joinedAt'],
    vote_options: ['id','date','time','label'],
    votes:        ['id','optionId','voter','votedAt'],
    news:         ['id','title','source','url','published_at'],
    opinions:     ['id','author','content','passwordHash','timestamp'],
    contests:     ['id','title','organizer','category','deadline','prize','url','description'],
  };

  Object.entries(SCHEMA).forEach(([name, headers]) => {
    const _ss = getSpreadsheet();
    let sh = _ss.getSheetByName(name);
    if (!sh) sh = _ss.insertSheet(name);
    if (sh.getRange(1, 1).getValue() === '') {
      const hRange = sh.getRange(1, 1, 1, headers.length);
      hRange.setValues([headers]);
      hRange.setFontWeight('bold');
      hRange.setBackground('#1a2538');
      hRange.setFontColor('#00e5c3');
      sh.setFrozenRows(1);
    }
  });

  // 투표 날짜 샘플 (5~12월 각 3개)
  const vo = getSheet('vote_options');
  if (vo.getLastRow() < 2) {
    const rows = [];
    for (let m = 5; m <= 12; m++) {
      [7, 14, 21].forEach(d => {
        rows.push([
          newId(),
          `2026-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`,
          '14:00', '오후'
        ]);
      });
    }
    vo.getRange(2, 1, rows.length, 4).setValues(rows);
  }

  // 공모전 샘플
  const ct = getSheet('contests');
  if (ct.getLastRow() < 2) {
    [
      [newId(),'2026 공공데이터 AI 활용 아이디어 공모전','행정안전부','중앙부처','2026-08-31','장관상·500만원','https://www.data.go.kr','공공데이터를 활용한 AI 기반 서비스 아이디어'],
      [newId(),'스마트시티 AI 솔루션 경진대회','국토교통부','중앙부처','2026-09-15','최우수상·300만원','https://www.molit.go.kr','도시 문제 해결을 위한 AI 솔루션'],
      [newId(),'서울시 AI 혁신 서비스 공모전','서울특별시','지자체','2026-07-20','시장상·200만원','https://www.seoul.go.kr','서울시민 생활 편의 향상 AI 서비스'],
    ].forEach(r => ct.appendRow(r));
  }

  return { success: true, message: '✅ 시트 초기화 완료! 이제 웹 앱으로 배포하세요.' };
}

// ── 뉴스 트리거 자동 등록 ────────────────────────────────────────
// Apps Script 편집기에서 setupTrigger() 를 1회 직접 실행하세요

function setupTrigger() {
  // 기존 fetchNews 트리거 제거
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'fetchNews')
    .forEach(t => ScriptApp.deleteTrigger(t));
  // 매일 오전 7시 트리거 등록
  ScriptApp.newTrigger('fetchNews').timeBased().everyDays(1).atHour(7).create();
  Logger.log('✅ 뉴스 트리거 설정 완료 (매일 오전 7시)');
}
