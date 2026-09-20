"use strict";
// =====================================================================
//  AUDIO: effetti e musica chiptune (WebAudio), una musica per mondo
// =====================================================================
const AC = { ctx: null, master: null, muto: false, prossima: 0, n: 0, rumore: null, mondo: -1, lead: [] };

function avviaAudio() {
  if (AC.ctx) {
    if (AC.ctx.state === "suspended") AC.ctx.resume();
    return;
  }
  try {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return;
    AC.ctx = new Ctor();
    AC.master = AC.ctx.createGain();
    AC.master.gain.value = AC.muto ? 0 : 0.28;
    AC.master.connect(AC.ctx.destination);
    AC.prossima = AC.ctx.currentTime + 0.1;
    AC.n = 0;
    // rumore bianco per i "charleston"
    const len = Math.floor(AC.ctx.sampleRate * 0.06), buf = AC.ctx.createBuffer(1, len, AC.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    AC.rumore = buf;
  } catch (e) { AC.ctx = null; }
}

function impostaSuono(muto) {
  AC.muto = muto;
  if (AC.master) AC.master.gain.value = muto ? 0 : 0.28;
}

function beep(f0, f1, dur, forma, vol, ritardo) {
  if (!AC.ctx || AC.muto) return;
  const t0 = AC.ctx.currentTime + (ritardo || 0);
  const o = AC.ctx.createOscillator(), g = AC.ctx.createGain();
  o.type = forma || "square";
  o.frequency.setValueAtTime(f0, t0);
  o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g); g.connect(AC.master);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

function suono(nome) {
  switch (nome) {
    case "salto": beep(300, 620, 0.12, "square", 0.2); break;
    case "salto2": beep(460, 940, 0.12, "square", 0.2); break;
    case "moneta": beep(988, 988, 0.05, "square", 0.16); beep(1319, 1319, 0.14, "square", 0.16, 0.05); break;
    case "spara": beep(950, 320, 0.09, "sawtooth", 0.12); break;
    case "colpito": beep(240, 60, 0.15, "square", 0.22); break;
    case "stomp": beep(150, 540, 0.1, "square", 0.24); break;
    case "male": beep(330, 90, 0.25, "sawtooth", 0.26); beep(220, 70, 0.25, "square", 0.2, 0.07); break;
    case "morte": beep(420, 60, 0.75, "sawtooth", 0.26); break;
    case "atterra": beep(120, 60, 0.05, "triangle", 0.18); break;
    case "molla": beep(180, 900, 0.22, "square", 0.22); break;
    case "splash": beep(700, 120, 0.3, "sawtooth", 0.1); beep(300, 80, 0.3, "triangle", 0.2); break;
    case "cuore": [523, 659, 784].forEach((f, i) => beep(f, f, 0.1, "triangle", 0.24, i * 0.06)); break;
    case "boss": beep(90, 45, 0.5, "sawtooth", 0.3); break;
    case "bossKO": [330, 262, 220, 165, 110].forEach((f, i) => beep(f, f * 0.9, 0.3, "sawtooth", 0.24, i * 0.14)); break;
    case "checkpoint": [523, 659, 784].forEach((f, i) => beep(f, f, 0.14, "square", 0.18, i * 0.09)); break;
    case "livello": [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => beep(f, f, 0.18, "square", 0.2, i * 0.1)); break;
    case "vita": [659, 784, 988, 1319].forEach((f, i) => beep(f, f, 0.1, "square", 0.18, i * 0.07)); break;
    case "gameover": [392, 330, 262, 196].forEach((f, i) => beep(f, f * 0.98, 0.3, "triangle", 0.28, i * 0.25)); break;
    case "menu": beep(600, 800, 0.06, "square", 0.14); break;
  }
}

// ---------------- musica: una per mondo ----------------
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
const MUSICHE = [
  { bpm: 128, cordi: [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]], bassi: [48, 43, 45, 41], arp: "square", lead: "triangle" },   // prato
  { bpm: 112, cordi: [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62]], bassi: [45, 41, 48, 43], arp: "square", lead: "triangle" },   // bosco
  { bpm: 104, cordi: [[62, 65, 69], [58, 62, 65], [53, 57, 60], [60, 64, 67]], bassi: [50, 46, 41, 48], arp: "triangle", lead: "square" },   // grotta
  { bpm: 96, cordi: [[64, 67, 71], [60, 64, 67], [55, 59, 62], [62, 66, 69]], bassi: [40, 48, 43, 50], arp: "triangle", lead: "triangle" }, // neve
  { bpm: 150, cordi: [[57, 60, 64], [55, 59, 62], [53, 57, 60], [52, 56, 59]], bassi: [45, 43, 41, 40], arp: "sawtooth", lead: "square" },  // vulcano
  { bpm: 100, cordi: [[57, 60, 64], [50, 53, 57], [52, 56, 59], [57, 60, 64]], bassi: [45, 38, 40, 45], arp: "square", lead: "sawtooth" },  // villa
  // ---- castello ----
  { bpm: 104, cordi: [[62, 65, 69], [58, 62, 65], [55, 58, 62], [57, 61, 64]], bassi: [50, 46, 43, 45], arp: "square", lead: "triangle" },   // ingresso
  { bpm: 92, cordi: [[57, 60, 64], [53, 57, 60], [52, 55, 59], [57, 60, 64]], bassi: [45, 41, 40, 45], arp: "triangle", lead: "square" },    // biblioteca
  { bpm: 120, cordi: [[60, 63, 67], [56, 60, 63], [58, 62, 65], [55, 58, 62]], bassi: [48, 44, 46, 43], arp: "square", lead: "triangle" },   // orologio
  { bpm: 110, cordi: [[59, 62, 66], [55, 59, 62], [57, 60, 64], [54, 58, 61]], bassi: [47, 43, 45, 42], arp: "triangle", lead: "square" },   // alchimista
  { bpm: 100, cordi: [[64, 67, 71], [62, 66, 69], [60, 64, 67], [59, 63, 66]], bassi: [40, 50, 48, 47], arp: "triangle", lead: "triangle" }, // serra
  { bpm: 132, cordi: [[57, 60, 64], [56, 59, 63], [53, 57, 60], [52, 56, 59]], bassi: [45, 44, 41, 40], arp: "sawtooth", lead: "square" }    // torre del conte
];
let bossMusica = false;

function preparaMusica(mondo) {
  if (AC.mondo === mondo) return;
  AC.mondo = mondo;
  AC.n = 0;
  const m = MUSICHE[mondo], R = rng(700 + mondo * 13);
  AC.lead = [];
  for (let i = 0; i < 32; i++) {
    const acc = Math.floor(i / 8) % 4;
    AC.lead.push(R() < 0.6 ? m.cordi[acc][Math.floor(R() * 3)] + 12 + (R() < 0.25 ? 12 : 0) : 0);
  }
}

function notaMusica(nota, t0, dur, forma, vol) {
  const o = AC.ctx.createOscillator(), g = AC.ctx.createGain();
  o.type = forma;
  o.frequency.value = midi(nota);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g); g.connect(AC.master);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

function suonaPasso(n, t0, passo, m) {
  const acc = Math.floor(n / 8) % 4;
  notaMusica(m.cordi[acc][n % 3] + 12, t0, passo * 0.85, m.arp, 0.024);
  if (n % 4 === 0) notaMusica(m.bassi[acc], t0, passo * 3.4, "triangle", 0.11);
  const ld = AC.lead[n % 32];
  if (ld) notaMusica(ld, t0, passo * 1.6, m.lead, 0.045);
  // percussioni
  if (n % 8 === 0 || n % 8 === 5) {
    const o = AC.ctx.createOscillator(), g = AC.ctx.createGain();
    o.frequency.setValueAtTime(140, t0); o.frequency.exponentialRampToValueAtTime(40, t0 + 0.1);
    g.gain.setValueAtTime(0.16, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.12);
    o.connect(g); g.connect(AC.master); o.start(t0); o.stop(t0 + 0.14);
  }
  if (n % 2 === 1 && AC.rumore) {
    const s = AC.ctx.createBufferSource(), g = AC.ctx.createGain(), f = AC.ctx.createBiquadFilter();
    s.buffer = AC.rumore; f.type = "highpass"; f.frequency.value = 7000;
    g.gain.setValueAtTime(0.035, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.04);
    s.connect(f); f.connect(g); g.connect(AC.master); s.start(t0);
  }
}

function musicaAttiva() {
  return AC.ctx && !AC.muto && (stato === "menu" || stato === "gioco" || stato === "fineLivello" || stato === "vittoria");
}

setInterval(() => {
  if (!AC.ctx) return;
  if (!musicaAttiva()) { AC.prossima = AC.ctx.currentTime + 0.05; return; }
  const mondo = stato === "menu" ? 0 : Math.max(0, livIdx);
  preparaMusica(mondo);
  const m = MUSICHE[mondo];
  const bpm = m.bpm * (bossMusica ? 1.25 : 1);
  const passo = 60 / bpm / 2;
  while (AC.prossima < AC.ctx.currentTime + 0.15) {
    suonaPasso(AC.n, AC.prossima, passo, m);
    AC.prossima += passo;
    AC.n++;
  }
}, 40);
// =====================================================================
//  PIXEL ART: sprite disegnati a mano (ogni lettera = un colore)
// =====================================================================
function creaCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return c;
}

// converte righe di testo in un canvas; pal: lettera -> colore
function sprite(righe, pal) {
  const h = righe.length, w = righe[0].length;
  const c = creaCanvas(w, h);
  const x = c.getContext("2d");
  for (let j = 0; j < h; j++) {
    if (righe[j].length !== w) throw new Error("riga lunga " + righe[j].length + " invece di " + w + " (riga " + j + "): " + righe[j]);
    for (let i = 0; i < w; i++) {
      const ch = righe[j][i];
      if (ch === "." || ch === " ") continue;
      const col = pal[ch];
      if (!col) throw new Error("colore mancante '" + ch + "' riga " + j);
      x.fillStyle = col;
      x.fillRect(i, j, 1, 1);
    }
  }
  return c;
}

function componi(w, h, pezzi) {
  const c = creaCanvas(w, h);
  const x = c.getContext("2d");
  for (const [img, px, py] of pezzi) x.drawImage(img, px, py);
  return c;
}

function specchia(img) {
  const c = creaCanvas(img.width, img.height);
  const x = c.getContext("2d");
  x.translate(img.width, 0);
  x.scale(-1, 1);
  x.drawImage(img, 0, 0);
  return c;
}

// ---------------------------------------------------------------------
//  TOMMY (16 x 22), rivolto a destra
// ---------------------------------------------------------------------
const PAL_TOMMY = {
  o: "#2a1b3d", s: "#ffd9b0", S: "#e8a679", k: "#2a1b3d", w: "#ffffff", m: "#ff9a9a",
  r: "#f0424d", R: "#b52538", h: "#ff8f95", n: "#7a4a2b",
  b: "#3f8cff", B: "#2a5fd1", c: "#9cd0ff", y: "#ffd23f", Y: "#e59a1a",
  p: "#3b4bb0", P: "#2a3585", e: "#f4f4ff", E: "#b9bfe0"
};

const TOMMY_TESTA = [
  ".....oooooo.....",
  "...oooRRRRooo...",
  "..orrrrhhhrrro..",
  ".orrrrhhrrrrrro.",
  ".orrrrrrrrrrrrro",
  ".oRRRRRRRRRRRRoo",
  ".onnsssssssssoo.",
  ".onssssssskwsso.",
  "..osssssssskkso.",
  "..osssssssskkso.",
  "..oSssssmmsssso.",
  "...oSSssssssSo..",
  "....ooyyyyyoo...",
  "...oyyyYYyyyyo..",
  "..oyyyyyyyyyyyo.",
  "..obbcbbbbbbbbo."
];

const TOMMY_TORSO = [
  "...obbbbbbbbsso.",
  "...oBbbbbbbbBso.",
  "...oppppppppPo.."
];

const TOMMY_TORSO_ARM_SU = [
  "...obbbbbbbbbo..",
  "...oBbbbbbbbBo..",
  "...oppppppppPo.."
];

const TOMMY_GAMBE = {
  fermo: [
    "...opppoopppo...",
    "...opppoopppo...",
    "..oEeeeoEeeeo..."
  ],
  passo1: [
    ".opppo...opppo..",
    ".opppo....opppo.",
    "oEeeeo....oEeeeo"
  ],
  passo2: [
    "...opppo.opppo..",
    "....opPo.opppo..",
    "...oEeeo.oEeeeo."
  ],
  passo3: [
    "..opppo...opppo.",
    ".opppo....opppo.",
    "oEeeeo....oEeeeo"
  ],
  passo4: [
    "..opppo.opppo...",
    "..opppo.opPo....",
    ".oEeeeo.oEeeo..."
  ],
  salto: [
    "..opppo..opppo..",
    "..oEeeo..oEeeo..",
    "................"
  ],
  caduta: [
    ".opppo....opppo.",
    ".oEeeo....oEeeo.",
    "................"
  ]
};

function costruisciTommy() {
  const testa = sprite(TOMMY_TESTA, PAL_TOMMY);
  const torso = sprite(TOMMY_TORSO, PAL_TOMMY);
  const gambe = {};
  for (const k in TOMMY_GAMBE) gambe[k] = sprite(TOMMY_GAMBE[k], PAL_TOMMY);
  const frame = (g, dy) => componi(16, 22, [[gambe[g], 0, 19], [torso, 0, 16 + dy], [testa, 0, dy]]);
  const T = {
    fermo: [frame("fermo", 0), frame("fermo", 1)],
    corsa: [frame("passo1", 0), frame("passo2", 1), frame("passo3", 0), frame("passo4", 1)],
    salto: frame("salto", 0),
    caduta: frame("caduta", 0),
  };
  T.male = componi(16, 22, [[gambe.caduta, 0, 19], [torso, 0, 17], [testa, 0, 1]]);
  return T;
}
// ---------------------------------------------------------------------
//  NEMICI, OGGETTI, DECORAZIONI (pixel art a mano, con palette per tema)
// ---------------------------------------------------------------------
const SLIME_A = [
  "................",
  "................",
  "................",
  "......oooooo....",
  "....ooggllggoo..",
  "...oggllgggggoo.",
  "..oggggggggggGo.",
  "..ogwwkgggwwkgo.",
  "..ogwkkgggwkkGo.",
  ".oggggggggggggGo",
  ".oGgggggggggGGGo",
  "..oooooooooooo.."
];
const SLIME_B = [
  "................",
  "................",
  "................",
  "................",
  "................",
  "....oooooooo....",
  "..ooggllgggggoo.",
  ".oggllgggggggggo",
  ".ogwwkgggggwwkgo",
  ".ogwkkgggggwkkGo",
  "oGGgggggggggggGo",
  ".ooooooooooooooo"
];

const VOLATILE_A = [
  "................",
  ".oo..........oo.",
  ".obo...oo...obo.",
  ".obbo.obbo.obbo.",
  ".obbbooBBoobbbo.",
  "..obbbbbbbbbbo..",
  "...obbwkbwkbo...",
  "....obbbbbbo....",
  ".....obbbbo.....",
  "......oooo......",
  "................",
  "................"
];
const VOLATILE_B = [
  "................",
  "................",
  "................",
  "................",
  "oo..o......o..oo",
  "obboobo..obooobo",
  "obbbobbooobbobbo",
  ".obbbbbbbbbbbbo.",
  "..obbbwkbwkbbo..",
  "...oobbbbbboo...",
  ".....oobbbo.....",
  ".......ooo......"
];

const RICCIO_A = [
  "................",
  "................",
  "....o.o.o.o.....",
  "...oQoQoQoQo....",
  "..oQQQQQQQQQo...",
  ".oQQqQQqQQqQQo..",
  ".oQQQQQQQQQQosso",
  ".oqQQQQQQQQQosko",
  ".oQQQQQQQQQQosso",
  "..oQQQQQQQQoosso",
  "...ooooooooooo..",
  "....oo....oo...."
];
const RICCIO_B = [
  "................",
  "................",
  "................",
  "....o.o.o.o.....",
  "...oQoQoQoQo....",
  "..oQQQQQQQQQo...",
  ".oQQqQQqQQqQQo..",
  ".oQQQQQQQQQQosso",
  ".oqQQQQQQQQQosko",
  ".oQQQQQQQQQQosso",
  "..oQQQQQQQQoosso",
  "...ooooooooooo.."
];

const FANTASMA_A = [
  "................",
  ".....oooooo.....",
  "...ooWWWWWWoo...",
  "..oWWWWWWWWWWo..",
  ".oWWWWWWWWWWWWo.",
  ".oWWkkWWWWkkWWo.",
  ".oWWkkWWWWkkWWo.",
  ".oWmWWWWWWWWmWo.",
  ".oWWWWooooWWWWo.",
  ".oWWWWWooWWWWWo.",
  ".oGWWWWWWWWWWGo.",
  ".oGGWWWWWWWWGGo.",
  ".oGGGWWoWWWGGGo.",
  "..oGoWWooWWoGoo.",
  "...o.oo..oo.o...",
  "................"
];
const FANTASMA_SHY = [
  "................",
  ".....oooooo.....",
  "...ooWWWWWWoo...",
  "..oWWWWWWWWWWo..",
  ".oWWWWWWWWWWWWo.",
  ".oWWWWWWWWWWWWo.",
  ".oWWoooWWoooWWo.",
  ".oWoWWWoooWWWoo.",
  ".oWoWWWWWWWWWoo.",
  ".oWWooWWWWooWWo.",
  ".oGWWWWWWWWWWGo.",
  ".oGGWWWWWWWWGGo.",
  ".oGGGWWoWWWGGGo.",
  "..oGoWWooWWoGoo.",
  "...o.oo..oo.o...",
  "................"
];

const MONETA = [
  [
    "..oooo..",
    ".oyyyyo.",
    "oyyhhyyo",
    "oyhyyyYo",
    "oyhyyyYo",
    "oyyyyYYo",
    ".oyYYYo.",
    "..oooo.."
  ],
  [
    "...oo...",
    "..oyyo..",
    ".oyhyYo.",
    ".oyhyYo.",
    ".oyyyYo.",
    ".oyyyYo.",
    "..oYYo..",
    "...oo..."
  ],
  [
    "...oo...",
    "...oy...",
    "...oy...",
    "...oY...",
    "...oY...",
    "...oY...",
    "...oY...",
    "...oo..."
  ]
];
const CUORE_PIENO = [
  ".oo..oo..",
  "orrooRRRo",
  "orhrrrrRo",
  "orhrrrrRo",
  ".orrrrRo.",
  "..orrRo..",
  "...oRo...",
  "....o...."
];
const CUORE_VUOTO = [
  ".oo..oo..",
  "oddoodddo",
  "oddddddoo",
  "oddddddoo",
  ".oddddo..",
  "..oddo...",
  "...odo...",
  "....o...."
];
const STELLA_SPARO = [
  "...oo...",
  "..oyyo..",
  "ooyhhyoo",
  "oyhwwhyo",
  ".oyhhyo.",
  ".oyyyyo.",
  "oyyoooyo",
  ".oo..oo."
];
const MOLLA_SU = [
  "................",
  "................",
  "................",
  "................",
  "................",
  "..oooooooooooo..",
  ".orrrhhhrrrrrRo.",
  ".oRRRRRRRRRRRRo.",
  "..oooooooooooo..",
  "....oGgoGgoGo...",
  ".....oGoGoGo....",
  "....oGgoGgoGo...",
  ".....oGoGoGo....",
  "...oooooooooo...",
  "..oGGGGGGGGGGo..",
  "..oooooooooooo.."
];
const MOLLA_GIU = [
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "..oooooooooooo..",
  ".orrrhhhrrrrrRo.",
  ".oRRRRRRRRRRRRo.",
  "..oooooooooooo..",
  "...oGGoGGoGGo...",
  "..oGGGGGGGGGGo..",
  "..oooooooooooo.."
];
const BANDIERA_ASTA = [
  "..oo",
  ".oGo",
  ".oGo"
];

const CHIAVE = [
  "..oooo..........",
  ".oyyyyo.........",
  "oyyhhyyoooooooo.",
  "oyh..hyyyyyyyyo.",
  "oyh..hyoooooyyo.",
  "oyyhhyyo...oyyo.",
  ".oyyyyo....oooo.",
  "..oooo.........."
];
const GEMMA = [
  "...oooooo...",
  "..oCCCCCCo..",
  ".oCcWWcCCBo.",
  "oCcWccCCCBBo",
  "oCcCCCCCCBBo",
  "oCCCCCCCCBBo",
  ".oCCCCCCBBo.",
  "..oCCCCBBo..",
  "...oCCBBo...",
  "....oCBo....",
  ".....oo....."
];
// =====================================================================
//  MONDI: temi, sfondi in parallasse, tile del terreno, decorazioni
// =====================================================================
const TILE = 16, VW = 400, VH = 224, ROWS = 14, SCALE = 3;
const STRIP = 512;          // larghezza degli strati di sfondo (si ripetono)
const LIQ_Y = 192;          // altezza della superficie del liquido nei buchi

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function rng(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash2(a, b) {
  let h = (Math.imul(a, 374761393) + Math.imul(b, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

function hexRgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }

// ---------------------------------------------------------------------
//  Primitive per disegnare "a pixel" (niente antialiasing)
// ---------------------------------------------------------------------
function R_(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w, h); }

function disco(c, cx, cy, r, col) {
  c.fillStyle = col;
  for (let y = -r; y <= r; y++) {
    const w = Math.floor(Math.sqrt(r * r - y * y + 0.25));
    c.fillRect(cx - w, cy + y, w * 2 + 1, 1);
  }
}

// poligono riempito a scanline (bordi netti)
function poli(c, pts, col) {
  let y0 = Infinity, y1 = -Infinity;
  for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  c.fillStyle = col;
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
    const yy = y + 0.5, xs = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      if ((a[1] <= yy && b[1] > yy) || (b[1] <= yy && a[1] > yy)) {
        xs.push(a[0] + (yy - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
      }
    }
    xs.sort((p, q) => p - q);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      const xa = Math.round(xs[i]), xb = Math.round(xs[i + 1]);
      if (xb > xa) c.fillRect(xa, y, xb - xa, 1);
    }
  }
}

// cielo a bande con retino (dithering) come nella pixel art classica
function creaCielo(cols) {
  const cv = creaCanvas(VW, VH), c = cv.getContext("2d");
  const img = c.createImageData(VW, VH);
  const rgb = cols.map(hexRgb), B = rgb.length - 1;
  for (let y = 0; y < VH; y++) {
    const t = clamp(y / (VH * 0.86), 0, 0.9999) * B;
    const b = Math.floor(t), f = t - b;
    for (let x = 0; x < VW; x++) {
      const soglia = ((x + y) & 1) ? 0.3 : 0.7;
      const k = f > soglia ? b + 1 : b;
      const i = (y * VW + x) * 4;
      img.data[i] = rgb[k][0]; img.data[i + 1] = rgb[k][1]; img.data[i + 2] = rgb[k][2]; img.data[i + 3] = 255;
    }
  }
  c.putImageData(img, 0, 0);
  return cv;
}

// ---------------------------------------------------------------------
//  TEMI
// ---------------------------------------------------------------------
const TEMI = [
  { nome: "Prato Soleggiato",
    cielo: ["#3f9cff", "#6cbcff", "#9ad8ff", "#c8ecff"],
    astro: { tipo: "sole", col: "#fff3a0", alone: "#ffffff", x: 300, y: 46 }, stelle: false,
    nuvole: { col: "#ffffff", ombra: "#cfe6ff" },
    strati: [
      { tipo: "montagne", col: "#93c3ea", chiaro: "#b9dbf5", base: 138, alt: 62, par: 0.08 },
      { tipo: "colline", col: "#7fdc92", chiaro: "#a4eeaf", base: 158, alt: 40, par: 0.2 },
      { tipo: "alberi", col: "#3fae5a", chiaro: "#69d47c", scuro: "#2a8a46", tronco: "#7a4a2b", base: 174, par: 0.34 }
    ],
    terra: "#9a6234", terraScura: "#7b4b27", terraChiara: "#bd8650",
    erba: "#5bd04a", erbaChiara: "#96f27f", erbaScura: "#2f9e3e", contorno: "#2a1f2e", capTipo: "erba",
    legno: "#d39352", legnoScuro: "#8e5a2b", legnoChiaro: "#f0b878",
    liquido: { tipo: "acqua", col: "#3aa0ff", chiaro: "#9ad8ff", scuro: "#1f68c8" }, buio: "#0e3260",
    particelle: "farfalle", decoro: ["ciuffo", "fiore", "fiore2", "ciuffo", "sasso"],
    slime: { g: "#5fdc6e", G: "#2fa04a", l: "#c4ffb8" }, volatile: { b: "#ffb84a", B: "#d9822a" },
    riccio: { Q: "#8a5a3a", q: "#a87550" }, fantasma: { W: "#f4f6ff", G: "#c3c9ee" },
    ghiaccio: false },

  { nome: "Bosco al Tramonto",
    cielo: ["#5a3f96", "#b85290", "#ee8a6e", "#ffc47c"],
    astro: { tipo: "sole", col: "#ffe08a", alone: "#ffb070", x: 290, y: 118 }, stelle: true,
    nuvole: { col: "#ffb6a0", ombra: "#d8708a" },
    strati: [
      { tipo: "montagne", col: "#8a4c94", chiaro: "#ad68a8", base: 140, alt: 56, par: 0.08 },
      { tipo: "pini", col: "#4a2f78", chiaro: "#654096", base: 164, alt: 46, par: 0.2 },
      { tipo: "pini", col: "#2f2058", chiaro: "#432e74", base: 182, alt: 58, par: 0.36 }
    ],
    terra: "#6b4530", terraScura: "#513422", terraChiara: "#8b6040",
    erba: "#7ccb3a", erbaChiara: "#b6ee5c", erbaScura: "#3f9a30", contorno: "#241830", capTipo: "erba",
    legno: "#c98a4b", legnoScuro: "#7e4f28", legnoChiaro: "#eab070",
    liquido: { tipo: "acqua", col: "#3a5fc0", chiaro: "#8aa8ff", scuro: "#24408c" }, buio: "#1a1240",
    particelle: "lucciole", decoro: ["ciuffo", "fungo", "fungo", "ciuffo", "sasso"],
    slime: { g: "#ffb04a", G: "#d9772a", l: "#ffe4a0" }, volatile: { b: "#8a63d6", B: "#5b3f8a" },
    riccio: { Q: "#7a4a30", q: "#9a6a48" }, fantasma: { W: "#fff0f4", G: "#e8c0d0" },
    ghiaccio: false },

  { nome: "Grotta di Cristallo",
    cielo: ["#160b34", "#27134f", "#3d1e6e", "#55298c"],
    astro: null, stelle: false, nuvole: null,
    strati: [
      { tipo: "stalagmiti", col: "#3a2470", chiaro: "#54388c", base: 168, alt: 74, par: 0.1 },
      { tipo: "cristalli", col: "#5f3fb0", chiaro: "#a28aff", luce: "#7ae8ff", base: 176, alt: 60, par: 0.24 },
      { tipo: "cristalli", col: "#3fc0e0", chiaro: "#b8fbff", luce: "#ffffff", base: 192, alt: 44, par: 0.4 }
    ],
    terra: "#4a3a82", terraScura: "#382a68", terraChiara: "#6d5cae",
    erba: "#4ce0d0", erbaChiara: "#a8fff2", erbaScura: "#2a9ab4", contorno: "#1a1030", capTipo: "erba",
    legno: "#8a6ad6", legnoScuro: "#5a3fa0", legnoChiaro: "#c0a6ff",
    liquido: { tipo: "acqua", col: "#2ad0ff", chiaro: "#a0f5ff", scuro: "#1a6cc0" }, buio: "#0a0620",
    particelle: "scintille", decoro: ["cristallo", "cristallo", "ciuffo", "cristallo2", "sasso"],
    slime: { g: "#d67aff", G: "#9a44c8", l: "#f6c8ff" }, volatile: { b: "#5fe0ff", B: "#2a9ab4" },
    riccio: { Q: "#6a5aa8", q: "#8a7ac8" }, fantasma: { W: "#e8f4ff", G: "#a8c8f0" },
    ghiaccio: false },

  { nome: "Montagne Innevate",
    cielo: ["#7fb0e8", "#a8d0f5", "#cfe6fb", "#eef6ff"],
    astro: { tipo: "sole", col: "#ffffff", alone: "#e0f0ff", x: 320, y: 50 }, stelle: false,
    nuvole: { col: "#f4f8ff", ombra: "#b8cce8" },
    strati: [
      { tipo: "montagne", col: "#8aa8d4", chiaro: "#b8d0f0", base: 146, alt: 96, par: 0.08, neve: true },
      { tipo: "pini", col: "#4a7a88", chiaro: "#6aa0a8", base: 166, alt: 46, par: 0.22, neve: true },
      { tipo: "pini", col: "#2f5a6a", chiaro: "#4a8090", base: 184, alt: 60, par: 0.38, neve: true }
    ],
    terra: "#7d96c4", terraScura: "#607aa8", terraChiara: "#a4bce6",
    erba: "#f4faff", erbaChiara: "#ffffff", erbaScura: "#b6d2f0", contorno: "#23305a", capTipo: "neve",
    legno: "#b8d4ee", legnoScuro: "#6a8cc0", legnoChiaro: "#eaf6ff",
    liquido: { tipo: "acqua", col: "#2a62a8", chiaro: "#8ac0f0", scuro: "#1a3c78" }, buio: "#0c2450",
    particelle: "neve", decoro: ["pupazzo", "neveciuffo", "neveciuffo", "sasso", "neveciuffo"],
    slime: { g: "#7ad0ff", G: "#3a90d8", l: "#d4f4ff" }, volatile: { b: "#e8f2ff", B: "#9ab8e0" },
    riccio: { Q: "#8ab0d0", q: "#b0d0ea" }, fantasma: { W: "#ffffff", G: "#c8dcf5" },
    ghiaccio: true },

  { nome: "Vulcano di Fuoco",
    cielo: ["#2c0f2c", "#701c2a", "#c0401c", "#ff9a30"],
    astro: null, stelle: false, nuvole: null,
    strati: [
      { tipo: "vulcano", col: "#3c1622", chiaro: "#5a2430", lava: "#ff7a1a", base: 162, alt: 110, par: 0.08 },
      { tipo: "montagne", col: "#2e1020", chiaro: "#4a1c2c", base: 176, alt: 60, par: 0.22 },
      { tipo: "stalagmiti", col: "#1e0a16", chiaro: "#341424", base: 192, alt: 50, par: 0.4 }
    ],
    terra: "#4c2c32", terraScura: "#36202a", terraChiara: "#70444a",
    erba: "#e0521a", erbaChiara: "#ffc040", erbaScura: "#9a2a18", contorno: "#1a0a12", capTipo: "magma",
    legno: "#8a5a4a", legnoScuro: "#5a3428", legnoChiaro: "#c08a6a",
    liquido: { tipo: "lava", col: "#ff5a1a", chiaro: "#ffd060", scuro: "#c2251a" }, buio: "#3a0a0a",
    particelle: "braci", decoro: ["roccia", "brace", "roccia", "brace", "sasso"],
    slime: { g: "#ff6a4a", G: "#c22a2a", l: "#ffc8a0" }, volatile: { b: "#ff8a2a", B: "#c2451a" },
    riccio: { Q: "#5a3a3a", q: "#8a5a4a" }, fantasma: { W: "#ffe8d8", G: "#f0b090" },
    ghiaccio: false },

  { nome: "Villa Scura",
    cielo: ["#0c0824", "#1c1040", "#36194c", "#5c2452"],
    astro: { tipo: "luna", col: "#fff0d0", alone: "#ffe0b0", x: 300, y: 56 }, stelle: true,
    nuvole: null,
    strati: [
      { tipo: "montagne", col: "#2a1a4e", chiaro: "#3c2868", base: 146, alt: 62, par: 0.08 },
      { tipo: "villa", col: "#150b2a", chiaro: "#241442", base: 172, alt: 90, par: 0.22 },
      { tipo: "alberispogli", col: "#0c0618", chiaro: "#180c2c", base: 192, alt: 70, par: 0.4 }
    ],
    terra: "#3c2c50", terraScura: "#2a1e3c", terraChiara: "#584070",
    erba: "#9a5cff", erbaChiara: "#cfa0ff", erbaScura: "#5a30b4", contorno: "#12081e", capTipo: "erba",
    legno: "#7a5a8a", legnoScuro: "#4a3458", legnoChiaro: "#b090c8",
    liquido: { tipo: "acqua", col: "#6a30b8", chiaro: "#c08aff", scuro: "#3c1a78" }, buio: "#0a0418",
    particelle: "polvere", decoro: ["lapide", "zucca", "candela", "lapide", "ciuffo"],
    slime: { g: "#7ad06a", G: "#3a8a40", l: "#d0ffb8" }, volatile: { b: "#5a4a8a", B: "#382c62" },
    riccio: { Q: "#5a4a6a", q: "#7a6a8a" }, fantasma: { W: "#f4f6ff", G: "#b8b8e8" },
    ghiaccio: false }
];

// ---------------------------------------------------------------------
//  SFONDO A STRATI
// ---------------------------------------------------------------------
function striscia() {
  const cv = creaCanvas(STRIP, VH);
  return { cv, c: cv.getContext("2d") };
}

// altezza periodica (si ripete ogni STRIP pixel)
function ondaPer(x, R, n) {
  let h = 0, amp = 1, tot = 0;
  for (let i = 0; i < n; i++) {
    const k = 1 + Math.floor(R() * 3) + i * 3;
    h += amp * Math.sin(2 * Math.PI * k * x / STRIP + R() * 6.28);
    tot += amp; amp *= 0.55;
  }
  return h / tot;
}

function stratoMontagne(s, seed) {
  const { cv, c } = striscia();
  const R = rng(seed);
  const fasi = []; for (let i = 0; i < 4; i++) fasi.push([1 + Math.floor(R() * 3) + i * 3, R() * 6.28, Math.pow(0.55, i)]);
  const alt = [];
  for (let x = 0; x < STRIP; x++) {
    let h = 0, tot = 0;
    for (const [k, f, a] of fasi) { h += a * Math.sin(2 * Math.PI * k * x / STRIP + f); tot += a; }
    alt.push(Math.round(s.alt * (0.55 + 0.45 * h / tot)));
  }
  for (let x = 0; x < STRIP; x++) {
    const top = s.base - alt[x];
    R_(c, x, top, 1, VH - top, s.col);
    R_(c, x, top, 1, 1, s.chiaro);
    if (x > 0 && alt[x] > alt[x - 1]) R_(c, x, top + 1, 1, 2, s.chiaro);   // lato illuminato
    if (s.neve) {
      const soglia = s.alt * 0.62;
      if (alt[x] > soglia) {
        const sp = Math.min(alt[x] - soglia, 14) + ((x * 7) % 3);
        R_(c, x, top, 1, sp, "#ffffff");
        R_(c, x, top + sp, 1, 1, "#d4e6fa");
      }
    }
  }
  return cv;
}

function stratoColline(s, seed) {
  const { cv, c } = striscia();
  const R = rng(seed);
  const fasi = []; for (let i = 0; i < 3; i++) fasi.push([2 + i * 2 + Math.floor(R() * 2), R() * 6.28, Math.pow(0.6, i)]);
  for (let x = 0; x < STRIP; x++) {
    let h = 0, tot = 0;
    for (const [k, f, a] of fasi) { h += a * Math.sin(2 * Math.PI * k * x / STRIP + f); tot += a; }
    const top = s.base - Math.round(s.alt * (0.5 + 0.5 * h / tot));
    R_(c, x, top, 1, VH - top, s.col);
    R_(c, x, top, 1, 2, s.chiaro);
  }
  return cv;
}

function conWrap(c, x, w, fn) { fn(x); if (x + w > STRIP) fn(x - STRIP); if (x < 0) fn(x + STRIP); }

function stratoAlberi(s, seed) {
  const { cv, c } = striscia();
  const R = rng(seed);
  const n = 17;
  for (let i = 0; i < n; i++) {
    const x = Math.round(i * STRIP / n + R() * 12), r = 9 + Math.floor(R() * 5), th = 12 + Math.floor(R() * 8);
    conWrap(c, x - 16, 32, (ox) => {
      const cx = ox + 16, yb = s.base;
      R_(c, cx - 2, yb - th, 4, th, s.tronco);
      R_(c, cx - 2, yb - th, 1, th, "#9a6238");
      disco(c, cx, yb - th - r + 2, r, s.scuro);
      disco(c, cx - 1, yb - th - r + 1, r - 1, s.col);
      disco(c, cx - 3, yb - th - r - 1, Math.max(3, r - 5), s.chiaro);
      R_(c, cx - 5, yb - th - r - 3, 3, 1, "#ffffff55".slice(0, 7));
    });
  }
  return cv;
}

function stratoPini(s, seed) {
  const { cv, c } = striscia();
  const R = rng(seed);
  const n = 20;
  for (let i = 0; i < n; i++) {
    const x = Math.round(i * STRIP / n + R() * 10), h = s.alt * (0.65 + R() * 0.45), lw = 9 + Math.floor(R() * 5);
    conWrap(c, x - 16, 32, (ox) => {
      const cx = ox + 16, yb = s.base;
      R_(c, cx - 1, yb - 6, 3, 6, s.col);
      const tier = 4;
      for (let t = 0; t < tier; t++) {
        const yt = yb - 6 - h * (t + 1) / tier * 0.95, yl = yb - 6 - h * t / tier * 0.95 - 2;
        const w = lw * (1 - t / (tier + 0.6));
        poli(c, [[cx - w, yl], [cx, yt - 4], [cx + w, yl]], s.col);
        R_(c, cx - w, yl - 1, Math.floor(w) , 1, s.chiaro);
        if (s.neve) {
          poli(c, [[cx - w * 0.55, yl - h / tier * 0.55], [cx, yt - 4], [cx + w * 0.55, yl - h / tier * 0.55]], "#f4faff");
          R_(c, cx - w * 0.55, yl - h / tier * 0.55, Math.round(w * 1.1), 1, "#cfe2f5");
        }
      }
    });
  }
  return cv;
}

function stratoAlberiSpogli(s, seed) {
  const { cv, c } = striscia();
  const R = rng(seed);
  const n = 6;
  function ramo(cx, cy, ang, len, sp) {
    if (len < 4 || sp > 4) return;
    const ex = cx + Math.cos(ang) * len, ey = cy - Math.sin(ang) * len;
    const passi = Math.ceil(len);
    for (let i = 0; i < passi; i++) R_(c, cx + (ex - cx) * i / passi, cy + (ey - cy) * i / passi, Math.max(1, 3 - sp), 1 + (sp < 1 ? 1 : 0), s.col);
    ramo(ex, ey, ang + 0.5 + R() * 0.3, len * 0.68, sp + 1);
    ramo(ex, ey, ang - 0.5 - R() * 0.3, len * 0.68, sp + 1);
  }
  for (let i = 0; i < n; i++) {
    const x = Math.round(i * STRIP / n + R() * 20), h = s.alt * (0.6 + R() * 0.5);
    conWrap(c, x - 40, 80, (ox) => {
      const cx = ox + 40, yb = s.base;
      R_(c, cx - 2, yb - h * 0.55, 5, h * 0.55, s.col);
      ramo(cx, yb - h * 0.55, Math.PI / 2 + 0.25, h * 0.5, 0);
      ramo(cx, yb - h * 0.4, Math.PI / 2 - 0.45, h * 0.42, 1);
    });
  }
  R_(c, 0, s.base - 2, STRIP, VH, s.col);
  return cv;
}

function stratoStalagmiti(s, seed) {
  const { cv, c } = striscia();
  const R = rng(seed);
  const n = 18;
  R_(c, 0, s.base - 4, STRIP, VH, s.col);
  for (let i = 0; i < n; i++) {
    const x = Math.round(i * STRIP / n + R() * 14), h = s.alt * (0.4 + R() * 0.6), w = 8 + Math.floor(R() * 8);
    conWrap(c, x - 20, 40, (ox) => {
      const cx = ox + 20;
      poli(c, [[cx - w, s.base], [cx - 1, s.base - h], [cx + 2, s.base - h], [cx + w, s.base]], s.col);
      R_(c, cx - 1, s.base - h, 1, Math.floor(h * 0.6), s.chiaro);
    });
    // stalattiti dal soffitto
    const x2 = Math.round(i * STRIP / n + R() * 20), h2 = 16 + R() * 44, w2 = 6 + Math.floor(R() * 7);
    conWrap(c, x2 - 20, 40, (ox) => {
      const cx = ox + 20;
      poli(c, [[cx - w2, 0], [cx + w2, 0], [cx + 1, h2]], s.col);
      R_(c, cx - w2 + 2, 0, 2, Math.floor(h2 * 0.5), s.chiaro);
    });
  }
  return cv;
}

function stratoCristalli(s, seed) {
  const { cv, c } = striscia();
  const R = rng(seed);
  const n = 14;
  for (let i = 0; i < n; i++) {
    const x = Math.round(i * STRIP / n + R() * 16);
    const gruppo = 2 + Math.floor(R() * 2);
    conWrap(c, x - 24, 48, (ox) => {
      const cx = ox + 24;
      c.globalAlpha = 0.16; disco(c, cx, s.base - 12, 15, s.luce); c.globalAlpha = 1;
      for (let g = 0; g < gruppo; g++) {
        const dx = (g - (gruppo - 1) / 2) * 9 + (g * 37 % 5) * 0.6, h = s.alt * (0.55 + ((i * 7 + g * 3) % 5) * 0.1), w = 4 + ((i + g) % 3);
        const tilt = (((i * 5 + g * 11) % 7) - 3);
        poli(c, [[cx + dx - w, s.base], [cx + dx - w + 1 + tilt, s.base - h * 0.75], [cx + dx + tilt, s.base - h], [cx + dx + w - 1 + tilt, s.base - h * 0.75], [cx + dx + w, s.base]], s.col);
        poli(c, [[cx + dx - w + 1, s.base], [cx + dx - w + 2 + tilt, s.base - h * 0.72], [cx + dx + tilt, s.base - h + 1], [cx + dx + tilt - 1, s.base - h * 0.3]], s.chiaro);
      }
    });
  }
  R_(c, 0, s.base, STRIP, VH, s.col);
  return cv;
}

function stratoVulcano(s, seed) {
  const { cv, c } = striscia();
  const cx = 250, w = 190;
  poli(c, [[cx - w, s.base], [cx - 34, s.base - s.alt], [cx + 34, s.base - s.alt], [cx + w, s.base]], s.col);
  // lati illuminati e crepe di lava
  poli(c, [[cx - w + 20, s.base], [cx - 34, s.base - s.alt], [cx - 20, s.base - s.alt], [cx - w + 60, s.base]], s.chiaro);
  R_(c, cx - 34, s.base - s.alt, 68, 3, s.lava);
  R_(c, cx - 30, s.base - s.alt + 3, 60, 2, "#ffd060");
  const R = rng(seed);
  for (let i = 0; i < 6; i++) {
    let x = cx - 26 + i * 10 + R() * 6, y = s.base - s.alt + 5;
    for (let k = 0; k < 28 + R() * 40; k++) {
      R_(c, x, y, 2, 2, i % 2 ? s.lava : "#ffb030");
      x += (R() - 0.5) * 1.6 + (x < cx ? -0.4 : 0.4); y += 1.6;
    }
  }
  // fumo
  for (let i = 0; i < 5; i++) {
    c.globalAlpha = 0.5 - i * 0.07;
    disco(c, cx + 8 + i * 5, s.base - s.alt - 10 - i * 12, 9 + i * 3, "#5a3040");
  }
  c.globalAlpha = 1;
  return cv;
}

function stratoVilla(s, seed) {
  const { cv, c } = striscia();
  const R = rng(seed);
  R_(c, 0, s.base - 6, STRIP, VH, s.col);
  function villa(x, scala) {
    const yb = s.base - 6, W = 96 * scala, H = 44 * scala;
    R_(c, x, yb - H, W, H + 6, s.col);
    // torri
    const torre = (tx, tw, th) => {
      R_(c, tx, yb - th, tw, th + 6, s.col);
      poli(c, [[tx - 3, yb - th], [tx + tw / 2, yb - th - tw * 1.3], [tx + tw + 3, yb - th]], s.col);
      R_(c, tx + tw / 2, yb - th - tw * 1.3 - 5, 1, 6, s.col);
    };
    torre(x - 8, 20 * scala, H * 1.7);
    torre(x + W - 14, 22 * scala, H * 1.45);
    torre(x + W / 2 - 9, 18 * scala, H * 1.25);
    poli(c, [[x - 2, yb - H], [x + W / 2 - 12, yb - H - 14 * scala], [x + W / 2 + 12, yb - H - 14 * scala], [x + W + 2, yb - H]], s.col);
    // finestre accese
    for (let i = 0; i < 9; i++) {
      const wx = x + 8 + (i % 5) * 16 * scala, wy = yb - H + 8 + Math.floor(i / 5) * 18 * scala;
      if (R() < 0.6) { R_(c, wx, wy, 6, 9, "#ffd166"); R_(c, wx, wy, 6, 1, "#fff0a8"); R_(c, wx + 3, wy, 1, 9, "#b8791c"); }
    }
    R_(c, x + W / 2 - 4, yb - 15, 8, 15, "#ffd166");
    R_(c, x + W / 2 - 4, yb - 15, 8, 2, "#fff0a8");
    // finestre nelle torri
    R_(c, x - 2, yb - H * 1.7 + 8, 4, 7, "#ffd166");
    R_(c, x + W - 8, yb - H * 1.45 + 8, 4, 7, "#ffd166");
  }
  villa(60, 1);
  villa(340, 0.85);
  // recinto
  for (let x = 0; x < STRIP; x += 7) R_(c, x, s.base - 16, 2, 12, s.col);
  R_(c, 0, s.base - 12, STRIP, 2, s.col);
  return cv;
}

function creaStrato(s, seed) {
  switch (s.tipo) {
    case "montagne": return stratoMontagne(s, seed);
    case "colline": return stratoColline(s, seed);
    case "alberi": return stratoAlberi(s, seed);
    case "pini": return stratoPini(s, seed);
    case "alberispogli": return stratoAlberiSpogli(s, seed);
    case "stalagmiti": return stratoStalagmiti(s, seed);
    case "cristalli": return stratoCristalli(s, seed);
    case "vulcano": return stratoVulcano(s, seed);
    case "villa": return stratoVilla(s, seed);
  }
  throw new Error("strato sconosciuto " + s.tipo);
}

function creaNuvola(tm, w, h, seed) {
  const cv = creaCanvas(w, h), c = cv.getContext("2d");
  const R = rng(seed);
  const n = 4 + Math.floor(R() * 3);
  const pezzi = [];
  for (let i = 0; i < n; i++) {
    const r = Math.floor(h * (0.28 + R() * 0.2));
    pezzi.push([Math.round(r + i * (w - 2 * r) / (n - 1)), h - r - 2 - Math.floor(R() * (h * 0.3)), r]);
  }
  for (const [x, y, r] of pezzi) disco(c, x, y, r, tm.nuvole.ombra);
  for (const [x, y, r] of pezzi) disco(c, x, y - 2, r, tm.nuvole.col);
  R_(c, 0, h - 3, w, 3, "rgba(0,0,0,0)");
  c.clearRect(0, h - 2, w, 2);
  return cv;
}

function creaMondo(idx) {
  const tm = TEMI[idx];
  const M = { tm, cielo: tm.torre ? null : creaCielo(tm.cielo), strati: [], nuvole: [], stelle: [], tile: new Map(), decoro: null, torre: tm.torre ? creaSfondoTorre(tm) : null };
  tm.strati.forEach((s, i) => M.strati.push({ cv: creaStrato(s, 100 + idx * 17 + i * 5), par: s.par }));
  if (tm.nuvole) {
    const R = rng(idx * 31 + 7);
    for (let i = 0; i < 7; i++) {
      const w = 44 + Math.floor(R() * 40);
      M.nuvole.push({ cv: creaNuvola(tm, w, 22 + Math.floor(R() * 10), idx * 50 + i), x: R() * 640, y: 8 + R() * 70, v: 3 + R() * 5, par: 0.05 + R() * 0.05 });
    }
  }
  if (tm.stelle) {
    const R = rng(99 + idx);
    for (let i = 0; i < 60; i++) M.stelle.push({ x: R() * VW, y: R() * 120, s: R() < 0.2 ? 2 : 1, a: 0.4 + R() * 0.6, f: R() * 6 });
  }
  return M;
}

function disegnaAstro(c, tm, camX, t) {
  const a = tm.astro;
  if (!a) return;
  const x = a.x - camX * 0.02, y = a.y;
  c.globalAlpha = 0.18; disco(c, Math.round(x), y, 30, a.alone);
  c.globalAlpha = 0.25; disco(c, Math.round(x), y, 22, a.alone);
  c.globalAlpha = 1;
  disco(c, Math.round(x), y, 15, a.col);
  if (a.tipo === "luna") {
    disco(c, Math.round(x) - 5, y - 4, 3, "#e8d4b0");
    disco(c, Math.round(x) + 5, y + 5, 4, "#e8d4b0");
    disco(c, Math.round(x) + 6, y - 6, 2, "#e8d4b0");
  }
}

function disegnaSfondo(c, M, camX, t, camY) {
  const tm = M.tm;
  if (M.torre) { disegnaSfondoTorre(c, M, camY || 0, t); return; }
  c.drawImage(M.cielo, 0, 0);
  for (const s of M.stelle) {
    const sx = ((s.x - camX * 0.03) % VW + VW) % VW;
    c.globalAlpha = s.a * (0.55 + 0.45 * Math.sin(t * 2 + s.f));
    R_(c, sx, s.y, s.s, s.s, "#ffffff");
  }
  c.globalAlpha = 1;
  disegnaAstro(c, tm, camX, t);
  for (const n of M.nuvole) {
    const wrap = VW + 200;
    let x = ((n.x + t * n.v - camX * n.par) % wrap + wrap) % wrap - 100;
    c.drawImage(n.cv, Math.round(x), Math.round(n.y));
  }
  for (const l of M.strati) {
    const off = -Math.floor(camX * l.par) % STRIP;
    const x0 = off > 0 ? off - STRIP : off;
    c.drawImage(l.cv, x0, 0);
    if (x0 + STRIP < VW) c.drawImage(l.cv, x0 + STRIP, 0);
  }
}
// =====================================================================
//  TERRENO: tile con autotiling, piattaforme, spuntoni, liquidi, decori
// =====================================================================
function spuntoneCols(tm) {
  if (tm.capTipo === "neve") return ["#f4fbff", "#a8d8ff", "#5a9ad8"];
  if (tm.capTipo === "magma") return ["#8a5a5a", "#5a3a3a", "#33202a"];
  if (tm.erba === "#4ce0d0") return ["#d8c8ff", "#9a7af0", "#5a3fa0"];
  return ["#eef0fa", "#aab2d2", "#6a7298"];
}

// maschera vicini: N=1 E=2 S=4 W=8 NE=16 SE=32 SW=64 NW=128
function creaTerreno(tm, mask, v) {
  const cv = creaCanvas(TILE, TILE), c = cv.getContext("2d");
  const R = rng(mask * 13 + v * 7 + 1);
  const N = mask & 1, E = mask & 2, S = mask & 4, W = mask & 8;
  R_(c, 0, 0, 16, 16, tm.terra);
  if (tm.capTipo === "pietra") {
    // muro di mattoni
    for (let j = 0; j < 2; j++) {
      R_(c, 0, j * 8 + 7, 16, 1, tm.terraScura);
      const off = j ? 4 : 0;
      for (let x = off; x < 16 + off; x += 8) R_(c, x % 16, j * 8, 1, 7, tm.terraScura);
      for (let x = off + 1; x < 16 + off; x += 8) { R_(c, x % 16, j * 8, 6, 1, tm.terraChiara); if (R() < 0.4) R_(c, (x + 2 + Math.floor(R() * 3)) % 16, j * 8 + 3, 1, 2, tm.terraScura); }
    }
  } else {
    for (let i = 0; i < 5; i++) R_(c, Math.floor(R() * 14), 3 + Math.floor(R() * 11), 2, 1, tm.terraScura);
    for (let i = 0; i < 3; i++) R_(c, Math.floor(R() * 15), 3 + Math.floor(R() * 11), 1, 1, tm.terraChiara);
    if (R() < 0.55) {
      const x = 2 + Math.floor(R() * 9), y = 6 + Math.floor(R() * 6);
      R_(c, x, y, 3, 2, tm.terraChiara); R_(c, x, y + 2, 3, 1, tm.terraScura); R_(c, x + 3, y, 1, 3, tm.terraScura);
    }
  }
  if (!S) { R_(c, 0, 13, 16, 2, tm.terraScura); }

  // bordo superiore: erba / neve / crosta di magma
  if (!N) {
    const rr = rng(v * 31 + mask);
    for (let x = 0; x < 16; x++) {
      const dip = rr() < 0.38 ? (rr() < 0.4 ? 3 : 2) : 0;
      if (tm.capTipo === "pietra") {
        R_(c, x, 1, 1, 1, tm.erbaChiara);
        R_(c, x, 2, 1, 2, tm.erba);
        R_(c, x, 4, 1, 1, tm.erbaScura);
        if (x % 5 === 2) R_(c, x, 5, 1, 1, tm.erbaScura);
      } else if (tm.capTipo === "neve") {
        const h = 5 + (dip > 0 ? 1 : 0) + (x > 3 && x < 12 ? 1 : 0);
        R_(c, x, 1, 1, h, tm.erba);
        R_(c, x, 1, 1, 1, tm.erbaChiara);
        R_(c, x, h, 1, 1, tm.erbaScura);
        if (dip) R_(c, x, h + 1, 1, 1, tm.erbaScura);
      } else if (tm.capTipo === "magma") {
        R_(c, x, 1, 1, 3, tm.terraScura);
        R_(c, x, 4, 1, 1, tm.erba);
        if (dip > 1) R_(c, x, 5, 1, 1, tm.erba);
        if (x % 5 === 2) R_(c, x, 4, 1, 1, tm.erbaChiara);
      } else {
        R_(c, x, 1, 1, 4 + (dip > 0 ? 1 : 0), tm.erba);
        R_(c, x, 1, 1, 1, tm.erbaChiara);
        R_(c, x, 5 + (dip > 0 ? 1 : 0), 1, 1, tm.erbaScura);
        if (dip) R_(c, x, 6 + (dip > 1 ? 1 : 0), 1, dip - 1, tm.erbaScura);
      }
    }
    R_(c, 0, 0, 16, 1, tm.contorno);
  }
  // bordi laterali e inferiore con contorno scuro
  if (!W) { R_(c, 0, N ? 0 : 1, 1, 16, tm.contorno); R_(c, 1, N ? 0 : 6, 1, 8, tm.terraChiara); }
  if (!E) { R_(c, 15, N ? 0 : 1, 1, 16, tm.contorno); R_(c, 14, N ? 0 : 6, 1, 8, tm.terraScura); }
  if (!S) { R_(c, 0, 15, 16, 1, tm.contorno); }
  // angoli arrotondati
  if (!N && !W) c.clearRect(0, 0, 1, 1);
  if (!N && !E) c.clearRect(15, 0, 1, 1);
  if (!S && !W) c.clearRect(0, 15, 1, 1);
  if (!S && !E) c.clearRect(15, 15, 1, 1);
  return cv;
}

function creaPiattaforma(tm, sx, dx) {
  const cv = creaCanvas(TILE, TILE), c = cv.getContext("2d");
  R_(c, 0, 0, 16, 8, tm.legno);
  R_(c, 0, 1, 16, 2, tm.legnoChiaro);
  R_(c, 0, 6, 16, 1, tm.legnoScuro);
  R_(c, 0, 0, 16, 1, tm.contorno);
  R_(c, 0, 7, 16, 1, tm.contorno);
  R_(c, 3, 4, 1, 1, tm.legnoScuro); R_(c, 12, 4, 1, 1, tm.legnoScuro);
  R_(c, 7, 3, 3, 1, tm.legnoScuro);
  if (!sx) { R_(c, 0, 0, 1, 8, tm.contorno); c.clearRect(0, 0, 1, 1); c.clearRect(0, 7, 1, 1); }
  if (!dx) { R_(c, 15, 0, 1, 8, tm.contorno); c.clearRect(15, 0, 1, 1); c.clearRect(15, 7, 1, 1); }
  // pioli che scendono dal bordo
  if (!sx) { R_(c, 2, 8, 1, 2, tm.contorno); R_(c, 3, 8, 1, 3, tm.legnoScuro); }
  if (!dx) { R_(c, 13, 8, 1, 2, tm.contorno); R_(c, 12, 8, 1, 3, tm.legnoScuro); }
  return cv;
}

function creaSpuntone(tm) {
  const cv = creaCanvas(TILE, TILE), c = cv.getContext("2d");
  const [l, m, d] = spuntoneCols(tm), o = tm.contorno;
  for (const x0 of [0, 8]) {
    poli(c, [[x0, 16], [x0 + 4, 5], [x0 + 8, 16]], o);
    poli(c, [[x0 + 1, 16], [x0 + 4, 7], [x0 + 7, 16]], m);
    poli(c, [[x0 + 4, 7], [x0 + 7, 16], [x0 + 4.5, 16]], d);
    poli(c, [[x0 + 1.5, 15], [x0 + 3.5, 8.5], [x0 + 4, 8.5], [x0 + 3, 15]], l);
  }
  return cv;
}

function tessera(M, mask, v) {
  const k = mask * 4 + v;
  let t = M.tile.get(k);
  if (!t) { t = creaTerreno(M.tm, mask, v); M.tile.set(k, t); }
  return t;
}
function tesseraPiattaforma(M, sx, dx) {
  const k = 2000 + (sx ? 2 : 0) + (dx ? 1 : 0);
  let t = M.tile.get(k);
  if (!t) { t = creaPiattaforma(M.tm, sx, dx); M.tile.set(k, t); }
  return t;
}
function tesseraSpuntone(M) {
  let t = M.tile.get(3000);
  if (!t) { t = creaSpuntone(M.tm); M.tile.set(3000, t); }
  return t;
}

// ---------------------------------------------------------------------
//  LIQUIDO (acqua / lava) e buio dentro i buchi
// ---------------------------------------------------------------------
function disegnaLiquido(c, tm, camX, t, colonneBuco, yLiq, altezza) {
  const LIQ_Y = yLiq === undefined ? 192 : yLiq;
  const VHL = altezza === undefined ? VH : altezza;
  const L = tm.liquido;
  // colonne dei buchi: buio che sfuma verso il liquido
  for (const cx of colonneBuco) {
    const x = cx * TILE - Math.floor(camX);
    const g = c.createLinearGradient(0, LIQ_Y - 42, 0, LIQ_Y);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, tm.buio);
    c.fillStyle = g;
    c.fillRect(x, LIQ_Y - 42, TILE, 42);
  }
  R_(c, 0, LIQ_Y + 4, VW, VHL, L.col);
  R_(c, 0, LIQ_Y + 12, VW, VHL, L.scuro);
  const cam = Math.floor(camX);
  for (let x = 0; x < VW; x++) {
    const ph = (x + cam) * 0.09 + t * (L.tipo === "lava" ? 1.4 : 2.2);
    const y = LIQ_Y + Math.round(Math.sin(ph) * 1.6 + Math.sin(ph * 2.3) * 0.7);
    R_(c, x, y, 1, 5 - (y - LIQ_Y + 2 > 4 ? 0 : 0), L.col);
    R_(c, x, y, 1, 1, L.chiaro);
    if (((x + cam) >> 1) % 7 === 0) R_(c, x, y + 1, 1, 1, L.chiaro);
  }
  const R = rng(5);
  for (let i = 0; i < 12; i++) {
    const wx = ((R() * 640 - cam * 1 + Math.sin(t + i) * 4) % VW + VW) % VW;
    const wy = LIQ_Y + 8 + Math.floor(R() * 20);
    R_(c, wx, wy, 3, 1, L.tipo === "lava" ? L.chiaro : L.chiaro);
  }
  if (L.tipo === "lava") {
    for (let i = 0; i < 6; i++) {
      const bx = ((i * 71 + Math.floor(t * 12 + i * 37)) % 90) ;
      const wx = ((i * 133 - cam) % VW + VW) % VW;
      const by = LIQ_Y + 6 - Math.abs(Math.sin(t * 2 + i)) * 12;
      R_(c, wx, by, 2, 2, L.chiaro);
    }
  }
}

// ---------------------------------------------------------------------
//  DECORI SUL TERRENO
// ---------------------------------------------------------------------
function creaDecori(tm) {
  const D = {};
  const g = { g: tm.erba, G: tm.erbaScura, l: tm.erbaChiara, o: tm.contorno };
  D.ciuffo = [sprite(["..l..l..", ".gg.lgg.", ".gggggG.", "gggGgggG"], g)];
  const petali = (p, P, cc) => sprite([
    "..ppp..", ".pcccp.", ".pcccp.", "..ppp..", "...g...", "..gg...", "...gg..", "..lgl.."
  ], { p, P, c: cc, g: tm.erbaScura, l: tm.erba });
  D.fiore = [petali("#ff7a9a", "#d94a70", "#fff27a")];
  D.fiore2 = [petali("#ffffff", "#cfd8f0", "#ffb84a")];
  D.fungo = [sprite([
    "..oooo..", ".orrwrro", "orrwrrwo", "orrrrrro", ".oooooo.", "..oWWo..", "..oWWo..", "..oooo.."
  ], { o: "#2a1b3d", r: "#e63946", w: "#ffffff", W: "#f4e6d0" })];
  D.sasso = [sprite([
    "..oooo..", ".ohhggo.", "ohggggGo", "oggGGGGo", "oooooooo"
  ], { o: tm.contorno, h: tm.terraChiara, g: tm.terra, G: tm.terraScura })];
  D.roccia = [sprite([
    "...oooo...", "..ohhggo..", ".ohggggGo.", "ohgggGGGGo", "oggGGGGGGo", "oooooooooo"
  ], { o: tm.contorno, h: tm.terraChiara, g: tm.terra, G: tm.terraScura })];
  D.cristallo = [sprite([
    "...oo...", "..ohco..", "..ohco..", ".ohhcco.", ".ohhcco.", "ohhcccco", "ohhcccco", "oooooooo"
  ], { o: "#1a1030", h: "#e8ffff", c: "#5fe0ff" })];
  D.cristallo2 = [sprite([
    "....oo....", "...ohpo...", "o..ohpo..o", "oo.ohpo.oo", "ohoohppoohp".slice(0, 10), "ohhpppppho", "oooooooooo"
  ], { o: "#1a1030", h: "#f4e0ff", p: "#c07aff" })];
  D.pupazzo = [sprite([
    "...oooo...", "..owwwwo..", ".owkwwkwo.", ".owwwnnwo.", ".owwwwwwo.", "..orrrro..",
    "..owwwwo..", ".owwwwwwo.", ".owwkwwwo.", "owwwwwwwwo", "owwwkwwwwo", "owwwwwwwwo", ".owwwwwwo.", "..oooooo.."
  ], { o: "#23305a", w: "#ffffff", k: "#23305a", n: "#ff8a2a", r: "#e63946" })];
  D.neveciuffo = [sprite([
    "...oooo...", "..owwwwo..", ".owwwwwwo.", "oWwwwwwwWo", "oooooooooo"
  ], { o: "#3a548a", w: "#ffffff", W: "#cfe2f5" })];
  D.brace = [sprite([
    ".oooooo.", "oQQyQQQo", "oQQQQyQo", "oQyQQQQo", "oooooooo"
  ], { o: "#1a0a12", Q: "#5a3a3a", y: "#ff9a2a" })];
  D.lapide = [sprite([
    "..oooo..", ".ogggGo.", "ogGgggGo", "ogggGggo", "ogGgggGo", "oggggggo", "oggGGggo", "oooooooo"
  ], { o: "#12081e", g: "#8a8aa8", G: "#5a5a78" })];
  D.zucca = [sprite([
    "....s....", "..ooSoo..", ".oOOOOOo.", "oOkOOOkOo", "oOOOOOOOo", "oOkOkOkOo", ".oOOOOOo.", "..ooooo.."
  ], { o: "#3a1408", O: "#ff8a1a", S: "#3a8a2a", s: "#3a8a2a", k: "#3a1408" })];
  D.candela = [sprite([
    "..oo..", ".oyyo.", ".oyyo.", "..oo..", ".oWWo.", ".oWwo.", ".oWWo.", ".oWwo.", ".oWWo.", "oooooo"
  ], { o: "#2a1b3d", y: "#ffd23f", W: "#f4f0d8", w: "#d0c890" })];
  return D;
}
// =====================================================================
//  CASTELLO: sfondi interni delle stanze in salita + temi 7-12
// =====================================================================
const TORRE_H = 384;   // periodo verticale dello sfondo (si ripete)

function mattoniMuro(c, w, h, m, seed) {
  const R = rng(seed);
  R_(c, 0, 0, w, h, m.malta);
  for (let y = 0; y < h; y += 8) {
    const off = ((y / 8) & 1) ? 8 : 0;
    for (let x = -16 + off; x < w; x += 16) {
      const v = R();
      const col = v < 0.35 ? m.base2 : m.base;
      R_(c, x + 1, y + 1, 15, 7, col);
      R_(c, x + 1, y + 1, 15, 1, m.chiaro);
      if (R() < 0.18) R_(c, x + 3 + Math.floor(R() * 8), y + 3, 2, 1, m.malta);
    }
  }
}

function arco(c, x, y, w, h, col) {
  const r = w / 2;
  for (let j = 0; j < h; j++) {
    let hw = r;
    if (j < r) hw = Math.floor(Math.sqrt(Math.max(0, r * r - (r - j - 0.5) * (r - j - 0.5))) + 0.3);
    if (hw > 0) R_(c, x + r - hw, y + j, hw * 2, 1, col);
  }
}

function finestra(c, x, y, w, h, m, luna, seed) {
  const R = rng(seed);
  arco(c, x - 3, y - 3, w + 6, h + 6, m.contorno);
  arco(c, x - 2, y - 2, w + 4, h + 4, m.pietra);
  arco(c, x, y, w, h, m.cieloF[0]);
  // cielo a fasce dentro la finestra
  for (let j = 0; j < h; j++) {
    if (j > h * 0.55) {
      const r = w / 2;
      const hw = j < r ? Math.floor(Math.sqrt(Math.max(0, r * r - (r - j - 0.5) * (r - j - 0.5))) + 0.3) : r;
      R_(c, x + r - hw, y + j, hw * 2, 1, j > h * 0.8 ? m.cieloF[2] : m.cieloF[1]);
    }
  }
  for (let i = 0; i < 7; i++) R_(c, x + 4 + Math.floor(R() * (w - 8)), y + 8 + Math.floor(R() * (h * 0.55)), 1, 1, "#ffffff");
  if (luna) { disco(c, x + Math.floor(w * 0.62), y + Math.floor(h * 0.3), 6, m.lunaCol); disco(c, x + Math.floor(w * 0.62) - 2, y + Math.floor(h * 0.3) - 1, 2, m.lunaOmbra); }
  // montanti
  R_(c, x + Math.floor(w / 2) - 1, y, 2, h, m.contorno);
  R_(c, x, y + Math.floor(h * 0.42), w, 2, m.contorno);
  // davanzale
  R_(c, x - 4, y + h, w + 8, 4, m.contorno);
  R_(c, x - 3, y + h, w + 6, 2, m.pietraChiara);
}

function torciaSupporto(c, x, y, m) {
  R_(c, x - 2, y, 5, 3, m.contorno); R_(c, x - 1, y, 3, 2, "#8a7a6a");
  R_(c, x - 1, y - 8, 3, 9, m.contorno); R_(c, x, y - 8, 1, 8, "#7a4a2a");
  R_(c, x - 3, y - 11, 7, 3, m.contorno); R_(c, x - 2, y - 10, 5, 1, "#a09080");
}

function stendardo(c, x, y, w, h, col, colOrlo, colOmbra) {
  R_(c, x - 2, y - 3, w + 4, 3, "#2a1b3d"); R_(c, x - 1, y - 2, w + 2, 1, "#d8b060");
  R_(c, x, y, w, h - 8, "#2a1b3d");
  R_(c, x + 1, y, w - 2, h - 9, col);
  R_(c, x + 1, y, 2, h - 9, colOmbra);
  poli(c, [[x, y + h - 9], [x + w, y + h - 9], [x + w / 2, y + h + 2]], "#2a1b3d");
  poli(c, [[x + 1.5, y + h - 9], [x + w - 1.5, y + h - 9], [x + w / 2, y + h - 1]], col);
  R_(c, x + 1, y + h - 10, w - 2, 1, colOrlo);
  // stemma: rombo
  const cx = x + w / 2, cy = y + 13;
  poli(c, [[cx, cy - 6], [cx + 5, cy], [cx, cy + 6], [cx - 5, cy]], colOrlo);
  poli(c, [[cx, cy - 4], [cx + 3, cy], [cx, cy + 4], [cx - 3, cy]], col);
}

function colonna(c, x, w, h, m) {
  R_(c, x, 0, w, h, m.contorno);
  R_(c, x + 1, 0, w - 2, h, m.pietra);
  R_(c, x + 2, 0, 3, h, m.pietraChiara);
  R_(c, x + w - 4, 0, 3, h, m.pietraScura);
  for (let y = 40; y < h; y += 192) {
    R_(c, x - 3, y, w + 6, 6, m.contorno); R_(c, x - 2, y + 1, w + 4, 4, m.pietraChiara);
    R_(c, x - 3, y + 30, w + 6, 6, m.contorno); R_(c, x - 2, y + 31, w + 4, 4, m.pietra);
  }
}

function ingranaggio(c, cx, cy, r, denti, rot, m) {
  for (let i = 0; i < denti; i++) {
    const a = rot + i * Math.PI * 2 / denti;
    const px = Math.round(cx + Math.cos(a) * (r + 2)), py = Math.round(cy + Math.sin(a) * (r + 2));
    R_(c, px - 2, py - 2, 5, 5, m.contorno);
  }
  disco(c, cx, cy, r + 1, m.contorno);
  for (let i = 0; i < denti; i++) {
    const a = rot + i * Math.PI * 2 / denti;
    const px = Math.round(cx + Math.cos(a) * (r + 2)), py = Math.round(cy + Math.sin(a) * (r + 2));
    R_(c, px - 1, py - 1, 3, 3, m.ottone);
  }
  disco(c, cx, cy, r, m.ottone);
  disco(c, cx - 1, cy - 1, r - 3, m.ottoneChiaro);
  disco(c, cx, cy, Math.max(3, Math.floor(r * 0.55)), m.contorno);
  disco(c, cx, cy, Math.max(2, Math.floor(r * 0.55) - 1), m.malta);
  for (let k = 0; k < 4; k++) {
    const a = rot + k * Math.PI / 2, rr = Math.floor(r * 0.55);
    for (let s = 0; s < rr; s++) R_(c, Math.round(cx + Math.cos(a) * s), Math.round(cy + Math.sin(a) * s), 2, 2, m.ottoneScuro);
  }
  disco(c, cx, cy, 3, m.ottoneScuro); disco(c, cx, cy, 1, m.ottoneChiaro);
}

function scaffale(c, x, y, w, h, seed) {
  const R = rng(seed);
  R_(c, x, y, w, h, "#241608");
  R_(c, x + 2, y + 2, w - 4, h - 4, "#3a2412");
  const righe = Math.floor(h / 24);
  const cols = ["#c2253f", "#3f6fd8", "#3fae5a", "#e0a020", "#8a4fd0", "#d0d0e0", "#e06a2a", "#2aa0a0"];
  for (let r = 0; r < righe; r++) {
    const by = y + 4 + r * 24 + 20;
    let bx = x + 4;
    while (bx < x + w - 8) {
      const bw = 3 + Math.floor(R() * 3), bh = 12 + Math.floor(R() * 8);
      const col = cols[Math.floor(R() * cols.length)];
      if (R() < 0.08) { bx += 3; continue; }
      R_(c, bx, by - bh, bw, bh, "#1a1024");
      R_(c, bx + 1, by - bh + 1, bw - 2, bh - 1, col);
      R_(c, bx + 1, by - bh + 3, bw - 2, 1, "#ffffff55".slice(0, 7));
      bx += bw;
    }
    R_(c, x + 2, by, w - 4, 4, "#6a4222"); R_(c, x + 2, by, w - 4, 1, "#8a5a30");
  }
  R_(c, x, y, w, 3, "#8a5a30");
}

function vasca(c, x, y, w, h, m, seed) {
  const R = rng(seed);
  R_(c, x, y, w, h, m.contorno);
  R_(c, x + 1, y + 1, w - 2, h - 2, "#1a3a34");
  const lv = Math.floor(h * 0.62);
  R_(c, x + 2, y + h - lv, w - 4, lv - 2, m.liquido);
  R_(c, x + 2, y + h - lv, w - 4, 2, m.liquidoChiaro);
  R_(c, x + 3, y + 3, 2, h - 6, "#ffffff44".slice(0, 7));
  for (let i = 0; i < 6; i++) R_(c, x + 4 + Math.floor(R() * (w - 9)), y + h - lv + 4 + Math.floor(R() * (lv - 10)), 2, 2, m.liquidoChiaro);
  R_(c, x - 2, y - 4, w + 4, 6, "#4a4a5a"); R_(c, x - 2, y - 4, w + 4, 2, "#8a8aa0");
  R_(c, x - 2, y + h - 2, w + 4, 6, "#4a4a5a");
}

function rampicante(c, x0, y0, len, seed, m) {
  const R = rng(seed);
  let x = x0, y = y0, dir = 1;
  for (let i = 0; i < len; i++) {
    x += Math.round(Math.sin(i * 0.25 + seed) * 1.4);
    y += 1;
    R_(c, x, y, 2, 1, m.fogliaScura);
    if (i % 5 === 0) { const d = (i % 10 === 0) ? -1 : 1; R_(c, x + d * 2, y, 3, 2, m.foglia); R_(c, x + d * 2, y, 2, 1, m.fogliaChiara); }
    if (i % 23 === 7) { R_(c, x + 3, y - 1, 3, 3, m.fiore); R_(c, x + 4, y, 1, 1, "#fff27a"); }
  }
}

function creaSfondoTorre(tm) {
  const m = tm.torreCfg;
  const cv = creaCanvas(VW, TORRE_H), c = cv.getContext("2d");
  const M = { cv, torce: [], gear: null };
  mattoniMuro(c, VW, TORRE_H, m, 900 + tm.torreSeed);
  const kind = tm.torre;

  // ---- elementi specifici ----
  if (kind === "biblioteca") {
    scaffale(c, 34, 8, 104, 176, 11); scaffale(c, 262, 8, 104, 176, 12);
    scaffale(c, 34, 200, 104, 176, 13); scaffale(c, 262, 200, 104, 176, 14);
    finestra(c, 172, 60, 56, 88, m, true, 5);
    finestra(c, 172, 252, 56, 88, m, false, 6);
  } else if (kind === "orologio") {
    finestra(c, 172, 40, 56, 80, m, true, 7);
    ingranaggio(c, 88, 100, 34, 12, 0.1, m); ingranaggio(c, 318, 172, 42, 14, 0.3, m); ingranaggio(c, 96, 268, 26, 10, 0.2, m);
    ingranaggio(c, 300, 40, 22, 9, 0.5, m); ingranaggio(c, 200, 330, 34, 12, 0.0, m);
    R_(c, 46, 0, 8, TORRE_H, "#3a2c1c"); R_(c, 348, 0, 8, TORRE_H, "#3a2c1c");
    R_(c, 47, 0, 2, TORRE_H, "#8a7a58"); R_(c, 349, 0, 2, TORRE_H, "#8a7a58");
  } else if (kind === "alchimia") {
    vasca(c, 60, 40, 44, 108, m, 1); vasca(c, 296, 40, 44, 108, m, 2);
    vasca(c, 62, 232, 40, 100, m, 3); vasca(c, 298, 232, 40, 100, m, 4);
    R_(c, 105, 60, 190, 4, "#3a3a4a"); R_(c, 105, 61, 190, 1, "#8a8aa0");
    R_(c, 105, 250, 190, 4, "#3a3a4a"); R_(c, 105, 251, 190, 1, "#8a8aa0");
    R_(c, 198, 62, 4, 60, "#3a3a4a"); R_(c, 198, 252, 4, 60, "#3a3a4a");
    disco(c, 200, 130, 10, m.contorno); disco(c, 200, 130, 8, m.liquido); disco(c, 198, 128, 3, m.liquidoChiaro);
    disco(c, 200, 322, 10, m.contorno); disco(c, 200, 322, 8, m.liquido); disco(c, 198, 320, 3, m.liquidoChiaro);
  } else if (kind === "serra") {
    finestra(c, 68, 40, 48, 96, m, true, 8); finestra(c, 284, 40, 48, 96, m, true, 9);
    finestra(c, 68, 232, 48, 96, m, false, 10); finestra(c, 284, 232, 48, 96, m, false, 11);
    for (const x of [36, 150, 250, 366]) { rampicante(c, x, 0, 190, x, m); rampicante(c, x + 8, 190, 190, x + 3, m); }
  } else if (kind === "conte") {
    finestra(c, 152, 36, 96, 120, m, true, 12);
    finestra(c, 172, 232, 56, 88, m, false, 13);
    // pipistrelli simbolo
    for (const [bx, by] of [[80, 220], [320, 90], [90, 60], [310, 300]]) {
      poli(c, [[bx - 10, by], [bx - 4, by - 5], [bx, by - 2], [bx + 4, by - 5], [bx + 10, by], [bx + 5, by + 3], [bx, by + 6], [bx - 5, by + 3]], m.contorno);
    }
  } else { // ingresso
    finestra(c, 172, 52, 56, 92, m, true, 3);
    finestra(c, 172, 244, 56, 92, m, false, 4);
  }

  // colonne laterali
  colonna(c, 0, 26, TORRE_H, m);
  colonna(c, VW - 26, 26, TORRE_H, m);

  // stendardi e torce
  const stendardi = tm.torreCfg.stendardi;
  if (stendardi) {
    for (const [bx, by] of [[54, 24], [318, 200]]) stendardo(c, bx, by, 28, 62, stendardi[0], stendardi[1], stendardi[2]);
  }
  if (m.torce) {
    for (const [tx, ty] of [[38, 120], [362, 312], [38, 312], [362, 120]]) { torciaSupporto(c, tx, ty, m); M.torce.push({ x: tx, y: ty - 11 }); }
  }

  // ombra ai lati (profondita')
  const g = c.createLinearGradient(0, 0, VW, 0);
  g.addColorStop(0, "rgba(0,0,0,0.42)"); g.addColorStop(0.22, "rgba(0,0,0,0)"); g.addColorStop(0.78, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,0.42)");
  c.fillStyle = g; c.fillRect(0, 0, VW, TORRE_H);
  return M;
}

// fiamme animate + alone delle torce e degli ornamenti luminosi
function disegnaSfondoTorre(c, Mo, camY, t) {
  const tm = Mo.tm;
  const off = Math.floor(camY * 0.55);
  const y0 = -(off % TORRE_H);
  for (let k = 0; k < 3; k++) {
    const y = y0 + k * TORRE_H - (y0 < 0 ? 0 : TORRE_H);
    if (y > -TORRE_H && y < VH) c.drawImage(Mo.torre.cv, 0, y);
  }
  // fiamme (posizioni ripetute con il periodo)
  for (const tr of Mo.torre.torce) {
    for (let k = -1; k < 3; k++) {
      const y = tr.y - (off % TORRE_H) + k * TORRE_H;
      if (y < -20 || y > VH + 20) continue;
      const fl = Math.sin(t * 9 + tr.x + k) * 1.2;
      c.globalAlpha = 0.16; disco(c, tr.x, Math.round(y), 22, tm.torreCfg.luce);
      c.globalAlpha = 0.18; disco(c, tr.x, Math.round(y), 13, tm.torreCfg.luce);
      c.globalAlpha = 1;
      poli(c, [[tr.x - 4, y + 2], [tr.x - 2 + fl * 0.5, y - 6], [tr.x + fl, y - 11 - fl], [tr.x + 2 + fl * 0.5, y - 6], [tr.x + 4, y + 2]], "#e8541a");
      poli(c, [[tr.x - 3, y + 2], [tr.x + fl * 0.4, y - 8 - fl * 0.5], [tr.x + 3, y + 2]], "#ffb830");
      poli(c, [[tr.x - 1.5, y + 2], [tr.x + fl * 0.3, y - 3], [tr.x + 1.5, y + 2]], "#fff2a0");
    }
  }
  c.globalAlpha = 1;
}

// ---------------------------------------------------------------------
//  TEMI 7-12 (le stanze del castello)
// ---------------------------------------------------------------------
function temaTorre(o) {
  return Object.assign({
    astro: null, stelle: false, nuvole: null, strati: [], particelle: "polvere", decoro: [],
    capTipo: "pietra", ghiaccio: false, torreSeed: 1
  }, o);
}

const CIELO_NOTTE = ["#0a1230", "#1b2a63", "#3b5089"];
TEMI.push(
  temaTorre({ nome: "Ingresso del Castello", torre: "ingresso", torreSeed: 1,
    torreCfg: { base: "#4c5878", base2: "#455070", malta: "#2e3650", chiaro: "#6a789e", contorno: "#1a1f36", pietra: "#8a96b8", pietraChiara: "#b4c0e0", pietraScura: "#5a6688",
      cieloF: CIELO_NOTTE, lunaCol: "#fff4d0", lunaOmbra: "#e8dcb8", stendardi: ["#3f6fd8", "#ffd23f", "#2a4a9a"], torce: true, luce: "#ffb347" },
    terra: "#7c88ac", terraScura: "#5a6688", terraChiara: "#a4b0d2", erba: "#b4c0e0", erbaChiara: "#e4ecff", erbaScura: "#6a76a0", contorno: "#141a30",
    legno: "#6a7290", legnoScuro: "#3a4260", legnoChiaro: "#aab4d4",
    liquido: { tipo: "lava", col: "#ff5a1a", chiaro: "#ffd060", scuro: "#c2251a" }, buio: "#120a1e", particelle: "polvere", partCol: "#c8d4ff",
    slime: { g: "#6ad0c8", G: "#2f8a90", l: "#c8fff6" }, volatile: { b: "#7a6ab0", B: "#4a3f7a" }, riccio: { Q: "#8a7060", q: "#b09888" }, fantasma: { W: "#eef2ff", G: "#b8c0e8" } }),

  temaTorre({ nome: "Biblioteca Incantata", torre: "biblioteca", torreSeed: 2,
    torreCfg: { base: "#6a4a34", base2: "#5f4230", malta: "#3a281c", chiaro: "#86603f", contorno: "#1e120a", pietra: "#a07850", pietraChiara: "#d0a870", pietraScura: "#6a4a2c",
      cieloF: ["#241040", "#3a1a66", "#5a2a8a"], lunaCol: "#ffe8b0", lunaOmbra: "#e0c890", stendardi: ["#7a2a3a", "#ffd23f", "#4a1622"], torce: true, luce: "#ffc060" },
    terra: "#9a7452", terraScura: "#6f4f34", terraChiara: "#c49a6a", erba: "#d2aa72", erbaChiara: "#f4d8a0", erbaScura: "#8a6440", contorno: "#1e120a",
    legno: "#8a5a34", legnoScuro: "#4a2c16", legnoChiaro: "#c8905a",
    liquido: { tipo: "lava", col: "#ff8a1a", chiaro: "#ffe070", scuro: "#c2451a" }, buio: "#160c06", particelle: "lucciole", partCol: "#ffe6a0",
    slime: { g: "#e0a050", G: "#a06a28", l: "#ffe4b0" }, volatile: { b: "#c2405a", B: "#7a2238" }, riccio: { Q: "#5a3a2a", q: "#8a5e42" }, fantasma: { W: "#fff4e0", G: "#e8d0a8" } }),

  temaTorre({ nome: "Sala dell'Orologio", torre: "orologio", torreSeed: 3,
    torreCfg: { base: "#6a5c44", base2: "#5f513a", malta: "#3a3020", chiaro: "#8a7a58", contorno: "#1c1608", pietra: "#9a8a68", pietraChiara: "#d0be8c", pietraScura: "#6a5a3a",
      cieloF: ["#1a1030", "#2a1a50", "#40286c"], lunaCol: "#f4e8c8", lunaOmbra: "#d8c8a0", stendardi: null, torce: true, luce: "#ffc860",
      ottone: "#c9a24a", ottoneChiaro: "#f0d878", ottoneScuro: "#8a6a2a" },
    terra: "#8a7a58", terraScura: "#665838", terraChiara: "#b8a578", erba: "#d8b856", erbaChiara: "#fff0a0", erbaScura: "#9a7a2a", contorno: "#1c1608",
    legno: "#b08a3a", legnoScuro: "#5a4218", legnoChiaro: "#f0d070",
    liquido: { tipo: "lava", col: "#ff9a2a", chiaro: "#fff0a0", scuro: "#c2651a" }, buio: "#140e04", particelle: "scintille", partCol: "#ffe080",
    slime: { g: "#d8b040", G: "#9a7020", l: "#fff0a0" }, volatile: { b: "#5a5a78", B: "#38384f" }, riccio: { Q: "#5a4a6a", q: "#8a78a0" }, fantasma: { W: "#fff6dc", G: "#e0cc98" } }),

  temaTorre({ nome: "Laboratorio dell'Alchimista", torre: "alchimia", torreSeed: 4,
    torreCfg: { base: "#2f4c46", base2: "#294540", malta: "#1c302c", chiaro: "#44706a", contorno: "#0c1a18", pietra: "#5a8a80", pietraChiara: "#90c8ba", pietraScura: "#38605a",
      cieloF: CIELO_NOTTE, lunaCol: "#e0fff0", lunaOmbra: "#b8e0d0", stendardi: null, torce: true, luce: "#7affaa",
      liquido: "#3cd870", liquidoChiaro: "#b8ffcc" },
    terra: "#4a7a72", terraScura: "#33584f", terraChiara: "#78b0a0", erba: "#86e8a8", erbaChiara: "#ccffdc", erbaScura: "#3a9a68", contorno: "#0c1a18",
    legno: "#587a72", legnoScuro: "#2a443f", legnoChiaro: "#98c8b8",
    liquido: { tipo: "acqua", col: "#3cd870", chiaro: "#b8ffcc", scuro: "#1f8a4a" }, buio: "#06100c", particelle: "bolle", partCol: "#a8ffc4",
    slime: { g: "#a6f04a", G: "#5aa020", l: "#e8ffb0" }, volatile: { b: "#4a8a70", B: "#2a5a48" }, riccio: { Q: "#8a6248", q: "#b08a68" }, fantasma: { W: "#e8fff4", G: "#a8e0c8" } }),

  temaTorre({ nome: "Serra Stregata", torre: "serra", torreSeed: 5,
    torreCfg: { base: "#2f5a5c", base2: "#294f52", malta: "#1c3638", chiaro: "#468488", contorno: "#0a1c20", pietra: "#5a9a94", pietraChiara: "#98d8cc", pietraScura: "#38686a",
      cieloF: ["#0a1a3a", "#1a3a6a", "#3a6a9a"], lunaCol: "#f4ffe8", lunaOmbra: "#d0e8c0", stendardi: null, torce: false, luce: "#ffe080",
      foglia: "#3fae5a", fogliaChiara: "#7ae890", fogliaScura: "#2a7a44", fiore: "#ff7aa8" },
    terra: "#4c8a80", terraScura: "#356a62", terraChiara: "#7cc0b0", erba: "#5ad07a", erbaChiara: "#a0ffb0", erbaScura: "#2f9a52", contorno: "#0a1c20",
    legno: "#6a9a88", legnoScuro: "#2f5a4c", legnoChiaro: "#a8d8c0",
    liquido: { tipo: "acqua", col: "#2a9ad0", chiaro: "#a0f0ff", scuro: "#1a5a90" }, buio: "#061418", particelle: "lucciole", partCol: "#c8ff90",
    slime: { g: "#ff9ac0", G: "#c2507a", l: "#ffe0ee" }, volatile: { b: "#ffd23f", B: "#c29010" }, riccio: { Q: "#a0704a", q: "#c89870" }, fantasma: { W: "#f4fff8", G: "#c0e8d0" } }),

  temaTorre({ nome: "Torre del Conte", torre: "conte", torreSeed: 6,
    torreCfg: { base: "#4a2c4c", base2: "#422644", malta: "#2c1830", chiaro: "#64406a", contorno: "#12081a", pietra: "#7a4a7e", pietraChiara: "#b07ab4", pietraScura: "#4a2c50",
      cieloF: ["#1a0810", "#4a1428", "#8a2438"], lunaCol: "#ff8a7a", lunaOmbra: "#d0584a", stendardi: ["#c2253f", "#ffd23f", "#7a1226"], torce: true, luce: "#ff6a3a" },
    terra: "#6a4a70", terraScura: "#48304e", terraChiara: "#94709a", erba: "#b070c0", erbaChiara: "#e4b0f0", erbaScura: "#6a3a7e", contorno: "#12081a",
    legno: "#7a4a5a", legnoScuro: "#3a1a2a", legnoChiaro: "#c08090",
    liquido: { tipo: "lava", col: "#ff3a3a", chiaro: "#ffb070", scuro: "#8a1226" }, buio: "#0c040a", particelle: "braci", partCol: "#ff6a5a",
    slime: { g: "#b05ac0", G: "#6a2a80", l: "#f0c8ff" }, volatile: { b: "#3a2a5a", B: "#241a3c" }, riccio: { Q: "#4a3050", q: "#7a5a80" }, fantasma: { W: "#fff0f4", G: "#e8b0c8" } })
);
// =====================================================================
//  LIVELLI: generatore procedurale (sempre percorribile) + difficolta' crescente
// =====================================================================
// vel = velocita' dei nemici, ck = distanza tra i checkpoint (in tile)
const LIVELLI = [
  { tema: 0, seed: 11, lunghezza: 120, gap: 0.20, maxGap: 3, slime: 0.42, volatile: 0.00, spuntoni: 0.00, riccio: 0.00, fantasmi: 0.00, molle: 0.12, vel: 22, ck: 40 },
  { tema: 1, seed: 23, lunghezza: 140, gap: 0.28, maxGap: 3, slime: 0.36, volatile: 0.14, spuntoni: 0.12, riccio: 0.00, fantasmi: 0.00, molle: 0.12, vel: 26, ck: 40 },
  { tema: 2, seed: 37, lunghezza: 155, gap: 0.34, maxGap: 4, slime: 0.28, volatile: 0.18, spuntoni: 0.14, riccio: 0.12, fantasmi: 0.00, molle: 0.14, vel: 28, ck: 38 },
  { tema: 3, seed: 41, lunghezza: 170, gap: 0.36, maxGap: 4, slime: 0.22, volatile: 0.16, spuntoni: 0.14, riccio: 0.20, fantasmi: 0.00, molle: 0.14, vel: 30, ck: 36 },
  { tema: 4, seed: 53, lunghezza: 185, gap: 0.40, maxGap: 4, slime: 0.18, volatile: 0.20, spuntoni: 0.18, riccio: 0.20, fantasmi: 0.00, molle: 0.12, vel: 34, ck: 34 },
  { tema: 5, seed: 67, lunghezza: 205, gap: 0.38, maxGap: 4, slime: 0.14, volatile: 0.14, spuntoni: 0.16, riccio: 0.14, fantasmi: 0.20, molle: 0.12, vel: 36, ck: 34, boss: 1 },
  // ---- il castello: 6 stanze in salita ----
  { torre: true, tema: 6, seed: 101, righe: 56, dyMin: 2, dyMax: 3, lenMin: 5, lenMax: 8, slime: 0.25, volatile: 0.10, spuntoni: 0.00, riccio: 0.00, fantasmi: 0.00, molle: 0.10, vel: 24, ck: 5 },
  { torre: true, tema: 7, seed: 113, righe: 66, dyMin: 2, dyMax: 3, lenMin: 4, lenMax: 7, slime: 0.24, volatile: 0.14, spuntoni: 0.10, riccio: 0.08, fantasmi: 0.00, molle: 0.10, vel: 28, ck: 5 },
  { torre: true, tema: 8, seed: 127, righe: 76, dyMin: 3, dyMax: 3, lenMin: 4, lenMax: 6, slime: 0.20, volatile: 0.16, spuntoni: 0.12, riccio: 0.12, fantasmi: 0.08, molle: 0.12, vel: 30, ck: 5 },
  { torre: true, tema: 9, seed: 139, righe: 86, dyMin: 3, dyMax: 4, lenMin: 4, lenMax: 6, slime: 0.16, volatile: 0.18, spuntoni: 0.14, riccio: 0.14, fantasmi: 0.14, molle: 0.12, vel: 32, ck: 5 },
  { torre: true, tema: 10, seed: 151, righe: 96, dyMin: 3, dyMax: 4, lenMin: 3, lenMax: 6, slime: 0.14, volatile: 0.20, spuntoni: 0.16, riccio: 0.14, fantasmi: 0.18, molle: 0.12, vel: 34, ck: 5 },
  { torre: true, tema: 11, seed: 163, righe: 80, dyMin: 3, dyMax: 4, lenMin: 4, lenMax: 6, slime: 0.12, volatile: 0.16, spuntoni: 0.14, riccio: 0.12, fantasmi: 0.16, molle: 0.10, vel: 36, ck: 5, boss: 2 }
];

const ARENA_COLONNE = 25;   // 25 * 16 = 400 = larghezza dello schermo

function generaLivello(cfg) {
  if (cfg.torre) return generaTorre(cfg);
  const R = rng(cfg.seed);
  const W = cfg.lunghezza;
  const t = Array.from({ length: ROWS }, () => Array(W).fill(" "));
  const monete = [], cuori = [], nemici = [], molle = [], checkpoint = [];

  const terreno = (x0, x1, gh) => {
    for (let c = x0; c < x1 && c < W; c++) for (let r = gh; r < ROWS; r++) t[r][c] = "#";
  };
  const moneta = (c, r) => monete.push({ x: c * TILE + 8, y: r * TILE + 8, presa: false });
  const piatta = (c0, n, r) => { for (let i = 0; i < n; i++) if (c0 + i < W) t[r][c0 + i] = "P"; };

  let gh = 10;
  terreno(0, 12, gh);
  const start = { x: 3 * TILE, y: gh * TILE - 16 };
  let x = 12, ultimoCk = 0, ultimoCuore = 0;
  const fine = W - (cfg.boss ? 40 : 14);

  while (true) {
    let buco = 0;
    if (R() < cfg.gap) buco = 2 + Math.floor(R() * (cfg.maxGap - 1));
    const xs = x + buco;
    const restante = fine - xs;
    if (restante < 6) break;

    const ghPrec = gh;
    if (buco <= 3 && R() < 0.4) gh = clamp(gh + (R() < 0.5 ? -1 : 1), 8, 11);

    // che ostacolo mettere in questo tratto?
    const r = R();
    const s1 = cfg.slime, s2 = s1 + cfg.volatile, s3 = s2 + cfg.spuntoni, s4 = s3 + cfg.riccio, s5 = s4 + cfg.fantasmi;
    let cat = r < s1 ? "slime" : r < s2 ? "volatile" : r < s3 ? "spuntoni" : r < s4 ? "riccio" : r < s5 ? "fantasma" : "nulla";
    if (cat === "spuntoni" && restante < 11) cat = "nulla";
    if (cat === "riccio" && restante < 8) cat = "nulla";
    if (cat === "fantasma" && restante < 7) cat = "nulla";

    let L;
    if (cat === "spuntoni") L = Math.min(11 + Math.floor(R() * 3), restante);
    else if (cat === "riccio") L = Math.min(8 + Math.floor(R() * 4), restante);
    else L = Math.min(6 + Math.floor(R() * 7), restante);
    terreno(xs, xs + L, gh);

    // monete ad arco sopra il buco + isolotto di aiuto nei buchi larghi
    for (let i = 0; i < buco; i++) moneta(x + i, ghPrec - 3 - (i > 0 && i < buco - 1 ? 1 : 0));
    if (buco >= 3 && R() < 0.6) piatta(x + Math.floor((buco - 2) / 2), 2, ghPrec - 2);

    const sicuro = xs - ultimoCk > cfg.ck;
    if (sicuro) {
      checkpoint.push({ x: (xs + 2) * TILE + 4, y: gh * TILE, attivo: false });
      ultimoCk = xs;
    } else {
      const v = cfg.vel;
      if (cat === "slime") {
        const n = (L >= 10 && cfg.slime > 0.3) ? 2 : 1;
        for (let i = 0; i < n; i++) {
          const c = xs + Math.floor(L * (i + 1) / (n + 1));
          nemici.push({ tipo: "slime", x: c * TILE + 2, y: gh * TILE - 10, w: 12, h: 10, vx: (R() < 0.5 ? -1 : 1) * v, vivo: true, anim: R() * 6, hp: 1, flash: 0 });
        }
      } else if (cat === "volatile") {
        const c = xs + Math.floor(L / 2);
        nemici.push({ tipo: "volatile", x: c * TILE, y: (gh - 4) * TILE, x0: c * TILE, y0: (gh - 4) * TILE, w: 12, h: 8, vivo: true, fase: R() * 6, anim: 0, hp: 1, flash: 0 });
      } else if (cat === "spuntoni") {
        const n = L >= 12 && R() < 0.5 ? 2 : 1;
        const c0 = xs + 5 + Math.floor(R() * Math.max(1, L - 9 - n));
        for (let i = 0; i < n; i++) { t[gh - 1][c0 + i] = "^"; moneta(c0 + i, gh - 3); }
      } else if (cat === "riccio") {
        const c = xs + Math.floor(L / 2);
        nemici.push({ tipo: "riccio", x: c * TILE + 1, y: gh * TILE - 10, w: 14, h: 10, vx: (R() < 0.5 ? -1 : 1) * v * 0.8, vivo: true, anim: R() * 6, hp: 2, flash: 0 });
      } else if (cat === "fantasma") {
        const c = xs + Math.floor(L / 2);
        nemici.push({ tipo: "fantasma", x: c * TILE + 2, y: (gh - 3) * TILE, x0: c * TILE + 2, y0: (gh - 3) * TILE, w: 12, h: 12, vivo: true, fase: R() * 6, timido: true, hp: 1, flash: 0 });
      }

      // piattaforme (a senso unico: si salta attraverso da sotto)
      const vuoiCuore = xs - ultimoCuore > 50 && L >= 8;
      if (cat === "nulla" && L >= 9 && R() < cfg.molle) {
        const c = xs + Math.floor(L / 2);
        molle.push({ x: c * TILE, y: gh * TILE - 16, w: 16, h: 16, anim: 0 });
        piatta(c - 1, 4, gh - 7);
        for (let i = -1; i < 3; i++) moneta(c + i, gh - 8);
        if (vuoiCuore) { cuori.push({ x: c * TILE + 8, y: (gh - 8) * TILE + 8, preso: false }); ultimoCuore = xs; }
      } else if (L >= 7 && (vuoiCuore || R() < 0.5)) {
        const n = 3 + Math.floor(R() * 2);
        const c0 = xs + 1 + Math.floor(R() * (L - n - 1));
        const alta = !vuoiCuore && R() < 0.3;
        const riga = alta ? gh - 5 : gh - 3;
        piatta(c0, n, riga);
        if (vuoiCuore) { cuori.push({ x: (c0 + 1) * TILE + 8, y: (riga - 1) * TILE + 8, preso: false }); ultimoCuore = xs; }
        else for (let i = 0; i < n; i++) moneta(c0 + i, riga - 1);
      } else if (cat === "nulla" && R() < 0.55) {
        const n = 3 + Math.floor(R() * 3);
        const c0 = xs + 1 + Math.floor(R() * Math.max(1, L - n - 1));
        for (let i = 0; i < n; i++) moneta(c0 + i, gh - 2);
      }
    }
    x = xs + L;
  }

  terreno(x, W, gh);
  const goal = { x: (W - 6) * TILE - 2, y: gh * TILE - 32, w: 20, h: 32, attivo: true };
  let arena = null, boss = null;
  if (cfg.boss) {
    goal.attivo = false; goal.nascosto = true;
    const x0 = (W - ARENA_COLONNE) * TILE;
    arena = { tipo: "orizzontale", x0, x1: x0 + ARENA_COLONNE * TILE, camX: x0, camY: 0, y0: 0, gh, colMuro: W - ARENA_COLONNE, attiva: false, chiusa: false, vinta: false };
    checkpoint.push({ x: (W - ARENA_COLONNE - 6) * TILE + 4, y: gh * TILE, attivo: false });
    boss = nuovoBoss(arena, "fantasma");
  }
  return { t, w: W, h: ROWS, monete, cuori, nemici, molle, checkpoint, start, goal, arena, boss, gh0: 10, torre: false, liqY: LIQ_Y, premio: null };
}

function nuovoBoss(arena, tipo) {
  const vamp = tipo === "vampiro";
  return {
    tipo: tipo || "fantasma",
    x: vamp ? (arena.x0 + arena.x1) / 2 - 15 : arena.x1 + 60,
    y: vamp ? arena.y0 - 60 : arena.gh * TILE - 66,
    w: vamp ? 30 : 26, h: vamp ? 22 : 26,
    hp: vamp ? 34 : 24, hpMax: vamp ? 34 : 24,
    stato: "dormiente", t: 0, flash: 0, inv: 0, fase2: false, prossimoSparo: 1.0, tx: 0, ty: 0, sx: 0, ex: 0, dir: -1, anim: 0, morteT: 0
  };
}

// =====================================================================
//  STANZE IN SALITA (il castello): una torre di piattaforme da scalare
// =====================================================================
function generaTorre(cfg) {
  const R = rng(cfg.seed);
  const W = ARENA_COLONNE, H = cfg.righe;
  const t = Array.from({ length: H }, () => Array(W).fill(" "));
  const monete = [], cuori = [], nemici = [], molle = [], checkpoint = [], percorso = [];
  const boss2 = cfg.boss === 2;
  const F = 15;   // riga del pavimento dell'arena (solo stanza del boss)

  for (let r = 0; r < H; r++) { t[r][0] = "#"; t[r][W - 1] = "#"; }
  const soffitto = boss2 ? F - 10 : 3;
  for (let r = 0; r < soffitto; r++) for (let c = 0; c < W; c++) t[r][c] = "#";

  const moneta = (c, r) => monete.push({ x: c * TILE + 8, y: r * TILE + 8, presa: false });
  const piatta = (c0, n, r) => { for (let i = 0; i < n; i++) if (c0 + i >= 1 && c0 + i <= W - 2) t[r][c0 + i] = "P"; };

  // piattaforma di partenza: un'isola di pietra sospesa sul vuoto
  const sr = H - 6;
  for (let c = 8; c <= 16; c++) { t[sr][c] = "#"; t[sr + 1][c] = "#"; }
  const start = { x: 12 * TILE - 5, y: sr * TILE - 16 };
  checkpoint.push({ x: 12 * TILE + 8, y: sr * TILE, attivo: true, iniziale: true });
  const plat = [{ c0: 8, c1: 16, r: sr }];
  percorso.push({ c0: 8, c1: 16, r: sr });

  let cur = plat[0], k = 0, ultimoCuore = 0;
  const maxGapH = (dy) => dy <= 2 ? 3 : dy === 3 ? 2 : 1;

  while (true) {
    let dy = cfg.dyMin + Math.floor(R() * (cfg.dyMax - cfg.dyMin + 1));
    if (boss2 && cur.r - F <= cfg.dyMax) break;
    let nr = cur.r - dy;
    if (boss2 && nr <= F) nr = F + 1;
    if (!boss2 && nr < 9) break;
    dy = cur.r - nr;

    k++;
    const sicuro = k % cfg.ck === 0;
    let len = cfg.lenMin + Math.floor(R() * (cfg.lenMax - cfg.lenMin + 1));
    if (sicuro) len = Math.max(len, 5);
    let n0 = -1;
    for (let tent = 0; tent < 30; tent++) {
      const c = 1 + Math.floor(R() * (W - 2 - len));
      const gap = Math.max(0, c - cur.c1 - 1, cur.c0 - (c + len - 1) - 1);
      if (gap <= maxGapH(dy) && Math.abs(c - cur.c0) >= 1) { n0 = c; break; }
    }
    if (n0 < 0) n0 = clamp(Math.round((cur.c0 + cur.c1) / 2 - len / 2) + (R() < 0.5 ? -2 : 2), 1, W - 1 - len);
    const n1 = n0 + len - 1;
    piatta(n0, len, nr);
    const p = { c0: n0, c1: n1, r: nr };
    plat.push(p); percorso.push(p);
    const mid = n0 + Math.floor(len / 2);

    if (sicuro) {
      checkpoint.push({ x: mid * TILE + 8, y: nr * TILE, attivo: false });
    } else if (boss2 && nr < F + 5) {
      // sotto l'arena del boss niente ostacoli
    } else {
      const v = cfg.vel;
      const r = R();
      const s1 = cfg.slime, s2 = s1 + cfg.volatile, s3 = s2 + cfg.spuntoni, s4 = s3 + cfg.riccio, s5 = s4 + cfg.fantasmi;
      let cat = r < s1 ? "slime" : r < s2 ? "volatile" : r < s3 ? "spuntoni" : r < s4 ? "riccio" : r < s5 ? "fantasma" : "nulla";
      if ((cat === "slime") && len < 5) cat = "nulla";
      if (cat === "riccio" && len < 6) cat = "nulla";
      if (cat === "spuntoni" && len < 7) cat = "nulla";
      let occupata = cat !== "nulla";
      if (cat === "slime") nemici.push({ tipo: "slime", x: mid * TILE + 2, y: nr * TILE - 10, w: 12, h: 10, vx: (R() < 0.5 ? -1 : 1) * v, vivo: true, anim: R() * 6, hp: 1, flash: 0 });
      else if (cat === "riccio") nemici.push({ tipo: "riccio", x: mid * TILE + 1, y: nr * TILE - 10, w: 14, h: 10, vx: (R() < 0.5 ? -1 : 1) * v * 0.8, vivo: true, anim: R() * 6, hp: 2, flash: 0 });
      else if (cat === "volatile") nemici.push({ tipo: "volatile", x: mid * TILE, y: (nr - 3) * TILE, x0: mid * TILE, y0: (nr - 3) * TILE, w: 12, h: 8, vivo: true, fase: R() * 6, anim: 0, hp: 1, flash: 0 });
      else if (cat === "fantasma") nemici.push({ tipo: "fantasma", x: mid * TILE + 2, y: (nr - 3) * TILE, x0: mid * TILE + 2, y0: (nr - 3) * TILE, w: 12, h: 12, vivo: true, fase: R() * 6, timido: true, hp: 1, flash: 0 });
      else if (cat === "spuntoni") {
        const n = len >= 8 && R() < 0.5 ? 2 : 1;
        const c0 = n0 + 2 + Math.floor(R() * Math.max(1, len - 4 - n));
        for (let i = 0; i < n; i++) { t[nr - 1][c0 + i] = "^"; moneta(c0 + i, nr - 3); }
      }
      if (!occupata && len >= 5 && R() < cfg.molle) {
        molle.push({ x: mid * TILE, y: nr * TILE - 16, w: 16, h: 16, anim: 0 });
        piatta(mid - 1, 4, nr - 6);
        for (let i = -1; i < 3; i++) moneta(mid + i, nr - 7);
        if (k - ultimoCuore > 8) { cuori.push({ x: mid * TILE + 8, y: (nr - 7) * TILE + 8, preso: false }); ultimoCuore = k; }
      } else if (!occupata && R() < 0.55) {
        for (let i = 0; i < Math.min(3, len - 2); i++) moneta(n0 + 1 + i, nr - 1);
      }
      if (!occupata && k - ultimoCuore > 10 && len >= 4) { cuori.push({ x: mid * TILE + 8, y: (nr - 1) * TILE + 8, preso: false }); ultimoCuore = k; }
    }
    cur = p;
  }

  let goal, arena = null, boss = null;
  if (boss2) {
    // pavimento dell'arena: si attraversa da sotto (a senso unico), poi si sigilla
    for (let c = 1; c <= W - 2; c++) t[F][c] = "P";
    arena = { tipo: "torre", x0: 16, x1: W * TILE - 16, camX: 0, camY: (F - 10) * TILE, y0: (F - 10) * TILE, gh: F, attiva: false, chiusa: false, vinta: false };
    boss = nuovoBoss(arena, "vampiro");
    goal = { x: -200, y: 0, w: 20, h: 32, attivo: false, nascosto: true };
  } else {
    // uscita: una piattaforma di pietra con il portale
    const er = clamp(cur.r - 3, 5, 100);
    let n0 = -1;
    for (let tent = 0; tent < 30; tent++) {
      const c = 1 + Math.floor(R() * (W - 9));
      const gap = Math.max(0, c - cur.c1 - 1, cur.c0 - (c + 6) - 1);
      if (gap <= 2) { n0 = c; break; }
    }
    if (n0 < 0) n0 = clamp(Math.round((cur.c0 + cur.c1) / 2) - 3, 1, W - 8);
    for (let c = n0; c < n0 + 7; c++) t[er][c] = "P";
    percorso.push({ c0: n0, c1: n0 + 6, r: er });
    goal = { x: (n0 + 3) * TILE - 2, y: er * TILE - 32, w: 20, h: 32, attivo: true };
    checkpoint.push({ x: n0 * TILE + 12, y: er * TILE, attivo: false });
  }
  return { t, w: W, h: H, monete, cuori, nemici, molle, checkpoint, start, goal, arena, boss, gh0: sr, torre: true, liqY: (H - 2) * TILE, percorso, premio: null };
}
// =====================================================================
//  TOMMY E LA VILLA SCURA  -  motore di gioco
// =====================================================================

const canvas = document.getElementById("game");
canvas.width = VW * SCALE;
canvas.height = VH * SCALE;
const ctx = canvas.getContext("2d");
const FONT = "'Press Start 2P', 'Courier New', monospace";

const GRAV = 900, VEL_MAX = 125, SALTO_V = -310, SALTO2_V = -270;
const HP_MAX = 3;

// ---------------------------------------------------------------------
//  Stato
// ---------------------------------------------------------------------
let stato = "menu";   // menu | gioco | pausa | fineLivello | gameover | vittoria
let liv = null, livIdx = 0, M = null, tema = TEMI[0], SPR = null;
let giocatore = null, proiettili = [], orbi = [], particelle = [], popups = [], ambiente = [];
let camX = 0, camY = 0, scossa = 0, timerStato = 0, hitStop = 0, tempoGioco = 0;
let checkpointPos = { x: 0, y: 0 };
let vite = 5, punti = 0, contaMonete = 0, moneteLiv = 0, moneteTot = 0, nemiciBattuti = 0;
let banner = { testo: "", sotto: "", t: 0 };
let toast = { testo: "", t: 0 };
let livScelto = 0, tempoMenu = 0;
let ultimeStelle = 0;

const T = costruisciTommy();
const SPR_GLOBALI = (() => {
  const pm = { o: "#5b3f00", y: "#ffd23f", Y: "#e08a00", h: "#fff6b0" };
  const ph = { o: "#3a0f24", r: "#ff4d6d", R: "#c2253f", h: "#ff9aa8", d: "#4a3550" };
  const ps = { o: "#5b3f00", y: "#ffe066", h: "#fff7b0", w: "#ffffff" };
  const pmo = { o: "#3b2a3d", r: "#ff5d5d", R: "#c23333", h: "#ff9c9c", G: "#9aa3c7", g: "#c9d0ee" };
  return {
    moneta: MONETA.map((m) => sprite(m, pm)),
    cuore: sprite(CUORE_PIENO, ph), cuoreVuoto: sprite(CUORE_VUOTO, ph),
    stella: sprite(STELLA_SPARO, ps),
    mollaSu: sprite(MOLLA_SU, pmo), mollaGiu: sprite(MOLLA_GIU, pmo),
    testina: sprite(TOMMY_TESTA.slice(0, 12), PAL_TOMMY),
    chiave: sprite(CHIAVE, { o: "#5b3f00", y: "#ffd23f", h: "#fff6b0" }),
    gemma: sprite(GEMMA, { o: "#123a6a", C: "#4fc3ff", c: "#9fe4ff", W: "#ffffff", B: "#2a7ad0" })
  };
})();

// sprite dipendenti dal tema (nemici colorati in base al mondo)
function creaSpriteMondo(idx) {
  const tm = TEMI[idx];
  const pv = { o: "#1f2a3a", g: tm.slime.g, G: tm.slime.G, l: tm.slime.l, w: "#ffffff", k: "#1f2a3a" };
  const pf = { o: "#2a1b3d", b: tm.volatile.b, B: tm.volatile.B, w: "#ffffff", k: "#ff4d6d" };
  const pr = { o: "#3a2418", Q: tm.riccio.Q, q: tm.riccio.q, s: "#ffd9b0", k: "#2a1b3d" };
  const pg = { o: "#4a4f7a", W: tm.fantasma.W, G: tm.fantasma.G, k: "#2a1b3d", m: "#ff9ab0" };
  const S = {
    slime: [sprite(SLIME_A, pv), sprite(SLIME_B, pv)],
    volatile: [sprite(VOLATILE_A, pf), sprite(VOLATILE_B, pf)],
    riccio: [sprite(RICCIO_A, pr), sprite(RICCIO_B, pr)],
    fantasma: [sprite(FANTASMA_A, pg), sprite(FANTASMA_SHY, pg)],
  };
  // boss: fantasma ingrandito x2 con corona e occhi arrabbiati
  const pb = { o: "#2a1b4d", W: "#e8dcff", G: "#a48ae0", k: "#2a1b3d", m: "#ff9ab0" };
  const base = sprite(FANTASMA_A, pb);
  const big = creaCanvas(32, 34), bc = big.getContext("2d");
  bc.imageSmoothingEnabled = false;
  bc.drawImage(base, 0, 0, 16, 16, 0, 2, 32, 32);
  // occhi rossi arrabbiati + sopracciglia
  R_(bc, 8, 12, 6, 6, "#2a1b4d"); R_(bc, 18, 12, 6, 6, "#2a1b4d");
  R_(bc, 9, 13, 4, 4, "#ff3b4f"); R_(bc, 19, 13, 4, 4, "#ff3b4f");
  R_(bc, 10, 14, 2, 2, "#ffd0d0"); R_(bc, 20, 14, 2, 2, "#ffd0d0");
  R_(bc, 7, 10, 3, 2, "#2a1b4d"); R_(bc, 10, 11, 3, 2, "#2a1b4d");
  R_(bc, 22, 11, 3, 2, "#2a1b4d"); R_(bc, 25, 10, 3, 2, "#2a1b4d");
  R_(bc, 12, 22, 8, 2, "#2a1b4d");
  // corona
  R_(bc, 8, 4, 16, 5, "#2a1b4d");
  R_(bc, 9, 5, 14, 3, "#ffd23f");
  for (const cx of [9, 15, 21]) { R_(bc, cx, 1, 3, 4, "#2a1b4d"); R_(bc, cx + 1, 2, 1, 3, "#ffd23f"); }
  R_(bc, 15, 5, 2, 2, "#ff4d6d");
  S.boss = big;
  const bianco = creaCanvas(32, 34), wc = bianco.getContext("2d");
  wc.drawImage(big, 0, 0);
  wc.globalCompositeOperation = "source-atop";
  wc.fillStyle = "rgba(255,255,255,0.85)"; wc.fillRect(0, 0, 32, 34);
  S.bossFlash = bianco;
  // secondo boss: pipistrello gigante con corona e zanne
  const pvamp = { o: "#12081a", b: "#7a5ab0", B: "#4a3474", w: "#ffffff", k: "#ff3b4f" };
  S.vampiro = [VOLATILE_A, VOLATILE_B].map((rows, fi) => {
    const base = sprite(rows, pvamp);
    const big = creaCanvas(32, 28), vc = big.getContext("2d");
    vc.imageSmoothingEnabled = false;
    vc.drawImage(base, 0, 0, 16, 12, 0, 3, 32, 24);
    const ey = fi === 0 ? 15 : 19;
    R_(vc, 12, ey, 4, 4, "#12081a"); R_(vc, 18, ey, 4, 4, "#12081a");
    R_(vc, 13, ey + 1, 2, 2, "#ff3b4f"); R_(vc, 19, ey + 1, 2, 2, "#ff3b4f");
    R_(vc, 12, ey - 2, 4, 1, "#12081a"); R_(vc, 18, ey - 2, 4, 1, "#12081a");
    R_(vc, 13, ey + 5, 2, 3, "#ffffff"); R_(vc, 19, ey + 5, 2, 3, "#ffffff");
    R_(vc, 13, ey + 8, 1, 1, "#12081a"); R_(vc, 19, ey + 8, 1, 1, "#12081a");
    // corona
    R_(vc, 12, ey - 8, 10, 4, "#12081a"); R_(vc, 13, ey - 7, 8, 2, "#ffd23f");
    for (const cx of [12, 16, 20]) { R_(vc, cx, ey - 11, 3, 4, "#12081a"); R_(vc, cx + 1, ey - 10, 1, 3, "#ffd23f"); }
    R_(vc, 16, ey - 7, 2, 1, "#ff4d6d");
    return big;
  });
  S.vampiroFlash = S.vampiro.map((im) => {
    const cv = creaCanvas(32, 28), wc2 = cv.getContext("2d");
    wc2.drawImage(im, 0, 0);
    wc2.globalCompositeOperation = "source-atop";
    wc2.fillStyle = "rgba(255,255,255,0.85)"; wc2.fillRect(0, 0, 32, 28);
    return cv;
  });
  return S;
}

// ---------------------------------------------------------------------
//  Salvataggi
// ---------------------------------------------------------------------
let salvataggio = { sbloccati: 1, stelle: [], record: 0 };
try {
  const s = JSON.parse(localStorage.getItem("tommy_v2") || "null");
  if (s && typeof s.sbloccati === "number") salvataggio = Object.assign(salvataggio, s);
} catch (e) { /* niente */ }
// il salvataggio della versione con 6 mondi si estende alle nuove stanze del castello
while (salvataggio.stelle.length < LIVELLI.length) salvataggio.stelle.push(0);
(function () {
  let ultimo = -1;
  salvataggio.stelle.forEach((st, i) => { if (st > 0) ultimo = i; });
  salvataggio.sbloccati = clamp(Math.max(salvataggio.sbloccati, ultimo + 2), 1, LIVELLI.length);
})();
function salva() { try { localStorage.setItem("tommy_v2", JSON.stringify(salvataggio)); } catch (e) { /* niente */ } }

// ---------------------------------------------------------------------
//  Input
// ---------------------------------------------------------------------
const In = { sinistra: false, destra: false, giu: false, salto: false, fuoco: false, saltoEdge: false, startEdge: false, navSx: false, navDx: false };
const MAP_TASTI = {
  arrowleft: "sinistra", a: "sinistra", arrowright: "destra", d: "destra", arrowdown: "giu", s: "giu",
  arrowup: "salto", w: "salto", " ": "salto", z: "salto", x: "fuoco", j: "fuoco", k: "fuoco"
};

window.addEventListener("keydown", (e) => {
  avviaAudio();
  const k = e.key.toLowerCase();
  const az = MAP_TASTI[k];
  if (az) {
    e.preventDefault();
    if (az === "salto" && !In.salto) In.saltoEdge = true;
    if ((az === "sinistra" || az === "destra") && !In[az]) { if (az === "sinistra") In.navSx = true; else In.navDx = true; }
    In[az] = true;
  }
  if (k === "enter") { e.preventDefault(); In.startEdge = true; }
  if ((k === "p" || k === "escape") && !e.repeat) togglePausa();
  if (k === "m" && !e.repeat) toggleSuono();
});
window.addEventListener("keyup", (e) => {
  const az = MAP_TASTI[e.key.toLowerCase()];
  if (az) In[az] = false;
});
window.addEventListener("blur", () => {
  In.sinistra = In.destra = In.giu = In.salto = In.fuoco = false;
  if (stato === "gioco") stato = "pausa";
});
document.addEventListener("visibilitychange", () => { if (document.hidden && stato === "gioco") stato = "pausa"; });

function segnaTouch() { document.body.classList.add("touch"); }

document.querySelectorAll("[data-azione]").forEach((b) => {
  const az = b.dataset.azione;
  const giu = (e) => {
    e.preventDefault(); avviaAudio(); segnaTouch();
    In[az] = true; In.startEdge = true;
    if (az === "salto") In.saltoEdge = true;
    if (az === "sinistra") In.navSx = true;
    if (az === "destra") In.navDx = true;
    b.classList.add("premuto");
  };
  const su = (e) => { e.preventDefault(); In[az] = false; b.classList.remove("premuto"); };
  b.addEventListener("pointerdown", giu);
  b.addEventListener("pointerup", su);
  b.addEventListener("pointerleave", su);
  b.addEventListener("pointercancel", su);
  b.addEventListener("contextmenu", (e) => e.preventDefault());
});

canvas.addEventListener("pointerdown", (e) => {
  avviaAudio();
  if (e.pointerType === "touch") segnaTouch();
  const r = canvas.getBoundingClientRect();
  const lx = (e.clientX - r.left) / r.width * VW;
  if (stato === "pausa") { togglePausa(); return; }
  if (stato === "menu") {
    if (lx < VW * 0.28) In.navSx = true;
    else if (lx > VW * 0.72) In.navDx = true;
    else In.startEdge = true;
  } else In.startEdge = true;
});

const btnPausa = document.getElementById("btn-pausa");
const btnSuono = document.getElementById("btn-suono");
if (btnPausa) btnPausa.addEventListener("click", () => { avviaAudio(); togglePausa(); btnPausa.blur(); });
if (btnSuono) btnSuono.addEventListener("click", () => { avviaAudio(); toggleSuono(); btnSuono.blur(); });

function togglePausa() {
  if (stato === "gioco") stato = "pausa";
  else if (stato === "pausa") stato = "gioco";
}
function toggleSuono() {
  impostaSuono(!AC.muto);
  if (btnSuono) btnSuono.textContent = AC.muto ? "🔇" : "🔊";
}
// ---------------------------------------------------------------------
//  Caricamento livello
// ---------------------------------------------------------------------
function calcolaMaschere() {
  const W = liv.w, HH = liv.h;
  liv.mask = new Uint8Array(W * HH);
  const sol = (c, r) => {
    if (c < 0 || c >= W) return true;
    if (r < 0) return false;
    if (r >= HH) return true;
    return liv.t[r][c] === "#";
  };
  for (let r = 0; r < HH; r++) {
    for (let c = 0; c < W; c++) {
      liv.mask[r * W + c] = (sol(c, r - 1) ? 1 : 0) | (sol(c + 1, r) ? 2 : 0) | (sol(c, r + 1) ? 4 : 0) | (sol(c - 1, r) ? 8 : 0) |
        (sol(c + 1, r - 1) ? 16 : 0) | (sol(c + 1, r + 1) ? 32 : 0) | (sol(c - 1, r + 1) ? 64 : 0) | (sol(c - 1, r - 1) ? 128 : 0);
    }
  }
}

function nuovoGiocatore(pos) {
  return {
    x: pos.x, y: pos.y, w: 10, h: 16, vx: 0, vy: 0, dir: 1, suolo: false,
    coyote: 0, buffer: 0, saltiAria: 0, saltando: false, anim: 0,
    invuln: 0, hurt: 0, morto: false, timerMorte: 0, fuocoCd: 0, hp: HP_MAX,
    sx: 1, sy: 1, ignoraP: 0
  };
}

function caricaLivello(i) {
  livIdx = i;
  liv = generaLivello(LIVELLI[i]);
  M = creaMondo(LIVELLI[i].tema);
  M.decori = creaDecori(M.tm);
  tema = M.tm;
  SPR = creaSpriteMondo(LIVELLI[i].tema);
  calcolaMaschere();
  liv.libero = new Uint8Array(liv.w + 2);
  const occupa = (c, n) => { for (let i = -n; i <= n; i++) if (c + i >= 0 && c + i < liv.w) liv.libero[c + i] = 1; };
  for (const s of liv.molle) occupa(Math.floor(s.x / TILE), 1);
  for (const k of liv.checkpoint) occupa(Math.floor(k.x / TILE), 1);
  occupa(Math.floor(liv.goal.x / TILE), 2);
  giocatore = nuovoGiocatore(liv.start);
  checkpointPos = { x: liv.start.x, y: liv.start.y };
  proiettili = []; orbi = []; particelle = []; popups = [];
  initAmbiente();
  moneteLiv = 0; moneteTot = liv.monete.length; nemiciBattuti = 0;
  banner = { testo: "MONDO " + (i + 1), sotto: tema.nome, t: 3.2 };
  toast = { testo: "", t: 0 };
  scossa = 0; hitStop = 0; bossMusica = false;
  camY = 0;
  stato = "gioco";
  aggiornaCamera(0, true);
}

function iniziaPartita(daLivello) {
  vite = 5; punti = 0; contaMonete = 0;
  caricaLivello(daLivello);
}

// ---------------------------------------------------------------------
//  Tile e collisioni
// ---------------------------------------------------------------------
function tile(c, r) {
  if (c < 0 || c >= liv.w) return "#";
  if (r < 0 || r >= liv.h) return " ";
  return liv.t[r][c];
}
const solido = (ch) => ch === "#";
const sovrappone = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

function muoviX(e, dx) {
  e.x += dx;
  const c0 = Math.floor(e.x / TILE), c1 = Math.floor((e.x + e.w - 0.01) / TILE);
  const r0 = Math.floor(e.y / TILE), r1 = Math.floor((e.y + e.h - 0.01) / TILE);
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      if (solido(tile(c, r))) {
        e.x = dx > 0 ? c * TILE - e.w : (c + 1) * TILE;
        e.vx = 0;
        return;
      }
    }
  }
}

function muoviY(e, dy) {
  const vecchioB = e.y + e.h;
  e.y += dy;
  const c0 = Math.floor(e.x / TILE), c1 = Math.floor((e.x + e.w - 0.01) / TILE);
  const r0 = Math.floor(e.y / TILE), r1 = Math.floor((e.y + e.h - 0.01) / TILE);
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      const ch = tile(c, r);
      if (ch === "#") {
        if (dy > 0) { e.y = r * TILE - e.h; e.suolo = true; } else { e.y = (r + 1) * TILE; }
        e.vy = 0;
        return;
      }
      if (ch === "P" && dy > 0 && !(e.ignoraP > 0) && vecchioB <= r * TILE + 0.01 && e.y + e.h > r * TILE) {
        e.y = r * TILE - e.h; e.suolo = true; e.vy = 0;
        return;
      }
    }
  }
}

function sopraPiattaforma(p) {
  const r = Math.floor((p.y + p.h + 1) / TILE);
  return tile(Math.floor((p.x + 2) / TILE), r) === "P" || tile(Math.floor((p.x + p.w - 2) / TILE), r) === "P";
}

function toccaSpuntoni(p) {
  const c0 = Math.floor(p.x / TILE), c1 = Math.floor((p.x + p.w) / TILE);
  const r0 = Math.floor(p.y / TILE), r1 = Math.floor((p.y + p.h) / TILE);
  const corpo = { x: p.x + 1, y: p.y + 3, w: p.w - 2, h: p.h - 3 };
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      if (tile(c, r) === "^" && sovrappone(corpo, { x: c * TILE + 2, y: r * TILE + 7, w: 12, h: 9 })) return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------
//  Effetti
// ---------------------------------------------------------------------
function particella(o) {
  if (particelle.length > 500) return;
  const p = Object.assign({ vx: 0, vy: 0, g: 0, vita: 0.6, col: "#fff", s: 2 }, o);
  p.tot = p.vita;
  particelle.push(p);
}
function scintille(x, y, col, n, forza) {
  const f = forza || 60;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, v = 20 + Math.random() * f;
    particella({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 25, g: 140, vita: 0.4 + Math.random() * 0.35, col, s: Math.random() < 0.3 ? 3 : 2 });
  }
}
function polvere(x, y, n) {
  for (let i = 0; i < n; i++) {
    particella({ x: x + (Math.random() - 0.5) * 8, y, vx: (Math.random() - 0.5) * 44, vy: -Math.random() * 26, vita: 0.3 + Math.random() * 0.2, col: "#f4f4ff", s: 2 });
  }
}
function coriandoli(n) {
  const cols = ["#ff6b6b", "#ffd23f", "#6bff95", "#6bd0ff", "#c88bff", "#ffffff"];
  for (let i = 0; i < n; i++) {
    particella({ x: camX + Math.random() * VW, y: -10 - Math.random() * 40, vx: (Math.random() - 0.5) * 50, vy: 20 + Math.random() * 60, g: 25, vita: 3 + Math.random() * 2, col: cols[i % cols.length], s: 3 });
  }
}
function scuoti(v) { scossa = Math.max(scossa, v); }
function mostraToast(testo) { toast = { testo, t: 2.2 }; }
function popup(x, y, testo, col) { popups.push({ x, y, testo, col: col || "#ffd23f", t: 0.9 }); }
function vitaExtra() { vite = Math.min(9, vite + 1); suono("vita"); mostraToast("VITA EXTRA!"); }

// ---------------------------------------------------------------------
//  Danni, morte
// ---------------------------------------------------------------------
function danneggia(daX) {
  const p = giocatore;
  if (p.morto || p.invuln > 0) return;
  p.hp--;
  if (p.hp <= 0) { muori("colpito"); return; }
  p.invuln = 1.8; p.hurt = 0.32;
  p.vy = -190; p.vx = (p.x + p.w / 2 < daX ? -1 : 1) * 125;
  p.suolo = false;
  suono("male"); scuoti(3);
  scintille(p.x + 5, p.y + 8, "#ff6b6b", 10);
}

function muori(causa) {
  const p = giocatore;
  if (p.morto) return;
  p.morto = true; p.timerMorte = 0; p.vx = 0; p.hp = 0;
  p.affonda = false;
  if (causa === "liquido") {
    p.vy = 0; p.affonda = true;
    suono("splash");
    const col = tema.liquido.chiaro;
    for (let i = 0; i < 18; i++) particella({ x: p.x + 5, y: liv.liqY, vx: (Math.random() - 0.5) * 70, vy: -60 - Math.random() * 90, g: 300, vita: 0.7, col, s: 2 });
  } else {
    p.vy = -250;
    suono("morte");
    for (let i = 0; i < 16; i++) scintille(p.x + 5, p.y + 8, i % 2 ? "#ff6b6b" : "#3f8cff", 1);
  }
  scuoti(5);
  // se muoio nell'arena del boss, si ricomincia lo scontro
  const a = liv.arena;
  if (a && a.attiva) resetArena();
}

function rinasci() {
  const p = giocatore;
  p.x = checkpointPos.x; p.y = checkpointPos.y;
  p.affonda = false;
  p.vx = 0; p.vy = 0; p.morto = false; p.invuln = 2.2; p.hurt = 0; p.dir = 1; p.saltiAria = 0; p.hp = HP_MAX;
  aggiornaCamera(0, true);
}

function aggiornaMorte(dt) {
  const p = giocatore;
  p.timerMorte += dt;
  if (p.affonda) p.y += 42 * dt;
  else if (p.vy !== 0 || p.timerMorte < 0.05) { p.vy += GRAV * dt; p.y += p.vy * dt; }
  if (p.timerMorte > 1.4) {
    vite--;
    if (vite <= 0) {
      stato = "gameover"; timerStato = 0;
      if (punti > salvataggio.record) { salvataggio.record = punti; salva(); }
      suono("gameover");
    } else rinasci();
  }
}

// ---------------------------------------------------------------------
//  Giocatore
// ---------------------------------------------------------------------
function aggiornaGiocatore(dt) {
  const p = giocatore;
  const dir = p.hurt > 0 ? 0 : (In.destra ? 1 : 0) - (In.sinistra ? 1 : 0);
  const ghiaccio = tema.ghiaccio;
  const accel = p.suolo ? (ghiaccio ? 360 : 1100) : 750;
  if (dir) {
    p.vx = clamp(p.vx + dir * accel * dt, -VEL_MAX, VEL_MAX);
    p.dir = dir;
  } else if (p.hurt <= 0) {
    const attrito = (p.suolo ? (ghiaccio ? 150 : 1400) : 350) * dt;
    p.vx = Math.abs(p.vx) <= attrito ? 0 : p.vx - Math.sign(p.vx) * attrito;
  }
  p.hurt -= dt;

  // salto (buffer, coyote, doppio salto, salto variabile)
  if (In.saltoEdge) p.buffer = 0.12;
  p.buffer -= dt; p.coyote -= dt;
  if (p.suolo) { p.coyote = 0.1; p.saltiAria = 0; }
  if (p.buffer > 0 && p.hurt <= 0) {
    if (p.coyote > 0) {
      p.vy = SALTO_V; p.coyote = 0; p.buffer = 0; p.suolo = false; p.saltando = true;
      p.sx = 0.78; p.sy = 1.25;
      suono("salto"); polvere(p.x + 5, p.y + p.h, 5);
    } else if (p.saltiAria < 1) {
      p.vy = SALTO2_V; p.saltiAria++; p.buffer = 0; p.saltando = true;
      p.sx = 0.8; p.sy = 1.22;
      suono("salto2"); scintille(p.x + 5, p.y + p.h, "#ffffff", 8, 40);
    }
  }
  if (p.saltando && !In.salto) { if (p.vy < -110) p.vy *= 0.5; p.saltando = false; }
  if (p.vy >= 0) p.saltando = false;

  // scendere dalle piattaforme a senso unico
  p.ignoraP -= dt;
  if (In.giu && p.suolo && sopraPiattaforma(p)) { p.ignoraP = 0.22; p.suolo = false; p.y += 1; }

  p.vy = Math.min(p.vy + GRAV * dt, 380);
  muoviX(p, p.vx * dt);
  const eraSuolo = p.suolo, vyPrima = p.vy;
  p.suolo = false;
  muoviY(p, p.vy * dt);
  if (p.suolo && !eraSuolo && vyPrima > 150) {
    polvere(p.x + 5, p.y + p.h, 6);
    suono("atterra");
    p.sx = 1.25; p.sy = 0.75;
  }
  const rit = Math.min(1, dt * 14);
  p.sx += (1 - p.sx) * rit; p.sy += (1 - p.sy) * rit;

  // sparo
  p.fuocoCd -= dt;
  if (In.fuoco && p.fuocoCd <= 0 && proiettili.length < 4 && p.hurt <= 0) {
    proiettili.push({ x: p.x + p.w / 2 + p.dir * 7 - 3, y: p.y + 6, w: 6, h: 6, vx: p.dir * 250, vita: 0.85 });
    p.fuocoCd = 0.24;
    suono("spara");
  }

  p.anim += dt * Math.abs(p.vx) / 15;
  if (p.invuln > 0) p.invuln -= dt;
  if (p.y + p.h > liv.liqY + 8) muori("liquido");
}

// ---------------------------------------------------------------------
//  Nemici
// ---------------------------------------------------------------------
function camminaSuTerreno(e, dt) {
  e.anim += dt;
  const nx = e.x + e.vx * dt;
  const fronteX = e.vx > 0 ? nx + e.w : nx;
  const c = Math.floor(fronteX / TILE);
  const rPiedi = Math.floor((e.y + e.h + 1) / TILE);
  const rCorpo = Math.floor((e.y + e.h - 1) / TILE);
  const sotto = tile(c, rPiedi);
  if (solido(tile(c, rCorpo)) || !(sotto === "#" || sotto === "P")) e.vx = -e.vx;
  else e.x = nx;
}

function aggiornaNemico(e, dt) {
  if (e.flash > 0) e.flash -= dt;
  const p = giocatore;
  if (e.tipo === "slime" || e.tipo === "riccio") camminaSuTerreno(e, dt);
  else if (e.tipo === "volatile") {
    e.fase += dt * 2; e.anim += dt * 12;
    e.x = e.x0 + Math.sin(e.fase) * 42;
    e.y = e.y0 + Math.sin(e.fase * 2) * 10;
  } else if (e.tipo === "fantasma") {
    e.fase += dt * 2;
    const px = p.x + p.w / 2, gx = e.x + e.w / 2;
    e.timido = (px < gx && p.dir < 0) || (px > gx && p.dir > 0);
    const dx = px - gx, dy = (p.y + 6) - (e.y + 6), d = Math.hypot(dx, dy) || 1;
    if (!e.timido && d < 260 && !p.morto) { e.x += dx / d * 34 * dt; e.y += dy / d * 24 * dt; e.y0 = e.y; }
    else e.y = e.y0 + Math.sin(e.fase) * 3;
  }
}

function uccidi(e, pts) {
  e.vivo = false;
  nemiciBattuti++;
  punti += pts;
  const cols = e.tipo === "slime" ? [tema.slime.g, tema.slime.l, "#ffffff"] : e.tipo === "volatile" ? [tema.volatile.b, tema.volatile.B, "#ff4d6d"]
    : e.tipo === "riccio" ? [tema.riccio.Q, tema.riccio.q, "#ffd9b0"] : ["#ffffff", tema.fantasma.G, "#ff9ab0"];
  for (let i = 0; i < 12; i++) scintille(e.x + e.w / 2, e.y + e.h / 2, cols[i % 3], 1, 70);
  popup(e.x + e.w / 2, e.y - 4, "+" + pts);
  suono("colpito");
  scuoti(2);
}

// ---------------------------------------------------------------------
//  Boss
// ---------------------------------------------------------------------
function chiudiArena(a) {
  if (a.tipo === "torre") {
    // il pavimento diventa solido e sotto compare la pietra: non si scappa piu'
    for (let c = 1; c <= liv.w - 2; c++) for (let r = a.gh; r <= a.gh + 3; r++) liv.t[r][c] = "#";
  } else {
    for (let r = 0; r < a.gh; r++) liv.t[r][a.colMuro] = "#";
  }
  calcolaMaschere();
}
function apriArena(a) {
  if (a.tipo === "torre") {
    for (let c = 1; c <= liv.w - 2; c++) { liv.t[a.gh][c] = "P"; for (let r = a.gh + 1; r <= a.gh + 3; r++) liv.t[r][c] = " "; }
  } else {
    for (let r = 0; r < a.gh; r++) liv.t[r][a.colMuro] = " ";
  }
  calcolaMaschere();
}

function attivaArena() {
  const a = liv.arena, b = liv.boss;
  a.attiva = true; a.chiusa = true;
  chiudiArena(a);
  b.stato = "entra"; b.t = 0;
  bossMusica = true;
  scuoti(6); suono("boss");
  banner = { testo: b.tipo === "vampiro" ? "CONTE PIPISTRELLO" : "RE FANTASMA", sotto: "Sconfiggilo!", t: 2.6 };
}

function resetArena() {
  const a = liv.arena;
  a.attiva = false; a.chiusa = false;
  apriArena(a);
  liv.boss = nuovoBoss(a, liv.boss ? liv.boss.tipo : "fantasma");
  orbi = [];
  liv.nemici = liv.nemici.filter((e) => !e.minion);
  bossMusica = false;
}

function dannoBoss(n) {
  const b = liv.boss;
  if (!b || b.inv > 0 || b.stato === "morto" || b.stato === "entra" || b.stato === "dormiente") return false;
  b.hp -= n; b.inv = 0.55; b.flash = 0.45;
  suono("colpito"); scuoti(3);
  scintille(b.x + 13, b.y + 13, "#ffffff", 10, 80);
  if (b.hp <= 0) {
    b.stato = "morto"; b.t = 0; orbi = [];
    for (const e of liv.nemici) if (e.minion) e.vivo = false;
    suono("bossKO"); bossMusica = false;
  } else if (b.hp <= b.hpMax / 2 && !b.fase2) {
    b.fase2 = true; mostraToast("IL RE E' FURIOSO!");
  }
  return true;
}

function sparaOrbo() {
  const b = liv.boss, p = giocatore;
  const bx = b.x + b.w / 2, by = b.y + b.h / 2;
  const dx = p.x + p.w / 2 - bx, dy = p.y + p.h / 2 - by, d = Math.hypot(dx, dy) || 1;
  const v = b.fase2 ? 105 : 85;
  orbi.push({ x: bx - 4, y: by - 4, w: 8, h: 8, vx: dx / d * v, vy: dy / d * v, vita: 5 });
  beep(520, 180, 0.14, "sawtooth", 0.1);
}

function generaFantasmini() {
  const a = liv.arena;
  for (const dx of [70, 300]) {
    const x = a.x0 + dx, y = a.gh * TILE - 60;
    liv.nemici.push({ tipo: "fantasma", x, y, x0: x, y0: y, w: 12, h: 12, vivo: true, fase: 0, timido: false, hp: 1, flash: 0, minion: true });
  }
}

function ventaglioOrbi() {
  const b = liv.boss, p = giocatore;
  const bx = b.x + b.w / 2, by = b.y + b.h / 2;
  const base = Math.atan2(p.y + p.h / 2 - by, p.x + p.w / 2 - bx);
  const v = b.fase2 ? 100 : 82;
  for (const da of [-0.4, 0, 0.4]) {
    orbi.push({ x: bx - 4, y: by - 4, w: 8, h: 8, vx: Math.cos(base + da) * v, vy: Math.sin(base + da) * v, vita: 5 });
  }
  beep(420, 140, 0.18, "sawtooth", 0.12);
}

function generaPipistrelli() {
  const a = liv.arena;
  if (liv.nemici.filter((e) => e.minion && e.vivo).length >= 3) return;
  for (const dx of [70, 300]) {
    const x = a.x0 + dx, y = a.y0 + 50;
    liv.nemici.push({ tipo: "volatile", x, y, x0: x, y0: y, w: 12, h: 8, vivo: true, fase: dx, anim: 0, hp: 1, flash: 0, minion: true });
  }
}

function aggiornaMorteBoss(dt) {
  const b = liv.boss, a = liv.arena;
  scuoti(3);
  if (Math.random() < 0.5) scintille(b.x + Math.random() * b.w, b.y + Math.random() * b.h, Math.random() < 0.5 ? "#ffd23f" : "#ffffff", 4, 90);
  b.y += 6 * dt;
  if (b.t > 2.6) {
    const tipoBoss = b.tipo;
    liv.premio = { tipo: tipoBoss === "vampiro" ? "gemma" : "chiave", x: b.x + b.w / 2, y: b.y + b.h / 2, vy: -140, presa: false, t: 0 };
    liv.boss = null;
    a.vinta = true; a.attiva = false; a.chiusa = false;
    if (a.tipo !== "torre") apriArena(a);
    punti += 3000;
    coriandoli(80);
    mostraToast(tipoBoss === "vampiro" ? "PRENDI LA GEMMA!" : "PRENDI LA CHIAVE!");
    suono("livello");
  }
}

function aggiornaVampiro(dt) {
  const b = liv.boss, a = liv.arena, p = giocatore;
  const yC = a.y0 + 24, yG = a.gh * TILE - b.h - 3;
  const cambia = (st) => { b.stato = st; b.t = 0; };
  switch (b.stato) {
    case "entra":
      b.y += (yC - b.y) * Math.min(1, dt * 2.5);
      b.x += ((a.x0 + a.x1) / 2 - b.w / 2 - b.x) * Math.min(1, dt * 2);
      if (b.t > 1.6) { cambia("appeso"); b.sparato = false; }
      break;
    case "appeso": {
      const durata = b.fase2 ? 1.15 : 1.7;
      b.y = yC + Math.sin(b.t * 7) * 1.5;
      b.x += Math.sin(b.t * 40) * 0.5;
      if (!b.sparato && b.t > durata * 0.45) { ventaglioOrbi(); b.sparato = true; }
      if (b.t > durata) {
        const cx = b.x + b.w / 2, tx = p.x + p.w / 2;
        const dir = tx >= cx ? 1 : -1;
        b.sx = b.x;
        b.ex = clamp(tx + dir * 95 - b.w / 2, a.x0 + 8, a.x1 - 8 - b.w);
        if (Math.abs(b.ex - b.sx) < 90) b.ex = dir > 0 ? a.x1 - 10 - b.w : a.x0 + 10;
        if (b.fase2) generaPipistrelli();
        suono("boss");
        cambia("picchiata");
      }
      break;
    }
    case "picchiata": {
      const durata = b.fase2 ? 1.2 : 1.6;
      const u = Math.min(1, b.t / durata);
      b.x = b.sx + (b.ex - b.sx) * u;
      b.y = yC + (yG - yC) * Math.sin(Math.PI * u);
      if (u >= 1) { cambia("appeso"); b.sparato = false; }
      break;
    }
  }
}

function aggiornaFantasmaBoss(dt) {
  const b = liv.boss, a = liv.arena, p = giocatore;
  const yH = a.gh * TILE - 66, yG = a.gh * TILE - b.h - 2;
  const cambia = (s) => { b.stato = s; b.t = 0; if (s === "fluttua") b.prossimoSparo = 0.9; };
  switch (b.stato) {
    case "entra":
      b.x += (a.x1 - 120 - b.x) * Math.min(1, dt * 2.2);
      b.y += (yH - b.y) * Math.min(1, dt * 3);
      if (b.t > 1.7) cambia("fluttua");
      break;
    case "fluttua": {
      const durata = b.fase2 ? 2.6 : 3.4;
      const target = a.x0 + 30 + (Math.sin(b.t * 1.15 + 1) + 1) / 2 * (VW - 90);
      b.x += (target - b.x) * Math.min(1, dt * (b.fase2 ? 2.6 : 1.8));
      b.y = yH + Math.sin(b.t * 2.4) * 9;
      b.prossimoSparo -= dt;
      if (b.prossimoSparo <= 0) { sparaOrbo(); b.prossimoSparo = b.fase2 ? 1.0 : 1.5; }
      if (b.t > durata) cambia("avviso");
      break;
    }
    case "avviso":
      if (b.t < dt * 1.5) b.tx = p.x + p.w / 2 - b.w / 2;
      b.x += Math.sin(b.t * 70) * 0.9;
      if (b.t > 0.8) cambia("affonda");
      break;
    case "affonda":
      b.x += (b.tx - b.x) * Math.min(1, dt * 5);
      b.y += 270 * dt;
      if (b.y >= yG) {
        b.y = yG;
        scuoti(7); suono("boss");
        for (let i = 0; i < 14; i++) particella({ x: b.x + 13 + (Math.random() - 0.5) * 30, y: b.y + b.h, vx: (Math.random() - 0.5) * 120, vy: -Math.random() * 60, g: 200, vita: 0.5, col: "#f4f4ff", s: 3 });
        if (b.fase2) generaFantasmini();
        cambia("giu");
      }
      break;
    case "giu":
      if (b.t > 1.5) cambia("risale");
      break;
    case "risale":
      b.y -= 110 * dt;
      if (b.y <= yH) cambia("fluttua");
      break;
  }
}

function aggiornaBoss(dt) {
  const b = liv.boss, a = liv.arena, p = giocatore;
  if (!b || !a) return;
  if (!a.attiva) {
    const dentro = a.tipo === "torre"
      ? (p.suolo && p.y + p.h <= a.gh * TILE + 1 && p.y + p.h > a.gh * TILE - 40 && p.x > TILE)
      : (p.x + p.w / 2 > a.x0 + 56);
    if (!p.morto && dentro) attivaArena();
    return;
  }
  b.t += dt; b.anim += dt;
  if (b.flash > 0) b.flash -= dt;
  if (b.inv > 0) b.inv -= dt;
  if (b.stato === "morto") { aggiornaMorteBoss(dt); return; }
  if (b.tipo === "vampiro") aggiornaVampiro(dt); else aggiornaFantasmaBoss(dt);
  if (liv.boss) b.x = clamp(b.x, a.x0 + 6, a.x1 - 6 - b.w);
}

// il premio lasciato dal boss: cade a terra e aspetta di essere raccolto
function aggiornaPremio(dt) {
  const pr = liv.premio, p = giocatore;
  if (!pr || pr.presa) return;
  pr.t += dt;
  pr.vy += 500 * dt;
  pr.y += pr.vy * dt;
  const a = liv.arena;
  const suolo = (a ? a.gh * TILE : liv.gh0 * TILE) - 8;
  if (pr.y > suolo) { pr.y = suolo; pr.vy = -Math.abs(pr.vy) * 0.4; if (Math.abs(pr.vy) < 30) pr.vy = 0; }
  if (Math.random() < 0.4) particella({ x: pr.x + (Math.random() - 0.5) * 16, y: pr.y + (Math.random() - 0.5) * 12, vy: -20, vita: 0.6, col: "#fff2a0", s: 1 });
  if (!p.morto && Math.abs(p.x + p.w / 2 - pr.x) < 14 && Math.abs(p.y + p.h / 2 - pr.y) < 16) {
    pr.presa = true;
    scintille(pr.x, pr.y, "#ffd23f", 30, 100);
    completaLivello();
  }
}

// ---------------------------------------------------------------------
//  Proiettili
// ---------------------------------------------------------------------
function aggiornaProiettili(dt) {
  for (const b of proiettili) {
    b.x += b.vx * dt; b.vita -= dt;
    if (Math.random() < 0.6) particella({ x: b.x + 3, y: b.y + 3, vita: 0.25, col: "#ffe066", s: 1 });
    if (solido(tile(Math.floor((b.x + 3) / TILE), Math.floor((b.y + 3) / TILE)))) {
      b.vita = 0; scintille(b.x + 3, b.y + 3, "#ffe066", 4, 40); continue;
    }
    for (const e of liv.nemici) {
      if (!e.vivo || !sovrappone(b, e)) continue;
      b.vita = 0;
      e.hp--; e.flash = 0.15;
      if (e.hp <= 0) uccidi(e, e.tipo === "riccio" ? 150 : 50);
      else { suono("colpito"); scintille(b.x, b.y, "#ffffff", 5, 50); }
      break;
    }
    const bo = liv.boss;
    if (b.vita > 0 && bo && sovrappone(b, bo)) { if (dannoBoss(1)) b.vita = 0; }
  }
  proiettili = proiettili.filter((b) => b.vita > 0);

  const p = giocatore;
  for (const o of orbi) {
    o.x += o.vx * dt; o.y += o.vy * dt; o.vita -= dt;
    if (Math.random() < 0.5) particella({ x: o.x + 3, y: o.y + 3, vita: 0.3, col: "#c07aff", s: 2 });
    if (solido(tile(Math.floor((o.x + 4) / TILE), Math.floor((o.y + 4) / TILE)))) { o.vita = 0; scintille(o.x + 4, o.y + 4, "#c07aff", 6, 50); continue; }
    if (!p.morto && sovrappone(o, p)) { o.vita = 0; danneggia(o.x + 4); }
  }
  orbi = orbi.filter((o) => o.vita > 0);
}

// ---------------------------------------------------------------------
//  Interazioni giocatore <-> mondo
// ---------------------------------------------------------------------
function completaLivello() {
  if (stato !== "gioco") return;
  stato = "fineLivello"; timerStato = 0;
  punti += 500;
  const perc = moneteTot ? moneteLiv / moneteTot : 1;
  ultimeStelle = perc >= 0.85 ? 3 : perc >= 0.5 ? 2 : 1;
  salvataggio.stelle[livIdx] = Math.max(salvataggio.stelle[livIdx] || 0, ultimeStelle);
  salvataggio.sbloccati = Math.max(salvataggio.sbloccati, Math.min(LIVELLI.length, livIdx + 2));
  if (punti > salvataggio.record) salvataggio.record = punti;
  salva();
  suono("livello");
  coriandoli(90);
}

function interazioni() {
  const p = giocatore;
  const px = p.x + p.w / 2, py = p.y + p.h / 2;

  for (const m of liv.monete) {
    if (m.presa) continue;
    if (Math.abs(m.x - px) < 10 && Math.abs(m.y - py) < 12) {
      m.presa = true; contaMonete++; moneteLiv++; punti += 10;
      suono("moneta");
      scintille(m.x, m.y, "#ffd23f", 6);
      if (contaMonete % 50 === 0) vitaExtra();
    }
  }
  for (const h of liv.cuori) {
    if (h.preso || Math.abs(h.x - px) > 11 || Math.abs(h.y - py) > 13) continue;
    h.preso = true;
    if (p.hp < HP_MAX) { p.hp++; suono("cuore"); mostraToast("CUORE!"); } else vitaExtra();
    scintille(h.x, h.y, "#ff6b8a", 12);
  }
  for (const s of liv.molle) {
    if (p.vy > 100 && p.x + p.w > s.x + 1 && p.x < s.x + s.w - 1 && p.y + p.h > s.y + 6 && p.y + p.h < s.y + 16 + 8) {
      p.vy = -470; p.saltiAria = 0; p.saltando = false; p.sx = 0.75; p.sy = 1.3;
      s.anim = 0.25; suono("molla");
      scintille(s.x + 8, s.y + 4, "#ffffff", 8, 50);
    }
  }
  for (const ck of liv.checkpoint) {
    if (!ck.attivo && Math.abs(ck.x - px) < 12 && p.y + p.h > ck.y - 26 && p.y < ck.y + 2) {
      ck.attivo = true;
      checkpointPos = { x: ck.x - p.w / 2, y: ck.y - p.h };
      suono("checkpoint");
      scintille(ck.x, ck.y - 20, "#ffd23f", 16);
      mostraToast("CHECKPOINT!");
    }
  }

  for (const e of liv.nemici) {
    if (!e.vivo || !sovrappone(p, e)) continue;
    const dallAlto = p.vy > 0 && (p.y + p.h) - e.y < 10;
    if (e.tipo === "riccio") {
      if (dallAlto) { p.vy = -200; }
      danneggia(e.x + e.w / 2);
    } else if (dallAlto) {
      uccidi(e, e.tipo === "fantasma" ? 120 : 100);
      p.vy = In.salto ? -320 : -230; p.saltiAria = 0; p.saltando = In.salto;
      p.sx = 0.85; p.sy = 1.15;
      hitStop = 0.05;
      suono("stomp");
    } else danneggia(e.x + e.w / 2);
  }

  const b = liv.boss;
  if (b && b.stato !== "dormiente" && b.stato !== "morto" && sovrappone(p, { x: b.x + 2, y: b.y + 2, w: b.w - 4, h: b.h - 4 })) {
    const dallAlto = p.vy > 0 && (p.y + p.h) - b.y < 14;
    if (dallAlto && b.inv <= 0) { dannoBoss(4); p.vy = -280; p.saltiAria = 0; hitStop = 0.08; }
    else if (!dallAlto) danneggia(b.x + b.w / 2);
  }

  if (p.invuln <= 0 && toccaSpuntoni(p)) {
    p.vy = Math.min(p.vy, 0);
    danneggia(p.x + p.w / 2 + (Math.random() < 0.5 ? -8 : 8));
    if (!p.morto) p.vy = -240;
  }
  if (liv.goal.attivo && !liv.goal.nascosto && sovrappone(p, liv.goal)) completaLivello();
}

// ---------------------------------------------------------------------
//  Ambiente (particelle di atmosfera) e camera
// ---------------------------------------------------------------------
function initAmbiente() {
  const R = rng(4242 + livIdx);
  const tipo = tema.particelle;
  const n = tipo === "neve" ? 70 : tipo === "farfalle" ? 5 : tipo === "lucciole" ? 16 : 30;
  ambiente = [];
  for (let i = 0; i < n; i++) ambiente.push({ x: R() * VW, y: (tipo === "lucciole" ? 90 + R() * 100 : R() * VH), f: R() * 6.28, v: 0.5 + R(), c: Math.floor(R() * 4) });
}

function aggiornaAmbiente(dt, t) {
  const tipo = tema.particelle;
  for (const a of ambiente) {
    if (tipo === "neve") { a.y += (14 + a.v * 14) * dt; a.x += Math.sin(t + a.f) * 8 * dt - 6 * dt; }
    else if (tipo === "braci") { a.y -= (10 + a.v * 26) * dt; a.x += Math.sin(t * 1.5 + a.f) * 12 * dt; }
    else if (tipo === "scintille") { a.y -= (6 + a.v * 10) * dt; a.x += Math.sin(t + a.f) * 4 * dt; }
    else if (tipo === "lucciole") { a.x += Math.sin(t * 0.7 + a.f) * 10 * dt; a.y += Math.cos(t * 0.6 + a.f * 1.3) * 8 * dt; }
    else if (tipo === "polvere") { a.x += (4 + a.v * 4) * dt; a.y += Math.sin(t * 0.5 + a.f) * 3 * dt; }
    else if (tipo === "bolle") { a.y -= (8 + a.v * 12) * dt; a.x += Math.sin(t * 1.2 + a.f) * 6 * dt; }
    else if (tipo === "farfalle") { a.x += Math.cos(t * 0.8 + a.f) * 22 * dt; a.y += Math.sin(t * 1.3 + a.f) * 14 * dt; }
    if (a.y < -4) a.y = VH + 2; if (a.y > VH + 4) a.y = -2;
  }
}

function aggiornaCamera(dt, snap) {
  const p = giocatore, a = liv.arena;
  let mx, my;
  if (a && a.attiva) { mx = a.camX; my = a.camY; }
  else {
    mx = clamp(p.x + p.w / 2 - VW / 2 + p.dir * 30, 0, Math.max(0, liv.w * TILE - VW));
    my = clamp(p.y + p.h / 2 - VH * 0.58, 0, Math.max(0, liv.h * TILE - VH));
  }
  const rit = Math.min(1, dt * 5.5);
  camX = snap ? mx : camX + (mx - camX) * rit;
  camY = snap ? my : camY + (my - camY) * Math.min(1, dt * 6.5);
}

// ---------------------------------------------------------------------
//  Aggiornamento
// ---------------------------------------------------------------------
function aggiornaParticelle(dt) {
  for (const p of particelle) { p.vita -= dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
  particelle = particelle.filter((p) => p.vita > 0);
  for (const q of popups) { q.t -= dt; q.y -= 22 * dt; }
  popups = popups.filter((q) => q.t > 0);
}

function aggiornaGioco(dt, t) {
  const p = giocatore;
  tempoGioco += dt;
  if (banner.t > 0) banner.t -= dt;
  if (toast.t > 0) toast.t -= dt;
  for (const m of liv.molle) if (m.anim > 0) m.anim -= dt;

  if (p.morto) aggiornaMorte(dt);
  else aggiornaGiocatore(dt);

  for (const e of liv.nemici) if (e.vivo) aggiornaNemico(e, dt);
  aggiornaBoss(dt);
  aggiornaPremio(dt);
  aggiornaProiettili(dt);
  if (!p.morto && stato === "gioco") interazioni();

  // scintille del portale
  if (liv.goal.attivo && !liv.goal.nascosto && Math.random() < 0.35) {
    particella({ x: liv.goal.x + Math.random() * liv.goal.w, y: liv.goal.y + Math.random() * liv.goal.h, vy: -14, vita: 0.8, col: "#fff2a0", s: 1 });
  }
  aggiornaCamera(dt, false);
}

function aggiorna(dt, t) {
  if (scossa > 0) scossa = Math.max(0, scossa - dt * 30);
  tempoMenu += dt;
  if (stato === "menu") {
    if (In.navSx) { livScelto = Math.max(0, livScelto - 1); suono("menu"); }
    if (In.navDx) { livScelto = Math.min(salvataggio.sbloccati - 1, livScelto + 1); suono("menu"); }
    if (In.startEdge || In.saltoEdge) iniziaPartita(Math.min(livScelto, salvataggio.sbloccati - 1));
    return;
  }
  aggiornaAmbiente(dt, t);
  switch (stato) {
    case "gioco":
      if (hitStop > 0) { hitStop -= dt; aggiornaParticelle(dt); break; }
      aggiornaGioco(dt, t);
      aggiornaParticelle(dt);
      break;
    case "pausa":
      break;
    case "fineLivello":
      timerStato += dt;
      aggiornaParticelle(dt);
      if (timerStato > 4 || (timerStato > 1.5 && (In.startEdge || In.saltoEdge))) {
        if (livIdx + 1 < LIVELLI.length) caricaLivello(livIdx + 1);
        else { stato = "vittoria"; timerStato = 0; }
      }
      break;
    case "gameover":
      timerStato += dt;
      aggiornaParticelle(dt);
      if (timerStato > 1.2 && (In.startEdge || In.saltoEdge)) { stato = "menu"; livScelto = Math.min(livIdx, salvataggio.sbloccati - 1); }
      break;
    case "vittoria":
      timerStato += dt;
      if (Math.random() < 0.5) coriandoli(2);
      aggiornaParticelle(dt);
      if (timerStato > 1.5 && (In.startEdge || In.saltoEdge)) { stato = "menu"; livScelto = 0; }
      break;
  }
}
// ---------------------------------------------------------------------
//  Testo e forme
// ---------------------------------------------------------------------
function testo(s, x, y, dim, col, align) {
  ctx.font = dim + "px " + FONT;
  ctx.textAlign = align || "left";
  ctx.textBaseline = "top";
  const o = dim >= 24 ? 2 : 1;
  ctx.fillStyle = "#1a1030";
  for (const d of [[-o, 0], [o, 0], [0, -o], [0, o], [o, o]]) ctx.fillText(s, Math.round(x + d[0]), Math.round(y + d[1]));
  ctx.fillStyle = col || "#fff";
  ctx.fillText(s, Math.round(x), Math.round(y));
}

function stellaForma(cx, cy, r, col, contorno) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  poli(ctx, pts.map((p) => [cx + (p[0] - cx) * (r + 1.5) / r, cy + (p[1] - cy) * (r + 1.5) / r]), contorno);
  poli(ctx, pts, col);
}

function velo(alpha) { ctx.fillStyle = "rgba(10,6,28," + alpha + ")"; ctx.fillRect(0, 0, VW, VH); }

// ---------------------------------------------------------------------
//  Elementi del mondo
// ---------------------------------------------------------------------
function disegnaTerreno(t) {
  const W = liv.w, off = Math.floor(camX);
  const c0 = Math.max(0, Math.floor(camX / TILE)), c1 = Math.min(W - 1, c0 + Math.ceil(VW / TILE) + 1);
  const decori = tema.decoro;
  const r0 = Math.max(0, Math.floor(camY / TILE)), r1 = Math.min(liv.h - 1, r0 + Math.ceil(VH / TILE) + 1);
  for (let r = r0; r <= r1; r++) {
    const riga = liv.t[r];
    for (let c = c0; c <= c1; c++) {
      const ch = riga[c];
      if (ch === " ") continue;
      const x = c * TILE - off, y = r * TILE;
      if (ch === "#") {
        const mask = liv.mask[r * W + c];
        ctx.drawImage(tessera(M, mask, hash2(c, r) % 3), x, y);
        if (decori.length && !(mask & 1) && r > 0 && liv.t[r - 1][c] === " " && !liv.libero[c]) {
          const h = hash2(c * 7, r * 13);
          if (h % 5 === 0 && liv.t[r - 1][c - 1] !== "^" && liv.t[r - 1][c + 1] !== "^") {
            const s = M.decori[decori[(h >>> 4) % decori.length]][0];
            ctx.drawImage(s, x + 8 - (s.width >> 1), y - s.height + 1);
          }
        }
      } else if (ch === "^") ctx.drawImage(tesseraSpuntone(M), x, y);
      else if (ch === "P") ctx.drawImage(tesseraPiattaforma(M, riga[c - 1] === "P", riga[c + 1] === "P"), x, y);
    }
  }
}

function disegnaCheckpoint(ck, t) {
  const x = Math.round(ck.x - camX), y = ck.y;
  R_(ctx, x - 1, y - 28, 3, 28, "#2a1b3d");
  R_(ctx, x, y - 28, 1, 28, ck.attivo ? "#ffe89a" : "#a8b0cc");
  R_(ctx, x - 3, y - 3, 7, 3, "#2a1b3d");
  R_(ctx, x - 2, y - 3, 5, 2, "#8a92b0");
  disco(ctx, x, y - 30, 2, ck.attivo ? "#ffd23f" : "#8a92b0");
  for (let i = 0; i < 12; i++) {
    const on = ck.attivo ? Math.round(Math.sin(t * 7 + i * 0.7) * 1.3) : 0;
    const alt = 10 - Math.floor(i * 0.5);
    R_(ctx, x + 2 + i, y - 27 + on, 1, alt, ck.attivo ? "#2a1b3d" : "#2a1b3d");
    R_(ctx, x + 2 + i, y - 26 + on, 1, alt - 2, ck.attivo ? (i < 4 ? "#ffe066" : "#ffb020") : (i < 4 ? "#8fa0d8" : "#6a78b0"));
  }
  if (ck.attivo) { ctx.globalAlpha = 0.18; disco(ctx, x, y - 20, 14, "#ffd23f"); ctx.globalAlpha = 1; }
}

function disegnaPortale(g, t) {
  if (g.nascosto) return;
  const cx = Math.round(g.x + g.w / 2 - camX), cy = Math.round(g.y + g.h / 2);
  if (!g.attivo) ctx.globalAlpha = 0.45;
  ctx.globalAlpha *= 0.3; disco(ctx, cx, cy, 30, "#fff2a0");
  ctx.globalAlpha = g.attivo ? 1 : 0.45;
  // cornice di pietra
  R_(ctx, cx - 13, cy - 17, 26, 34, "#2a1b3d");
  R_(ctx, cx - 11, cy - 15, 22, 32, "#8a92b8");
  R_(ctx, cx - 11, cy - 15, 22, 2, "#c0c8e8");
  // interno che vortica
  for (let y = -13; y <= 15; y++) {
    const semi = Math.floor(9 * Math.sqrt(Math.max(0, 1 - Math.pow((y - 1) / 15, 2))) + 0.2);
    for (let x = -semi; x <= semi; x++) {
      const v = Math.sin((x * 0.5 + y * 0.35) + t * 3) + Math.sin(Math.hypot(x, y) * 0.7 - t * 4);
      ctx.fillStyle = v > 0.9 ? "#ffffff" : v > 0 ? "#ffe680" : v > -0.9 ? "#ffb54a" : "#ff8a2a";
      ctx.fillRect(cx + x, cy + y, 1, 1);
    }
  }
  ctx.globalAlpha = 1;
  if (!g.attivo) {
    R_(ctx, cx - 5, cy - 4, 10, 8, "#2a1b3d"); R_(ctx, cx - 4, cy - 3, 8, 6, "#8a8fa8");
    R_(ctx, cx - 3, cy - 8, 6, 4, "#2a1b3d"); R_(ctx, cx - 2, cy - 7, 4, 4, "#5a5f78");
  }
}

function disegnaPremio(t) {
  const pr = liv.premio;
  if (!pr || pr.presa) return;
  const x = Math.round(pr.x - camX), y = Math.round(pr.y + Math.sin(t * 4) * 2);
  ctx.globalAlpha = 0.28 + 0.12 * Math.sin(t * 6); disco(ctx, x, y, 20, "#fff2a0");
  ctx.globalAlpha = 0.25; disco(ctx, x, y, 12, "#ffffff"); ctx.globalAlpha = 1;
  const img = pr.tipo === "gemma" ? SPR_GLOBALI.gemma : SPR_GLOBALI.chiave;
  ctx.drawImage(img, x - (img.width >> 1), y - (img.height >> 1));
  if (Math.floor(t * 6) % 2) R_(ctx, x + 6, y - 8, 1, 3, "#ffffff");
}

function disegnaMoneta(m, t) {
  const f = [0, 1, 2, 1][Math.floor(t * 8 + m.x * 0.13) & 3];
  const img = SPR_GLOBALI.moneta[f];
  const bob = Math.round(Math.sin(t * 3 + m.x * 0.1) * 1.5);
  ctx.drawImage(img, Math.round(m.x - camX) - 4, Math.round(m.y) - 4 + bob);
}

function disegnaNemico(e, t) {
  if (e.flash > 0 && Math.floor(e.flash * 30) % 2) return;
  const x = Math.round(e.x - camX), y = Math.round(e.y);
  if (e.tipo === "slime") {
    const s = SPR.slime[Math.floor(e.anim * 3) & 1];
    if (e.vx < 0) { ctx.save(); ctx.translate(x + 14, y - 2); ctx.scale(-1, 1); ctx.drawImage(s, 0, 0); ctx.restore(); }
    else ctx.drawImage(s, x - 2, y - 2);
  } else if (e.tipo === "riccio") {
    const s = SPR.riccio[Math.floor(e.anim * 4) & 1];
    if (e.vx < 0) { ctx.save(); ctx.translate(x + 15, y - 2); ctx.scale(-1, 1); ctx.drawImage(s, 0, 0); ctx.restore(); }
    else ctx.drawImage(s, x - 1, y - 2);
  } else if (e.tipo === "volatile") {
    ctx.drawImage(SPR.volatile[Math.floor(e.anim / 2) & 1], x - 2, y - 2);
  } else if (e.tipo === "fantasma") {
    ctx.globalAlpha = e.timido ? 0.75 : 1;
    ctx.drawImage(SPR.fantasma[e.timido ? 1 : 0], x - 2, y - 2 + Math.round(Math.sin(t * 3 + e.x) * 1));
    ctx.globalAlpha = 1;
  }
}

function disegnaVampiro(t) {
  const b = liv.boss, a = liv.arena;
  const x = Math.round(b.x - camX), y = Math.round(b.y);
  const alt = clamp((a.gh * TILE - (b.y + b.h)) / 100, 0, 1);
  ctx.globalAlpha = 0.35 * (1 - alt * 0.7);
  disco(ctx, x + 15, a.gh * TILE - 1, Math.round(11 - alt * 5), "#000000");
  ctx.globalAlpha = 1;
  const fr = Math.floor(b.anim * (b.stato === "picchiata" ? 14 : 8)) & 1;
  let img = SPR.vampiro[fr];
  if (b.flash > 0 && Math.floor(b.flash * 24) % 2) img = SPR.vampiroFlash[fr];
  if (b.stato === "morto" && Math.floor(b.t * 14) % 2) img = SPR.vampiroFlash[fr];
  ctx.drawImage(img, x - 1, y - 4);
  const durata = b.fase2 ? 1.15 : 1.7;
  if (b.stato === "appeso" && b.t > durata - 0.45 && Math.floor(b.t * 20) % 2) { ctx.globalAlpha = 0.5; R_(ctx, x - 1, y - 2, 32, 24, "#ff3b4f"); ctx.globalAlpha = 1; }
}

function disegnaBoss(t) {
  const b = liv.boss;
  if (!b || b.stato === "dormiente") return;
  if (b.tipo === "vampiro") { disegnaVampiro(t); return; }
  const a = liv.arena;
  const x = Math.round(b.x - camX), y = Math.round(b.y);
  // ombra sul terreno
  const alt = clamp((a.gh * TILE - (b.y + b.h)) / 90, 0, 1);
  ctx.globalAlpha = 0.35 * (1 - alt * 0.6);
  disco(ctx, x + 13, a.gh * TILE - 1, Math.round(10 - alt * 4), "#000000");
  ctx.globalAlpha = 1;
  let img = SPR.boss;
  if (b.flash > 0 && Math.floor(b.flash * 24) % 2) img = SPR.bossFlash;
  if (b.stato === "morto" && Math.floor(b.t * 14) % 2) img = SPR.bossFlash;
  ctx.drawImage(img, x - 3, y - 7);
  if (b.stato === "avviso" && Math.floor(b.t * 20) % 2) { ctx.globalAlpha = 0.5; R_(ctx, x - 3, y - 3, 32, 28, "#ff3b4f"); ctx.globalAlpha = 1; }
  if (b.stato === "giu") {
    for (let i = 0; i < 3; i++) {
      const a2 = t * 5 + i * 2.1;
      ctx.drawImage(SPR_GLOBALI.stella, x + 9 + Math.round(Math.cos(a2) * 14), y - 12 + Math.round(Math.sin(a2) * 3));
    }
  }
}

function disegnaGiocatore(t) {
  const p = giocatore;
  if (p.affonda && p.y + p.h > liv.liqY + 14) return;
  if (p.invuln > 0 && !p.morto && Math.floor(p.invuln * 14) % 2 === 0) return;
  let img;
  if (p.morto) img = T.male;
  else if (p.hurt > 0) img = T.male;
  else if (!p.suolo) img = p.vy < 0 ? T.salto : T.caduta;
  else if (Math.abs(p.vx) > 12) img = T.corsa[Math.floor(p.anim) & 3];
  else img = T.fermo[Math.floor(t * 2.2) & 1];
  const dw = Math.round(16 * p.sx), dh = Math.round(22 * p.sy);
  const cx = Math.round(p.x + p.w / 2 - camX), fy = Math.round(p.y + p.h);
  ctx.save();
  ctx.translate(cx, fy - dh);
  if (p.dir < 0) ctx.scale(-1, 1);
  if (p.morto) { ctx.translate(0, dh / 2); ctx.rotate(p.timerMorte * 9); ctx.translate(0, -dh / 2); }
  ctx.drawImage(img, -Math.floor(dw / 2), 0, dw, dh);
  ctx.restore();
}

function disegnaAmbiente(t) {
  const tipo = tema.particelle;
  ctx.globalAlpha = 1;
  for (const a of ambiente) {
    const x = (((a.x - camX * 0.6) % VW) + VW) % VW, y = a.y;
    if (tipo === "neve") R_(ctx, x, y, a.c === 0 ? 2 : 1, a.c === 0 ? 2 : 1, "#ffffff");
    else if (tipo === "braci") { ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 6 + a.f); R_(ctx, x, y, 2, 2, a.c % 2 ? "#ffb030" : (tema.partCol || "#ff6a1a")); }
    else if (tipo === "scintille") { ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 3 + a.f)); R_(ctx, x, y, 1, 1, "#ffffff"); R_(ctx, x - 1, y, 3, 1, tema.partCol || "#7ae8ff"); }
    else if (tipo === "lucciole") { ctx.globalAlpha = 0.25 + 0.75 * Math.max(0, Math.sin(t * 1.6 + a.f)); R_(ctx, x, y, 2, 2, tema.partCol || "#fff27a"); ctx.globalAlpha *= 0.3; R_(ctx, x - 1, y - 1, 4, 4, tema.partCol || "#fff27a"); }
    else if (tipo === "polvere") { ctx.globalAlpha = 0.35; R_(ctx, x, y, 1, 1, tema.partCol || "#d0b0ff"); }
    else if (tipo === "bolle") { ctx.globalAlpha = 0.55; R_(ctx, x, y, 2 + (a.c & 1), 2 + (a.c & 1), tema.partCol || "#a8ffc4"); ctx.globalAlpha = 0.9; R_(ctx, x, y, 1, 1, "#ffffff"); }
    else if (tipo === "farfalle") {
      const ali = Math.floor(t * 8 + a.f) & 1;
      const col = ["#ff7a9a", "#ffd23f", "#ffffff", "#9a7aff"][a.c];
      R_(ctx, x, y, 1, 2, "#2a1b3d"); R_(ctx, x - 2, y - (ali ? 1 : 0), 2, 2, col); R_(ctx, x + 1, y - (ali ? 1 : 0), 2, 2, col);
    }
  }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------------
//  Scena e HUD
// ---------------------------------------------------------------------
function disegnaScena(t) {
  ctx.save();
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.imageSmoothingEnabled = false;
  disegnaSfondo(ctx, M, camX, t, camY);

  const sx = scossa > 0 ? Math.round((Math.random() - 0.5) * scossa) : 0;
  const sy = scossa > 0 ? Math.round((Math.random() - 0.5) * scossa) : 0;
  const cy = Math.round(camY);
  ctx.translate(sx, sy - cy);

  // buchi + liquido / abisso
  const c0 = Math.max(0, Math.floor(camX / TILE)), c1 = Math.min(liv.w - 1, c0 + Math.ceil(VW / TILE) + 1);
  const buchi = [];
  for (let c = c0; c <= c1; c++) if (liv.t[liv.h - 1][c] === " ") buchi.push(c);
  if (cy + VH > liv.liqY - 44) disegnaLiquido(ctx, tema, camX, t, buchi, liv.liqY, VH * 2);

  disegnaTerreno(t);
  for (const ck of liv.checkpoint) if (ck.x > camX - 20 && ck.x < camX + VW + 20) disegnaCheckpoint(ck, t);
  disegnaPortale(liv.goal, t);
  for (const s of liv.molle) ctx.drawImage(s.anim > 0.12 ? SPR_GLOBALI.mollaGiu : SPR_GLOBALI.mollaSu, Math.round(s.x - camX), s.y);
  for (const m of liv.monete) if (!m.presa && m.x > camX - 10 && m.x < camX + VW + 10) disegnaMoneta(m, t);
  for (const h of liv.cuori) if (!h.preso) ctx.drawImage(SPR_GLOBALI.cuore, Math.round(h.x - camX) - 4, Math.round(h.y) - 4 + Math.round(Math.sin(t * 3 + h.x) * 2));
  for (const e of liv.nemici) if (e.vivo && e.x > camX - 30 && e.x < camX + VW + 30) disegnaNemico(e, t);
  disegnaBoss(t);
  disegnaPremio(t);
  for (const o of orbi) {
    ctx.globalAlpha = 0.35; disco(ctx, Math.round(o.x - camX + 4), Math.round(o.y + 4), 7, "#c07aff"); ctx.globalAlpha = 1;
    disco(ctx, Math.round(o.x - camX + 4), Math.round(o.y + 4), 4, "#6a30b8");
    disco(ctx, Math.round(o.x - camX + 4), Math.round(o.y + 4), 2, "#ffffff");
  }
  for (const b of proiettili) {
    ctx.globalAlpha = 0.3; disco(ctx, Math.round(b.x - camX + 3), Math.round(b.y + 3), 6, "#ffe066"); ctx.globalAlpha = 1;
    ctx.drawImage(SPR_GLOBALI.stella, Math.round(b.x - camX) - 1, Math.round(b.y) - 1);
  }
  disegnaGiocatore(t);
  for (const p of particelle) {
    ctx.globalAlpha = clamp(p.vita / p.tot, 0, 1);
    ctx.fillStyle = p.col;
    ctx.fillRect(Math.round(p.x - camX), Math.round(p.y), p.s, p.s);
  }
  ctx.globalAlpha = 1;
  for (const q of popups) testo(q.testo, Math.round(q.x - camX), Math.round(q.y), 8, q.col, "center");
  ctx.translate(-sx, -sy + cy);
  disegnaAmbiente(t);
  disegnaHUD();
  ctx.restore();
}

function disegnaHUD() {
  const p = giocatore;
  for (let i = 0; i < HP_MAX; i++) ctx.drawImage(i < p.hp ? SPR_GLOBALI.cuore : SPR_GLOBALI.cuoreVuoto, 6 + i * 11, 6);
  ctx.drawImage(SPR_GLOBALI.testina, 6, 17);
  testo("x" + vite, 26, 20, 8, "#ffffff");
  ctx.drawImage(SPR_GLOBALI.moneta[0], VW / 2 - 26, 7);
  testo("x" + contaMonete, VW / 2 - 14, 7, 8, "#ffd23f");
  testo("" + punti, VW - 6, 6, 8, "#ffffff", "right");
  testo(tema.nome, VW - 6, 18, 8, "#c8b8ff", "right");

  const b = liv.boss;
  if (b && liv.arena.attiva && b.stato !== "dormiente") {
    const w = 200, x = (VW - w) / 2, y = VH - 20;
    testo(b.tipo === "vampiro" ? "CONTE PIPISTRELLO" : "RE FANTASMA", VW / 2, y - 12, 8, "#ffd23f", "center");
    R_(ctx, x - 2, y - 2, w + 4, 12, "#1a1030");
    R_(ctx, x, y, w, 8, "#4a2a5a");
    R_(ctx, x, y, Math.max(0, Math.round(w * b.hp / b.hpMax)), 8, b.fase2 ? "#ff3b4f" : "#ff8a3b");
    R_(ctx, x, y, Math.max(0, Math.round(w * b.hp / b.hpMax)), 2, "#ffd0a0");
  }
  if (banner.t > 0) {
    ctx.globalAlpha = clamp(banner.t, 0, 1);
    testo(banner.testo, VW / 2, 70, 16, "#ffd23f", "center");
    testo(banner.sotto, VW / 2, 94, 8, "#ffffff", "center");
    ctx.globalAlpha = 1;
  }
  if (toast.t > 0) {
    ctx.globalAlpha = clamp(toast.t * 2, 0, 1);
    testo(toast.testo, VW / 2, 34, 8, "#ffd23f", "center");
    ctx.globalAlpha = 1;
  }
}

// ---------------------------------------------------------------------
//  Menu e schermate
// ---------------------------------------------------------------------
let mondoMenu = null;
function disegnaMenu(t) {
  if (!mondoMenu) mondoMenu = creaMondo(0);
  ctx.save();
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.imageSmoothingEnabled = false;
  const cam = tempoMenu * 42;
  disegnaSfondo(ctx, mondoMenu, cam, tempoMenu);
  const c0 = Math.floor(cam / TILE);
  for (let i = 0; i <= Math.ceil(VW / TILE) + 1; i++) {
    for (let r = 12; r < ROWS; r++) {
      ctx.drawImage(tessera(mondoMenu, r === 12 ? 110 : 255, hash2(c0 + i, r) % 3), (c0 + i) * TILE - Math.floor(cam), r * TILE);
    }
  }
  // Tommy che corre, ingrandito
  const fr = T.corsa[Math.floor(tempoMenu * 9) & 3];
  ctx.drawImage(fr, VW / 2 - 16, 192 - 44, 32, 44);

  // titolo
  const oy = Math.round(Math.sin(tempoMenu * 2) * 2);
  testo("TOMMY", VW / 2, 18 + oy, 40, "#ffd23f", "center");
  testo("E LA VILLA SCURA", VW / 2, 66 + oy, 12, "#ff8fa3", "center");

  // scelta del mondo
  const sbl = salvataggio.sbloccati;
  testo(livScelto > 0 ? "<" : " ", VW / 2 - 100, 100, 12, "#ffffff", "center");
  testo(livScelto < sbl - 1 ? ">" : " ", VW / 2 + 100, 100, 12, "#ffffff", "center");
  testo("MONDO " + (livScelto + 1), VW / 2, 100, 12, "#ffffff", "center");
  testo(TEMI[LIVELLI[livScelto].tema].nome, VW / 2, 116, 8, "#c8f0ff", "center");
  for (let i = 0; i < 3; i++) stellaForma(VW / 2 - 22 + i * 22, 138, 6, i < (salvataggio.stelle[livScelto] || 0) ? "#ffd23f" : "#6a6f90", "#2a1b3d");
  if (Math.floor(tempoMenu * 2) % 2 === 0) testo("PREMI INVIO O TOCCA", VW / 2, 198, 8, "#ffffff", "center");
  testo("FRECCE MUOVI  SPAZIO SALTA  X SPARA", VW / 2, 211, 8, "#e8dcff", "center");
  if (salvataggio.record > 0) testo("RECORD " + salvataggio.record, 6, 6, 8, "#ffd23f");
  ctx.restore();
}

function disegnaOverlay(t) {
  ctx.save();
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.imageSmoothingEnabled = false;
  if (stato === "pausa") {
    velo(0.6);
    testo("PAUSA", VW / 2, 84, 24, "#ffd23f", "center");
    testo("PREMI P PER CONTINUARE", VW / 2, 122, 8, "#ffffff", "center");
  } else if (stato === "fineLivello") {
    velo(0.55 * clamp(timerStato * 2, 0, 1));
    if (timerStato > 0.4) {
      const speciale = livIdx === 5 ? "HAI LA CHIAVE D'ORO!" : livIdx === LIVELLI.length - 1 ? "GEMMA CONQUISTATA!" : "LIVELLO COMPLETATO!";
      testo(speciale, VW / 2, 50, 16, "#ffd23f", "center");
      if (livIdx === 5) testo("Il portone del castello si apre...", VW / 2, 76, 8, "#c8f0ff", "center");
      for (let i = 0; i < 3; i++) {
        const quando = 0.9 + i * 0.5;
        if (timerStato > quando) {
          const pop = clamp((timerStato - quando) * 6, 0, 1);
          stellaForma(VW / 2 - 46 + i * 46, 96, Math.round(16 * (0.6 + 0.4 * pop)), i < ultimeStelle ? "#ffd23f" : "#5a5f80", "#2a1b3d");
        }
      }
      if (timerStato > 2.2) {
        testo("MONETE " + moneteLiv + "/" + moneteTot, VW / 2, 128, 8, "#ffffff", "center");
        testo("NEMICI " + nemiciBattuti, VW / 2, 142, 8, "#ffffff", "center");
        testo("PUNTI " + punti, VW / 2, 156, 8, "#b9ffd0", "center");
      }
    }
  } else if (stato === "gameover") {
    velo(0.65 * clamp(timerStato, 0, 1));
    testo("GAME OVER", VW / 2, 70, 24, "#ff6b6b", "center");
    testo("PUNTI " + punti, VW / 2, 108, 8, "#ffffff", "center");
    if (timerStato > 1.2 && Math.floor(t * 2) % 2 === 0) testo("TOCCA O PREMI INVIO", VW / 2, 136, 8, "#ffd23f", "center");
  } else if (stato === "vittoria") {
    velo(0.5 * clamp(timerStato, 0, 1));
    testo("BRAVO TOMMY!", VW / 2, 52, 24, "#ffd23f", "center");
    testo("VILLA SCURA E IL CASTELLO SONO SALVI!", VW / 2, 92, 8, "#ffffff", "center");
    testo("PUNTI " + punti + "   MONETE " + contaMonete, VW / 2, 110, 8, "#b9ffd0", "center");
    if (punti >= salvataggio.record) testo("NUOVO RECORD!", VW / 2, 128, 8, "#ff8fa3", "center");
    if (timerStato > 1.5 && Math.floor(t * 2) % 2 === 0) testo("TOCCA O PREMI INVIO", VW / 2, 156, 8, "#ffd23f", "center");
  }
  ctx.restore();
}

function disegna(t) {
  if (stato === "menu") { disegnaMenu(t); return; }
  disegnaScena(t);
  disegnaOverlay(t);
}

// ---------------------------------------------------------------------
//  Ciclo principale
// ---------------------------------------------------------------------
let ultimoTempo = 0;
function ciclo(ms) {
  const t = ms / 1000;
  const dt = Math.min(Math.max(t - ultimoTempo, 0), 0.033);
  ultimoTempo = t;
  aggiorna(dt, t);
  disegna(t);
  In.saltoEdge = false; In.startEdge = false; In.navSx = false; In.navDx = false;
  requestAnimationFrame(ciclo);
}

// livello finto per evitare errori prima dell'avvio (il menu non lo usa)
liv = generaLivello(LIVELLI[0]);
M = creaMondo(0);
giocatore = nuovoGiocatore(liv.start);
try { if (document.fonts && document.fonts.load) document.fonts.load("8px 'Press Start 2P'"); } catch (e) { /* niente */ }
requestAnimationFrame(ciclo);
// =====================================================================
//  PWA: installazione, schermo intero, orientamento e service worker
// =====================================================================
(function () {
  const body = document.body;
  const q = (id) => document.getElementById(id);

  // su telefono/tablet: layout a schermo intero con i tasti sopra il gioco
  if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) body.classList.add("touch");

  const installata = () =>
    (window.matchMedia && (window.matchMedia("(display-mode: standalone)").matches || window.matchMedia("(display-mode: fullscreen)").matches)) ||
    window.navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  // ---------------- pulsante "Installa" ----------------
  const btnInstalla = q("btn-installa"), guidaIOS = q("guida-ios");
  let promptInstall = null;
  const mostra = (el, si) => { if (el) el.hidden = !si; };

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    promptInstall = e;
    if (!installata()) mostra(btnInstalla, true);
  });
  window.addEventListener("appinstalled", () => { promptInstall = null; mostra(btnInstalla, false); });

  if (btnInstalla) {
    if (isIOS && !installata()) mostra(btnInstalla, true);   // su iPhone/iPad non c'e' il prompt automatico
    btnInstalla.addEventListener("click", async () => {
      avviaAudio();
      if (promptInstall) {
        promptInstall.prompt();
        try { await promptInstall.userChoice; } catch (e) { /* niente */ }
        promptInstall = null;
        mostra(btnInstalla, false);
      } else if (guidaIOS) {
        guidaIOS.hidden = false;
      }
      btnInstalla.blur();
    });
  }
  const chiudiGuida = q("chiudi-guida");
  if (chiudiGuida && guidaIOS) chiudiGuida.addEventListener("click", () => { guidaIOS.hidden = true; });

  // ---------------- schermo intero + blocco in orizzontale ----------------
  const btnSchermo = q("btn-schermo");
  const puoFullscreen = document.fullscreenEnabled && document.documentElement.requestFullscreen;
  if (btnSchermo && puoFullscreen && !installata()) {
    btnSchermo.hidden = false;
    btnSchermo.addEventListener("click", async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
          if (screen.orientation && screen.orientation.lock) screen.orientation.lock("landscape").catch(() => {});
        } else {
          await document.exitFullscreen();
        }
      } catch (e) { /* niente */ }
      btnSchermo.blur();
    });
  }

  // ---------------- in verticale il gioco va in pausa ----------------
  const mqRitratto = window.matchMedia ? window.matchMedia("(orientation: portrait)") : null;
  function controllaOrientamento() {
    if (mqRitratto && mqRitratto.matches && body.classList.contains("touch") && stato === "gioco") stato = "pausa";
  }
  if (mqRitratto) {
    if (mqRitratto.addEventListener) mqRitratto.addEventListener("change", controllaOrientamento);
    else if (mqRitratto.addListener) mqRitratto.addListener(controllaOrientamento);
  }
  controllaOrientamento();

  // ---------------- schermo sempre acceso mentre si gioca ----------------
  let wl = null;
  async function tieniSveglio() {
    try {
      if ("wakeLock" in navigator && !wl) {
        wl = await navigator.wakeLock.request("screen");
        wl.addEventListener("release", () => { wl = null; });
      }
    } catch (e) { /* niente */ }
  }
  window.addEventListener("pointerdown", tieniSveglio, { once: true });
  window.addEventListener("keydown", tieniSveglio, { once: true });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) tieniSveglio(); });

  // ---------------- funzionamento offline ----------------
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => {}); });
  }
})();