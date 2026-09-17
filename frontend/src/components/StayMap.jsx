import { useEffect, useRef } from 'react';

const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const hasCoords = (p) => p && p.latitude != null && p.longitude != null;

function hospitalIcon(L) {
  return L.divIcon({
    className: 'stay-map-icon',
    html: '<div class="stay-map-pin hospital" title="Hospital">H</div>',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -16],
  });
}

function stayIcon(L, stay, selected) {
  const cls = ['stay-map-pin', 'stay'];
  if (stay.isLive) cls.push('live');
  if (stay.isBestMatch) cls.push('best');
  if (selected) cls.push('selected');
  if (stay.recommendedRoom === null) cls.push('full');
  const label = stay.rank ?? '•';
  return L.divIcon({
    className: 'stay-map-icon',
    html: `<div class="${cls.join(' ')}">${esc(label)}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -14],
  });
}

/**
 * Leaflet map of hospitals and nearby stays.
 * Stays are numbered by recommendation rank; the best match is highlighted,
 * and the selected stay is linked to its hospital with a dashed line.
 */
export function StayMap({ hospitals = [], stays = [], radiusKm = null, selectedStayId = null, onSelectStay }) {
  const mapRef = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);
  const markers = useRef({});
  const fittedKey = useRef('');

  useEffect(() => {
    const L = window.L;
    if (!L || !mapRef.current) return undefined;
    map.current = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false }).setView([28.6139, 77.209], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const L = window.L;
    const m = map.current;
    if (!L || !m) return;
    layer.current.clearLayers();
    markers.current = {};
    const points = [];

    hospitals.filter(hasCoords).forEach((h) => {
      const pos = [h.latitude, h.longitude];
      points.push(pos);
      L.marker(pos, { icon: hospitalIcon(L), zIndexOffset: 500 })
        .bindPopup(`<strong>${esc(h.name)}</strong><br><span>${esc(h.address)}</span>`)
        .addTo(layer.current);
      if (radiusKm && hospitals.length === 1) {
        L.circle(pos, {
          radius: radiusKm * 1000,
          color: '#4f46e5',
          weight: 1,
          fillColor: '#4f46e5',
          fillOpacity: 0.05,
          dashArray: '4 6',
        }).addTo(layer.current);
      }
    });

    stays.filter(hasCoords).forEach((s) => {
      const pos = [s.latitude, s.longitude];
      points.push(pos);
      const room = s.recommendedRoom;
      const selected = s.id === selectedStayId;
      const marker = L.marker(pos, {
        icon: stayIcon(L, s, selected),
        zIndexOffset: selected ? 1000 : s.isBestMatch ? 800 : 0,
      })
        .bindPopup(
          `<strong>${esc(s.name)}</strong><br>` +
            `${esc(s.distanceText || '')}` +
            (s.matchScore != null ? `<br>Match score: <b>${esc(s.matchScore)}</b>/100` : '') +
            (s.priceText ? `<br>${esc(s.priceText)}` : '') +
            (s.phone ? `<br>📞 ${esc(s.phone)}` : '') +
            (room ? `<br>Best room: ${esc(room.type)} · ₹${esc(room.daily_cost.toLocaleString('en-IN'))}/day` : '') +
            (s.isBestMatch ? '<br><b style="color:#059669">★ Best match for you</b>' : '')
        )
        .on('click', () => onSelectStay?.(s.id))
        .addTo(layer.current);
      markers.current[s.id] = marker;
    });

    const selected = stays.find((s) => s.id === selectedStayId);
    const hospital = selected && hospitals.find((h) => h.id === selected.nearHospitalId);
    if (hasCoords(selected) && hasCoords(hospital)) {
      L.polyline(
        [
          [hospital.latitude, hospital.longitude],
          [selected.latitude, selected.longitude],
        ],
        { color: '#059669', weight: 3, dashArray: '6 6' }
      ).addTo(layer.current);
    }

    // Re-fit only when the set of places changes, not on every selection.
    const key = points.map((p) => p.join(',')).join('|') + `|${radiusKm}`;
    if (points.length && key !== fittedKey.current) {
      fittedKey.current = key;
      if (radiusKm && hospitals.length === 1 && hasCoords(hospitals[0])) {
        const circleBounds = L.latLng(hospitals[0].latitude, hospitals[0].longitude).toBounds(radiusKm * 2000);
        m.fitBounds(L.latLngBounds(points).extend(circleBounds), { padding: [24, 24], maxZoom: 16 });
      } else {
        m.fitBounds(L.latLngBounds(points), { padding: [32, 32], maxZoom: 15 });
      }
    }
  }, [hospitals, stays, radiusKm, selectedStayId, onSelectStay]);

  useEffect(() => {
    const marker = markers.current[selectedStayId];
    if (marker && map.current) {
      map.current.panTo(marker.getLatLng());
      marker.openPopup();
    }
  }, [selectedStayId, stays]);

  if (typeof window !== 'undefined' && !window.L) {
    return <div className="stay-map stay-map-fallback">Map could not load. Check your internet connection and refresh.</div>;
  }

  return (
    <div className="stay-map-wrap">
      <div ref={mapRef} className="stay-map" />
      <div className="stay-map-legend">
        <span><i className="stay-map-pin hospital mini">H</i> Hospital</span>
        <span><i className="stay-map-pin stay best mini">1</i> Best match</span>
        <span><i className="stay-map-pin stay mini">2</i> Other stays (by rank)</span>
        {stays.some((s) => s.isLive) && <span><i className="stay-map-pin stay live mini">3</i> Nearby stays (Google)</span>}
        {radiusKm && hospitals.length === 1 ? <span><i className="stay-map-radius" /> {radiusKm} km limit</span> : null}
      </div>
    </div>
  );
}
