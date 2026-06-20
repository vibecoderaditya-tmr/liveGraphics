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

var lgRef    = db.ref("/live-graphics");
var stateRef = lgRef.child("state");
var animRef  = lgRef.child("animate-from-to");
var tickerState = null, tickerAnim = null;

function setTicker(key, val) {
  if (key === "state") { stateRef.set(val); tickerState = val; }
  else                 { animRef.set(val);  tickerAnim  = val; }
  updateTickerUI();
}
window.setTicker = setTicker;

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
  updateTickerUI();
});

var ptsVisRef = db.ref("/live-graphics/status");

function setPtsVis(val) {
  ptsVisRef.set(val);
  document.getElementById("btn-pts-show").classList.toggle("active", val === "show");
  document.getElementById("btn-pts-hide").classList.toggle("active", val === "hide");
}
window.setPtsVis = setPtsVis;

ptsVisRef.once("value", function(snap) {
  var val = snap.val() || "show";
  document.getElementById("btn-pts-show").classList.toggle("active", val === "show");
  document.getElementById("btn-pts-hide").classList.toggle("active", val === "hide");
});

var slideDirRef = db.ref("/live-graphics/overview/slideDirection");

function setSlideDir(dir) {
  slideDirRef.set(dir);
  document.getElementById("btn-slide-left").classList.toggle("active", dir === "left");
  document.getElementById("btn-slide-right").classList.toggle("active", dir === "right");
}
window.setSlideDir = setSlideDir;

slideDirRef.once("value", function(snap) {
  var dir = snap.val() || "left";
  document.getElementById("btn-slide-left").classList.toggle("active", dir === "left");
  document.getElementById("btn-slide-right").classList.toggle("active", dir === "right");
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
    st.textContent = avail.length + " avail · " + recentMaps.length + " on cooldown";
    st.style.color = "";
  }
}

mapStatusRef.on("value", function(snap) {
  var val = snap.val();
  var btn = document.getElementById("btn-map-start");
  if (val === "spinning") {
    btn.disabled = true;
  } else {
    btn.disabled = false;
  }
});

mapResultRef.on("value", function(snap) {
  var val = snap.val();
  var el  = document.getElementById("map-rand-result");
  if (val && val !== "none") {
    el.textContent  = "→ " + val;
    el.style.color  = "var(--accent)";
  } else {
    el.textContent = "";
  }
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

var SHEETS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxdffw25BTozZypQ69JzbTh5q4FhhNsUhb4fnlUym43mK92v8e9dTmTAcXquDWRYjTUQQ/exec";

function exportToSheets() {
  var btn = document.getElementById("btn-export-sheets");
  var st  = document.getElementById("export-sheets-status");
  if (!SHEETS_WEBAPP_URL) { st.textContent = "no URL set"; return; }

  btn.disabled   = true;
  st.textContent = "reading firebase…";
  st.style.color = "var(--text-mid)";

  db.ref("/matches").once("value", function(snap) {
    var allMatches = snap.val() || {};
    var matchKeys = Object.keys(allMatches)
      .filter(function(k) { return /^match\d+$/.test(k); })
      .sort(function(a, b) { return parseInt(a.replace("match","")) - parseInt(b.replace("match","")); });

    if (matchKeys.length === 0) {
      st.textContent = "no matches found";
      btn.disabled = false; return;
    }

    var payload = [];
    matchKeys.forEach(function(mk) {
      var mdata = allMatches[mk];
      var teams = [];
      Object.keys(mdata).forEach(function(key) {
        var node = mdata[key];
        if (typeof node !== "object" || node === null) return;
        if (!node["1_teamTag"]) return;
        teams.push({ hash: parseInt(node["0_hash"]) || 99, tag: node["1_teamTag"] || "", kills: parseInt(node["5_totalKills"]) || 0 });
      });
      teams.sort(function(a, b) { return a.hash - b.hash; });
      while (teams.length < 12) teams.push({ hash: "", tag: "", kills: "" });
      payload.push({ match: mk, rows: teams });
    });

    st.textContent = "sending to sheets…";
    fetch(SHEETS_WEBAPP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "payload=" + encodeURIComponent(JSON.stringify({ data: payload }))
    })
    .then(function(res) { return res.json(); })
    .then(function(resp) {
      if (resp.status === "ok") {
        st.textContent = "✓ exported " + matchKeys.length + " match(es)";
        st.style.color = "var(--ok)";
      } else {
        st.textContent = "error: " + (resp.message || "unknown");
        st.style.color = "var(--err)";
      }
      btn.disabled = false;
      setTimeout(function() { st.textContent = ""; }, 6000);
    })
    .catch(function(err) {
      st.textContent = "fetch failed";
      st.style.color = "var(--err)";
      btn.disabled = false;
    });
  });
}
window.exportToSheets = exportToSheets;

var tickerThemeRef = db.ref("/live-graphics/theme/ticker");
var elimThemeRef   = db.ref("/live-graphics/theme/eliminated");

var TICKER_KEYS = ["headerBg","headerText","headerBorder","rowBg","rowBgAlt","rowText","rowBorder","rowPts","barAlive","barDead"];
var ELIM_KEYS   = ["bgLeft","bgRight","leftHash","rightTeam","rightElim"];

function isValidHex(str) {
  return /^#?[0-9a-fA-F]{6}$/.test(str.trim());
}

function normaliseHex(str) {
  return "#" + str.replace("#","").toUpperCase();
}

function onColorPick(colorEl, prefix) {
  var hexEl = document.getElementById("hex-" + colorEl.id);
  if (hexEl) {
    hexEl.value = colorEl.value.toUpperCase();
    hexEl.classList.remove("invalid");
  }
  scheduleWrite(prefix);
}
window.onColorPick = onColorPick;

function onHexType(hexEl, prefix) {
  var raw = hexEl.value.trim();
  if (isValidHex(raw)) {
    var norm = normaliseHex(raw);
    hexEl.value = norm;
    hexEl.classList.remove("invalid");
    var colorId = hexEl.id.replace(/^hex-/, "");
    var colorEl = document.getElementById(colorId);
    if (colorEl) colorEl.value = norm.toLowerCase();
    scheduleWrite(prefix);
  } else {
    hexEl.classList.add("invalid");
  }
}
window.onHexType = onHexType;

var writeTimers = {};
function scheduleWrite(prefix) {
  if (writeTimers[prefix]) clearTimeout(writeTimers[prefix]);
  writeTimers[prefix] = setTimeout(function() {
    if (prefix === "tkr") writeTickerTheme();
    else                  writeElimTheme();
  }, 120);
}

function writeTickerTheme() {
  var data = {};
  TICKER_KEYS.forEach(function(k) {
    var el = document.getElementById("tkr-" + k);
    if (el) data[k] = el.value;
  });
  tickerThemeRef.set(data);
}

function writeElimTheme() {
  var data = {};
  ELIM_KEYS.forEach(function(k) {
    var el = document.getElementById("elm-" + k);
    if (el) data[k] = el.value;
  });
  elimThemeRef.set(data);
}

function loadThemeVals(ref, keys, prefix) {
  ref.once("value", function(snap) {
    var val = snap.val() || {};
    keys.forEach(function(k) {
      var colorId = prefix + "-" + k;
      var hexId   = "hex-" + prefix + "-" + k;
      var colorEl = document.getElementById(colorId);
      var hexEl   = document.getElementById(hexId);
      if (val[k]) {
        if (colorEl) colorEl.value = val[k];
        if (hexEl)   { hexEl.value = val[k].toUpperCase(); hexEl.classList.remove("invalid"); }
      }
    });
  });
}

loadThemeVals(tickerThemeRef, TICKER_KEYS, "tkr");
loadThemeVals(elimThemeRef,   ELIM_KEYS,   "elm");

function copyHex(inputId, btn) {
  var el = document.getElementById(inputId);
  if (!el) return;
  navigator.clipboard.writeText(el.value).then(function() {
    btn.classList.add("copied");
    btn.textContent = "✓";
    setTimeout(function() {
      btn.classList.remove("copied");
      btn.textContent = "COPY";
    }, 1200);
  }).catch(function() {
    el.select();
    document.execCommand("copy");
  });
}
window.copyHex = copyHex;

function pickColor(btn) {
  var pair = btn.closest(".color-pair");
  if (!pair) return;
  var colorEl = pair.querySelector('input[type="color"]');
  var hexEl   = pair.querySelector(".hex-text");
  if (!colorEl || !hexEl) return;
  var idParts = colorEl.id.split("-");
  var prefix  = idParts[0];

  if (!window.EyeDropper) { hexEl.classList.add("invalid"); setTimeout(function() { hexEl.classList.remove("invalid"); }, 600); return; }

  btn.classList.add("active");
  var dropper = new EyeDropper();
  dropper.open().then(function(result) {
    btn.classList.remove("active");
    var color = result.sRGBHex;
    colorEl.value = color;
    hexEl.value = color.toUpperCase();
    hexEl.classList.remove("invalid");
    scheduleWrite(prefix);
  }).catch(function() {
    btn.classList.remove("active");
  });
}
window.pickColor = pickColor;
