// Core gameplay: one level of serving customers.
import * as A from './art.js';
import { COLORS, CUSTOMER_TYPES } from './levels.js';
import { sfx } from './audio.js';

const W = 720, H = 1280;
const COLOR = Object.fromEntries(COLORS.map(c => [c.id, c]));
const QUEUE_SLOTS = [{ x: 95, y: 1222 }, { x: 225, y: 1222 }, { x: 355, y: 1222 }, { x: 485, y: 1222 }];
const DOOR = { x: -60, y: 1222 };
const HOME = { x: 360, y: 350 };
const TICKET = { x: 80, y: 262 };
const SLOT_X = [190, 280, 370, 460, 550];
const SLOT_Y = 238;
const BIN = { x: 655, y: 372 };
const COFFEE = { x: 632, y: 1150 };
const CHEF = { x: 640, y: 214 };
const MAX_ACTIONS = 8;

let uid = 1;

export class Game {
  constructor(level, upgrades, cb) {
    this.level = level;
    this.cafe = level.cafe;
    this.up = upgrades;
    this.cb = cb; // { onEnd(result), onPause() }
    this.time = 0;
    this.score = 0;
    this.lost = 0;
    this.served = 0;
    this.chain = 0;
    this.lastKind = null;
    this.bestChain = 0;
    this.matches = 0;
    this.floaters = [];
    this.particles = [];
    this.combos = [];      // big animated "2x COMBO!" popups
    this.coinFx = [];      // coins flying to the score bar
    this.shownScore = 0;   // score counter rolls up smoothly
    this.comboPulse = 0; this.comboBreak = 0; this.barPulse = 0; this.shake = 0;
    this.bannerT = 0;
    this.tables = level.tables.map((t, i) => ({ ...t, no: i + 1, colorObj: COLOR[t.color], group: null, dirty: false, chairs: A.chairPositions(t), pulse: 0 }));
    this.pending = level.groups.map(g => ({ ...g }));
    this.groups = [];
    this.queue = [];
    this.kitchen = [];
    this.slots = new Array(SLOT_X.length).fill(null);
    this.notepad = [];
    this.poppy = { x: HOME.x, y: HOME.y, facing: 1, moving: false, hands: [null, null], pause: 0, busyT: 0 };
    this.actions = [];
    this.cur = null;
    this.selected = null;
    this.drag = null;
    this.ended = false;
    this.endTimer = 0;
    this.coffeeCd = 0;
    this.speed = 470 * (1 + 0.15 * (upgrades.shoes || 0));
    this.cookMult = 1 - 0.15 * (upgrades.oven || 0);
    this.parallel = 2 + (upgrades.oven || 0);
    this.queueDecayMult = 1 - 0.15 * (upgrades.decor || 0);
    this.tableDecayMult = 1 - 0.15 * (upgrades.cushions || 0);
    this.coffeeLvl = upgrades.coffee || 0;
    this.hintsOn = level.n <= 2;
    // Level 1 (first time): a guided, step-by-step tutorial with one practice customer.
    this.tut = cb.tutorial ? { step: 0, t: 0 } : null;
    this.tutG = null;
    if (this.tut && this.pending.length) Object.assign(this.pending[0], { size: 2, type: 'regular', color: this.tables[0].color });
    this.bg = document.createElement('canvas');
    this.bg.width = W; this.bg.height = H;
    A.drawBackground(this.bg.getContext('2d'), this.cafe);
  }

  // ---------------- helpers ----------------
  // hearts lost per second (5 hearts = full). Tuned so a good player can keep everyone.
  decay(g) { return 0.075 / (CUSTOMER_TYPES[g.type].patience * this.level.patience); }

  float(x, y, text, color = '#fff', size = 30) {
    this.floaters.push({ x, y, text, color, size, life: 1.1 });
  }

  burst(x, y, color, n = 12) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = 120 + Math.random() * 220;
      this.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, life: 0.7 + Math.random() * 0.3, color, r: 4 + Math.random() * 4 });
    }
  }

  addScore(pts, x, y, kind, label) {
    let bonus = 0;
    if (kind) {
      if (kind === this.lastKind) this.chain++;
      else { if (this.chain > 1) this.comboBreak = 1; this.chain = 1; }
      this.lastKind = kind;
      this.bestChain = Math.max(this.bestChain, this.chain);
      this.comboPulse = 1;
      if (this.chain > 1) {
        bonus = 10 * (this.chain - 1);
        this.combos.push({ x: Math.max(110, Math.min(610, x)), y: Math.max(200, y - 70), n: this.chain, life: 1.4, bonus });
        if (this.chain >= 4) this.shake = 0.35;
        sfx.chain(this.chain);
      }
    }
    this.score += pts + bonus;
    this.float(x, y, label || `+${pts + bonus}`, '#ffffff');
    this.cb.onScore && this.cb.onScore(this.score);
  }

  // ---------------- spawning ----------------
  spawn(def) {
    const members = [];
    for (let i = 0; i < def.size; i++) members.push({ x: DOOR.x - i * 26, y: DOOR.y, idx: uid * 3 + i * 7 });
    const g = { id: uid++, ...def, members, hearts: 5, state: 'queue', table: null, timer: 0, served: false, angry: false, hop: 0 };
    this.groups.push(g);
    this.queue.push(g);
    if (this.tut && !this.tutG) this.tutG = g;
    sfx.door();
  }

  // ---------------- input ----------------
  hitGroup(x, y) {
    for (let i = 0; i < this.queue.length; i++) {
      const s = QUEUE_SLOTS[i];
      if (Math.abs(x - s.x) < 64 && y > s.y - 140 && y < s.y + 30) return this.queue[i];
    }
    return null;
  }
  hitTable(x, y) {
    let best = null, bd = 1e9;
    for (const t of this.tables) {
      const dx = x - t.x, dy = y - (t.y - 10);
      if (Math.abs(dx) < 118 && dy > -110 && dy < 90) { const d = dx * dx + dy * dy; if (d < bd) { bd = d; best = t; } }
    }
    return best;
  }
  hitTarget(x, y) {
    if (Math.hypot(x - 670, y - 48) < 40) return { kind: 'pause' };
    const t = this.hitTable(x, y);
    if (t) return { kind: 'table', ref: t };
    if (Math.hypot(x - TICKET.x, y - (TICKET.y - 20)) < 62) return { kind: 'ticket' };
    if (y > 170 && y < 320) for (let i = 0; i < SLOT_X.length; i++) if (Math.abs(x - SLOT_X[i]) < 45) return { kind: 'slot', ref: i };
    if (Math.hypot(x - BIN.x, y - BIN.y) < 60) return { kind: 'bin' };
    if (Math.hypot(x - COFFEE.x, y - (COFFEE.y - 10)) < 66) return { kind: 'coffee' };
    return null;
  }

  canSeat(g, t) { return t && !t.group && !t.dirty && t.seats >= g.size; }

  pointerDown(x, y) {
    if (this.ended) return;
    if (this.tut && this.tutSteps()[this.tut.step].card) {
      if (Math.hypot(x - 670, y - 48) < 40) { this.cb.onPause(); return; }
      if (this.tut.t > 0.4) this.tutNext();
      return;
    }
    const g = this.hitGroup(x, y);
    if (g) { this.selected = g; this.drag = { g, x, y, sx: x, sy: y, moved: false }; sfx.tap(); return; }
    const target = this.hitTarget(x, y);
    if (!target) { this.selected = null; return; }
    if (target.kind === 'pause') { this.cb.onPause(); return; }
    if (this.selected && target.kind === 'table') {
      if (this.canSeat(this.selected, target.ref)) { this.seat(this.selected, target.ref); this.selected = null; return; }
      if (!target.ref.group && !target.ref.dirty) { sfx.nope(); this.float(target.ref.x, target.ref.y - 40, 'Too small!', '#ffe3e3', 24); return; }
      this.selected = null;
    }
    this.enqueue(target);
  }
  pointerMove(x, y) {
    if (!this.drag) return;
    this.drag.x = x; this.drag.y = y;
    if (Math.hypot(x - this.drag.sx, y - this.drag.sy) > 14) this.drag.moved = true;
  }
  pointerUp(x, y) {
    if (!this.drag) return;
    const d = this.drag; this.drag = null;
    if (!d.moved) return; // tap = keep selected, then tap a table
    const t = this.hitTable(x, y);
    if (this.canSeat(d.g, t)) this.seat(d.g, t);
    else if (t) { sfx.nope(); }
    this.selected = null;
  }

  enqueue(target) {
    const all = this.cur ? [this.cur, ...this.actions] : this.actions;
    const last = all[all.length - 1];
    if (last && last.kind === target.kind && last.ref === target.ref) return;
    if (this.actions.length >= MAX_ACTIONS) { sfx.nope(); return; }
    this.actions.push(target);
    sfx.tap();
  }

  // ---------------- actions ----------------
  seat(g, t) {
    this.queue.splice(this.queue.indexOf(g), 1);
    g.table = t; t.group = g;
    g.state = 'menu';
    g.timer = (2.6 + Math.random() * 1.6) * CUSTOMER_TYPES[g.type].menu;
    g.hearts = Math.min(5, g.hearts + 0.5);
    const match = g.color === t.color;
    let pts = 10 * g.size;
    if (match) { pts += 15 * g.size; this.matches++; }
    this.addScore(pts, t.x, t.y - 60, 'seat', match ? `Colour match! +${pts}` : null);
    if (match) { sfx.match(); this.burst(t.x, t.y - 30, t.colorObj.fill, 16); } else sfx.seat();
    t.pulse = 1;
  }

  standPoint(a) {
    switch (a.kind) {
      case 'table': return { x: a.ref.x + (a.ref.x < 360 ? 122 : -122), y: a.ref.y + 40 };
      case 'ticket': return { x: TICKET.x + 34, y: 344 };
      case 'slot': return { x: SLOT_X[a.ref], y: 344 };
      case 'bin': return { x: BIN.x - 64, y: BIN.y + 20 };
      case 'coffee': return { x: COFFEE.x - 82, y: COFFEE.y + 10 };
    }
    return HOME;
  }

  freeHand() { return this.poppy.hands[0] === null ? 0 : this.poppy.hands[1] === null ? 1 : -1; }

  perform(a) {
    const p = this.poppy;
    if (a.kind === 'table') {
      const t = a.ref, g = t.group;
      if (g && g.state === 'check') {
        const type = CUSTOMER_TYPES[g.type];
        const bill = Math.round((14 + 6 * g.size) * type.tip);
        const tip = Math.round(g.hearts * 3 * g.size * type.tip);
        this.addScore(bill + tip, t.x, t.y - 70, 'check', `+${bill}  tip +${tip}`);
        sfx.cash(tip); this.burst(t.x, t.y - 40, '#ffd43b', tip >= 20 ? 26 : 14);
        g.joy = 1;
        const nCoins = Math.min(10, 4 + Math.floor(tip / 8));
        for (let i = 0; i < nCoins; i++) this.coinFx.push({ x0: t.x + (Math.random() - 0.5) * 50, y0: t.y - 50, t: -i * 0.06, dur: 0.65 + Math.random() * 0.15 });
        this.served++;
        this.leave(g, false);
        t.dirty = true;
        return true;
      }
      if (g && g.state === 'order') {
        g.state = 'waitfood'; g.hearts = Math.min(5, g.hearts + 1);
        this.notepad.push(g);
        this.addScore(10, t.x, t.y - 70, 'order');
        sfx.order();
        return true;
      }
      if (g && g.state === 'waitfood') {
        const hi = p.hands.findIndex(h => h && h.kind === 'food' && h.g === g);
        if (hi >= 0) {
          p.hands[hi] = null;
          g.state = 'eating'; g.served = true; g.joy = 1;
          this.burst(t.x, t.y - 70, '#ff6b9a', 8);
          g.timer = (4.2 + Math.random() * 2.2) * CUSTOMER_TYPES[g.type].eat;
          g.hearts = Math.min(5, g.hearts + 1);
          this.addScore(15, t.x, t.y - 70, 'serve');
          sfx.serve();
          return true;
        }
      }
      if (t.dirty) {
        const h = this.freeHand();
        if (h >= 0) {
          p.hands[h] = { kind: 'dishes' };
          t.dirty = false;
          this.burst(t.x, t.y - 10, '#ffffff', 12);
          this.addScore(10, t.x, t.y - 70, 'clear');
          sfx.clear();
          return true;
        }
        this.float(p.x, p.y - 150, 'Hands full!', '#ffe3e3', 24);
      }
      return false;
    }
    if (a.kind === 'ticket') {
      if (!this.notepad.length) return false;
      for (const g of this.notepad) this.kitchen.push({ g, t: 0, dur: (3.2 + Math.random() * 1.6) * this.cookMult, dish: A.dishFor(g.id + this.level.cafeIndex) });
      this.addScore(5 * this.notepad.length, TICKET.x + 30, TICKET.y - 60, 'ticket');
      this.notepad = [];
      sfx.ticket();
      return true;
    }
    if (a.kind === 'slot') {
      const food = this.slots[a.ref];
      if (!food) return false;
      const h = this.freeHand();
      if (h < 0) { this.float(p.x, p.y - 150, 'Hands full!', '#ffe3e3', 24); return false; }
      p.hands[h] = { kind: 'food', g: food.g, dish: food.dish, tableNo: food.g.table ? food.g.table.no : 0, tableColor: food.g.table ? food.g.table.colorObj.fill : null };
      this.slots[a.ref] = null;
      sfx.pickup();
      return true;
    }
    if (a.kind === 'bin') {
      let n = 0;
      for (let i = 0; i < 2; i++) if (p.hands[i]) { if (p.hands[i].kind === 'dishes') n++; p.hands[i] = null; }
      if (n) { this.addScore(5 * n, BIN.x, BIN.y - 50, 'bin'); sfx.bin(); }
      return n > 0;
    }
    if (a.kind === 'coffee') {
      if (!this.coffeeLvl) { this.float(COFFEE.x - 40, COFFEE.y - 90, 'Buy in shop', '#fff', 22); return false; }
      if (this.coffeeCd > 0) { this.float(COFFEE.x - 40, COFFEE.y - 90, 'Brewing…', '#fff', 22); return false; }
      for (const g of this.queue) g.hearts = Math.min(5, g.hearts + 1.5);
      for (const g of this.groups) if (g.table && ['order', 'waitfood', 'check'].includes(g.state)) g.hearts = Math.min(5, g.hearts + 0.5);
      this.coffeeCd = 26 - 5 * this.coffeeLvl;
      this.addScore(5, COFFEE.x, COFFEE.y - 90, 'coffee', 'Free coffee!');
      sfx.coffee();
      return true;
    }
    return false;
  }

  leave(g, angry) {
    g.state = 'leaving'; g.angry = angry;
    const qi = this.queue.indexOf(g);
    if (qi >= 0) this.queue.splice(qi, 1);
    if (g.table) { if (angry && g.served) g.table.dirty = true; g.table.group = null; }
    if (!angry) setTimeout(() => sfx.happy(), 250);
    if (angry) {
      this.lost++;
      this.chain = 0; this.lastKind = null;
      this.notepad = this.notepad.filter(x => x !== g);
      this.kitchen = this.kitchen.filter(k => k.g !== g);
      this.slots = this.slots.map(s => s && s.g === g ? null : s);
      this.poppy.hands = this.poppy.hands.map(h => h && h.g === g ? null : h);
      const m = g.members[0];
      this.float(m.x, m.y - 120, 'Hmph!', '#ff8787', 30);
      sfx.angry();
      if (navigator.vibrate) try { navigator.vibrate(60); } catch {}
    }
    if (this.selected === g) this.selected = null;
  }

  // ---------------- update ----------------
  update(dt) {
    if (this.ended) return;
    if (this.tut) {
      this.tut.t += dt;
      const st = this.tutSteps()[this.tut.step];
      if (st.card) { this.fx(dt); return; }
      if (st.done && st.done()) this.tutNext();
    }
    this.time += dt;
    this.coffeeCd = Math.max(0, this.coffeeCd - dt);

    // arrivals
    if (this.tut) { if (!this.tutG && this.pending.length) this.spawn(this.pending.shift()); }
    else while (this.pending.length && this.pending[0].at <= this.time && this.queue.length < QUEUE_SLOTS.length) this.spawn(this.pending.shift());
    if (this.pending.length && this.queue.length >= QUEUE_SLOTS.length) this.pending[0].at = Math.max(this.pending[0].at, this.time + 1);

    // groups
    for (const g of this.groups) {
      if (g.state === 'done') continue;
      const d = this.tut ? 0 : this.decay(g);
      if (g.hearts < 1.5 && !g.warned && g.state !== 'leaving') { g.warned = true; sfx.warn(); }
      switch (g.state) {
        case 'queue': g.hearts -= d * 0.6 * this.queueDecayMult * dt; break;
        case 'menu': g.timer -= dt; if (g.timer <= 0) { g.state = 'order'; } break;
        case 'order': g.hearts -= d * this.tableDecayMult * dt; break;
        case 'waitfood': g.hearts -= d * 0.75 * this.tableDecayMult * dt; break;
        case 'eating': g.timer -= dt; if (g.timer <= 0) g.state = 'check'; break;
        case 'check': g.hearts -= d * 1.1 * this.tableDecayMult * dt; break;
      }
      if (g.hearts <= 0 && g.state !== 'leaving') { g.hearts = 0; this.leave(g, true); }
      this.moveMembers(g, dt);
    }
    this.groups = this.groups.filter(g => g.state !== 'done');

    // kitchen
    let cooking = 0;
    for (const k of this.kitchen) {
      if (cooking >= this.parallel) break;
      cooking++;
      k.t += dt;
    }
    for (let i = 0; i < this.kitchen.length; i++) {
      const k = this.kitchen[i];
      if (k.t >= k.dur) {
        const s = this.slots.indexOf(null);
        if (s < 0) break;
        this.slots[s] = { g: k.g, dish: k.dish, pop: 1 };
        this.kitchen.splice(i, 1); i--;
        sfx.ding();
      }
    }
    this.chefCooking = cooking > 0;

    // Poppy
    const p = this.poppy;
    if (p.pause > 0) p.pause -= dt;
    else {
      if (!this.cur && this.actions.length) this.cur = this.actions.shift();
      if (this.cur) {
        const sp = this.standPoint(this.cur);
        const dx = sp.x - p.x, dy = sp.y - p.y, dist = Math.hypot(dx, dy);
        const step = this.speed * dt;
        if (dist <= step) {
          p.x = sp.x; p.y = sp.y; p.moving = false;
          const ok = this.perform(this.cur);
          if (!ok) sfx.nope();
          this.cur = null; p.pause = 0.12; p.busyT = 0.25; p.squash = 1;
        } else {
          p.x += dx / dist * step; p.y += dy / dist * step; p.moving = true;
          if (Math.abs(dx) > 4) p.facing = dx > 0 ? 1 : -1;
        }
      } else p.moving = false;
    }
    p.busyT = Math.max(0, p.busyT - dt);
    p.squash = Math.max(0, (p.squash || 0) - dt * 5);
    for (const g of this.groups) if (g.joy) g.joy = Math.max(0, g.joy - dt * 2.2);

    this.fx(dt);

    // end of level
    if (!this.pending.length && !this.groups.length) {
      this.endTimer += dt;
      const dirty = this.tables.some(t => t.dirty);
      if ((!dirty && this.endTimer > 0.8) || this.endTimer > 7) this.finish();
    }
  }

  fx(dt) {
    this.bannerT += dt;
    this.shownScore += (this.score - this.shownScore) * Math.min(1, dt * 8);
    if (Math.abs(this.score - this.shownScore) < 0.5) this.shownScore = this.score;
    this.comboPulse = Math.max(0, this.comboPulse - dt * 3);
    this.comboBreak = Math.max(0, this.comboBreak - dt * 2);
    this.barPulse = Math.max(0, this.barPulse - dt * 4);
    this.shake = Math.max(0, this.shake - dt);
    for (const c of this.combos) c.life -= dt;
    this.combos = this.combos.filter(c => c.life > 0);
    for (const c of this.coinFx) c.t += dt;
    const before = this.coinFx.length;
    this.coinFx = this.coinFx.filter(c => c.t < c.dur);
    if (this.coinFx.length < before) this.barPulse = 1;
    for (const f of this.floaters) { f.life -= dt; f.y -= 50 * dt; }
    this.floaters = this.floaters.filter(f => f.life > 0);
    for (const q of this.particles) { q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 600 * dt; }
    this.particles = this.particles.filter(q => q.life > 0);
    for (const t of this.tables) t.pulse = Math.max(0, t.pulse - dt * 3);
    for (const s of this.slots) if (s && s.pop > 0) s.pop = Math.max(0, s.pop - dt * 4);
  }

  moveMembers(g, dt) {
    let arrived = 0;
    g.members.forEach((m, i) => {
      let tx, ty, sp = 380;
      if (g.state === 'leaving') { tx = DOOR.x - 40; ty = DOOR.y; sp = 420; }
      else if (g.table) { const c = g.table.chairs[i]; tx = c.x; ty = c.y; sp = 1500; }
      else {
        const qi = this.queue.indexOf(g);
        const s = QUEUE_SLOTS[Math.max(0, qi)];
        tx = s.x + (i - (g.size - 1) / 2) * 26; ty = s.y + (i % 2) * 8;
      }
      const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy), st = sp * dt;
      if (d <= st) { m.x = tx; m.y = ty; arrived++; m.walking = false; }
      else { m.x += dx / d * st; m.y += dy / d * st; m.walking = true; }
    });
    if (g.state === 'leaving' && arrived === g.members.length) g.state = 'done';
  }

  finish() {
    this.ended = true;
    this.cb.onEnd({ score: this.score, goal: this.level.goal, expert: this.level.expert, lost: this.lost, served: this.served, bestChain: this.bestChain, matches: this.matches });
  }

  // ---------------- guided tutorial (level 1) ----------------
  tutSteps() {
    if (this._tutSteps) return this._tutSteps;
    const g = () => this.tutG;
    const t = () => this.tables[0];
    const st = (...a) => g() && a.includes(g().state);
    const tableTarget = () => (g() && g().table) || t();
    this._tutSteps = [
      { card: true, title: "Welcome to Poppy's Café!", text: "You're Poppy, and today is opening day. Let's learn how to look after your customers, one step at a time." },
      { text: 'A customer has arrived! Drag them to a table. (You can also tap them, then tap a table.)', drag: true, done: () => g() && g().table },
      { text: 'Nice! Tip: seating customers on chairs that match their shirt colour earns bonus points. Now they are reading the menu…', done: () => st('order', 'waitfood', 'eating', 'check') },
      { text: 'They are ready to order! Tap their table to take the order.', target: () => tableTarget(), done: () => this.notepad.length || st('eating', 'check') || this.kitchen.length },
      { text: 'Tap the ticket wheel to send the order to Chef Leo.', target: () => ({ x: TICKET.x, y: TICKET.y - 20 }), done: () => this.kitchen.length || this.slots.some(Boolean) },
      { text: 'Chef Leo is cooking. Food will appear on the counter when it is ready…', done: () => this.slots.some(Boolean) || this.poppy.hands.some(h => h && h.kind === 'food') },
      { text: 'Food is up! Tap the plate on the counter to pick it up. The badge shows which table it is for.', target: () => { const i = this.slots.findIndex(Boolean); return i >= 0 ? { x: SLOT_X[i], y: SLOT_Y } : null; }, done: () => this.poppy.hands.some(h => h && h.kind === 'food') || st('eating', 'check') },
      { text: 'Now tap the table to serve the food.', target: () => tableTarget(), done: () => st('eating', 'check') },
      { text: 'Yum! Wait while they eat…', done: () => st('check') },
      { text: 'They want the bill (£). Tap the table to collect the money. Happy customers leave bigger tips!', target: () => tableTarget(), done: () => !g() || st('leaving', 'done') },
      { text: 'They left some dirty dishes. Tap the table to clear it.', target: () => this.tables.find(tb => tb.dirty) || t(), done: () => !this.tables.some(tb => tb.dirty) },
      { text: 'Drop the dishes in the blue tub so your hands are free.', target: () => ({ x: BIN.x, y: BIN.y }), done: () => !this.poppy.hands.some(h => h && h.kind === 'dishes') },
      { card: true, title: 'Watch the hearts!', text: 'Customers lose hearts while they wait. If the hearts run out, they storm off and you lose their money. Serve quickly to keep them smiling!' },
      { card: true, title: 'Pro tips', text: 'Tap several jobs in a row and Poppy will do them in order (look for the purple numbers).\n\nDoing the same job back to back, like taking 3 orders, gives a CHAIN bonus.\n\nReach the GOAL score to pass, and EXPERT for 3 stars.' },
      { card: true, title: "You're ready!", text: "More customers are on the way. Reach the goal score to finish the level. Good luck!\n\nTap to open the café." },
    ];
    return this._tutSteps;
  }

  tutNext() {
    this.tut.step++; this.tut.t = 0;
    sfx.tap();
    if (this.tut.step >= this.tutSteps().length) {
      // tutorial finished: let the rest of the customers in
      this.tut = null;
      if (this.pending.length) {
        const off = this.pending[0].at, base = this.time + 1.5;
        for (const p of this.pending) p.at = base + (p.at - off);
      }
    }
  }

  wrap(ctx, text, maxW) {
    const lines = [];
    for (const para of text.split('\n')) {
      if (!para) { lines.push(''); continue; }
      let line = '';
      for (const w of para.split(' ')) {
        const test = line ? line + ' ' + w : w;
        if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
      }
      lines.push(line);
    }
    return lines;
  }

  drawTutorial(ctx, t) {
    const st = this.tutSteps()[this.tut.step];
    ctx.textAlign = 'center';
    if (st.card) {
      ctx.fillStyle = 'rgba(30,20,15,0.55)'; ctx.fillRect(0, 96, W, H - 96);
      ctx.font = '500 26px Fredoka, sans-serif';
      const lines = this.wrap(ctx, st.text, 520);
      const h = 230 + lines.length * 36;
      const y0 = 640 - h / 2, s = Math.min(1, this.tut.t * 6);
      ctx.save(); ctx.translate(W / 2, 640); ctx.scale(0.8 + 0.2 * s, 0.8 + 0.2 * s); ctx.translate(-W / 2, -640);
      A.rr(ctx, 60, y0, 600, h, 34); ctx.fillStyle = '#fff6e5'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = A.INK; ctx.stroke();
      A.drawPoppy(ctx, 140, y0 + 150, t, false, 1, [null, null], false);
      ctx.fillStyle = A.INK; ctx.font = '700 38px Fredoka, sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(st.title, 200, y0 + 80);
      ctx.font = '500 26px Fredoka, sans-serif'; ctx.textAlign = 'center';
      lines.forEach((l, i) => ctx.fillText(l, W / 2, y0 + 190 + i * 36));
      const by = y0 + h - 30 + Math.sin(t * 5) * 3;
      ctx.fillStyle = '#7048e8'; ctx.font = '700 24px Fredoka, sans-serif';
      ctx.fillText(`Tap to continue  ▶   (${this.tut.step + 1}/${this.tutSteps().length})`, W / 2, by);
      ctx.restore();
      return;
    }
    // instruction banner
    ctx.font = '600 24px Fredoka, sans-serif';
    const lines = this.wrap(ctx, st.text, 600);
    const h = 30 + lines.length * 30, y0 = 1060 - h;
    A.rr(ctx, 30, y0, 660, h, 22); ctx.fillStyle = 'rgba(112,72,232,0.96)'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#fff'; ctx.stroke();
    ctx.fillStyle = '#fff';
    lines.forEach((l, i) => ctx.fillText(l, W / 2, y0 + 36 + i * 30));
    // pointer
    if (st.drag && this.queue.length && !this.queue[0].members[0].walking) {
      const from = { x: QUEUE_SLOTS[0].x, y: QUEUE_SLOTS[0].y - 60 }, to = { x: this.tables[0].x, y: this.tables[0].y };
      const k = (t * 0.6) % 1, e = k < 0.75 ? k / 0.75 : 1;
      const ease = e * e * (3 - 2 * e);
      this.drawHand(ctx, from.x + (to.x - from.x) * ease, from.y + (to.y - from.y) * ease, k > 0.9 ? 0 : 1);
    } else if (st.target) {
      const p = st.target();
      if (p) {
        const b = Math.abs(Math.sin(t * 6)) * 14;
        ctx.strokeStyle = '#ffd43b'; ctx.lineWidth = 6; ctx.setLineDash([12, 10]); ctx.lineDashOffset = -t * 40;
        ctx.beginPath(); ctx.arc(p.x, p.y, 62 + Math.sin(t * 6) * 4, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        this.drawHand(ctx, p.x + 30, p.y + 20 + b, 1);
      }
    }
  }

  drawHand(ctx, x, y, alpha) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(-0.4);
    A.rr(ctx, -11, -6, 22, 44, 11); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = A.INK; ctx.stroke();
    A.rr(ctx, -20, 22, 46, 42, 16); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  hint() {
    if (!this.hintsOn || this.tut) return null;
    const p = this.poppy;
    if (this.slots.some(Boolean) && this.freeHand() >= 0) return 'Food is up! Tap the plate on the counter to pick it up.';
    if (p.hands.some(h => h && h.kind === 'food')) return 'Tap the matching table number to serve the food.';
    if (this.notepad.length) return 'Tap the ticket wheel so Chef Leo can start cooking.';
    if (this.groups.some(g => g.state === 'check')) return 'Customers want the bill (£). Tap their table to collect.';
    if (this.groups.some(g => g.state === 'order')) return 'Tap a table showing "!" to take their order.';
    if (p.hands.some(h => h && h.kind === 'dishes')) return 'Drop dirty dishes in the blue tub.';
    if (this.tables.some(t => t.dirty)) return 'Tap a messy table to clear it.';
    if (this.queue.length) return 'Drag waiting customers to a table. Match chair colours for bonus points!';
    return null;
  }

  // ---------------- render ----------------
  render(ctx, t) {
    ctx.save();
    if (this.shake > 0) ctx.translate((Math.random() - 0.5) * 14 * this.shake, (Math.random() - 0.5) * 14 * this.shake);
    ctx.drawImage(this.bg, 0, 0);
    A.drawWindowSky(ctx, t, this.cafe);
    A.drawStringLights(ctx, t, this.cafe);
    const seatable = this.drag?.moved || this.selected ? (this.drag?.g || this.selected) : null;

    // kitchen
    A.drawChef(ctx, CHEF.x, CHEF.y, t, this.chefCooking);
    A.rr(ctx, 30, 228, 660, 22, 8); ctx.fillStyle = this.cafe.counterTop; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = A.INK; ctx.stroke();
    A.drawTicketWheel(ctx, TICKET.x, TICKET.y, this.notepad.length, t, this.notepad.length > 0, this.notepad.filter(g => g.table).map(g => ({ no: g.table.no, color: g.table.colorObj.fill })));
    for (let i = 0; i < SLOT_X.length; i++) {
      const s = this.slots[i];
      if (s) A.drawFood(ctx, SLOT_X[i], SLOT_Y - (s.pop ? s.pop * 20 : 0) + Math.sin(t * 4 + i) * 1.5, s.dish, 1, s.g.table ? s.g.table.no : 0, t + i * 0.3, s.g.table ? s.g.table.colorObj.fill : null);
    }
    // cooking progress pips
    let shown = 0;
    for (const k of this.kitchen) {
      if (shown >= this.parallel) break;
      const x = 560 - shown * 34, y = 140;
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(x, y, 14, 0, 7); ctx.fill();
      ctx.strokeStyle = '#f76707'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, y, 11, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, k.t / k.dur)); ctx.stroke();
      if (k.g.table) A.numberBadge(ctx, x, y, k.g.table.no, 0.62, k.g.table.colorObj.fill);
      shown++;
    }
    A.drawBin(ctx, BIN.x, BIN.y);

    // y-sorted world
    const items = [];
    for (const tb of this.tables) {
      for (let i = 0; i < tb.chairs.length; i++) {
        const c = tb.chairs[i];
        items.push({ y: c.y - 1, f: () => A.drawChair(ctx, c.x, c.y, tb.colorObj) });
      }
      items.push({ y: tb.y - 30, f: () => this.drawTable(ctx, tb, t, seatable) });
    }
    for (const g of this.groups) {
      g.members.forEach((m, i) => {
        if (this.drag?.moved && this.drag.g === g) return;
        const seated = g.table && g.state !== 'leaving' && !m.walking;
        items.push({
          y: m.y + (seated ? 2 : 0),
          f: () => A.drawCustomer(ctx, m.x, m.y + (seated ? -8 : 0), COLOR[g.color], g.type, g.hearts / 5, t, m.idx, {
            seated, scale: seated ? 0.86 : 0.9, hop: m.walking, angry: g.angry, reading: g.state === 'menu',
            joy: g.joy || 0, eating: g.state === 'eating' && seated, selected: this.selected === g && !seated,
          }),
        });
      });
    }
    const p = this.poppy;
    items.push({ y: p.y, f: () => A.drawPoppy(ctx, p.x, p.y, t, p.moving, p.facing, p.hands, p.busyT > 0, p.squash || 0) });
    items.push({ y: COFFEE.y + 30, f: () => A.drawCoffee(ctx, COFFEE.x, COFFEE.y, this.coffeeCd <= 0, t, this.coffeeLvl) });
    items.sort((a, b) => a.y - b.y);
    for (const it of items) it.f();

    // overlays: bubbles & hearts
    for (const tb of this.tables) {
      const g = tb.group;
      if (!g || g.state === 'leaving') continue;
      const top = tb.y - (tb.seats === 4 ? 130 : 118);
      const icon = { menu: 'menu', order: 'order', waitfood: 'food', check: 'check' }[g.state];
      const carry = g.state === 'waitfood' && this.poppy.hands.some(h => h && h.kind === 'food' && h.g === g);
      if (icon) A.drawBubble(ctx, tb.x, top - (carry ? Math.abs(Math.sin(t * 7)) * 12 : 0), icon, t, g.hearts < 1.8 || carry, { dish: A.dishFor(g.id + this.level.cafeIndex) });
      if (g.state === 'eating') this.drawProgress(ctx, tb.x, top + 10, 1 - g.timer / ((4.2 + 2.2) * CUSTOMER_TYPES[g.type].eat));
      if (g.state !== 'eating' && g.state !== 'menu') A.drawHearts(ctx, tb.x, tb.y + (tb.seats === 4 ? 78 : 60), g.hearts);
    }
    this.queue.forEach((g, i) => {
      if (this.drag?.moved && this.drag.g === g) return;
      const s = QUEUE_SLOTS[i];
      if (g.members[0].walking) return;
      A.drawHearts(ctx, s.x, s.y - 116, g.hearts);
      if (this.selected === g) {
        ctx.strokeStyle = '#7048e8'; ctx.lineWidth = 5; ctx.setLineDash([10, 8]); ctx.lineDashOffset = -t * 40;
        A.rr(ctx, s.x - 62, s.y - 132, 124, 150, 20); ctx.stroke(); ctx.setLineDash([]);
      }
    });

    // dragged group follows the finger
    if (this.drag?.moved) {
      const g = this.drag.g;
      g.members.forEach((m, i) => A.drawCustomer(ctx, this.drag.x + (i - (g.size - 1) / 2) * 26, this.drag.y + 40 + (i % 2) * 8, COLOR[g.color], g.type, g.hearts / 5, t, m.idx, { scale: 0.9, hop: true }));
    }

    // queued action markers
    const all = this.cur ? [this.cur, ...this.actions] : this.actions;
    all.forEach((a, i) => {
      const sp = this.markerPoint(a);
      A.drawQueueMarker(ctx, sp.x + (i % 2) * 6, sp.y - Math.floor(i / 6) * 8, i + 1);
    });

    // fx
    for (const q of this.particles) { ctx.globalAlpha = Math.max(0, q.life); ctx.fillStyle = q.color; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    for (const f of this.floaters) {
      ctx.globalAlpha = Math.min(1, f.life * 2);
      ctx.font = `700 ${f.size}px Fredoka, sans-serif`;
      ctx.lineWidth = 6; ctx.strokeStyle = A.INK; ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
    this.drawCombos(ctx, t);
    ctx.restore();

    this.drawHud(ctx, t);
    this.drawCoins(ctx, t);
    this.drawBanner(ctx, t);
    if (this.tut) this.drawTutorial(ctx, t);
  }

  markerPoint(a) {
    switch (a.kind) {
      case 'table': return { x: a.ref.x + (a.ref.x < 360 ? 58 : -58), y: a.ref.y - 40 };
      case 'ticket': return { x: TICKET.x + 36, y: TICKET.y - 6 };
      case 'slot': return { x: SLOT_X[a.ref] + 22, y: SLOT_Y + 32 };
      case 'bin': return { x: BIN.x - 34, y: BIN.y - 40 };
      case 'coffee': return { x: COFFEE.x - 40, y: COFFEE.y - 60 };
    }
    return HOME;
  }

  drawTable(ctx, tb, t, seatable) {
    // If Poppy is carrying this table's food, make the table glow so it's easy to find
    const g0 = tb.group;
    const carrying = g0 && g0.state === 'waitfood' && this.poppy.hands.some(h => h && h.kind === 'food' && h.g === g0);
    if (carrying) {
      const r = (tb.seats === 4 ? 92 : 84) + Math.sin(t * 7) * 6;
      ctx.save();
      ctx.globalAlpha = 0.35; ctx.fillStyle = tb.colorObj.fill;
      ctx.beginPath(); ctx.ellipse(tb.x, tb.y + 4, r, r * 0.62, 0, 0, 7); ctx.fill();
      ctx.globalAlpha = 1; ctx.strokeStyle = tb.colorObj.dark; ctx.lineWidth = 5; ctx.setLineDash([14, 10]); ctx.lineDashOffset = -t * 50;
      ctx.stroke(); ctx.restore();
    }
    let hl = null;
    if (seatable) hl = this.canSeat(seatable, tb) ? (seatable.color === tb.color ? '#ffd43b' : '#40c057') : null;
    const s = 1 + tb.pulse * 0.08;
    ctx.save(); ctx.translate(tb.x, tb.y); ctx.scale(s, s); ctx.translate(-tb.x, -tb.y);
    A.drawTableTop(ctx, tb, this.cafe, hl);
    ctx.restore();
    const g = tb.group;
    if (g && g.state === 'eating') {
      g.members.forEach((m, i) => { const c = tb.chairs[i]; A.drawFood(ctx, tb.x + (c.x - tb.x) * 0.42, tb.y + (c.y - tb.y) * 0.5 - 4, A.dishFor(g.id + this.level.cafeIndex), 0.62); });
    } else if (g && (g.state === 'menu')) {
      g.members.forEach((m, i) => { const c = tb.chairs[i]; A.rr(ctx, tb.x + (c.x - tb.x) * 0.4 - 9, tb.y + (c.y - tb.y) * 0.5 - 12, 18, 22, 3); ctx.fillStyle = '#ffd8a8'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = A.INK; ctx.stroke(); });
    }
    if (tb.dirty) A.drawDishes(ctx, tb.x, tb.y - 2, 1.05);
  }

  barTarget() {
    const max = this.level.expert * 1.1;
    return { x: 230 + 360 * Math.min(1, this.score / max), y: 43 };
  }

  comboColor(n) {
    return ['#ffffff', '#ffffff', '#ffd43b', '#ff922b', '#ff6b9a', '#cc5de8', '#4dabf7'][Math.min(n, 6)];
  }

  drawCombos(ctx, t) {
    for (const c of this.combos) {
      const age = 1.4 - c.life;
      const k = Math.min(1, age / 0.28);
      const back = 1 + 2.4 * Math.pow(k - 1, 3) + 1.4 * Math.pow(k - 1, 2); // ease-out-back
      const s = (0.9 + Math.min(c.n, 6) * 0.06) * back;
      const a = c.life < 0.35 ? c.life / 0.35 : 1;
      const y = c.y - age * 30;
      const col = this.comboColor(c.n);
      ctx.save(); ctx.globalAlpha = a; ctx.translate(c.x, y); ctx.scale(s, s);
      // spinning starburst
      ctx.save(); ctx.rotate(age * 2);
      ctx.beginPath();
      for (let i = 0; i < 24; i++) { const r = i % 2 ? 46 : 74; const an = i / 24 * Math.PI * 2; ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r); }
      ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = A.INK; ctx.stroke();
      ctx.restore();
      ctx.rotate(Math.sin(age * 8) * 0.06);
      ctx.textAlign = 'center'; ctx.lineJoin = 'round';
      ctx.font = '700 60px Fredoka, sans-serif';
      ctx.lineWidth = 10; ctx.strokeStyle = A.INK; ctx.strokeText(`${c.n}x`, 0, 16);
      ctx.fillStyle = '#fff'; ctx.fillText(`${c.n}x`, 0, 16);
      ctx.font = '700 24px Fredoka, sans-serif';
      ctx.lineWidth = 7; ctx.strokeText('COMBO!', 0, 50); ctx.fillStyle = col === '#ffffff' ? '#ffd43b' : col; ctx.fillText('COMBO!', 0, 50);
      ctx.font = '700 20px Fredoka, sans-serif';
      ctx.lineWidth = 6; ctx.strokeText(`+${c.bonus}`, 0, -46); ctx.fillStyle = '#fff'; ctx.fillText(`+${c.bonus}`, 0, -46);
      ctx.restore();
    }
  }

  drawComboMeter(ctx, t) {
    const n = this.chain || 0;
    const x = 16, y = 106, w = 150, h = 40;
    const s = 1 + this.comboPulse * 0.18;
    const jig = this.comboBreak > 0 ? Math.sin(t * 50) * 4 * this.comboBreak : 0;
    ctx.save(); ctx.translate(x + w / 2 + jig, y + h / 2); ctx.scale(s, s);
    A.rr(ctx, -w / 2, -h / 2, w, h, 20);
    ctx.fillStyle = n >= 2 ? this.comboColor(n) : 'rgba(255,255,255,0.9)'; ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = A.INK; ctx.stroke();
    ctx.fillStyle = A.INK; ctx.textAlign = 'center';
    ctx.font = '700 17px Fredoka, sans-serif'; ctx.fillText('COMBO', -26, 6);
    ctx.font = '700 26px Fredoka, sans-serif'; ctx.fillText(`${Math.max(1, n)}x`, 40, 9);
    ctx.restore();
  }

  drawCoins(ctx, t) {
    const tg = this.barTarget();
    for (const c of this.coinFx) {
      if (c.t < 0) continue;
      const k = c.t / c.dur, e = k * k;
      const cx = c.x0 + (tg.x - c.x0) * e;
      const cy = (1 - k) * (1 - k) * c.y0 + 2 * (1 - k) * k * (c.y0 - 220) + k * k * tg.y;
      const sx = Math.abs(Math.cos(t * 12 + c.x0));
      ctx.save(); ctx.translate(cx, cy); ctx.scale(Math.max(0.2, sx), 1);
      ctx.beginPath(); ctx.arc(0, 0, 11, 0, 7); ctx.fillStyle = '#ffd43b'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#b8860b'; ctx.stroke();
      ctx.fillStyle = '#fff3bf'; ctx.beginPath(); ctx.arc(-3, -3, 3, 0, 7); ctx.fill();
      ctx.restore();
    }
  }

  drawBanner(ctx, t) {
    if (this.tut || this.bannerT > 2.4) return;
    const bt = this.bannerT;
    let x = W / 2;
    if (bt < 0.4) { const k = bt / 0.4; x = -300 + (W / 2 + 300) * (1 - Math.pow(1 - k, 3)); }
    else if (bt > 1.9) { const k = (bt - 1.9) / 0.5; x = W / 2 + (W + 300 - W / 2) * k * k; }
    ctx.save(); ctx.translate(x, 600); ctx.rotate(-0.04);
    A.rr(ctx, -280, -70, 560, 140, 30); ctx.fillStyle = '#ff922b'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = A.INK; ctx.stroke();
    ctx.textAlign = 'center'; ctx.lineJoin = 'round';
    ctx.font = '700 54px Fredoka, sans-serif'; ctx.lineWidth = 9; ctx.strokeStyle = A.INK;
    ctx.strokeText(`Level ${this.level.n}`, 0, 0); ctx.fillStyle = '#fff'; ctx.fillText(`Level ${this.level.n}`, 0, 0);
    ctx.font = '700 28px Fredoka, sans-serif'; ctx.lineWidth = 6;
    ctx.strokeText('Open for business!', 0, 44); ctx.fillStyle = '#ffd43b'; ctx.fillText('Open for business!', 0, 44);
    ctx.restore();
  }

  drawProgress(ctx, x, y, f) {
    A.rr(ctx, x - 34, y - 8, 68, 16, 8); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = A.INK; ctx.stroke();
    A.rr(ctx, x - 31, y - 5, Math.max(6, 62 * Math.max(0, Math.min(1, f))), 10, 5); ctx.fillStyle = '#69db7c'; ctx.fill();
  }

  drawHud(ctx, t) {
    ctx.fillStyle = 'rgba(58,42,34,0.92)'; ctx.fillRect(0, 0, W, 96);
    ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = '700 30px Fredoka, sans-serif';
    ctx.fillText(`Level ${this.level.n}`, 22, 40);
    ctx.font = '500 18px Fredoka, sans-serif'; ctx.fillStyle = '#ffd8a8';
    ctx.fillText(this.cafe.name, 22, 68);
    // goal bar
    const bx = 230, bw = 360, by = 30;
    const max = this.level.expert * 1.1;
    A.rr(ctx, bx, by, bw, 26, 13); ctx.fillStyle = '#5c4033'; ctx.fill();
    const f = Math.min(1, this.shownScore / max);
    if (this.barPulse > 0) { ctx.save(); ctx.globalAlpha = this.barPulse * 0.6; A.rr(ctx, bx - 4, by - 4, bw + 8, 34, 17); ctx.fillStyle = '#ffd43b'; ctx.fill(); ctx.restore(); }
    if (f > 0) { A.rr(ctx, bx, by, Math.max(26, bw * f), 26, 13); ctx.fillStyle = this.score >= this.level.expert ? '#ffd43b' : this.score >= this.level.goal ? '#69db7c' : '#ff922b'; ctx.fill(); }
    for (const [v, label] of [[this.level.goal, 'GOAL'], [this.level.expert, 'EXPERT']]) {
      const x = bx + bw * (v / max);
      ctx.fillStyle = '#fff'; ctx.fillRect(x - 2, by - 4, 4, 34);
      ctx.font = '700 12px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(label, x, by + 46);
    }
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = '700 20px Fredoka, sans-serif';
    ctx.fillText(String(Math.round(this.shownScore)), bx + bw / 2, by + 20);
    const left = this.pending.length + this.groups.filter(g => g.state !== 'leaving').length;
    ctx.textAlign = 'left'; ctx.font = '600 15px Fredoka, sans-serif'; ctx.fillStyle = '#ffd8a8';
    ctx.fillText(`Guests left: ${left}`, bx, by + 62);
    this.drawComboMeter(ctx, t);
    // pause
    A.rr(ctx, 640, 18, 60, 60, 18); ctx.fillStyle = '#ff922b'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.fillRect(658, 34, 8, 28); ctx.fillRect(674, 34, 8, 28);

    const h = this.hint();
    if (h) {
      ctx.font = '600 20px Fredoka, sans-serif';
      const w = Math.min(680, ctx.measureText(h).width + 40);
      A.rr(ctx, (W - w) / 2, 1012, w, 46, 23); ctx.fillStyle = 'rgba(112,72,232,0.95)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(h, W / 2, 1042);
    }
  }
}
