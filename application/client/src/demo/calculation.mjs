import { intersect, union, featureCollection, area } from '@turf/turf';
export const timeKey = time => Number(time).toFixed(4);
export function createPlan(durationSeconds, slackSeconds) {
  if(!Number.isFinite(durationSeconds) || durationSeconds <= 0 || !Number.isInteger(slackSeconds) || slackSeconds < 0 || slackSeconds > 600 || slackSeconds%60) throw new Error('Use a positive route duration and zero to ten minutes of extra time.');
  const base = durationSeconds/60, max=base+slackSeconds/60;
  if(max>40) throw new Error('Reference travel time plus extra time must be at most 40 minutes per segment. Choose closer locations or less extra time.');
  const forward=new Map(), reverse=new Map(), levels=[];
  for(let extra=0;extra<=slackSeconds/60;extra++) {
    const total=base+extra, pairs=[];
    const starts=[];
    for(let t=1;t<total-0.0001;t++) starts.push(t);
    if(!starts.length)starts.push(total/2);
    for(const t of starts) {
      const a=+timeKey(t), b=+timeKey(total-t);
      if(a<0.001 || b<0.001)continue;
      forward.set(timeKey(a),a); reverse.set(timeKey(b),b); pairs.push([timeKey(a),timeKey(b)]);
    }
    levels.push({extraMinutes:extra,totalMinutes:total,pairs});
  }
  const batches = map => {
    const values=[...map.values()].sort((a,b)=>a-b), result=[];
    for(let i=0;i<values.length;i+=4)result.push(values.slice(i,i+4));
    return result;
  };
  return {levels,forward:batches(forward),reverse:batches(reverse)};
}
export function indexContours(features) {
  const result={};
  for(const feature of features) {
    if(!['Polygon','MultiPolygon'].includes(feature.geometry?.type))throw new Error('The routing engine returned a non-polygon contour.');
    const key=timeKey(feature.properties?.contour);
    // Engines may return multiple components as separate features.
    result[key]=result[key] ? union(featureCollection([result[key],feature])) : feature;
  }
  return result;
}
export function calculateRegions(plan, forwardFeatures, reverseFeatures) {
  const forward=indexContours(forwardFeatures), reverse=indexContours(reverseFeatures), result=[];
  for(const level of [...plan.levels].reverse()) {
    const pieces=[];
    for(const [a,b] of level.pairs) {
      if(!forward[a] || !reverse[b])throw new Error('The routing engine omitted a requested contour. Try a different location.');
      const piece=intersect(featureCollection([forward[a],reverse[b]]));
      if(piece)pieces.push(piece);
    }
    const shape=pieces.length>1 ? union(featureCollection(pieces)) : pieces[0];
    if(!shape)continue;
    const max=plan.levels.at(-1).extraMinutes;
    const color=`hsl(${max ? level.extraMinutes/max*120 : 0},90%,45%)`;
    shape.properties={color,contour:level.extraMinutes,totalMinutes:level.totalMinutes,area:area(shape)/1e6};
    result.push(shape);
  }
  return result;
}
