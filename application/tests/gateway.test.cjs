const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createGateway,validate}=require('../dist/demo/gateway');
const A={lat:-34.9253,lon:138.5998}, B={lat:-34.921,lon:138.604};
const route={costing:'auto',locations:[A,B]};
const iso={costing:'auto',locations:[B],contours:[{time:1},{time:2.1234}],reverse:true};
const secret='x'.repeat(64),origin='https://demo.pages.dev';
async function serve(t,options={}) {
 const server=createGateway({secret,origin,production:true,...options}).listen(0,'127.0.0.1');
 await new Promise(resolve=>server.once('listening',resolve));
 t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve)}));
 return (path,body,headers={})=>fetch(`http://127.0.0.1:${server.address().port}${path}`,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',Origin:origin,'X-Demo-Proxy-Secret':secret,...headers},body:body?JSON.stringify(body):undefined});
}
test('all six modes use trusted profiles and discard caller-supplied engine options',()=>{
 for(const costing of ['auto','bicycle','pedestrian','truck','bus','motor_scooter']) {
 const value=validate('route',{...route,costing,costing_options:{[costing]:{top_speed:99999}},url:'https://evil.test',alternates:10});
 assert.equal(value.costing,costing);assert.notEqual(value.costing_options[costing].top_speed,99999);assert.equal(value.url,undefined);assert.equal(value.alternates,undefined);
 }
});
test('reverse expansion, fractional minutes, polygons and disconnected regions are retained',()=>{
 const value=validate('isochrone',iso);assert.equal(value.reverse,true);assert.equal(value.polygons,true);assert.equal(value.denoise,0);assert.equal(value.contours[1].time,2.1234);
 assert.equal(validate('isochrone',{...iso,reverse:false}).reverse,false);
});
test('region, distance, contour, location, mode and exclusion limits reject invalid input',()=>{
 for(const value of [{...route,costing:'transit'},{...route,locations:[A,{lat:0,lon:0}]},{...route,locations:[A,{lat:-30,lon:138}]},{...route,locations:[A,A,A]},{...route,locations:[{lat:'-34',lon:138},A]},{...route,exclude_locations:Array(9).fill(A)}])assert.throws(()=>validate('route',value));
 for(const contours of [[],[{time:0}],[{time:41}],[{time:NaN}],Array(5).fill({time:2})])assert.throws(()=>validate('isochrone',{...iso,contours}));
});
test('health does not query the engine and public requests need both proxy secret and origin',async t=>{
 let calls=0;const request=await serve(t,{fetcher:async()=>{calls++;return Response.json({})}});
 assert.equal((await request('/healthz')).status,200);assert.equal(calls,0);
 assert.equal((await request('/api/route',route,{'X-Demo-Proxy-Secret':''})).status,403);
 assert.equal((await request('/api/route',route,{Origin:'https://foreign.test'})).status,403);assert.equal(calls,0);
});
test('gateway caches successful responses, validates before fetching, and exposes no arbitrary engine endpoint',async t=>{
 let calls=0;const request=await serve(t,{fetcher:async(_url,init)=>{calls++;assert.equal(JSON.parse(init.body).costing,'auto');return Response.json({trip:{status:0}})}});
 assert.equal((await request('/api/route',route)).status,200);assert.equal((await request('/api/route',route)).status,200);assert.equal(calls,1);
 assert.equal((await request('/api/route',{...route,costing:'evil'})).status,400);
 assert.equal((await request('/api/status',route)).status,404);assert.equal(calls,1);
 assert.equal((await request('/api/route',{...route,padding:'x'.repeat(17000)})).status,413);
});
test('engine work is serialized, oversized responses are rejected, and failures do not poison the queue',async t=>{
 let active=0,peak=0;
 const request=await serve(t,{fetcher:async()=>{active++;peak=Math.max(peak,active);await new Promise(r=>setTimeout(r,20));active--;return Response.json({ok:true})}});
 const answers=await Promise.all([0,1,2].map(n=>request('/api/route',{...route,locations:[A,{lat:B.lat+n/1000,lon:B.lon}]})));
 assert.equal(peak,1);assert.ok(answers.every(r=>r.status===200));
 const large=await serve(t,{fetcher:async()=>new Response('x'.repeat(2000001))});assert.equal((await large('/api/route',route)).status,503);
 const failed=await serve(t,{fetcher:async()=>{throw new Error('private internal detail')}});const result=await failed('/api/route',route);assert.equal(result.status,503);assert.ok(!(await result.text()).includes('private internal detail'));
});

test('fractional contour identity survives the engine’s two-decimal JSON labels',async t=>{
 const request=await serve(t,{fetcher:async(_url,init)=>{
  const p=JSON.parse(init.body);return Response.json({type:'FeatureCollection',features:p.contours.map(c=>({type:'Feature',properties:{color:'#'+c.color,contour:Math.round(c.time*100)/100},geometry:{type:'Polygon',coordinates:[]}}))});
 }});
 const response=await request('/api/isochrone',iso);assert.equal(response.status,200);const data=await response.json();assert.equal(data.features[1].properties.contour,2.1234);
});
