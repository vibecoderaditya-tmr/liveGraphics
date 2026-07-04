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
let _topFragVisible = false;

function animateCount(el, from, to) {
  if (from === to) { el.textContent = to; return; }
  const step = from < to ? 1 : -1;
  const duration = 300;
  const interval = Math.max(20, Math.floor(duration / Math.abs(to - from)));
  let current = from;
  el.textContent = current;
  const timer = setInterval(() => {
    current += step;
    if ((step > 0 && current >= to) || (step < 0 && current <= to)) {
      clearInterval(timer);
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

    if (animState !== "out") {
      wrap.style.display = "";

      const newTop = (eIdx * (rowHeight + rowGap)) + "px";
      if (row.classList.contains("anim-in")) {
        wrap.style.top = newTop;
      } else {
        const prevTransition = wrap.style.transition;
        wrap.style.transition = "none";
        wrap.style.top = newTop;
        void wrap.offsetHeight;
        wrap.style.transition = prevTransition;
      }
    }

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

    wrap.classList.toggle("top-frag-wrap", _topFragVisible && !notPlayed && topFragTag === e.tag);

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

let animDirection = "left";
let animState      = "out";
let animType      = "default";
let animTimers      = [];
let _firstCurtain   = true;
let curtainLinkEl   = null;

function hideClassFor(direction) {
  return direction === "right" ? "anim-hide-right" : "anim-hide-left";
}

function getCurtainN() {
  return parseInt(getComputedStyle(document.documentElement).getPropertyValue('--curtain-strip-count')) || 50;
}

function buildCurtain(box) {
  const wrap = document.createElement("div");
  wrap.className = "curtain-wrap active";
  const n = getCurtainN();
  let maxFinish = 0;
  for (let i = 0; i < n; i++) {
    const strip = document.createElement("div");
    strip.className = "curtain-strip";
    strip.style.left = (i / n * 100) + "%";
    const delay = Math.random() * 400;
    const dur   = 0.3 + Math.random() * 0.3;
    strip.style.transitionDelay = delay + "ms";
    strip.style.setProperty("--strip-dur", dur + "s");
    const finish = delay + dur * 1000;
    if (finish > maxFinish) maxFinish = finish;
    wrap.appendChild(strip);
  }
  const topBar = document.createElement("div");
  topBar.className = "curtain-top";
  wrap.appendChild(topBar);
  box.style.position = "relative";
  box.appendChild(wrap);
  wrap._maxFinish = maxFinish;
  return wrap;
}

function curtainIn() {
  const box    = document.querySelector(".ticker-box");
  const header = document.querySelector(".ticker-header");
  rowEls.forEach(w => {
    const row = innerRow(w);
    row.classList.remove("anim-hide-left", "anim-hide-right", "anim-in", "trans-anim", "trans-anim-out", "flipped");
    row.classList.add("curtain-flip");
    w.style.display = "";
  });
  header.classList.remove("anim-hide-left", "anim-hide-right", "anim-in", "trans-anim", "trans-anim-out", "flipped");
  header.classList.add("curtain-flip");
  header.style.display = "";
  const wrap = buildCurtain(box);
  void wrap.offsetHeight;
  wrap.classList.add("strips-grow");
  const afterStrips = Math.ceil(wrap._maxFinish) + 500;
  setTimeout(() => {
    const strips = wrap.querySelectorAll(".curtain-strip");
    let maxDropFinish = 0;
    strips.forEach(strip => {
      const delay = Math.random() * 400;
      const dur   = 0.3 + Math.random() * 0.3;
      strip.style.transitionDelay = delay + "ms";
      strip.style.setProperty("--strip-drop-dur", dur + "s");
      const finish = delay + dur * 1000;
      if (finish > maxDropFinish) maxDropFinish = finish;
      void strip.offsetHeight;
      strip.classList.add("dropping");
    });
    header.classList.add("flipped");
    const visibleRows = rowEls
      .filter(w => w.style.display !== "none")
      .sort((a, b) => (parseFloat(a.style.top) || 0) - (parseFloat(b.style.top) || 0));
    visibleRows.forEach((w, i) => {
      setTimeout(() => innerRow(w).classList.add("flipped"), i * 60);
    });
    setTimeout(() => {
      _topFragVisible = true;
      renderTicker();
      wrap.remove(); box.style.position = "";
    }, Math.ceil(maxDropFinish) + 100);
  }, afterStrips);
}

function curtainOut() {
  if (_firstCurtain) {
    _firstCurtain = false;
    const h = document.querySelector(".ticker-header");
    h.classList.remove("anim-hide-left", "anim-hide-right", "anim-in", "trans-anim", "trans-anim-out");
    _topFragVisible = false;
    h.style.display = "none";
    rowEls.forEach(w => {
      innerRow(w).classList.remove("anim-hide-left", "anim-hide-right", "anim-in", "trans-anim", "trans-anim-out");
      w.style.display = "none";
    });
    return;
  }
  const box    = document.querySelector(".ticker-box");
  const header = document.querySelector(".ticker-header");
  const wrap = buildCurtain(box);
  void wrap.offsetHeight;
  wrap.classList.add("strips-grow");
  const afterStrips = Math.ceil(wrap._maxFinish) + 500;
  setTimeout(() => {
    _topFragVisible = false;
    rowEls.forEach(w => {
      innerRow(w).classList.remove("curtain-flip", "flipped");
      w.style.display = "none";
    });
    header.classList.remove("curtain-flip", "flipped");
    header.style.display = "none";
    const strips = wrap.querySelectorAll(".curtain-strip");
    let maxDropFinish = 0;
    strips.forEach(strip => {
      const delay = Math.random() * 400;
      const dur   = 0.3 + Math.random() * 0.3;
      strip.style.transitionDelay = delay + "ms";
      strip.style.setProperty("--strip-drop-dur", dur + "s");
      const finish = delay + dur * 1000;
      if (finish > maxDropFinish) maxDropFinish = finish;
      void strip.offsetHeight;
      strip.classList.add("dropping");
    });
    setTimeout(() => { wrap.remove(); box.style.position = ""; }, Math.ceil(maxDropFinish) + 100);
  }, afterStrips);
}

function loadCurtainCSS() {
  if (!curtainLinkEl) {
    curtainLinkEl = document.createElement("link");
    curtainLinkEl.rel = "stylesheet";
    curtainLinkEl.href = "css/live-ticker/curtain.css";
    document.head.appendChild(curtainLinkEl);
  }
}

function unloadCurtainCSS() {
  if (curtainLinkEl) {
    curtainLinkEl.remove();
    curtainLinkEl = null;
  }
}

function resetAnimState() {
  animTimers.forEach(function(t) { clearTimeout(t); }); animTimers = [];
  document.querySelectorAll('.curtain-wrap').forEach(function(w) { w.remove(); });
  var all = [document.querySelector('.ticker-header')].concat(rowEls.map(function(w) { return innerRow(w); })).filter(Boolean);
  all.forEach(function(el) {
    el.classList.remove('anim-hide-left','anim-hide-right','anim-in','anim-fade-in','anim-fade-out','trans-anim','trans-anim-out','trans-fade','trans-fade-out','curtain-flip','flipped');
    el.style.transition = ''; el.style.opacity = '';
  });
}

function applyAnim() {
  if (animType === "curtain") {
    if (animState === "in") curtainIn();
    else curtainOut();
    return;
  }
  if (animType === "fade") {
    resetAnimState();
    var header = document.querySelector(".ticker-header");
    var wrapRows = rowEls.filter(function(w) { return w.style.display !== "none"; }).slice().sort(function(a,b) { return (parseFloat(a.style.top)||0) - (parseFloat(b.style.top)||0); });
    var rowTargets = wrapRows.map(function(w) { return innerRow(w); });
    var allTargets = [header].concat(rowTargets).filter(Boolean);
    if (animState === "in") {
      header.style.display = "";
      rowEls.forEach(function(w) { w.style.display = ""; });
      wrapRows = rowEls.slice().sort(function(a,b) { return (parseFloat(a.style.top)||0) - (parseFloat(b.style.top)||0); });
      rowTargets = wrapRows.map(function(w) { return innerRow(w); });
      allTargets = [header].concat(rowTargets).filter(Boolean);
      allTargets.forEach(function(el) { el.style.transition = "none"; el.classList.remove("anim-fade-in","anim-fade-out"); el.classList.add("anim-fade-out"); });
      void header.offsetHeight; allTargets.forEach(function(el) { el.style.transition = ""; });
      header.classList.remove("trans-fade-out"); header.classList.add("trans-fade"); header.classList.remove("anim-fade-out"); header.classList.add("anim-fade-in");
      rowTargets.forEach(function(rowEl,i) { var t = setTimeout(function() { rowEl.classList.remove("trans-fade-out"); rowEl.classList.add("trans-fade"); rowEl.classList.remove("anim-fade-out"); rowEl.classList.add("anim-fade-in"); }, 80 + i * 60); animTimers.push(t); });
      var topFragT = setTimeout(function() { _topFragVisible = true; renderTicker(); }, rowTargets.length * 60 + 80 + 500);
      animTimers.push(topFragT);
    } else {
      _topFragVisible = false;
      rowTargets.forEach(function(rowEl,i) { var t = setTimeout(function() { rowEl.classList.remove("trans-fade"); rowEl.classList.add("trans-fade-out"); rowEl.classList.remove("anim-fade-in"); rowEl.classList.add("anim-fade-out"); }, (rowTargets.length - 1 - i) * 60); animTimers.push(t); });
      var t = setTimeout(function() { header.classList.remove("trans-fade"); header.classList.add("trans-fade-out"); header.classList.remove("anim-fade-in"); header.classList.add("anim-fade-out"); }, rowTargets.length * 60 + 80); animTimers.push(t);
      var hideT = setTimeout(function() {
        document.querySelector(".ticker-header").style.display = "none";
        rowEls.forEach(function(w) { w.style.display = "none"; });
      }, rowTargets.length * 60 + 80 + 600);
      animTimers.push(hideT);
    }
    return;
  }
  if (animType !== "default") return;
  resetAnimState();
  var header = document.querySelector(".ticker-header");
  var wrapRows = rowEls.filter(function(w) { return w.style.display !== "none"; }).slice().sort(function(a,b) { return (parseFloat(a.style.top)||0) - (parseFloat(b.style.top)||0); });
  var headerTarget = header; var rowTargets = wrapRows.map(function(w) { return innerRow(w); }); var allTargets = [headerTarget].concat(rowTargets);
  var isIn = animState === "in"; var hideCls = hideClassFor(animDirection); var otherHideCls = hideCls === "anim-hide-left" ? "anim-hide-right" : "anim-hide-left";
  if (isIn) {
    header.style.display = "";
    rowEls.forEach(function(w) { w.style.display = ""; });
    wrapRows = rowEls.slice().sort(function(a,b) { return (parseFloat(a.style.top)||0) - (parseFloat(b.style.top)||0); });
    rowTargets = wrapRows.map(function(w) { return innerRow(w); });
    allTargets = [headerTarget].concat(rowTargets);
    allTargets.forEach(function(el) { el.style.transition = "none"; el.classList.remove("anim-in", otherHideCls, hideCls); el.classList.add(hideCls); });
    void header.offsetHeight; allTargets.forEach(function(el) { el.style.transition = ""; });
    header.classList.remove("trans-anim-out"); header.classList.add("trans-anim"); header.classList.remove(hideCls); header.classList.add("anim-in");
    rowTargets.forEach(function(rowEl, i) { var t = setTimeout(function() { rowEl.classList.remove("trans-anim-out"); rowEl.classList.add("trans-anim"); rowEl.classList.remove(hideCls); rowEl.classList.add("anim-in"); }, 80 + i * 60); animTimers.push(t); });
    var topFragT = setTimeout(function() { _topFragVisible = true; renderTicker(); }, rowTargets.length * 60 + 80 + 500);
    animTimers.push(topFragT);
  } else {
    _topFragVisible = false;
    rowEls.forEach(function(w) { w.style.transition = "none"; });
    rowTargets.forEach(function(rowEl, i) { var t = setTimeout(function() { rowEl.classList.remove("trans-anim"); rowEl.classList.add("trans-anim-out"); void rowEl.offsetHeight; rowEl.classList.remove("anim-in"); rowEl.classList.add(hideCls); }, (rowTargets.length - 1 - i) * 60); animTimers.push(t); });
    var t = setTimeout(function() { header.classList.remove("trans-anim"); header.classList.add("trans-anim-out"); void header.offsetHeight; header.classList.remove("anim-in"); header.classList.add(hideCls); }, rowTargets.length * 60 + 80); animTimers.push(t);
    var hideT = setTimeout(function() {
      document.querySelector(".ticker-header").style.display = "none";
      rowEls.forEach(function(w) { w.style.display = "none"; w.style.transition = ""; });
    }, rowTargets.length * 60 + 80 + 500);
    animTimers.push(hideT);
  }
}

db.ref("/live-graphics/animate-from-to").on("value", snap => {
  const val = (snap.val() || "left").toLowerCase().trim();
  animDirection = (val === "right") ? "right" : "left";
  var w = document.querySelector('.ticker-wrap'); if (w) { w.classList.remove('dir-left','dir-right'); w.classList.add('dir-'+animDirection); }
  if (animState === "in") applyAnim();
});

db.ref("/live-graphics/state").on("value", snap => {
  animState = (snap.val() || "out").toLowerCase();
  applyAnim();
});

db.ref("/live-graphics/animation-type").on("value", snap => {
  animType = (snap.val() || "default").toLowerCase();
  if (animType === "curtain") loadCurtainCSS();
  else unloadCurtainCSS();
  applyAnim();
});

setTimeout(() => {
  animState = "out";
  applyAnim();
  var w = document.querySelector('.ticker-wrap'); if (w && !w.classList.contains('dir-left') && !w.classList.contains('dir-right')) w.classList.add('dir-left');
}, 0);

db.ref("/live-graphics/theme/ticker").on("value", function(snap) {
  var t = snap.val();
  if (!t) return;
  var root = document.documentElement;
  if (t.headerBg)      root.style.setProperty("--header-bg", t.headerBg);
  if (t.headerText)    root.style.setProperty("--header-text", t.headerText);
  if (t.headerBorder)  root.style.setProperty("--header-border", t.headerBorder);
  if (t.logoBg)        root.style.setProperty("--logo-bg", t.logoBg);
  if (t.rowBg)         root.style.setProperty("--row-bg", t.rowBg);
  if (t.rowText)       root.style.setProperty("--row-text", t.rowText);
  if (t.rowBorder)     root.style.setProperty("--row-border", t.rowBorder);
  if (t.barAlive)      root.style.setProperty("--bar-alive", t.barAlive);
  if (t.barDead)       root.style.setProperty("--bar-dead", t.barDead);
  if (t.rankHeader)    root.style.setProperty("--col-rank-header", t.rankHeader);
  if (t.rankRow)       root.style.setProperty("--col-rank-row", t.rankRow);
  if (t.teamHeader)    root.style.setProperty("--col-team-header", t.teamHeader);
  if (t.teamRow)       root.style.setProperty("--col-team-row", t.teamRow);
  if (t.aliveHeader)   root.style.setProperty("--col-alive-header", t.aliveHeader);
  if (t.aliveRow)      root.style.setProperty("--col-alive-row", t.aliveRow);
  if (t.elimsHeader)   root.style.setProperty("--col-elims-header", t.elimsHeader);
  if (t.elimsRow)      root.style.setProperty("--col-elims-row", t.elimsRow);
  if (t.ptsHeader)     root.style.setProperty("--col-pts-header", t.ptsHeader);
  if (t.ptsRow)        root.style.setProperty("--col-pts-row", t.ptsRow);
  if (t.rankBg)        root.style.setProperty("--col-rank-bg", t.rankBg);
  if (t.teamBg)        root.style.setProperty("--col-team-bg", t.teamBg);
  if (t.aliveBg)       root.style.setProperty("--col-alive-bg", t.aliveBg);
  if (t.elimsBg)       root.style.setProperty("--col-elims-bg", t.elimsBg);
  if (t.ptsBg)         root.style.setProperty("--col-pts-bg", t.ptsBg);
  if (t.endBg)         root.style.setProperty("--col-end-bg", t.endBg);
  if (t.curtainColor)  root.style.setProperty("--curtain-color", t.curtainColor);
  if (t.topFragColor) { root.style.setProperty("--top-frag-color", t.topFragColor); console.log("[theme-ticker] applied --top-frag-color =", t.topFragColor, "computed:", getComputedStyle(root).getPropertyValue("--top-frag-color")); } else { console.log("[theme-ticker] t.topFragColor is missing/falsy:", t.topFragColor); }
});
