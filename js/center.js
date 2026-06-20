const firebaseConfig = {
  apiKey: "AIzaSyC21mdsgyIEqXT7ujFbi0xcVAMRZxxqB1I",
  authDomain: "tmraditya-1ceb7.firebaseapp.com",
  projectId: "tmraditya-1ceb7",
  storageBucket: "tmraditya-1ceb7.firebasestorage.app",
  messagingSenderId: "317037791388",
  appId: "1:317037791388:web:755b5a18bb77aa140a4559",
  databaseURL: "https://tmraditya-1ceb7-default-rtdb.asia-southeast1.firebasedatabase.app"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const card = document.getElementById('elimCard');
const hashEl = card.querySelector('.hash-tag');
const teamNameEl = card.querySelector('.team-name');
const elimCountEl = card.querySelector('.elim-count');
const logoImg = card.querySelector('.logo-box img');
const leftBox = card.querySelector('.left-box');
const rightBox = card.querySelector('.right-box');

const prevAlive = {};
const queue = [];
let showing = false;

db.ref('/matches/live').on('value', snap => {
  const data = snap.val() || {};
  const teamTags = Object.keys(data).filter(k => data[k] && data[k]['2_isTeamAlive'] !== undefined);
  const totalTeams = teamTags.length;
  for (const tag of teamTags) {
    const node = data[tag];
    const alive = node['2_isTeamAlive'];
    if (alive === undefined || alive === null) continue;
    const prev = prevAlive[tag];
    prevAlive[tag] = alive;
    if (alive === 0 && prev !== undefined && prev !== 0) {
      const hash = node['0_hash'] || totalTeams;
      queue.push({ tag, hash, kills: Number(node['5_totalKills']) || 0, name: node['4_teamName'] || '' });
      processQueue();
    }
  }
});

function processQueue() {
  if (showing || queue.length === 0) return;
  showing = true;
  const item = queue.shift();
  const name = item.name || item.tag;
  showCard(item.tag, item.hash, name, item.kills);
}

function showCard(tag, hash, name, kills) {
  card.classList.remove('show');
  card.style.display = 'none';
  hashEl.textContent = '#' + hash;
  teamNameEl.textContent = name;
  elimCountEl.textContent = kills + ' ELIMINATIONS';
  logoImg.src = './img/logos/' + tag + '.webp';
  card.style.display = 'flex';
  void card.offsetWidth;
  card.classList.add('show');
  setTimeout(() => {
    card.classList.remove('show');
    card.style.display = 'none';
    showing = false;
    processQueue();
  }, 3000);
}

db.ref("/live-graphics/theme/eliminated").on("value", function(snap) {
  var t = snap.val();
  if (!t) return;
  var root = document.documentElement;
  if (t.bgLeft)     root.style.setProperty("--bg-left", t.bgLeft);
  if (t.bgRight)    root.style.setProperty("--bg-right", t.bgRight);
  if (t.leftHash)   root.style.setProperty("--left-hash", t.leftHash);
  if (t.rightTeam)  root.style.setProperty("--right-team", t.rightTeam);
  if (t.rightElim)  root.style.setProperty("--right-elim", t.rightElim);
});