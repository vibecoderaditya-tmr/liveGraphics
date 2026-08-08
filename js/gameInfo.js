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

const rows = [1, 2, 3].map(function(n) {
  const row = document.getElementById("giRow" + n);
  return {
    row: row,
    text: row.querySelector("span")
  };
});
rows.forEach(function(r) { r.row.style.visibility = ""; });

db.ref("/matches").on("value", function(snap) {
  const data = snap.val() || {};
  let highestNum = 0, matchKey = "";
  for (const key in data) {
    const m = key.match(/^match(\d+)$/);
    if (m) { const n = parseInt(m[1], 10); if (n > highestNum) { highestNum = n; matchKey = key; } }
  }
  if (!matchKey) return;
  const match = data[matchKey] || {};
  if (rows[0] && rows[0].text) rows[0].text.textContent = "GAME " + highestNum;
  if (rows[1] && rows[1].text) rows[1].text.textContent = match["1_mapName"] || "";
});

function setTeamLogo(imgEl, tag) {
  var file = window.logoFile ? window.logoFile(tag) : null;
  if (!file) {
    imgEl.style.display = "none";
    imgEl.onerror = null;
    return;
  }
  imgEl.style.display = "";
  imgEl.onerror = function() {
    imgEl.style.display = "none";
    imgEl.onerror = null;
  };
  imgEl.src = "./img/logos/" + file + ".webp";
}

var showing = false;

function getCurtainN() {
  return parseInt(getComputedStyle(document.documentElement).getPropertyValue("--gi-curtain-strip-count")) || 50;
}

function buildCurtain(card, dir) {
  const wrap = document.createElement("div");
  wrap.className = "gi-curtain-wrap " + dir;
  wrap.style.visibility = "visible";
  const n = getCurtainN();
  let maxFinish = 0;
  for (let i = 0; i < n; i++) {
    const s = document.createElement("div");
    s.className = "gi-curtain-strip";
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

function curtainIn(card) {
  const wrap = buildCurtain(card, "dir-in");
  void wrap.offsetHeight;
  wrap.classList.add("strips-grow");
  setTimeout(() => {
    card.style.visibility = "visible";
    const strips = wrap.querySelectorAll(".gi-curtain-strip");
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

function curtainOut(card, callback) {
  const wrap = buildCurtain(card, "dir-out");
  void wrap.offsetHeight;
  wrap.classList.add("strips-grow");
  setTimeout(() => {
    card.style.visibility = "hidden";
    const strips = wrap.querySelectorAll(".gi-curtain-strip");
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

function showAll() {
  if (showing) return;
  showing = true;
  var wrap = document.getElementById("giWrap");
  if (wrap) wrap.classList.add("shown");
  rows.forEach(function(r) {
    r.row.style.visibility = "hidden";
    curtainIn(r.row);
  });
}

function hideAll(callback) {
  let done = 0;
  rows.forEach(function(r) {
    curtainOut(r.row, function() {
      done++;
      if (done >= rows.length && callback) callback();
    });
  });
}

db.ref("/live-graphics/gameInfoCommand").on("value", function(snap) {
  const cmd = snap.val();
  if (!cmd) return;
  if (cmd === "in") {
    showAll();
    setTimeout(function() {
      hideAll(function() {
        var wrap = document.getElementById("giWrap");
        if (wrap) wrap.classList.remove("shown");
        showing = false;
      });
    }, 11000);
  } else if (cmd === "out") {
    if (showing) {
      hideAll(function() {
        var wrap = document.getElementById("giWrap");
        if (wrap) wrap.classList.remove("shown");
        showing = false;
      });
    }
  }
});

db.ref("/live-graphics/theme/gameInfo").on("value", function(snap) {
  var t = snap.val();
  if (!t) return;
  var root = document.documentElement;
  function _h(v){ return typeof v === "string" && v[0] === "#"; }
  if (_h(t.rowBg))   root.style.setProperty("--row-bg", t.rowBg);
  if (_h(t.rowText)) root.style.setProperty("--row-text", t.rowText);
});

db.ref("/live-graphics/theme/ticker").on("value", function(snap) {
  var t = snap.val();
  if (!t) return;
  var root = document.documentElement;
  function _h(v){ return typeof v === "string" && v[0] === "#"; }
  if (_h(t.curtainColor)) root.style.setProperty("--curtain-color", t.curtainColor);
});

db.ref("/live-graphics/fonts/config").on("value", function(snap) {
  var cfg = snap.val();
  var root = document.documentElement;
  if (!cfg || !cfg.pages || !cfg.pages.gameInfo) { root.style.removeProperty("--font-primary"); return; }
  if (!cfg.fontFamily || !cfg.fontFile) return;
  var s = document.createElement("style");
  s.id = "dyn-font";
  s.textContent = "@font-face{font-family:'" + cfg.fontFamily + "';src:url('" + cfg.fontFile + "') format('" + cfg.fontFormat + "');}";
  var old = document.getElementById("dyn-font");
  if (old) old.remove();
  document.head.appendChild(s);
  root.style.setProperty("--font-primary", cfg.fontFamily);
});