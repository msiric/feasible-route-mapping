import { fetchIsochrone, Isochrone } from "@api/endpoints";
import { Location } from "@contexts/shortestPath";
import { Feature, Geometry, Position } from "@turf/turf";
import { toErrorMessage } from "@util/error";
import { calcArea, calcIntersection } from "@util/geometry";
import { applyTransportationMode, TransportationMode } from "@util/options";
import create, { GetState, SetState } from "zustand";
import { ShortestPathData } from "@contexts/shortestPath";

export type IsochroneIntersectionsData = Feature<Geometry> & {
  order?: number;
};

export interface IsochroneIntersectionsError {
  retry: boolean;
  message: string;
}

export interface IsochroneIntersectionsState {
  data: IsochroneIntersectionsData[];
  loading: boolean;
  error: IsochroneIntersectionsError;
}

export interface IsochroneIntersectionsActions {
  fetchSegmentIsochrones: (
    locations: Location[],
    duration: number,
    range: number,
    transportationMode: TransportationMode,
    excludedLocations: Location[]
  ) => Promise<Isochrone[][]>;
  findIsochroneIntersections: (path: ShortestPathData[]) => Promise<void>;
  resetIsochroneIntersections: () => void;
}

export type IsochroneIntersectionsContext = IsochroneIntersectionsState &
  IsochroneIntersectionsActions;

const getColor = (value: number) => {
  const hue = ((1 - value) * 120).toString(10);
  return ["hsl(", hue, ",100%,50%)"].join("");
};

const formatIntersection = (
  coordinate: Position[][],
  intervals: number,
  counter: number
): IsochroneIntersectionsData => {
  const coordinates = coordinate.flat();
  const areaColor = getColor((intervals - counter + 1) / intervals);
  return {
    type: "Feature",
    geometry: {
      coordinates,
      type: "Polygon",
    },
    properties: {
      stroke: true,
      fill: true,
      fillColor: areaColor,
      color: areaColor,
      contour: intervals - counter + 1,
      area: calcArea(coordinates) || 0,
    },
    order: counter,
  };
};

const initialState: IsochroneIntersectionsState = {
  data: [],
  loading: false,
  error: { retry: false, message: "" },
};

const initState = () => ({
  ...initialState,
});

const initActions = (
  set: SetState<IsochroneIntersectionsContext>,
  get: GetState<IsochroneIntersectionsContext>
) => ({
  fetchSegmentIsochrones: async (
    locations: Location[],
    duration: number,
    range: number,
    transportationMode: TransportationMode,
    excludedLocations: Location[]
  ): Promise<Isochrone[][]> => {
    try {
      set((state) => ({
        ...state,
        data: [],
        loading: true,
        error: { ...initialState.error },
      }));
      const totalTime = duration + range;
      const upperBound = (totalTime - (totalTime % 60) - 60) / 60;
      const intervalSteps = Array(upperBound)
        .fill(1)
        .map((item, index) => (index + item) * 60);
      return await Promise.all(
        intervalSteps.map(
          async (time) =>
            await Promise.all(
              locations.map(async (location, index) => {
                const params = applyTransportationMode(
                  transportationMode,
                  range,
                  [location],
                  excludedLocations,
                  index !== 0,
                  [{ time: time / 60 }]
                );
                return fetchIsochrone(params);
              })
            )
        )
      );
    } catch (err) {
      const errorMessage = toErrorMessage(err);
      set((state) => ({
        ...state,
        loading: false,
        error: { retry: true, message: errorMessage },
      }));
      return [];
    }
  },
  findIsochroneIntersections: async (
    path: ShortestPathData[]
  ): Promise<void> => {
    const fetchSegmentIsochrones = get().fetchSegmentIsochrones;
    const isochrones = await Promise.all(
      path.map(
        async (segment) =>
          await fetchSegmentIsochrones(
            segment.locations,
            segment.duration,
            segment.timeRange ?? 0,
            segment.transportationMode,
            segment.excludedLocations ?? []
          )
      )
    );
    const intersections: IsochroneIntersectionsData[] = [];
    for (const [index, segment] of path.entries()) {
      const intervals = (segment.timeRange - (segment.timeRange % 60)) / 60;
      for (let counter = 1; counter <= intervals; counter++) {
        let start = 0;
        let end = isochrones[index].length - counter;
        while (end >= 0) {
          const originCoordinates =
            isochrones[index][start][0].features[0].geometry.coordinates;
          const destinationCoordinates =
            isochrones[index][end][1].features[0].geometry.coordinates;
          const calculation = calcIntersection(
            originCoordinates as Position[],
            destinationCoordinates as Position[]
          );
          if (calculation?.geometry?.coordinates) {
            if (calculation.geometry.type === "MultiPolygon") {
              calculation.geometry.coordinates.forEach((coordinate) => {
                const intersection = formatIntersection(
                  coordinate as Position[][],
                  intervals,
                  counter
                );
                intersections.push(intersection);
              });
            } else {
              const intersection = formatIntersection(
                calculation.geometry.coordinates as Position[][],
                intervals,
                counter
              );
              intersections.push(intersection);
            }
          }
          start++;
          end--;
        }
      }
    }
    const sortedIntersections = intersections.sort(
      (a, b) => a.order! - b.order!
    );
    set((state) => ({
      ...state,
      data: sortedIntersections,
      loading: false,
      error: { ...initialState.error },
    }));
  },
  resetIsochroneIntersections: () => {
    set({ ...initialState });
  },
});

export const useIsochroneIntersections = create<IsochroneIntersectionsContext>(
  (set, get) => ({
    ...initState(),
    ...initActions(set, get),
  })
);
