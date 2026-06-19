const isFileProtocol = location.protocol === "file:";
function fileRelativeDir() {
  const p = location.pathname;
  return p.substring(0, p.lastIndexOf("/") + 1);
}
const LOGO_BASE = isFileProtocol ? `${fileRelativeDir()}img/logos/` : "/img/logos/";
const LOGO_EXT  = ".webp";

function buildCaseVariants(name) {
  const clean = String(name).trim().replace(/[^a-zA-Z0-9_-]/g, "");
  const lower = clean.toLowerCase();
  const upper = clean.toUpperCase();
  const capitalized = lower.charAt(0).toUpperCase() + lower.slice(1);
  return [...new Set([lower, upper, capitalized])];
}

function loadLogoCaseInsensitive(imgEl, tag) {
  const variants = buildCaseVariants(tag);
  let attempt = 0;
  function tryNext() {
    if (attempt >= variants.length) {
      imgEl.style.display = "none";
      imgEl.onerror = null;
      return;
    }
    imgEl.src = LOGO_BASE + variants[attempt] + LOGO_EXT;
    attempt++;
    imgEl.onerror = tryNext;
  }
  tryNext();
}

const firebaseConfig = {
  apiKey:            "AIzaSyC21mdsgyIEqXT7ujFbi0xcVAMRZxxqB1I",
  authDomain:        "tmraditya-1ceb7.firebaseapp.com",
  databaseURL:       "https://tmraditya-1ceb7-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "tmraditya-1ceb7",
  storageBucket:     "tmraditya-1ceb7.firebasestorage.app",
  messagingSenderId: "317037791388",
  appId:             "1:317037791388:web:755b5a18bb77aa140a4559"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const rowEls = Array.from(document.querySelectorAll('.row'))
  .sort((a, b) => Number(a.dataset.slot) - Number(b.dataset.slot));

function renderTeams(teamsObj, matchCounts) {
  const entries = Object.keys(teamsObj || {}).map(tag => ({
    tag:       tag,
    name:      teamsObj[tag]["1_teamName"] || tag,
    rank:      Number(teamsObj[tag]["0_rank"]) || 99,
    booyahs:   Number(teamsObj[tag]["2_booyahs"]) || 0,
    kills:     Number(teamsObj[tag]["3_killPoints"]) || 0,
    place:     Number(teamsObj[tag]["4_placePoints"]) || 0,
    total:     Number(teamsObj[tag]["5_totalPoints"]) || 0,
    matches:   (matchCounts && matchCounts[tag]) || 0,
  }));

  entries.sort((a, b) => b.total - a.total);

  for (let i = 0; i < 12; i++) {
    const rowEl = rowEls[i];
    if (!rowEl) continue;
    const e = entries[i];

    const setText = (cls, val) => { rowEl.querySelector('.' + cls).textContent = val; };

    if (e) {
      setText('f-rank',   i + 1);
      setText('f-match',  e.matches);
      setText('f-booyah', e.booyahs || '');
      setText('f-kills',  e.kills);
      setText('f-place',  e.place);
      setText('f-total',  e.total);

      const teamEl = rowEl.querySelector('.f-team');
      const existingImg = teamEl.querySelector('.f-team-logo');
      if (existingImg) {
        loadLogoCaseInsensitive(existingImg, e.tag);
      } else {
        teamEl.textContent = '';
        const img = document.createElement('img');
        img.className = 'f-team-logo';
        img.alt = '';
        teamEl.appendChild(img);
        loadLogoCaseInsensitive(img, e.tag);
      }
      const txtNode = teamEl.querySelector('.f-team-name');
      if (txtNode) {
        txtNode.textContent = e.name;
      } else {
        const span = document.createElement('span');
        span.className = 'f-team-name';
        span.textContent = e.name;
        teamEl.appendChild(span);
      }
    } else {
      setText('f-rank',   '');
      setText('f-match',  '');
      setText('f-booyah', '');
      setText('f-kills',  '');
      setText('f-place',  '');
      setText('f-total',  '');
      const teamEl = rowEl.querySelector('.f-team');
      teamEl.textContent = '';
    }
  }
}

function isMetaKey(k) {
  return k === "0_mapID" || k === "1_mapName" || k === "2_matchID" || k === "3_status" || k === "4_BOOYAH";
}

db.ref("/matches").on('value', snap => {
  const data = snap.val() || {};
  const teamsObj = data["0_teams"] || {};
  const teamTags = Object.keys(teamsObj);

  const matchCounts = {};
  teamTags.forEach(tag => matchCounts[tag] = 0);
  Object.keys(data).forEach(key => {
    if (key === "0_teams") return;
    const matchNode = data[key];
    if (matchNode && typeof matchNode === 'object') {
      teamTags.forEach(tag => {
        if (matchNode[tag] !== undefined) matchCounts[tag]++;
      });
    }
  });

  renderTeams(teamsObj, matchCounts);
});

db.ref('/live-graphics/osOnOff').on('value', snap => {
  const val = snap.val();
  const wrap = document.querySelector('.leaderboard-wrap');
  if (val === 'OFF') {
    wrap.style.display = 'none';
  } else {
    wrap.style.display = 'flex';
    document.querySelectorAll('.header-bar, .row').forEach(el => {
      el.style.animation = 'none';
      el.offsetHeight;
      el.style.animation = '';
    });
  }
});