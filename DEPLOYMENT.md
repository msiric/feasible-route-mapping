# Isolated free portfolio deployment

Parent: `msiric-public-demos`. This project has no database, payment provider, outbound email, paid disk, or automatic keep-alive job.

- Cloudflare Pages Free: `feasible-route-mapping-demo`, intended URL `https://feasible-route-mapping-demo.pages.dev`.
- Render Hobby → `feasible-route-mapping` → `Demo`: Free Docker service, Frankfurt, 512 MB / 0.1 CPU, automatic deployment off.
- A pinned Valhalla image builds the South Australia graph from a SHA-256 checked public release asset. The graph is part of the image, so cold starts never download or rebuild it. Source and license: [deployment/DATA.md](deployment/DATA.md).
- The Node gateway listens on Render's `PORT`; Valhalla is restricted to loopback. `/healthz` reports startup readiness without repeated routing queries. One engine worker, bounded queue, 24 MB cache, 96 MB Node heap, bounded request/response sizes, per-IP rate limits.
- Only the Pages proxy holds `API_ORIGIN` and `DEMO_PROXY_SECRET`; Render has the matching secret and `CLIENT_URI`. Never commit these values. Direct requests to the Render API are rejected.
- Regional limits: 2–3 locations, ≤40 km straight-line distance per segment, ≤40 minutes total travel-time budget per segment, ≤10 extra minutes, ≤8 road exclusions. Six original travel modes and mode-specific preferences remain. Bus is road routing, not timetable transit.

## Validation

`npm --prefix application ci` and `npm --prefix application/client ci` install dependencies.
`npm --prefix application test` checks the real gateway with controlled upstream responses and polygon calculations.
`npm --prefix application/client run typecheck` and `npm --prefix application/client run build` validate the frontend.

The public GitHub Actions workflow builds and tests the real image on a standard free runner with 512 MB / 0.1 CPU limits. It exports the small public sample through logs, without paid artifact storage. Real-engine success, a Render cold-start check and public browser tests are required before declaring the deployment complete. Docker on the local development machine was unresponsive during restoration; no unrelated containers or Docker settings were changed.

## Accuracy

Reference route duration follows Valhalla's weighted travel-mode preferences, not a guaranteed minimum-time path. The feasible area approximates `travel(origin,x) + travel(x,destination) ≤ reference duration + extra time` using forward origin and **reverse destination** contours, one-minute splits, and 20 m geometric generalization. Polygon holes and disconnected components are retained. Coarse sampling can omit narrow corridors; road restrictions/turn penalties and regional boundaries add approximation. Do not use this demo as navigation or safety guidance.

Map browsing uses normal browser caching and visible OpenStreetMap attribution. No tile prefetch/offline download and no Nominatim autocomplete. Bundled landmark search is entirely local.

## Cost behavior

Services use Free plans and sleep when idle. Render's shared workspace quota applies across all three apps. If quotas are exhausted the interactive APIs may become unavailable; bundled samples remain usable. No usage-triggered paid upgrade or paid fallback is configured. Keep build spending capped at $0 in the isolated workspace.
