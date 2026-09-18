import { routeJourney } from '../demo/requests.mjs';
import { fetchRoute } from "@api/endpoints";
import { toErrorMessage } from "@util/error";
import {
  TransportationMode,
  CostingOption,
  applyTransportationMode,
} from "@util/options";
import { LatLngExpression } from "leaflet";
import { FieldValues } from "react-hook-form";
import { create, GetState, SetState } from "zustand";
import hashObject from "object-hash";

export interface PathSegments {
  params: CostingOption[];
  hash: string;
}

export interface Location {
  lat: number;
  lon: number;
  type: string;
  place_id?: number;
  licence?: string;
  osm_type?: string;
  osm_id?: number;
  boundingbox?: string[];
  display_name?: string;
  class?: string;
  importance?: number;
  icon?: string;
}

export interface Option {
  location: Location | null;
  timeRange?: number;
  transportationMode?: TransportationMode;
}

export interface ShortestPathData {
  features: LatLngExpression[];
  duration: number;
  length: number;
  locations: Location[];
  transportationMode: TransportationMode;
  excludedLocations?: Location[];
  timeRange: number;
}

export interface ShortestPathError {
  retry: boolean;
  message: string;
}

export interface ShortestPathState {
  data: { path: ShortestPathData[]; hash: string };
  loading: boolean;
  progress: string;
  error: ShortestPathError;
}

export interface ShortestPathActions {
  findShortestPath: (options: CostingOption[], hash: string) => Promise<void>;
  breakPathIntoSegments: (values: FieldValues) => PathSegments;
  setShortestPath: (shortestPath: ShortestPathData[], hash: string) => void;
  resetShortestPath: () => void;
}

export type ShortestPathContext = ShortestPathState & ShortestPathActions;

const initialState: ShortestPathState = {
  data: { path: [], hash: "" },
  loading: false,
  progress: "",
  error: { retry: false, message: "" },
};

let activeRequest: AbortController | undefined;
let requestGeneration = 0;

const initState = () => ({
  ...initialState,
});

const initActions = (
  set: SetState<ShortestPathContext>,
  get: GetState<ShortestPathContext>
) => ({
  findShortestPath: async (
    options: CostingOption[],
    hash: string
  ): Promise<void> => {
    activeRequest?.abort();
    activeRequest = new AbortController();
    const signal = activeRequest.signal, generation = ++requestGeneration;
    try {
      set((state) => ({
        ...state,
        data: { path: [], hash: "" },
        loading: true,
        progress: "Requesting reference route…",
        error: { ...initialState.error },
      }));
      const shortestSegments = await routeJourney(options,
        (segment: CostingOption, signal: AbortSignal) => fetchRoute(segment, signal,
          seconds => { if (generation === requestGeneration) set({progress: `Server busy · retrying in ${seconds}s…`}); }),
        signal, (index: number, total: number) => set({progress: `Reference route · segment ${index}/${total}`}));
      const shortestPath: ShortestPathData[] = shortestSegments.map(
        ({ features, trip }: Awaited<ReturnType<typeof fetchRoute>>, index: number) => ({
          features: features,
          duration: trip.legs.reduce(
            (sum, { summary }) => sum + summary.time,
            0
          ),
          length: trip.legs.reduce(
            (sum, { summary }) => sum + summary.length,
            0
          ),
          locations: trip.locations.map((location) => location),
          transportationMode: options[index].costing,
          excludedLocations: options[index].exclude_locations,
          timeRange: options[index].time_range ?? 0,
        })
      );

      if (generation !== requestGeneration) return;
      set((state) => ({
        ...state,
        data: { path: shortestPath, hash },
        loading: false,
        progress: "",
        error: { ...initialState.error },
      }));
    } catch (err) {
      if (signal.aborted || generation !== requestGeneration) return;
      const errorMessage = toErrorMessage(err);
      set((state) => ({
        ...state,
        loading: false,
        progress: "",
        error: { retry: true, message: errorMessage },
      }));
    }
  },
  breakPathIntoSegments: (values: FieldValues): PathSegments => {
    const hash = hashObject(values);
    const params: CostingOption[] = [];
    for (let i = 0; i < values.options.length - 1; i++) {
      if (values.options[i].location && values.options[i + 1].location) {
        const options: Option[] = values.options.slice(i, i + 2);
        params.push(
          applyTransportationMode(
            values.options[i + 1].transportationMode,
            values.options[i + 1].timeRange,
            options.map(({ location }) => ({ ...location!, lat: Number(location!.lat), lon: Number(location!.lon) })),
            values.excludeLocations.map((location: Location) => ({ ...location, lat: Number(location.lat), lon: Number(location.lon) }))
          )
        );
      }
    }
    return { params, hash };
  },
  setShortestPath: (shortestPath: ShortestPathData[], hash: string) => {
    set((state) => ({
      ...state,
      data: { path: shortestPath, hash },
      loading: false,
      progress: "",
      error: { ...initialState.error },
    }));
  },
  resetShortestPath: () => {
    activeRequest?.abort(); requestGeneration++;
    set({ ...initialState });
  },
});

export const useShortestPath = create<ShortestPathContext>((set, get) => ({
  ...initState(),
  ...initActions(set, get),
}));
