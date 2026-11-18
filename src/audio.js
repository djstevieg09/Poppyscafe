// Tiny synthesized sound effects (no audio files needed).
let ctx = null;
let muted = false;

export function setMuted(m) { muted = m; }
export function unlockAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; }
}

function tone(freq, dur, type = 'sine', vol = 0.15, slide = 0, delay = 0) {
  if (muted || !ctx) return;
  const t0 = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

export const sfx = {
  tap: () => tone(660, 0.06, 'triangle', 0.08),
  seat: () => { tone(520, 0.08, 'triangle', 0.12); tone(780, 0.1, 'triangle', 0.12, 0, 0.06); },
  match: () => { tone(880, 0.08, 'sine', 0.12); tone(1175, 0.12, 'sine', 0.12, 0, 0.07); tone(1568, 0.14, 'sine', 0.1, 0, 0.14); },
  order: () => tone(990, 0.07, 'square', 0.05),
  ticket: () => { tone(1320, 0.05, 'triangle', 0.08); tone(1760, 0.08, 'triangle', 0.08, 0, 0.05); },
  ding: () => { tone(1568, 0.25, 'sine', 0.12); tone(2093, 0.3, 'sine', 0.06, 0, 0.02); },
  serve: () => { tone(700, 0.07, 'triangle', 0.12); tone(1050, 0.1, 'triangle', 0.12, 0, 0.06); },
  cash: () => { tone(1400, 0.05, 'square', 0.06); tone(2100, 0.18, 'sine', 0.12, 0, 0.05); tone(2800, 0.2, 'sine', 0.06, 0, 0.1); },
  clear: () => tone(300, 0.1, 'triangle', 0.1, -120),
  bin: () => { tone(220, 0.08, 'square', 0.05); tone(180, 0.1, 'square', 0.05, 0, 0.05); },
  angry: () => tone(260, 0.35, 'sawtooth', 0.07, -140),
  chain: (n) => tone(600 + n * 120, 0.12, 'sine', 0.12),
  nope: () => tone(200, 0.08, 'square', 0.04),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.12, 0, i * 0.11)),
  lose: () => [392, 330, 262].forEach((f, i) => tone(f, 0.28, 'triangle', 0.1, 0, i * 0.15)),
  coffee: () => tone(400, 0.25, 'sine', 0.08, 300),
};
