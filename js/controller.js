var firebaseConfig = {
  apiKey:            "AIzaSyC21mdsgyIEqXT7ujFbi0xcVAMRZxxqB1I",
  authDomain:        "tmraditya-1ceb7.firebaseapp.com",
  databaseURL:       "https://tmraditya-1ceb7-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "tmraditya-1ceb7",
  storageBucket:     "tmraditya-1ceb7.firebasestorage.app",
  messagingSenderId: "317037791388",
  appId:             "1:317037791388:web:755b5a18bb77aa140a4559"
};
firebase.initializeApp(firebaseConfig);
var db = firebase.database();

var lgRef      = db.ref("/live-graphics");
var stateRef   = lgRef.child("state");
var animRef    = lgRef.child("animate-from-to");
var animTypeRef = lgRef.child("animation-type");
var teamElimCmdRef = lgRef.child("teamEliminatedCommand");
var hudAlignRef = lgRef.child("hud-align");
var tickerState = null, tickerAnim = null, animType = "default";
var hudAlign = "left";

function setTicker(key, val) {
  if (key === "state") { stateRef.set(val); tickerState = val; }
  else                 { animRef.set(val);  tickerAnim  = val; }
  updateTickerUI();
}
window.setTicker = setTicker;

function setAnimType(val) {
  animTypeRef.set(val);
  animType = val;
  updateTickerUI();
}
window.setAnimType = setAnimType;

function setTeamEliminatedStyle(val) {
  lgRef.child("teamEliminatedStyle").set(val);
}
window.setTeamEliminatedStyle = setTeamEliminatedStyle;

function setTeamElimCmd(cmd) {
  teamElimCmdRef.set(cmd);
  setTimeout(function() { teamElimCmdRef.set(null); }, 100);
}
window.setTeamElimCmd = setTeamElimCmd;

function setHudAlign(val) {
  hudAlignRef.set(val);
  hudAlign = val;
  updateHudAlignUI();
}
window.setHudAlign = setHudAlign;

function updateHudAlignUI() {
  ["btn-hud-left","btn-hud-right"].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove("active");
  });
  if (hudAlign === "left") {
    var el = document.getElementById("btn-hud-left");
    if (el) el.classList.add("active");
  } else {
    var el = document.getElementById("btn-hud-right");
    if (el) el.classList.add("active");
  }
}

function updateTickerUI() {
  ["btn-left","btn-right"].forEach(function(id) {
    document.getElementById(id).classList.remove("active");
  });
  if (tickerAnim  === "LEFT")  document.getElementById("btn-left").classList.add("active");
  if (tickerAnim  === "RIGHT") document.getElementById("btn-right").classList.add("active");
  var stateBtn = document.getElementById("btn-state-toggle");
  if (stateBtn) stateBtn.textContent = tickerState === "IN" ? "HIDE" : "SHOW";
}

function toggleState() {
  var next = tickerState === "IN" ? "OUT" : "IN";
  stateRef.set(next);
  tickerState = next;
  updateTickerUI();
}
window.toggleState = toggleState;

var winnerState = "hide";

function toggleWinner() {
  var next = winnerState === "show" ? "hide" : "show";
  lgRef.child("winner").set(next);
  if (next === "show") {
    setTimeout(function() { lgRef.child("winner").set(null); }, 100);
  }
  winnerState = next;
  var btn = document.getElementById("btn-winner-toggle");
  if (btn) btn.textContent = winnerState === "show" ? "HIDE" : "SHOW";
}
window.toggleWinner = toggleWinner;

var booyahState = "hide";

function toggleBooyah() {
  var next = booyahState === "show" ? "hide" : "show";
  lgRef.child("booyahTeam").set(next);
  booyahState = next;
  var btn = document.getElementById("btn-booyah-toggle");
  if (btn) btn.textContent = booyahState === "show" ? "HIDE" : "SHOW";
}
window.toggleBooyah = toggleBooyah;

lgRef.on("value", function(snap) {
  var val = snap.val() || {};
  tickerState = val["state"]           || null;
  tickerAnim  = val["animate-from-to"] || null;
  animType    = val["animation-type"]  || "default";
  hudAlign    = val["hud-align"]       || "left";
  var sel = document.getElementById("anim-type");
  if (sel) sel.value = animType;
  var elimSel = document.getElementById("team-elim-style");
  if (elimSel) elimSel.value = val["teamEliminatedStyle"] || "center";
  updateTickerUI();
  updateHudAlignUI();
  booyahState = val["booyahTeam"] || "hide";
  var bBtn = document.getElementById("btn-booyah-toggle");
  if (bBtn) bBtn.textContent = booyahState === "show" ? "HIDE" : "SHOW";
});

var ptsVisRef = db.ref("/live-graphics/status");
var ptsVisState = "show";

function togglePts() {
  var next = ptsVisState === "show" ? "hide" : "show";
  ptsVisRef.set(next);
}
window.togglePts = togglePts;

ptsVisRef.on("value", function(snap) {
  ptsVisState = snap.val() || "show";
  var btn = document.getElementById("btn-pts-toggle");
  if (btn) btn.textContent = ptsVisState === "show" ? "HIDE" : "SHOW";
});


var mapStatusRef  = db.ref("/maprand/status");
var mapCommandRef = db.ref("/maprand/command");

mapStatusRef.on("value", function(snap) {
  var btn = document.getElementById("btn-map-start");
  if (btn) btn.disabled = snap.val() === "spinning";
});

function startMapRand() {
  var btn = document.getElementById("btn-map-start");
  if (btn.disabled) return;

  btn.disabled = true;
  mapCommandRef.set("spin");
  mapStatusRef.set("spinning");

  setTimeout(function() {
    mapStatusRef.set("ready");
    btn.disabled = false;
  }, 3000);
}
window.startMapRand = startMapRand;

function setWinRateTest(cmd) {
  lgRef.child("winRate").set(cmd);
  setTimeout(function() { lgRef.child("winRate").set(null); }, 100);
}
window.setWinRateTest = setWinRateTest;

function setTournamentStage() {
  var val = document.getElementById('winnerStageInput').value.trim();
  if (val) { lgRef.child("tournamentStage").set(val); }
}
window.setTournamentStage = setTournamentStage;

var SHEETS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxdffw25BTozZypQ69JzbTh5q4FhhNsUhb4fnlUym43mK92v8e9dTmTAcXquDWRYjTUQQ/exec";

function exportToSheets() {
  var btn = document.getElementById("btn-export-sheets");
  var st  = document.getElementById("export-sheets-status");
  btn.disabled = true; st.textContent = "reading firebase\u2026"; st.style.color = "";

  db.ref("/matches").once("value", function(snap) {
    var allMatches = snap.val() || {};
    var matchKeys = Object.keys(allMatches)
      .filter(function(k) { return /^match\d+$/.test(k); })
      .sort(function(a, b) { return parseInt(a.replace("match","")) - parseInt(b.replace("match","")); });

    if (!matchKeys.length) { st.textContent = "no matches found"; btn.disabled = false; return; }

    var payload = [];
    matchKeys.forEach(function(mk) {
      var teams = [];
      Object.keys(allMatches[mk]).forEach(function(key) {
        var node = allMatches[mk][key];
        if (typeof node !== "object" || !node || !node["1_teamTag"]) return;
        teams.push({ hash: parseInt(node["0_hash"]) || 99, tag: node["1_teamTag"] || "", kills: parseInt(node["5_totalKills"]) || 0 });
      });
      teams.sort(function(a, b) { return a.hash - b.hash; });
      while (teams.length < 12) teams.push({ hash: "", tag: "", kills: "" });
      payload.push({ match: mk, rows: teams });
    });

    st.textContent = "sending to sheets\u2026";
    fetch(SHEETS_WEBAPP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "payload=" + encodeURIComponent(JSON.stringify({ data: payload }))
    })
    .then(function(r) { return r.json(); })
    .then(function(resp) {
      st.textContent = resp.status === "ok" ? "\u2713 exported " + matchKeys.length + " match(es)" : "error: " + (resp.message || "unknown");
      st.style.color = resp.status === "ok" ? "var(--ok)" : "var(--err)";
      btn.disabled = false;
      setTimeout(function() { st.textContent = ""; }, 6000);
    })
    .catch(function() {
      st.textContent = "fetch failed";
      st.style.color = "var(--err)";
      btn.disabled = false;
    });
  });
}
window.exportToSheets = exportToSheets;

var fontsRef = db.ref("/live-graphics/fonts");
var fontStatusEl = document.getElementById("font-status");
var _fontList = [];

fontsRef.child("config").on("value", function(snap) {
  var cfg = snap.val();
  var sel = document.getElementById("font-family-select");
  if (!sel) return;
  if (cfg && cfg.fontFamily) {
    sel.value = cfg.fontFamily;
  } else {
    sel.value = "";
  }
  var checks = document.querySelectorAll(".font-pages input[type=checkbox]");
  for (var i = 0; i < checks.length; i++) {
    checks[i].checked = cfg && cfg.pages && cfg.pages[checks[i].value] === true;
  }
});

fontsRef.child("available").on("value", function(snap) {
  var list = snap.val();
  _fontList = list && list.length ? list : [];
  var sel = document.getElementById("font-family-select");
  if (!sel) return;
  var current = sel.value;
  sel.innerHTML = '<option value="">\u2014 Select font \u2014</option>';
  for (var i = 0; i < _fontList.length; i++) {
    var opt = document.createElement("option");
    opt.value = _fontList[i].name;
    opt.textContent = _fontList[i].name;
    sel.appendChild(opt);
  }
  if (current) sel.value = current;
});

function applyFont() {
  var sel = document.getElementById("font-family-select");
  var fontFamily = sel.value;
  if (!fontFamily) {
    if (fontStatusEl) fontStatusEl.textContent = "Select a font first";
    return;
  }
  var entry = null;
  for (var i = 0; i < _fontList.length; i++) {
    if (_fontList[i].name === fontFamily) { entry = _fontList[i]; break; }
  }
  if (!entry) {
    if (fontStatusEl) fontStatusEl.textContent = "Font not found in list";
    return;
  }
  var checks = document.querySelectorAll(".font-pages input[type=checkbox]:checked");
  var pages = {};
  var count = 0;
  for (var i = 0; i < checks.length; i++) {
    pages[checks[i].value] = true;
    count++;
  }
  if (count < 2) {
    if (fontStatusEl) fontStatusEl.textContent = "Select 2 or more pages";
    return;
  }
  fontsRef.child("config").set({
    fontFamily: fontFamily,
    fontFile: "fonts/" + entry.file,
    fontFormat: entry.format,
    pages: pages
  });
  if (fontStatusEl) fontStatusEl.textContent = "Applied \u2192 " + fontFamily;
}
window.applyFont = applyFont;

function resetFont() {
  fontsRef.child("config").set(null);
  if (fontStatusEl) fontStatusEl.textContent = "Font reset to default";
}
window.resetFont = resetFont;
