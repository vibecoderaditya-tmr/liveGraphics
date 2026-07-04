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
var tickerState = null, tickerAnim = null, animType = "default";

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

function updateTickerUI() {
  ["btn-in","btn-out","btn-left","btn-right"].forEach(function(id) {
    document.getElementById(id).classList.remove("active");
  });
  if (tickerState === "IN")    document.getElementById("btn-in").classList.add("active");
  if (tickerState === "OUT")   document.getElementById("btn-out").classList.add("active");
  if (tickerAnim  === "LEFT")  document.getElementById("btn-left").classList.add("active");
  if (tickerAnim  === "RIGHT") document.getElementById("btn-right").classList.add("active");
}

lgRef.on("value", function(snap) {
  var val = snap.val() || {};
  tickerState = val["state"]           || null;
  tickerAnim  = val["animate-from-to"] || null;
  animType    = val["animation-type"]  || "default";
  var sel = document.getElementById("anim-type");
  if (sel) sel.value = animType;
  var elimSel = document.getElementById("team-elim-style");
  if (elimSel) elimSel.value = val["teamEliminatedStyle"] || "center";
  updateTickerUI();
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
  if (btn) btn.textContent = "TOGGLE ( " + ptsVisState.toUpperCase() + " )";
});


var COOLDOWN   = 3;
var ALL_MAPS   = ["Bermuda", "Purgatory", "Kalahari", "Alpine", "Nexterra", "Solara"];
var recentMaps = [];

var mapStatusRef  = db.ref("/maprand/status");
var mapCommandRef = db.ref("/maprand/command");
var mapResultRef  = db.ref("/maprand/result");

function getAvailableMaps() {
  return ALL_MAPS.filter(function(m) { return recentMaps.indexOf(m) === -1; });
}

function updateMapStatusText() {
  var avail = getAvailableMaps();
  var st = document.getElementById("map-rand-status");
  if (st) {
    st.textContent = avail.length + " avail \u00b7 " + recentMaps.length + " on cooldown";
  }
}

mapStatusRef.on("value", function(snap) {
  var btn = document.getElementById("btn-map-start");
  btn.disabled = snap.val() === "spinning";
});

mapResultRef.on("value", function(snap) {
  var val = snap.val();
  var el = document.getElementById("map-rand-result");
  el.textContent = (val && val !== "none") ? "\u2192 " + val : "";
});

function startMapRand() {
  var btn = document.getElementById("btn-map-start");
  if (btn.disabled) return;

  var avail = getAvailableMaps();
  if (avail.length === 0) { recentMaps = []; avail = ALL_MAPS.slice(); }

  var chosen = avail[Math.floor(Math.random() * avail.length)];
  recentMaps.push(chosen);
  if (recentMaps.length > COOLDOWN) recentMaps.shift();

  btn.disabled = true;
  mapCommandRef.set("spin");
  mapStatusRef.set("spinning");
  mapResultRef.set(chosen);

  setTimeout(function() {
    mapStatusRef.set("ready");
    btn.disabled = false;
    updateMapStatusText();
  }, 3000);
}
window.startMapRand = startMapRand;
updateMapStatusText();

function setWinRateTest(cmd) {
  lgRef.child("winRate").set(cmd);
  setTimeout(function() { lgRef.child("winRate").set(null); }, 100);
}
window.setWinRateTest = setWinRateTest;

function setWinnerTest(cmd) {
  lgRef.child("winner").set(cmd);
  if (cmd !== 'hide') {
    setTimeout(function() { lgRef.child("winner").set(null); }, 100);
  }
  ["btn-winner-show","btn-winner-shuffle","btn-winner-hide"].forEach(function(id) {
    document.getElementById(id).classList.remove("active");
  });
  document.getElementById("btn-winner-" + cmd).classList.add("active");
}
window.setWinnerTest = setWinnerTest;



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
