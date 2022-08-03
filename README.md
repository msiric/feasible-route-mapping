# Feasible Route Mapping

Demo application accompanying the research done for my master's thesis.

Live demo: https://feasible-route-mapping.herokuapp.com/

![Demo (1)](https://user-images.githubusercontent.com/26199969/173581085-8df371cd-db74-4d98-8098-08f2a9b524bc.gif)

## Introduction

When examining timestamped geolocation data, it is often useful to determine feasible routes which could be taken from one location to another.

For criminal investigation, a heat map of reachable regions in a specific time period would support investigators with a means to rapidly evaluate the context of movement in and around a crime.

## Goals and motivation

The main goal of this thesis is to build an algorithm that is capable of finding all the areas that a suspect could have reached while en route between points in a set time frame, taking into account time and mode of transportation constraints.

This is accomplished by utilising OpenStreetMap as a map data provider, Leaflet as an open-source library for mobile-friendly interactive maps, and Valhalla as an open-source routing engine.

One of the key features of Valhalla that made this research possible is the concept of isochrones.

An isochrone is a line that connects points of equal travel time about a given location, from the Greek roots of “iso” for equal and “chrone” for time. Valhalla's isochrone service computes areas that are reachable within specified time intervals from a location and returns the reachable regions as contours of polygons or lines that can be displayed on a map.

## Results

Journey's locations, time ranges and modes of transportation are provided by the user. The journey is broken into a sequence of segments: (x<sub>i</sub>, t<sub>i</sub>) to (x<sub>i+1</sub>, t<sub>i+1</sub>).

Valhalla’s routing engine is used to calculate the shortest journey between x<sub>i</sub> and x<sub>i+1</sub>, taking into account the specified mode of transportation. This is the minimum feasible journey time t<sub>min</sub>. 

Using the provided timestamp data, the maximum journey time is calculated for this segment t<sub>max</sub> = t<sub>i+1</sub> - t<sub>i</sub> since it is guaranteed that the journey does not take any longer than this to be traversed. 

Valhalla’s isochrone calculation is exploited to return the data for each segment of the journey (each pair defined as origin x<sub>i</sub> and destination x<sub>i+1</sub>). Isochrones are calculated for the first point x<sub>i</sub>, defined as an origin isochrone, with the range set to t<sub>min</sub> and the interval step set to 60 seconds up until it reaches t<sub>max</sub>. This means that if the minimum time to reach x<sub>i+1</sub> from x<sub>i</sub> is 10 minutes and the maximum time is 15 minutes, isochrones will be calculated for x<sub>i</sub> starting with 10 minutes increments of 60 seconds until the maximum time of 15 minutes is calculated.

This process is repeated for the second point x<sub>i+1</sub>, with the exception that this position is defined as a destination isochrone. This finalizes the first segment of the journey. This keeps going until each segment is processed and all the isochrones for each point are saved.

The isochrones are returned as a list of coordinates which form polygons (areas that could be reached in the specified time range).

For each pair, an intersection of polygons is calculated starting from the isochrone with the minimum interval step for x<sub>i</sub> and the isochrone with the maximum interval step for x<sub>i+1</sub>. For each subsequent calculation, the interval step is incremented for x<sub>i</sub> and decremented for x<sub>i+1</sub> until we exhaust all of the isochrones for both positions.

All of the intersecting polygons are overlayed to show the possible reach of the journey constrained to each interval step.

The result is a visualisation of all the potentially reachable areas with the hottest (colored in shades of red) ones having a minimum deviation and the coolest (colored in shades of green) ones having a maximum deviation from the shortest journey.

The algorithm is also capable of excluding certain routes from the calculation of both the shortest path and the isochrones for any position that is affected by said routes. This is significant since it is often easier to conclude that a suspect hasn’t traversed a specific route than it is to confirm that a route has been crossed by a suspect (surveillance footage discounting a route, roadblock preventing passage, etc.).

## Implementation

The application is composed of a client application and a containerised server.
The client application is written in TypeScript using React with a Node.js wrapper while the server is running as a Docker image bootstrapped by the [GIS OPS](https://github.com/gis-ops/docker-valhalla) organisation.

In order for the server to compute and return direction and isochrone information, map data needs to be downloaded in the `.osm.pbf` format.

Afterwards, tile information needs to be built using said data to generate a graph structure and make the map usable for routing and isochrone calculation.

The client consumes the server logic via a REST API and handles the computation of polygon intersections and the subsequent heat map visualisation.
