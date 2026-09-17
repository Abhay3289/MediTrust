import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icons';

export function HospitalMap({ hospitals=[], selectedHospitalId=null, onSelectHospital, onViewDetails, onGetDirections }) {
  const mapRef=useRef(null); const mapInstance=useRef(null); const markers=useRef([]);
  const [userPosition,setUserPosition]=useState(null); const [locationError,setLocationError]=useState('');
  const selected=hospitals.find(h=>h.id===selectedHospitalId);
  useEffect(()=>{
    if(!window.L || !mapRef.current) return;
    const center=selected?[selected.latitude,selected.longitude]:[28.6139,77.2090];
    mapInstance.current=L.map(mapRef.current,{zoomControl:true}).setView(center,13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; OpenStreetMap contributors'}).addTo(mapInstance.current);
    return ()=>{mapInstance.current?.remove();mapInstance.current=null;};
  },[]);
  useEffect(()=>{
    const map=mapInstance.current;if(!map||!window.L)return;
    markers.current.forEach(m=>m.remove());markers.current=[];
    hospitals.forEach(h=>{if(h.latitude==null||h.longitude==null)return;const marker=L.marker([h.latitude,h.longitude]).addTo(map);marker.bindPopup(`<strong>${h.name.replace(/</g,'&lt;')}</strong><br>${h.distanceText||''}`);marker.on('click',()=>onSelectHospital?.(h.id));markers.current.push(marker);});
    if(selected) map.setView([selected.latitude,selected.longitude],14);
  },[hospitals,selected,onSelectHospital]);
  const locate=()=>{if(!navigator.geolocation){setLocationError('Geolocation is not supported by this browser.');return;}navigator.geolocation.getCurrentPosition(p=>{const pos=[p.coords.latitude,p.coords.longitude];setUserPosition(pos);setLocationError('');if(mapInstance.current){mapInstance.current.setView(pos,14);if(window.L){L.circleMarker(pos,{radius:8}).addTo(mapInstance.current).bindPopup('Your current location').openPopup();}}},()=>setLocationError('Location permission was denied. You can still browse hospitals manually.'));};
  useEffect(()=>{locate();},[]);
  const directions=()=>{if(!selected)return;if(userPosition){window.open(`https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${userPosition[0]}%2C${userPosition[1]}%3B${selected.latitude}%2C${selected.longitude}`,'_blank','noopener,noreferrer');}else onGetDirections?.(selected);};
  return <div className="interactive-map-container"><div className="map-controls-bar"><div className="map-status-pill"><span className="live-dot"></span><span>Live Hospital Map</span></div><div className="map-actions"><button type="button" className="map-action-btn locate-btn" onClick={locate}><Icon name="crosshair" size={16}/><span>My Location</span></button>{selected&&<button type="button" className="map-action-btn" onClick={directions} title="Get directions">Directions</button>}</div></div>{locationError&&<div className="map-location-error">{locationError}</div>}<div ref={mapRef} className="meditrust-leaflet-map" />{selected&&<div className="map-selected-card"><strong>{selected.name}</strong><button type="button" className="btn btn-primary btn-sm" onClick={()=>onViewDetails?.(selected.id)}>View Details</button></div>}</div>;
}
