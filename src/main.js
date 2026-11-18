// App shell: screens, saving, upgrades shop, paywall and the render loop.
import { generateLevel, restaurantFor, CUSTOMER_TYPES, LEVELS_PER_CAFE, RESTAURANTS } from './levels.js';
import { Game } from './game.js';
import { Store, packForLevel, PRICE_FALLBACK } from './store.js';
import { sfx, unlockAudio, setMusicOn, setSfxOn, playMusic, duckMusic } from './audio.js';
import { drawPoppy, drawChef, drawFood, drawCustomer } from './art.js';
import { COLORS } from './levels.js';

// ---------- save ----------
const SAVE_KEY = 'poppy-cafe-rush-v1';
const save = {
  data: { progress: 1, stars: {}, best: {}, coins: 0, upgrades: {}, purchases: {}, music: true, sound: true },
  load() { try { const d = JSON.parse(localStorage.getItem(SAVE_KEY)); if (d) this.data = { ...this.data, ...d }; } catch {} },
  write() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); } catch {} },
};
save.load();
if (save.data.muted) { save.data.music = false; save.data.sound = false; delete save.data.muted; save.write(); }
setMusicOn(save.data.music !== false);
setSfxOn(save.data.sound !== false);
const musicLabel = () => save.data.music !== false ? '🎵 Music: On' : '🎵 Music: Off';
const soundLabel = () => save.data.sound !== false ? '🔊 Sound: On' : '🔇 Sound: Off';
function toggleMusic() { save.data.music = save.data.music === false; setMusicOn(save.data.music); save.write(); }
function toggleSound() { save.data.sound = save.data.sound === false; setSfxOn(save.data.sound); save.write(); }
const store = new Store(save);
store.init();

const UPGRADES = [
  { id: 'shoes', icon: '🛼', name: 'Turbo Skates', desc: 'Poppy zooms around faster.', cost: [150, 450, 1000] },
  { id: 'oven', icon: '🍳', name: 'Super Stove', desc: 'Chef Bun cooks faster and more at once.', cost: [250, 650, 1300] },
  { id: 'cushions', icon: '🛋️', name: 'Comfy Cushions', desc: 'Seated guests stay patient for longer.', cost: [200, 550, 1100] },
  { id: 'decor', icon: '🎶', name: 'Waiting Lounge', desc: 'Guests in line lose patience slower.', cost: [150, 450, 1000] },
  { id: 'coffee', icon: '☕', name: 'Coffee Cart', desc: 'Tap it to give everyone waiting a free coffee (cheers them up).', cost: [300, 700, 1400] },
];

// ---------- dom helpers ----------
const $ = (s) => document.querySelector(s);
const screens = ['title', 'map', 'intro', 'play', 'results', 'shop'];
function show(name) {
  for (const s of screens) $(`#${s}`).classList.toggle('active', s === name);
  current = name;
  playMusic(name === 'play' ? 'level' : 'menu');
  if (name !== 'play') { game = null; }
}
let current = 'title';
function modal(html) {
  const m = $('#modal');
  m.querySelector('.card').innerHTML = html;
  m.classList.add('open');
  return m;
}
function closeModal() { $('#modal').classList.remove('open'); }
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 1800);
}
function starsFor(score, goal, expert) {
  if (score >= expert) return 3;
  if (score >= (goal + expert) / 2) return 2;
  if (score >= goal) return 1;
  return 0;
}
function starStr(n) { return '★'.repeat(n) + '☆'.repeat(3 - n); }
function coinsUI() { document.querySelectorAll('.coins').forEach(e => e.textContent = `🪙 ${save.data.coins}`); }

document.addEventListener('pointerdown', unlockAudio, { once: false });

// ---------- title ----------
$('#btn-play').onclick = () => { sfx.tap(); openMap(); };
$('#btn-music').onclick = () => { unlockAudio(); toggleMusic(); $('#btn-music').textContent = musicLabel(); };
$('#btn-sound').onclick = () => { unlockAudio(); toggleSound(); $('#btn-sound').textContent = soundLabel(); sfx.tap(); };
$('#btn-music').textContent = musicLabel();
$('#btn-sound').textContent = soundLabel();
playMusic('menu'); // starts on the first tap
if (store.isTestMode) {
  $('#btn-dev').hidden = false;
  $('#btn-dev').onclick = () => {
    save.data.progress = Math.max(save.data.progress, 120); save.write();
    toast('Test mode: levels 1–120 opened (paywall still applies)');
  };
}

// title artwork (animated)
const tctx = $('#title-art').getContext('2d');
function titleArt(now) {
  if (current === 'title') {
    const t = now / 1000;
    tctx.clearRect(0, 0, 600, 600);
    tctx.save(); tctx.translate(300, 300);
    tctx.fillStyle = 'rgba(255,255,255,0.45)'; tctx.beginPath(); tctx.arc(0, 0, 250, 0, 7); tctx.fill();
    tctx.restore();
    tctx.save(); tctx.translate(110, 120); tctx.scale(-1.5, 1.5); drawChef(tctx, 0, 120, t, true); tctx.restore();
    tctx.save(); tctx.translate(470, 470); tctx.scale(1.4, 1.4); drawCustomer(tctx, 0, 0, COLORS[1], 'student', 1, t, 4, {}); tctx.restore();
    tctx.save(); tctx.translate(300, 540 + Math.sin(t * 3) * 6); tctx.scale(2.6, 2.6); drawPoppy(tctx, 0, 0, t, false, 1, [{ kind: 'food', dish: 'burger' }, { kind: 'food', dish: 'cake' }], false); tctx.restore();
  }
  requestAnimationFrame(titleArt);
}
requestAnimationFrame(titleArt);

// ---------- map ----------
let mapPack = 0;
function openMap() {
  show('map'); coinsUI();
  mapPack = Math.floor((Math.min(save.data.progress, 1000) - 1) / 100);
  renderMap(true);
}
function renderMap(scrollToCurrent) {
  const tabs = $('#pack-tabs');
  const maxPack = Math.max(2, Math.floor((save.data.progress - 1) / 100) + 1);
  tabs.innerHTML = '';
  for (let p = 0; p <= Math.min(9, maxPack); p++) {
    const b = document.createElement('button');
    b.className = 'tab' + (p === mapPack ? ' on' : '');
    b.textContent = `${p * 100 + 1}–${p * 100 + 100}`;
    b.onclick = () => { mapPack = p; renderMap(false); };
    tabs.appendChild(b);
  }
  const list = $('#level-list');
  list.innerHTML = '';
  let currentEl = null;
  for (let c = 0; c < 100 / LEVELS_PER_CAFE; c++) {
    const first = mapPack * 100 + c * LEVELS_PER_CAFE + 1;
    const cafe = restaurantFor(first);
    const sec = document.createElement('section');
    sec.className = 'cafe';
    sec.style.setProperty('--wall', cafe.wall);
    sec.style.setProperty('--trim', cafe.wallTrim);
    sec.innerHTML = `<h3>${cafe.name}${mapPack ? ` <small>Tier ${mapPack + 1}</small>` : ''}</h3><div class="grid"></div>`;
    const grid = sec.querySelector('.grid');
    for (let i = 0; i < LEVELS_PER_CAFE; i++) {
      const n = first + i;
      const b = document.createElement('button');
      const paid = store.levelPurchased(n);
      const open = n <= save.data.progress;
      const st = save.data.stars[n] || 0;
      b.className = 'lvl' + (open && paid ? '' : ' locked') + (n === save.data.progress ? ' current' : '');
      b.innerHTML = `<span class="num">${n}</span><span class="st">${!paid ? '£' : open ? starStr(st) : '🔒'}</span>`;
      b.onclick = () => clickLevel(n);
      if (n === save.data.progress) currentEl = b;
      grid.appendChild(b);
    }
    list.appendChild(sec);
  }
  if (scrollToCurrent && currentEl) requestAnimationFrame(() => currentEl.scrollIntoView({ block: 'center' }));
  else list.scrollTop = 0;
}
$('#btn-map-back').onclick = () => show('title');
$('#btn-map-shop').onclick = () => openShop('map');

function clickLevel(n) {
  sfx.tap();
  if (!store.levelPurchased(n)) return paywall(n);
  if (n > save.data.progress) { toast(`Beat level ${save.data.progress} first!`); return; }
  openIntro(n);
}

// ---------- paywall ----------
async function paywall(n, after) {
  const pack = packForLevel(n);
  const price = await store.price(pack.id).catch(() => PRICE_FALLBACK);
  const m = modal(`
    <div class="pw-badge">✨</div>
    <h2>Keep the café open!</h2>
    <p>${pack.from === 21 ? "You've finished the free levels! Unlock" : 'Ready for more? Unlock'} <b>levels ${pack.from}–${pack.to}</b> with a one-off purchase.</p>
    <ul class="perks"><li>${pack.to - pack.from + 1} new levels</li><li>New cafés &amp; customers</li><li>No ads, no timers. Yours to keep.</li></ul>
    <button class="big" id="pw-buy">Unlock for ${price}</button>
    <button class="link" id="pw-restore">Restore purchases</button>
    <button class="link" id="pw-close">Not now</button>
    ${store.isTestMode ? '<p class="note">Test mode: no real payment is taken.</p>' : ''}`);
  m.querySelector('#pw-close').onclick = () => { closeModal(); };
  m.querySelector('#pw-restore').onclick = async () => {
    const owned = await store.restore();
    toast(owned.length ? 'Purchases restored!' : 'No purchases found');
    closeModal(); if (current === 'map') renderMap(false);
  };
  m.querySelector('#pw-buy').onclick = async (e) => {
    e.target.disabled = true; e.target.textContent = 'Processing…';
    const res = await store.buy(pack.id).catch(() => null);
    closeModal();
    if (res && res.ok) {
      sfx.win(); toast(`Levels ${pack.from}–${pack.to} unlocked!`);
      if (after) after(); else if (current === 'map') renderMap(false);
    } else toast('Purchase cancelled');
  };
}

// ---------- intro ----------
let introLevel = 1;
function openIntro(n) {
  introLevel = n;
  const L = generateLevel(n);
  show('intro');
  $('#intro').style.setProperty('--wall', L.cafe.wall);
  $('#intro-cafe').textContent = L.cafe.name;
  $('#intro-level').textContent = `Level ${n}`;
  $('#intro-goal').textContent = L.goal;
  $('#intro-expert').textContent = L.expert;
  $('#intro-guests').textContent = L.groups.length;
  $('#intro-best').textContent = save.data.best[n] ? `Best: ${save.data.best[n]} ${starStr(save.data.stars[n] || 0)}` : '';
  const nt = L.newType ? CUSTOMER_TYPES[L.newType] : null;
  $('#intro-new').innerHTML = nt ? `<b>New customers: ${nt.name}</b><br>${nt.blurb}` : (n === 1 ? '<b>Welcome to Poppy\'s!</b><br>Seat guests, take orders, serve food, collect the bill and clear up. Follow the purple tips.' : '');
  $('#intro-new').hidden = !$('#intro-new').innerHTML;
}
$('#btn-intro-start').onclick = () => { sfx.tap(); startLevel(introLevel); };
$('#btn-intro-back').onclick = () => openMap();

// ---------- play ----------
const canvas = $('#game');
const ctx = canvas.getContext('2d');
let game = null, paused = false, view = { s: 1, ox: 0, oy: 0 };

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth, h = window.innerHeight;
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  const s = Math.min(w / 720, h / 1280);
  view = { s, ox: (w - 720 * s) / 2, oy: (h - 1280 * s) / 2, dpr };
}
window.addEventListener('resize', resize);
resize();

function toLogical(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left - view.ox) / view.s, y: (e.clientY - r.top - view.oy) / view.s };
}
canvas.addEventListener('pointerdown', e => { if (!game || paused) return; e.preventDefault(); canvas.setPointerCapture?.(e.pointerId); const p = toLogical(e); game.pointerDown(p.x, p.y); });
canvas.addEventListener('pointermove', e => { if (!game || paused) return; const p = toLogical(e); game.pointerMove(p.x, p.y); });
canvas.addEventListener('pointerup', e => { if (!game || paused) return; const p = toLogical(e); game.pointerUp(p.x, p.y); });
canvas.addEventListener('pointercancel', e => { if (!game) return; game.drag = null; });

function startLevel(n) {
  const L = generateLevel(n);
  show('play');
  paused = false;
  game = new Game(L, save.data.upgrades, {
    tutorial: n === 1 && !save.data.stars[1],
    onEnd: (r) => setTimeout(() => results(n, r), 500),
    onPause: () => pause(),
  });
}

function pause() {
  paused = true; sfx.tap();
  const m = modal(`<h2>Paused</h2>
    <button class="big" id="p-resume">Resume</button>
    <button class="big alt" id="p-restart">Restart level</button>
    <button class="big alt" id="p-quit">Quit to map</button>
    <div class="row"><button class="link" id="p-music">${musicLabel()}</button><button class="link" id="p-sound">${soundLabel()}</button></div>`);
  duckMusic(true);
  m.querySelector('#p-resume').onclick = () => { closeModal(); paused = false; duckMusic(false); };
  m.querySelector('#p-restart').onclick = () => { closeModal(); duckMusic(false); startLevel(game.level.n); };
  m.querySelector('#p-quit').onclick = () => { closeModal(); paused = false; duckMusic(false); openMap(); };
  m.querySelector('#p-music').onclick = (e) => { toggleMusic(); duckMusic(true); e.target.textContent = musicLabel(); };
  m.querySelector('#p-sound').onclick = (e) => { toggleSound(); e.target.textContent = soundLabel(); };
}
document.addEventListener('visibilitychange', () => { if (document.hidden && game && !paused && !game.ended) pause(); });

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (game) {
    if (!paused) game.update(dt);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#3a2a22'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(view.s * view.dpr, 0, 0, view.s * view.dpr, view.ox * view.dpr, view.oy * view.dpr);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 720, 1280); ctx.clip();
    game.render(ctx, now / 1000);
    ctx.restore();
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ---------- results ----------
let resultLevel = 1;
function results(n, r) {
  resultLevel = n;
  const stars = starsFor(r.score, r.goal, r.expert);
  const passed = stars > 0;
  const earned = passed ? Math.floor(r.score / 10) : Math.floor(r.score / 40);
  save.data.coins += earned;
  if (passed) {
    save.data.progress = Math.max(save.data.progress, n + 1);
    save.data.stars[n] = Math.max(save.data.stars[n] || 0, stars);
  }
  save.data.best[n] = Math.max(save.data.best[n] || 0, r.score);
  save.write();
  show('results'); coinsUI();
  duckMusic(true); setTimeout(() => duckMusic(false), 2200);
  passed ? sfx.win() : sfx.lose();
  for (let i = 0; i < stars; i++) setTimeout(() => sfx.star(i), 700 + i * 220);
  $('#res-title').textContent = stars === 3 ? 'Expert Service!' : passed ? 'Shift complete!' : 'So close!';
  $('#res-stars').innerHTML = [1, 2, 3].map(i => `<span class="${i <= stars ? 'on' : ''}" style="animation-delay:${i * 0.15}s">★</span>`).join('');
  $('#res-score').textContent = r.score;
  $('#res-goal').textContent = `Goal ${r.goal} · Expert ${r.expert}`;
  $('#res-stats').innerHTML = `<div><b>${r.served}</b>happy guests</div><div><b>${r.lost}</b>walked out</div><div><b>x${r.bestChain}</b>best chain</div><div><b>${r.matches}</b>colour matches</div>`;
  $('#res-coins').textContent = `+${earned} coins`;
  $('#btn-res-next').hidden = !passed;
}
$('#btn-res-retry').onclick = () => startLevel(resultLevel);
$('#btn-res-map').onclick = () => openMap();
$('#btn-res-shop').onclick = () => openShop('results');
$('#btn-res-next').onclick = () => {
  const n = resultLevel + 1;
  if (!store.levelPurchased(n)) return paywall(n, () => openIntro(n));
  openIntro(n);
};

// ---------- shop ----------
let shopBack = 'map';
function openShop(from) {
  shopBack = from; show('shop'); coinsUI(); renderShop();
}
function renderShop() {
  const list = $('#shop-list'); list.innerHTML = '';
  for (const u of UPGRADES) {
    const lvl = save.data.upgrades[u.id] || 0;
    const maxed = lvl >= u.cost.length;
    const cost = maxed ? 0 : u.cost[lvl];
    const row = document.createElement('div');
    row.className = 'up';
    row.innerHTML = `<div class="ic">${u.icon}</div><div class="tx"><b>${u.name}</b><span>${u.desc}</span><i>${'●'.repeat(lvl)}${'○'.repeat(u.cost.length - lvl)}</i></div>
      <button ${maxed || save.data.coins < cost ? 'disabled' : ''}>${maxed ? 'MAX' : `🪙 ${cost}`}</button>`;
    row.querySelector('button').onclick = () => {
      if (maxed || save.data.coins < cost) return;
      save.data.coins -= cost; save.data.upgrades[u.id] = lvl + 1; save.write();
      sfx.cash(); coinsUI(); renderShop();
    };
    list.appendChild(row);
  }
}
$('#btn-shop-back').onclick = () => shopBack === 'results' ? show('results') : openMap();

// expose for debugging / automated tests
window.__cafe = { save, store, startLevel: (n) => startLevel(n), get game() { return game; }, generateLevel, RESTAURANTS };
