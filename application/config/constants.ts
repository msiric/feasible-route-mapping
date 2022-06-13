import dotenv from "dotenv";
import { FRM_URL, VALHALLA_URL } from "./secret";

dotenv.config();

export const CLIENT_DOMAIN = process.env.CLIENT_URI || FRM_URL;

export const VALHALLA_OSM_URL = VALHALLA_URL;
