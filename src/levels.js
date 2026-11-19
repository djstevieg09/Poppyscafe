// Level generation. Every level is produced from its number, so the game
// scales to any number of levels (100s or 1000s) without hand-authored data.
// Hand-tuned overrides can be added to LEVEL_OVERRIDES if a level needs it.

export const COLORS = [
  { id: 'red', fill: '#ff6b6b', dark: '#c44545' },
  { id: 'blue', fill: '#4dabf7', dark: '#2b7bbf' },
  { id: 'green', fill: '#69db7c', dark: '#3a9f4c' },
  { id: 'yellow', fill: '#ffd43b', dark: '#c9a20c' },
];

// Ten 1950s-style diners, ten levels each. After level 100 the cafes repeat with a harder tier.
export const RESTAURANTS = [
  { name: "Lolly's Diner", floorA: '#fdf6ec', floorB: '#4b4b5c', wall: '#ffc9d6', wallTrim: '#e64980', counter: '#e03131', counterTop: '#f1f3f5', table: '#fff5f5', sky: '#c5f6fa' },
  { name: 'Seaside Soda Shop', floorA: '#f8f9fa', floorB: '#4dabf7', wall: '#c5f6fa', wallTrim: '#1098ad', counter: '#15aabf', counterTop: '#f8f9fa', table: '#ffffff', sky: '#a5d8ff' },
  { name: 'Route 66 Drive-In', floorA: '#fff5f5', floorB: '#e03131', wall: '#ffe066', wallTrim: '#c92a2a', counter: '#343a40', counterTop: '#f1f3f5', table: '#ffffff', sky: '#ffd8a8' },
  { name: 'Neon Night Diner', floorA: '#2b2140', floorB: '#3d2f5c', wall: '#5b3f8c', wallTrim: '#ff5fa2', counter: '#d64585', counterTop: '#ffe0f0', table: '#f4f0ff', sky: '#2a1f44' },
  { name: 'Mint Malt Shop', floorA: '#fff9db', floorB: '#8f5b34', wall: '#d3f9d8', wallTrim: '#2f9e44', counter: '#c2255c', counterTop: '#f8f9fa', table: '#ffffff', sky: '#d0ebff' },
  { name: "Rock 'n' Roll Burger Bar", floorA: '#f8f9fa', floorB: '#2b2b2b', wall: '#ff8787', wallTrim: '#212529', counter: '#495057', counterTop: '#e9ecef', table: '#ffffff', sky: '#ffe3e3' },
  { name: 'Desert Drive-In', floorA: '#fbe7c6', floorB: '#e8590c', wall: '#ffd8a8', wallTrim: '#e76f51', counter: '#2a9d8f', counterTop: '#e9f5f2', table: '#fffaf0', sky: '#ffe9c7' },
  { name: 'Candy Lane Parlour', floorA: '#fff0f6', floorB: '#f783ac', wall: '#ffdeeb', wallTrim: '#d6336c', counter: '#9775fa', counterTop: '#f3f0ff', table: '#ffffff', sky: '#ffeaf5' },
  { name: 'Harbour Milkshake Bar', floorA: '#f1f3f5', floorB: '#1864ab', wall: '#fff3bf', wallTrim: '#1864ab', counter: '#c92a2a', counterTop: '#f8f9fa', table: '#ffffff', sky: '#d0ebff' },
  { name: 'Atomic Space Diner', floorA: '#2b2d42', floorB: '#3a3d5c', wall: '#4361ee', wallTrim: '#f72585', counter: '#8d99ae', counterTop: '#edf2f4', table: '#edf2f4', sky: '#14152b' },
];

// Customer personalities. Multipliers are relative to a regular customer.
export const CUSTOMER_TYPES = {
  regular:  { name: 'Regulars',  patience: 1.0, eat: 1.0, menu: 1.0, tip: 1.0, unlock: 1,  blurb: 'Easy-going folks. Perfect for warming up.' },
  student:  { name: 'Students',  patience: 0.8, eat: 0.6, menu: 0.7, tip: 0.7, unlock: 3,  blurb: 'Eat fast, tip small, hate waiting.' },
  granny:   { name: 'Grandmas',  patience: 1.6, eat: 1.5, menu: 1.5, tip: 1.3, unlock: 6,  blurb: 'Very patient, take their time, tip well.' },
  suit:     { name: 'Big Bosses', patience: 0.6, eat: 0.8, menu: 0.6, tip: 1.7, unlock: 11, blurb: 'Huge tips, but zero patience!' },
  bookworm: { name: 'Bookworms', patience: 1.2, eat: 1.8, menu: 2.0, tip: 1.1, unlock: 16, blurb: 'Read every word of the menu. Then linger.' },
};

// Table slots on the floor (logical 720x1280 portrait canvas).
export const TABLE_SLOTS = [
  { x: 190, y: 470 }, { x: 530, y: 470 },
  { x: 190, y: 700 }, { x: 530, y: 700 },
  { x: 190, y: 930 }, { x: 530, y: 930 },
];

export const LEVELS_PER_CAFE = 10;
export const FREE_LEVELS = 20;

export function restaurantFor(n) {
  return RESTAURANTS[Math.floor((n - 1) / LEVELS_PER_CAFE) % RESTAURANTS.length];
}

// Small deterministic RNG so each level plays the same every time.
export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

const LEVEL_OVERRIDES = {
  1: { tables: 3, customers: 6, maxGroup: 2, interval: 10 },
  2: { tables: 3, customers: 7, maxGroup: 2, interval: 9.5 },
};

export function generateLevel(n) {
  const r = rng(n * 7919 + 13);
  const cafeIndex = Math.floor((n - 1) / LEVELS_PER_CAFE);
  const inCafe = (n - 1) % LEVELS_PER_CAFE; // 0..9
  const tier = Math.floor((n - 1) / 100); // 0 for 1-100, 1 for 101-200 ...
  const o = LEVEL_OVERRIDES[n] || {};

  const tables = o.tables ?? Math.min(6, 3 + Math.floor(inCafe / 3) + (cafeIndex > 0 ? 1 : 0));
  const maxGroup = o.maxGroup ?? (n < 4 ? 2 : n < 8 ? 3 : 4);
  const customers = o.customers ?? Math.min(34, 7 + Math.floor(n * 0.45) + Math.floor(inCafe * (n <= 20 ? 0.5 : 1)) + tier * 4);
  // Gentle start: the first ~15 levels get extra patience and slower arrivals, then it ramps slowly.
  const ease = n <= 15 ? (15 - n) / 14 : 0; // 1 at level 1 -> 0 at level 15
  const interval = o.interval ?? Math.max(3.2, 9 - n * 0.05 - tier * 0.5) + ease * 2.5;
  const patience = Math.max(0.55, 1.3 - n * 0.007 - tier * 0.1) * (1 + ease * 0.6);

  // Table layout: alternate 2 and 4 seaters; bigger tables appear as groups grow.
  const tableDefs = [];
  for (let i = 0; i < tables; i++) {
    const seats = maxGroup <= 2 ? 2 : (i % 2 === 1 || (i === 0 && maxGroup === 4 && tables === 3)) ? 4 : 2;
    tableDefs.push({ ...TABLE_SLOTS[i], seats, color: COLORS[(i + cafeIndex) % COLORS.length].id });
  }
  if (maxGroup > 2 && !tableDefs.some(t => t.seats === 4)) tableDefs[tableDefs.length - 1].seats = 4;

  const types = Object.entries(CUSTOMER_TYPES).filter(([, t]) => t.unlock <= n).map(([k]) => k);
  const groups = [];
  let t = 1.2;
  for (let i = 0; i < customers; i++) {
    const size = 1 + Math.floor(r() * maxGroup);
    // Newest unlocked type is featured a little more often.
    const type = r() < 0.3 ? types[types.length - 1] : types[Math.floor(r() * types.length)];
    groups.push({ at: t, size, type, color: COLORS[Math.floor(r() * COLORS.length)].id });
    t += interval * (0.6 + r() * 0.8);
  }

  // Targets: roughly what a decent / great player earns per group.
  const perGroupGoal = 62 + Math.min(30, n * 0.4);
  const goal = Math.round((customers * perGroupGoal * (1 - ease * 0.25)) / 50) * 50;
  const expert = Math.round((goal * 1.45) / 50) * 50;

  return {
    n, cafe: restaurantFor(n), cafeIndex, inCafe, tier,
    tables: tableDefs, groups, patience, goal, expert,
    newType: types.find(k => CUSTOMER_TYPES[k].unlock === n) || null,
  };
}
