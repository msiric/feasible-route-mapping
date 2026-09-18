const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../../functions/api/[[path]].js'),'utf8');
const modulePromise=import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const env={API_ORIGIN:'https://feasible-route-mapping-demo-api.onrender.com',DEMO_PROXY_SECRET:'synthetic-test-secret'};
const origin='https://feasible-route-mapping-demo.pages.dev';
const request=(pathname,headers={},body='{}')=>new Request(origin+pathname,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...headers},body});
test('Pages forwards only trusted routing headers and forces the configured backend',async()=>{
 const {onRequest}=await modulePromise;const original=global.fetch;let seen;
 global.fetch=async(url,options)=>{seen={url,options};return new Response('{}')};
 try {
  assert.equal((await onRequest({env,request:request('/api/route',{'X-Demo-Client-IP':'spoof','X-Demo-Proxy-Secret':'spoof','CF-Connecting-IP':'192.0.2.1',Cookie:'private=ignore'})})).status,200);
  assert.equal(seen.url.hostname,'feasible-route-mapping-demo-api.onrender.com');
  assert.equal(seen.options.headers.get('X-Demo-Proxy-Secret'),env.DEMO_PROXY_SECRET);assert.equal(seen.options.headers.get('X-Demo-Client-IP'),'192.0.2.1');assert.equal(seen.options.headers.get('Cookie'),null);
 }finally{global.fetch=original;}
});
test('Pages rejects foreign origin, unknown endpoints and oversized streams before forwarding',async()=>{
 const {onRequest}=await modulePromise;
 assert.equal((await onRequest({env,request:request('/api/route',{Origin:'https://foreign.test'})})).status,403);
 assert.equal((await onRequest({env,request:request('/api/status')})).status,404);
 assert.equal((await onRequest({env,request:request('/api/route',{},new Uint8Array(16385))})).status,413);
 assert.equal((await onRequest({env:{...env,API_ORIGIN:'https://example.com'},request:request('/api/route')})).status,503);
});
