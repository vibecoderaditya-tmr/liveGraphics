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
var buttonsRef = db.ref("/live-graphics/buttons");
var configRef = buttonsRef.child("config");
var assignRef = buttonsRef.child("assignments");

var ACTION_OPTIONS = [
  { id: "",            label: "— UNASSIGNED —" },
  { id: "osPT_SHOW_HIDE",       label: "osPT — Show / Hide" },
  { id: "perMatchPt_SHOW_HIDE", label: "perMatchPt — Show / Hide" },
  { id: "booyahTeam_SHOW_HIDE", label: "Booyah Team — Show / Hide" },
  { id: "crActivate_SHOW_HIDE", label: "CR Activated — Show / Hide" },
  { id: "ticker_STATE",         label: "Ticker — In / Out" },
  { id: "ticker_LEFT",          label: "Ticker — LEFT" },
  { id: "ticker_RIGHT",         label: "Ticker — RIGHT" },
  { id: "gameInfo_IN",          label: "Game Info — IN" },
  { id: "teamElim_IN",          label: "Team Eliminated — IN" },
  { id: "crAlert_IN",           label: "CR Alert — IN" },
  { id: "winner_SHOW",          label: "Winner — Show / Hide" },
  { id: "exportToSheets",       label: "Export — Sheets" }
];

var cfg = { rows: 2, cols: 4 };
var asg = {};
var editingId = null;

function renderGrid() {
  var grid = document.getElementById("adm-grid");
  grid.innerHTML = "";
  var total = cfg.rows * cfg.cols;
  grid.style.gridTemplateColumns = "repeat(" + cfg.cols + ", 1fr)";
  for (var i = 1; i <= total; i++) {
    var id = "btn-" + i;
    var a = asg[id];
    var tile = document.createElement("div");
    tile.className = "adm-tile" + (a && a.action ? "" : " tile-empty");
    var lbl = document.createElement("span");
    lbl.className = "tile-label";
    lbl.textContent = (a && a.label) ? a.label : (a && a.action ? a.sub || a.action : "UNASSIGNED");
    var sub = document.createElement("span");
    sub.className = "tile-sub";
    sub.textContent = a && a.action ? a.sub : "CLICK TO EDIT";
    tile.appendChild(lbl);
    tile.appendChild(sub);
    if (a) {
      tile.style.background = a.bg || "#1f2937";
      tile.style.color = a.text || "#ffffff";
    }
    tile.addEventListener("click", function(id2) {
      return function() { openEditor(id2); };
    }(id));
    grid.appendChild(tile);
  }
}

function openEditor(id) {
  editingId = id;
  var cur = asg[id] || {};
  var sel = document.getElementById("action-select");
  sel.innerHTML = "";
  ACTION_OPTIONS.forEach(function(o) {
    var opt = document.createElement("option");
    opt.value = o.id;
    opt.textContent = o.label;
    sel.appendChild(opt);
  });
  sel.value = cur.action || "";
  var lblEl = document.getElementById("btn-label");
  lblEl.value = cur.label || "";
  if (!lblEl.value) {
    var selLabel = cur.action ? cur.action.replace(/_/g, " ") : "";
    lblEl.placeholder = selLabel || "MY BUTTON";
  }
  var bgEl = document.getElementById("bg-color");
  var bgTxt = document.getElementById("bg-text");
  var txEl = document.getElementById("text-color");
  var txTxt = document.getElementById("text-text");
  var bg = cur.bg || "#1f2937";
  var tx = cur.text || "#ffffff";
  bgEl.value = bg; bgTxt.value = bg;
  txEl.value = tx; txTxt.value = tx;
  document.getElementById("modal-title").textContent = "Assign — " + id.toUpperCase();
  document.getElementById("editor-mask").classList.remove("hidden");
  document.getElementById("delete-btn").style.display = cur.action ? "inline-block" : "none";

  bgEl.oninput = function() { bgTxt.value = bgEl.value; };
  txEl.oninput = function() { txTxt.value = txEl.value; };
}

function saveEditor() {
  if (!editingId) return;
  var action = document.getElementById("action-select").value;
  var label = (document.getElementById("btn-label").value || "").trim();
  var bg = normalizeHash(document.getElementById("bg-text").value) || "#1f2937";
  var tx = normalizeHash(document.getElementById("text-text").value) || "#ffffff";
  var entry = { action: action, bg: bg, text: tx, label: label };
  if (action) {
    assignRef.child(editingId).set(entry);
  } else {
    assignRef.child(editingId).remove();
  }
  closeEditor();
}

function normalizeHash(v) {
  v = (v || "").trim();
  if (/^[0-9a-f]{6}$/i.test(v)) return "#" + v;
  if (/^#[0-9a-f]{6}$/i.test(v)) return v;
  return null;
}

function deleteButton() {
  if (!editingId) return;
  assignRef.child(editingId).remove();
  closeEditor();
}
window.deleteButton = deleteButton;

function closeEditor() {
  editingId = null;
  document.getElementById("editor-mask").classList.add("hidden");
}
window.closeEditor = closeEditor;

function stepRows(d) {
  var next = cfg.rows + d;
  if (next < 1 || next > 12) return;
  cfg.rows = next;
  configRef.update({ rows: next });
}
window.stepRows = stepRows;

function stepCols(d) {
  var next = cfg.cols + d;
  if (next < 1 || next > 12) return;
  cfg.cols = next;
  configRef.update({ cols: next });
}
window.stepCols = stepCols;

configRef.on("value", function(snap) {
  var v = snap.val();
  if (v) {
    if (v.rows > 0) cfg.rows = v.rows;
    if (v.cols > 0) cfg.cols = v.cols;
  }
  document.getElementById("rows-val").textContent = cfg.rows;
  document.getElementById("cols-val").textContent = cfg.cols;
  renderGrid();
});

assignRef.on("value", function(snap) {
  asg = snap.val() || {};
  renderGrid();
});