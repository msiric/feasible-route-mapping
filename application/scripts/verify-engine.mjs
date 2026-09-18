// Real engine validation; exports the precomputed public showcase through free CI logs.
// No Actions artifacts, image cache uploads, repository writes or production credentials.
import assert from 'node:assert/strict';
import {gzipSync} from 'node:zlib';
import {mkdir,writeFile} from 'node:fs/promises';
import {createPlan,calculateRegions} from '../client/src/demo/calculation.mjs';
import {requestRouting,routeJourney} from '../client/src/demo/requests.mjs';
const root=process.env.DEMO_API_URL || 'http://127.0.0.1:5076';
const origin=process.env.CLIENT_URI || 'https://demo.pages.dev';
const headers={'Content-Type':'application/json',Origin:origin,'X-Demo-Proxy-Secret':process.env.DEMO_PROXY_SECRET || ''};
const A={lat:-34.9253,lon:138.5998,type:'break',display_name:'Adelaide Town Hall'};
const B={lat:-34.9210,lon:138.6040,type:'break',display_name:'Art Gallery of South Australia'};
for(let i=0;i<90;i++) {
 try {const response=await fetch(root+'/healthz',{signal:AbortSignal.timeout(2000)});if(response.ok)break;}catch{}
 if(i===89)throw new Error('Engine startup exceeded 90 seconds');
 await new Promise(resolve=>setTimeout(resolve,1000));
}
async function request(action,body) {
 const start=Date.now();
 const result=await requestRouting(action,body,{
  fetchImpl:(path,init)=>fetch(root+path,{...init,headers}),
  onWait:seconds=>console.log(JSON.stringify({waitingSeconds:seconds})),
 });
 console.log(JSON.stringify({action,mode:body.costing,reverse:body.reverse,seconds:(Date.now()-start)/1000}));return result;
}
const modes=['auto','bicycle','pedestrian','truck','bus','motor_scooter'];
for(const costing of modes) {
 const route=await request('route',{costing,locations:[A,B]});assert.ok(route.trip.summary.time>0);assert.ok(route.trip.legs[0].shape.length);
 for(const reverse of [false,true]) {
  const iso=await request('isochrone',{costing,locations:[reverse?B:A],reverse,contours:[{time:2},{time:3.1234},{time:20},{time:40}]});
  assert.ok(iso.features.some(f=>Math.abs(f.properties.contour-3.1234)<0.00011),'Fractional contour labels must match requested minutes');
  assert.ok(iso.features.every(f=>['Polygon','MultiPolygon'].includes(f.geometry.type)));
 }
}
const excluded={lat:-34.9235,lon:138.6007};
const excludedRoute=await request('route',{costing:'auto',locations:[A,B],exclude_locations:[excluded]});assert.ok(excludedRoute.trip.summary.time>0);
const invalid=await fetch(root+'/api/route',{method:'POST',headers,body:JSON.stringify({costing:'auto',locations:[A,{lat:0,lon:0}]})});assert.equal(invalid.status,400);
const direct=await fetch(root+'/api/route',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({costing:'auto',locations:[A,B]})});assert.equal(direct.status,403);
function decode(shape) {
 let index=0,lat=0,lon=0;const result=[];
 function value(){let v=0,shift=0,b;do{b=shape.charCodeAt(index++)-63;v|=(b&31)<<shift;shift+=5;}while(b>=32);return v&1?~(v>>1):v>>1;}
 while(index<shape.length){lat+=value();lon+=value();result.push([lat/1e6,lon/1e6]);}return result;
}
const point=(display_name,lat,lon)=>({display_name,lat,lon,type:'break'});
const stops=[point('Glenelg Jetty',-34.9800,138.5110),point('Adelaide Central Market',-34.9297,138.5980),B,point('Norwood',-34.9210,138.6350)];
const options=[{location:stops[0]},...stops.slice(1).map((location,i)=>({location,timeRange:[480,300,480][i],transportationMode:['auto','pedestrian','bicycle'][i]}))];
async function calculateJourney(options) {
 const params=options.slice(1).map((destination,i)=>({costing:destination.transportationMode,locations:[options[i].location,destination.location]}));
 const trips=await routeJourney(params,params=>request('route',params),new AbortController().signal);
 const path=[],regions=[];
 for(const [i,route] of trips.entries()) {
  const duration=route.trip.summary.time,slack=options[i+1].timeRange,plan=createPlan(duration,slack),features=[[],[]];
  for(const [direction,groups] of [plan.forward,plan.reverse].entries())for(const times of groups) {
   const response=await request('isochrone',{costing:params[i].costing,locations:[params[i].locations[direction]],reverse:!!direction,contours:times.map(time=>({time}))});features[direction].push(...response.features);
  }
  const shapes=calculateRegions(plan,...features);
  assert.ok(shapes.length,`Segment ${i+1} must contain feasible areas`);
  regions.push(...shapes);
  path.push({features:route.trip.legs.flatMap(leg=>decode(leg.shape)),duration,length:route.trip.summary.length,locations:params[i].locations,transportationMode:params[i].costing,excludedLocations:[],timeRange:slack});
  console.log(JSON.stringify({segment:i+1,mode:params[i].costing,minutes:duration/60,kilometers:route.trip.summary.length,regions:shapes.length}));
 }
 return {path,regions};
}
const {path,regions}=await calculateJourney(options);
assert.equal(path.length,3);assert.equal(new Set(path.map(p=>p.transportationMode)).size,3);
const sample={generatedAt:new Date().toISOString(),source:'OpenStreetMap contributors / Geofabrik South Australia extract retrieved 2026-09-17; ODbL 1.0',values:{options,excludeLocations:[]},path,regions};
// Exercise every leg of the maximum supported journey, including its areas.
const eightStops=[A,B,point('Adelaide Botanic Garden',-34.9194,138.6114),point('Rundle Mall',-34.9225,138.6020),point('Adelaide Railway Station',-34.9210,138.5965),point('Adelaide Oval',-34.9155,138.5960),stops[1],point('Unley',-34.9500,138.6070)];
const eight=await calculateJourney(eightStops.map((location,i)=>i?{location,timeRange:0,transportationMode:'pedestrian'}:{location}));
assert.equal(eight.path.length,7);assert.ok(eight.regions.length>=7);
const json=JSON.stringify(sample);
await mkdir('application/client/public/demo',{recursive:true});await writeFile('application/client/public/demo/sample.json',json+'\n');
const encoded=gzipSync(json).toString('base64');
for(let offset=0;offset<encoded.length;offset+=8000)console.log('DEMO_SAMPLE_PART:'+encoded.slice(offset,offset+8000));
console.log(JSON.stringify({result:'PASS',sixModes:true,reverse:true,fractionalContours:true,exclusions:true,regions:regions.length,sampleBytes:json.length,eightLocationJourney:true}));
