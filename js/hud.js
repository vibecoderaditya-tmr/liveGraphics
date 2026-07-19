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

let liveData = {};

var _charPool = ["cityheroboy","bounty","blacksmith","yakuza","auroraboy","xtreme","villain","tracker","superteen","superstar","professor","musicbro1","monkeygod","mademana","graffitist","geek","electricgirl","dreamlandboy","djmale_awakening","djmale","detective","designer","crazygirl"];
var _charIndex = -1;

function shuffleArray(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  return arr;
}

function nextCharacter() {
  _charIndex++;
  if (_charIndex >= _charPool.length) {
    shuffleArray(_charPool);
    _charIndex = 0;
  }
  document.getElementById("hud-char-img").src = "img/characters/" + _charPool[_charIndex] + ".webp";
}

shuffleArray(_charPool);
_charIndex = 0;
document.getElementById("hud-char-img").src = "img/characters/" + _charPool[0] + ".webp";

document.documentElement.style.setProperty("--hud-left-top", "635px");
document.documentElement.style.setProperty("--hud-right-top", "0px");

db.ref("/live-graphics/editor/hud").on("value", function(snap) {
  var vals = snap.val();
  if (!vals) return;
  var root = document.documentElement;
  for (var key in vals) {
    var num = parseFloat(vals[key]);
    if (isFinite(num)) root.style.setProperty("--" + key, num + "px");
  }
});

db.ref("/live-graphics/theme/hud").on("value", function(snap) {
  var t = snap.val();
  if (!t) return;
  var root = document.documentElement;
  function _h(v) { return typeof v === 'string' && v[0] === '#'; }
  if (_h(t.charBg))      root.style.setProperty("--hud-char-bg", t.charBg);
  if (_h(t.playerBg))    root.style.setProperty("--hud-player-bg", t.playerBg);
  if (_h(t.nameBg))      root.style.setProperty("--hud-name-bg", t.nameBg);
  if (_h(t.leftText))    root.style.setProperty("--hud-left-text", t.leftText);
  if (_h(t.leftBorder))  root.style.setProperty("--hud-left-border", t.leftBorder);
  if (_h(t.rightBg))     root.style.setProperty("--hud-right-bg", t.rightBg);
  if (_h(t.rightText))   root.style.setProperty("--hud-right-text", t.rightText);
  if (_h(t.rightBorder)) root.style.setProperty("--hud-right-border", t.rightBorder);
});

db.ref("/live-graphics/hud-align").on("value", function(snap) {
  var align = snap.val() || "left";
  document.getElementById("hud-left").classList.toggle("align-right", align === "right");
});

function renderHud() {
  if (liveData["3_status"] === "idle") {
    document.getElementById("hud-teams").textContent = 12;
    document.getElementById("hud-players").textContent = 48;
    return;
  }

  var tc = liveData["98_teamCount"];
  document.getElementById("hud-teams").textContent = tc != null ? Number(tc) : 12;

  var pc = liveData["99_playerCount"];
  document.getElementById("hud-players").textContent = pc != null ? Number(pc) : 48;
}

const isFileProtocol = location.protocol === "file:";
function fileRelativeDir() {
  const p = location.pathname;
  return p.substring(0, p.lastIndexOf("/") + 1);
}
const LOGO_BASE = isFileProtocol ? `${fileRelativeDir()}img/logos/` : "/img/logos/";
const LOGO_EXT  = ".webp";

function buildCaseVariants(name) {
  const clean = String(name).trim().replace(/[^a-zA-Z0-9_-]/g, "");
  const lower = clean.toLowerCase();
  const upper = clean.toUpperCase();
  const capitalized = lower.charAt(0).toUpperCase() + lower.slice(1);
  return [...new Set([lower, upper, capitalized])];
}

function loadLogo(imgEl, tag) {
  const variants = buildCaseVariants(tag);
  let attempt = 0;
  function tryNext() {
    if (attempt >= variants.length) {
      imgEl.style.display = "none";
      imgEl.onerror = null;
      return;
    }
    imgEl.src = LOGO_BASE + variants[attempt] + LOGO_EXT;
    attempt++;
    imgEl.onerror = tryNext;
  }
  tryNext();
}

// ── Achievement state ──
var _firstBloodShown = true;
var _pageInitialized = false;
var _killStreak = {};
var _cleanSweep = {};
var _achieveTimer = null;
var ACHIEVE_MS = 5000;
var MULTI_KILL_MS = 10000;
var _killCounts = {};
var _topKillCount = 0;
var _topKiller = null;
var _achieveQueue = [];
var _achieveShowing = false;

function _showAchievementDirect(name, tag, text) {
  clearTimeout(_achieveTimer);
  var box = document.getElementById("hud-left");
  var logo = document.getElementById("hud-player-logo");
  logo.style.display = "";
  loadLogo(logo, tag);
  document.getElementById("hud-ach-player").textContent = name;
  document.getElementById("hud-ach-name").textContent = text;
  box.classList.remove("show");
  void box.offsetWidth;
  box.classList.add("show");
  _achieveTimer = setTimeout(clearAchievement, ACHIEVE_MS);
  nextCharacter();
}

function showAchievement(name, tag, text) {
  if (_achieveShowing) {
    _achieveQueue.push({ name: name, tag: tag, text: text });
    return;
  }
  _achieveShowing = true;
  _showAchievementDirect(name, tag, text);
}

function clearAchievement() {
  var box = document.getElementById("hud-left");
  box.classList.remove("show");
  setTimeout(function() {
    document.getElementById("hud-player-logo").src = "";
    document.getElementById("hud-ach-player").textContent = "";
    document.getElementById("hud-ach-name").textContent = "";
    if (_achieveQueue.length > 0) {
      var next = _achieveQueue.shift();
      _showAchievementDirect(next.name, next.tag, next.text);
    } else {
      _achieveShowing = false;
    }
  }, 400);
}

function resetAchievements() {
  _firstBloodShown = false;
  for (var k in _killStreak) {
    clearTimeout(_killStreak[k].timer);
  }
  _killStreak = {};
  _cleanSweep = {};
  _killCounts = {};
  _topKillCount = 0;
  _topKiller = null;
  _achieveQueue = [];
  _achieveShowing = false;
  clearTimeout(_achieveTimer);
  clearAchievement();
}

function showKillStreak(key) {
  var data = _killStreak[key];
  if (!data || data.count < 2) {
    delete _killStreak[key];
    return;
  }
  var parts = key.split("|");
  var tier = data.count >= 5 ? "MANIAC"
           : data.count === 4 ? "QUADRA KILL"
           : data.count === 3 ? "TRIPLE KILL"
           : "DOUBLE KILL";
  delete _killStreak[key];
  showAchievement(parts[0], parts[1], tier);
}

function checkAchievements(entry) {
  if (entry.type !== "kill") return;

  // First Blood
  if (!_firstBloodShown) {
    _firstBloodShown = true;
    showAchievement(entry.killer, entry.killerTeam, "FIRST BLOOD");
  }

  // Multi-kill streak
  var sk = entry.killer + "|" + entry.killerTeam;
  if (!_killStreak[sk]) {
    _killStreak[sk] = { count: 1, timer: null };
  } else {
    _killStreak[sk].count++;
  }
  clearTimeout(_killStreak[sk].timer);
  _killStreak[sk].timer = setTimeout(showKillStreak, MULTI_KILL_MS, sk);

  // Clean Sweep
  if (!_cleanSweep[sk]) _cleanSweep[sk] = {};
  if (!_cleanSweep[sk][entry.victimTeam]) _cleanSweep[sk][entry.victimTeam] = {};
  if (!_cleanSweep[sk][entry.victimTeam][entry.victim]) {
    _cleanSweep[sk][entry.victimTeam][entry.victim] = true;
    var count = 0;
    for (var v in _cleanSweep[sk][entry.victimTeam]) count++;
    if (count >= 4) {
      showAchievement(entry.killer, entry.killerTeam, "CLEAN SWEEP");
    }
  }

  // KILL LEADER
  var klKey = entry.killer + "|" + entry.killerTeam;
  if (!_killCounts[klKey]) _killCounts[klKey] = 0;
  _killCounts[klKey]++;

  var newCount = _killCounts[klKey];
  if (newCount >= 5) {
    if (klKey !== _topKiller && newCount > _topKillCount) {
      _topKillCount = newCount;
      _topKiller = klKey;
      showAchievement(entry.killer, entry.killerTeam, "KILL LEADER");
    }
    else if (klKey === _topKiller && newCount % 5 === 0) {
      _topKillCount = newCount;
      showAchievement(entry.killer, entry.killerTeam, "KILL LEADER");
    }
  }
}

var killfeedQueue = [];
var fadeCheckInterval = null;

db.ref("/matches/live").on("value", snap => {
  var prev = liveData["3_status"];
  liveData = snap.val() || {};
  if (_pageInitialized && prev !== "running" && liveData["3_status"] === "running") {
    resetAchievements();
  }
  _pageInitialized = true;
  renderHud();
});

// hide all rows initially
renderKillfeed();

// Phase 1: load last 4 existing entries and set up streaming for new ones
db.ref("/matches/live/killfeed").orderByKey().limitToLast(4).once("value", function(snap) {
  var data = snap.val();
  killfeedQueue.length = 0;
  var lastKey = null;
  if (data) {
    var keys = Object.keys(data).sort();
    lastKey = keys[keys.length - 1];
    for (var i = keys.length - 1; i >= 0; i--) {
      var key = keys[i];
      var entry = data[key];
      entry._key = key;
      entry._fading = false;
      entry._time = Date.now();
      killfeedQueue.push(entry);
    }
  }
  renderKillfeed();
  if (killfeedQueue.length > 0) startFadeChecker();

  // Phase 2: stream entries AFTER the last loaded key (new entries only)
  var _initialSyncDone = !lastKey;
  var ref = lastKey
    ? db.ref("/matches/live/killfeed").orderByKey().startAt(lastKey)
    : db.ref("/matches/live/killfeed");

  ref.on("child_added", function(snap) {
    var entry = snap.val();
    if (!entry) return;
    entry._key = snap.key;

    // skip the entry matching lastKey (already loaded in Phase 1)
    if (lastKey && snap.key === lastKey) {
      _initialSyncDone = true;
      return;
    }

    if (!_initialSyncDone) return;

    // dedup against queue
    for (var i = 0; i < killfeedQueue.length; i++) {
      if (killfeedQueue[i]._key === entry._key) return;
    }

    entry._fading = false;
    entry._time = Date.now();

    if (killfeedQueue.length === 4) {
      var old = killfeedQueue[3];
      if (!old._fading) {
        old._fading = true;
        old._time = Date.now();
      }
    }

    killfeedQueue.unshift(entry);
    if (killfeedQueue.length > 4) killfeedQueue.length = 4;
    renderKillfeed();
    if (!fadeCheckInterval) startFadeChecker();
    checkAchievements(entry);
  });
});

// Phase 3: clean up when entries are removed (match reset)
db.ref("/matches/live/killfeed").on("child_removed", function(snap) {
  var key = snap.key;
  for (var i = 0; i < killfeedQueue.length; i++) {
    if (killfeedQueue[i]._key === key) {
      killfeedQueue.splice(i, 1);
      renderKillfeed();
      break;
    }
  }
});

function renderKillfeed() {
  for (var i = 0; i < 4; i++) {
    var row = document.getElementById("hud-rb-" + (i + 1));
    if (i < killfeedQueue.length) {
      var entry = killfeedQueue[i];
      var imgs = row.querySelectorAll(".rb-logo");
      var names = row.querySelectorAll(".rb-name");

      row.style.display = "flex";
      row.style.top = (i * 39) + "px";

      if (entry._fading) {
        row.classList.add("fading");
      } else {
        row.classList.remove("fading");
        row.style.opacity = "1";
      }

      if (entry.type === "revive") {
        imgs[0].style.display = "block";
        imgs[0].src = "img/revive.webp";
        imgs[0].style.width = "20px";
        imgs[0].style.height = "20px";
        names[0].textContent = entry.subject;
        names[0].style.display = "block";
        names[0].style.color = "lime";
        imgs[1].style.display = "none";
        names[1].style.display = "none";
        imgs[2].style.display = "block";
        imgs[2].style.width = "24px";
        imgs[2].style.height = "24px";
        loadLogo(imgs[2], entry.subjectTeam);
      } else {
        imgs[0].style.display = "block";
        imgs[0].style.width = "24px";
        imgs[0].style.height = "24px";
        loadLogo(imgs[0], entry.killerTeam);
        names[0].textContent = entry.killer;
        names[0].style.display = "block";
        names[0].style.color = "";
        imgs[1].style.display = "block";
        imgs[1].src = entry.type === "knock" ? "img/knock.webp" : "img/kill.webp";
        imgs[1].style.width = "24px";
        imgs[1].style.height = "24px";
        names[1].textContent = entry.victim;
        names[1].style.display = "block";
        names[1].style.color = entry.type === "kill" ? "red" : "";
        imgs[2].style.display = "block";
        imgs[2].style.width = "24px";
        imgs[2].style.height = "24px";
        loadLogo(imgs[2], entry.victimTeam);
      }
    } else {
      row.style.display = "none";
    }
  }
}

function startFadeChecker() {
  if (fadeCheckInterval) return;
  fadeCheckInterval = setInterval(function() {
    if (killfeedQueue.length === 0) return;

    var now = Date.now();
    var oldest = killfeedQueue[killfeedQueue.length - 1];

    // fallback: when fewer than 4 entries, fade oldest after 2s
    if (!oldest._fading && now - oldest._time >= 2000) {
      oldest._fading = true;
      oldest._time = Date.now();
      var row = document.getElementById("hud-rb-" + killfeedQueue.length);
      row.classList.add("fading");
    }

    if (oldest._fading && now - oldest._time >= 1500) {
      killfeedQueue.pop();
      renderKillfeed();
    }
  }, 500);
}

