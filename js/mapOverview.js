firebase.initializeApp({
  apiKey:            "AIzaSyC21mdsgyIEqXT7ujFbi0xcVAMRZxxqB1I",
  authDomain:        "tmraditya-1ceb7.firebaseapp.com",
  databaseURL:       "https://tmraditya-1ceb7-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "tmraditya-1ceb7",
  storageBucket:     "tmraditya-1ceb7.firebasestorage.app",
  messagingSenderId: "317037791388",
  appId:             "1:317037791388:web:755b5a18bb77aa140a4559"
});
const fbDb = firebase.database();

const NUM_BOXES  = 8;
const NUM_STANDS = 12;
const POLL_MS    = 3000;

const isFileProtocol = location.protocol === "file:";

function fileRelativeDir() {
  const path = location.pathname;
  return path.substring(0, path.lastIndexOf("/") + 1);
}

const LOGO_BASE = isFileProtocol ? `${fileRelativeDir()}img/logos/` : "/img/logos/";
const MAP_BASE  = isFileProtocol ? `${fileRelativeDir()}img/maps/`  : "/img/maps/";
const LOGO_EXT  = ".webp";

function buildCaseVariants(name) {
  const clean = String(name).trim().replace(/[^a-zA-Z0-9_-]/g, "");
  const lower = clean.toLowerCase();
  const upper = clean.toUpperCase();
  const capitalized = lower.charAt(0).toUpperCase() + lower.slice(1);
  return [...new Set([lower, upper, capitalized])];
}

function setImgWithCaseFallback(imgEl, base, name, ext) {
  const variants = buildCaseVariants(name);
  let attempt = 0;

  function tryNext() {
    if (attempt >= variants.length) {
      console.warn(`Image not found in any case variant: ${base}${name}${ext}`);
      imgEl.onerror = null;
      return;
    }
    const candidate = `${base}${variants[attempt]}${ext}`;
    attempt++;
    imgEl.onerror = tryNext;
    imgEl.src = candidate;
  }
  tryNext();
}

const FIXED_MAPS = [
  { name: "BERMUDA",   file: "bermuda"   },
  { name: "PURGATORY", file: "purgatory" },
  { name: "KALAHARI",  file: "kalahari"  },
  { name: "NEXTERRA",  file: "nexterra"  },
  { name: "SOLARA",    file: "solara"    },
];

const RANDOM_MAP_DEF = FIXED_MAPS[Math.floor(Math.random() * FIXED_MAPS.length)];
const RANDOM_MAP = { name: RANDOM_MAP_DEF.name, file: RANDOM_MAP_DEF.file };

const INITIAL_MAPS = [
  { file: "bermuda",   label: "BERMUDA"   },
  { file: "purgatory", label: "PURGATORY" },
  { file: "kalahari",  label: "KALAHARI"  },
  { file: "nexterra",  label: "NEXTERRA"  },
  { file: "solara",    label: "SOLARA"    },
  { file: "random",    label: "RANDOM"    },
  { file: "random",    label: "RANDOM"    },
  { file: "random",    label: "RANDOM"    },
];

const allBoxes    = Array.from({ length: NUM_BOXES }, (_, i) => document.getElementById(`box${i+1}`));
const logos       = Array.from({ length: NUM_BOXES }, (_, i) => document.getElementById(`logo${i+1}`));
const labels      = Array.from({ length: NUM_BOXES }, (_, i) => document.getElementById(`label${i+1}`));
const mapImgs     = Array.from({ length: NUM_BOXES }, (_, i) => document.getElementById(`mapimg${i+1}`));
const mapLabels   = Array.from({ length: NUM_BOXES }, (_, i) => document.getElementById(`maplabel${i+1}`));
const booyahImgs  = Array.from({ length: NUM_BOXES }, (_, i) => document.getElementById(`booyahimg${i+1}`));

const mainEl        = document.querySelector(".main");
const standingsEl   = document.getElementById("standings");
const standingsBody = document.getElementById("standings-body");
const standTitleEl  = document.getElementById("standings-title");
const standColEl    = document.getElementById("standings-col-header");

INITIAL_MAPS.forEach((m, i) => {
  setImgWithCaseFallback(mapImgs[i], MAP_BASE, m.file, LOGO_EXT);
  mapLabels[i].textContent = m.label;
  setImgWithCaseFallback(booyahImgs[i], MAP_BASE, "booyah", LOGO_EXT);
});

const cssVars      = getComputedStyle(document.documentElement);
const parseSec     = v => parseFloat(v.trim().replace('s','')) * 1000;
const SLIDE_DUR    = parseSec(cssVars.getPropertyValue('--slide-duration'));
const STAGGER      = parseSec(cssVars.getPropertyValue('--slide-stagger'));
const STAY_DUR     = parseSec(cssVars.getPropertyValue('--stay-duration'));
let slideOffset = cssVars.getPropertyValue('--slide-offset').trim();

const STAND_COUNT = 2 + NUM_STANDS;

let standingsRows = [];
(function buildRows() {
  standingsBody.innerHTML = "";
  standingsRows = [];
  for (let i = 0; i < NUM_STANDS; i++) {
    const row = document.createElement("div");
    row.className = "standings-row";
    row.id = "srow-" + i;
    row.innerHTML =
      `<span class="standings-rank">#${i+1}</span>` +
      `<img class="standings-logo" id="slogo-${i}" src="" alt="">` +
      `<span class="standings-name" id="sname-${i}">\u2014</span>` +
      `<span class="standings-pts"  id="spts-${i}">0</span>`;
    standingsBody.appendChild(row);
    standingsRows.push(row);
  }
})();

function fetchStandings() {
  fbDb.ref("/matches/0_teams").once("value", snap => {
    const teams = snap.val();
    if (!teams) return;
    const entries = Object.keys(teams).map(tag => ({
      tag,
      name:     teams[tag]["1_teamName"] || tag,
      totalPts: parseInt(teams[tag]["5_totalPoints"]) || 0
    }));
    entries.sort((a, b) => b.totalPts - a.totalPts);

    for (let i = 0; i < NUM_STANDS; i++) {
      const rankEl = document.querySelector(`#srow-${i} .standings-rank`);
      const logoEl = document.getElementById(`slogo-${i}`);
      const nameEl = document.getElementById(`sname-${i}`);
      const ptsEl  = document.getElementById(`spts-${i}`);

      if (i < entries.length) {
        const e = entries[i];
        if (rankEl) rankEl.textContent = `#${i+1}`;
        if (logoEl) {
          logoEl.style.display = "block";
          loadStandingsLogoCaseInsensitive(logoEl, e.tag);
        }
        if (nameEl) nameEl.textContent = e.name;
        if (ptsEl)  ptsEl.textContent  = e.totalPts;
      } else {
        if (rankEl) rankEl.textContent = "";
        if (logoEl) logoEl.style.display = "none";
        if (nameEl) nameEl.textContent = "\u2014";
        if (ptsEl)  ptsEl.textContent  = "";
      }
    }
  });
}
fetchStandings();
setInterval(fetchStandings, 5000);

fbDb.ref("/live-graphics/overview/slideDirection").on("value", snap => {
  const dir = snap.val();
  const root = document.documentElement;
  if (dir === "right") {
    root.style.setProperty("--slide-offset", "120px");
    slideOffset = "120px";
  } else {
    root.style.setProperty("--slide-offset", "-120px");
    slideOffset = "-120px";
  }
});

let booyahTags = new Array(NUM_BOXES).fill(null);

function attachBooyahListener() {
  fbDb.ref("/matches").on("value", snap => {
    const matches = snap.val() || {};
    const newTags = new Array(NUM_BOXES).fill(null);

    for (let i = 1; i <= NUM_BOXES; i++) {
      const matchNode = matches[`match${i}`];
      if (matchNode && matchNode["4_BOOYAH"] && matchNode["4_BOOYAH"]["tag"]) {
        newTags[i - 1] = matchNode["4_BOOYAH"]["tag"];
      }
      if (i >= 6 && matchNode && matchNode["1_mapName"]) {
        const mapName = matchNode["1_mapName"];
        const file = mapName.toLowerCase();
        setImgWithCaseFallback(mapImgs[i - 1], MAP_BASE, file, LOGO_EXT);
        mapLabels[i - 1].textContent = mapName;
      }
    }

    booyahTags = newTags;
    applyBooyahToBoxes(booyahTags);
    logDebug();
  });
}

function applyBooyahToBoxes(tags) {
  let firstEmptySeen = false;

  for (let i = 0; i < NUM_BOXES; i++) {
    const tag = tags[i];

    if (tag) {
      allBoxes[i].classList.add("has-tag");
      labels[i].innerHTML = `<span class="upcoming-text">BOOYAH</span>`;

      if (logos[i].getAttribute("data-tag") !== tag) {
        logos[i].setAttribute("data-tag", tag);
        loadTeamLogoCaseInsensitive(logos[i], tag);
      }

    } else {
      allBoxes[i].classList.remove("has-tag");
      logos[i].onload  = null;
      logos[i].onerror = null;
      logos[i].src     = "";
      logos[i].setAttribute("data-tag", "");
      logos[i].classList.remove("visible");

      if (!firstEmptySeen) {
        firstEmptySeen = true;
        labels[i].innerHTML = `<span class="upcoming-text">COMING AHEAD</span>`;
        if (i >= 5 && mapLabels[i].textContent === "RANDOM") {
          setImgWithCaseFallback(mapImgs[i], MAP_BASE, RANDOM_MAP.file, LOGO_EXT);
          mapLabels[i].textContent = RANDOM_MAP.name;
        }
      } else {
        labels[i].innerHTML = `<span class="upcoming-text">UPCOMING</span>`;
      }
    }
  }
}

function loadStandingsLogoCaseInsensitive(imgEl, tag) {
  const variants = buildCaseVariants(tag);
  let attempt = 0;

  function tryNext() {
    if (attempt >= variants.length) {
      imgEl.style.display = "none";
      imgEl.onerror = null;
      return;
    }
    const candidate = `${LOGO_BASE}${variants[attempt]}${LOGO_EXT}`;
    attempt++;
    imgEl.onerror = tryNext;
    imgEl.src = candidate;
  }
  tryNext();
}

function loadTeamLogoCaseInsensitive(imgEl, tag) {
  const variants = buildCaseVariants(tag);
  let attempt = 0;
  console.log(`[logo] starting fallback chain for tag="${tag}" variants=${JSON.stringify(variants)}`);

  function tryNext() {
    if (attempt >= variants.length) {
      imgEl.classList.remove("visible");
      console.warn(`[logo] ALL variants failed for tag="${tag}"`);
      imgEl.onerror = null;
      return;
    }
    const candidate = `${LOGO_BASE}${variants[attempt]}${LOGO_EXT}`;
    console.log(`[logo] attempt ${attempt + 1}/${variants.length} for tag="${tag}": ${candidate}`);
    attempt++;
    imgEl.onload = () => {
      console.log(`[logo] SUCCESS: ${candidate}`);
      imgEl.classList.add("visible");
    };
    imgEl.onerror = () => {
      console.warn(`[logo] FAILED: ${candidate} \u2014 trying next variant`);
      tryNext();
    };
    imgEl.src = candidate;
  }
  tryNext();
}

const showDebug = !location.search.includes("nodebug");
if (!showDebug) document.getElementById("debug").style.display = "none";
const dbEl = document.getElementById("debug-body");

function logDebug() {
  if (!showDebug) return;
  const lines = [
    `\u23f1 ${new Date().toLocaleTimeString()}`,
    `Protocol: ${location.protocol} ${isFileProtocol ? "(file-relative paths in use)" : "(absolute paths in use)"}`,
    `Logo base: ${LOGO_BASE}`,
    `Map base: ${MAP_BASE}`,
    `Random map: ${RANDOM_MAP.name}`,
    ``
  ];
  booyahTags.forEach((tag, i) => {
    if (tag) {
      lines.push(`\u2705 GAME ${i+1}: BOOYAH \u2192 ${tag}`);
    } else if (i === booyahTags.findIndex(t => !t)) {
      lines.push(`\u26a0\ufe0f GAME ${i+1}: COMING AHEAD`);
    } else {
      lines.push(`   GAME ${i+1}: UPCOMING`);
    }
  });
  dbEl.innerHTML = lines.map(l => {
    if (l.startsWith("\u274c")) return `<span class="err">${l}</span>`;
    if (l.startsWith("\u26a0\ufe0f")) return `<span class="warn">${l}</span>`;
    if (l.startsWith("\u2705")) return `<span class="ok">${l}</span>`;
    return l;
  }).join("\n");
}

function resetEl(el) {
  el.style.transition = 'none';
  el.style.opacity    = '0';
  el.style.transform  = `translateX(${slideOffset})`;
}

function slideEl(el, inOrOut, delay) {
  setTimeout(() => {
    el.style.transition = `opacity ${SLIDE_DUR}ms ease, transform ${SLIDE_DUR}ms ease`;
    el.style.opacity    = inOrOut === 'in' ? '1' : '0';
    el.style.transform  = inOrOut === 'in' ? 'translateX(0)' : `translateX(${slideOffset})`;
  }, delay);
}

function slideStandings(inOrOut) {
  const els = [standTitleEl, standColEl, ...standingsRows];
  if (inOrOut === 'in') {
    els.forEach((el, i) => slideEl(el, 'in', i * STAGGER));
  } else {
    [...els].reverse().forEach((el, i) => slideEl(el, 'out', i * STAGGER));
  }
}

function resetStandings() {
  [standTitleEl, standColEl, ...standingsRows].forEach(el => resetEl(el));
}

function runCycle() {
  standingsEl.style.display = "none";
  mainEl.style.display      = "grid";
  allBoxes.forEach(box => resetEl(box));

  setTimeout(() => {
    allBoxes.forEach((box, i) => slideEl(box, 'in', i * STAGGER));
  }, 50);

  const mapsInDone = 50 + NUM_BOXES * STAGGER + SLIDE_DUR;
  const mapsOutAt  = mapsInDone + STAY_DUR;

  setTimeout(() => {
    for (let i = 0; i < NUM_BOXES; i++) {
      slideEl(allBoxes[NUM_BOXES - 1 - i], 'out', i * STAGGER);
    }
  }, mapsOutAt);

  const mapsClearAt = mapsOutAt + NUM_BOXES * STAGGER + SLIDE_DUR;

  setTimeout(() => {
    mainEl.style.display      = "none";
    standingsEl.style.display = "flex";
    resetStandings();
    setTimeout(() => slideStandings('in'), 50);
  }, mapsClearAt);

  const standsInDone = mapsClearAt + 50 + STAND_COUNT * STAGGER + SLIDE_DUR;
  const standsOutAt  = standsInDone + STAY_DUR;

  setTimeout(() => slideStandings('out'), standsOutAt);

  const standsClearAt = standsOutAt + STAND_COUNT * STAGGER + SLIDE_DUR;

  setTimeout(() => runCycle(), standsClearAt);
}

attachBooyahListener();
runCycle();