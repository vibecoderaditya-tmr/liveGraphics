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

// --- perMpt leaderboard ---
var _pmtTeams = {};
var _pmtFrozen = false;
var _pmtRowsBuilt = 0;
var _pmtShowTimer = null;
var _pmtHideTimer = null;

function cssVarSec(name) {
  var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  var f = parseFloat(v);
  return isNaN(f) ? 0 : f;
}

function pmtEnsure(tag, name) {
  if (!_pmtTeams[tag]) _pmtTeams[tag] = { tag: tag, name: name || tag, kills: 0, place: 0 };
  else if (name && (!_pmtTeams[tag].name || _pmtTeams[tag].name === tag)) _pmtTeams[tag].name = name;
}

function pmtApplyMatch(node) {
  if (!node || typeof node !== "object" || !node["1_teamTag"]) return;
  var tag = node["1_teamTag"];
  pmtEnsure(tag, node["4_teamName"] || node["1_teamName"] || tag);
  var k = Number(node["5_totalKills"]) || Number(node["3_killPoints"]) || 0;
  var p = Number(node["6_placementPoints"]) || Number(node["4_placePoints"]) || 0;
  if (k) _pmtTeams[tag].kills = k;
  if (p) _pmtTeams[tag].place = p;
}

function pmtEntries() {
  return Object.keys(_pmtTeams).map(function(tag) {
    var k = _pmtTeams[tag].kills || 0;
    var p = _pmtTeams[tag].place || 0;
    return { tag: tag, name: _pmtTeams[tag].name, kills: k, place: p, total: k + p };
  });
}

function pmtRender(animate) {
  var cols = document.querySelectorAll(".pmt-col");
  if (!cols.length) return;

  var entries = pmtEntries();
  entries.sort(function(a, b) { return b.total - a.total; });
  entries = entries.slice(0, 12);

  var rowsPerCol = cols.length ? Math.ceil(entries.length / cols.length) : 0;
  _pmtRowsBuilt = rowsPerCol;

  var timings = null;
  if (animate) {
    timings = {
      rowsStart: cssVarSec("--pmt-anim-top-dur") / 2 + cssVarSec("--pmt-anim-row-start") * cssVarSec("--pmt-anim-hdr-dur"),
      rowDur: cssVarSec("--pmt-anim-row-dur"),
      rowStagger: cssVarSec("--pmt-anim-row-stagger"),
      textDur: cssVarSec("--pmt-anim-text-dur"),
      textStart: cssVarSec("--pmt-anim-text-start")
    };
  }

  for (var c = 0; c < cols.length; c++) {
    var col = cols[c];
    var olds = col.querySelectorAll(".pmt-row");
    for (var o = 0; o < olds.length; o++) olds[o].remove();
    for (var r = 0; r < rowsPerCol; r++) {
      var idx = c * rowsPerCol + r;
      var row = document.createElement("div");
      row.className = "pmt-row";
      if (idx < entries.length) {
        var e = entries[idx];
        var place = Math.max(0, e.place);
        if (place === 12) row.className = "pmt-row pmt-row-booyah";
        row.innerHTML =
          "<span class=\"pmt-rank\"><span class=\"pmt-txt\">#" + (idx + 1) + "</span></span>" +
          "<div class=\"pmt-team\"><div class=\"pmt-logo-wrap\"><img class=\"pmt-logo\" alt=\"\"></div><span class=\"pmt-name\"></span></div>" +
          "<span class=\"pmt-num pmt-elim\"><span class=\"pmt-txt\">" + e.kills + "</span></span>" +
          "<span class=\"pmt-num pmt-place\"><span class=\"pmt-txt\">" + place + "</span></span>" +
          "<span class=\"pmt-num pmt-total\"><span class=\"pmt-txt\">" + e.total + "</span></span>";
        loadLogo(row.querySelector(".pmt-logo"), e.tag);
        row.querySelector(".pmt-name").textContent = e.name;

        if (timings) {
          var rowDelay = timings.rowsStart + r * timings.rowStagger;
          if (row.animate) {
            row.animate(
              [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" }],
              { duration: timings.rowDur * 1000, delay: rowDelay * 1000,
                easing: "ease-in-out", fill: "both" }
            );
            var cellDelay = rowDelay + timings.textStart * timings.rowDur;
            var cells = row.querySelectorAll(".pmt-txt, .pmt-name, .pmt-logo");
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

  var topLogo = document.getElementById("pmt-top-logo");
  if (topLogo) {
    var found = null;
    for (var tag in _pmtTeams) {
      if ((_pmtTeams[tag].place || 0) === 12) { found = _pmtTeams[tag]; break; }
    }
    if (found) {
      loadLogo(topLogo, found.tag);
    }
  }
}

function pmtScheduleRender() {
  if (_pmtFrozen) return;
  pmtRender(false);
}

db.ref("/matches").on("value", function(snap) {
  var data = snap.val();
  if (!data) return;
  var highestNum = 0, matchKey = "";
  for (var key in data) {
    var m = key.match(/^match(\d+)$/);
    if (m) { var n = parseInt(m[1], 10); if (n > highestNum) { highestNum = n; matchKey = key; } }
  }
  if (matchKey && data[matchKey]) {
    for (var key in data[matchKey]) pmtApplyMatch(data[matchKey][key]);
    pmtScheduleRender();
  }
});

db.ref("/matches/2_teams").on("value", function(snap) {
  var td = snap.val() || {};
  for (var tag in td) {
    var n = td[tag];
    pmtEnsure(tag, n && (n["1_teamName"] || n["4_teamName"]));
  }
  pmtScheduleRender();
});

db.ref("/matches/live").on("value", function(snap) {
  var ld = snap.val() || {};
  for (var tag in ld) {
    if (!_pmtTeams[tag] || !ld[tag]) continue;
    var k = Number(ld[tag]["5_totalKills"]);
    if (isFinite(k)) _pmtTeams[tag].kills = k;
  }
  pmtScheduleRender();
});

db.ref("/live-graphics/perMatchPt").on("value", function(snap) {
  var val = snap.val();
  var wrap = document.getElementById("perMpt");
  if (!wrap) return;
  var inner = wrap.querySelector(".pmt-wrap");
  if (!inner) return;

  if (val === "show") {
    if (_pmtHideTimer) { clearTimeout(_pmtHideTimer); _pmtHideTimer = null; }
    _pmtFrozen = true;

    inner.classList.remove("pmt-hide");
    inner.classList.remove("pmt-anim");
    pmtRender(true);
    void inner.offsetWidth;
    inner.classList.add("pmt-anim");
    inner.classList.add("pmt-showing");

    var rowsStart = cssVarSec("--pmt-anim-top-dur") / 2 + cssVarSec("--pmt-anim-row-start") * cssVarSec("--pmt-anim-hdr-dur");
    var rowDur = cssVarSec("--pmt-anim-row-dur");
    var rowStagger = cssVarSec("--pmt-anim-row-stagger");
    var textDur = cssVarSec("--pmt-anim-text-dur");
    var textStart = cssVarSec("--pmt-anim-text-start");
    var lastRowDelay = rowsStart + Math.max(0, _pmtRowsBuilt - 1) * rowStagger;
    var totalMs = (lastRowDelay + textStart * rowDur + textDur + 0.25) * 1000;

    if (_pmtShowTimer) clearTimeout(_pmtShowTimer);
    _pmtShowTimer = setTimeout(function() {
      _pmtShowTimer = null;
      inner.classList.remove("pmt-anim");
      var hlMs = cssVarSec("--pmt-anim-hl-dur") * 1000;
      setTimeout(function() {
        _pmtFrozen = false;
        pmtRender(false);
      }, hlMs + 50);
    }, totalMs);

  } else if (val === "hide") {
    if (_pmtShowTimer) { clearTimeout(_pmtShowTimer); _pmtShowTimer = null; }
    inner.classList.add("pmt-hide");
    var hideMs = cssVarSec("--pmt-anim-hide-dur") * 1000;
    if (_pmtHideTimer) clearTimeout(_pmtHideTimer);
    _pmtHideTimer = setTimeout(function() {
      _pmtHideTimer = null;
      inner.classList.remove("pmt-showing");
      inner.classList.remove("pmt-hide");
      inner.classList.remove("pmt-anim");
      _pmtFrozen = false;
    }, hideMs + 50);
  }
});

db.ref("/live-graphics/theme/perMatchPt").on("value", function(snap) {
  var t = snap.val();
  if (!t) return;
  var root = document.documentElement;
  function _h(v) { return typeof v === "string" && v[0] === "#"; }
  if (_h(t.topBg)) root.style.setProperty("--pmt-top-bg", t.topBg);
  if (_h(t.hdrBg)) root.style.setProperty("--pmt-hdr-bg", t.hdrBg);
  if (_h(t.hdrText)) root.style.setProperty("--pmt-hdr-text", t.hdrText);
  if (_h(t.leftBg)) root.style.setProperty("--pmt-left-bg", t.leftBg);
  if (_h(t.leftText)) root.style.setProperty("--pmt-left-text", t.leftText);
  if (_h(t.rightBg)) root.style.setProperty("--pmt-right-bg", t.rightBg);
  if (_h(t.rightText)) root.style.setProperty("--pmt-right-text", t.rightText);
  if (_h(t.booyahHighlight)) root.style.setProperty("--booyahHighlight", t.booyahHighlight);
  if (_h(t.booyahText)) root.style.setProperty("--booyahText", t.booyahText);
});

db.ref("/live-graphics/editor/perMatchPt").on("value", function(snap) {
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
  if (!cfg || !cfg.pages || !cfg.pages.perMatchPt) { root.style.removeProperty("--font-primary"); return; }
  if (!cfg.fontFamily || !cfg.fontFile) return;
  var s = document.createElement("style");
  s.id = "dyn-font";
  s.textContent = "@font-face{font-family:'" + cfg.fontFamily + "';src:url('" + cfg.fontFile + "') format('" + cfg.fontFormat + "');}";
  var old = document.getElementById("dyn-font");
  if (old) old.remove();
  document.head.appendChild(s);
  root.style.setProperty("--font-primary", cfg.fontFamily);
});
