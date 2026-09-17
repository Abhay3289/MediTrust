import { api } from './api';
export const locationService={nearby:async(lat,lon,radius=25)=>{const{data}=await api.get('/hospitals/nearby',{params:{latitude:lat,longitude:lon,radius_km:radius}});return data;},reverseGeocode:async(lat,lon)=>{const{data}=await api.get('/location/reverse-geocode',{params:{latitude:lat,longitude:lon}});return data;}};
