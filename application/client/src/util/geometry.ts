import { ShortestSegment } from "@api/endpoints";
import * as turf from "@turf/turf";
import { Feature, Position, Geometry } from "@turf/turf";
import { decode } from "@util/polyline";
import { LatLngExpression, LatLngLiteral } from "leaflet";

const NUMBER_OF_DECIMALS = 6;

export const calcIntersection = (
  polygon1: Position[],
  polygon2: Position[]
): Feature<Geometry> | null => {
  return turf.intersect(turf.polygon([polygon1]), turf.polygon([polygon2]));
};

export const calcArea = (coordinates: Position[]): number => {
  const polygon = turf.polygon([coordinates]);
  return turf.area(polygon) / 1000000;
};

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
