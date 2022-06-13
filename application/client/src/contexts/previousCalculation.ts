import { TransportationMode } from "@util/options";
import { LatLngExpression } from "leaflet";
import create, { GetState, SetState } from "zustand";
import { Location } from "@contexts/shortestPath";
import { FieldValues } from "react-hook-form";
import hashObject from "object-hash";

export interface PreviousCalculationData {
  features: LatLngExpression[];
  duration: number;
  length: number;
  locations: Location[];
  transportationMode: TransportationMode;
  excludedLocations?: Location[];
  timeRange: number;
}

export interface PreviousCalculationState {
  path: PreviousCalculationData[];
  values: FieldValues;
  hash: string;
}

export interface PreviousCalculationActions {
  setPreviousCalculation: (
    path: PreviousCalculationData[],
    values: FieldValues
  ) => void;
  resetPreviousCalculation: () => void;
}

export type PreviousCalculationContext = PreviousCalculationState &
  PreviousCalculationActions;

const initialState: PreviousCalculationState = {
  path: [],
  values: [],
  hash: "",
};

const initState = () => ({
  ...initialState,
});

const initActions = (
  set: SetState<PreviousCalculationContext>,
  get: GetState<PreviousCalculationContext>
) => ({
  setPreviousCalculation: (
    path: PreviousCalculationData[],
    values: FieldValues
  ) => {
    const hash = hashObject(values);
    set({ path, values, hash });
  },
  resetPreviousCalculation: () => {
    set({ ...initialState });
  },
});

export const usePreviousCalculation = create<PreviousCalculationContext>(
  (set, get) => ({
    ...initState(),
    ...initActions(set, get),
  })
);
