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
var lgRef = db.ref("/live-graphics");

var ACTIONS = {
  osPT_SHOW_HIDE:        { label: "osPT",       sub: "SHOW / HIDE", toggle: lgRef.child("osPt"), on: "show",                off: "hide" },
  perMatchPt_SHOW_HIDE:  { label: "perMatchPt", sub: "SHOW / HIDE", toggle: lgRef.child("perMatchPt"), on: "show",           off: "hide" },
  booyahTeam_SHOW_HIDE:  { label: "Booyah",     sub: "SHOW / HIDE", toggle: lgRef.child("booyahTeam"), on: "show",           off: "hide" },
  crActivate_SHOW_HIDE:  { label: "CR Activate", sub: "SHOW / HIDE", toggle: lgRef.child("crActivateTeams").child("state"), on: "IN", off: "OUT" },
  ticker_STATE:          { label: "Ticker",     sub: "IN / OUT",    toggle: lgRef.child("state"), on: "IN",                 off: "OUT" },
  ticker_LEFT:           { label: "Ticker",     sub: "LEFT",        setVal: lgRef.child("animate-from-to"), set: "LEFT" },
  ticker_RIGHT:          { label: "Ticker",     sub: "RIGHT",       setVal: lgRef.child("animate-from-to"), set: "RIGHT" },
  gameInfo_IN:           { label: "Game Info",  sub: "IN",          pulse: lgRef.child("gameInfoCommand"), send: "in" },
  teamElim_IN:           { label: "Team Elim",  sub: "IN",          pulse: lgRef.child("teamEliminatedCommand"), send: "in" },
  crAlert_IN:            { label: "CR Alert",   sub: "IN",          pulse: lgRef.child("cr").child("alertCmd"), send: "in" },
  winner_SHOW:           { label: "Winner",     sub: "SHOW / HIDE", toggle: lgRef.child("winner"), on: "show",             off: "hide" },
  exportToSheets:        { label: "Export",     sub: "SHEETS",      fn: exportToSheets }
};

var SHEETS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxdffw25BTozZypQ69JzbTh5q4FhhNsUhb4fnlUym43mK92v8e9dTmTAcXquDWRYjTUQQ/exec";

function exportToSheets() {
  db.ref("/matches").once("value", function(snap) {
    var allMatches = snap.val() || {};
    var matchKeys = Object.keys(allMatches)
      .filter(function(k) { return /^match\d+$/.test(k); })
      .sort(function(a, b) { return parseInt(a.replace("match","")) - parseInt(b.replace("match","")); });
    if (!matchKeys.length) return;
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
    fetch(SHEETS_WEBAPP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "payload=" + encodeURIComponent(JSON.stringify({ data: payload }))
    }).catch(function() {});
  });
}

var RED = "#dc2626";
var state = {};
var els = {};

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    var el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
  }
}
window.toggleFullscreen = toggleFullscreen;

function buildEl(id, cfg) {
  var a = cfg.action ? ACTIONS[cfg.action] : null;
  var el = document.createElement("div");
  el.className = "deck-btn";
  el.innerHTML = '<span class="deck-label"></span><span class="deck-sub"></span>';
  el.querySelector(".deck-label").textContent = cfg.label && cfg.label.trim() ? cfg.label : (a ? a.label : "UNASSIGNED");
  el.querySelector(".deck-sub").textContent = a ? a.sub : "—";
  el.addEventListener("click", function() { onPress(id, cfg); });
  if (!a) el.classList.add("deck-empty");
  els[id] = el;
  return el;
}

function applyStyle(el, cfg) {
  if (!cfg || !cfg.action) { el.style.background = ""; el.style.color = ""; return; }
  var shown = state[cfg.action] === true;
  el.style.background = shown ? RED : (cfg.bg || "#1f2937");
  el.style.color = cfg.text || "#ffffff";
}

function onPress(id, cfg) {
  var a = ACTIONS[cfg.action];
  if (!a) return;
  if (a.toggle) {
    var next = state[cfg.action] === true ? a.off : a.on;
    a.toggle.set(next);
  }
  if (a.setVal) {
    a.setVal.set(a.set);
    flashEl(els[id]);
  }
  if (a.pulse) {
    a.pulse.set(a.send);
    setTimeout(function() { a.pulse.set(null); }, 100);
    flashEl(els[id]);
  }
  if (a.fn) {
    a.fn();
    flashEl(els[id]);
  }
}

function flashEl(el) {
  if (!el) return;
  var orig = el.style.background;
  el.style.background = RED;
  el.classList.add("deck-flash");
  setTimeout(function() {
    el.style.background = orig;
    el.classList.remove("deck-flash");
  }, 250);
}

function render() {
  var grid = document.getElementById("deck-grid");
  var size = document.getElementById("deck-size");
  if (!grid) return;
  grid.innerHTML = "";
  els = {};
  var rows = cfg.rows, cols = cfg.cols;
  var total = rows * cols;
  grid.style.gridTemplateColumns = "repeat(" + cols + ", 1fr)";
  if (size) size.textContent = rows + " x " + cols;
  for (var i = 1; i <= total; i++) {
    var id = "btn-" + i;
    var a = asg[id] ? ACTIONS[asg[id].action] : null;
    var tileCfg = a ? { action: asg[id].action } : null;
    if (tileCfg) {
      if (asg[id].bg) tileCfg.bg = asg[id].bg;
      if (asg[id].text) tileCfg.text = asg[id].text;
      if (asg[id].label) tileCfg.label = asg[id].label;
    }
    var el = buildEl(id, tileCfg ? { action: tileCfg.action, label: tileCfg.label } : null);
    if (tileCfg) applyStyle(el, tileCfg);
    grid.appendChild(el);
  }
}

var cfg = { rows: 2, cols: 4 };
var asg = {};

db.ref("/live-graphics/buttons/config").on("value", function(snap) {
  var v = snap.val();
  if (v) {
    if (v.rows > 0) cfg.rows = v.rows;
    if (v.cols > 0) cfg.cols = v.cols;
  }
  render();
});

db.ref("/live-graphics/buttons/assignments").on("value", function(snap) {
  asg = snap.val() || {};
  render();
});

Object.keys(ACTIONS).forEach(function(key) {
  var a = ACTIONS[key];
  var track = a.toggle;
  if (!track) return;
  track.on("value", function(snap) {
    var v = snap.val();
    state[key] = v === a.on ? true : (v === a.off ? false : (state[key] || false));
    for (var id in els) {
      var cfgEl = asg[id];
      if (cfgEl && cfgEl.action === key) applyStyle(els[id], cfgEl);
    }
  });
});