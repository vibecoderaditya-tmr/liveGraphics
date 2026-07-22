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

var _pool = [];
var _index = -1;
var _booyahData = null;
var _lastMatchKey = null;

function shuffleArray(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  return arr;
}

function loadLogo(imgEl, tag) {
  var s = String(tag).trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g, "");
  imgEl.onerror = function() { imgEl.style.display = "none"; };
  imgEl.src = "img/logos/" + s + ".webp";
}

function setBooyahImage() {
  if (_pool.length === 0) return;
  document.getElementById("bt-img").src = "img/booyah/" + _pool[_index] + ".webp";
}

function advanceImage() {
  _index++;
  if (_index >= _pool.length) {
    shuffleArray(_pool);
    _index = 0;
  }
  db.ref("/live-graphics/booyahTeam/imageState").set({ pool: _pool, index: _index });
  setBooyahImage();
}

function renderBooyah() {
  if (!_booyahData) return;
  var tag = _booyahData.tag || "";
  var name = _booyahData.team || _booyahData.teamName || tag;
  var logo = document.getElementById("bt-logo");
  logo.style.display = "";
  loadLogo(logo, tag);
  document.getElementById("bt-name").textContent = name;
}

db.ref("/live-graphics/booyahTeam/imageState").once("value", function(snap) {
  var state = snap.val();
  if (state && state.pool && state.pool.length > 0 && state.index != null) {
    _pool = state.pool;
    _index = state.index;
  } else {
    _pool = ["1","2","3","4","5","6","7","8","9","10","11","12","13","14"];
    shuffleArray(_pool);
    _index = 0;
    db.ref("/live-graphics/booyahTeam/imageState").set({ pool: _pool, index: _index });
  }
  setBooyahImage();
});

db.ref("/matches").on("value", function(snap) {
  var data = snap.val();
  if (!data) return;
  var highestNum = 0, matchKey = "";
  for (var key in data) {
    var m = key.match(/^match(\d+)$/);
    if (m) { var n = parseInt(m[1], 10); if (n > highestNum) { highestNum = n; matchKey = key; } }
  }
  if (matchKey && data[matchKey] && data[matchKey]["4_BOOYAH"]) {
    _booyahData = data[matchKey]["4_BOOYAH"];
    if (matchKey !== _lastMatchKey) {
      _lastMatchKey = matchKey;
      advanceImage();
    }
    renderBooyah();
  }
});

// db.ref("/live-graphics/booyahTeam").on("value", function(snap) {
//   var val = snap.val();
//   if (val === "show" && _booyahData) {
//     renderBooyah();
//     document.getElementById("bt-wrap").style.display = "flex";
//   } else if (val === "hide") {
//     document.getElementById("bt-wrap").style.display = "none";
//   }
// });

db.ref("/live-graphics/theme/booyahTeam").on("value", function(snap) {
  var t = snap.val();
  if (!t) return;
  var root = document.documentElement;
  function _h(v) { return typeof v === "string" && v[0] === "#"; }
  if (_h(t.text)) root.style.setProperty("--bt-text", t.text);
});

db.ref("/live-graphics/editor/booyahTeam").on("value", function(snap) {
  var vals = snap.val();
  if (!vals) return;
  var root = document.documentElement;
  for (var key in vals) {
    var num = parseFloat(vals[key]);
    if (isFinite(num)) root.style.setProperty("--" + key, num + "px");
  }
});

function resetAnimation() {
  document.getElementById("bt-wrap").classList.remove("show");
}

function startAnimation() {
  document.getElementById("bt-wrap").classList.add("show");
}

db.ref("/live-graphics/booyahTeam").on("value", function(snap) {
  var val = snap.val();
  var wrap = document.getElementById("bt-wrap");
  if (val === "show" && _booyahData) {
    renderBooyah();
    wrap.classList.remove("show");
    void wrap.offsetWidth;
    wrap.classList.add("show");
  } else if (val === "hide") {
    wrap.classList.remove("show");
  }
});
