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

var TABS = [
  {
    id: 'winner',
    label: 'Winner',
    path: '/live-graphics/editor/winner',
    groups: [
      {
        label: 'Header',
        fields: [
          { key: 'winner-booyah-offset-x', label: 'BOOYAH X', desc: 'Move BOOYAH image horizontally', default: -350 },
          { key: 'winner-booyah-offset-y', label: 'BOOYAH Y', desc: 'Move BOOYAH image vertically', default: -69 },
          { key: 'winner-booyah-size', label: 'BOOYAH Size', desc: 'BOOYAH image height', default: 400 },
          { key: 'winner-subhead-offset-x', label: 'TEAM STATS X', desc: 'Move TEAM STATS text horizontally', default: -400 },
          { key: 'winner-subhead-offset-y', label: 'TEAM STATS Y', desc: 'Move TEAM STATS text vertically', default: -56 },
          { key: 'winner-subhead-size', label: 'TEAM STATS Size', desc: 'TEAM STATS font size', default: 56 },
          { key: 'winner-subhead-ls', label: 'TEAM STATS LS', desc: 'TEAM STATS letter spacing', default: 3 }
        ]
      },
      {
        label: 'Sub-Header',
        fields: [
          { key: 'winner-stage-offset-x', label: 'Stage X', desc: 'Move tournament stage text horizontally', default: -350 },
          { key: 'winner-stage-offset-y', label: 'Stage Y', desc: 'Move tournament stage text vertically', default: -170 },
          { key: 'winner-stage-size', label: 'Stage Size', desc: 'Tournament stage font size', default: 28 },
          { key: 'winner-stage-ls', label: 'Stage LS', desc: 'Tournament stage letter spacing', default: 5 },
          { key: 'winner-cr-offset-x', label: 'CR X', desc: 'Move CHAMPION RUSH badge horizontally', default: -280 },
          { key: 'winner-cr-offset-y', label: 'CR Y', desc: 'Move CHAMPION RUSH badge vertically', default: -170 },
          { key: 'winner-game-offset-x', label: 'Game X', desc: 'Move GAME X - MAP badge horizontally', default: -281 },
          { key: 'winner-game-offset-y', label: 'Game Y', desc: 'Move GAME X - MAP badge vertically', default: -170 },
          { key: 'winner-game-size', label: 'Game Size', desc: 'GAME X - MAP font size', default: 23 },
          { key: 'winner-subheader-gap', label: 'Gap', desc: 'Space between stage text and badges', default: 60 },
          { key: 'winner-badge-extra-w', label: 'Badge Extra W', desc: 'Extra width added beyond fit-content', default: 44 },
          { key: 'winner-badge-pad-y', label: 'Badge Pad Y', desc: 'Badge vertical padding', default: 8 },
          { key: 'winner-radius', label: 'Radius', desc: 'Badge corner radius', default: 3 }
        ]
      },
      {
        label: 'Cards',
        fields: [
          { key: 'winner-card-w', label: 'Card Width', desc: 'Each card width', default: 699 },
          { key: 'winner-card-h', label: 'Card Height', desc: 'Each card height', default: 330 },
          { key: 'winner-card-gap', label: 'Card Gap', desc: 'Gap between the 4 cards', default: 69 },
          { key: 'winner-card-border-w', label: 'Border Width', desc: 'Card outline thickness', default: 2 },
          { key: 'winner-left-w', label: 'Left Section W', desc: 'Player image area width', default: 200 },
          { key: 'winner-grid-offset-x', label: 'Grid X', desc: 'Move card grid horizontally', default: 0 },
          { key: 'winner-grid-offset-y', label: 'Grid Y', desc: 'Move card grid vertically', default: -150 }
        ]
      },
      {
        label: 'Player Stats',
        fields: [
          { key: 'winner-right-name-h', label: 'Name Bar H', desc: 'Player name bar height', default: 55 },
          { key: 'winner-right-pad-y', label: 'Pad Y', desc: 'Top & bottom padding inside stats', default: 12 },
          { key: 'winner-right-pad-x', label: 'Pad X', desc: 'Left & right padding inside stats', default: 18 },
          { key: 'winner-row-gap', label: 'Row Gap', desc: 'Space between stats and contri rows', default: 32 },
          { key: 'winner-stat-label-size', label: 'Label Size', desc: 'ELIMINATIONS / KNOCKS label size', default: 28 },
          { key: 'winner-stat-label-ls', label: 'Label LS', desc: 'Stat label letter spacing', default: 3 },
          { key: 'winner-stat-value-size', label: 'Value Size', desc: 'Kill & knock number size', default: 69 },
          { key: 'winner-player-name-size', label: 'Name Size', desc: 'Player name text size', default: 28 },
          { key: 'winner-contri-value-size', label: 'Contri Size', desc: 'Contribution percentage size', default: 38 },
          { key: 'winner-contri-track-h', label: 'Bar Height', desc: 'Contribution bar thickness', default: 11 },
          { key: 'winner-rows-offset', label: 'Rows Offset', desc: 'Extra bottom padding inside stats', default: 23 }
        ]
      },
      {
        label: 'MVP',
        fields: [
          { key: 'winner-mvp-w', label: 'MVP Width', desc: 'MVP badge width', default: 131 },
          { key: 'winner-mvp-h', label: 'MVP Height', desc: 'MVP badge height', default: 56 },
          { key: 'winner-mvp-bottom', label: 'MVP Bottom', desc: 'Distance from bottom of left box', default: -11 },
          { key: 'winner-mvp-left', label: 'MVP Left', desc: 'Distance from left edge', default: 0 },
          { key: 'winner-mvp-text-size', label: 'MVP Text Size', desc: '"MVP" text size on badge', default: 28 },
          { key: 'winner-mvp-text-bottom', label: 'MVP Text Bottom', desc: '"MVP" text position from bottom', default: 9 },
          { key: 'winner-mvp-text-left', label: 'MVP Text Left', desc: '"MVP" text position from left', default: 14 },
          { key: 'winner-mvp-ls', label: 'MVP LS', desc: '"MVP" letter spacing', default: 11 }
        ]
      },
      {
        label: 'Wrapper',
        fields: [
          { key: 'winner-wrapper-offset-x', label: 'Wrapper X', desc: 'Move entire overlay horizontally', default: 0 },
          { key: 'winner-wrapper-offset-y', label: 'Wrapper Y', desc: 'Move entire overlay vertically', default: 0 }
        ]
      }
    ]
  },
    {
      id: 'ticker',
      label: 'Ticker',
      path: '/live-graphics/editor/ticker',
      groups: [
        {
          label: 'Layout',
          fields: [
            { key: 'logo-size', label: 'Logo Size', desc: 'Team logo size', default: 36 },
            { key: 'row-height', label: 'Row Height', desc: 'Each team row height', default: 40 }
          ]
        },
        {
          label: 'Spacing',
          fields: [
            { key: 'bar-width', label: 'Bar Width', desc: 'Alive player bar width', default: 6 },
            { key: 'bar-height', label: 'Bar Height', desc: 'Alive player bar height', default: 25 },
            { key: 'bar-gap', label: 'Bar Gap', desc: 'Gap between alive bars', default: 3 },
            { key: 'team-pad', label: 'Team Pad', desc: 'Team column padding', default: 0 },
            { key: 'header-team-pad', label: 'Header Team Pad', desc: 'Header team column padding', default: 38 },
            { key: 'header-gap', label: 'Header Gap', desc: 'Header row gap', default: 5 },
            { key: 'row-gap', label: 'Row Gap', desc: 'Gap between team rows', default: 5 }
          ]
        }
      ]
    },
  {
    id: 'teamEliminated',
    label: 'Team Eliminated',
    path: '/live-graphics/editor/teamEliminated',
    groups: [],
    isTeamEliminated: true,
    styles: [
      {
        id: 'standard',
        label: 'Standard',
        fields: [
          { key: 'box-w', label: 'Box Width', desc: 'Card width', default: 150 },
          { key: 'rect-w', label: 'Rect Width', desc: 'Strip rectangle width', default: 300 },
          { key: 'logo-size', label: 'Logo Size', desc: 'Team logo size', default: 100 },
          { key: 'size-hash', label: 'Hash Size', desc: 'Hash tag font size', default: 21 },
          { key: 'size-elims', label: 'Elims Size', desc: 'Eliminations count size', default: 23 },
          { key: 'size-elim-txt', label: 'Elim Text Size', desc: 'ELIMINATED text size', default: 28 }
        ]
      },
      {
        id: 'center',
        label: 'Center',
        fields: [
          { key: 'box-w', label: 'Box Width', desc: 'Card width', default: 100 },
          { key: 'logo-size', label: 'Logo Size', desc: 'Team logo size', default: 68 },
          { key: 'size-hash', label: 'Hash Size', desc: 'Hash tag font size', default: 16 },
          { key: 'size-team', label: 'Team Size', desc: 'Team name font size', default: 30 },
          { key: 'size-elim', label: 'Elim Size', desc: 'Eliminations text size', default: 16 }
        ]
      },
      {
        id: 'bmps',
        label: 'BMPS',
        fields: [
          { key: 'box-w', label: 'Box Width', desc: 'Card width', default: 150 },
          { key: 'rect-w', label: 'Rect Width', desc: 'Strip rectangle width', default: 300 },
          { key: 'logo-size', label: 'Logo Size', desc: 'Team logo size', default: 100 },
          { key: 'size-hash', label: 'Hash Size', desc: 'Hash tag font size', default: 21 },
          { key: 'size-elims', label: 'Elims Size', desc: 'Eliminations count size', default: 23 },
          { key: 'size-elim-txt', label: 'Elim Text Size', desc: 'ELIMINATED text size', default: 28 },
          { key: 'bmps-strip-height', label: 'Strip Height', desc: 'Curtain strip height', default: 3 }
        ]
      }
    ],
    currentStyle: 'standard'
  },
  {
    id: 'winRate',
    label: 'WinRate',
    path: '/live-graphics/editor/winRate',
    groups: [
      {
        label: 'Dimensions',
        fields: [
          { key: 'box-w', label: 'Box Width', desc: 'Team card width', default: 60 },
          { key: 'box-h', label: 'Box Height', desc: 'Team card height', default: 50 },
          { key: 'rect-w', label: 'Rect Width', desc: 'Inner rectangle width', default: 150 },
          { key: 'rect-h', label: 'Rect Height', desc: 'Inner rectangle height', default: 50 },
          { key: 'lower-w', label: 'Lower Width', desc: 'Win rate section width', default: 140 },
          { key: 'bar-w', label: 'Bar Width', desc: 'Player alive bar width', default: 5 },
          { key: 'bar-h', label: 'Bar Height', desc: 'Player alive bar height', default: 23 },
          { key: 'bar-gap', label: 'Bar Gap', desc: 'Gap between alive bars', default: 5 }
        ]
      }
    ]
  }
];

var tabBody = document.getElementById('tabBody');
var tabBar = document.getElementById('tabBar');
var editorData = {};

function buildGroupHTML(group) {
  var html = '<div class="editor-group">';
  html += '<div class="editor-group-label">' + group.label + '</div>';
  html += '<div class="editor-group-body">';
  for (var i = 0; i < group.fields.length; i++) {
    var f = group.fields[i];
    html += '<div class="field-row" data-key="' + f.key + '" data-default="' + (f.default || 0) + '">';
    html += '  <div class="field-row-top">';
    html += '    <span class="field-label" title="' + (f.desc || '') + '">' + f.label + '</span>';
    html += '    <div class="stepper">';
    html += '      <button class="step-btn" data-dir="-1">−</button>';
    html += '      <input type="number" class="step-input" value="0">';
    html += '      <button class="step-btn" data-dir="+1">+</button>';
    html += '    </div>';
    html += '  </div>';
    if (f.desc) html += '  <span class="field-desc">' + f.desc + '</span>';
    html += '</div>';
  }
  html += '</div></div>';
  return html;
}

function renderTab(tabIndex) {
  var tab = TABS[tabIndex];
  var html = '<div class="tab-pane active" data-tab="' + tab.id + '" data-tab-index="' + tabIndex + '">';

  if (tab.isTeamEliminated) {
    html += '<div class="editor-group">';
    html += '  <div class="editor-group-label" style="cursor:default">Style</div>';
    html += '  <div class="editor-group-body" style="display:grid;grid-template-columns:1fr;padding:10px 14px">';
    html += '    <select class="style-select" id="teStyleSelect">';
    for (var s = 0; s < tab.styles.length; s++) {
      var st = tab.styles[s];
      var sel = st.id === tab.currentStyle ? ' selected' : '';
      html += '      <option value="' + st.id + '"' + sel + '>' + st.label + '</option>';
    }
    html += '    </select>';
    html += '  </div>';
    html += '</div>';

    for (var s = 0; s < tab.styles.length; s++) {
      var st = tab.styles[s];
      var active = st.id === tab.currentStyle ? ' active' : '';
      html += '<div class="te-style-fields' + active + '" data-style="' + st.id + '">';
      var group = { label: st.label, fields: st.fields };
      html += buildGroupHTML(group);
      html += '</div>';
    }
  } else {
    for (var g = 0; g < tab.groups.length; g++) {
      html += buildGroupHTML(tab.groups[g]);
    }
  }

  html += '<button class="reset-btn" data-tab="' + tab.id + '">Reset to defaults</button>';
  html += '</div>';
  tabBody.innerHTML = html;

  var btns = tabBar.querySelectorAll('.tab-btn');
  for (var b = 0; b < btns.length; b++) {
    btns[b].classList.toggle('active', parseInt(btns[b].dataset.index) === tabIndex);
  }

  if (tab.isTeamEliminated) {
    var select = document.getElementById('teStyleSelect');
    if (select) {
      select.addEventListener('change', function() {
        switchTeamEliminatedStyle(this.value);
      });
    }
  }

  bindEvents();
  populateFields(tabIndex);
  bindGroupToggles();
}

function switchTeamEliminatedStyle(styleId) {
  TABS[2].currentStyle = styleId;
  var all = document.querySelectorAll('.te-style-fields');
  for (var i = 0; i < all.length; i++) {
    all[i].classList.toggle('active', all[i].dataset.style === styleId);
  }
  populateFields(2);
}

function bindGroupToggles() {
  var labels = document.querySelectorAll('.editor-group-label');
  for (var i = 0; i < labels.length; i++) {
    (function(el) {
      el.addEventListener('click', function() {
        var group = el.parentElement;
        group.classList.toggle('collapsed');
      });
    })(labels[i]);
  }
}

function bindEvents() {
  var inputs = document.querySelectorAll('.step-input');
  for (var i = 0; i < inputs.length; i++) {
    (function(inp) {
      inp.addEventListener('change', function() {
        var row = inp.closest('.field-row');
        if (row) saveField(row);
      });
    })(inputs[i]);
  }

  var minusBtns = document.querySelectorAll('.step-btn[data-dir="-1"]');
  for (var i = 0; i < minusBtns.length; i++) {
    (function(btn) {
      btn.addEventListener('click', function() {
        var row = btn.closest('.field-row');
        var inp = row.querySelector('.step-input');
        inp.value = parseInt(inp.value) - 1;
        saveField(row);
      });
    })(minusBtns[i]);
  }

  var plusBtns = document.querySelectorAll('.step-btn[data-dir="+1"]');
  for (var i = 0; i < plusBtns.length; i++) {
    (function(btn) {
      btn.addEventListener('click', function() {
        var row = btn.closest('.field-row');
        var inp = row.querySelector('.step-input');
        inp.value = parseInt(inp.value) + 1;
        saveField(row);
      });
    })(plusBtns[i]);
  }

  var resetBtns = document.querySelectorAll('.reset-btn');
  for (var i = 0; i < resetBtns.length; i++) {
    (function(btn) {
      btn.addEventListener('click', function() {
        var idx = parseInt(btn.closest('.tab-pane').dataset.tabIndex);
        if (!isNaN(idx)) resetTab(idx);
      });
    })(resetBtns[i]);
  }
}

function saveField(row) {
  var inp = row.querySelector('.step-input');
  var key = row.dataset.key;
  var val = parseInt(inp.value) || 0;

  var tabPane = row.closest('.tab-pane');
  var tabId = tabPane ? tabPane.dataset.tab : '';
  var tab = null;
  for (var i = 0; i < TABS.length; i++) {
    if (TABS[i].id === tabId) { tab = TABS[i]; break; }
  }
  if (!tab) return;

  if (tab.isTeamEliminated) {
    var styleId = tab.currentStyle;
    var ref = db.ref(tab.path + '/' + styleId + '/' + key);
    ref.set(val);
  } else {
    var ref = db.ref(tab.path + '/' + key);
    ref.set(val);
  }
}

function resetTab(tabIndex) {
  var tab = TABS[tabIndex];
  if (!tab) return;

  var fields = [];
  if (tab.isTeamEliminated) {
    var sty = tab.styles.find(function(s) { return s.id === tab.currentStyle; });
    if (sty) fields = sty.fields;
  } else {
    for (var g = 0; g < tab.groups.length; g++) {
      fields = fields.concat(tab.groups[g].fields);
    }
  }

  var remaining = fields.length;
  if (remaining === 0) { populateFields(tabIndex); return; }

  var fallback = setTimeout(function() { populateFields(tabIndex); }, 2000);

  for (var i = 0; i < fields.length; i++) {
    var f = fields[i];
    var ref;
    if (tab.isTeamEliminated) {
      ref = db.ref(tab.path + '/' + tab.currentStyle + '/' + f.key);
    } else {
      ref = db.ref(tab.path + '/' + f.key);
    }
    ref.remove(function() {
      remaining--;
      if (remaining <= 0) { clearTimeout(fallback); populateFields(tabIndex); }
    });
  }
}

function populateFields(tabIndex) {
  var tab = TABS[tabIndex];
  if (!tab) return;

  var data = {};
  if (tab.isTeamEliminated) {
    var styleId = tab.currentStyle;
    data = (editorData[tab.path] || {})[styleId] || {};
  } else {
    data = editorData[tab.path] || {};
  }

  var rows = document.querySelectorAll('.tab-pane.active .field-row');
  for (var i = 0; i < rows.length; i++) {
    var key = rows[i].dataset.key;
    var inp = rows[i].querySelector('.step-input');
    inp.value = (data[key] !== undefined) ? data[key] : parseInt(rows[i].dataset.default) || 0;
  }
}

function initTabBar() {
  var html = '';
  for (var i = 0; i < TABS.length; i++) {
    var active = i === 0 ? ' active' : '';
    html += '<button class="tab-btn' + active + '" data-index="' + i + '" data-tab="' + TABS[i].id + '">' + TABS[i].label + '</button>';
  }
  tabBar.innerHTML = html;

  var btns = tabBar.querySelectorAll('.tab-btn');
  for (var i = 0; i < btns.length; i++) {
    (function(idx) {
      btns[idx].addEventListener('click', function() {
        renderTab(idx);
      });
    })(i);
  }
}

function loadFirebaseData(callback) {
  var paths = [];
  for (var i = 0; i < TABS.length; i++) {
    paths.push(TABS[i].path);
  }

  var loaded = 0;
  for (var p = 0; p < paths.length; p++) {
    (function(path) {
      db.ref(path).once('value', function(snap) {
        editorData[path] = snap.val() || {};
        loaded++;
        if (loaded === paths.length && callback) callback();
      });
    })(paths[p]);
  }
}

loadFirebaseData(function() {
  initTabBar();
  renderTab(0);
});
