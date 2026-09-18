import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPlan,calculateRegions,timeKey} from '../client/src/demo/calculation.mjs';
const polygon=(rings,contour)=>({type:'Feature',geometry:{type:'Polygon',coordinates:rings},properties:{contour}});
const ring=(x,y,size)=>[[x,y],[x+size,y],[x+size,y+size],[x,y+size],[x,y]];
test('zero slack and sub-minute routes yield finite positive contours',()=>{
 for(const duration of [0.2,30,60,120,356.089]) {
 const plan=createPlan(duration,0);assert.equal(plan.levels.length,1);assert.ok(plan.levels[0].pairs.length);
 for(const [a,b] of plan.levels[0].pairs)assert.ok(Math.abs(+a+(+b)-duration/60)<0.00011);
 }
 assert.throws(()=>createPlan(0,0));assert.throws(()=>createPlan(2401,0));assert.throws(()=>createPlan(120,601));
});
test('batching reuses contours across slack levels and never exceeds four per request',()=>{
 const plan=createPlan(356.089,600);assert.equal(plan.levels.length,11);
 assert.ok([...plan.forward,...plan.reverse].every(b=>b.length<=4));assert.ok(plan.forward.length+plan.reverse.length<=8);
 for(const level of plan.levels)for(const [a,b] of level.pairs)assert.ok(Math.abs(+a+(+b)-level.totalMinutes)<0.00011);
});
test('intersection preserves polygon holes and disconnected islands',()=>{
 const plan=createPlan(120,0);
 const forward={type:'Feature',geometry:{type:'MultiPolygon',coordinates:[[ring(0,0,4),ring(1,1,1).reverse()],[ring(10,10,2)]]},properties:{contour:1}};
 const reverse=polygon([ring(-1,-1,20)],1);
 const result=calculateRegions(plan,[forward],[reverse]);assert.equal(result.length,1);
 assert.equal(result[0].geometry.type,'MultiPolygon');assert.equal(result[0].geometry.coordinates.length,2);assert.ok(result[0].geometry.coordinates.some(p=>p.length===2));
 assert.equal(result[0].properties.contour,0);assert.ok(Number.isFinite(result[0].properties.area));
});
test('missing contours fail visibly rather than silently producing incomplete areas',()=>{
 const plan=createPlan(120,0);assert.throws(()=>calculateRegions(plan,[],[]),/omitted/);
 const result=calculateRegions(plan,[polygon([ring(0,0,1)],1)],[polygon([ring(3,3,1)],1)]);assert.deepEqual(result,[]);
});
