FROM node:22.23.2-bookworm-slim AS app-build
WORKDIR /app
COPY application/package.json application/package-lock.json ./
RUN npm ci --include=dev
COPY application/tsconfig.json application/app.ts ./
COPY application/demo ./demo
RUN npm run build && npm prune --omit=dev

FROM ghcr.io/valhalla/valhalla-scripted@sha256:ca6171d20aceff905c0fe4b52f2bf4aab7de0038e0291058d01cc434ebf95970 AS graph-build
USER root
WORKDIR /data
COPY deployment/valhalla.json /data/valhalla.json
RUN curl --fail --location --retry 3 --output /data/south-australia.osm.pbf https://github.com/msiric/feasible-route-mapping/releases/download/demo-sa-data-2026-09-17/south-australia-latest.osm.pbf \
 && echo '8485d2ff1b5705bf6aef156a3ff0c35cb2bfe464bda2e115019bfc0ad8208b0a  /data/south-australia.osm.pbf' | sha256sum -c - \
 && mkdir -p /data/tiles \
 && valhalla_build_admins --config /data/valhalla.json /data/south-australia.osm.pbf \
 && valhalla_build_tiles --config /data/valhalla.json /data/south-australia.osm.pbf \
 && rm /data/south-australia.osm.pbf

FROM ghcr.io/valhalla/valhalla-scripted@sha256:ca6171d20aceff905c0fe4b52f2bf4aab7de0038e0291058d01cc434ebf95970
USER root
COPY --from=app-build /usr/local/bin/node /usr/local/bin/node
COPY --from=app-build /app/dist /app/dist
COPY --from=app-build /app/node_modules /app/node_modules
COPY --from=graph-build /data/tiles /data/tiles
COPY --from=graph-build /data/admins.sqlite /data/admins.sqlite
COPY deployment/valhalla.json /data/valhalla.json
WORKDIR /app
ENV NODE_ENV=production NODE_OPTIONS=--max-old-space-size=96 VALHALLA_CONFIG=/data/valhalla.json
USER 65532:65532
EXPOSE 10000
ENTRYPOINT ["node","/app/dist/app.js"]
