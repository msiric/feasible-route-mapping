# Feasible Route Mapping frontend

React 17, Material UI 5, Leaflet, Turf, Zustand and Vite. The [repository README](../../README.md) explains the algorithm, sample and regional limits; [DEPLOYMENT.md](../../DEPLOYMENT.md) explains the current hosting.

From the repository root, run `npm --prefix application ci` and `npm --prefix application/client ci`. Start the local Docker routing service as described in the root README, then run `npm --prefix application/client start`. The UI is at `http://127.0.0.1:5176`; Vite proxies `/api` to port 5076. The bundled sample needs no live engine, although background map tiles use the network.

Run `npm --prefix application/client run typecheck` and `npm --prefix application/client run build`. Output is `application/client/build`. Publish from the repository root to include the Pages Function. This project no longer uses Create React App or its `eject` workflow.
