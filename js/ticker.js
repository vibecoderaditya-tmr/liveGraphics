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

function loadLogo(imgEl, tag) {
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

const NUM_ROWS = 12;
const rowsContainer = document.getElementById("ticker-rows");

function buildRows() {
  rowsContainer.innerHTML = "";
  for (let i = 0; i < NUM_ROWS; i++) {
    const wrap = document.createElement("div");
    wrap.className = "row-wrap";
    wrap.dataset.slot = i;

    const row = document.createElement("div");
    row.className = "ticker-row";
    row.innerHTML = `
      <span class="col-rank"></span>
      <span class="col-team">
        <span class="logo-wrap"><img class="team-logo" src="" alt=""></span>
        <span class="team-name">\u2014</span>
      </span>
      <span class="col-alive">
        <span class="alive-bar"></span>
        <span class="alive-bar"></span>
        <span class="alive-bar"></span>
        <span class="alive-bar"></span>
      </span>
      <span class="col-elims"></span>
      <span class="col-pts"></span>
      <span class="col-end"></span>
      <div class="elim-overlay"><span>ELIMINATED</span></div>
    `;
    wrap.appendChild(row);
    rowsContainer.appendChild(wrap);
  }
}
buildRows();

const rowEls = Array.from(document.querySelectorAll('.row-wrap'))
  .sort((a, b) => Number(a.dataset.slot) - Number(b.dataset.slot));

function innerRow(wrap) { return wrap.querySelector('.ticker-row'); }

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

let teamsData = null;
let liveData  = {};

let prevElims = {};
let prevPts   = {};
let currentTopFragTag = null;

function animateCount(el, from, to) {
  if (from === to) { el.textContent = to; return; }
  if (el._countTimer) clearInterval(el._countTimer);
  const step = from < to ? 1 : -1;
  const duration = 300;
  const interval = Math.max(20, Math.floor(duration / Math.abs(to - from)));
  let current = from;
  el.textContent = current;
  el._countTimer = setInterval(() => {
    current += step;
    if ((step > 0 && current >= to) || (step < 0 && current <= to)) {
      clearInterval(el._countTimer);
      el._countTimer = null;
      el.textContent = to;
    } else {
      el.textContent = current;
    }
  }, interval);
}

function renderTicker() {
  const entries = Object.keys(teamsData || {}).map(tag => ({
    tag:  tag,
    name: teamsData[tag]["1_teamName"] || tag,
    pts:  Number(teamsData[tag]["5_totalPoints"]) || 0,
  }));
  entries.sort((a, b) => b.pts - a.pts);

  const rowHeight = 40;
  const rowGap    = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--row-gap')) || 0;

  const activeTags = new Set(entries.map(e => e.tag));
  for (const wrap of rowEls) {
    if (wrap.dataset.tag && !activeTags.has(wrap.dataset.tag)) delete wrap.dataset.tag;
  }
  const assigned = new Set();
  for (const wrap of rowEls) if (wrap.dataset.tag) assigned.add(wrap.dataset.tag);
  for (const e of entries) {
    if (!assigned.has(e.tag)) {
      const free = rowEls.find(r => !r.dataset.tag);
      if (free) { free.dataset.tag = e.tag; assigned.add(e.tag); }
    }
  }

  let maxKills = -Infinity;
  for (const e of entries) {
    const live = liveData[e.tag];
    if (!live) continue;
    const aliveCount = Number(live["3_playersAlive"]) || 0;
    if (aliveCount <= 0) continue;
    const k = Number(live["5_totalKills"]) || 0;
    if (k > maxKills) maxKills = k;
  }

  let topFragTag = null;
  if (maxKills > 0) {
    const killLeaders = entries.filter(e => {
      const live = liveData[e.tag];
      return live
        && (Number(live["3_playersAlive"]) || 0) > 0
        && (Number(live["5_totalKills"]) || 0) === maxKills;
    });

    if (killLeaders.length === 1) {
      topFragTag = killLeaders[0].tag;
    } else if (killLeaders.length > 1) {
      let maxPts = -Infinity, maxPtsCount = 0;
      for (const c of killLeaders) {
        if (c.pts > maxPts) { maxPts = c.pts; maxPtsCount = 1; }
        else if (c.pts === maxPts) { maxPtsCount++; }
      }
      topFragTag = (maxPtsCount === 1)
        ? killLeaders.find(c => c.pts === maxPts).tag
        : (currentTopFragTag && killLeaders.some(c => c.tag === currentTopFragTag))
          ? currentTopFragTag
          : null;
    }
  }
  currentTopFragTag = topFragTag;

  for (const wrap of rowEls) {
    const row = innerRow(wrap);

    if (!wrap.dataset.tag || !activeTags.has(wrap.dataset.tag)) {
      wrap.style.display = "none";
      wrap.classList.remove("top-frag-wrap");
      row.querySelector(".col-rank").textContent = "";
      row.querySelector(".team-logo").src = "";
      row.querySelector(".team-logo").style.display = "none";
      row.querySelector(".logo-wrap").style.display = "none";
      row.querySelector(".team-name").textContent = "";
      row.querySelector(".col-elims").textContent = "";
      row.querySelector(".col-pts").textContent = "";
      row.querySelectorAll(".alive-bar").forEach(b => b.classList.remove("active"));
      row.querySelector(".elim-overlay").classList.remove("show", "exit", "final", "not-played-overlay");
      row.querySelector(".col-alive").classList.remove("struck");
      clearTimeout(wrap._elimT1);
      clearTimeout(wrap._elimT2);
      wrap._elimT1 = null;
      wrap._elimT2 = null;
      wrap._elimStage = 0;
      continue;
    }

    const eIdx = entries.findIndex(en => en.tag === wrap.dataset.tag);
    const e = entries[eIdx];
    const live = liveData[e.tag] || {};

    wrap.style.display = "";

    const newTop = (eIdx * (rowHeight + rowGap)) + "px";
    wrap.style.top = newTop;

    const rankEl  = row.querySelector(".col-rank");
    const logoEl  = row.querySelector(".team-logo");
    const nameEl  = row.querySelector(".team-name");
    const elimsEl = row.querySelector(".col-elims");
    const ptsEl   = row.querySelector(".col-pts");
    const aliveEl = row.querySelector(".col-alive");

    const kills = Number(live["5_totalKills"]) || 0;
    const alive = Number(live["3_playersAlive"]) || 0;
    const elimOverlay = row.querySelector(".elim-overlay");
    const notPlayed = !liveData[e.tag];

    wrap.classList.toggle("top-frag-wrap", !notPlayed && topFragTag === e.tag);

    if (notPlayed) {
      elimOverlay.classList.remove("show", "exit", "final");
      elimOverlay.classList.add("not-played-overlay");
      aliveEl.classList.add("struck");
      clearTimeout(wrap._elimT1);
      clearTimeout(wrap._elimT2);
      wrap._elimT1 = null;
      wrap._elimT2 = null;
      wrap._elimStage = 0;
    } else {
      elimOverlay.classList.remove("not-played-overlay");
      aliveEl.classList.remove("struck");
      if (alive === 0) {
        if (!wrap._elimStage) {
          wrap._elimStage = 1;
          elimOverlay.classList.add("show");
          wrap._elimT1 = setTimeout(() => {
            elimOverlay.classList.remove("show");
            elimOverlay.classList.add("exit");
            wrap._elimStage = 2;
            wrap._elimT2 = setTimeout(() => {
              elimOverlay.classList.remove("exit");
              elimOverlay.classList.add("final");
              wrap._elimStage = 3;
            }, 500);
          }, 1500);
        }
      } else {
        elimOverlay.classList.remove("show", "exit", "final");
        clearTimeout(wrap._elimT1);
        clearTimeout(wrap._elimT2);
        wrap._elimT1 = null;
        wrap._elimT2 = null;
        wrap._elimStage = 0;
      }
    }

    rankEl.textContent  = "#" + (eIdx + 1);
    row.querySelector(".logo-wrap").style.display = "flex";
    logoEl.style.display = "block";
    loadLogo(logoEl, e.tag);
    nameEl.textContent  = e.tag;
    const prevK = prevElims[e.tag];
    if (prevK !== undefined && prevK !== kills) animateCount(elimsEl, prevK, kills);
    else elimsEl.textContent = kills;
    prevElims[e.tag] = kills;
    const prevP = prevPts[e.tag];
    if (prevP !== undefined && prevP !== e.pts) animateCount(ptsEl, prevP, e.pts);
    else ptsEl.textContent = e.pts;
    prevPts[e.tag] = e.pts;
    const bars = aliveEl.querySelectorAll(".alive-bar");
    bars.forEach((bar, bi) => bar.classList.toggle("active", bi < alive));
  }
}

db.ref("/matches/0_teams").on("value", snap => {
  teamsData = snap.val() || {};
  renderTicker();
});

db.ref("/matches/live").on("value", snap => {
  liveData = snap.val() || {};
  renderTicker();
});

db.ref("/live-graphics/status").on("value", snap => {
  const val = snap.val();
  const box    = document.querySelector(".ticker-box");
  const header = document.querySelector(".ticker-header");
  const hide = val !== "show";
  box.classList.toggle("pts-hidden", hide);
  header.classList.toggle("pts-hidden", hide);
});

db.ref("/live-graphics/editor/ticker").on("value", function(snap) {
  var vals = snap.val();
  if (!vals) return;
  var root = document.documentElement;
  for (var key in vals) {
    var num = parseFloat(vals[key]);
    if (isFinite(num)) root.style.setProperty("--" + key, num + "px");
  }
});

db.ref("/live-graphics/theme/ticker").on("value", function(snap) {
  var t = snap.val();
  if (!t) return;
  var root = document.documentElement;
    function _h(v){ return typeof v === 'string' && v[0] === '#'; }
  if (_h(t.headerBg))      root.style.setProperty("--header-bg", t.headerBg);
  if (_h(t.headerText))    root.style.setProperty("--header-text", t.headerText);
  if (_h(t.headerBorder))  root.style.setProperty("--header-border", t.headerBorder);
  if (_h(t.logoBg))        root.style.setProperty("--logo-bg", t.logoBg);
  if (_h(t.rowBg))         root.style.setProperty("--row-bg", t.rowBg);
  if (_h(t.rowText))       root.style.setProperty("--row-text", t.rowText);
  if (_h(t.rowBorder))     root.style.setProperty("--row-border", t.rowBorder);
  if (_h(t.barAlive))      root.style.setProperty("--bar-alive", t.barAlive);
  if (_h(t.barDead))       root.style.setProperty("--bar-dead", t.barDead);
  if (_h(t.rankHeader))    root.style.setProperty("--col-rank-header", t.rankHeader);
  if (_h(t.rankRow))       root.style.setProperty("--col-rank-row", t.rankRow);
  if (_h(t.teamHeader))    root.style.setProperty("--col-team-header", t.teamHeader);
  if (_h(t.teamRow))       root.style.setProperty("--col-team-row", t.teamRow);
  if (_h(t.aliveHeader))   root.style.setProperty("--col-alive-header", t.aliveHeader);
  if (_h(t.aliveRow))      root.style.setProperty("--col-alive-row", t.aliveRow);
  if (_h(t.elimsHeader))   root.style.setProperty("--col-elims-header", t.elimsHeader);
  if (_h(t.elimsRow))      root.style.setProperty("--col-elims-row", t.elimsRow);
  if (_h(t.ptsHeader))     root.style.setProperty("--col-pts-header", t.ptsHeader);
  if (_h(t.ptsRow))        root.style.setProperty("--col-pts-row", t.ptsRow);
  if (_h(t.rankBg))        root.style.setProperty("--col-rank-bg", t.rankBg);
  if (_h(t.teamBg))        root.style.setProperty("--col-team-bg", t.teamBg);
  if (_h(t.aliveBg))       root.style.setProperty("--col-alive-bg", t.aliveBg);
  if (_h(t.elimsBg))       root.style.setProperty("--col-elims-bg", t.elimsBg);
  if (_h(t.ptsBg))         root.style.setProperty("--col-pts-bg", t.ptsBg);
  if (_h(t.endBg))         root.style.setProperty("--col-end-bg", t.endBg);
  if (_h(t.curtainColor))  root.style.setProperty("--curtain-color", t.curtainColor);
  if (_h(t.topFragColor))  root.style.setProperty("--top-frag-color", t.topFragColor);
});

