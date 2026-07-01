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

var cards = document.querySelectorAll('.winrate-card');
var cardTags = [null, null, null, null];

function hideSingleCard(idx) {
  cards[idx].classList.add('hidden');
  setTimeout(function() {
    cards[idx].style.display = 'none';
  }, 600);
}

function showSingleCard(idx) {
  cards[idx].style.display = '';
  void cards[idx].offsetWidth;
  cards[idx].classList.remove('hidden');
}

function hideAllCards() {
  for (var i = 0; i < cards.length; i++) {
    cards[i].classList.add('hidden');
    setTimeout(function(idx) {
      return function() { cards[idx].style.display = 'none'; };
    }(i), 600);
  }
  cardTags = [null, null, null, null];
}

function populateCard(card, team) {
  card.querySelector('.winrate-box img').src = 'img/logos/' + team.tag.toLowerCase() + '.webp';
  card.querySelector('.bar-label').textContent = team.tag;
  card.querySelector('.winrate-lower').textContent = 'WR\u00a0\u00a0\u00a0' + team.winRate + '%';

  var bars = card.querySelectorAll('.bar');
  for (var i = 0; i < bars.length; i++) {
    if (i < team.playersAlive) {
      bars[i].classList.add('alive');
      bars[i].classList.remove('dead');
    } else {
      bars[i].classList.add('dead');
      bars[i].classList.remove('alive');
    }
  }
}

function updateCards(teams) {
  if (teams.length > 4 || teams.length === 0) {
    hideAllCards();
    return;
  }

  var aliveTags = {};
  for (var i = 0; i < teams.length; i++) {
    aliveTags[teams[i].tag] = teams[i];
  }

  for (var i = 0; i < cardTags.length; i++) {
    if (cardTags[i] && !aliveTags[cardTags[i]]) {
      hideSingleCard(i);
      cardTags[i] = null;
    }
  }

  var emptySlots = [];
  for (var i = 0; i < cardTags.length; i++) {
    if (cardTags[i] === null) emptySlots.push(i);
  }

  for (var i = 0; i < teams.length; i++) {
    var team = teams[i];
    var existingIdx = -1;
    for (var j = 0; j < cardTags.length; j++) {
      if (cardTags[j] === team.tag) { existingIdx = j; break; }
    }
    if (existingIdx !== -1) {
      populateCard(cards[existingIdx], team);
    } else if (emptySlots.length > 0) {
      var slotIdx = emptySlots.shift();
      cardTags[slotIdx] = team.tag;
      populateCard(cards[slotIdx], team);
      showSingleCard(slotIdx);
    }
  }
}

db.ref('/matches/live').on('value', function(snap) {
  var data = snap.val() || {};
  var aliveTeams = [];
  var keys = Object.keys(data);
  for (var i = 0; i < keys.length; i++) {
    var node = data[keys[i]];
    if (typeof node !== 'object' || node === null) continue;
    if (!node['1_teamTag'] || node['2_isTeamAlive'] !== 1) continue;
    aliveTeams.push({
      tag: node['1_teamTag'],
      winRate: Math.round(parseFloat(node['winRate']) || 0),
      playersAlive: parseInt(node['3_playersAlive']) || 0
    });
  }
  updateCards(aliveTeams);
});

db.ref('/live-graphics/theme/ticker').on('value', function(snap) {
  var t = snap.val();
  if (!t) return;
  var root = document.documentElement;
  if (t.barAlive) root.style.setProperty('--bar-alive-color', t.barAlive);
  if (t.barDead)  root.style.setProperty('--bar-dead-color', t.barDead);
});

db.ref('/live-graphics/theme/winRate').on('value', function(snap) {
  var t = snap.val();
  if (!t) return;
  var root = document.documentElement;
  if (t.boxBg)     root.style.setProperty('--box-bg', t.boxBg);
  if (t.upperBg)   root.style.setProperty('--upper-bg', t.upperBg);
  if (t.upperText) root.style.setProperty('--upper-text', t.upperText);
  if (t.lowerBg)   root.style.setProperty('--lower-bg', t.lowerBg);
  if (t.lowerText) root.style.setProperty('--lower-text', t.lowerText);
});

db.ref('/live-graphics/winRate').on('value', function(snap) {
  var val = snap.val();
  if (val === 'in') {
    updateCards([
      { tag: 'S8UL', winRate: 26, playersAlive: 4 },
      { tag: 'TG',   winRate: 35, playersAlive: 2 },
      { tag: 'TS',   winRate: 18, playersAlive: 1 },
      { tag: 'FLY',  winRate: 42, playersAlive: 0 }
    ]);
  }
});
