// Sound for Lolly's Café Rush. Everything is synthesized in the browser with
// the Web Audio API: no audio files, and all music here is original.
//
//   Music: "Jukebox Moon"        (menus, doo-wop ballad in Bb) and
//          "Blue Plate Special"  (in-level, 1950s rock 'n' roll shuffle in F)
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
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  buildFx();
  resumeSong();
}

// ---------------------------------------------------------------- voices
let noiseBuf = null;
let fx = null; // send inputs: { echo, room }

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

// Slap-back echo (that 1950s tape-echo sound), a small room reverb, and one
// shared channel (filter + sends) per instrument so each note stays cheap.
let CH = null;
function buildFx() {
  const echo = ctx.createGain();
  const d = ctx.createDelay(1); d.delayTime.value = 0.125;
  const fb = ctx.createGain(); fb.gain.value = 0.2;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
  const wet = ctx.createGain(); wet.gain.value = 0.35;
  echo.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(wet); wet.connect(musicBus);
  const room = ctx.createGain();
  const conv = ctx.createConvolver();
  const len = Math.floor(ctx.sampleRate * 1.2);
  const ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const ch = ir.getChannelData(c);
    for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  }
  conv.buffer = ir;
  const rw = ctx.createGain(); rw.gain.value = 0.3;
  room.connect(conv); conv.connect(rw); rw.connect(musicBus);
  fx = { echo, room };
  const chan = (filters, echoAmt = 0, roomAmt = 0) => {
    const input = ctx.createGain();
    let node = input;
    for (const [type, freq, q = 0.7, gain] of filters) {
      const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
      if (gain !== undefined) f.gain.value = gain;
      node.connect(f); node = f;
    }
    node.connect(musicBus);
    if (echoAmt) { const g = ctx.createGain(); g.gain.value = echoAmt; node.connect(g); g.connect(echo); }
    if (roomAmt) { const g = ctx.createGain(); g.gain.value = roomAmt; node.connect(g); g.connect(room); }
    return input;
  };
  // Doo-wop "oooh": vowel formants applied to the whole choir at once.
  const choir = ctx.createGain();
  const f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 340; f1.Q.value = 3;
  const f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 820; f2.Q.value = 5;
  const f2g = ctx.createGain(); f2g.gain.value = 0.5;
  const choirOut = chan([], 0, 0.6);
  choir.connect(f1); f1.connect(choirOut); choir.connect(f2); f2.connect(f2g); f2g.connect(choirOut);
  CH = {
    sax: chan([], 0.55, 0.45),
    bass: chan([['lowpass', 520, 1.2]], 0, 0.12),
    piano: chan([['lowpass', 2200, 0.5]], 0, 0.35),
    guitar: chan([['lowpass', 1500, 0.8]], 0.5, 0.15),
    choir,
    kick: chan([], 0, 0.1),
    brush: chan([['bandpass', 2800, 0.7]], 0, 0.3),
    snare: chan([['highpass', 1400, 0.7]], 0, 0.35),
    ride: chan([['highpass', 6000, 0.7], ['peaking', 4200, 4, 6]], 0, 0.1),
    hat: chan([['highpass', 7500, 0.7]]),
  };
  // one shared vibrato LFO for the sax and the choir
  const lfo = ctx.createOscillator(); lfo.frequency.value = 5; lfo.start();
  CH.vib = ctx.createGain(); CH.vib.gain.value = 12; lfo.connect(CH.vib);
}
function hit(dest, t0, dur, vol, attack = 0.002) {
  const s = ctx.createBufferSource(), g = ctx.createGain();
  s.buffer = noiseBuf;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(g); g.connect(dest);
  s.start(t0, Math.random() * 0.5); s.stop(t0 + dur + 0.02);
}
function env(t0, vol, attack, end, sustain = null, sustainAt = 0) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
  if (sustain !== null) g.gain.exponentialRampToValueAtTime(vol * sustain, Math.max(t0 + attack + 0.01, sustainAt));
  g.gain.exponentialRampToValueAtTime(0.0001, end);
  return g;
}
function tone2(type, f, t0, end, dest, detune = 0, vib = false) {
  const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = detune;
  if (vib) CH.vib.connect(o.detune);
  o.connect(dest); o.start(t0); o.stop(end + 0.05);
  return o;
}

// Breathy tenor sax: two detuned saws through a moving low-pass, a little
// scoop into each note, vibrato and a puff of breath.
function sax(f, t0, dur, vol) {
  const end = t0 + dur + 0.08;
  const g = ctx.createGain(), lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.Q.value = 2.5;
  lp.frequency.setValueAtTime(f * 1.5, t0);
  lp.frequency.linearRampToValueAtTime(Math.min(9000, f * 5), t0 + 0.06);
  lp.frequency.setTargetAtTime(f * 3, t0 + 0.07, 0.18);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.035);
  g.gain.setTargetAtTime(vol * 0.72, t0 + 0.05, 0.2);
  g.gain.setTargetAtTime(0.0001, Math.max(t0 + 0.06, t0 + dur - 0.02), 0.035);
  for (const det of [-7, 6]) {
    const o = tone2('sawtooth', f, t0, end, lp, det, dur > 0.3);
    o.frequency.setValueAtTime(f * 0.965, t0);
    o.frequency.exponentialRampToValueAtTime(f, t0 + 0.055);
  }
  const ng = env(t0, vol * 0.5, 0.004, t0 + 0.1);
  const n = ctx.createBufferSource(); n.buffer = noiseBuf; n.connect(ng); ng.connect(lp);
  n.start(t0, Math.random() * 0.5); n.stop(t0 + 0.12);
  lp.connect(g); g.connect(CH.sax);
}

// Upright double bass: warm and round.
function upright(f, t0, dur, vol) {
  const end = t0 + Math.max(0.12, dur);
  const g = env(t0, vol, 0.01, end, 0.45, t0 + Math.min(0.3, dur * 0.7));
  tone2('triangle', f, t0, end, g);
  g.connect(CH.bass);
}

// Felt-y upright piano chord.
function piano(freqs, t0, vol, len = 0.5) {
  const end = t0 + len;
  const g = env(t0, vol, 0.005, end, 0.3, t0 + Math.min(0.15, len * 0.5));
  for (const f of freqs) tone2('triangle', f, t0, end, g, -3);
  g.connect(CH.piano);
}

// Clean, slightly crunchy electric guitar (slap-back echo on its channel).
function guitar(freqs, t0, dur, vol) {
  const g = env(t0, vol, 0.004, t0 + dur);
  for (const f of freqs) tone2('sawtooth', f, t0, t0 + dur, g);
  g.connect(CH.guitar);
}

// Doo-wop backing "oooh" voices.
function ooh(freqs, t0, dur, vol) {
  const g = ctx.createGain();
  const att = Math.min(0.3, dur * 0.3);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + att);
  g.gain.setValueAtTime(vol, t0 + Math.max(att, dur - 0.3));
  g.gain.linearRampToValueAtTime(0.0001, t0 + dur + 0.1);
  for (const f of freqs) for (const det of [-9, 8]) tone2('sawtooth', f, t0, t0 + dur + 0.15, g, det, true);
  g.connect(CH.choir);
}

function kick(t0, vol) {
  const g = env(t0, vol, 0.004, t0 + 0.3);
  const o = tone2('sine', 115, t0, t0 + 0.3, g);
  o.frequency.setValueAtTime(115, t0); o.frequency.exponentialRampToValueAtTime(48, t0 + 0.2);
  g.connect(CH.kick);
}
const brush = (t0, vol) => hit(CH.brush, t0, 0.24, vol, 0.012);
function snare(t0, vol) {
  hit(CH.snare, t0, 0.17, vol);
  const g = env(t0, vol * 0.5, 0.002, t0 + 0.08);
  tone2('triangle', 185, t0, t0 + 0.08, g); g.connect(CH.kick);
}
const ride = (t0, vol) => hit(CH.ride, t0, 0.32, vol);
const pedalHat = (t0, vol) => hit(CH.hat, t0, 0.045, vol);

// ---------------------------------------------------------------- notes
const SEMI = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
const mhz = (m) => 440 * Math.pow(2, (m - 69) / 12);
function midi(name) {
  const m = /^([A-G][#b]?)(\d)$/.exec(name);
  return SEMI[m[1]] + (+m[2] + 1) * 12;
}
const hz = (name) => mhz(midi(name));
// Melody text: each token is a note or "." (rest), optionally ":n" steps long.
// "-" holds the previous note one more step. "|" separates bars.
function parseLine(str) {
  const out = [];
  for (const tok of str.replace(/\|/g, ' ').trim().split(/\s+/)) {
    const [name, n = '1'] = tok.split(':');
    const len = +n;
    if (name === '-') { for (let j = out.length - 1; j >= 0; j--) if (out[j]) { out[j].len += len; break; } }
    else if (name !== '.') { out.push({ f: hz(name), len }); for (let i = 1; i < len; i++) out.push(null); continue; }
    for (let i = 0; i < len; i++) out.push(null);
  }
  return out;
}
const QUAL = { '': [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], '6': [0, 4, 7, 9], dim7: [0, 3, 6, 9] };
function chordInfo(name) {
  const m = /^([A-G][#b]?)(.*)$/.exec(name);
  const r = SEMI[m[1]], iv = QUAL[m[2]] || QUAL[''];
  const voicing = iv.map(i => { let n = 48 + r + i; while (n < 55) n += 12; while (n > 67) n -= 12; return n; }).sort((a, b) => a - b);
  const root = r >= 2 ? 36 + r : 48 + r; // E2..C#3 range for the bass
  return { root, iv, minor: iv[1] === 3, voicing };
}

// ---------------------------------------------------------------- songs (original)
// Both tunes were written for this game in a 1950s style.
const SONGS = {
  // "Jukebox Moon": slow doo-wop ballad in Bb, 12/8 piano triplets, "ooh" choir, sax lead.
  menu: {
    style: 'doowop', bpm: 70, sub: 3, swing: 0, lead: 0.14,
    chords: ['Bb', 'Gm', 'Eb', 'F', 'Bb', 'Gm', 'Eb', 'F7', 'Bb', 'Gm', 'Cm7', 'F7', 'Bb', 'G7', 'Cm7', 'F7'],
    melody: parseLine(`
      .:3 F4:3 Bb4:3 D5:3 | D5:6 C5:2 Bb4:1 G4:3 | Bb4:3 G4:3 Eb5:6 | D5:3 C5:3 A4:3 F4:3 |
      .:3 F4:3 Bb4:3 D5:3 | G5:6 F5:2 D5:1 Bb4:3 | C5:3 Eb5:3 G5:3 F5:3 | Eb5:3 D5:3 C5:6 |
      D5:9 F5:3 | G5:3 F5:3 D5:3 Bb4:3 | Eb5:6 D5:3 C5:3 | A4:6 .:3 C5:3 |
      D5:3 Eb5:3 F5:6 | G5:3 F5:3 D5:3 B4:3 | Eb5:6 C5:3 A4:3 | C5:3 A4:3 F4:3 .:3`),
  },
  // "Blue Plate Special": 12-bar rock 'n' roll shuffle in F, boogie bass, sax riffs.
  level: {
    style: 'rocknroll', bpm: 164, sub: 2, swing: 0.3, lead: 0.13,
    chords: ['F7', 'F7', 'F7', 'F7', 'Bb7', 'Bb7', 'F7', 'F7', 'C7', 'Bb7', 'F7', 'C7',
             'F7', 'Bb7', 'F7', 'F7', 'Bb7', 'Bb7', 'F7', 'D7', 'Gm7', 'C7', 'F7', 'C7'],
    melody: parseLine(`
      .:2 C5 Eb5 F5:2 Eb5 C5 | Eb5 C5 A4:4 .:2 | .:2 C5 Eb5 F5 G5 A5:2 | G5 F5 Eb5 C5 A4:2 .:2 |
      .:2 D5 F5 Ab5:2 F5 D5 | F5 D5 Bb4:4 .:2 | .:2 C5 Eb5 F5:2 Eb5 C5 | A4:4 .:4 |
      G5:2 E5 C5 Bb4:2 C5:2 | Bb4:2 D5 F5 Ab5:2 F5:2 | A5 G5 F5 Eb5 C5 A4 F4:2 | .:2 E4 G4 Bb4 C5 E5:2 |
      F5:6 Eb5 C5 | D5:3 F5 Ab5:2 F5:2 | C5:2 F5:2 A5:4 | G5 F5 Eb5 C5 Eb5:4 |
      D5:6 Bb4:2 | Ab4 Bb4 D5 F5 Ab5:4 | A5:2 F5 C5 A4:4 | F#4 A4 C5 D5 F#5:4 |
      G5:2 F5 D5 Bb4:2 G4:2 | E4 G4 Bb4 C5 E5:2 G5:2 | F5:2 C5 A4 F4:4 | .:4 C5 Bb4 G4 E4`),
  },
};
for (const [k, s] of Object.entries(SONGS)) {
  const want = s.chords.length * s.sub * 4;
  if (s.melody.length !== want) console.warn(`song ${k}: melody ${s.melody.length} steps, expected ${want}`);
}

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
  const sub = song.sub, spb = sub * 4;
  const stepDur = 60 / song.bpm / sub;
  while (nextTime < ctx.currentTime + 0.15) {
    const mi = step % song.melody.length;
    const bar = Math.floor(mi / spb), pos = mi % spb;
    const beat = Math.floor(pos / sub), inBeat = pos % sub;
    const ch = chordInfo(song.chords[bar % song.chords.length]);
    const nx = chordInfo(song.chords[(bar + 1) % song.chords.length]);
    const t = nextTime + (sub === 2 && inBeat === 1 ? stepDur * song.swing : 0);

    const n = song.melody[mi];
    if (n) sax(n.f, t, n.len * stepDur * 0.92, song.lead);

    if (song.style === 'doowop') {
      // piano triplets on every step, accent on the beat
      piano(ch.voicing.map(mhz), t, inBeat === 0 ? 0.08 : 0.045, 0.32);
      // choir holds the chord for the bar
      if (pos === 0) ooh(ch.voicing.map(m => mhz(m + 12)).slice(0, 3), t, stepDur * spb * 0.97, 0.065);
      // walking bass: root, third, fifth, then lead into the next chord
      if (inBeat === 0) {
        const approach = nx.root === ch.root ? ch.root + 9 : nx.root - 1;
        const note = [ch.root, ch.root + ch.iv[1], ch.root + 7, approach][beat];
        upright(mhz(note), t, stepDur * 2.8, 0.26);
      }
      if (pos === 0 || pos === 6) kick(t, 0.22);
      if (pos === 3 || pos === 9) brush(t, 0.17);
      ride(t, inBeat === 0 ? 0.045 : 0.022);
    } else {
      // boogie-woogie bass walking up and down the chord
      const offs = [0, ch.minor ? 3 : 4, 7, 9, 10, 9, 7, ch.minor ? 3 : 4];
      upright(mhz(ch.root + offs[pos]), t, stepDur * 0.95, 0.22);
      // guitar shuffle: root with 5th / 6th
      const g = ch.root + 12;
      guitar([mhz(g), mhz(g + (pos % 4 < 2 ? 7 : 9))], t, 0.14, 0.07);
      // piano off-beat comping on 2 and 4
      if (pos === 2 || pos === 6) piano(ch.voicing.map(m => mhz(m + 12)), t, 0.065, 0.22);
      if (pos === 0 || pos === 4) kick(t, 0.3);
      if (pos === 2 || pos === 6) { snare(t, 0.16); pedalHat(t, 0.03); }
      ride(t, inBeat === 0 ? 0.05 : 0.028);
    }
    nextTime += stepDur;
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
