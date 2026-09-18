import { calculateRegions } from './calculation.mjs';
self.onmessage = ({data}) => {
  try { self.postMessage({result: calculateRegions(data.plan,data.forward,data.reverse)}); }
  catch(error) { self.postMessage({error:(error as Error).message}); }
};
export {};
