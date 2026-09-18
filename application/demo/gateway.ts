import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import { timingSafeEqual } from 'node:crypto';
import profiles from './profiles.json';

export class InputError extends Error {}
const point = (p: any) => {
  if (!p || typeof p.lat !== 'number' || typeof p.lon !== 'number' || !Number.isFinite(p.lat) || !Number.isFinite(p.lon) || p.lat < -38.2 || p.lat > -25.8 || p.lon < 128.9 || p.lon > 141.1) throw new InputError('Choose a location in South Australia.');
  return { lat: +p.lat.toFixed(6), lon: +p.lon.toFixed(6) };
};
export function validate(action: string, body: any) {
  if (!body || !Object.hasOwn(profiles, body.costing)) throw new InputError('Choose one of the six supported travel modes.');
  if (!Array.isArray(body.locations) || body.locations.length !== (action === 'route' ? 2 : 1)) throw new InputError('Invalid number of locations.');
  const locations = body.locations.map(point);
  if (action === 'route') {
    const [a,b] = locations;
    const distance = Math.hypot((a.lat-b.lat)*111.2, (a.lon-b.lon)*111.2*Math.cos((a.lat+b.lat)*Math.PI/360));
    if (distance > 40) throw new InputError('Keep each demo segment within 40 km.');
  }
  if (body.exclude_locations !== undefined && (!Array.isArray(body.exclude_locations) || body.exclude_locations.length > 8)) throw new InputError('At most eight excluded locations are supported.');
  const costing = body.costing as keyof typeof profiles;
  const result: any = { locations, costing, costing_options: { [costing]: profiles[costing] }, exclude_locations: (body.exclude_locations || []).map(point), directions_options: { units: 'kilometers' } };
  if (action === 'isochrone') {
    if (!Array.isArray(body.contours) || !body.contours.length || body.contours.length > 4 || body.contours.some((c: any) => typeof c?.time !== 'number' || !Number.isFinite(c.time) || c.time < 0.001 || c.time > 40)) throw new InputError('Use one to four contours, each between 0.001 and 40 minutes.');
    if (body.reverse !== undefined && typeof body.reverse !== 'boolean') throw new InputError('Invalid reverse flag.');
    result.contours = [...new Set<number>(body.contours.map((c: any) => +c.time.toFixed(4)))].sort((a,b)=>a-b).map(time=>({time,color:Math.round(time*10000).toString(16).padStart(6,'0')}));
    result.reverse = body.reverse === true;
    result.polygons = true; result.denoise = 0; result.generalize = 20;
  }
  return result;
}
type Options = { secret: string; origin: string; production?: boolean; ready?: () => boolean; fetcher?: typeof fetch; engineOrigin?: string; timeout?: number };
export function createGateway(options: Options) {
  const app = express();
  const fetcher = options.fetcher || fetch;
  const buckets = new Map<string, { count: number; at: number }>();
  const cache = new Map<string, { text: string; bytes: number; at: number }>();
  let bytes = 0, active = false;
  const queue: { resolve: () => void; reject: (e: Error) => void; timer: NodeJS.Timeout }[] = [];
  function release() { const next = queue.shift(); if (next) { clearTimeout(next.timer); next.resolve(); } else active = false; }
  async function acquire() {
    if (!active) { active = true; return; }
    if (queue.length >= 4) throw new Error('BUSY');
    await new Promise<void>((resolve,reject) => {
      const item = { resolve, reject, timer: setTimeout(() => { const i=queue.indexOf(item); if(i>=0)queue.splice(i,1); reject(new Error('BUSY')); }, 12_000) };
      queue.push(item);
    });
  }
  app.disable('x-powered-by'); app.use(helmet()); app.use(compression());
  app.get('/healthz', (_req,res) => res.status(options.ready?.() === false ? 503 : 200).json({ status: options.ready?.() === false ? 'starting' : 'ready', region: 'South Australia' }));
  app.use('/api', (req,res,next) => {
    res.set('Cache-Control','no-store');
    if (options.ready?.() === false) { res.status(503).json({error:'The free routing server is starting. Please retry shortly.'}); return; }
    if (options.production) {
      const supplied=Buffer.from(req.get('x-demo-proxy-secret') || ''), expected=Buffer.from(options.secret);
      if (supplied.length!==expected.length || !timingSafeEqual(supplied,expected) || req.get('origin')!==options.origin) { res.status(403).json({error:'Use the public demo website.'}); return; }
    }
    const ip = options.production ? req.get('x-demo-client-ip') || 'unknown' : req.ip || 'local';
    const now=Date.now(); let bucket=buckets.get(ip);
    if(!bucket || now-bucket.at>60_000) { bucket={count:0,at:now}; buckets.delete(ip); buckets.set(ip,bucket); }
    while(buckets.size>2048)buckets.delete(buckets.keys().next().value!);
    if(++bucket.count>90) { res.set('Retry-After','60').status(429).json({error:'Demo request limit reached. Please wait one minute.'}); return; }
    next();
  });
  app.use(express.json({limit:'16kb',strict:true}));
  for (const action of ['route','isochrone']) app.post('/api/'+action, async (req,res) => {
    let acquired=false;
    try {
      const params=validate(action,req.body), key=action+JSON.stringify(params);
      const cached=cache.get(key);
      if(cached && Date.now()-cached.at<300_000) { res.type('json').send(cached.text); return; }
      if(cached) { bytes-=cached.bytes; cache.delete(key); }
      await acquire(); acquired=true;
      if(res.destroyed) return;
      const upstream=await fetcher((options.engineOrigin || 'http://127.0.0.1:8002')+'/'+action, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(params),signal:AbortSignal.timeout(options.timeout || 40_000)});
      const reader=upstream.body?.getReader(); const chunks: Uint8Array[]=[]; let size=0;
      if(reader) while(true) { const {done,value}=await reader.read(); if(done)break; size+=value.length; if(size>2_000_000) { await reader.cancel(); throw new Error('TOO_LARGE'); } chunks.push(value); }
      let text=Buffer.concat(chunks).toString('utf8');
      if(!upstream.ok) { res.status(422).json({error:'No usable road route was found. Move the endpoints closer to roads, reduce exclusions, or choose another mode.'}); return; }
      const parsed=JSON.parse(text);
      if(action === 'isochrone') {
        // Valhalla serializes contour labels to two decimals. Its explicit color
        // survives intact, so use a unique color tag to restore the exact time.
        const times=new Map(params.contours.map((c: any)=>['#'+c.color,c.time]));
        if(!Array.isArray(parsed.features))throw new Error('INVALID_CONTOURS');
        for(const feature of parsed.features) {
          const time=times.get(String(feature.properties?.color).toLowerCase());
          if(time===undefined)throw new Error('UNKNOWN_CONTOUR');
          feature.properties.contour=time;
        }
        text=JSON.stringify(parsed);size=Buffer.byteLength(text);
      }
      const previous=cache.get(key); if(previous)bytes-=previous.bytes;
      cache.set(key,{text,bytes:size,at:Date.now()}); bytes+=size;
      while(bytes>24_000_000 || cache.size>256) { const first=cache.keys().next().value!; bytes-=cache.get(first)!.bytes; cache.delete(first); }
      res.type('json').send(text);
    } catch(error) {
      const e=error as Error;
      res.status(e instanceof InputError ? 400 : e.message==='BUSY' ? 429 : 503).json({error:e instanceof InputError ? e.message : e.message==='BUSY' ? 'The free demo is busy. Please try again shortly.' : 'The routing server could not finish this request. Try closer locations or a smaller time allowance.'});
    } finally { if(acquired)release(); }
  });
  app.use((_req,res)=>{res.status(404).json({error:'Unknown demo endpoint.'});});
  app.use((error: any,_req: express.Request,res: express.Response,_next: express.NextFunction)=> {res.status(error.status===413 ? 413 : 400).json({error:'Invalid or oversized request.'});});
  return app;
}
