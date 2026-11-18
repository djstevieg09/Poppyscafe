// Level generation. Every level is produced from its number, so the game
// scales to any number of levels (100s or 1000s) without hand-authored data.
// Hand-tuned overrides can be added to LEVEL_OVERRIDES if a level needs it.

export const COLORS = [
  { id: 'red', fill: '#ff6b6b', dark: '#c44545' },
  { id: 'blue', fill: '#4dabf7', dark: '#2b7bbf' },
  { id: 'green', fill: '#69db7c', dark: '#3a9f4c' },
  { id: 'yellow', fill: '#ffd43b', dark: '#c9a20c' },
];

// Ten cafes, ten levels each. After level 100 the cafes repeat with a harder tier.
export const RESTAURANTS = [
  { name: 'Sunny Corner Café', floorA: '#f8e6c8', floorB: '#f0d6ac', wall: '#ffb4a2', wallTrim: '#e5989b', counter: '#a0673f', counterTop: '#f3d9b1', table: '#fff6e5', sky: '#ffe5d0' },
  { name: 'Seaside Snack Shack', floorA: '#e9f6fb', floorB: '#d3ecf5', wall: '#7fd1e8', wallTrim: '#3fa7c4', counter: '#c58f5a', counterTop: '#ffe8c2', table: '#ffffff', sky: '#c9f0ff' },
  { name: 'Garden Tea House', floorA: '#e8f5e0', floorB: '#d5ebc8', wall: '#a8d8a0', wallTrim: '#6fb365', counter: '#8a6a4a', counterTop: '#f6efd8', table: '#fffdf2', sky: '#e5f9da' },
  { name: 'Neon Night Diner', floorA: '#2f2b4a', floorB: '#3a3560', wall: '#5b3f8c', wallTrim: '#ff5fa2', counter: '#d64585', counterTop: '#ffe0f0', table: '#f4f0ff', sky: '#2a1f44' },
  { name: 'Alpine Lodge', floorA: '#efe1cf', floorB: '#dfc8ab', wall: '#9c6644', wallTrim: '#6f4518', counter: '#7f5539', counterTop: '#e6ccb2', table: '#fff8ee', sky: '#dbe9f5' },
  { name: 'Rooftop Bistro', floorA: '#f1f1f1', floorB: '#e1e1e1', wall: '#ffd6a5', wallTrim: '#ff9f43', counter: '#4b5563', counterTop: '#f9fafb', table: '#ffffff', sky: '#ffe8cc' },
  { name: 'Desert Oasis', floorA: '#fbe7c6', floorB: '#f4d39b', wall: '#f4a261', wallTrim: '#e76f51', counter: '#2a9d8f', counterTop: '#e9f5f2', table: '#fffaf0', sky: '#ffe9c7' },
  { name: 'Candy Lane Parlour', floorA: '#ffe3f1', floorB: '#ffd0e8', wall: '#ffadd2', wallTrim: '#f06595', counter: '#9775fa', counterTop: '#f3f0ff', table: '#ffffff', sky: '#ffeaf5' },
  { name: 'Harbour Noodle Bar', floorA: '#fdf0d5', floorB: '#f5deb0', wall: '#c1121f', wallTrim: '#780000', counter: '#3d3d3d', counterTop: '#fdf0d5', table: '#fffaf0', sky: '#ffe0cc' },
  { name: 'Starlight Space Café', floorA: '#2b2d42', floorB: '#34374f', wall: '#4361ee', wallTrim: '#7209b7', counter: '#8d99ae', counterTop: '#edf2f4', table: '#edf2f4', sky: '#14152b' },
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
