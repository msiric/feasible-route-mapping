import { requestRouting } from '../demo/requests.mjs';
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

export type Isochrone = import('geojson').FeatureCollection<import('geojson').Polygon | import('geojson').MultiPolygon>;

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

// Bundled landmarks avoid sending keystrokes to a public geocoder.
const places = [
  ['Adelaide Town Hall', -34.9253, 138.5998],
  ['Art Gallery of South Australia', -34.9210, 138.6040],
  ['Adelaide Railway Station', -34.9210, 138.5965],
  ['Adelaide Oval', -34.9155, 138.5960],
  ['Adelaide Central Market', -34.9297, 138.5980],
  ['Adelaide Botanic Garden', -34.9194, 138.6114],
  ['Rundle Mall', -34.9225, 138.6020],
  ['Glenelg Jetty', -34.9800, 138.5110],
  ['Port Adelaide', -34.8460, 138.5030],
  ['Norwood', -34.9210, 138.6350],
  ['Unley', -34.9500, 138.6070],
] as const;
export const fetchAddress = async (query: string): Promise<Address[]> => places
  .filter(([name]) => name.toLowerCase().includes(query.trim().toLowerCase()))
  .map(([display_name,lat,lon],index) => ({display_name,lat:String(lat),lon:String(lon),place_id:index, type:'landmark'} as Address));

export const fetchRoute = async (params: CostingOption, signal?: AbortSignal, onWait?: (seconds: number) => void): Promise<ShortestSegment> => {
  const data = await requestRouting('route',params,{signal,onWait}); data.features=parseGeometry(data); return data;
};
export const fetchIsochrone = (params: CostingOption, signal?: AbortSignal, onWait?: (seconds: number) => void): Promise<Isochrone> => requestRouting('isochrone',params,{signal,onWait});
