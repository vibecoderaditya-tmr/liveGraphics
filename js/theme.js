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

var tickerThemeRef = db.ref("/live-graphics/theme/ticker");
var elimThemeRef   = db.ref("/live-graphics/theme/eliminated");
var elimBmpsThemeRef = db.ref("/live-graphics/theme/eliminated-bmps");
var winRateThemeRef = db.ref("/live-graphics/theme/winRate");
var winnerThemeRef = db.ref("/live-graphics/theme/winner");
var hudThemeRef    = db.ref("/live-graphics/theme/hud");

var TICKER_KEYS = ["headerBg","headerText","headerBorder","logoBg","rowBg","rowText","rowBorder","barAlive","barDead","rankHeader","teamHeader","aliveHeader","elimsHeader","ptsHeader","rankTeamRow","aliveRow","rightRow","rankTeamBg","rightBg","endBg","curtainColor","topFragColor"];
var ELIM_KEYS   = ["bgLeft","bgRight","leftHash","rightTeam","rightElim"];
var ELIM_BMPS_KEYS = ["logoBg","elimsBg","elimTxtBg","hashTxt","elimsTxt","elimTxt"];
var WINRATE_KEYS   = ["boxBg","upperBg","upperText","lowerBg","lowerText"];
var WINNER_KEYS    = ["statsText","cardBorder","cardBadge","nameBarBg","statsBg","textColor","nameTextColor","labelColor","contriBar","contriNumber","mvpBg","mvpText","stageText","crBg","crText","gameBg","gameText"];
var HUD_KEYS       = ["charBg","playerBg","nameBg","leftText","leftBorder","rightBg","rightText","rightBorder"];

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
    else if (prefix === "elm") writeElimTheme();
    else if (prefix === "elmBmps") writeElimBmpsTheme();
    else if (prefix === "wr") writeWinRateTheme();
    else if (prefix === "hud") writeHudTheme();
    else writeWinnerTheme();
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

function writeElimBmpsTheme() {
  var data = {};
  ELIM_BMPS_KEYS.forEach(function(k) {
    var el = document.getElementById("elmBmps-" + k);
    if (el) data[k] = el.value;
  });
  elimBmpsThemeRef.set(data);
}

function writeWinRateTheme() {
  var data = {};
  WINRATE_KEYS.forEach(function(k) {
    var el = document.getElementById("wr-" + k);
    if (el) data[k] = el.value;
  });
  winRateThemeRef.set(data);
}

function writeWinnerTheme() {
  var data = {};
  WINNER_KEYS.forEach(function(k) {
    var el = document.getElementById("wnr-" + k);
    if (el) data[k] = el.value;
  });
  winnerThemeRef.set(data);
}

function writeHudTheme() {
  var data = {};
  HUD_KEYS.forEach(function(k) {
    var el = document.getElementById("hud-" + k);
    if (el) data[k] = el.value;
  });
  hudThemeRef.set(data);
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
loadThemeVals(elimBmpsThemeRef, ELIM_BMPS_KEYS, "elmBmps");
loadThemeVals(winRateThemeRef, WINRATE_KEYS, "wr");
loadThemeVals(winnerThemeRef, WINNER_KEYS, "wnr");
loadThemeVals(hudThemeRef,    HUD_KEYS,    "hud");

function copyHex(inputId, btn) {
  var el = document.getElementById(inputId);
  if (!el) return;
  navigator.clipboard.writeText(el.value).then(function() {
    btn.classList.add("copied");
    btn.textContent = "\u2713";
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

(function initTabs() {
  var bar = document.getElementById('tabBar');
  if (!bar) return;
  var btns = bar.querySelectorAll('.tab-btn');
  for (var i = 0; i < btns.length; i++) {
    (function(btn) {
      btn.addEventListener('click', function() {
        var tab = btn.dataset.tab;
        for (var j = 0; j < btns.length; j++) btns[j].classList.remove('active');
        btn.classList.add('active');
        var panes = document.querySelectorAll('#tabBody .tab-pane');
        for (var j = 0; j < panes.length; j++) panes[j].classList.toggle('active', panes[j].dataset.tab === tab);
      });
    })(btns[i]);
  }
})();