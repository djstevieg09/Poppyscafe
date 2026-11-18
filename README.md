# Lolly's Café Rush

An original cartoon time-management café game (seat guests, take orders, serve, collect, clear).
Runs in any browser; wraps to iOS/Android with Capacitor.

## Run locally
    npx serve .        # then open http://localhost:3000 on your phone or desktop

## Project layout
- `index.html` – screens (title, level map, intro, results, shop, paywall) and styles
- `src/game.js` – gameplay: queue, seating, colour-match bonus, orders, kitchen, serving, bills, tips, clearing, chains, action queue
- `src/levels.js` – cafés, customer types and the level generator (any level number works)
- `src/art.js` – all cartoon art, drawn in code
- `src/store.js` – in-app purchase gating (test store for now)
- `src/audio.js` – synthesized sound effects

## Pricing / purchases
| Levels | Price | Product id |
|---|---|---|
| 1–20 | Free | – |
| 21–100 | £2.99 one-off | `unlock_21_100` |
| 101–200, 201–300, … | £2.99 per pack | `unlock_101_200`, `unlock_201_300`, … |

`src/store.js` currently uses a **test store** (purchases succeed with no charge). To go live:
1. Create the products above as **non-consumable** in App Store Connect and Google Play Console.
2. Add a billing plugin (e.g. RevenueCat `@revenuecat/purchases-capacitor`).
3. Replace `TestBilling` in `src/store.js` with an adapter implementing `init / price / purchase / restore`.

## Build mobile apps
    npm install
    npx cap add ios && npx cap add android   # first time only
    npm run cap:ios      # or cap:android
