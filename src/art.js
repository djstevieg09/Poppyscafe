// All game art is drawn in code (cartoon vector style) so it stays crisp on any
// screen and the download stays tiny. Original characters:
//   Lolly  - our roller-skating 1950s diner waitress (blonde ponytail, pink dress)
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

// ---------- Background (1950s diner) ----------
export function drawBackground(ctx, cafe) {
  const W = 720, H = 1280;
  // classic diner checkerboard floor
  ctx.fillStyle = cafe.floorA; ctx.fillRect(0, 0, W, H);
  const s = 60;
  ctx.fillStyle = cafe.floorB;
  for (let y = 230; y < H; y += s) for (let x = 0; x < W; x += s) {
    if ((Math.round(x / s) + Math.round((y - 230) / s)) % 2 === 0) ctx.fillRect(x, y, s, s);
  }
  // floor shine
  const fl = ctx.createLinearGradient(0, 230, 0, H);
  fl.addColorStop(0, 'rgba(255,255,255,0.10)'); fl.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = fl; ctx.fillRect(0, 230, W, H - 230);
  // back wall: pastel top, chrome stripe, coloured lower band
  ctx.fillStyle = cafe.wall; ctx.fillRect(0, 96, W, 134);
  ctx.fillStyle = cafe.wallTrim; ctx.fillRect(0, 186, W, 44);
  chrome(ctx, 0, 178, W, 9);
  chrome(ctx, 0, 96, W, 6);
  // window with striped awning
  rr(ctx, 270, 112, 180, 64, 14); blob(ctx, cafe.sky);
  for (let i = 0; i < 6; i++) {
    ctx.beginPath(); ctx.moveTo(264 + i * 32, 108); ctx.lineTo(296 + i * 32, 108); ctx.arc(280 + i * 32, 108, 16, 0, Math.PI); ctx.closePath();
    blob(ctx, i % 2 ? '#fff' : cafe.wallTrim, INK, 2.5);
  }
  // counter: chrome top edge and ribbed front
  rr(ctx, 30, 228, 660, 22, 8); blob(ctx, cafe.counterTop);
  rr(ctx, 30, 246, 660, 44, 6); blob(ctx, cafe.counter);
  for (let x = 46; x < 680; x += 26) chrome(ctx, x, 252, 6, 32);
  chrome(ctx, 30, 244, 660, 5);
  plant(ctx, 30, 330);
  // entrance mat / waiting area
  rr(ctx, 14, 1084, 520, 168, 28); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fill();
  ctx.setLineDash([12, 10]); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.textAlign = 'left';
  ctx.font = '700 16px Fredoka, sans-serif'; ctx.fillText('PLEASE WAIT TO BE SEATED', 34, 1246);
  // door
  rr(ctx, -20, 1110, 34, 150, 8); blob(ctx, '#e03131');
  // soft light and vignette
  const g1 = ctx.createRadialGradient(360, 300, 40, 360, 300, 520);
  g1.addColorStop(0, 'rgba(255,255,230,0.18)'); g1.addColorStop(1, 'rgba(255,255,230,0)');
  ctx.fillStyle = g1; ctx.fillRect(0, 96, W, H);
  const g2 = ctx.createRadialGradient(360, 700, 380, 360, 700, 900);
  g2.addColorStop(0, 'rgba(40,20,10,0)'); g2.addColorStop(1, 'rgba(40,20,10,0.25)');
  ctx.fillStyle = g2; ctx.fillRect(0, 96, W, H);
}

// shiny chrome strip
export function chrome(ctx, x, y, w, h) {
  const g = w > h ? ctx.createLinearGradient(0, y, 0, y + h) : ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, '#f8f9fa'); g.addColorStop(0.45, '#adb5bd'); g.addColorStop(0.55, '#dee2e6'); g.addColorStop(1, '#868e96');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
}

// Animated 1950s diner decor: neon sign, jukebox and neon tube
export function drawStringLights(ctx, t, cafe) {
  // jukebox (left of the window, behind the counter)
  const jx = 205, jy = 228;
  ctx.save();
  ctx.beginPath(); ctx.moveTo(jx - 40, jy); ctx.lineTo(jx - 40, jy - 78); ctx.arc(jx, jy - 78, 40, Math.PI, 0); ctx.lineTo(jx + 40, jy); ctx.closePath();
  blob(ctx, '#8b4513', INK, 3);
  ctx.beginPath(); ctx.moveTo(jx - 30, jy); ctx.lineTo(jx - 30, jy - 78); ctx.arc(jx, jy - 78, 30, Math.PI, 0); ctx.lineTo(jx + 30, jy); ctx.closePath();
  const cols = ['#ff6b6b', '#ffd43b', '#69db7c', '#4dabf7', '#cc5de8'];
  const k = Math.floor(t * 4) % cols.length;
  ctx.lineWidth = 6; ctx.strokeStyle = cols[k]; ctx.stroke();
  ctx.lineWidth = 2.5; ctx.strokeStyle = cols[(k + 2) % cols.length]; ctx.stroke();
  rr(ctx, jx - 20, jy - 92, 40, 30, 6); blob(ctx, '#fff3bf', INK, 2);
  ctx.fillStyle = INK; for (let i = 0; i < 3; i++) ctx.fillRect(jx - 14, jy - 86 + i * 8, 28, 2);
  for (let i = 0; i < 4; i++) { ctx.fillStyle = cols[(k + i) % 5]; ctx.beginPath(); ctx.arc(jx - 15 + i * 10, jy - 50, 3.5, 0, 7); ctx.fill(); }
  // music notes floating up
  for (let i = 0; i < 2; i++) {
    const ph = (t * 0.5 + i * 0.5) % 1;
    ctx.globalAlpha = Math.sin(ph * Math.PI);
    ctx.fillStyle = INK; ctx.font = '700 22px Fredoka, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(i ? '♫' : '♪', jx + 34 + Math.sin(ph * 6) * 8, jy - 120 - ph * 20);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  // neon sign on the right of the window
  const flick = (Math.sin(t * 23) > 0.97) ? 0.4 : 1;
  const nx = 526, ny = 152;
  ctx.save();
  rr(ctx, nx - 64, ny - 34, 128, 52, 12); ctx.fillStyle = 'rgba(20,10,30,0.85)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  ctx.textAlign = 'center'; ctx.font = '700 30px Fredoka, sans-serif';
  ctx.globalAlpha = 0.35 * flick; ctx.lineWidth = 10; ctx.strokeStyle = '#ff5fa2'; ctx.strokeText("LOLLY'S", nx, ny);
  ctx.globalAlpha = flick; ctx.lineWidth = 3; ctx.strokeStyle = '#ff5fa2'; ctx.strokeText("LOLLY'S", nx, ny);
  ctx.fillStyle = '#ffe3f1'; ctx.fillText("LOLLY'S", nx, ny);
  ctx.globalAlpha = 1; ctx.font = '700 11px Fredoka, sans-serif'; ctx.fillStyle = '#66d9e8';
  ctx.fillText('★ DINER · OPEN ★', nx, ny + 13);
  ctx.restore();
}

// Clouds drifting past the window
export function drawWindowSky(ctx, t, cafe) {
  ctx.save(); rr(ctx, 270, 112, 180, 64, 14); ctx.clip();
  ctx.fillStyle = cafe.sky; ctx.fillRect(270, 112, 180, 64);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (let i = 0; i < 3; i++) {
    const x = 250 + ((t * (8 + i * 4) + i * 90) % 240), y = 132 + i * 16;
    ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.arc(x + 12, y - 4, 11, 0, 7); ctx.arc(x + 24, y, 8, 0, 7); ctx.fill();
  }
  ctx.restore();
  rr(ctx, 270, 112, 180, 64, 14); ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(360, 112); ctx.lineTo(360, 176); ctx.stroke();
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
  name: 'Lolly',
  // 'fifties' = 1950s diner waitress: high ponytail + front curl, scarf, puff sleeves, name tag
  // other looks: 'waves' (shoulder-length waves + headband), 'buns'
  style: 'fifties',
  skin: '#f6cba6', skinShade: '#d99a73',
  hair: '#f7cf4f', hairShine: '#fff1b0', hairDark: '#d9a521',
  dress: '#ff8fab', dressDark: '#e64980',
  apron: '#ffffff', accent: '#3bc9db',
  skates: '#ffffff', skatesDark: '#ced4da', wheels: '#ff8fab',
};

export function drawHeroine(ctx, x, y, t, moving, facing, hands, busy, squash = 0) {
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
    circle(ctx, sx - 6, 0, 4, H.wheels || H.accent, INK, 2); circle(ctx, sx + 6, 0, 4, H.wheels || H.accent, INK, 2);
    rr(ctx, sx - 11, -19, 22, 5, 2.5); blob(ctx, H.dress, INK, 1.5);
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
  // apron with heart pocket (frilly hem for the 1950s look)
  ctx.beginPath(); ctx.moveTo(-12, -70); ctx.lineTo(12, -70); ctx.lineTo(18, -34);
  if (H.style === 'fifties') for (let i = 0; i < 6; i++) ctx.arc(15 - i * 6, -34, 3, 0, Math.PI, false);
  else ctx.quadraticCurveTo(0, -29, -18, -34);
  ctx.closePath();
  blob(ctx, H.apron, INK, 2.5);
  ctx.save(); ctx.translate(0, -50); ctx.scale(0.9, 0.9);
  ctx.beginPath(); ctx.moveTo(0, 6); ctx.bezierCurveTo(-10, -1, -5, -9, 0, -4); ctx.bezierCurveTo(5, -9, 10, -1, 0, 6); blob(ctx, H.dress, INK, 1.8);
  ctx.restore();
  if (H.style === 'fifties') {
    // neck scarf with a knot
    ctx.beginPath(); ctx.moveTo(-10, -86); ctx.quadraticCurveTo(0, -80, 10, -86); ctx.lineTo(6, -80); ctx.quadraticCurveTo(0, -77, -6, -80); ctx.closePath(); blob(ctx, H.accent, INK, 2);
    ctx.beginPath(); ctx.moveTo(2, -80); ctx.lineTo(12, -70); ctx.lineTo(6, -68); ctx.closePath(); blob(ctx, H.accent, INK, 2);
    // name tag
    rr(ctx, 2, -76, 26, 9, 2); blob(ctx, '#fff', INK, 1.5);
    ctx.fillStyle = H.dressDark; ctx.font = '700 5px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(H.name.toUpperCase(), 15, -69.5);
  }
  // arms
  const sw = moving ? Math.sin(t * 18) * 7 : 0;
  const armUp = (h, side) => h ? -78 : -58 + sw * side;
  ctx.strokeStyle = H.skin; ctx.lineWidth = 8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-16, -78); ctx.lineTo(-30, armUp(hands[0], 1)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(16, -78); ctx.lineTo(30, armUp(hands[1], -1)); ctx.stroke();
  if (H.style === 'fifties') { circle(ctx, -17, -80, 8, '#fff', INK, 2.5); circle(ctx, 17, -80, 8, '#fff', INK, 2.5); }
  // head
  const hy = -110;
  const bun = moving ? Math.sin(t * 18) * 2 : 0;
  if (H.style === 'fifties') {
    // high swinging ponytail with a scarf bow, short hair at the back
    ctx.save(); ctx.translate(-facing * 20, hy - 22);
    ctx.rotate(-facing * (1.25 + (moving ? Math.sin(t * 18) * 0.25 : Math.sin(t * 2.5) * 0.08)));
    ctx.beginPath(); ctx.moveTo(-9, 0); ctx.quadraticCurveTo(-22, 32, -6, 56); ctx.quadraticCurveTo(2, 44, 7, 58); ctx.quadraticCurveTo(20, 26, 9, 0); ctx.closePath();
    blob(ctx, H.hair, INK, 3);
    ctx.strokeStyle = H.hairDark; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 8); ctx.quadraticCurveTo(-6, 24, 0, 36); ctx.stroke();
    ctx.restore();
    ellipse(ctx, 0, hy + 2, 29, 26, H.hair);
  } else if (H.style === 'buns') {
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
  if (H.style === 'fifties') {
    // big front curl (pin curl roll) and a scarf bow on the ponytail
    ctx.beginPath(); ctx.ellipse(-4, hy - 27, 19, 11, -0.15, 0, Math.PI * 2); blob(ctx, H.hair, INK, 2.5);
    ctx.strokeStyle = H.hairDark; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(-4, hy - 27, 6, 0.3, Math.PI * 1.7); ctx.stroke();
    ctx.fillStyle = H.hairShine; ctx.beginPath(); ctx.ellipse(-12, hy - 32, 6, 2.5, -0.3, 0, 7); ctx.fill();
    ctx.save(); ctx.translate(-facing * 20, hy - 24); ctx.rotate(-facing * 0.5);
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(d * 14, -12, d * 14, 4); ctx.closePath(); blob(ctx, H.accent, INK, 2); }
    circle(ctx, 0, 0, 3.5, H.accent, INK, 1.5);
    ctx.fillStyle = '#fff'; [[-8, -2], [8, -1], [-10, 2]].forEach(([a, b]) => { ctx.beginPath(); ctx.arc(a, b, 1.3, 0, 7); ctx.fill(); });
    ctx.restore();
  }
  if (H.style === 'waves') {
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
  // chrome legs
  ctx.strokeStyle = '#adb5bd'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 15, y + 8); ctx.lineTo(x - 17, y + 16); ctx.moveTo(x + 15, y + 8); ctx.lineTo(x + 17, y + 16); ctx.stroke();
  // vinyl back with tufted lines and a chrome rim
  rr(ctx, x - 22, y - 36, 44, 20, 9); blob(ctx, color.dark, INK, 3);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 7, y - 32); ctx.lineTo(x - 7, y - 20); ctx.moveTo(x + 7, y - 32); ctx.lineTo(x + 7, y - 20); ctx.stroke();
  rr(ctx, x - 23, y - 13, 46, 24, 9); blob(ctx, color.fill, INK, 3);
  ctx.strokeStyle = '#dee2e6'; ctx.lineWidth = 2; rr(ctx, x - 20, y - 10, 40, 18, 7); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.ellipse(x - 8, y - 5, 8, 3, 0, 0, 7); ctx.fill();
}
export function drawTableTop(ctx, table, cafe, highlight) {
  const { x, y } = table;
  shadow(ctx, x, y + (table.seats === 4 ? 48 : 30), table.seats === 4 ? 56 : 50, 14);
  if (table.seats === 4) { rr(ctx, x - 48, y - 40, 96, 84, 18); blob(ctx, cafe.table, highlight || INK, highlight ? 6 : 3.5); rr(ctx, x - 43, y - 35, 86, 74, 14); }
  else { ctx.beginPath(); ctx.ellipse(x, y, 44, 32, 0, 0, Math.PI * 2); blob(ctx, cafe.table, highlight || INK, highlight ? 6 : 3.5); ctx.beginPath(); ctx.ellipse(x, y, 39, 27, 0, 0, Math.PI * 2); }
  // chrome rim + retro formica boomerangs
  ctx.lineWidth = 3; ctx.strokeStyle = '#ced4da'; ctx.stroke();
  ctx.strokeStyle = 'rgba(77,171,247,0.35)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  for (const [dx, dy, r] of [[-18, -12, 0.3], [16, -4, -0.6], [-6, 10, 1.2]]) {
    ctx.save(); ctx.translate(x + dx, y + dy); ctx.rotate(r); ctx.beginPath(); ctx.moveTo(-7, 3); ctx.quadraticCurveTo(0, -5, 7, 3); ctx.stroke(); ctx.restore();
  }
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
// Chef Leo: the diner's cook (human). While cooking he cycles through chopping,
// stirring a pot and flipping a pancake. pass: 'back' = body and head (drawn behind the
// counter), 'front' = arms and kitchen tools (drawn on top of the counter), 'all' = both.
export function chefAction(t, cooking) {
  if (!cooking) return { name: 'idle', p: 0 };
  const cycle = 2.2, k = (t / cycle) % 3;
  return { name: ['chop', 'stir', 'flip'][Math.floor(k)], p: k % 1 };
}

export function drawChef(ctx, x, y, t, cooking, pass = 'all') {
  const skin = '#e0ac69';
  const act = chefAction(t, cooking);
  ctx.save(); ctx.translate(x, y);
  if (pass !== 'front') {
    const lean = act.name === 'chop' ? Math.sin(t * 14) * 0.02 : act.name === 'flip' ? -0.04 : 0;
    ctx.save(); ctx.rotate(lean);
    // body: white chef jacket with red neckerchief
    ellipse(ctx, 0, 8, 38, 32, '#fff');
    ctx.fillStyle = INK; [[-8, -4], [8, -4], [-8, 10], [8, 10]].forEach(([a, b]) => { ctx.beginPath(); ctx.arc(a, b + 8, 2.4, 0, 7); ctx.fill(); });
    ctx.beginPath(); ctx.moveTo(-16, -12); ctx.lineTo(16, -12); ctx.lineTo(0, 6); ctx.closePath(); blob(ctx, '#e03131', INK, 2.5);
    // head (bobs along while cooking)
    const hy = -34 + (cooking ? Math.sin(t * (act.name === 'chop' ? 14 : 6)) * 1.8 : Math.sin(t * 2) * 0.8);
    circle(ctx, -27, hy + 2, 6, skin, INK, 2.5); circle(ctx, 27, hy + 2, 6, skin, INK, 2.5);
    circle(ctx, 0, hy, 27, skin);
    for (const s of [-1, 1]) { circle(ctx, s * 22, hy - 12, 8, '#2d2d2d', INK, 2); circle(ctx, s * 25, hy - 2, 6, '#2d2d2d', INK, 2); }
    // tall puffy chef hat (wobbles when he flips)
    ctx.save(); ctx.translate(0, hy - 22); ctx.rotate(act.name === 'flip' ? Math.sin(act.p * Math.PI * 2) * 0.08 : 0); ctx.translate(0, -(hy - 22));
    ctx.beginPath(); ctx.arc(-14, hy - 46, 15, 0, 7); ctx.arc(0, hy - 58, 18, 0, 7); ctx.arc(14, hy - 46, 15, 0, 7); blob(ctx, '#fff', INK, 3);
    rr(ctx, -22, hy - 44, 44, 22, 5); blob(ctx, '#fff', INK, 3);
    ctx.strokeStyle = '#dee2e6'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-8, hy - 40); ctx.lineTo(-8, hy - 26); ctx.moveTo(8, hy - 40); ctx.lineTo(8, hy - 26); ctx.stroke();
    ctx.restore();
    // eyes look at what he's doing
    const look = cooking ? -3 : 0;
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.fillStyle = INK;
    if (act.name === 'flip' && act.p > 0.2 && act.p < 0.8) { ctx.beginPath(); ctx.arc(-10 + look, hy - 5, 4, 0, 7); ctx.arc(10 + look, hy - 5, 4, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-9 + look, hy - 7, 1.4, 0, 7); ctx.arc(11 + look, hy - 7, 1.4, 0, 7); ctx.fill(); }
    else if (cooking) { ctx.beginPath(); ctx.arc(-10 + look, hy - 2, 4, Math.PI * 1.1, Math.PI * 1.9); ctx.moveTo(14 + look, hy - 2); ctx.arc(10 + look, hy - 2, 4, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
    else if ((t % 4) < 0.12) { ctx.beginPath(); ctx.moveTo(-14, hy - 3); ctx.lineTo(-6, hy - 3); ctx.moveTo(6, hy - 3); ctx.lineTo(14, hy - 3); ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(-10, hy - 3, 3.5, 0, 7); ctx.arc(10, hy - 3, 3.5, 0, 7); ctx.fill(); }
    // nose, cheeks, curly moustache, mouth
    ellipse(ctx, 0, hy + 5, 5, 4, '#d4955a', INK, 2);
    ctx.fillStyle = 'rgba(255,100,100,0.35)'; ctx.beginPath(); ctx.arc(-16, hy + 8, 5, 0, 7); ctx.arc(16, hy + 8, 5, 0, 7); ctx.fill();
    const mw = cooking ? Math.sin(t * 8) * 1.5 : 0;
    ctx.beginPath();
    ctx.moveTo(0, hy + 10); ctx.bezierCurveTo(-8, hy + 6, -18, hy + 8 - mw, -20, hy + 14 - mw); ctx.bezierCurveTo(-22, hy + 8, -14, hy + 18, 0, hy + 13);
    ctx.bezierCurveTo(14, hy + 18, 22, hy + 8, 20, hy + 14 - mw); ctx.bezierCurveTo(18, hy + 8 - mw, 8, hy + 6, 0, hy + 10);
    blob(ctx, '#2d2d2d', INK, 2);
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath();
    if (act.name === 'flip' && act.p > 0.2 && act.p < 0.8) { ctx.arc(0, hy + 19, 4, 0, Math.PI * 2); ctx.stroke(); }
    else { ctx.arc(0, hy + 16, 5, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke(); }
    ctx.restore();
  }
  if (pass !== 'back') drawChefHands(ctx, t, act, skin);
  ctx.restore();
}

function arm(ctx, sx, sy, hx, hy, skin) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = INK; ctx.lineWidth = 13; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy); ctx.stroke();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo((sx + hx) / 2, (sy + hy) / 2); ctx.stroke();
  ctx.strokeStyle = skin; ctx.beginPath(); ctx.moveTo((sx + hx) / 2, (sy + hy) / 2); ctx.lineTo(hx, hy); ctx.stroke();
  circle(ctx, hx, hy, 6, skin, INK, 2.5);
}

function drawChefHands(ctx, t, act, skin) {
  const top = 13; // counter surface, in the chef's local space
  if (act.name === 'idle') {
    // tapping fingers on the counter, little spatula resting by his side
    rr(ctx, -62, top - 4, 30, 5, 2); blob(ctx, '#adb5bd', INK, 2);
    arm(ctx, -26, -2, -30, top - 2 + Math.abs(Math.sin(t * 6)) * -3, skin);
    arm(ctx, 26, -2, 30, top - 2, skin);
    return;
  }
  if (act.name === 'chop') {
    // cutting board with a carrot being sliced
    rr(ctx, -82, top - 8, 66, 12, 4); blob(ctx, '#c58f5a', INK, 2.5);
    const slices = Math.floor(act.p * 7);
    ctx.save(); ctx.translate(-36, top - 13);
    rr(ctx, -26 + slices * 3, -5, 30 - slices * 3, 10, 5); blob(ctx, '#ff922b', INK, 2);
    ctx.fillStyle = '#51cf66'; ctx.beginPath(); ctx.moveTo(4, -2); ctx.lineTo(14, -9); ctx.lineTo(12, 2); ctx.closePath(); ctx.fill();
    for (let i = 0; i < slices; i++) { const sx = -34 - i * 6; circle(ctx, sx, 1 - (i % 2) * 2, 4, '#ffa94d', INK, 1.5); }
    ctx.restore();
    // knife going up and down fast
    const up = Math.abs(Math.sin(t * 14));
    const kx = -38 + slices * 0.5, ky = top - 16 - up * 18;
    arm(ctx, -26, -2, kx + 12, ky + 2, skin);
    ctx.save(); ctx.translate(kx, ky);
    ctx.beginPath(); ctx.moveTo(-20, 4); ctx.lineTo(4, 4); ctx.lineTo(4, -6); ctx.quadraticCurveTo(-14, -6, -20, 4); ctx.closePath(); blob(ctx, '#e9ecef', INK, 2);
    rr(ctx, 4, -4, 14, 7, 3); blob(ctx, '#495057', INK, 2);
    ctx.restore();
    // the other hand holds the carrot
    arm(ctx, 26, -2, -12, top - 12, skin);
    // little chips fly when the knife lands
    if (up < 0.25) { ctx.fillStyle = '#ffa94d'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(kx - 10 - i * 6, top - 22 - i * 4 - (0.25 - up) * 30, 2.2, 0, 7); ctx.fill(); } }
    return;
  }
  if (act.name === 'stir') {
    // bubbling pot on a burner
    const px = -46, py = top - 14;
    ctx.fillStyle = '#ff6b00'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(px - 12 + i * 12, top - 1, 4, 6 + Math.sin(t * 20 + i) * 2, 0, 0, 7); ctx.fill(); }
    rr(ctx, px - 30, py - 18, 60, 30, 8); blob(ctx, '#868e96', INK, 3);
    rr(ctx, px - 38, py - 14, 10, 5, 2); blob(ctx, '#495057', INK, 2); rr(ctx, px + 28, py - 14, 10, 5, 2); blob(ctx, '#495057', INK, 2);
    ellipse(ctx, px, py - 18, 28, 6, '#e8590c', INK, 2.5);
    for (let i = 0; i < 4; i++) { const ph = (t * 2 + i * 0.25) % 1; circle(ctx, px - 18 + i * 12, py - 19 - ph * 4, 2 + ph * 2, '#ff922b', null); }
    // spoon going round
    const a = t * 7;
    const sx = px + Math.cos(a) * 14, sy = py - 22 + Math.sin(a) * 3;
    ctx.strokeStyle = '#8b5e3c'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 10, sy - 30); ctx.stroke();
    arm(ctx, -26, -2, sx + 10, sy - 30, skin);
    arm(ctx, 26, -2, 24, top - 4, skin);
    // big steam clouds
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (let i = 0; i < 4; i++) { const ph = (t * 0.8 + i * 0.25) % 1; ctx.globalAlpha = 0.8 * (1 - ph); ctx.beginPath(); ctx.arc(px - 14 + i * 9 + Math.sin(ph * 6 + i) * 6, py - 30 - ph * 50, 6 + ph * 9, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
    return;
  }
  // flip: pancake tossed out of the frying pan
  const p = act.p;
  const tossT = (p * 2) % 1; // two tosses per turn
  const toss = Math.sin(tossT * Math.PI);
  const px = -54, py = top - 8 - (tossT < 0.15 ? tossT / 0.15 * 6 : 0);
  // flames under the pan
  for (let i = 0; i < 4; i++) { const fh = 8 + Math.sin(t * 24 + i * 2) * 4; ctx.fillStyle = i % 2 ? '#ffd43b' : '#ff6b00'; ctx.beginPath(); ctx.moveTo(px - 16 + i * 10, top + 2); ctx.quadraticCurveTo(px - 13 + i * 10, top - fh, px - 10 + i * 10, top + 2); ctx.fill(); }
  ctx.save(); ctx.translate(px, py); ctx.rotate(tossT < 0.2 ? -0.25 * Math.sin(tossT / 0.2 * Math.PI) : 0);
  ellipse(ctx, 0, 0, 26, 7, '#343a40', INK, 2.5);
  rr(ctx, 24, -3, 30, 6, 3); blob(ctx, '#212529', INK, 2);
  ctx.restore();
  // pancake flipping through the air
  ctx.save(); ctx.translate(px, py - 6 - toss * 46); ctx.scale(1, Math.cos(tossT * Math.PI * 2));
  ellipse(ctx, 0, 0, 17, 6, '#f0b45b', INK, 2); ctx.fillStyle = '#d9822b'; ctx.beginPath(); ctx.ellipse(0, -1, 9, 2.5, 0, 0, 7); ctx.fill();
  ctx.restore();
  // sizzle sparks and a puff when it lands
  if (tossT > 0.9 || tossT < 0.12) {
    ctx.fillStyle = '#ffe066';
    for (let i = 0; i < 6; i++) { const an = -Math.PI * (0.15 + i * 0.14); const r = 22 + ((t * 60 + i * 7) % 12); ctx.beginPath(); ctx.arc(px + Math.cos(an) * r, py - 4 + Math.sin(an) * r * 0.6, 2, 0, 7); ctx.fill(); }
  }
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  for (let i = 0; i < 3; i++) { const ph = (t * 1.2 + i / 3) % 1; ctx.globalAlpha = 1 - ph; ctx.beginPath(); ctx.arc(px - 10 + i * 10, py - 10 - ph * 30, 4 + ph * 5, 0, 7); ctx.fill(); }
  ctx.globalAlpha = 1;
  arm(ctx, -26, -2, px + 50, py, skin);
  arm(ctx, 26, -2, 26, top - 4, skin);
  // "SIZZLE!" text pops briefly
  if (tossT > 0.9 || tossT < 0.08) {
    ctx.save(); ctx.translate(px - 4, py - 70); ctx.rotate(-0.15);
    ctx.font = '700 15px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.lineJoin = 'round';
    ctx.strokeText('SIZZLE!', 0, 0); ctx.fillStyle = '#ffd43b'; ctx.fillText('SIZZLE!', 0, 0);
    ctx.restore();
  }
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
