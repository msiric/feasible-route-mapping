import { Alert, Box, Button, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useShortestPath } from '@contexts/shortestPath';
import { useIsochroneIntersections } from '@contexts/isochroneIntersections';
import { useDemo } from './state';
export function DemoBar() {
 const {reset}=useFormContext();
 const {live,setLive}=useDemo();
 const [message,setMessage]=useState('Loading the bundled Adelaide example…');
 async function showSample() {
  setLive(false);useShortestPath.getState().resetShortestPath();useIsochroneIntersections.getState().resetIsochroneIntersections();
  try {
   const response=await fetch('/demo/sample.json');if(!response.ok)throw new Error();const sample=await response.json();
   reset(sample.values);useShortestPath.getState().setShortestPath(sample.path,'sample');useIsochroneIntersections.setState({data:sample.regions});
   setMessage('Bundled Adelaide example · no routing server required.');
  } catch {setMessage('The bundled example is unavailable. You can try live routing.');}
 }
 useEffect(()=>{void showSample();},[]);
 return <Box sx={{mb:2}}>
  <Alert severity="info" sx={{mb:1}}>{live?'Live South Australia demo. The free server may take a minute to wake up.':message}</Alert>
  <Button size="small" variant="contained" onClick={()=>live?showSample():setLive(true)}>{live?'Show bundled example':'Try live routing'}</Button>
  <Typography variant="body2" sx={{mt:1}}>Explore where a journey could pass with extra travel time. Search bundled Adelaide landmarks or right-click the map to choose points.</Typography>
  <details style={{fontSize:12,marginTop:8}}><summary>Scope, accuracy and privacy</summary>
   <p>South Australia only. Up to three locations, eight road exclusions, and 40 minutes per segment including zero to ten extra minutes. Bus means road routing for a bus, without public transport timetables.</p>
   <p>The colored areas are an approximation from one-minute time slices and generalized road-network contours. They can miss narrow areas and be truncated at the regional boundary. The reference route uses mode-specific preferences; it is not a guaranteed minimum-time route. No live traffic or turn-by-turn safety guidance.</p>
   <p>Sample mode does not call the routing server. Live calculations send selected coordinates to this demo's server. Map tiles come from OpenStreetMap; browsing sends the visible map area to its tile servers. No account, location permission or analytics is required.</p>
   <a href="https://github.com/msiric/feasible-route-mapping">Source and data credits</a>
  </details>
 </Box>;
}
