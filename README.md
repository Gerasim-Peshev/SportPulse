# SportPulse PWA

A mobile-first sports dashboard designed for GitHub Pages. Includes live/upcoming/results/starred views, sport filtering, search, local starred-match storage, an installable PWA shell, and browser notifications while the app is running.

## Deploy to GitHub Pages

1. Create a GitHub repository (for example `sportpulse`).
2. Upload all files in this folder to the repository root. Keep the `icons` folder.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select `main` and `/(root)`, then save.
6. Wait for deployment. The URL will look like `https://YOUR-USERNAME.github.io/sportpulse/`.
7. Open that URL over HTTPS. On iPhone, open it in Safari, use **Share → Add to Home Screen**, then open the installed app. On supported iOS versions, allow notifications when prompted.

## Data source

The app starts in **Demo data** mode so the interface works immediately. Demo scores are illustrative and must not be mistaken for real live scores.

To test the public TheSportsDB day-events endpoint:
1. Open Settings in the app.
2. Choose **TheSportsDB public demo feed**.
3. Save settings.

The app currently calls `eventsday.php` for today's events. Provider response fields and coverage vary, and this free endpoint is not a guaranteed all-sports live-score service. This adapter is intentionally small and can be replaced with a provider that supports the leagues and statistics you need.

## Notifications: important limitation

- Browser notification permission is requested only after a user action.
- While the app page is open, it polls the selected provider at the chosen interval and can notify for starred matches that newly become live or change score, if the provider returns that data.
- **GitHub Pages is static hosting. It cannot run a background worker/server to monitor matches.** Once the app is closed or suspended, this implementation cannot guarantee alerts.
- True push alerts while closed require a backend that polls or receives provider updates and sends Web Push notifications. Use a service such as Cloudflare Workers plus durable storage and a Web Push/VAPID implementation, or another serverless backend. Never put private API keys or VAPID private keys in public client-side files.
- iOS web push requires a compatible iOS version and the site added to the Home Screen; browser/platform settings also apply.

## Privacy and storage

Starred matches and settings are stored in this browser via `localStorage`. The optional API key is also stored locally in the browser. Do not enter private/paid provider keys in a public deployment: client-side keys can be inspected by anyone.

## Project structure

- `index.html` — app layout and settings dialog
- `styles.css` — responsive dark interface
- `app.js` — filters, demo data, provider adapter, starring, polling and foreground notifications
- `manifest.webmanifest` — PWA metadata
- `sw.js` — offline shell cache and notification click handler
- `icons/` — scalable app icons

## Current limitations / next steps

- The free sample data is illustrative.
- The initial TheSportsDB adapter requests today's event list; it does not yet normalize every sport's status/statistics schema or provide full historical search.
- The interface uses local state and can be expanded with a match detail page, leagues/teams pages, historical date picker, and a real push backend.
