import { MAX_LOCATIONS } from '../demo/requests.mjs';
import * as Yup from 'yup';
import { TRANSPORTATION_MODE_OPTIONS } from '@util/options';
const isFirst = (path: string) => /^options(?:\[0\]|\.0)\./.test(path);
const location = Yup.object({
  lat:Yup.number().required().min(-38.2,'Choose a location in South Australia').max(-25.8,'Choose a location in South Australia'),
  lon:Yup.number().required().min(128.9,'Choose a location in South Australia').max(141.1,'Choose a location in South Australia'),
}).nullable().required('Choose a landmark or right-click the map');
export const validationSchema = Yup.object({
  options:Yup.array().min(2).max(MAX_LOCATIONS,`At most ${MAX_LOCATIONS} locations are supported`).of(Yup.object({
    location,
    timeRange:Yup.number().integer().test('range','Choose zero to ten extra minutes',(value,ctx)=>isFirst(ctx.path) || (typeof value==='number' && value>=0 && value<=600 && value%60===0)),
    transportationMode:Yup.string().test('mode','Choose a travel mode',(value,ctx)=>isFirst(ctx.path) || !!value && Object.hasOwn(TRANSPORTATION_MODE_OPTIONS,value)),
  })),
  excludeLocations:Yup.array().max(8,'At most eight excluded locations are supported').of(location),
});
