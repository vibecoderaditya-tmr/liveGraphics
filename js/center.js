const firebaseConfig = {
  apiKey: "AIzaSyC21mdsgyIEqXT7ujFbi0xcVAMRZxxqB1I",
  authDomain: "tmraditya-1ceb7.firebaseapp.com",
  projectId: "tmraditya-1ceb7",
  storageBucket: "tmraditya-1ceb7.firebasestorage.app",
  messagingSenderId: "317037791388",
  appId: "1:317037791388:web:755b5a18bb77aa140a4559",
  databaseURL: "https://tmraditya-1ceb7-default-rtdb.asia-southeast1.firebasedatabase.app"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let currentDesign = "center";
let teamEliminatedEditorData = {};

function applyTeamEliminatedEditor() {
  const data = teamEliminatedEditorData[currentDesign];
  if (!data) return;
  const root = document.documentElement;
  for (const key in data) {
    const num = parseFloat(data[key]);
    if (isFinite(num)) root.style.setProperty("--" + key, num + "px");
  }
}

db.ref("/live-graphics/teamEliminatedStyle").on("value", snap => {
  const val = snap.val();
  currentDesign = (val === "bmps" || val === "standard" || val === "center") ? val : "center";
  document.querySelector(".center-wrap").classList.toggle("shown", currentDesign === "center");
  document.querySelector(".bmps-wrap").classList.toggle("shown", currentDesign === "bmps");
  document.querySelector(".standard-wrap").classList.toggle("shown", currentDesign === "standard");
  applyTeamEliminatedEditor();
});

db.ref("/live-graphics/editor/teamEliminated").on("value", snap => {
  teamEliminatedEditorData = snap.val() || {};
  applyTeamEliminatedEditor();
});

const card = document.getElementById('elimCard');
const hashEl = card.querySelector('.hash-tag');
const teamNameEl = card.querySelector('.team-name');
const elimCountEl = card.querySelector('.elim-count');
const logoImg = card.querySelector('.logo-box img');

const bmpsCard = document.getElementById('bmpsCard');
const bmpsHash = bmpsCard.querySelector('.bmps-hash');
const bmpsLogo = bmpsCard.querySelector('.bmps-logo img');
const bmpsElimsCount = bmpsCard.querySelector('.bmps-elims-count');
bmpsCard.style.visibility = 'hidden';

const standardCard = document.getElementById('standardCard');
const standardHash = standardCard.querySelector('.standard-hash');
const standardLogo = standardCard.querySelector('.standard-logo img');
const standardElimsCount = standardCard.querySelector('.standard-elims-count');
standardCard.style.visibility = 'hidden';

const prevAlive = {};
const queue = [];
let showing = false;

db.ref('/matches/live').on('value', snap => {
  const data = snap.val() || {};
  const teamTags = Object.keys(data).filter(k => data[k] && data[k]['2_isTeamAlive'] !== undefined);
  const totalTeams = teamTags.length;
  for (const tag of teamTags) {
    const node = data[tag];
    const alive = node['2_isTeamAlive'];
    if (alive === undefined || alive === null) continue;
    const prev = prevAlive[tag];
    prevAlive[tag] = alive;
    if (alive === 0 && prev !== undefined && prev !== 0) {
      const hash = node['0_hash'] || totalTeams;
      queue.push({ tag, hash, kills: Number(node['5_totalKills']) || 0, name: node['4_teamName'] || '' });
      processQueue();
    }
  }
});

function processQueue() {
  if (showing || queue.length === 0) return;
  showing = true;
  const item = queue.shift();
  const name = item.name || item.tag;
  showCard(item.tag, item.hash, name, item.kills);
}

function showCard(tag, hash, name, kills) {
  if (currentDesign === "center") {
    card.classList.remove('show');
    card.style.display = 'none';
    hashEl.textContent = '#' + hash;
    teamNameEl.textContent = name;
    elimCountEl.textContent = kills + ' ELIMINATIONS';
    logoImg.src = './img/logos/' + tag + '.webp';
    card.style.display = 'flex';
    void card.offsetWidth;
    card.classList.add('show');
  } else if (currentDesign === "bmps") {
    bmpsCard.style.visibility = 'hidden';
    bmpsHash.textContent = '#' + hash;
    bmpsLogo.src = './img/logos/' + tag + '.webp';
    bmpsElimsCount.textContent = kills;
    bmpsCurtainIn(bmpsCard);
  } else {
    standardCard.style.visibility = 'hidden';
    standardHash.textContent = '#' + hash;
    standardLogo.src = './img/logos/' + tag + '.webp';
    standardElimsCount.textContent = kills;
    standardCurtainIn(standardCard);
  }
  const displayMs = 3800;
  setTimeout(() => {
    if (currentDesign === "center") {
      card.classList.remove('show');
      card.style.display = 'none';
      showing = false;
      processQueue();
    } else if (currentDesign === "bmps") {
      bmpsCurtainOut(bmpsCard, () => {
        showing = false;
        processQueue();
      });
    } else {
      standardCurtainOut(standardCard, () => {
        showing = false;
        processQueue();
      });
    }
  }, displayMs);
}

db.ref("/live-graphics/theme/eliminated").on("value", function(snap) {
  var t = snap.val();
  if (!t) return;
  var root = document.documentElement;
  function _h(v){ return typeof v === 'string' && v[0] === '#'; }
  if (_h(t.bgLeft))     root.style.setProperty("--bg-left", t.bgLeft);
  if (_h(t.bgRight))    root.style.setProperty("--bg-right", t.bgRight);
  if (t.leftHash)   root.style.setProperty("--left-hash", t.leftHash);
  if (t.rightTeam)  root.style.setProperty("--right-team", t.rightTeam);
  if (t.rightElim)  root.style.setProperty("--right-elim", t.rightElim);
});

db.ref("/live-graphics/theme/eliminated-bmps").on("value", function(snap) {
  var t = snap.val();
  if (!t) return;
  var root = document.documentElement;
  function _h(v){ return typeof v === 'string' && v[0] === '#'; }
  if (_h(t.logoBg))     root.style.setProperty("--logo-bg", t.logoBg);
  if (_h(t.elimsBg))    root.style.setProperty("--elims-bg", t.elimsBg);
  if (_h(t.elimTxtBg))  root.style.setProperty("--elim-txt-bg", t.elimTxtBg);
  if (_h(t.hashTxt))    root.style.setProperty("--hash-txt", t.hashTxt);
  if (_h(t.elimsTxt))   root.style.setProperty("--elims-txt", t.elimsTxt);
  if (_h(t.elimTxt))    root.style.setProperty("--elim-txt", t.elimTxt);
});

db.ref("/live-graphics/teamEliminatedCommand").on("value", snap => {
  const cmd = snap.val();
  if (!cmd) return;
  if (cmd === "in") {
    queue.push({ tag: "TEST", hash: 1, kills: 5, name: "TEST TEAM" });
    processQueue();
  } else if (cmd === "out") {
    if (showing) {
      if (currentDesign === "center") {
        card.classList.remove('show');
        card.style.display = 'none';
        showing = false;
        processQueue();
      } else if (currentDesign === "bmps") {
        bmpsCurtainOut(bmpsCard, () => {
          showing = false;
          processQueue();
        });
      } else {
        standardCurtainOut(standardCard, () => {
          showing = false;
          processQueue();
        });
      }
    }
  }
});

function getBmpsCurtainN() {
  return parseInt(getComputedStyle(document.documentElement).getPropertyValue('--bmps-curtain-strip-count')) || 50;
}

function buildBmpsCurtain(card, dir) {
  const wrap = document.createElement("div");
  wrap.className = "bmps-curtain-wrap " + dir;
  wrap.style.visibility = "visible";
  const n = getBmpsCurtainN();
  let maxFinish = 0;
  for (let i = 0; i < n; i++) {
    const s = document.createElement("div");
    s.className = "bmps-curtain-strip";
    s.style.top = (i / n * 100) + "%";
    const delay = Math.random() * 400;
    const dur = 0.3 + Math.random() * 0.3;
    s.dataset.growDelay = delay;
    s.dataset.growDur = dur;
    s.style.transitionDelay = delay + "ms";
    s.style.setProperty("--strip-dur", dur + "s");
    const finish = delay + dur * 1000;
    if (finish > maxFinish) maxFinish = finish;
    wrap.appendChild(s);
  }
  card.style.position = "relative";
  card.appendChild(wrap);
  wrap._maxFinish = maxFinish;
  return wrap;
}

function bmpsCurtainIn(card) {
  const wrap = buildBmpsCurtain(card, "dir-in");
  void wrap.offsetHeight;
  wrap.classList.add("strips-grow");
  setTimeout(() => {
    card.style.visibility = 'visible';
    const strips = wrap.querySelectorAll(".bmps-curtain-strip");
    strips.forEach(s => {
      s.style.transition = "none";
      s.style.transitionDelay = "0ms";
      s.style.left = "auto";
      s.style.right = "0";
      s.style.width = "100%";
    });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        let maxShrink = 0;
        strips.forEach(s => {
          const delay = Math.random() * 400;
          const dur = 0.3 + Math.random() * 0.3;
          s.style.transition = `width ${dur}s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`;
          s.style.width = "0%";
          const finish = delay + dur * 1000;
          if (finish > maxShrink) maxShrink = finish;
        });
        setTimeout(() => { wrap.remove(); card.style.position = ""; card.style.visibility = ""; }, Math.ceil(maxShrink) + 100);
      });
    });
  }, Math.ceil(wrap._maxFinish) + 350);
}

function bmpsCurtainOut(card, callback) {
  const wrap = buildBmpsCurtain(card, "dir-out");
  void wrap.offsetHeight;
  wrap.classList.add("strips-grow");
  setTimeout(() => {
    card.style.visibility = 'hidden';
    const strips = wrap.querySelectorAll(".bmps-curtain-strip");
    strips.forEach(s => {
      s.style.transition = "none";
      s.style.transitionDelay = "0ms";
      s.style.left = "0";
      s.style.right = "auto";
      s.style.width = "100%";
    });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        let maxShrink = 0;
        strips.forEach(s => {
          const delay = Math.random() * 400;
          const dur = 0.3 + Math.random() * 0.3;
          const finish = delay + dur * 1000;
          if (finish > maxShrink) maxShrink = finish;
          setTimeout(() => {
            s.style.transition = `width ${dur}s cubic-bezier(0.4, 0, 0.2, 1)`;
            s.style.width = "0";
          }, delay);
        });
        setTimeout(() => { wrap.remove(); card.style.position = ""; card.style.visibility = "hidden"; if (callback) callback(); }, Math.ceil(maxShrink) + 100);
      });
    });
  }, Math.ceil(wrap._maxFinish) + 350);
}

function standardCurtainIn(card) {
  card.style.visibility = 'visible';
  card.classList.remove('standard-fade-out', 'standard-slide-in');
  void card.offsetWidth;
  card.classList.add('standard-slide-in');
}

function standardCurtainOut(card, callback) {
  card.classList.remove('standard-slide-in');
  card.classList.add('standard-fade-out');
  setTimeout(() => {
    card.classList.remove('standard-fade-out');
    card.style.visibility = 'hidden';
    if (callback) callback();
  }, 800);
}
