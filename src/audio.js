// Sound for Lolly's Café Rush. Everything is synthesized in the browser with
// the Web Audio API: no audio files, and all music here is original.
//
//   Music: "Morning Bake" (menus, relaxed swing in F) and
//          "Lunch Rush"   (in-level, upbeat in C)
//   Sound effects: short synthesized blips, chimes and coin sounds.

let ctx = null;
let master, musicBus, sfxBus;
let musicOn = true, sfxOn = true;

export function setMusicOn(on) { musicOn = on; if (musicBus) musicBus.gain.setTargetAtTime(on ? MUSIC_VOL : 0, ctx.currentTime, 0.05); if (on) resumeSong(); }
export function setSfxOn(on) { sfxOn = on; }
// legacy helper
export function setMuted(m) { setMusicOn(!m); setSfxOn(!m); }

const MUSIC_VOL = 0.55;

export function unlockAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); resumeSong(); return; }
  try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; return; }
  master = ctx.createGain(); master.gain.value = 0.9;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14; comp.ratio.value = 4;
  master.connect(comp).connect(ctx.destination);
  musicBus = ctx.createGain(); musicBus.gain.value = musicOn ? MUSIC_VOL : 0; musicBus.connect(master);
  sfxBus = ctx.createGain(); sfxBus.gain.value = 1; sfxBus.connect(master);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  resumeSong();
}

// ---------------------------------------------------------------- voices
let noiseBuf = null;

function osc(bus, type, freq, t0, dur, vol, { attack = 0.01, slide = 0, decay = null } = {}) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
  if (decay) g.gain.exponentialRampToValueAtTime(Math.max(0.0001, vol * decay), t0 + dur * 0.6);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(bus);
  o.start(t0); o.stop(t0 + dur + 0.03);
}

function noise(bus, t0, dur, vol, hp = 6000) {
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = hp;
  g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(f).connect(g).connect(bus);
  s.start(t0); s.stop(t0 + dur + 0.02);
}

// mallet-like lead (sine + soft octave) = cartoony xylophone/marimba feel
function mallet(f, t0, dur, vol) {
  osc(musicBus, 'sine', f, t0, Math.max(0.18, dur), vol, { attack: 0.005, decay: 0.35 });
  osc(musicBus, 'triangle', f * 2, t0, 0.12, vol * 0.25, { attack: 0.003 });
}
function pluckBass(f, t0, dur, vol) { osc(musicBus, 'triangle', f, t0, Math.min(dur, 0.4), vol, { attack: 0.006, decay: 0.5 }); }
function stab(freqs, t0, vol) { for (const f of freqs) osc(musicBus, 'square', f, t0, 0.09, vol, { attack: 0.004 }); }
function kick(t0, vol) { osc(musicBus, 'sine', 140, t0, 0.18, vol, { attack: 0.002, slide: -95 }); }
function snare(t0, vol) { noise(musicBus, t0, 0.12, vol, 1800); osc(musicBus, 'triangle', 220, t0, 0.06, vol * 0.4); }
function hat(t0, vol) { noise(musicBus, t0, 0.035, vol, 7500); }

// ---------------------------------------------------------------- notes
const SEMI = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
function hz(name) {
  const m = /^([A-G][#b]?)(\d)$/.exec(name);
  const n = SEMI[m[1]] + (+m[2] + 1) * 12;
  return 440 * Math.pow(2, (n - 69) / 12);
}
// "C5 . F5 - A5" -> [{f, len}] one token per eighth note; "-" holds, "." rests
function parseLine(str) {
  const out = []; const toks = str.replace(/\|/g, ' ').trim().split(/\s+/);
  toks.forEach((t, i) => {
    if (t === '-') { for (let j = out.length - 1; j >= 0; j--) if (out[j]) { out[j].len++; break; } out.push(null); }
    else if (t === '.') out.push(null);
    else out.push({ f: hz(t), len: 1 });
  });
  return out;
}
const CH = {
  F: ['F4', 'A4', 'C5'], Dm: ['D4', 'F4', 'A4'], Gm7: ['F4', 'Bb4', 'D5'], C7: ['E4', 'Bb4', 'C5'], A7: ['E4', 'G4', 'C#5'],
  G7: ['F4', 'B4', 'D5'], C: ['E4', 'G4', 'C5'], Am: ['E4', 'A4', 'C5'], G: ['D4', 'G4', 'B4'], E7: ['D4', 'G#4', 'B4'], Em: ['E4', 'G4', 'B4'],
};

// ---------------------------------------------------------------- songs (original)
const SONGS = {
  menu: { // "Morning Bake"
    bpm: 104, swing: 0.2, lead: 0.13,
    melody: parseLine(`
      C5 . F5 A5 C6 - A5 . | D6 - C6 A5 F5 - . . | Bb5 - A5 G5 F5 G5 A5 Bb5 | C6 - - - E5 . G5 . |
      C5 . F5 A5 C6 - D6 C6 | C#6 - A5 . E5 G5 A5 C#6 | D6 - F6 - D6 B5 G5 F5 | E5 - G5 - C6 - . .`),
    // one chord per half bar
    chords: ['F', 'F', 'Dm', 'Dm', 'Gm7', 'Gm7', 'C7', 'C7', 'F', 'F', 'A7', 'A7', 'Dm', 'G7', 'C7', 'C7'],
    bass: ['F2', 'C3', 'D2', 'A2', 'G2', 'D3', 'C2', 'G2', 'F2', 'C3', 'A2', 'E2', 'D2', 'G2', 'C2', 'C3'],
    drums: { kick: [0], snare: [4], hat: [2, 6], vol: 0.5 },
  },
  level: { // "Lunch Rush" - 1950s rock 'n' roll shuffle with a boogie-woogie bass
    bpm: 150, swing: 0.24, lead: 0.12, boogie: true,
    melody: parseLine(`
      E5 G5 C6 . G5 . E5 G5 | A5 - . A5 C6 B5 A5 . | F5 A5 C6 . A5 . F5 A5 | G5 - B5 - D6 - . . |
      E5 G5 C6 . G5 . E5 G5 | G#5 - B5 . D6 . B5 G#5 | A5 C6 E6 . F5 A5 C6 . | B5 - D6 - F6 - G6 . |
      A5 . A5 C6 F6 . E6 D6 | D6 . B5 G5 D6 - . . | B5 . B5 E6 G6 . E6 D6 | C6 - A5 - E5 - . . |
      F5 A5 D6 . A5 . F5 A5 | G5 B5 D6 . F6 . E6 D6 | E6 - C6 - G5 - E5 G5 | F5 . D5 F5 G5 - . .`),
    chords: ['C', 'C', 'Am', 'Am', 'F', 'F', 'G', 'G', 'C', 'C', 'E7', 'E7', 'Am', 'F', 'G7', 'G7',
             'F', 'F', 'G', 'G', 'Em', 'Em', 'Am', 'Am', 'Dm', 'Dm', 'G', 'G', 'C', 'C', 'G7', 'G7'],
    bass: ['C2', 'G2', 'A2', 'E2', 'F2', 'C3', 'G2', 'D2', 'C2', 'G2', 'E2', 'B2', 'A2', 'F2', 'G2', 'G2',
           'F2', 'C3', 'G2', 'D3', 'E2', 'B2', 'A2', 'E2', 'D2', 'A2', 'G2', 'D2', 'C2', 'G2', 'G2', 'B2'],
    drums: { kick: [0, 4], snare: [2, 6], hat: [0, 1, 2, 3, 4, 5, 6, 7], vol: 0.6 },
  },
};
CH.Dm = ['D4', 'F4', 'A4'];

// ---------------------------------------------------------------- sequencer
let song = null, songName = null, step = 0, nextTime = 0, timer = null, duck = 1;

export function playMusic(name) {
  if (songName === name && timer) return;
  songName = name;
  song = SONGS[name] || null;
  step = 0;
  if (!ctx) return; // starts on first tap (browsers need a user gesture)
  stopTimer();
  if (!song) return;
  nextTime = ctx.currentTime + 0.08;
  timer = setInterval(schedule, 25);
}
export function stopMusic() { songName = null; song = null; stopTimer(); }
export function duckMusic(on) {
  duck = on ? 0.35 : 1;
  if (musicBus) musicBus.gain.setTargetAtTime(musicOn ? MUSIC_VOL * duck : 0, ctx.currentTime, 0.1);
}
function stopTimer() { if (timer) clearInterval(timer); timer = null; }
function resumeSong() { if (ctx && songName && !timer && SONGS[songName]) { const n = songName; songName = null; playMusic(n); } }

function schedule() {
  if (!song || !ctx) return;
  if (!musicOn) { nextTime = ctx.currentTime + 0.05; return; }
  const eighth = 60 / song.bpm / 2;
  while (nextTime < ctx.currentTime + 0.15) {
    const pos = step % 8; // eighth within the bar
    const t = nextTime + (pos % 2 === 1 ? eighth * song.swing : 0);
    const mi = step % song.melody.length;
    const half = Math.floor(mi / 4) % song.chords.length;
    // melody
    const n = song.melody[mi];
    if (n) mallet(n.f, t, n.len * eighth * 0.95, song.lead);
    if (song.boogie) {
      // walking boogie bass: 1-3-5-6-b7-6-5-3 over the chord root
      const bar = Math.floor(mi / 8) * 2 + (pos >= 4 ? 1 : 0);
      const chord = song.chords[bar % song.chords.length];
      const minor = /^[A-G][#b]?m(?!aj)/.test(chord);
      const steps = [0, minor ? 3 : 4, 7, 9, 10, 9, 7, minor ? 3 : 4];
      const root = hz(song.bass[Math.floor(mi / 8) * 2 % song.bass.length].replace(/\d/, '2'));
      pluckBass(root * Math.pow(2, steps[pos] / 12), t, eighth * 0.9, 0.26);
    } else {
      // bass on each half bar, plus a pickup note
      if (pos % 4 === 0) pluckBass(hz(song.bass[half]), t, eighth * 3, 0.32);
      if (pos === 7 && song.bpm > 120) pluckBass(hz(song.bass[(half + 1) % song.bass.length]) * 2, t, eighth, 0.16);
    }
    // offbeat chord stabs
    if (pos % 4 === 2) stab(CH[song.chords[half]].map(hz), t, 0.028);
    // drums
    const dv = song.drums.vol;
    if (song.drums.kick.includes(pos)) kick(t, 0.5 * dv);
    if (song.drums.snare.includes(pos)) snare(t, 0.22 * dv);
    if (song.drums.hat.includes(pos)) hat(t, (pos % 2 ? 0.05 : 0.08) * dv);
    nextTime += eighth;
    step++;
  }
}

// ---------------------------------------------------------------- effects
function tone(freq, dur, type = 'sine', vol = 0.15, slide = 0, delay = 0) {
  if (!sfxOn || !ctx) return;
  osc(sfxBus, type, freq, ctx.currentTime + delay, dur, vol, { attack: 0.01, slide });
}
function sparkle(base, n, gap, vol = 0.08) { for (let i = 0; i < n; i++) tone(base * Math.pow(1.26, i), 0.14, 'sine', vol, 0, i * gap); }

export const sfx = {
  tap: () => tone(660, 0.06, 'triangle', 0.08),
  door: () => { tone(1318, 0.25, 'sine', 0.07); tone(1046, 0.35, 'sine', 0.07, 0, 0.12); },
  seat: () => { tone(520, 0.08, 'triangle', 0.12); tone(780, 0.1, 'triangle', 0.12, 0, 0.06); },
  match: () => { tone(880, 0.08, 'sine', 0.12); tone(1175, 0.12, 'sine', 0.12, 0, 0.07); tone(1568, 0.14, 'sine', 0.1, 0, 0.14); },
  order: () => { tone(990, 0.05, 'square', 0.04); tone(1320, 0.05, 'square', 0.04, 0, 0.05); },
  ticket: () => { tone(1320, 0.05, 'triangle', 0.08); tone(1760, 0.08, 'triangle', 0.08, 0, 0.05); },
  ding: () => { tone(1568, 0.3, 'sine', 0.12); tone(2093, 0.35, 'sine', 0.05, 0, 0.02); },
  pickup: () => tone(880, 0.06, 'triangle', 0.08, 220),
  serve: () => { tone(700, 0.07, 'triangle', 0.12); tone(1050, 0.1, 'triangle', 0.12, 0, 0.06); tone(1400, 0.12, 'sine', 0.06, 0, 0.12); },
  cash: (tip = 0) => {
    tone(1400, 0.05, 'square', 0.05); tone(2100, 0.2, 'sine', 0.12, 0, 0.05);
    if (tip >= 20) sparkle(1568, 4, 0.06, 0.07); // big tip: coin shower
  },
  happy: () => { tone(900, 0.08, 'sine', 0.07, 400); tone(1200, 0.1, 'sine', 0.06, 500, 0.09); },
  clear: () => { tone(300, 0.08, 'triangle', 0.09, -100); tone(420, 0.06, 'triangle', 0.06, 0, 0.06); },
  bin: () => { tone(220, 0.08, 'square', 0.05); tone(180, 0.1, 'square', 0.05, 0, 0.05); },
  warn: () => { tone(740, 0.07, 'square', 0.035); tone(740, 0.07, 'square', 0.035, 0, 0.12); },
  angry: () => { tone(300, 0.18, 'sawtooth', 0.06, -80); tone(220, 0.3, 'sawtooth', 0.06, -90, 0.16); },
  chain: (n) => { const b = 520 * Math.pow(1.06, Math.min(n, 10)); for (let i = 0; i < Math.min(n, 5); i++) tone(b * Math.pow(1.19, i), 0.1, 'sine', 0.09, 0, i * 0.045); },
  nope: () => tone(200, 0.08, 'square', 0.04),
  coffee: () => { tone(400, 0.25, 'sine', 0.08, 300); tone(600, 0.2, 'sine', 0.05, 200, 0.15); },
  star: (i) => tone([1046, 1318, 1568][i] || 1568, 0.25, 'triangle', 0.12),
  win: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i === 4 ? 0.5 : 0.2, 'triangle', 0.12, 0, i * 0.1)),
  lose: () => [392, 330, 262, 196].forEach((f, i) => tone(f, 0.3, 'triangle', 0.1, 0, i * 0.16)),
};
