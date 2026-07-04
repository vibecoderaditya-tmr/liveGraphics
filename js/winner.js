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

var grid = document.getElementById('winnerGrid');
var stageEl = document.getElementById('winnerStage');
var crEl = document.getElementById('winnerCr');
var gameEl = document.getElementById('winnerGame');
var latestMatchData = null;

var CHAR_IMAGES = [
  'blacksmith','detective','designer','crazygirl','yakuza',
  'xtreme','villain','tracker','superteen','superstar',
  'auroraboy','bounty','cityheroboy','graffitist','geek',
  'electricgirl','dreamlandboy','djmale_awakening','djmale',
  'monkeygod','mademana','professor','musicbro1'
];

function initImagePool() {
  var pool = JSON.parse(localStorage.getItem('winnerImgPool'));
  var idx = parseInt(localStorage.getItem('winnerImgIdx')) || 0;
  var count = parseInt(localStorage.getItem('winnerRenderCount')) || 0;
  if (!pool || pool.length === 0) {
    pool = CHAR_IMAGES.slice();
    shuffle(pool);
    idx = 0;
    count = 0;
    localStorage.setItem('winnerImgPool', JSON.stringify(pool));
    localStorage.setItem('winnerImgIdx', idx);
    localStorage.setItem('winnerRenderCount', count);
  }
  return { pool: pool, idx: idx, count: count };
}

function shuffle(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
}

function getNextImages(advanceCycle) {
  var state = initImagePool();
  var images = [];
  for (var i = 0; i < 4; i++) {
    images.push(state.pool[(state.idx + i) % state.pool.length]);
  }
  state.idx = (state.idx + 4) % state.pool.length;

  if (advanceCycle) {
    state.count += 1;
    if (state.count >= 5) {
      var pool = CHAR_IMAGES.slice();
      shuffle(pool);
      state.idx = 0;
      state.count = 0;
      localStorage.setItem('winnerImgPool', JSON.stringify(pool));
    } else {
      localStorage.setItem('winnerImgIdx', state.idx);
    }
    localStorage.setItem('winnerRenderCount', state.count);
  } else {
    localStorage.setItem('winnerImgIdx', state.idx);
  }

  return images;
}

function shufflePool() {
  var pool = CHAR_IMAGES.slice();
  shuffle(pool);
  localStorage.setItem('winnerImgPool', JSON.stringify(pool));
  localStorage.setItem('winnerImgIdx', '0');
}

function animateValue(el, from, to, duration, suffix) {
  var start = performance.now();
  function tick(now) {
    var t = Math.min((now - start) / duration, 1);
    var p = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    var val = Math.round(from + (to - from) * p);
    el.textContent = val + (suffix || '');
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function animateContri(el, from, to, duration) {
  var start = performance.now();
  function tick(now) {
    var t = Math.min((now - start) / duration, 1);
    var p = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    el.textContent = (from + (to - from) * p).toFixed(2) + '%';
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function renderWinner(tag, rosters, totalKills, advanceCycle) {
  var sorted = [];
  var keys = Object.keys(rosters);
  keys.sort(function(a, b) {
    var na = parseInt(a.match(/\d+$/)[0], 10) || 0;
    var nb = parseInt(b.match(/\d+$/)[0], 10) || 0;
    return na - nb;
  });

  for (var i = 0; i < keys.length; i++) {
    sorted.push(rosters[keys[i]]);
  }

  var charImages = getNextImages(advanceCycle);

  grid.innerHTML = '';

  var maxKills = 0, maxKnocks = 0;
  for (var i = 0; i < sorted.length; i++) {
    if (sorted[i].kills > maxKills) { maxKills = sorted[i].kills; maxKnocks = 0; }
    if (sorted[i].kills === maxKills && sorted[i].knocks > maxKnocks) maxKnocks = sorted[i].knocks;
  }

  var totalKnocks = 0;
  for (var i = 0; i < sorted.length; i++) totalKnocks += sorted[i].knocks || 0;

  for (var i = 0; i < sorted.length; i++) {
    var p = sorted[i];
    var shareKills  = totalKills > 0 ? (p.kills || 0) / totalKills : 0;
    var shareKnocks = totalKnocks > 0 ? (p.knocks || 0) / totalKnocks : 0;
    var contri = (shareKills * 70 + shareKnocks * 30).toFixed(2);
    var isMvp = p.kills === maxKills && p.knocks >= maxKnocks && maxKills > 0;

    var mvpBadge = isMvp ? '<div class="winner-mvp-badge"><span class="winner-mvp-text">MVP</span></div>' : '';

    var card = document.createElement('div');
    card.className = 'winner-card';
    card.innerHTML =
      '<div class="winner-card-left">' +
        '<div class="winner-card-logo"><div class="winner-card-logo-clip"><img src="img/characters/' + charImages[i] + '.webp" alt=""></div></div>' +
        mvpBadge +
      '</div>' +
      '<div class="winner-card-right">' +
        '<div class="winner-card-right-name"></div>' +
        '<div class="winner-card-right-body">' +
          '<div class="winner-stats-row">' +
            '<div class="winner-stat-col">' +
              '<span class="winner-stat-label">ELIMINATIONS</span>' +
              '<span class="winner-stat-value">0</span>' +
            '</div>' +
            '<div class="winner-stat-col">' +
              '<span class="winner-stat-label">KNOCKS</span>' +
              '<span class="winner-stat-value">0</span>' +
            '</div>' +
          '</div>' +
          '<div class="winner-contri-row">' +
            '<div class="winner-contri-header">' +
              '<span class="winner-stat-label">CONTRIBUTION</span>' +
              '<span class="winner-contri-value">0.00%</span>' +
            '</div>' +
            '<div class="winner-contri-track">' +
              '<div class="winner-contri-fill" style="width:0%"></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    var nameEl = card.querySelector('.winner-card-right-name');
    if (nameEl) nameEl.textContent = p.playerName || 'Player ' + (i + 1);

    grid.appendChild(card);
  }

  // Trigger card entrance animation
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      var cards = grid.querySelectorAll('.winner-card');
      for (var ci = 0; ci < cards.length; ci++) {
        cards[ci].classList.add('visible');
      }

      // Start counters after enter anims finish
      setTimeout(function() {
        var cards = grid.querySelectorAll('.winner-card');
        for (var ci = 0; ci < cards.length; ci++) {
          (function(card, p, totalKills, totalKnocks) {
            var shareKills  = totalKills > 0 ? (p.kills || 0) / totalKills : 0;
            var shareKnocks = totalKnocks > 0 ? (p.knocks || 0) / totalKnocks : 0;
            var contri = (shareKills * 70 + shareKnocks * 30);
            var elimsSpan = card.querySelector('.winner-stat-col:first-child .winner-stat-value');
            var knocksSpan = card.querySelector('.winner-stat-col:last-child .winner-stat-value');
            var contriSpan = card.querySelector('.winner-contri-value');
            var contriFill = card.querySelector('.winner-contri-fill');
            if (elimsSpan) animateValue(elimsSpan, 0, p.kills || 0, 1200);
            if (knocksSpan) animateValue(knocksSpan, 0, p.knocks || 0, 1200);
            if (contriSpan) animateContri(contriSpan, 0, contri, 1200);
            if (contriFill) {
              contriFill.style.transition = 'width 1.2s ease-in-out';
              contriFill.style.width = contri + '%';
            }
          })(cards[ci], sorted[ci], totalKills, totalKnocks);
        }
      }, 1140);

      // Remove card overflow clip after all anims finish so MVP badge isn't clipped
      setTimeout(function() {
        var cards = grid.querySelectorAll('.winner-card');
        for (var ci = 0; ci < cards.length; ci++) {
          cards[ci].style.overflow = 'visible';
        }
      }, 1700);
    });
  });
}

db.ref('/matches').on('value', function(snap) {
  var data = snap.val();
  if (!data) return;
  var highestNum = 0, matchKey = '';
  for (var key in data) {
    var m = key.match(/^match(\d+)$/);
    if (m) { var n = parseInt(m[1], 10); if (n > highestNum) { highestNum = n; matchKey = key; } }
  }
  if (matchKey && data[matchKey]) {
    var match = data[matchKey];
    latestMatchData = match['4_BOOYAH'] || null;
    gameEl.textContent = 'GAME ' + highestNum + ' - ' + (match['1_mapName'] || '');
  }
});

var storedCrWidth = 0;
db.ref('/matches/championRushPoint').on('value', function(snap) {
  var show = (parseInt(snap.val()) || 0) > 0;
  crEl.style.display = show ? 'inline-block' : 'none';
  if (show) {
    document.querySelector('.winner-subheader').style.setProperty('--cr-extra-gap', '0px');
    if (!storedCrWidth) {
      requestAnimationFrame(function() { storedCrWidth = crEl.offsetWidth || 250; });
    }
  } else {
    document.querySelector('.winner-subheader').style.setProperty('--cr-extra-gap', (storedCrWidth || 250) + 'px');
  }
});

db.ref('/live-graphics/tournamentStage').on('value', function(snap) {
  stageEl.textContent = snap.val() || '';
});

db.ref('/live-graphics/theme/winner').on('value', function(snap) {
  var t = snap.val();
  if (!t) return;
  var root = document.documentElement;
  function _h(v){ return typeof v === 'string' && v[0] === '#'; }
  if (_h(t.statsText))      root.style.setProperty('--winner-stats-text', t.statsText);
  if (_h(t.cardBorder))     root.style.setProperty('--winner-card-border', t.cardBorder);
  if (_h(t.cardBadge))      root.style.setProperty('--winner-card-badge', t.cardBadge);
  if (_h(t.textColor))      root.style.setProperty('--winner-text', t.textColor);
  if (_h(t.nameTextColor))  root.style.setProperty('--winner-name-text', t.nameTextColor);
  if (_h(t.nameBarBg))      root.style.setProperty('--winner-name-bar-bg', t.nameBarBg);
  if (_h(t.statsBg))        root.style.setProperty('--winner-stats-bg', t.statsBg);
  if (_h(t.labelColor))     root.style.setProperty('--winner-label', t.labelColor);
  if (_h(t.contriBar))      root.style.setProperty('--winner-contri-bar', t.contriBar);
  if (_h(t.contriNumber))   root.style.setProperty('--winner-contri-number', t.contriNumber);
  if (_h(t.mvpBg))          root.style.setProperty('--winner-mvp-bg', t.mvpBg);
  if (_h(t.mvpText))        root.style.setProperty('--winner-mvp-text', t.mvpText);
  if (_h(t.stageText))      root.style.setProperty('--winner-stage-text', t.stageText);
  if (_h(t.crBg))           root.style.setProperty('--winner-cr-bg', t.crBg);
  if (_h(t.crText))         root.style.setProperty('--winner-cr-text', t.crText);
  if (_h(t.gameBg))         root.style.setProperty('--winner-game-bg', t.gameBg);
  if (_h(t.gameText))       root.style.setProperty('--winner-game-text', t.gameText);
});

db.ref('/live-graphics/editor/winner').on('value', function(snap) {
  var vals = snap.val();
  if (!vals) return;
  var root = document.documentElement;
  for (var key in vals) {
    var num = parseFloat(vals[key]);
    if (isFinite(num)) root.style.setProperty('--' + key, num + 'px');
  }
});

db.ref('/live-graphics/winner').on('value', function(snap) {
  var val = snap.val();
  if (val === 'show' && latestMatchData) {
    renderWinner(latestMatchData.tag, latestMatchData.rosters || {}, parseInt(latestMatchData.totalKills) || 0, true);
  } else if (val === 'shuffle') {
    shufflePool();
  } else if (val === 'hide') {
    grid.innerHTML = '';
  }
});
