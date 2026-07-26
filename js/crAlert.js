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

crAlertCmdRef.on("value", function(snap) {
  var cmd = snap.val();
  if (cmd === "in") {
    if (crOutTimer) { clearTimeout(crOutTimer); crOutTimer = null; }
    crAlertEl.classList.remove("cr-out", "cr-in");
    void crAlertEl.offsetWidth;
    crAlertEl.classList.add("cr-in");
    crOutTimer = setTimeout(function() {
      crAlertEl.classList.remove("cr-in");
      void crAlertEl.offsetWidth;
      crAlertEl.classList.add("cr-out");
      setTimeout(function() { crAlertEl.classList.remove("cr-out"); }, 450);
      crOutTimer = null;
    }, parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cr-show-duration')) * 1000 + 800);
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
  if (!cfg || !cfg.pages || !cfg.pages.crAlert) { root.style.removeProperty("--font-primary"); return; }
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
