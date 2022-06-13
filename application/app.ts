import compression from "compression";
import cors from "cors";
import express, { Request, Response } from "express";
import path from "path";
import { CLIENT_DOMAIN } from "./config/constants";
import api from "./routes/index";

const app = express();
const dirname = path.resolve();

const port = process.env.PORT || 5000;

(async () => {
  app.use(
    cors({
      origin: CLIENT_DOMAIN,
      credentials: true,
    })
  );
  app.use(compression());

  app.use(express.urlencoded({ extended: false }));
  app.use(express.json({ type: "application/json" }));

  app.use("/api", api);

  app.use(express.static(path.join(dirname, "client/build")));
  app.use(express.static(path.join(dirname, "public")));

  app.use((_: Request, res: Response) => {
    res.sendFile(path.join(dirname, "client/build", "index.html"));
  });

  app.listen(port, () => {
    console.log("Express server started on port: " + port);
  });
})();

export default app;
