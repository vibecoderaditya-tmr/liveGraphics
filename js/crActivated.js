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
var crActStateRef = db.ref("/live-graphics/crActivateTeams/state");
var crActDirRef = db.ref("/live-graphics/crActivateTeams/direction");
var wrap = document.querySelector(".cr-wrap");
var header = document.querySelector(".cr-hdr");
var rows = document.querySelectorAll(".cr-row");
var rowEls = Array.from(rows);
var allTargets = [header].concat(rowEls);
var animState = "out";
var animDirection = "left";
var _initialized = false;
var PAGE_SIZE = 3;
var teamsList = [];
var liveData = {};
var currentPage = 0;
var totalPages = 0;
var pageTimer = null;
var crCrownType = "crown";

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

function buildRowsForPage(page) {
  var container = document.querySelector(".cr-rows");
  container.innerHTML = "";
  var start = page * PAGE_SIZE;
  var end = Math.min(start + PAGE_SIZE, teamsList.length);
  for (var i = start; i < end; i++) {
    var team = teamsList[i];
    var row = document.createElement("div");
    row.className = "cr-row cr-row-act";
    row.innerHTML = '<div class="cr-row-bg"></div><div class="cr-crown"><div class="cr-crown-circle"><img src="img/' + crCrownType + '.webp" alt=""></div></div><div class="cr-logo"><img class="cr-team-img" src="" alt=""></div><span class="cr-name">' + team.tag + '</span><div class="cr-elim-overlay" style="display:none"></div>';
    container.appendChild(row);
  }
  rows = document.querySelectorAll(".cr-row");
  rowEls = Array.from(rows);
  allTargets = [header].concat(rowEls);
  var logos = container.querySelectorAll(".cr-team-img");
  for (var j = 0; j < logos.length; j++) {
    loadLogo(logos[j], teamsList[start + j].tag);
  }
  updateElimOverlays();
}

function updateElimOverlays() {
  var rows = document.querySelectorAll(".cr-row");
  rows.forEach(function(row) {
    var tagEl = row.querySelector(".cr-name");
    var tag = tagEl ? tagEl.textContent.trim() : "";
    var overlay = row.querySelector(".cr-elim-overlay");
    if (!overlay) return;
    var ld = liveData[tag];
    if (ld && (Number(ld["2_isTeamAlive"]) === 0 || (Number(ld["3_playersAlive"]) || 0) === 0)) {
      overlay.style.display = "flex";
    } else {
      overlay.style.display = "none";
    }
  });
}

function stopPageTimer() {
  if (pageTimer) { clearTimeout(pageTimer); pageTimer = null; }
}

function startPageTimer() {
  stopPageTimer();
  if (totalPages <= 1) return;
  pageTimer = setTimeout(function() {
    transitionToPage((currentPage + 1) % totalPages);
  }, 5000);
}

function transitionToPage(nextPage) {
  if (animState !== "in") return;
  stopPageTimer();
  var currentRows = rowEls.slice();
  var animDur = 500;
  var hideVal = "translateX(" + (animDirection === "right" ? "100%" : "-100%") + ")";
  currentRows.forEach(function(el, i) {
    var idx = currentRows.length - 1 - i;
    setTimeout(function() {
      el.style.transition = "transform " + animDur + "ms cubic-bezier(0.55,0.06,0.68,0.53), opacity " + animDur + "ms ease";
      el.style.transform = hideVal;
      el.style.opacity = "0";
    }, i * 60);
  });
  var exitDelay = currentRows.length * 60 + animDur + 100;
  setTimeout(function() {
    currentPage = nextPage;
    var hideCls = hideClassFor(animDirection);
    buildRowsForPage(currentPage);
    var newRows = document.querySelectorAll(".cr-row");
    var newRowEls = Array.from(newRows);
    newRowEls.forEach(function(el) {
      el.style.transition = "none";
      el.classList.add(hideCls);
    });
    void header.offsetHeight;
    newRowEls.forEach(function(el) {
      el.style.transition = "";
    });
    newRowEls.forEach(function(el, i) {
      setTimeout(function() {
        el.classList.add("trans-anim");
        el.classList.remove(hideCls);
        el.classList.add("anim-in");
      }, 80 + i * 60);
    });
    setTimeout(function() {
      startPageTimer();
    }, 80 + newRowEls.length * 60 + 550);
  }, exitDelay);
}

function hideClassFor(dir) {
  return dir === "right" ? "anim-hide-right" : "anim-hide-left";
}

function resetAnim() {
  allTargets.forEach(function(el) {
    el.classList.remove("anim-hide-left", "anim-hide-right", "anim-in", "trans-anim", "trans-anim-out");
    el.style.transition = "";
    el.style.transform = "";
    el.style.opacity = "";
  });
}

function applyAnim() {
  var hideCls = hideClassFor(animDirection);
  wrap.classList.toggle("dir-right", animDirection === "right");

  if (animState === "in") {
    stopPageTimer();
    resetAnim();
    _initialized = true;
    if (teamsList.length === 0) { document.querySelector(".cr-rows").innerHTML = ""; rowEls = []; allTargets = [header]; return; }
    currentPage = 0;
    buildRowsForPage(0);
    allTargets.forEach(function(el) { el.style.display = ""; el.style.transition = "none"; el.classList.add(hideCls); });
    void header.offsetHeight;
    allTargets.forEach(function(el) { el.style.transition = ""; });
    header.classList.add("trans-anim");
    header.classList.remove(hideCls);
    header.classList.add("anim-in");
    rowEls.forEach(function(rowEl, i) {
      setTimeout(function() {
        rowEl.classList.add("trans-anim");
        rowEl.classList.remove(hideCls);
        rowEl.classList.add("anim-in");
      }, 80 + i * 60);
    });
    setTimeout(function() {
      startPageTimer();
    }, 80 + rowEls.length * 60 + 550);
  } else {
    stopPageTimer();
    if (!_initialized) { _initialized = true; allTargets.forEach(function(el) { el.classList.add(hideCls); }); return; }
    var animDur = 500;
    var hideX = animDirection === "right" ? "100%" : "-100%";
    var hideVal = "translateX(" + hideX + ")";
    rowEls.forEach(function(rowEl, i) {
      var idx = rowEls.length - 1 - i;
      setTimeout(function() {
        var el = rowEls[idx];
        el.style.transition = "transform " + animDur + "ms cubic-bezier(0.55,0.06,0.68,0.53), opacity " + animDur + "ms ease";
        el.style.transform = hideVal;
        el.style.opacity = "0";
      }, i * 60);
    });
    setTimeout(function() {
      header.style.transition = "transform " + animDur + "ms cubic-bezier(0.55,0.06,0.68,0.53), opacity " + animDur + "ms ease";
      header.style.transform = hideVal;
      header.style.opacity = "0";
    }, rowEls.length * 60 + 80);
    setTimeout(function() {
      allTargets.forEach(function(el) {
        el.style.transition = "";
        el.style.transform = "";
        el.style.opacity = "";
        el.classList.remove("anim-in");
      });
      header.style.display = "none";
      rowEls.forEach(function(w) { w.style.display = "none"; });
    }, rowEls.length * 60 + 80 + animDur + 100);
  }
}

crActStateRef.on("value", function(snap) {
  animState = (snap.val() || "out").toLowerCase();
  applyAnim();
});

crActDirRef.on("value", function(snap) {
  var val = (snap.val() || "left").toLowerCase().trim();
  animDirection = val === "right" ? "right" : "left";
  wrap.classList.toggle("dir-right", animDirection === "right");
  if (animState === "in") applyAnim();
});

var prevActTags = "";
db.ref("/matches/2_teams").on("value", function(snap) {
  var data = snap.val() || {};
  var newList = [];
  Object.keys(data).forEach(function(key) {
    var team = data[key];
    if (team && team.isCrActivated == 1) {
      newList.push({ tag: key });
    }
  });
  var tagStr = newList.map(function(t) { return t.tag; }).join(",");
  if (tagStr === prevActTags) return;
  prevActTags = tagStr;
  teamsList = newList;
  totalPages = teamsList.length > 0 ? Math.ceil(teamsList.length / PAGE_SIZE) : 0;
  applyAnim();
});

db.ref("/matches/live").on("value", function(snap) {
  liveData = snap.val() || {};
  updateElimOverlays();
});

db.ref("/live-graphics/crActivateTeams/crownType").on("value", function(snap) {
  crCrownType = snap.val() || "crown";
  document.querySelectorAll(".cr-crown-circle img").forEach(function(img) {
    img.src = "img/" + crCrownType + ".webp";
  });
});

var cractEdMap = {
  'cract-hdr-w': '--cr-hdr-w',
  'cract-hdr-h': '--cr-hdr-h',
  'cract-hdr-txt-w': '--cr-hdr-txt-w',
  'cract-hdr-txt-x': '--cr-hdr-txt-x',
  'cract-row-w': '--cr-row-w',
  'cract-row-h': '--cr-row-h',
  'cract-name-x': '--cr-name-x',
  'cract-crown-w': '--cr-crown-w',
  'cract-crown-x': '--cr-crown-x',
  'cract-crown-img': '--cr-row-crown-img',
  'cract-logo-w': '--cr-logo-w',
  'cract-logo-h': '--cr-logo-h',
  'cract-logo-x': '--cr-logo-x',
  'cract-logo-size': '--cr-team-logo',
  'cract-title-size': '--cr-size-title',
  'cract-team-size': '--cr-size-team',
  'cract-wrap-y': '--cr-wrap-y'
};
db.ref("/live-graphics/editor/crActivatedTeams").on("value", function(snap) {
  var vals = snap.val();
  if (!vals) return;
  var root = document.documentElement;
  for (var key in vals) {
    if (cractEdMap[key]) {
      var num = parseFloat(vals[key]);
      if (isFinite(num)) root.style.setProperty(cractEdMap[key], num + 'px');
    }
  }
});

db.ref("/live-graphics/theme/crActivatedTeams").on("value", function(snap) {
  var t = snap.val();
  if (!t) return;
  var root = document.documentElement;
  function _h(v) { return typeof v === 'string' && v[0] === '#'; }
  if (_h(t.hdrBg))    root.style.setProperty("--cr-hdr-bg", t.hdrBg);
  if (_h(t.hdrTxt))   root.style.setProperty("--cr-hdr-txt", t.hdrTxt);
  if (_h(t.rowBgAct)) root.style.setProperty("--cr-row-bg-act", t.rowBgAct);
  if (_h(t.rowTxt))   root.style.setProperty("--cr-row-txt", t.rowTxt);
  if (_h(t.logoBg))   root.style.setProperty("--cr-logo-bg", t.logoBg);
});

db.ref("/live-graphics/fonts/config").on("value", function(snap) {
  var cfg = snap.val();
  var root = document.documentElement;
  if (!cfg || !cfg.pages || !cfg.pages.crActivatedTeams) { root.style.removeProperty("--font-primary"); return; }
  if (!cfg.fontFamily || !cfg.fontFile) return;
  var s = document.createElement("style");
  s.id = "dyn-font-cract";
  s.textContent = "@font-face{font-family:'" + cfg.fontFamily + "';src:url('" + cfg.fontFile + "') format('" + cfg.fontFormat + "');}";
  var old = document.getElementById("dyn-font-cract");
  if (old) old.remove();
  document.head.appendChild(s);
  root.style.setProperty("--font-primary", cfg.fontFamily);
});
