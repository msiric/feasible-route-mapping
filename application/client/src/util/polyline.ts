import { LatLngExpression } from "leaflet";

export const decode = (str: string, precision: number) => {
  const coordinates: LatLngExpression[] = [];
  let byte: null | number = null;
  let latitude_change: number;
  let longitude_change: number;
  let index = 0;
  let lat = 0;
  let lng = 0;
  let shift = 0;
  let result = 0;

  const factor = Math.pow(10, precision || 6);

  while (index < str.length) {
    byte = null;
    shift = 0;
    result = 0;

    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    latitude_change = result & 1 ? ~(result >> 1) : result >> 1;

    shift = result = 0;

    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    longitude_change = result & 1 ? ~(result >> 1) : result >> 1;

    lat += latitude_change;
    lng += longitude_change;

    coordinates.push([lat / factor, lng / factor] as LatLngExpression);
  }

  return coordinates;
};
