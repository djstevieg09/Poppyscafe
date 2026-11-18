// All game art is drawn in code (cartoon vector style) so it stays crisp on any
// screen and the download stays tiny. Original characters:
//   Poppy  - our roller-skating café owner (orange curls, yellow bandana, mint dress)
//   Chef Leo - the café's cheerful cook

export const INK = '#3a2a22';
const SKINS = ['#ffd9b8', '#f1c27d', '#c68642', '#8d5524', '#ffe0c7', '#e0ac69'];
const HAIRS = ['#4a2c1a', '#1f1a17', '#c47a2c', '#7a4a2a', '#2d2d2d', '#e3b04b'];

export function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function blob(ctx, fill, stroke = INK, lw = 3.5) {
  ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
}

function circle(ctx, x, y, r, fill, stroke = INK, lw = 3.5) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); blob(ctx, fill, stroke, lw);
}

function ellipse(ctx, x, y, rx, ry, fill, stroke = INK, lw = 3.5) {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); blob(ctx, fill, stroke, lw);
}

export function shadow(ctx, x, y, rx, ry = rx * 0.32) {
  ctx.fillStyle = 'rgba(40,20,10,0.18)';
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
}

// ---------- Background ----------
export function drawBackground(ctx, cafe) {
  const W = 720, H = 1280;
  // floor
  ctx.fillStyle = cafe.floorA; ctx.fillRect(0, 0, W, H);
  const s = 72;
  for (let y = 230; y < H; y += s) for (let x = 0; x < W; x += s) {
    if (((x / s) + (y - 230) / s) % 2 === 0) { ctx.fillStyle = cafe.floorB; ctx.fillRect(x, y, s, s); }
  }
  // back wall
  ctx.fillStyle = cafe.wall; ctx.fillRect(0, 96, W, 140);
  ctx.fillStyle = cafe.wallTrim; ctx.fillRect(0, 96, W, 10);
  // stripes on wall
  ctx.globalAlpha = 0.12; ctx.fillStyle = '#fff';
  for (let x = 0; x < W; x += 40) ctx.fillRect(x, 106, 20, 130);
  ctx.globalAlpha = 1;
  // window with sky
  rr(ctx, 270, 112, 180, 70, 14); blob(ctx, cafe.sky);
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(360, 112); ctx.lineTo(360, 182); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.ellipse(310, 140, 18, 8, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(410, 150, 14, 6, 0, 0, 7); ctx.fill();
  // awning above window
  for (let i = 0; i < 6; i++) {
    ctx.beginPath(); ctx.moveTo(264 + i * 32, 108); ctx.lineTo(296 + i * 32, 108); ctx.arc(280 + i * 32, 108, 16, 0, Math.PI); ctx.closePath();
    blob(ctx, i % 2 ? '#fff' : cafe.wallTrim, INK, 2.5);
  }
  // counter
  rr(ctx, 30, 228, 660, 22, 8); blob(ctx, cafe.counterTop);
  rr(ctx, 30, 246, 660, 44, 6); blob(ctx, cafe.counter);
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  for (let x = 50; x < 680; x += 60) ctx.fillRect(x, 254, 34, 28);
  // plants
  plant(ctx, 690, 1000); plant(ctx, 30, 330);
  // entrance mat / waiting area
  rr(ctx, 14, 1084, 520, 168, 28); ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fill();
  ctx.setLineDash([12, 10]); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.font = '700 20px Fredoka, sans-serif'; ctx.textAlign = 'left';
  ctx.font = '700 16px Fredoka, sans-serif'; ctx.fillText('PLEASE WAIT TO BE SEATED', 34, 1246);
  // door
  rr(ctx, -20, 1110, 34, 150, 8); blob(ctx, '#8b5e3c');
  // soft light from the window and a gentle vignette
  const g1 = ctx.createRadialGradient(360, 300, 40, 360, 300, 520);
  g1.addColorStop(0, 'rgba(255,255,230,0.22)'); g1.addColorStop(1, 'rgba(255,255,230,0)');
  ctx.fillStyle = g1; ctx.fillRect(0, 96, W, H);
  const g2 = ctx.createRadialGradient(360, 700, 380, 360, 700, 900);
  g2.addColorStop(0, 'rgba(60,30,10,0)'); g2.addColorStop(1, 'rgba(60,30,10,0.22)');
  ctx.fillStyle = g2; ctx.fillRect(0, 96, W, H);
}

// Fairy lights strung along the wall (animated twinkle)
export function drawStringLights(ctx, t, cafe) {
  ctx.strokeStyle = INK; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, 110);
  for (let x = 0; x <= 720; x += 120) ctx.quadraticCurveTo(x + 60, 140, x + 120, 110);
  ctx.stroke();
  const cols = ['#ffd43b', '#ff6b9a', '#69db7c', '#74c0fc', '#ff922b'];
  for (let i = 0; i < 24; i++) {
    const x = 15 + i * 30, seg = (x % 120) / 120, y = 110 + Math.sin(seg * Math.PI) * 22 + 4;
    const on = 0.55 + 0.45 * Math.sin(t * 3 + i * 1.7);
    ctx.globalAlpha = 0.35 * on; ctx.fillStyle = cols[i % 5];
    ctx.beginPath(); ctx.arc(x, y + 6, 11, 0, 7); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.ellipse(x, y + 6, 5, 7, 0, 0, 7); blob(ctx, cols[i % 5], INK, 1.5);
  }
}

// Clouds drifting past the window
export function drawWindowSky(ctx, t, cafe) {
  ctx.save(); rr(ctx, 270, 112, 180, 70, 14); ctx.clip();
  ctx.fillStyle = cafe.sky; ctx.fillRect(270, 112, 180, 70);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (let i = 0; i < 3; i++) {
    const x = 250 + ((t * (8 + i * 4) + i * 90) % 240), y = 132 + i * 16;
    ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.arc(x + 12, y - 4, 11, 0, 7); ctx.arc(x + 24, y, 8, 0, 7); ctx.fill();
  }
  ctx.restore();
  rr(ctx, 270, 112, 180, 70, 14); ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(360, 112); ctx.lineTo(360, 182); ctx.stroke();
}

function plant(ctx, x, y) {
  ctx.fillStyle = '#2f9e44';
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath(); ctx.ellipse(x + i * 9, y - 40 - Math.abs(i) * -4, 9, 26, i * 0.35, 0, 7); blob(ctx, i % 2 ? '#51cf66' : '#2f9e44', INK, 2.5);
  }
  rr(ctx, x - 22, y - 26, 44, 34, 8); blob(ctx, '#e8590c');
}

// ---------- Heroine ----------
// Change these values to restyle the main character in one place.
export const HERO = {
  name: 'Poppy',
  style: 'waves', // 'waves' (shoulder-length waves + headband) or 'buns'
  skin: '#f6cba6', skinShade: '#d99a73',
  hair: '#f7cf4f', hairShine: '#fff1b0', hairDark: '#d9a521',
  dress: '#ff6b6b', dressDark: '#e03131',
  apron: '#ffffff', accent: '#ffd43b',
  skates: '#4dabf7', skatesDark: '#1c7ed6',
};

export function drawPoppy(ctx, x, y, t, moving, facing, hands, busy, squash = 0) {
  const H = HERO;
  const bob = moving ? Math.sin(t * 18) * 3 : Math.sin(t * 3) * 1.2;
  const lean = moving ? facing * 0.06 : 0;
  shadow(ctx, x, y + 2, 34);
  if (moving) {
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const ly = y - 30 - i * 26, ph = (t * 6 + i * 0.33) % 1, len = 18 + ph * 16;
      ctx.globalAlpha = 1 - ph;
      ctx.beginPath(); ctx.moveTo(x - facing * (34 + ph * 10), ly); ctx.lineTo(x - facing * (34 + ph * 10 + len), ly); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  if (squash) ctx.scale(1 + squash * 0.14, 1 - squash * 0.14);
  // skates
  for (const sx of [-12, 12]) {
    rr(ctx, sx - 11, -18, 22, 16, 7); blob(ctx, H.skates, INK, 3);
    ctx.fillStyle = '#fff'; ctx.fillRect(sx - 6, -14, 12, 3);
    circle(ctx, sx - 6, 0, 4, H.accent, INK, 2); circle(ctx, sx + 6, 0, 4, H.accent, INK, 2);
  }
  ctx.translate(0, bob);
  // legs with striped socks
  ctx.fillStyle = H.skin; ctx.fillRect(-15, -36, 8, 20); ctx.fillRect(7, -36, 8, 20);
  ctx.fillStyle = '#fff'; ctx.fillRect(-15, -24, 8, 7); ctx.fillRect(7, -24, 8, 7);
  ctx.fillStyle = H.dress; ctx.fillRect(-15, -21, 8, 2); ctx.fillRect(7, -21, 8, 2);
  // dress
  ctx.beginPath(); ctx.moveTo(-15, -86); ctx.lineTo(15, -86); ctx.lineTo(30, -32); ctx.quadraticCurveTo(0, -24, -30, -32); ctx.closePath();
  blob(ctx, H.dress);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  for (const [dx, dy] of [[-18, -40], [20, -44], [-8, -60], [12, -66], [24, -36]]) { ctx.beginPath(); ctx.arc(dx, dy, 2.5, 0, 7); ctx.fill(); }
  // white collar
  ctx.beginPath(); ctx.moveTo(-14, -86); ctx.quadraticCurveTo(-8, -76, 0, -82); ctx.quadraticCurveTo(8, -76, 14, -86); ctx.closePath(); blob(ctx, '#fff', INK, 2.5);
  // apron with heart pocket
  ctx.beginPath(); ctx.moveTo(-12, -70); ctx.lineTo(12, -70); ctx.lineTo(18, -34); ctx.quadraticCurveTo(0, -29, -18, -34); ctx.closePath();
  blob(ctx, H.apron, INK, 2.5);
  ctx.save(); ctx.translate(0, -50); ctx.scale(0.9, 0.9);
  ctx.beginPath(); ctx.moveTo(0, 6); ctx.bezierCurveTo(-10, -1, -5, -9, 0, -4); ctx.bezierCurveTo(5, -9, 10, -1, 0, 6); blob(ctx, H.dress, INK, 1.8);
  ctx.restore();
  // arms
  const sw = moving ? Math.sin(t * 18) * 7 : 0;
  const armUp = (h, side) => h ? -78 : -58 + sw * side;
  ctx.strokeStyle = H.skin; ctx.lineWidth = 8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-16, -78); ctx.lineTo(-30, armUp(hands[0], 1)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(16, -78); ctx.lineTo(30, armUp(hands[1], -1)); ctx.stroke();
  // head
  const hy = -110;
  const bun = moving ? Math.sin(t * 18) * 2 : 0;
  if (H.style === 'buns') {
    ellipse(ctx, 0, hy + 4, 30, 27, H.hair);
    for (const s of [-1, 1]) {
      circle(ctx, s * 21, hy - 25 - bun, 13, H.hair);
      ctx.fillStyle = H.hairShine; ctx.beginPath(); ctx.arc(s * 21 - 4, hy - 29 - bun, 3.5, 0, 7); ctx.fill();
      rr(ctx, s * 21 - 9, hy - 15 - bun, 18, 7, 3.5); blob(ctx, H.accent, INK, 2);
    }
  } else {
    // shoulder-length wavy hair that swishes as she skates
    const sway = moving ? Math.sin(t * 18 + 1) * 3 : Math.sin(t * 2) * 1;
    ctx.beginPath();
    ctx.moveTo(-30, hy - 6);
    ctx.quadraticCurveTo(-34, hy - 36, 0, hy - 36);
    ctx.quadraticCurveTo(34, hy - 36, 30, hy - 6);
    for (let i = 0; i < 4; i++) ctx.quadraticCurveTo(38 + sway, hy + 6 + i * 9, 30 + sway * 0.5 - (i % 2) * 4, hy + 12 + i * 9);
    ctx.quadraticCurveTo(18 + sway, hy + 50, 6, hy + 40);
    ctx.lineTo(-6, hy + 40);
    ctx.quadraticCurveTo(-18 + sway, hy + 50, -30 + sway * 0.5, hy + 39);
    for (let i = 3; i >= 0; i--) ctx.quadraticCurveTo(-38 + sway, hy + 6 + i * 9, -30 + sway * 0.5 + (i % 2) * 4, hy + i * 9);
    ctx.closePath(); blob(ctx, H.hair, INK, 3);
    ctx.strokeStyle = H.hairDark; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-24, hy + 14); ctx.quadraticCurveTo(-30, hy + 26, -22, hy + 36); ctx.moveTo(24, hy + 14); ctx.quadraticCurveTo(30, hy + 26, 22, hy + 36); ctx.stroke();
  }
  circle(ctx, 0, hy, 26, H.skin);
  // ears
  circle(ctx, -26, hy + 4, 5, H.skin, INK, 2.5); circle(ctx, 26, hy + 4, 5, H.skin, INK, 2.5);
  // fringe
  // side-swept fringe
  ctx.beginPath(); ctx.moveTo(-27, hy + 2);
  ctx.quadraticCurveTo(-30, hy - 30, 2, hy - 29); ctx.quadraticCurveTo(28, hy - 28, 27, hy + 2);
  ctx.quadraticCurveTo(22, hy - 12, 8, hy - 15); ctx.quadraticCurveTo(-8, hy - 13, -19, hy - 4); ctx.quadraticCurveTo(-24, hy - 2, -27, hy + 2);
  ctx.closePath(); blob(ctx, H.hair, INK, 2.5);
  ctx.fillStyle = H.hairShine; ctx.beginPath(); ctx.ellipse(-10, hy - 21, 8, 3, -0.3, 0, 7); ctx.fill();
  if (H.style !== 'buns') {
    // headband with a little bow
    ctx.lineCap = 'round';
    ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(0, hy - 2, 27, Math.PI * 1.12, Math.PI * 1.88); ctx.stroke();
    ctx.strokeStyle = H.dress; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, hy - 2, 27, Math.PI * 1.12, Math.PI * 1.88); ctx.stroke();
    ctx.save(); ctx.translate(18, hy - 25); ctx.rotate(0.5);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-11, -7); ctx.lineTo(-11, 7); ctx.closePath(); blob(ctx, H.dress, INK, 2);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(11, -7); ctx.lineTo(11, 7); ctx.closePath(); blob(ctx, H.dress, INK, 2);
    circle(ctx, 0, 0, 3.5, H.dressDark, INK, 1.5);
    ctx.restore();
  }
  // face
  const ex = facing * 3;
  if ((t % 3.7) < 0.12) { ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-13 + ex, hy + 3); ctx.lineTo(-5 + ex, hy + 3); ctx.moveTo(5 + ex, hy + 3); ctx.lineTo(13 + ex, hy + 3); ctx.stroke(); }
  else {
    ellipse(ctx, -9 + ex, hy + 3, 5, 7, INK, null); ellipse(ctx, 9 + ex, hy + 3, 5, 7, INK, null);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-7.5 + ex, hy, 2, 0, 7); ctx.arc(10.5 + ex, hy, 2, 0, 7); ctx.fill();
    // soft lashes on the outer corners
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath();
    ctx.moveTo(-13 + ex, hy + 1); ctx.lineTo(-17 + ex, hy); ctx.moveTo(13 + ex, hy + 1); ctx.lineTo(17 + ex, hy); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,107,107,0.45)'; ctx.beginPath(); ctx.ellipse(-16, hy + 12, 6, 3.5, 0, 0, 7); ctx.ellipse(16, hy + 12, 6, 3.5, 0, 0, 7); ctx.fill();
  ctx.fillStyle = H.skinShade; [[-18, 8], [-14, 10], [14, 10], [18, 8]].forEach(([a, b]) => { ctx.beginPath(); ctx.arc(a, hy + b, 1.3, 0, 7); ctx.fill(); });
  ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath();
  if (busy) { ctx.arc(ex, hy + 14, 4, 0, Math.PI * 2); ctx.stroke(); }
  else { ctx.arc(ex, hy + 11, 7, 0.12 * Math.PI, 0.88 * Math.PI); ctx.stroke(); }
  // held items
  const wob = moving ? Math.sin(t * 18) * 2 : 0;
  if (hands[0]) drawHeld(ctx, -32, -84 + wob, hands[0]);
  if (hands[1]) drawHeld(ctx, 32, -84 - wob, hands[1]);
  ctx.restore();
}

function drawHeld(ctx, x, y, item) {
  if (item.kind === 'food') drawFood(ctx, x, y, item.dish, 0.8, item.tableNo, null, item.tableColor);
  else drawDishes(ctx, x, y, 0.8);
}

// ---------- Customers ----------
export function drawCustomer(ctx, x, y, color, type, mood, t, idx, opts = {}) {
  const skin = SKINS[idx % SKINS.length];
  const hair = HAIRS[(idx * 3 + 1) % HAIRS.length];
  const bounce = opts.hop ? -Math.abs(Math.sin(t * 12)) * 8 : Math.sin(t * 2.5 + idx) * 1.2;
  const sc = opts.scale || 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sc, sc);
  if (!opts.seated) shadow(ctx, 0, 2, 22);
  ctx.translate(0, bounce);
  if (opts.angry) ctx.translate(Math.sin(t * 40) * 2, 0);
  if (opts.joy > 0) { ctx.translate(0, -Math.sin(opts.joy * Math.PI) * 18); }
  if (!opts.hop) { const br = Math.sin(t * 3 + idx) * 0.025; ctx.scale(1 - br * 0.5, 1 + br); }
  if (opts.selected) ctx.translate(0, -Math.abs(Math.sin(t * 8)) * 6);
  // body
  if (!opts.seated) { ctx.fillStyle = '#4a4e69'; ctx.fillRect(-12, -20, 9, 20); ctx.fillRect(3, -20, 9, 20); }
  ctx.beginPath(); ctx.ellipse(0, -36, 22, 24, 0, 0, Math.PI * 2); blob(ctx, color.fill);
  if (type === 'suit') {
    ctx.beginPath(); ctx.moveTo(-21, -42); ctx.lineTo(-6, -58); ctx.lineTo(-4, -18); ctx.quadraticCurveTo(-20, -18, -21, -30); ctx.closePath(); blob(ctx, '#343a40', INK, 2.5);
    ctx.beginPath(); ctx.moveTo(21, -42); ctx.lineTo(6, -58); ctx.lineTo(4, -18); ctx.quadraticCurveTo(20, -18, 21, -30); ctx.closePath(); blob(ctx, '#343a40', INK, 2.5);
    ctx.beginPath(); ctx.moveTo(0, -56); ctx.lineTo(4, -44); ctx.lineTo(0, -28); ctx.lineTo(-4, -44); ctx.closePath(); blob(ctx, '#e03131', INK, 2);
  }
  if (type === 'bookworm' && opts.seated && opts.reading) {
    rr(ctx, -16, -48, 32, 22, 3); blob(ctx, '#7048e8', INK, 2.5);
    ctx.fillStyle = '#fff'; ctx.fillRect(-1, -46, 2, 18);
  }
  // head
  const hy = -74 + (opts.eating ? Math.sin(t * 11 + idx) * 2.5 : 0);
  circle(ctx, 0, hy, 21, skin);
  // hair & accessories
  if (type === 'granny') {
    ctx.beginPath(); ctx.arc(0, hy - 4, 21, Math.PI * 1.05, Math.PI * 1.95); ctx.closePath(); blob(ctx, '#dee2e6', INK, 2.5);
    circle(ctx, 0, hy - 26, 9, '#dee2e6', INK, 2.5);
  } else if (type === 'student') {
    ctx.beginPath(); ctx.arc(0, hy - 4, 21, Math.PI, 0); ctx.closePath(); blob(ctx, color.dark, INK, 2.5);
    rr(ctx, -4, hy - 12, 32, 8, 4); blob(ctx, color.dark, INK, 2.5);
  } else if (type === 'suit') {
    ctx.beginPath(); ctx.arc(0, hy - 2, 21, Math.PI * 1.05, Math.PI * 1.95); ctx.quadraticCurveTo(10, hy - 14, -18, hy - 8); ctx.closePath(); blob(ctx, '#212529', INK, 2.5);
  } else if (type === 'bookworm') {
    ctx.beginPath(); ctx.arc(0, hy - 4, 22, Math.PI, 0); ctx.closePath(); blob(ctx, '#f08c00', INK, 2.5);
    circle(ctx, 0, hy - 27, 5, '#fff', INK, 2);
  } else {
    ctx.beginPath(); ctx.arc(0, hy - 3, 21, Math.PI * 1.0, Math.PI * 2.0); ctx.quadraticCurveTo(14, hy - 8, 0, hy - 12); ctx.quadraticCurveTo(-12, hy - 6, -21, hy - 3); ctx.closePath(); blob(ctx, hair, INK, 2.5);
  }
  // face
  ctx.fillStyle = INK;
  const eyeY = hy + 2;
  const blink = ((t * 0.8 + idx * 0.37) % 3.2) < 0.13;
  const look = opts.seated ? 0 : Math.sin(t * 0.9 + idx * 2) * 2;
  if (blink) { ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-10, eyeY); ctx.lineTo(-4, eyeY); ctx.moveTo(4, eyeY); ctx.lineTo(10, eyeY); ctx.stroke(); }
  else { ctx.beginPath(); ctx.arc(-7 + look, eyeY, 3.2, 0, 7); ctx.arc(7 + look, eyeY, 3.2, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-6 + look, eyeY - 1.2, 1.1, 0, 7); ctx.arc(8 + look, eyeY - 1.2, 1.1, 0, 7); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,120,150,0.35)'; ctx.beginPath(); ctx.ellipse(-13, hy + 9, 4.5, 2.6, 0, 0, 7); ctx.ellipse(13, hy + 9, 4.5, 2.6, 0, 0, 7); ctx.fill();
  if (type === 'granny' || type === 'bookworm') {
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(-7, eyeY, 6, 0, 7); ctx.moveTo(13, eyeY); ctx.arc(7, eyeY, 6, 0, 7); ctx.moveTo(-1, eyeY); ctx.lineTo(1, eyeY); ctx.stroke();
  }
  ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath();
  if (mood > 0.6) ctx.arc(0, hy + 8, 6, 0.15 * Math.PI, 0.85 * Math.PI);
  else if (mood > 0.3) { ctx.moveTo(-5, hy + 12); ctx.lineTo(5, hy + 12); }
  else {
    ctx.arc(0, hy + 17, 6, 1.15 * Math.PI, 1.85 * Math.PI);
    ctx.moveTo(-12, eyeY - 9); ctx.lineTo(-3, eyeY - 5); ctx.moveTo(12, eyeY - 9); ctx.lineTo(3, eyeY - 5);
  }
  ctx.stroke();
  if (mood <= 0.3) {
    ctx.fillStyle = 'rgba(255,80,80,0.35)'; ctx.beginPath(); ctx.arc(0, hy, 21, 0, 7); ctx.fill();
    // steam puffs
    for (let i = 0; i < 2; i++) {
      const ph = (t * 1.6 + i * 0.5 + idx * 0.13) % 1;
      ctx.globalAlpha = 0.8 * (1 - ph); ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc((i ? 14 : -14) + (i ? 6 : -6) * ph, hy - 22 - ph * 26, 4 + ph * 6, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else if (mood <= 0.5) {
    // sweat drop
    const dy = ((t * 0.9 + idx * 0.3) % 1) * 8;
    ctx.beginPath(); ctx.moveTo(19, hy - 10 + dy); ctx.quadraticCurveTo(25, hy - 2 + dy, 19, hy + 1 + dy); ctx.quadraticCurveTo(13, hy - 2 + dy, 19, hy - 10 + dy);
    blob(ctx, '#74c0fc', INK, 1.5);
  }
  if (opts.eating) {
    const fy = Math.sin(t * 11 + idx) * 6;
    ctx.strokeStyle = '#adb5bd'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(14, hy + 26 + fy); ctx.lineTo(8, hy + 12 + fy); ctx.stroke();
  }
  ctx.restore();
}

// ---------- Furniture ----------
export function chairPositions(table) {
  if (table.seats === 4) return [
    { x: table.x - 72, y: table.y - 18 }, { x: table.x + 72, y: table.y - 18 },
    { x: table.x - 72, y: table.y + 34 }, { x: table.x + 72, y: table.y + 34 },
  ];
  return [{ x: table.x - 66, y: table.y + 8 }, { x: table.x + 66, y: table.y + 8 }];
}

export function drawChair(ctx, x, y, color) {
  shadow(ctx, x, y + 14, 24, 8);
  rr(ctx, x - 22, y - 34, 44, 18, 8); blob(ctx, color.dark, INK, 3);
  rr(ctx, x - 22, y - 12, 44, 24, 8); blob(ctx, color.fill, INK, 3);
}

export function drawTableTop(ctx, table, cafe, highlight) {
  const { x, y } = table;
  shadow(ctx, x, y + (table.seats === 4 ? 48 : 30), table.seats === 4 ? 56 : 50, 14);
  if (table.seats === 4) { rr(ctx, x - 48, y - 40, 96, 84, 18); blob(ctx, cafe.table, highlight || INK, highlight ? 6 : 3.5); }
  else { ctx.beginPath(); ctx.ellipse(x, y, 44, 32, 0, 0, Math.PI * 2); blob(ctx, cafe.table, highlight || INK, highlight ? 6 : 3.5); }
  // table number sign, in the table's chair colour
  const sy = y + (table.seats === 4 ? 30 : 20);
  numberBadge(ctx, x, sy, table.no, 1.15, table.colorObj ? table.colorObj.fill : '#fff');
}

// ---------- Food & dishes ----------
const DISHES = ['burger', 'pancakes', 'salad', 'pasta', 'cake'];
export function dishFor(id) { return DISHES[id % DISHES.length]; }

export function drawFood(ctx, x, y, dish, s = 1, tableNo, t = null, badgeColor = null) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ellipse(ctx, 0, 6, 26, 10, '#ffffff', INK, 2.5);
  switch (dish) {
    case 'burger':
      ellipse(ctx, 0, 2, 16, 6, '#c9792b', INK, 2); rr(ctx, -17, -4, 34, 6, 3); blob(ctx, '#6b3e1f', INK, 2);
      rr(ctx, -18, -7, 36, 4, 2); blob(ctx, '#51cf66', null);
      ctx.beginPath(); ctx.ellipse(0, -9, 16, 10, 0, Math.PI, 0); ctx.closePath(); blob(ctx, '#f2a541', INK, 2); break;
    case 'pancakes':
      for (let i = 0; i < 3; i++) { ellipse(ctx, 0, 2 - i * 6, 17, 5, '#f0b45b', INK, 2); }
      rr(ctx, -5, -18, 10, 6, 2); blob(ctx, '#fff3bf', INK, 1.5); break;
    case 'salad':
      ctx.beginPath(); ctx.ellipse(0, 0, 18, 10, 0, 0, Math.PI); ctx.closePath(); blob(ctx, '#a5d8ff', INK, 2);
      circle(ctx, -7, -3, 6, '#69db7c', INK, 1.5); circle(ctx, 5, -4, 6, '#40c057', INK, 1.5); circle(ctx, 0, -6, 4, '#ff6b6b', INK, 1.5); break;
    case 'pasta':
      ellipse(ctx, 0, -2, 16, 8, '#ffe066', INK, 2); circle(ctx, -4, -4, 5, '#e03131', INK, 1.5); circle(ctx, 6, -3, 4, '#c92a2a', INK, 1.5); break;
    case 'cake':
      ctx.beginPath(); ctx.moveTo(-14, 2); ctx.lineTo(14, 2); ctx.lineTo(10, -16); ctx.lineTo(-10, -16); ctx.closePath(); blob(ctx, '#ffc9de', INK, 2);
      circle(ctx, 0, -20, 4, '#e03131', INK, 1.5); break;
  }
  if (t !== null) {
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const ph = (t * 0.9 + i * 0.33) % 1;
      ctx.globalAlpha = Math.sin(ph * Math.PI) * 0.9;
      ctx.beginPath(); ctx.moveTo(-10 + i * 10, -18 - ph * 24);
      ctx.quadraticCurveTo(-4 + i * 10, -26 - ph * 24, -10 + i * 10, -34 - ph * 24); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  if (tableNo) numberBadge(ctx, x + 22 * s, y - 16 * s, tableNo, 1.05 * s, badgeColor);
}

export function drawDishes(ctx, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  for (let i = 0; i < 3; i++) ellipse(ctx, i * 2 - 2, 6 - i * 5, 22, 7, '#e9ecef', INK, 2);
  ctx.fillStyle = '#a0522d'; [[-6, -6], [4, -8], [8, -5]].forEach(([a, b]) => { ctx.beginPath(); ctx.arc(a, b, 2.2, 0, 7); ctx.fill(); });
  ctx.restore();
}

// Round number badge. With a colour it matches the table's chairs, so orders are easy to match up.
export function numberBadge(ctx, x, y, n, s = 1, fill = null) {
  circle(ctx, x, y, 12 * s, fill || '#fff', INK, 2.5);
  ctx.font = `700 ${Math.round(16 * s)}px Fredoka, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (fill) { ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.strokeText(String(n), x, y + 1); ctx.fillStyle = '#fff'; }
  else ctx.fillStyle = INK;
  ctx.fillText(String(n), x, y + 1); ctx.textBaseline = 'alphabetic';
}

// ---------- Kitchen ----------
// Chef Leo: the café's cook (human)
export function drawChef(ctx, x, y, t, cooking) {
  const stir = cooking ? Math.sin(t * 10) * 4 : 0;
  const skin = '#e0ac69';
  ctx.save(); ctx.translate(x, y);
  // body: white chef jacket with red neckerchief
  ellipse(ctx, 0, 8, 38, 32, '#fff');
  ctx.fillStyle = INK; [[-8, -4], [8, -4], [-8, 10], [8, 10]].forEach(([a, b]) => { ctx.beginPath(); ctx.arc(a, b + 8, 2.4, 0, 7); ctx.fill(); });
  ctx.beginPath(); ctx.moveTo(-16, -12); ctx.lineTo(16, -12); ctx.lineTo(0, 6); ctx.closePath(); blob(ctx, '#e03131', INK, 2.5);
  // head
  const hy = -34 + (cooking ? Math.sin(t * 5) * 1.5 : 0);
  circle(ctx, -27, hy + 2, 6, skin, INK, 2.5); circle(ctx, 27, hy + 2, 6, skin, INK, 2.5);
  circle(ctx, 0, hy, 27, skin);
  // sideburns / curly hair under the hat
  for (const s of [-1, 1]) { circle(ctx, s * 22, hy - 12, 8, '#2d2d2d', INK, 2); circle(ctx, s * 25, hy - 2, 6, '#2d2d2d', INK, 2); }
  // tall puffy chef hat
  ctx.beginPath(); ctx.arc(-14, hy - 46, 15, 0, 7); ctx.arc(0, hy - 58, 18, 0, 7); ctx.arc(14, hy - 46, 15, 0, 7); blob(ctx, '#fff', INK, 3);
  rr(ctx, -22, hy - 44, 44, 22, 5); blob(ctx, '#fff', INK, 3);
  ctx.strokeStyle = '#dee2e6'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-8, hy - 40); ctx.lineTo(-8, hy - 26); ctx.moveTo(8, hy - 40); ctx.lineTo(8, hy - 26); ctx.stroke();
  // eyes (happy squint when cooking)
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.fillStyle = INK;
  if (cooking) { ctx.beginPath(); ctx.arc(-10, hy - 2, 4, Math.PI * 1.1, Math.PI * 1.9); ctx.moveTo(14, hy - 2); ctx.arc(10, hy - 2, 4, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
  else { ctx.beginPath(); ctx.arc(-10, hy - 3, 3.5, 0, 7); ctx.arc(10, hy - 3, 3.5, 0, 7); ctx.fill(); }
  // nose, cheeks, big curly moustache, smile
  ellipse(ctx, 0, hy + 5, 5, 4, '#d4955a', INK, 2);
  ctx.fillStyle = 'rgba(255,100,100,0.35)'; ctx.beginPath(); ctx.arc(-16, hy + 8, 5, 0, 7); ctx.arc(16, hy + 8, 5, 0, 7); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, hy + 10); ctx.bezierCurveTo(-8, hy + 6, -18, hy + 8, -20, hy + 14); ctx.bezierCurveTo(-22, hy + 8, -14, hy + 18, 0, hy + 13);
  ctx.bezierCurveTo(14, hy + 18, 22, hy + 8, 20, hy + 14); ctx.bezierCurveTo(18, hy + 8, 8, hy + 6, 0, hy + 10);
  blob(ctx, '#2d2d2d', INK, 2);
  ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, hy + 16, 5, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
  // pan
  ctx.save(); ctx.translate(36 + stir, -2);
  rr(ctx, 0, -6, 42, 10, 5); blob(ctx, '#495057', INK, 2.5); rr(ctx, 40, -3, 22, 5, 2); blob(ctx, '#212529', INK, 2);
  if (cooking) { ctx.fillStyle = 'rgba(255,255,255,0.7)'; for (let i = 0; i < 3; i++) { const ph = (t * 1.5 + i / 3) % 1; ctx.beginPath(); ctx.arc(12 + i * 9, -10 - ph * 30, 4 + ph * 4, 0, 7); ctx.globalAlpha = 1 - ph; ctx.fill(); } ctx.globalAlpha = 1; }
  ctx.restore();
  ctx.restore();
}

export function drawTicketWheel(ctx, x, y, count, t, pulse, tickets = []) {
  ctx.save(); ctx.translate(x, y);
  rr(ctx, -6, -10, 12, 40, 4); blob(ctx, '#868e96', INK, 2.5);
  ctx.rotate(t * 0.6);
  circle(ctx, 0, -14, 30 + (pulse ? Math.sin(t * 10) * 2 : 0), '#f1f3f5');
  for (let i = 0; i < 6; i++) { ctx.save(); ctx.rotate(i * Math.PI / 3); rr(ctx, -6, -44, 12, 18, 2); blob(ctx, '#fff9db', INK, 2); ctx.restore(); }
  circle(ctx, 0, -14, 6, '#adb5bd', INK, 2);
  ctx.restore();
  // order tickets waiting to go to the kitchen, each with its table number
  tickets.slice(0, 4).forEach((tk, i) => {
    const tx = x - 30 + i * 30, ty = y - 76 + Math.sin(t * 6 + i) * 2;
    ctx.save(); ctx.translate(tx, ty); ctx.rotate((i % 2 ? 0.08 : -0.08));
    rr(ctx, -13, -17, 26, 34, 3); blob(ctx, '#fff9db', INK, 2.5);
    ctx.fillStyle = '#ced4da'; ctx.fillRect(-8, 8, 16, 2); ctx.fillRect(-8, 12, 10, 2);
    ctx.restore();
    numberBadge(ctx, tx, ty - 4, tk.no, 0.8, tk.color);
  });
  if (count > 4) { ctx.fillStyle = INK; ctx.font = '700 16px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`+${count - 4}`, x + 92, y - 72); }
}

export function drawBin(ctx, x, y) {
  shadow(ctx, x, y + 30, 30);
  rr(ctx, x - 28, y - 28, 56, 58, 10); blob(ctx, '#74c0fc');
  rr(ctx, x - 32, y - 36, 64, 14, 6); blob(ctx, '#4dabf7');
  ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = '700 13px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('DISHES', x, y + 8);
}

export function drawCoffee(ctx, x, y, ready, t, level) {
  shadow(ctx, x, y + 38, 40);
  rr(ctx, x - 40, y - 10, 80, 46, 10); blob(ctx, '#a0673f');
  rr(ctx, x - 26, y - 52, 52, 46, 10); blob(ctx, level ? '#e03131' : '#adb5bd');
  circle(ctx, x, y - 30, 10, '#fff', INK, 2.5);
  ctx.fillStyle = INK; ctx.font = '700 12px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('COFFEE', x, y + 20);
  if (ready && level) {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (let i = 0; i < 2; i++) { const ph = (t + i * 0.5) % 1; ctx.globalAlpha = 1 - ph; ctx.beginPath(); ctx.arc(x - 6 + i * 12, y - 60 - ph * 24, 5, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
}

// ---------- UI bits ----------
export function drawHearts(ctx, x, y, value, max = 5) {
  for (let i = 0; i < max; i++) {
    const hx = x + (i - (max - 1) / 2) * 15;
    const fill = Math.max(0, Math.min(1, value - i));
    heart(ctx, hx, y, 6.5, '#ffffff', 1);
    if (fill > 0) {
      ctx.save(); ctx.beginPath(); ctx.rect(hx - 8, y - 8, 16 * fill, 16); ctx.clip();
      heart(ctx, hx, y, 6.5, value < 1.6 ? '#ff4d4d' : '#ff6b9a', 1);
      ctx.restore();
    }
  }
}

function heart(ctx, x, y, r, fill, lw) {
  ctx.beginPath();
  ctx.moveTo(x, y + r);
  ctx.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.6, y - r * 1.5, x, y - r * 0.4);
  ctx.bezierCurveTo(x + r * 0.6, y - r * 1.5, x + r * 1.6, y - r * 0.2, x, y + r);
  ctx.closePath(); blob(ctx, fill, INK, lw * 1.6);
}

export function drawBubble(ctx, x, y, icon, t, urgent, info = null) {
  const s = 1 + (urgent ? Math.sin(t * 10) * 0.08 : 0);
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.ellipse(0, 0, 24, 20, 0, 0, Math.PI * 2); ctx.moveTo(-6, 18); ctx.lineTo(0, 28); ctx.lineTo(6, 18);
  blob(ctx, '#fff', INK, 3);
  switch (icon) {
    case 'menu': rr(ctx, -9, -11, 18, 22, 3); blob(ctx, '#ffd8a8', INK, 2); ctx.fillStyle = INK; ctx.fillRect(-5, -5, 10, 2); ctx.fillRect(-5, 0, 10, 2); ctx.fillRect(-5, 5, 7, 2); break;
    case 'order': ctx.fillStyle = '#f03e3e'; ctx.font = '700 30px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', 0, 2); ctx.textBaseline = 'alphabetic'; break;
    case 'food':
      if (info && info.dish) { ctx.restore(); ctx.save(); ctx.translate(x, y); ctx.scale(s, s); drawFood(ctx, 0, 2, info.dish, 0.62); }
      else { ellipse(ctx, 0, 4, 14, 6, '#fff', INK, 2); ctx.beginPath(); ctx.arc(0, 2, 10, Math.PI, 0); blob(ctx, '#ced4da', INK, 2); circle(ctx, 0, -9, 2.5, '#ced4da', INK, 1.5); }
      break;
    case 'eat': ctx.fillStyle = INK; ctx.font = '700 18px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('yum', 0, 1); ctx.textBaseline = 'alphabetic'; break;
    case 'check': ctx.fillStyle = '#2b8a3e'; ctx.font = '700 26px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('£', 0, 2); ctx.textBaseline = 'alphabetic'; break;
  }
  ctx.restore();
}

export function drawQueueMarker(ctx, x, y, n) {
  circle(ctx, x, y, 14, '#7048e8', '#fff', 3);
  ctx.fillStyle = '#fff'; ctx.font = '700 16px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(String(n), x, y + 1); ctx.textBaseline = 'alphabetic';
}
