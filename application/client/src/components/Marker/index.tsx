import { useRef } from "react";
import { Marker, Tooltip } from "react-leaflet";
import L, { Marker as MarkerRef } from "leaflet";
import classes from "@components/Marker/style.module.css";
import { LatLng } from "leaflet";
import LocationIcon from "../../assets/location-icon.png";
import ExclusionIcon from "../../assets/exclusion-icon.png";
import MarkerShadow from "../../assets/marker-shadow.png";
import { Location } from "@contexts/shortestPath";

export enum MarkerType {
  LOCATION = "LOCATION",
  EXCLUSION = "EXCLUSION",
}

interface MapMarkerProps {
  index: number;
  position: Location;
  isDraggable: boolean;
  label?: string | number;
  type?: MarkerType;
  opacity?: number;
  handleMarkerShift?: (index: number, coordinate: LatLng) => void;
}

const MARKER_ICONS = {
  [MarkerType.LOCATION]: LocationIcon,
  [MarkerType.EXCLUSION]: ExclusionIcon,
};

const getNumberOfDigits = (value: number) =>
  (Math.log(value) * Math.LOG10E + 1) | 0;

export const MapMarker = ({
  index,
  position,
  isDraggable,
  label,
  type = MarkerType.LOCATION,
  opacity = 1,
  handleMarkerShift = () => null,
}: MapMarkerProps) => {
  const markerRef = useRef<MarkerRef | null>(null);

  const myIcon = L.icon({
    iconUrl: MARKER_ICONS[type],
    iconSize: [25, 41],
    iconAnchor: [13, 41],
    shadowUrl: MarkerShadow,
  });

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker !== null) {
        handleMarkerShift(index, marker.getLatLng());
      }
    },
  };

  const digits = getNumberOfDigits(label as number);

  return (
    <Marker
      icon={myIcon}
      position={[position.lat, position.lon]}
      draggable={isDraggable}
      pane={isDraggable ? "markerPane" : "shadowPane"}
      eventHandlers={eventHandlers}
      ref={markerRef}
    >
      {label && (
        <Tooltip
          key={label}
          className={`${classes.tooltip} ${
            digits === 2 ? classes.doubleDigitOffset : classes.singleDigitOffset
          }`}
          opacity={opacity}
          direction="left"
          pane={isDraggable ? "tooltipPane" : "markerPane"}
          permanent
        >
          {label}
        </Tooltip>
      )}
    </Marker>
  );
};
