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

function loadLogo(imgEl, tag) {
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
  imgEl.src = "img/logos/" + file + ".webp";
}

// --- osPt leaderboard ---
var _osxTeams = {};
var _osxFrozen = false;
var _osxRowsBuilt = 0;
var _osxShowTimer = null;
var _osxHideTimer = null;

function cssVarSec(name) {
  var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  var f = parseFloat(v);
  return isNaN(f) ? 0 : f;
}

function osxEnsure(tag, name) {
  if (!_osxTeams[tag]) _osxTeams[tag] = { tag: tag, name: name || tag, kills: 0, place: 0, mp: 0, booyah: 0 };
  else if (name && (!_osxTeams[tag].name || _osxTeams[tag].name === tag)) _osxTeams[tag].name = name;
}

function osxApplyTeam(node, tag) {
  if (!node) return;
  osxEnsure(tag, node["1_teamName"] || node["4_teamName"] || tag);
  var k = Number(node["3_killPoints"]) || 0;
  var p = Number(node["4_placePoints"]) || 0;
  if (k) _osxTeams[tag].kills = k;
  if (p) _osxTeams[tag].place = p;
}

function osxEntries() {
  return Object.keys(_osxTeams).map(function(tag) {
    var k = _osxTeams[tag].kills || 0;
    var p = _osxTeams[tag].place || 0;
    return { tag: tag, name: _osxTeams[tag].name, kills: k, place: p, total: k + p, mp: _osxTeams[tag].mp || 0, booyah: _osxTeams[tag].booyah || 0 };
  });
}

function osxRender(animate) {
  var cols = document.querySelectorAll(".osx-col");
  if (!cols.length) return;

  var entries = osxEntries();
  entries.sort(function(a, b) { return b.total - a.total; });
  entries = entries.slice(0, 12);

  var rowsPerCol = cols.length ? Math.ceil(entries.length / cols.length) : 0;
  _osxRowsBuilt = rowsPerCol;

  var timings = null;
  if (animate) {
    timings = {
      rowsStart: cssVarSec("--osx-anim-row-start") * cssVarSec("--osx-anim-hdr-dur"),
      rowDur: cssVarSec("--osx-anim-row-dur"),
      rowStagger: cssVarSec("--osx-anim-row-stagger"),
      textDur: cssVarSec("--osx-anim-text-dur"),
      textStart: cssVarSec("--osx-anim-text-start")
    };
  }

  for (var c = 0; c < cols.length; c++) {
    var col = cols[c];
    var olds = col.querySelectorAll(".osx-row");
    for (var o = 0; o < olds.length; o++) olds[o].remove();
    for (var r = 0; r < rowsPerCol; r++) {
      var idx = c * rowsPerCol + r;
      var row = document.createElement("div");
      row.className = "osx-row";
      if (idx < entries.length) {
        var e = entries[idx];
        var place = Math.max(0, e.place);
        row.innerHTML =
          "<span class=\"osx-rank\"><span class=\"osx-txt\">#" + (idx + 1) + "</span></span>" +
          "<div class=\"osx-team\"><div class=\"osx-logo-wrap\"><img class=\"osx-logo\" alt=\"\"></div><span class=\"osx-name\"></span></div>" +
          "<span class=\"osx-num osx-mp\"><span class=\"osx-txt\">" + e.mp + "</span></span>" +
          "<span class=\"osx-num osx-booyah\"><span class=\"osx-txt\">" + (e.booyah > 0 ? e.booyah : "") + "</span></span>" +
          "<span class=\"osx-num osx-elim\"><span class=\"osx-txt\">" + e.kills + "</span></span>" +
          "<span class=\"osx-num osx-place\"><span class=\"osx-txt\">" + place + "</span></span>" +
          "<span class=\"osx-num osx-total\"><span class=\"osx-txt\">" + e.total + "</span></span>";
        loadLogo(row.querySelector(".osx-logo"), e.tag);
        row.querySelector(".osx-name").textContent = e.name;

        if (timings) {
          var rowDelay = timings.rowsStart + r * timings.rowStagger;
          if (row.animate) {
            row.animate(
              [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" }],
              { duration: timings.rowDur * 1000, delay: rowDelay * 1000,
                easing: "ease-in-out", fill: "both" }
            );
            var cellDelay = rowDelay + timings.textStart * timings.rowDur;
            var cells = row.querySelectorAll(".osx-txt, .osx-name, .osx-logo");
            for (var ci = 0; ci < cells.length; ci++) {
              cells[ci].animate(
                [{ opacity: 0, transform: "translateY(-40%)" }, { opacity: 1, transform: "translateY(0)" }],
                { duration: timings.textDur * 1000, delay: cellDelay * 1000,
                  easing: "ease-out", fill: "both" }
              );
            }
          }
        }
      }
      col.appendChild(row);
    }
  }
}

function osxScheduleRender() {
  if (_osxFrozen) return;
  osxRender(false);
}

db.ref("/matches/2_teams").on("value", function(snap) {
  var td = snap.val() || {};
  for (var tag in td) {
    osxApplyTeam(td[tag], tag);
  }
  osxScheduleRender();
});

db.ref("/matches").on("value", function(snap) {
  var data = snap.val() || {};
  for (var key in data) {
    if (!/^match\d+$/.test(key)) continue;
    var node = data[key];
    if (!node || typeof node !== "object") continue;
    for (var tag in node) {
      var tn = node[tag];
      if (!tn || typeof tn !== "object" || tn["0_hash"] === undefined) continue;
      osxEnsure(tag, tn["4_teamName"] || tn["1_teamName"] || tag);
      _osxTeams[tag].mp++;
      if (Number(tn["0_hash"]) === 1) _osxTeams[tag].booyah++;
    }
  }
  osxScheduleRender();
});

db.ref("/live-graphics/osPt").on("value", function(snap) {
  var val = snap.val();
  var wrap = document.getElementById("osPrm");
  if (!wrap) return;
  var inner = wrap.querySelector(".osx-wrap");
  if (!inner) return;

  if (val === "show") {
    if (_osxHideTimer) { clearTimeout(_osxHideTimer); _osxHideTimer = null; }
    _osxFrozen = true;

    inner.classList.remove("osx-hide");
    inner.classList.remove("osx-anim");
    osxRender(true);
    void inner.offsetWidth;
    inner.classList.add("osx-anim");
    inner.classList.add("osx-showing");

    var rowsStart = cssVarSec("--osx-anim-row-start") * cssVarSec("--osx-anim-hdr-dur");
    var rowDur = cssVarSec("--osx-anim-row-dur");
    var rowStagger = cssVarSec("--osx-anim-row-stagger");
    var textDur = cssVarSec("--osx-anim-text-dur");
    var textStart = cssVarSec("--osx-anim-text-start");
    var lastRowDelay = rowsStart + Math.max(0, _osxRowsBuilt - 1) * rowStagger;
    var totalMs = (lastRowDelay + textStart * rowDur + textDur + 0.25) * 1000;

    if (_osxShowTimer) clearTimeout(_osxShowTimer);
    _osxShowTimer = setTimeout(function() {
      _osxShowTimer = null;
      inner.classList.remove("osx-anim");
      _osxFrozen = false;
      osxRender(false);
    }, totalMs + 50);

  } else if (val === "hide") {
    if (_osxShowTimer) { clearTimeout(_osxShowTimer); _osxShowTimer = null; }
    inner.classList.add("osx-hide");
    var hideMs = cssVarSec("--osx-anim-hide-dur") * 1000;
    if (_osxHideTimer) clearTimeout(_osxHideTimer);
    _osxHideTimer = setTimeout(function() {
      _osxHideTimer = null;
      inner.classList.remove("osx-showing");
      inner.classList.remove("osx-hide");
      inner.classList.remove("osx-anim");
      _osxFrozen = false;
    }, hideMs + 50);
  }
});

db.ref("/live-graphics/theme/osPt").on("value", function(snap) {
  var t = snap.val();
  if (!t) return;
  var root = document.documentElement;
  function _h(v) { return typeof v === "string" && v[0] === "#"; }
  if (_h(t.hdrBg)) root.style.setProperty("--osx-hdr-bg", t.hdrBg);
  if (_h(t.hdrText)) root.style.setProperty("--osx-hdr-text", t.hdrText);
  if (_h(t.leftBg)) root.style.setProperty("--osx-left-bg", t.leftBg);
  if (_h(t.leftText)) root.style.setProperty("--osx-left-text", t.leftText);
  if (_h(t.rightBg)) root.style.setProperty("--osx-right-bg", t.rightBg);
  if (_h(t.rightText)) root.style.setProperty("--osx-right-text", t.rightText);
});

db.ref("/live-graphics/editor/osPt").on("value", function(snap) {
  var vals = snap.val();
  if (!vals) return;
  var root = document.documentElement;
  for (var key in vals) {
    var num = parseFloat(vals[key]);
    if (isFinite(num)) root.style.setProperty("--" + key, num + "px");
  }
});

db.ref("/live-graphics/fonts/config").on("value", function(snap) {
  var cfg = snap.val();
  var root = document.documentElement;
  if (!cfg || !cfg.pages || !cfg.pages.osPt) { root.style.removeProperty("--font-primary"); return; }
  if (!cfg.fontFamily || !cfg.fontFile) return;
  var s = document.createElement("style");
  s.id = "dyn-font";
  s.textContent = "@font-face{font-family:'" + cfg.fontFamily + "';src:url('" + cfg.fontFile + "') format('" + cfg.fontFormat + "');}";
  var old = document.getElementById("dyn-font");
  if (old) old.remove();
  document.head.appendChild(s);
  root.style.setProperty("--font-primary", cfg.fontFamily);
});