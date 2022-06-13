import {
  Moped as MopedIcon,
  DirectionsCar as CarIcon,
  PedalBike as BicycleIcon,
  DirectionsWalk as PedestrianIcon,
  LocalShipping as TruckIcon,
  DirectionsBus as BusIcon,
} from "@mui/icons-material";
import { ReactElement } from "react";
import { Location } from "@contexts/shortestPath";

export type TransportationMode =
  | "bicycle"
  | "pedestrian"
  | "auto"
  | "truck"
  | "bus"
  | "motor_scooter";

export type CostingOption = {
  costing: TransportationMode;
  label: string;
  costing_options: {
    [K: string]: {
      exclude_polygons?: [];
      maneuver_penalty?: number;
      country_crossing_penalty?: number;
      country_crossing_cost?: number;
      use_ferry?: number;
      use_living_streets?: number;
      service_penalty?: number;
      service_factor?: number;
      shortest?: boolean;
      bicycle_type?: string;
      cycling_speed?: number;
      use_roads?: number;
      use_hills?: number;
      avoid_bad_surfaces?: number;
      walking_speed?: number;
      walkway_factor?: number;
      sidewalk_factor?: number;
      alley_factor?: number;
      driveway_factor?: number;
      step_penalty?: number;
      max_hiking_difficulty?: number;
      use_highways?: number;
      use_tolls?: number;
      ferry_cost?: number;
      use_tracks?: number;
      private_access_penalty?: number;
      ignore_closures?: boolean;
      closure_factor?: number;
      exclude_unpaved?: number;
      exclude_cash_only_tolls?: boolean;
      top_speed?: number;
      length?: number;
      width?: number;
      height?: number;
      weight?: number;
      axle_load?: number;
      hazmat?: boolean;
      use_primary?: number;
    };
  };
  exclude_polygons?: Location[];
  exclude_locations?: Location[];
  time_range?: number;
  locations: Location[];
  directions_options: { units: string };
  contours?: { time: number }[];
  isochrone_type?: string;
  id?: string;
};

export type CostingOptions = {
  [K in TransportationMode]: CostingOption;
};

export type TransportationModeOptions = {
  [K in TransportationMode]: TransportationModeOption;
};

export type TransportationModeOption = {
  label: string;
  color: string;
  icon: (styles: { [key: string]: string | number }) => ReactElement;
};

export const TRANSPORTATION_MODE_PROPERTIES: TransportationModeOptions = {
  bicycle: {
    label: "Bicycle",
    color: "#FF8C00",
    icon: (styles = {}) => <BicycleIcon style={{ ...styles }} />,
  },
  pedestrian: {
    label: "Pedestrian",
    color: "#FF0000",
    icon: (styles = {}) => <PedestrianIcon style={{ ...styles }} />,
  },
  auto: {
    label: "Car",
    color: "#00FF00",
    icon: (styles = {}) => <CarIcon style={{ ...styles }} />,
  },
  truck: {
    label: "Truck",
    color: "#FFFC00",
    icon: (styles = {}) => <TruckIcon style={{ ...styles }} />,
  },
  bus: {
    label: "Bus",
    color: "#00FFFF",
    icon: (styles = {}) => <BusIcon style={{ ...styles }} />,
  },
  motor_scooter: {
    label: "Motor scooter",
    color: "#FF00FF",
    icon: (styles = {}) => <MopedIcon style={{ ...styles }} />,
  },
};

export const TIME_RANGE_OPTIONS = {
  min: 0,
  max: 30,
};

export const TRANSPORTATION_MODE_OPTIONS: CostingOptions = {
  bicycle: {
    costing: "bicycle",
    label: "Bicycle",
    costing_options: {
      bicycle: {
        exclude_polygons: [],
        maneuver_penalty: 5,
        country_crossing_penalty: 0,
        country_crossing_cost: 600,
        use_ferry: 1,
        use_living_streets: 0.5,
        service_penalty: 15,
        service_factor: 1,
        shortest: false,
        bicycle_type: "Hybrid",
        cycling_speed: 20,
        use_roads: 0.5,
        use_hills: 0.5,
        avoid_bad_surfaces: 0.25,
      },
    },
    exclude_polygons: [],
    exclude_locations: [],
    locations: [],
    directions_options: { units: "kilometers" },
    id: "valhalla_directions",
  },
  pedestrian: {
    costing: "pedestrian",
    label: "Pedestrian",
    costing_options: {
      pedestrian: {
        exclude_polygons: [],
        use_ferry: 1,
        service_penalty: 15,
        service_factor: 1,
        shortest: false,
        use_hills: 0.5,
        walking_speed: 5.1,
        walkway_factor: 1,
        sidewalk_factor: 1,
        alley_factor: 2,
        driveway_factor: 5,
        step_penalty: 0,
        max_hiking_difficulty: 1,
      },
    },
    exclude_polygons: [],
    exclude_locations: [],
    locations: [],
    directions_options: { units: "kilometers" },
    id: "valhalla_directions",
  },
  auto: {
    costing: "auto",
    label: "Car",
    costing_options: {
      auto: {
        exclude_polygons: [],
        maneuver_penalty: 5,
        country_crossing_penalty: 0,
        country_crossing_cost: 600,
        width: 1.6,
        height: 1.9,
        use_highways: 1,
        use_tolls: 1,
        use_ferry: 1,
        ferry_cost: 300,
        use_living_streets: 0.5,
        use_tracks: 0,
        private_access_penalty: 450,
        ignore_closures: false,
        closure_factor: 9,
        service_penalty: 15,
        service_factor: 1,
        exclude_unpaved: 1,
        shortest: false,
        exclude_cash_only_tolls: false,
        top_speed: 140,
      },
    },
    exclude_polygons: [],
    exclude_locations: [],
    locations: [],
    directions_options: { units: "kilometers" },
    id: "valhalla_directions",
  },
  truck: {
    costing: "truck",
    label: "Truck",
    costing_options: {
      truck: {
        exclude_polygons: [],
        maneuver_penalty: 5,
        country_crossing_penalty: 0,
        country_crossing_cost: 600,
        length: 21.5,
        width: 1.6,
        height: 1.9,
        weight: 21.77,
        axle_load: 9,
        hazmat: false,
        use_highways: 1,
        use_tolls: 1,
        use_ferry: 1,
        ferry_cost: 300,
        use_living_streets: 0.5,
        use_tracks: 0,
        private_access_penalty: 450,
        ignore_closures: false,
        closure_factor: 9,
        service_penalty: 15,
        service_factor: 1,
        exclude_unpaved: 1,
        shortest: false,
        exclude_cash_only_tolls: false,
        top_speed: 140,
      },
    },
    exclude_polygons: [],
    exclude_locations: [],
    locations: [],
    directions_options: { units: "kilometers" },
    id: "valhalla_directions",
  },
  bus: {
    costing: "bus",
    label: "Bus",
    costing_options: {
      bus: {
        exclude_polygons: [],
        maneuver_penalty: 5,
        country_crossing_penalty: 0,
        country_crossing_cost: 600,
        length: 21.5,
        width: 1.6,
        height: 1.9,
        weight: 21.77,
        use_highways: 1,
        use_tolls: 1,
        use_ferry: 1,
        ferry_cost: 300,
        use_tracks: 0,
        private_access_penalty: 450,
        ignore_closures: false,
        closure_factor: 9,
        service_penalty: 15,
        service_factor: 1,
        exclude_unpaved: 1,
        shortest: false,
        exclude_cash_only_tolls: false,
        top_speed: 140,
      },
    },
    exclude_polygons: [],
    exclude_locations: [],
    locations: [],
    directions_options: { units: "kilometers" },
    id: "valhalla_directions",
  },
  motor_scooter: {
    costing: "motor_scooter",
    label: "Motor scooter",
    costing_options: {
      motor_scooter: {
        exclude_polygons: [],
        use_ferry: 1,
        use_tracks: 0,
        shortest: false,
        use_hills: 0.5,
        top_speed: 140,
        use_primary: 0.5,
      },
    },
    exclude_polygons: [],
    exclude_locations: [],
    locations: [],
    directions_options: { units: "kilometers" },
    id: "valhalla_directions",
  },
};

export const applyTransportationMode = (
  costing: TransportationMode = "auto",
  timeRange = 0,
  locations: Location[] = [],
  excludedLocations: Location[] = [],
  isReversed = false,
  contours: { time: number }[] | null = null,
  costingOptions = {}
): CostingOption => ({
  ...TRANSPORTATION_MODE_OPTIONS[costing],
  costing_options: {
    ...TRANSPORTATION_MODE_OPTIONS[costing].costing_options,
    [costing]: {
      ...TRANSPORTATION_MODE_OPTIONS[costing].costing_options[costing],
      ...costingOptions,
    },
  },
  locations,
  exclude_locations: excludedLocations,
  time_range: timeRange,
  ...(contours ? { contours } : {}),
  ...(isReversed ? { isochrone_type: "reverse" } : {}),
});
