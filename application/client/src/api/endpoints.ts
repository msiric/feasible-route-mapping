import axios from "axios";
import { parseGeometry } from "@util/geometry";
import { LatLngExpression } from "leaflet";
import { CostingOption } from "@util/options";

export interface ShortestSegmentSummary {
  has_time_restrictions: boolean;
  min_lat: number;
  min_lon: number;
  max_lat: number;
  max_lon: number;
  time: number;
  length: number;
  cost: number;
}

export interface ShortestSegmentManeuver {
  type: number;
  instruction: string;
  verbal_succinct_transition_instruction: string;
  verbal_pre_transition_instruction: string;
  verbal_post_transition_instruction: string;
  street_names: string[];
  time: number;
  length: number;
  cost: number;
  begin_shape_index: number;
  end_shape_index: number;
  has_time_restrictions: boolean;
  verbal_multi_cue: boolean;
  travel_mode: string;
  travel_type: string;
}

export interface ShortestSegment {
  trip: {
    locations: {
      type: string;
      lat: number;
      lon: number;
      original_index: number;
    }[];
    legs: [
      {
        maneuvers: ShortestSegmentManeuver[];
        summary: ShortestSegmentSummary;
        shape: string;
      }
    ];
    summary: ShortestSegmentSummary;
    status_message: string;
    status: number;
    units: string;
    language: string;
  };
  id?: string;
  features: LatLngExpression[];
}

export interface IsochroneProperties {
  fill: string;
  fillOpacity: number;
  "fill-opacity": number;
  fillColor: string;
  color: string;
  contour: number;
  opacity: number;
  metric: string;
}

export interface IsochroneGeometry {
  coordinates: LatLngExpression[];
}

export interface Isochrone {
  id?: string;
  type: string;
  features: [
    {
      properties: IsochroneProperties;
      geometry: IsochroneGeometry;
      type: string;
    }
  ];
}

export interface Address {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  boundingbox: string[];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  icon: string;
}

export const fetchAddress = async (location: string): Promise<Address[]> => {
  const { data } = await axios.get(
    `https://nominatim.openstreetmap.org/search?q=${location}&format=json&limit=5`
  );
  return data;
};

export const fetchRoute = async (
  params: CostingOption
): Promise<ShortestSegment> => {
  const { data } = await axios.get("/api/route", {
    params: {
      json: params,
    },
    headers: {
      "Content-Type": "application/json",
    },
  });
  data.features = parseGeometry(data);
  return data;
};

export const fetchIsochrone = async (
  params: CostingOption
): Promise<Isochrone> => {
  const { data } = await axios.get("/api/isochrone", {
    params: {
      json: params,
    },
    headers: {
      "Content-Type": "application/json",
    },
  });
  return data;
};
