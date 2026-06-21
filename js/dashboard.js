var firebaseConfig = {
  apiKey:            "AIzaSyC21mdsgyIEqXT7ujFbi0xcVAMRZxxqB1I",
  authDomain:        "tmraditya-1ceb7.firebaseapp.com",
  databaseURL:       "https://tmraditya-1ceb7-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "tmraditya-1ceb7",
  storageBucket:     "tmraditya-1ceb7.firebasestorage.app",
  messagingSenderId: "317037791388",
  appId:             "1:317037791388:web:755b5a18bb77aa140a4559"
};

var OPERATOR_PIN = "6558";

firebase.initializeApp(firebaseConfig);
var db = firebase.database();

var authenticated = false;
var currentPromptId = null;
var currentReplyRef = null;
var awaitingInput = false;

function addLog(text, type) {
  type = type || "bot";
  if (type === "bot" && (text.startsWith("\u{1F480}") || text.startsWith("\u{1F947}"))) {
    type = "event";
  }
  var lb   = document.getElementById("log-box");
  var wrap = document.createElement("div");
  wrap.className = "log-entry log-" + type;
  var time = new Date().toLocaleTimeString("en-IN", {hour:"2-digit", minute:"2-digit"});
  wrap.innerHTML =
    '<span class="log-time">' + time + '</span>' +
    '<span class="log-text">' + escHtml(text) + '</span>';
  lb.appendChild(wrap);
  lb.scrollTop = lb.scrollHeight;
}

function addHtml(html) {
  var lb   = document.getElementById("log-box");
  var wrap = document.createElement("div");
  wrap.className = "log-entry log-bot";
  var time = new Date().toLocaleTimeString("en-IN", {hour:"2-digit", minute:"2-digit"});
  wrap.innerHTML =
    '<span class="log-time">' + time + '</span>' +
    '<span class="log-text">' + html + '</span>';
  lb.appendChild(wrap);
  lb.scrollTop = lb.scrollHeight;
}

function escHtml(s) {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
          .replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>")
          .replace(/`(.+?)`/g,"<code>$1</code>");
}

function setStatus(online) {
  document.getElementById("status-dot").className = "dot " + (online ? "online" : "offline");
  document.getElementById("status-txt").textContent = online ? "LIVE" : "STANDBY";
}

function setInputState(active) {
  awaitingInput = active;
  var f = document.getElementById("op-input");
  var b = document.getElementById("send-btn");
  f.disabled    = !active;
  b.disabled    = !active;
  f.placeholder = active ? "Type reply\u2026" : "Waiting for prompt\u2026";
  if (active) setTimeout(function(){ f.focus(); }, 50);
}

function stripMd(s) {
  return s.replace(/\*\*(.+?)\*\*/g,"$1")
          .replace(/`(.+?)`/g,"$1")
          .replace(/```[\s\S]*?```/g,function(m){ return m.replace(/```/g,""); })
          .trim();
}

function checkPin() {
  var val = document.getElementById("pin-input").value;
  if (val === OPERATOR_PIN) {
    authenticated = true;
    var ps = document.getElementById("pin-screen");
    ps.style.opacity = "0";
    setTimeout(function(){
      ps.style.display = "none";
      var ms = document.getElementById("main-screen");
      ms.style.display = "flex";
      setTimeout(function(){ ms.style.opacity = "1"; }, 20);
    }, 350);
    startListeners();
    addLog("Panel connected \u2014 waiting for TMR tracker.", "sys");
  } else {
    var err = document.getElementById("pin-error");
    err.textContent = "incorrect pin";
    var inp = document.getElementById("pin-input");
    inp.value = "";
    inp.classList.add("shake");
    setTimeout(function(){ inp.classList.remove("shake"); }, 500);
  }
}

function pinKeydown(e)   { if (e.key === "Enter") checkPin(); }
function inputKeydown(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendReply();
  }
}

function autoResizeInput() {
  var ta = document.getElementById("op-input");
  if (!ta) return;
  ta.style.height = "auto";
  ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
}

window.addEventListener("load", function() {
  var ta = document.getElementById("op-input");
  if (ta) ta.addEventListener("input", autoResizeInput);
});

function sendReply() {
  if (!currentPromptId) return;
  var val = document.getElementById("op-input").value.trim();
  if (!val) return;
  var ta = document.getElementById("op-input");
  ta.value = "";
  ta.style.height = "auto";
  setInputState(false);
  document.getElementById("prompt-box").style.display = "none";
  addLog(val, "opr");
  db.ref("session/replies/" + currentPromptId).push({
    text: val,
    ts: firebase.database.ServerValue.TIMESTAMP
  });
}

function startListeners() {
  db.ref("/session/clear").on("value", function(snap) {
    if (snap.val() === true) {
      document.getElementById("log-box").innerHTML = "";
      document.getElementById("prompt-box").style.display = "none";
      setInputState(false);
      setStatus(false);
      addLog("Panel cleared \u2014 new TMR session started.", "sys");
    }
  });

  db.ref("/session/messages").limitToLast(100).on("child_added", function(snap) {
    var val = snap.val();
    if (!val) return;
    setStatus(true);
    if (val.type === "html" && val.html) {
      addHtml(val.html);
    } else if (val.text) {
      addLog(val.text, "bot");
    }
  });

  db.ref("/session/input_request").on("value", function(snap) {
    var val = snap.val();
    if (!val) return;
    var newPromptId = val.prompt_id;
    if (!newPromptId || newPromptId === currentPromptId) return;
    currentPromptId = newPromptId;
    if (currentReplyRef) {
      currentReplyRef.off();
    }
    addLog(val.prompt, "bot");
    var pb = document.getElementById("prompt-box");
    pb.textContent = stripMd(val.prompt);
    pb.style.display = "block";
    setInputState(true);
    setStatus(true);
    currentReplyRef = db.ref("session/replies/" + currentPromptId);
    currentReplyRef.limitToLast(20).on("child_added", function(replySnap) {
      var rv = replySnap.val();
      if (rv && rv.text) {
        addLog(rv.text, "opr");
      }
    });
  });
}

var panelOpen = true;

function togglePanel() {
  var panel    = document.getElementById("left-panel");
  var isMobile = window.innerWidth <= 480;

  if (isMobile) {
    panelOpen = !panelOpen;
    if (panelOpen) {
      panel.classList.remove("collapsed");
      panel.classList.add("mobile-open");
    } else {
      panel.classList.remove("mobile-open");
      panel.classList.add("collapsed");
    }
  } else {
    panelOpen = !panelOpen;
    if (panelOpen) {
      panel.classList.remove("collapsed");
    } else {
      panel.classList.add("collapsed");
    }
  }
}

window.addEventListener("load", function() {
  if (window.innerWidth <= 480) {
    var panel = document.getElementById("left-panel");
    if (panel) {
      panel.classList.add("collapsed");
      panel.classList.remove("mobile-open");
      panelOpen = false;
    }
  }
});

window.addEventListener("resize", function() {
  var panel = document.getElementById("left-panel");
  if (!panel) return;
  if (window.innerWidth <= 480 && panelOpen) {
    panel.classList.remove("mobile-open");
    panel.classList.add("collapsed");
    panelOpen = false;
  }
});

var opInput = document.getElementById ? document.getElementById("op-input") : null;
if (opInput) {
  opInput.addEventListener("focus", function() {
    setTimeout(function() {
      var lb = document.getElementById("log-box");
      if (lb) lb.scrollTop = lb.scrollHeight;
    }, 300);
  });
}

var forceRosterRef = db.ref("/session/force_roster");
var joinCountRef   = db.ref("/session/join_count");

function forceRoster() {
  var btn = document.getElementById("btn-force-roster");
  var st  = document.getElementById("force-roster-status");
  if (btn.disabled) return;
  btn.disabled = true;
  forceRosterRef.set(true);
  st.textContent = "sent \u2014 waiting\u2026";
  st.style.color = "var(--text-mid)";
  setTimeout(function() { st.textContent = ""; }, 5000);
}
window.forceRoster = forceRoster;

var liveRef = db.ref("/matches/live");

liveRef.on("value", function(snap) {
  var val = snap.val();
  var panel = document.getElementById("winrate-panel");
  var body  = document.getElementById("winrate-body");
  if (!panel || !body) return;

  var placeholder = '<div class="wr-placeholder">Active when<br>\u2264 4 teams remain</div>';

  if (!val || val["3_status"] !== "running") {
    body.innerHTML = placeholder;
    return;
  }

  var teams = [];
  Object.keys(val).forEach(function(key) {
    var node = val[key];
    if (typeof node !== "object" || node === null) return;
    if (!node["winRate"] || !node["1_teamTag"]) return;
    var pct = parseFloat(node["winRate"]);
    if (isNaN(pct) || pct <= 0) return;
    teams.push({
      tag:      node["1_teamTag"],
      name:     node["4_teamName"] || node["1_teamTag"],
      winRate:  pct,
      alive:    node["3_playersAlive"] || 0,
      kills:    node["5_totalKills"]   || 0,
    });
  });

  if (teams.length === 0) {
    body.innerHTML = placeholder;
    return;
  }

  teams.sort(function(a, b) { return b.winRate - a.winRate; });

  body.innerHTML = "";

  teams.forEach(function(t, i) {
    var row = document.createElement("div");
    row.className = "wr-row" + (i === 0 ? " wr-top" : "");

    var pct = Math.round(t.winRate);
    var barW = Math.max(4, pct);

    row.innerHTML =
      '<div class="wr-meta">' +
        '<span class="wr-tag">[' + escHtml(t.tag) + ']</span>' +
        '<span class="wr-name">' + escHtml(t.name) + '</span>' +
        '<span class="wr-stats">' + t.alive + '\u25b2 ' + t.kills + 'K</span>' +
      '</div>' +
      '<div class="wr-bar-wrap">' +
        '<div class="wr-bar" style="width:' + barW + '%"></div>' +
        '<span class="wr-pct">' + pct + '%</span>' +
      '</div>';

    body.appendChild(row);
  });
});

joinCountRef.on("value", function(snap) {
  var n      = snap.val();
  var btn    = document.getElementById("btn-force-roster");
  var ctr    = document.getElementById("join-counter");
  var ctrVal = document.getElementById("join-count-val");
  var st     = document.getElementById("force-roster-status");
  if (n !== null && n !== undefined) {
    ctrVal.textContent    = n;
    ctr.style.display     = "block";
    btn.disabled          = false;
    btn.style.borderColor = "var(--c3)";
    btn.style.color       = "var(--text-hi)";
    st.textContent        = "";
  } else {
    ctr.style.display     = "none";
    btn.disabled          = true;
    btn.style.borderColor = "var(--border)";
    btn.style.color       = "var(--text-low)";
    st.textContent        = "";
  }
});
