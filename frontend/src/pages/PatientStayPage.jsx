import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../components/Icons';
import { StayScoreBadge } from '../components/StayScoreBadge';
import { StayMap } from '../components/StayMap';
import { useAuth } from '../context/AuthContext';
import { hospitalService } from '../services/hospitalService';
import { stayService } from '../services/stayService';
import { apiError } from '../services/api';

const DEFAULT_PREFS = {
  budgetPerDay: '',
  nights: 3,
  guests: 1,
  maxDistanceKm: 5,
  includeFood: true,
  needCaregiver: false,
  needAccessible: false,
  needAc: false,
  affordableOnly: false,
};

// Google hospital picked on the results page (not in the MediTrust DB).
const LIVE_PAGE_SIZE = 12;

const LIVE_HOSPITAL_KEY = (id) => `meditrust_stay_hospital_${id}`;

function readLiveHospital(id) {
  try {
    return JSON.parse(sessionStorage.getItem(LIVE_HOSPITAL_KEY(id)) || 'null');
  } catch {
    return null;
  }
}

function distanceKm(lat1, lon1, lat2, lon2) {
  const rad = (d) => (d * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const SORTS = {
  best: { label: 'Best match', fn: (a, b) => a.rank - b.rank },
  nearest: { label: 'Nearest to hospital', fn: (a, b) => a.distanceKm - b.distanceKm },
  cheapest: {
    label: 'Lowest cost',
    fn: (a, b) =>
      (a.recommendedRoom?.total_cost ?? a.totalCostMin ?? Infinity) -
      (b.recommendedRoom?.total_cost ?? b.totalCostMin ?? Infinity),
  },
};

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

const todayIso = () => new Date().toISOString().slice(0, 10);

function directionsUrl(stay, hospital) {
  if (!hospital || stay.latitude == null) return null;
  return `https://www.google.com/maps/dir/?api=1&travelmode=walking&origin=${stay.latitude},${stay.longitude}&destination=${hospital.latitude},${hospital.longitude}`;
}

function roomCost(stay, room, { nights, guests, includeFood }) {
  const perDay = room.price_per_day + (includeFood ? stay.foodPerDay * guests : 0);
  return { perDay, total: perDay * nights + stay.mandatoryCharges };
}

function scoreTone(score) {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  return 'fair';
}

/* ------------------------------------------------------------------ */

function PreferencesPanel({ prefs, onChange, onReset, liveOnly }) {
  const set = (key) => (e) => {
    const { type, checked, value } = e.target;
    onChange({ ...prefs, [key]: type === 'checkbox' ? checked : value });
  };

  return (
    <div className="stay-prefs">
      <div className="stay-prefs-head">
        <h3><Icon name="filter" size={16} /> Tell us what you need</h3>
        <button type="button" className="stay-link-btn" onClick={onReset}>Reset</button>
      </div>
      <div className="stay-prefs-grid">
        <label className="stay-pref">
          <span>Budget per day (₹)</span>
          <input type="number" min="0" step="100" placeholder="Any" value={prefs.budgetPerDay} onChange={set('budgetPerDay')} />
          <small>Room + food for everyone</small>
        </label>
        <label className="stay-pref">
          <span>Nights</span>
          <input type="number" min="1" max="365" value={prefs.nights} onChange={set('nights')} />
        </label>
        <label className="stay-pref">
          <span>Guests (patient + family)</span>
          <input type="number" min="1" max="10" value={prefs.guests} onChange={set('guests')} />
        </label>
        <label className="stay-pref">
          <span>Max distance from hospital</span>
          <select value={prefs.maxDistanceKm} onChange={set('maxDistanceKm')}>
            {[1, 2, 3, 5, 10].map((km) => (
              <option key={km} value={km}>{km} km</option>
            ))}
          </select>
        </label>
      </div>
      <div className="stay-prefs-checks">
        <label><input type="checkbox" checked={prefs.includeFood} onChange={set('includeFood')} /> Include meals</label>
        <label><input type="checkbox" checked={prefs.needCaregiver} onChange={set('needCaregiver')} /> Caregiver / attendant staying</label>
        <label><input type="checkbox" checked={prefs.needAccessible} onChange={set('needAccessible')} /> Wheelchair accessible</label>
        <label><input type="checkbox" checked={prefs.needAc} onChange={set('needAc')} /> Need AC room</label>
        <label><input type="checkbox" checked={prefs.affordableOnly} onChange={set('affordableOnly')} /> Only affordable (≤ ₹1,500/room/day)</label>
      </div>
      {liveOnly && (
        <small className="stay-pref-note">
          Meals, caregiver, accessibility and AC can't be checked for Google listings — ask the owner when you call.
        </small>
      )}
    </div>
  );
}

function RoomTable({ stay }) {
  if (!stay.rooms.length) return null;
  return (
    <div className="stay-rooms">
      <div className="stay-rooms-title">Rooms</div>
      {stay.rooms.map((room) => {
        const status = !room.is_available ? 'Fully booked' : !room.fits_group ? `Only ${room.beds} bed${room.beds > 1 ? 's' : ''}` : `${room.available} left`;
        return (
          <div
            key={room.type}
            className={`stay-room-row${room.recommended ? ' recommended' : ''}${!room.is_available || !room.fits_group ? ' unavailable' : ''}`}
          >
            <div className="stay-room-main">
              <strong>
                {room.recommended && <Icon name="star" size={12} />} {room.type}
              </strong>
              <span className="stay-room-feats">
                {room.beds} bed{room.beds > 1 ? 's' : ''}
                {room.ac ? ' · AC' : ' · Non-AC'}
                {room.attached_bathroom ? ' · Attached bath' : ' · Shared bath'}
                {room.accessible ? ' · Accessible' : ''}
              </span>
            </div>
            <div className="stay-room-side">
              <strong>{inr(room.price_per_day)}<small>/day</small></strong>
              <span className="stay-room-status">{status}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BestMatchCard({ stay, hospital, prefs, onShowOnMap, onRequest }) {
  const room = stay.recommendedRoom;
  return (
    <div className="stay-best">
      <div className="stay-best-ribbon"><Icon name="sparkles" size={14} /> Best match for you</div>
      <div className="stay-best-body">
        <div className="stay-best-info">
          <span className="suitable-hosp-type">{stay.type}</span>
          <h2>{stay.name}</h2>
          <p className="suitable-hosp-address">
            <Icon name="map-pin" size={13} color="#64748b" /> <span>{stay.address}</span>
          </p>
          <ul className="stay-reasons">
            {stay.reasons.map((r) => (
              <li key={r}><Icon name="check" size={14} color="#059669" /> {r}</li>
            ))}
            {stay.warnings.map((w) => (
              <li key={w} className="warn"><Icon name="help" size={14} color="#d97706" /> {w}</li>
            ))}
          </ul>
        </div>
        <div className="stay-best-side">
          <div className={`stay-match-ring ${scoreTone(stay.matchScore)}`}>
            <strong>{stay.matchScore}</strong>
            <span>match</span>
          </div>
          <div className="stay-best-room">
            <span>Recommended room</span>
            <strong>{room.type}</strong>
            <span>{inr(room.daily_cost)}/day · {stay.distanceKm.toFixed(1)} km{hospital ? ` from ${hospital.name.split(' ')[0]}` : ''}</span>
            <span className="stay-best-total">
              {inr(room.total_cost)} for {prefs.nights} night{prefs.nights > 1 ? 's' : ''}
            </span>
          </div>
          <div className="stay-best-actions">
            <button type="button" className="btn btn-outline btn-sm" onClick={onShowOnMap}>
              <Icon name="map-pin" size={14} /> <span>Show on map</span>
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={onRequest}>
              <Icon name="home" size={14} /> <span>Request this room</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StayCard({ stay, hospital, prefs, selected, onSelect, onRequest }) {
  const room = stay.recommendedRoom;
  const dirUrl = directionsUrl(stay, hospital);
  const phone = stay.contact ? stay.contact.replace(/[^0-9+]/g, '') : null;
  return (
    <div
      id={`stay-${stay.id}`}
      className={`stay-card${selected ? ' selected' : ''}${stay.isBestMatch ? ' best' : ''}`}
      onClick={onSelect}
    >
      <div className="stay-card-top">
        <div>
          <span className="stay-rank">#{stay.rank}</span>
          <span className="suitable-hosp-type">{stay.type}</span>
          <h3 className="stay-card-name">{stay.name}</h3>
          <p className="suitable-hosp-address">
            <Icon name="map-pin" size={13} color="#64748b" />
            <span>{stay.address}</span>
          </p>
        </div>
        <div className={`stay-match-pill ${scoreTone(stay.matchScore)}`} title="How well this stay matches your needs">
          <strong>{stay.matchScore}</strong>
          <span>match</span>
        </div>
      </div>

      <div className="suitable-trust-row">
        <StayScoreBadge stay={stay} size="sm" />
        <span className={`meta-pill distance${stay.withinDistance ? '' : ' far'}`}>
          <Icon name="navigation" size={12} />
          <span>{stay.distanceText} · ~{stay.walkMinutes} min walk</span>
        </span>
        {stay.verified && (
          <span className="verified-pill">
            <Icon name="badge-check" size={13} />
            <span>Verified</span>
          </span>
        )}
      </div>
      {hospital && (
        <p className="stay-card-hospital">
          <Icon name="building" size={12} /> Near {hospital.name}
        </p>
      )}

      <div className="stay-tags-row">
        {stay.longStaySupport && <span className="stay-tag"><Icon name="calendar" size={12} /><span>Long-Stay</span></span>}
        {stay.caregiverFriendly && <span className="stay-tag"><Icon name="heart" size={12} /><span>Caregiver-Friendly</span></span>}
        {stay.accessible && <span className="stay-tag"><Icon name="check" size={12} /><span>Accessible</span></span>}
      </div>

      {(stay.reasons.length > 0 || stay.warnings.length > 0) && (
        <ul className="stay-reasons compact">
          {stay.reasons.slice(0, 3).map((r) => (
            <li key={r}><Icon name="check" size={12} color="#059669" /> {r}</li>
          ))}
          {stay.warnings.map((w) => (
            <li key={w} className="warn"><Icon name="help" size={12} color="#d97706" /> {w}</li>
          ))}
        </ul>
      )}

      <RoomTable stay={stay} />

      {room ? (
        <div className="stay-pricing-box">
          <div className="stay-pricing-row">
            <span>Room ({room.type})</span>
            <strong>{inr(room.price_per_day)}/day</strong>
          </div>
          {prefs.includeFood && (
            <div className="stay-pricing-row">
              <span><Icon name="utensils" size={12} /> Food ({prefs.guests} × {inr(stay.foodPerDay)})</span>
              <strong>{inr(stay.foodPerDay * prefs.guests)}/day</strong>
            </div>
          )}
          <div className="stay-pricing-row">
            <span>One-time charges</span>
            <strong>{inr(stay.mandatoryCharges)}</strong>
          </div>
          <div className="stay-pricing-row total">
            <span>Estimated for {prefs.nights} night{prefs.nights > 1 ? 's' : ''}</span>
            <strong>{inr(room.total_cost)}</strong>
          </div>
          <span className="stay-pricing-note">Confirm final pricing with the provider.</span>
        </div>
      ) : (
        <div className="stay-no-room">No room free for {prefs.guests} guest{prefs.guests > 1 ? 's' : ''} right now.</div>
      )}

      {stay.reviews.length > 0 && (
        <div className="stay-review-snippet">
          <div className="stay-review-snippet-stars">
            {[...Array(stay.reviews[0].rating)].map((_, i) => (
              <Icon key={i} name="star" size={12} />
            ))}
          </div>
          <p>“{stay.reviews[0].comment}”</p>
          <span className="stay-review-snippet-author">
            — {stay.reviews[0].author}
            {stay.reviews.length > 1 && `, +${stay.reviews.length - 1} more verified review${stay.reviews.length > 2 ? 's' : ''}`}
          </span>
        </div>
      )}

      <div className="suitable-card-actions stay-card-actions" onClick={(e) => e.stopPropagation()}>
        {phone && (
          <a href={`tel:${phone}`} className="btn btn-outline btn-sm">
            <Icon name="phone" size={14} />
            <span>Call</span>
          </a>
        )}
        {dirUrl && (
          <a href={dirUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
            <Icon name="directions" size={14} />
            <span>Route</span>
          </a>
        )}
        <button type="button" className="btn btn-primary btn-sm" disabled={!room} onClick={onRequest}>
          <Icon name="home" size={14} />
          <span>{room ? 'Request' : 'Full'}</span>
        </button>
      </div>
    </div>
  );
}

function LiveStayCard({ stay, hospital, prefs, selected, onSelect }) {
  const dirUrl = directionsUrl(stay, hospital);
  const phone = stay.phone ? stay.phone.replace(/[^0-9+]/g, '') : null;
  return (
    <div
      id={`stay-${stay.id}`}
      className={`stay-card${selected ? ' selected' : ''}${stay.isBestMatch ? ' best' : ''}`}
      onClick={onSelect}
    >
      <div className="stay-card-top">
        <div>
          <span className="stay-rank">#{stay.rank}</span>
          <span className="suitable-hosp-type">{stay.type}</span>
          <h3 className="stay-card-name">{stay.name}</h3>
          <p className="suitable-hosp-address">
            <Icon name="map-pin" size={13} color="#64748b" />
            <span>{stay.address}</span>
          </p>
        </div>
        <div className={`stay-match-pill ${scoreTone(stay.matchScore)}`} title="Price, distance and rating combined">
          <strong>{stay.matchScore}</strong>
          <span>match</span>
        </div>
      </div>

      <div className="suitable-trust-row">
        <span className="meta-pill distance">
          <Icon name="navigation" size={12} />
          <span>{stay.distanceText} · ~{stay.walkMinutes} min walk</span>
        </span>
        {stay.rating != null && (
          <span className="stay-tag">
            <Icon name="star" size={12} />
            <span>{stay.rating} ({stay.reviewsCount})</span>
          </span>
        )}
        {stay.isAffordable && (
          <span className="stay-tag affordable">
            <Icon name="check" size={12} />
            <span>Affordable</span>
          </span>
        )}
      </div>
      {hospital && (
        <p className="stay-card-hospital">
          <Icon name="building" size={12} /> Near {hospital.name}
        </p>
      )}

      {(stay.reasons.length > 0 || stay.warnings.length > 0) && (
        <ul className="stay-reasons compact">
          {stay.reasons.map((r) => (
            <li key={r}><Icon name="check" size={12} color="#059669" /> {r}</li>
          ))}
          {stay.warnings.map((w) => (
            <li key={w} className="warn"><Icon name="help" size={12} color="#d97706" /> {w}</li>
          ))}
        </ul>
      )}

      <div className="stay-pricing-box">
        <div className="stay-pricing-row">
          <span>{stay.roomsNeeded} room{stay.roomsNeeded > 1 ? 's' : ''} for {prefs.guests} guest{prefs.guests > 1 ? 's' : ''}</span>
          <strong>{inr(stay.dailyCostMin)} – {inr(stay.dailyCostMax)}/day</strong>
        </div>
        <div className="stay-pricing-row total">
          <span>Estimated for {prefs.nights} night{prefs.nights > 1 ? 's' : ''}</span>
          <strong>{inr(stay.totalCostMin)} – {inr(stay.totalCostMax)}</strong>
        </div>
        <span className="stay-pricing-note">Estimated from the type of stay. Call to confirm the actual price.</span>
      </div>

      <div className="suitable-card-actions stay-card-actions" onClick={(e) => e.stopPropagation()}>
        {phone && (
          <a href={`tel:${phone}`} className="btn btn-primary btn-sm">
            <Icon name="phone" size={14} />
            <span>Call</span>
          </a>
        )}
        {dirUrl && (
          <a href={dirUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
            <Icon name="directions" size={14} />
            <span>Route</span>
          </a>
        )}
        {stay.googleMapsUrl && (
          <a href={stay.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
            <Icon name="map-pin" size={14} />
            <span>Google Maps</span>
          </a>
        )}
      </div>
    </div>
  );
}

function RequestModal({ stay, prefs, user, onClose, onNavigate, onSubmitted }) {
  const bookable = stay.rooms.filter((r) => r.is_available);
  const [form, setForm] = useState({
    roomType: (stay.recommendedRoom || bookable[0] || {}).type || '',
    checkIn: tomorrow(),
    nights: prefs.nights,
    guests: prefs.guests,
    includeFood: prefs.includeFood,
    contactName: user?.full_name || '',
    contactPhone: user?.phone || '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (key) => (e) => {
    const { type, checked, value } = e.target;
    setForm((f) => ({ ...f, [key]: type === 'checkbox' ? checked : value }));
  };

  const nights = Math.max(1, Number(form.nights) || 1);
  const guests = Math.max(1, Number(form.guests) || 1);
  const room = bookable.find((r) => r.type === form.roomType);
  const cost = room ? roomCost(stay, room, { nights, guests, includeFood: form.includeFood }) : null;
  const tooSmall = room && room.beds < guests;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!room) return setError('Please choose a room.');
    if (tooSmall) return setError(`${room.type} has only ${room.beds} bed(s). Choose a bigger room or fewer guests.`);
    try {
      setSubmitting(true);
      const created = await stayService.createRequest({
        stay_id: stay.id,
        room_type: room.type,
        check_in: form.checkIn,
        nights,
        guests,
        include_food: form.includeFood,
        contact_name: form.contactName.trim(),
        contact_phone: form.contactPhone.trim(),
        notes: form.notes.trim() || null,
      });
      onSubmitted(created);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="stay-modal-overlay" onClick={onClose}>
      <div className="stay-modal" role="dialog" aria-modal="true" aria-labelledby="stay-modal-title" onClick={(e) => e.stopPropagation()}>
        <div className="stay-modal-head">
          <div>
            <span className="suitable-hosp-type">Request a room</span>
            <h3 id="stay-modal-title">{stay.name}</h3>
          </div>
          <button type="button" className="toast-close" onClick={onClose} aria-label="Close">
            <Icon name="close" size={16} />
          </button>
        </div>

        {!user ? (
          <div className="stay-modal-login">
            <Icon name="lock" size={28} color="#4f46e5" />
            <p>Please log in so we can save your request and the provider can reach you.</p>
            <button type="button" className="btn btn-primary" onClick={() => onNavigate('login')}>
              Log in to continue
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="form-field">
              <label htmlFor="stay-room">Room</label>
              <select id="stay-room" className="stay-select" value={form.roomType} onChange={set('roomType')}>
                {bookable.map((r) => (
                  <option key={r.type} value={r.type}>
                    {r.type} — {r.beds} bed{r.beds > 1 ? 's' : ''}, {inr(r.price_per_day)}/day{r.recommended ? ' (recommended)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-two-col">
              <div className="form-field">
                <label htmlFor="stay-checkin">Check-in date</label>
                <input id="stay-checkin" type="date" min={todayIso()} required value={form.checkIn} onChange={set('checkIn')} />
              </div>
              <div className="form-field">
                <label htmlFor="stay-nights">Nights</label>
                <input id="stay-nights" type="number" min="1" max="365" required value={form.nights} onChange={set('nights')} />
              </div>
            </div>
            <div className="form-two-col">
              <div className="form-field">
                <label htmlFor="stay-guests">Guests</label>
                <input id="stay-guests" type="number" min="1" max="10" required value={form.guests} onChange={set('guests')} />
              </div>
              <div className="form-field">
                <label htmlFor="stay-phone">Phone</label>
                <input id="stay-phone" type="tel" required placeholder="+91 98765 43210" value={form.contactPhone} onChange={set('contactPhone')} />
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="stay-name">Contact name</label>
              <input id="stay-name" required minLength={2} value={form.contactName} onChange={set('contactName')} />
            </div>
            <div className="form-field">
              <label htmlFor="stay-notes">Notes for the provider (optional)</label>
              <textarea id="stay-notes" rows={2} maxLength={1000} placeholder="e.g. ground floor, wheelchair, late check-in" value={form.notes} onChange={set('notes')} />
            </div>
            <label className="stay-modal-check">
              <input type="checkbox" checked={form.includeFood} onChange={set('includeFood')} /> Include meals ({inr(stay.foodPerDay)} per person/day)
            </label>

            {cost && (
              <div className="stay-pricing-box">
                <div className="stay-pricing-row"><span>Per day</span><strong>{inr(cost.perDay)}</strong></div>
                <div className="stay-pricing-row"><span>One-time charges</span><strong>{inr(stay.mandatoryCharges)}</strong></div>
                <div className="stay-pricing-row total"><span>Estimated total ({nights} night{nights > 1 ? 's' : ''})</span><strong>{inr(cost.total)}</strong></div>
              </div>
            )}
            {tooSmall && <div className="stay-form-error">This room has only {room.beds} bed(s) for {guests} guests.</div>}
            {error && <div className="stay-form-error">{error}</div>}

            <div className="stay-modal-actions">
              <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting || !room}>
                {submitting ? 'Sending...' : 'Send request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function MyRequests({ requests, onCancel, cancellingId }) {
  if (!requests.length) return null;
  return (
    <div className="stay-my-requests">
      <h3><Icon name="folder" size={16} /> My stay requests</h3>
      <div className="stay-my-list">
        {requests.map((r) => (
          <div key={r.id} className="stay-my-item">
            <div>
              <strong>{r.stay_name}</strong>
              <span>
                {r.room_type} · {new Date(`${r.check_in}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {r.nights} night{r.nights > 1 ? 's' : ''} · {r.guests} guest{r.guests > 1 ? 's' : ''}
              </span>
              <span>Estimated {inr(r.estimated_cost)}{r.stay_contact ? ` · Provider: ${r.stay_contact}` : ''}</span>
            </div>
            <div className="stay-my-side">
              <span className={`stay-status ${r.status}`}>{r.status}</span>
              {r.status === 'pending' && r.check_in >= todayIso() && (
                <button type="button" className="stay-link-btn" disabled={cancellingId === r.id} onClick={() => onCancel(r.id)}>
                  {cancellingId === r.id ? 'Cancelling...' : 'Cancel'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export default function PatientStayPage({ hospitalId, onNavigate }) {
  const { user } = useAuth();
  const [hospitalFilter, setHospitalFilter] = useState(hospitalId || 'all');
  const [hospitals, setHospitals] = useState([]);
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [appliedPrefs, setAppliedPrefs] = useState(DEFAULT_PREFS);
  const [stays, setStays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sort, setSort] = useState('best');
  const [selectedStayId, setSelectedStayId] = useState(null);
  const [requestStay, setRequestStay] = useState(null);
  const [notice, setNotice] = useState(null);
  const [myRequests, setMyRequests] = useState([]);
  const [cancellingId, setCancellingId] = useState(null);

  // Live location -> real hospitals nearby -> real stays around the chosen hospital
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('detecting');
  const [liveHospitals, setLiveHospitals] = useState([]);
  const [liveStays, setLiveStays] = useState([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState('');
  const [liveVisible, setLiveVisible] = useState(LIVE_PAGE_SIZE);
  const userPickedHospital = useRef(Boolean(hospitalId));

  useEffect(() => {
    setHospitalFilter(hospitalId || 'all');
    userPickedHospital.current = Boolean(hospitalId);
  }, [hospitalId]);

  useEffect(() => {
    hospitalService
      .list({ limit: 100 })
      .then((h) => setHospitals(h.items))
      .catch((e) => setError(apiError(e)));
  }, []);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      return;
    }
    setLocationStatus('detecting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLocationStatus('ok');
      },
      () => setLocationStatus('denied'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  useEffect(detectLocation, [detectLocation]);

  useEffect(() => {
    if (!userLocation) return;
    let active = true;
    hospitalService
      .realNearby(userLocation.latitude, userLocation.longitude, 25)
      .then((list) => {
        if (!active) return;
        const nearby = list
          .filter((h) => h.latitude != null && h.longitude != null)
          .map((h) => ({
            ...h,
            distance: distanceKm(userLocation.latitude, userLocation.longitude, h.latitude, h.longitude),
          }))
          .sort((a, b) => a.distance - b.distance);
        setLiveHospitals(nearby);
        // No hospital chosen yet: start with the nearest one, like the hospital search does.
        if (!userPickedHospital.current && nearby.length) {
          setHospitalFilter(nearby[0].id);
        }
      })
      .catch(() => active && setLiveHospitals([]));
    return () => {
      active = false;
    };
  }, [userLocation]);

  const pickHospital = (id) => {
    userPickedHospital.current = true;
    setHospitalFilter(id);
    setSelectedStayId(null);
  };

  // Debounce typing in the preferences panel.
  useEffect(() => {
    const t = setTimeout(() => setAppliedPrefs(prefs), 350);
    return () => clearTimeout(t);
  }, [prefs]);

  const cleanPrefs = useMemo(
    () => ({
      ...appliedPrefs,
      budgetPerDay: Number(appliedPrefs.budgetPerDay) > 0 ? Number(appliedPrefs.budgetPerDay) : undefined,
      nights: Math.min(365, Math.max(1, Number(appliedPrefs.nights) || 1)),
      guests: Math.min(10, Math.max(1, Number(appliedPrefs.guests) || 1)),
      maxDistanceKm: Number(appliedPrefs.maxDistanceKm) || 5,
    }),
    [appliedPrefs]
  );

  const hospitalById = useMemo(() => Object.fromEntries(hospitals.map((h) => [h.id, h])), [hospitals]);
  const dbHospital = hospitalById[hospitalFilter];
  const liveHospital = useMemo(() => {
    if (dbHospital || hospitalFilter === 'all') return null;
    return liveHospitals.find((h) => h.id === hospitalFilter) || readLiveHospital(hospitalFilter);
  }, [dbHospital, hospitalFilter, liveHospitals]);
  const contextHospital = dbHospital || liveHospital;
  const isLiveHospital = Boolean(liveHospital);

  // MediTrust-listed stays (only exist for MediTrust hospitals).
  useEffect(() => {
    if (isLiveHospital) {
      setStays([]);
      setError('');
      setLoading(false);
      return undefined;
    }
    let active = true;
    setLoading(true);
    stayService
      .recommend(hospitalFilter === 'all' ? undefined : hospitalFilter, cleanPrefs)
      .then(({ stays: list }) => {
        if (!active) return;
        setStays(list);
        setError('');
      })
      .catch((e) => active && setError(apiError(e)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [hospitalFilter, cleanPrefs, isLiveHospital]);

  // Real PGs / hostels / dharamshalas / hotels around the chosen hospital.
  useEffect(() => {
    if (!contextHospital || contextHospital.latitude == null) {
      setLiveStays([]);
      setLiveError('');
      return undefined;
    }
    let active = true;
    setLiveLoading(true);
    setLiveError('');
    stayService
      .live(contextHospital, cleanPrefs)
      .then((list) => {
        if (!active) return;
        setLiveStays(list);
        setLiveVisible(LIVE_PAGE_SIZE);
      })
      .catch((e) => {
        if (!active) return;
        setLiveStays([]);
        setLiveError(apiError(e));
      })
      .finally(() => active && setLiveLoading(false));
    return () => {
      active = false;
    };
  }, [contextHospital, cleanPrefs]);

  const loadMyRequests = useCallback(() => {
    if (!user) {
      setMyRequests([]);
      return;
    }
    stayService.myRequests().then(setMyRequests).catch(() => setMyRequests([]));
  }, [user]);

  useEffect(loadMyRequests, [loadMyRequests]);

  // Only one "best match" on screen: MediTrust stays win when there are any.
  const shownLiveStays = useMemo(
    () => (stays.length ? liveStays.map((s) => ({ ...s, isBestMatch: false })) : liveStays),
    [stays.length, liveStays]
  );
  const mapHospitals = useMemo(() => {
    if (contextHospital) return [contextHospital];
    const ids = new Set(stays.map((s) => s.nearHospitalId));
    return hospitals.filter((h) => ids.has(h.id));
  }, [contextHospital, hospitals, stays]);
  const mapStays = useMemo(
    () => (contextHospital ? [...stays, ...shownLiveStays] : stays),
    [contextHospital, stays, shownLiveStays]
  );
  const hospitalLookup = useMemo(
    () => (contextHospital ? { ...hospitalById, [contextHospital.id]: contextHospital } : hospitalById),
    [hospitalById, contextHospital]
  );

  const sortedStays = useMemo(() => [...stays].sort(SORTS[sort].fn), [stays, sort]);
  const sortedLiveStays = useMemo(() => [...shownLiveStays].sort(SORTS[sort].fn), [shownLiveStays, sort]);
  const bestMatch = stays.find((s) => s.isBestMatch);

  const selectStay = useCallback((id) => {
    setSelectedStayId(id);
    document.getElementById(`stay-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  const showOnMap = (id) => {
    setSelectedStayId(id);
    document.querySelector('.stay-map-wrap')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleSubmitted = (created) => {
    setRequestStay(null);
    setNotice(
      `Request #${created.id} sent for ${created.room_type} at ${created.stay_name}. The provider will confirm availability — estimated ${inr(created.estimated_cost)}.`
    );
    loadMyRequests();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = async (id) => {
    try {
      setCancellingId(id);
      await stayService.cancelRequest(id);
      loadMyRequests();
    } catch (e) {
      setNotice(apiError(e));
    } finally {
      setCancellingId(null);
    }
  };

  const sortSelect = (
    <label>
      Sort by{' '}
      <select value={sort} onChange={(e) => setSort(e.target.value)}>
        {Object.entries(SORTS).map(([key, s]) => (
          <option key={key} value={key}>{s.label}</option>
        ))}
      </select>
    </label>
  );

  const liveSection = contextHospital && (
    <div className="stay-live-section">
      <div className="stay-list-head">
        <h3>
          {liveLoading
            ? `Finding stays near ${contextHospital.name}...`
            : `${liveStays.length} nearby stay${liveStays.length === 1 ? '' : 's'} within ${cleanPrefs.maxDistanceKm} km`}
        </h3>
        {isLiveHospital && sortSelect}
      </div>
      <p className="stay-hint">
        <Icon name="map-pin" size={14} /> Real PGs, hostels, dharamshalas, guest houses and hotels from Google Maps. Prices are estimates — call before you go.
      </p>
      {liveError ? (
        <div className="no-results-state">
          <Icon name="help" size={42} color="#94a3b8" />
          <h3>{liveError}</h3>
          <p>Check that the backend is running and GOOGLE_MAPS_API_KEY is set.</p>
        </div>
      ) : !liveLoading && liveStays.length === 0 ? (
        <div className="no-results-state">
          <Icon name="home" size={42} color="#94a3b8" />
          <h3>No stays found in this range</h3>
          <p>Increase the max distance, raise your budget or untick "Only affordable".</p>
        </div>
      ) : (
        <div className={`stays-grid${liveLoading ? ' is-loading' : ''}`}>
          {sortedLiveStays.slice(0, liveVisible).map((stay) => (
            <LiveStayCard
              key={stay.id}
              stay={stay}
              hospital={contextHospital}
              prefs={cleanPrefs}
              selected={stay.id === selectedStayId}
              onSelect={() => setSelectedStayId(stay.id)}
            />
          ))}
        </div>
      )}
      {!liveLoading && sortedLiveStays.length > liveVisible && (
        <div className="stay-show-more">
          <button type="button" className="btn btn-outline" onClick={() => setLiveVisible((n) => n + LIVE_PAGE_SIZE)}>
            Show more stays ({sortedLiveStays.length - liveVisible} left)
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="stay-page-wrapper">
      <div className="container">
        <button type="button" className="back-breadcrumb-btn" onClick={() => onNavigate('home')}>
          <Icon name="arrow-right" size={14} className="rotate-180" />
          <span>Back to Home</span>
        </button>

        <div className="stay-page-header">
          <div className="section-pill">
            <Icon name="home" size={14} />
            <span>MediTrust Verified Patient Stay Network</span>
          </div>
          <h1 className="stay-page-title">Where will you stay during treatment?</h1>
          <p className="stay-page-subtitle">
            Pick your hospital and tell us your budget. We find affordable PGs, dharamshalas, guest houses and
            hotels around it — ranked by price, distance and ratings — along with MediTrust verified stays.
          </p>
        </div>

        {contextHospital && (
          <div className="stay-context-banner">
            <Icon name="map-pin" size={18} />
            <span>
              Showing stays near <strong>{contextHospital.name}</strong>
            </span>
            <button type="button" className="stay-context-reset" onClick={() => pickHospital('all')}>
              View all MediTrust hospitals
            </button>
          </div>
        )}

        <div className="stay-filter-row">
          <label htmlFor="stayHospitalFilter">
            <Icon name="building" size={14} />
            <span>Hospital:</span>
          </label>
          <select id="stayHospitalFilter" value={hospitalFilter} onChange={(e) => pickHospital(e.target.value)}>
            <option value="all">All MediTrust hospitals</option>
            {liveHospital && !liveHospitals.some((h) => h.id === liveHospital.id) && (
              <option value={liveHospital.id}>Near {liveHospital.name}</option>
            )}
            {liveHospitals.length > 0 && (
              <optgroup label="Hospitals near you">
                {liveHospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    Near {h.name} ({h.distance.toFixed(1)} km from you)
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="MediTrust partner hospitals">
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  Near {h.name}
                </option>
              ))}
            </optgroup>
          </select>
          <span className="stay-location-status">
            {locationStatus === 'detecting' && 'Detecting your location...'}
            {locationStatus === 'ok' && (
              <><Icon name="navigation" size={12} /> Using your location</>
            )}
            {locationStatus === 'denied' && (
              <>
                Location is off.{' '}
                <button type="button" className="stay-link-btn" onClick={detectLocation}>Allow location</button>
              </>
            )}
          </span>
        </div>

        {notice && (
          <div className="directions-notice-toast stay-request-toast" role="status">
            <Icon name="check" size={18} color="#0d9488" />
            <span>{notice}</span>
            <button type="button" className="toast-close" onClick={() => setNotice(null)} aria-label="Dismiss">
              <Icon name="close" size={14} />
            </button>
          </div>
        )}

        <MyRequests requests={myRequests} onCancel={handleCancel} cancellingId={cancellingId} />

        <PreferencesPanel
          prefs={prefs}
          onChange={setPrefs}
          onReset={() => setPrefs(DEFAULT_PREFS)}
          liveOnly={isLiveHospital}
        />

        {error ? (
          <div className="no-results-state">
            <Icon name="help" size={42} color="#94a3b8" />
            <h3>{error}</h3>
            <p>Make sure the MediTrust backend is running, then refresh.</p>
          </div>
        ) : (
          <>
            {!contextHospital && stays.length > 0 && (
              <p className="stay-hint">
                <Icon name="help" size={14} /> Pick your hospital above to also see affordable PGs, dharamshalas and hotels around it.
              </p>
            )}

            {bestMatch && (
              <BestMatchCard
                stay={bestMatch}
                hospital={hospitalLookup[bestMatch.nearHospitalId]}
                prefs={cleanPrefs}
                onShowOnMap={() => showOnMap(bestMatch.id)}
                onRequest={() => setRequestStay(bestMatch)}
              />
            )}

            <div className="stay-map-section">
              <StayMap
                hospitals={mapHospitals}
                stays={mapStays}
                radiusKm={contextHospital ? cleanPrefs.maxDistanceKm : null}
                selectedStayId={selectedStayId}
                onSelectStay={selectStay}
              />
            </div>

            {!isLiveHospital && (
              <>
                <div className="stay-list-head">
                  <h3>
                    {loading
                      ? 'Finding MediTrust stays...'
                      : `${stays.length} MediTrust verified stay${stays.length === 1 ? '' : 's'}`}
                  </h3>
                  {sortSelect}
                </div>

                {!loading && stays.length === 0 ? (
                  <div className="no-results-state">
                    <Icon name="home" size={42} color="#94a3b8" />
                    <h3>No verified stays listed near this hospital yet</h3>
                    <p>{contextHospital ? 'See the nearby stays below.' : 'Pick a hospital above to find stays around it.'}</p>
                  </div>
                ) : (
                  <div className={`stays-grid${loading ? ' is-loading' : ''}`}>
                    {sortedStays.map((stay) => (
                      <StayCard
                        key={stay.id}
                        stay={stay}
                        hospital={hospitalLookup[stay.nearHospitalId]}
                        prefs={cleanPrefs}
                        selected={stay.id === selectedStayId}
                        onSelect={() => setSelectedStayId(stay.id)}
                        onRequest={() => setRequestStay(stay)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {liveSection}
          </>
        )}

        <div className="stay-disclaimer-box">
          <Icon name="shield" size={16} color="#0d9488" />
          <p>
            MediTrust verifies provider identity, address, facilities and pricing for its listed stays, but does not own
            or operate these accommodations. Nearby stays from Google Maps are not verified and their prices are
            estimates — always confirm directly with the provider before travelling.
          </p>
        </div>
      </div>

      {requestStay && (
        <RequestModal
          stay={requestStay}
          prefs={cleanPrefs}
          user={user}
          onClose={() => setRequestStay(null)}
          onNavigate={onNavigate}
          onSubmitted={handleSubmitted}
        />
      )}
    </div>
  );
}
