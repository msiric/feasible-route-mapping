import { MAX_LOCATIONS } from '../demo/requests.mjs';
import { fetchIsochrone } from '@api/endpoints';
import { ShortestPathData } from '@contexts/shortestPath';
import { Feature, Polygon, MultiPolygon } from 'geojson';
import { applyTransportationMode } from '@util/options';
import { createPlan } from '../demo/calculation.mjs';
import { create } from 'zustand';
export type IsochroneIntersectionsData = Feature<Polygon | MultiPolygon>;
let controller: AbortController | undefined;
let worker: Worker | undefined;
let generation=0;
interface State {
  data: IsochroneIntersectionsData[]; loading:boolean; progress:string;
  error:{retry:boolean;message:string};
  findIsochroneIntersections:(path:ShortestPathData[])=>Promise<void>;
  resetIsochroneIntersections:()=>void;
}
export const useIsochroneIntersections=create<State>((set)=>({
  data:[], loading:false, progress:'',error:{retry:false,message:''},
  resetIsochroneIntersections:()=>{
    generation++;controller?.abort();worker?.terminate();worker=undefined;
    set({data:[],loading:false,progress:'',error:{retry:false,message:''}});
  },
  findIsochroneIntersections:async(path)=>{
    controller?.abort();worker?.terminate();controller=new AbortController();
    const signal=controller.signal, current=++generation;
    set({loading:true,data:[],progress:'Requesting travel-time contours…',error:{retry:false,message:''}});
    try {
      if(!path.length || path.length>=MAX_LOCATIONS)throw new Error(`Choose two to ${MAX_LOCATIONS} locations first.`);
      const results:IsochroneIntersectionsData[]=[];
      for(const [segmentIndex,segment] of path.entries()) {
        const plan=createPlan(segment.duration,segment.timeRange||0);
        const contours:Feature<Polygon|MultiPolygon>[][]=[[],[]];
        const batches=plan.forward.length+plan.reverse.length; let completed=0;
        for(const [direction,groups] of [plan.forward,plan.reverse].entries()) for(const times of groups) {
          if(signal.aborted)throw new DOMException('Cancelled','AbortError');
          set({progress:`Segment ${segmentIndex+1}/${path.length} · contour batch ${++completed}/${batches}`});
          const params=applyTransportationMode(segment.transportationMode,0,[segment.locations[direction]],segment.excludedLocations||[],direction===1,times.map((time:number)=>({time})));
          const response=await fetchIsochrone(params,signal,seconds=>{if(current===generation)set({progress:`Segment ${segmentIndex+1}/${path.length} · server busy, retrying in ${seconds}s…`});}); contours[direction].push(...response.features);
        }
        set({progress:`Segment ${segmentIndex+1}/${path.length} · intersecting travel-time areas…`});
        const shapes=await new Promise<IsochroneIntersectionsData[]>((resolve,reject)=>{
          worker=new Worker(new URL('../demo/calculation.worker.ts',import.meta.url),{type:'module'});
          const currentWorker=worker;
          const abort=()=>{currentWorker.terminate();reject(new DOMException('Cancelled','AbortError'));};
          signal.addEventListener('abort',abort,{once:true});
          currentWorker.onmessage=({data})=>{signal.removeEventListener('abort',abort);currentWorker.terminate();data.error?reject(new Error(data.error)):resolve(data.result);};
          currentWorker.onerror=()=>{signal.removeEventListener('abort',abort);currentWorker.terminate();reject(new Error('Unable to calculate these polygons. Try a smaller time allowance.'));};
          currentWorker.postMessage({plan,forward:contours[0],reverse:contours[1]});
        });
        results.push(...shapes);
      }
      if(current===generation)set({data:results,loading:false,progress:results.length?'':'No area found at this sampling resolution. Try one extra minute.'});
    } catch(error) {
      if(current===generation && !signal.aborted)set({loading:false,progress:'',error:{retry:true,message:(error as Error).message}});
    }
  }
}));
