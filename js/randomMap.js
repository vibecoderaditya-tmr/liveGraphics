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
var db         = firebase.database();
var statusRef  = db.ref('/maprand/status');
var commandRef = db.ref('/maprand/command');
var resultRef  = db.ref('/maprand/result');

const MAPS = [
    { name: 'Bermuda',   img: 'img/maps/bermuda.webp'   },
    { name: 'Kalahari',  img: 'img/maps/kalahari.webp'  },
    { name: 'Purgatory', img: 'img/maps/purgatory.webp' },
    { name: 'Nexterra',  img: 'img/maps/nexterra.webp'  },
    { name: 'Solara',    img: 'img/maps/solara.webp'    },
];

const STAGES = [
  [900,  600],
  [600,  600],
  [300,  700],
  [140,  800],
  [140,  800],
  [300,  700],
  [550,  700],
  [850,  800],
  [1200,   0],
];

const STAGE_DOTS = [1, 2, 3, 5, 5, 3, 2, 1, 1];
const DOTS = ['d1','d2','d3','d4','d5'];

let selectedMap      = null;
let currentIndex     = 0;
let spinning         = false;
let spinTimer        = null;
let lastLockedIndex  = -1;

const mapBg       = document.getElementById('mapBg');
const mapName     = document.getElementById('mapName');
const eyebrow     = document.getElementById('eyebrow');
const stateLabel  = document.getElementById('stateLabel');
const lockFlash   = document.getElementById('lockFlash');
const lockedFrame = document.getElementById('lockedFrame');
const bottomMap   = document.getElementById('bottomMap');

MAPS.forEach(m => { const i = new Image(); i.src = m.img; });

function showMap(index) {
  const map = MAPS[index];
  mapBg.src = map.img;
  mapName.textContent = map.name;
  mapName.classList.remove('locked');
}

function updateDots(stageIndex) {
  const activeDots = (stageIndex >= STAGE_DOTS.length) ? 0 : STAGE_DOTS[stageIndex];
  DOTS.forEach((id, i) => {
    document.getElementById(id).classList.toggle('active', i < activeDots);
  });
}

function startSpin() {
  if (spinning) return;
  spinning = true;

  let startIndex;
  do {
    startIndex = Math.floor(Math.random() * MAPS.length);
  } while (startIndex === lastLockedIndex && MAPS.length > 1);
  currentIndex = startIndex;
  showMap(currentIndex);

  stateLabel.textContent = 'Randomizing...';
  stateLabel.className = 'spinning';
  eyebrow.textContent = 'Selecting map';
  mapName.classList.remove('locked');
  lockedFrame.classList.remove('show');

  let stageIndex = 0;
  let elapsed = 0;

  function runStage() {
    if (stageIndex >= STAGES.length - 1) {
      lock(currentIndex);
      return;
    }

    const [interval, duration] = STAGES[stageIndex];
    updateDots(stageIndex);
    elapsed = 0;

    spinTimer = setInterval(() => {
      let next;
      do {
        next = Math.floor(Math.random() * MAPS.length);
      } while (next === currentIndex);
      currentIndex = next;
      showMap(currentIndex);

      elapsed += interval;
      if (elapsed >= duration) {
        clearInterval(spinTimer);
        stageIndex++;
        runStage();
      }
    }, interval);
  }

  runStage();
}

function lock(winnerIndex) {
  clearInterval(spinTimer);
  spinning = false;

  if (winnerIndex === lastLockedIndex && MAPS.length > 1) {
    let next;
    do {
      next = Math.floor(Math.random() * MAPS.length);
    } while (next === lastLockedIndex);
    winnerIndex = next;
    currentIndex = next;
    showMap(currentIndex);
  }

  setTimeout(() => {
    mapName.classList.add('locked');
    mapBg.style.filter = 'brightness(0.65) saturate(1.1)';

    lockFlash.classList.remove('flash');
    void lockFlash.offsetWidth;
    lockFlash.classList.add('flash');

    lockedFrame.classList.add('show');

    eyebrow.textContent = 'Selected map';
    stateLabel.textContent = '\u2014 locked \u2014';
    stateLabel.className = 'locked';
    bottomMap.textContent = MAPS[winnerIndex].name;

    selectedMap     = MAPS[winnerIndex].name;
    lastLockedIndex = winnerIndex;
    console.log('Selected map:', selectedMap);

    resultRef.set(selectedMap);
    statusRef.set('done');

    updateDots(99);
  }, 80);
}

window.addEventListener('load', () => {
  const initIndex = Math.floor(Math.random() * MAPS.length);
  currentIndex = initIndex;
  showMap(initIndex);
  mapBg.style.filter = 'brightness(0.4) saturate(0.6)';
  stateLabel.textContent = 'Ready';
  eyebrow.textContent = 'Awaiting signal';
  updateDots(99);

  statusRef.set('ready');
  resultRef.set('none');
  commandRef.set('idle');

  commandRef.on('value', function(snap) {
    if (snap.val() === 'spin' && !spinning) {
      mapBg.style.filter = 'brightness(0.55) saturate(0.85)';
      statusRef.set('spinning');
      commandRef.set('idle');
      startSpin();
    }
  });
});