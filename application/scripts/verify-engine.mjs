// Real engine validation; exports the tiny synthetic public example through free CI logs.
// No Actions artifacts, image cache uploads, repository writes or production credentials.
import assert from 'node:assert/strict';
import {gzipSync} from 'node:zlib';
import {mkdir,writeFile} from 'node:fs/promises';
import {createPlan,calculateRegions} from '../client/src/demo/calculation.mjs';
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
 const start=Date.now();const response=await fetch(root+'/api/'+action,{method:'POST',headers,body:JSON.stringify(body),signal:AbortSignal.timeout(90000)});
 const result=await response.json();assert.equal(response.status,200,JSON.stringify(result));
 console.log(JSON.stringify({action,mode:body.costing,reverse:body.reverse,seconds:(Date.now()-start)/1000}));return result;
}
const modes=['auto','bicycle','pedestrian','truck','bus','motor_scooter'];
for(const costing of modes) {
 const route=await request('route',{costing,locations:[A,B]});assert.ok(route.trip.summary.time>0);assert.ok(route.trip.legs[0].shape.length);
 for(const reverse of [false,true]) {
  const iso=await request('isochrone',{costing,locations:[reverse?B:A],reverse,contours:[{time:2},{time:3.1234}]});
  assert.ok(iso.features.some(f=>Math.abs(f.properties.contour-3.1234)<0.00011),'Fractional contour labels must match requested minutes');
  assert.ok(iso.features.every(f=>['Polygon','MultiPolygon'].includes(f.geometry.type)));
 }
}
const excluded={lat:-34.9235,lon:138.6007};
const excludedRoute=await request('route',{costing:'auto',locations:[A,B],exclude_locations:[excluded]});assert.ok(excludedRoute.trip.summary.time>0);
const invalid=await fetch(root+'/api/route',{method:'POST',headers,body:JSON.stringify({costing:'auto',locations:[A,{lat:0,lon:0}]})});assert.equal(invalid.status,400);
const direct=await fetch(root+'/api/route',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({costing:'auto',locations:[A,B]})});assert.equal(direct.status,403);
const route=await request('route',{costing:'pedestrian',locations:[A,B]});
const duration=route.trip.summary.time,slack=300,plan=createPlan(duration,slack),features=[[],[]];
for(const [direction,groups] of [plan.forward,plan.reverse].entries())for(const times of groups) {
 const response=await request('isochrone',{costing:'pedestrian',locations:[direction?B:A],reverse:!!direction,contours:times.map(time=>({time}))});features[direction].push(...response.features);
}
const regions=calculateRegions(plan,...features);assert.ok(regions.length,'Sample must contain feasible areas');
function decode(shape) {
 let index=0,lat=0,lon=0;const result=[];
 function value(){let v=0,shift=0,b;do{b=shape.charCodeAt(index++)-63;v|=(b&31)<<shift;shift+=5;}while(b>=32);return v&1?~(v>>1):v>>1;}
 while(index<shape.length){lat+=value();lon+=value();result.push([lat/1e6,lon/1e6]);}return result;
}
const sample={generatedAt:new Date().toISOString(),source:'OpenStreetMap contributors / Geofabrik South Australia extract retrieved 2026-09-17; ODbL 1.0',values:{options:[{location:A},{location:B,timeRange:slack,transportationMode:'pedestrian'}],excludeLocations:[]},path:[{features:route.trip.legs.flatMap(leg=>decode(leg.shape)),duration,length:route.trip.summary.length,locations:[A,B],transportationMode:'pedestrian',excludedLocations:[],timeRange:slack}],regions};
const json=JSON.stringify(sample);
await mkdir('application/client/public/demo',{recursive:true});await writeFile('application/client/public/demo/sample.json',json+'\n');
const encoded=gzipSync(json).toString('base64');
for(let offset=0;offset<encoded.length;offset+=8000)console.log('DEMO_SAMPLE_PART:'+encoded.slice(offset,offset+8000));
console.log(JSON.stringify({result:'PASS',sixModes:true,reverse:true,fractionalContours:true,exclusions:true,regions:regions.length,sampleBytes:json.length}));
