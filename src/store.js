// In-app purchase layer.
//
// Pricing model:
//   Levels 1-20      free
//   Levels 21-100    one-off £2.99   (product id: unlock_21_100)
//   Each further 100 £2.99 per pack  (product ids: unlock_101_200, unlock_201_300, ...)
//
// Right now this uses a TEST store that grants purchases instantly with no charge,
// so the game can be played end to end. To go live, replace `TestBilling` with an
// adapter for the native stores, e.g. RevenueCat (@revenuecat/purchases-capacitor)
// or cordova-plugin-purchase, registering the same product ids as non-consumables
// in App Store Connect and Google Play Console.

import { FREE_LEVELS } from './levels.js';

export const PRICE_FALLBACK = '£2.99';

export function packForLevel(n) {
  if (n <= FREE_LEVELS) return null;
  if (n <= 100) return { id: 'unlock_21_100', from: 21, to: 100 };
  const from = Math.floor((n - 1) / 100) * 100 + 1;
  return { id: `unlock_${from}_${from + 99}`, from, to: from + 99 };
}

const TestBilling = {
  name: 'test',
  async init() {},
  async price(/* productId */) { return PRICE_FALLBACK; },
  async purchase(productId) {
    await new Promise(r => setTimeout(r, 400));
    return { ok: true, productId, test: true };
  },
  async restore() { return []; },
};

export class Store {
  constructor(save, billing = TestBilling) {
    this.save = save;
    this.billing = billing;
  }
  get isTestMode() { return this.billing.name === 'test'; }
  async init() { await this.billing.init(); }
  owns(productId) { return !!this.save.data.purchases[productId]; }
  levelPurchased(n) {
    const pack = packForLevel(n);
    return !pack || this.owns(pack.id);
  }
  async price(productId) {
    try { return await this.billing.price(productId); } catch { return PRICE_FALLBACK; }
  }
  async buy(productId) {
    const res = await this.billing.purchase(productId);
    if (res && res.ok) {
      this.save.data.purchases[productId] = true;
      this.save.write();
    }
    return res;
  }
  async restore() {
    const owned = await this.billing.restore();
    for (const id of owned) this.save.data.purchases[id] = true;
    this.save.write();
    return owned;
  }
}
