import { api } from './api';
const normalize=p=>({...p,recommendedDepartments:p.recommended_departments,relevantHospitalIds:p.relevant_hospital_ids});
export const healthProblemService={list:async()=>{const{data}=await api.get('/health-problems');return data.map(normalize);},recommendations:async(id)=>{const{data}=await api.get(`/health-problems/${id}/recommendations`);return data;}};
