import { api } from './api';
const normalize = (d) => ({...d,reviewsCount:d.reviews_count,availableToday:d.available_today,avatarBg:d.avatar_bg,consultationFee:d.consultation_fee,hospital:d.hospital_label,verified:d.verified});
export const doctorService = {
 list: async(params={})=>{const{data}=await api.get('/doctors',{params});return {...data,items:data.items.map(normalize)};},
 search: async(q)=>{const{data}=await api.get('/doctors/search',{params:{q}});return data.map(normalize);},
 get: async(id)=>{const{data}=await api.get(`/doctors/${id}`);return normalize(data);},
 availability: async(id)=>{const{data}=await api.get(`/doctors/${id}/availability`);return data;},
 reviews: async(id)=>{const{data}=await api.get(`/doctors/${id}/reviews`);return data;},
 addReview: async(id,payload)=>{const{data}=await api.post(`/doctors/${id}/reviews`,payload);return data;},
};
