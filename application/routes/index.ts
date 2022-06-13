import { Router, Request, Response } from "express";
import axios from "axios";
import { VALHALLA_OSM_URL } from "../config/constants";
import { handleThrownException } from "../utils/error";

const router = Router();

router.get("/route", async (req: Request, res: Response) => {
  try {
    const { data } = await axios.get(`${VALHALLA_OSM_URL}/route`, {
      params: {
        json: req.query.json,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });
    return res.json(data);
  } catch (err) {
    return res.status(400).json(handleThrownException(err));
  }
});

router.get("/isochrone", async (req: Request, res: Response) => {
  try {
    const { data } = await axios.get(`${VALHALLA_OSM_URL}/isochrone`, {
      params: {
        json: req.query.json,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });
    return res.json(data);
  } catch (err) {
    return res.status(400).json(handleThrownException(err));
  }
});

export default router;
