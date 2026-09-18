# Routing application

Start with the [repository README](../README.md) and [deployment guide](../DEPLOYMENT.md). `app.ts` and `demo/` implement the bounded Node gateway; `client/` contains the React map and cancellable geometry worker. The repository-root Dockerfile packages the gateway with Valhalla and the pinned regional graph.

From the repository root:

```sh
npm --prefix application ci
npm --prefix application/client ci
npm --prefix application test
npm --prefix application/client run typecheck
npm --prefix application/client run build
```

Follow the root README to build/run the actual engine locally. The Node gateway alone is not a routing engine. Do not use historical `container/` deployment configurations for the restored demo.
