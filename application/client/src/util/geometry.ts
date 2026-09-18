import { ShortestSegment } from "@api/endpoints";
import { decode } from "@util/polyline";
import { LatLngExpression, LatLngLiteral } from "leaflet";

const NUMBER_OF_DECIMALS = 6;

export const parseGeometry = (data: ShortestSegment): LatLngExpression[] => {
  const coordinates: LatLngExpression[] = [];

  for (const feat of data.trip.legs) {
    coordinates.push(...decode(feat.shape, 6));
  }

  return coordinates;
};

const toFixedNumber = (num: number, digits: number, base = 10) => {
  const pow = Math.pow(base, digits);
  return Math.round(num * pow) / pow;
};

export const formatLocation = ({ lat, lng }: LatLngLiteral) => ({
  lat: toFixedNumber(lat, NUMBER_OF_DECIMALS),
  lon: toFixedNumber(lng, NUMBER_OF_DECIMALS),
});
