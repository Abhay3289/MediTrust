import { api } from './api';
export const userService={me:async()=>{const{data}=await api.get('/users/me');return data;},update:async(payload)=>{const{data}=await api.patch('/users/me',payload);return data;}};
