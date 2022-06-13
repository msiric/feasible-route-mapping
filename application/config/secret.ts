import dotEnv from "dotenv";
import path from "path";

const rootDir = process.cwd() ?? ".";

dotEnv.config({
  path: path.resolve(rootDir, `.env.${process.env.NODE_ENV || "development"}`),
});

const { VALHALLA_URL, FRM_URL } = process.env;

export const ENV_OPTIONS = {
  DEVELOPMENT: "development",
  PRODUCTION: "production",
};

export { VALHALLA_URL, FRM_URL };
