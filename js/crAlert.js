var firebaseConfig = {
  apiKey: "AIzaSyC21mdsgyIEqXT7ujFbi0xcVAMRZxxqB1I",
  authDomain: "tmraditya-1ceb7.firebaseapp.com",
  databaseURL: "https://tmraditya-1ceb7-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tmraditya-1ceb7",
  storageBucket: "tmraditya-1ceb7.firebasestorage.app",
  messagingSenderId: "317037791388",
  appId: "1:317037791388:web:755b5a18bb77aa140a4559"
};
firebase.initializeApp(firebaseConfig);
var db = firebase.database();
var crCrownRef = db.ref("/live-graphics/cr/crownType");
var crownImg = document.querySelector(".cr-crown-col img");
crCrownRef.on("value", function(snap) {
  var t = snap.val() || "crown";
  if (crownImg) crownImg.src = "img/" + t + ".webp";
});
var crAlertCmdRef = db.ref("/live-graphics/cr/alertCmd");
var crAlertEl = document.getElementById("cr-going-alert");
var crOutTimer = null;
var willCrQueue = [];
var willCrCurrIdx = 0;
var willCrCycleTimer = null;
var willCrLogoImg = document.querySelector(".cr-ga-logo-panel img");

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

function willCrDoShow(tag) {
  if (willCrCycleTimer) { clearTimeout(willCrCycleTimer); willCrCycleTimer = null; }
  if (willCrLogoImg) {
    if (tag) { willCrLogoImg.style.display = ""; loadLogo(willCrLogoImg, tag); }
    else { willCrLogoImg.style.display = "none"; }
  }
  if (crOutTimer) { clearTimeout(crOutTimer); crOutTimer = null; }
  crAlertEl.classList.remove("cr-out", "cr-in");
  void crAlertEl.offsetWidth;
  crAlertEl.classList.add("cr-in");
  var showDur = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cr-show-duration')) * 1000 + 800;
  crOutTimer = setTimeout(function() {
    crAlertEl.classList.remove("cr-in");
    void crAlertEl.offsetWidth;
    crAlertEl.classList.add("cr-out");
    setTimeout(function() {
      crAlertEl.classList.remove("cr-out");
      if (tag && willCrShown.indexOf(tag) === -1) {
        willCrShown.push(tag);
        willCrShownRef.set(willCrShown);
      }
      willCrCurrIdx = willCrCurrIdx + 1;
      if (willCrCurrIdx < willCrQueue.length) {
        willCrCycleTimer = setTimeout(function() {
          willCrDoShow(willCrQueue[willCrCurrIdx]);
        }, 2000);
      }
    }, 450);
    crOutTimer = null;
  }, showDur);
}

crAlertCmdRef.on("value", function(snap) {
  var cmd = snap.val();
  if (cmd === "in") {
    var tag = willCrQueue.length > 0 ? willCrQueue[willCrCurrIdx % willCrQueue.length] : null;
    willCrDoShow(tag);
    crAlertCmdRef.set(null);
  }
});

var craMap = {
  'cra-alert-height': '--cr-alert-height',
  'cra-alert-bottom': '--cr-alert-bottom',
  'cra-crown-w': '--cr-crown-w',
  'cra-text-w': '--cr-text-w',
  'cra-logo-w': '--cr-logo-w',
  'cra-crown-size': '--cr-crown-size',
  'cra-title-size': '--cr-size-ga-title',
  'cra-ribbon-left': '--cr-ribbon-right',
  'cra-ribbon-h': '--cr-ribbon-h',
  'cra-ribbon-pad': '--cr-ribbon-pad',
  'cra-logo-size': '--cr-logo-size',
  'cra-show-duration': '--cr-show-duration'
};
db.ref("/live-graphics/editor/crAlert").on("value", function(snap) {
  var vals = snap.val();
  if (!vals) return;
  var root = document.documentElement;
  for (var key in vals) {
    if (craMap[key]) {
      var num = parseFloat(vals[key]);
      if (isFinite(num)) root.style.setProperty(craMap[key], num + (key === 'cra-show-duration' ? 's' : 'px'));
    }
  }
});

db.ref("/live-graphics/fonts/config").on("value", function(snap) {
  var cfg = snap.val();
  var root = document.documentElement;
  if (!cfg || !cfg.pages || !(cfg.pages.crAlert || cfg.pages.willCrActivates)) { root.style.removeProperty("--font-primary"); return; }
  if (!cfg.fontFamily || !cfg.fontFile) return;
  var s = document.createElement("style");
  s.id = "dyn-font-cra";
  s.textContent = "@font-face{font-family:'" + cfg.fontFamily + "';src:url('" + cfg.fontFile + "') format('" + cfg.fontFormat + "');}";
  var old = document.getElementById("dyn-font-cra");
  if (old) old.remove();
  document.head.appendChild(s);
  root.style.setProperty("--font-primary", cfg.fontFamily);
});

db.ref("/live-graphics/theme/crAlert").on("value", function(snap) {
  var t = snap.val();
  if (!t) return;
  var root = document.documentElement;
  function _h(v) { return typeof v === 'string' && v[0] === '#'; }
  if (_h(t.bodyBg))    root.style.setProperty("--cr-ga-body-bg", t.bodyBg);
  if (_h(t.ribbonBg))  root.style.setProperty("--cr-ga-ribbon-bg", t.ribbonBg);
  if (_h(t.ribbonTxt)) root.style.setProperty("--cr-ga-ribbon-txt", t.ribbonTxt);
  if (_h(t.mainTxt))   root.style.setProperty("--cr-ga-main-txt", t.mainTxt);
  if (_h(t.logoBg))    root.style.setProperty("--cr-logo-bg", t.logoBg);
});

var crRibbonRef = db.ref("/live-graphics/cr/ribbonText");
var crMainRef = db.ref("/live-graphics/cr/mainText");
var ribEl = document.querySelector(".cr-ga-ribbon-txt");
var mainEl = document.querySelector(".cr-ga-main-lbl");
crRibbonRef.on("value", function(snap) {
  var t = snap.val();
  if (t && ribEl) ribEl.textContent = t;
});
crMainRef.on("value", function(snap) {
  var t = snap.val();
  if (t && mainEl) mainEl.innerHTML = t;
});

var willCrShownRef = db.ref("/live-graphics/cr/shownTeams");
var willCrShown = [];
var willCrReady = false;
var champRushThreshold = 0;
var thresholdReady = false;
var teamsDataCache = null;

function checkChampRush() {
  if (!willCrReady || !thresholdReady || !teamsDataCache) return;
  Object.keys(teamsDataCache).forEach(function(tag) {
    var team = teamsDataCache[tag];
    var pts = Number(team["5_totalPoints"]) || 0;
    if (pts >= champRushThreshold) {
      if (willCrShown.indexOf(tag) === -1 && willCrQueue.indexOf(tag) === -1) {
        willCrQueue.push(tag);
        if (!crAlertEl.classList.contains("cr-in") && !willCrCycleTimer) {
          willCrCurrIdx = willCrQueue.length - 1;
          willCrDoShow(tag);
        }
      }
    }
  });
}

willCrShownRef.on("value", function(snap) {
  willCrShown = snap.val() || [];
  willCrReady = true;
  checkChampRush();
});

db.ref("/live-graphics/cr/shownTeamsReset").on("value", function(snap) {
  if (snap.val() == 1) {
    willCrShown = [];
    willCrShownRef.set([]);
    snap.ref.set(0);
  }
});

db.ref("/matches/0_championRushPoints").on("value", function(snap) {
  champRushThreshold = parseInt(snap.val()) || 80;
  thresholdReady = true;
  checkChampRush();
});

db.ref("/matches/2_teams").on("value", function(snap) {
  teamsDataCache = snap.val() || {};
  checkChampRush();
});
