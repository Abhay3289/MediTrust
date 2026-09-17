import { api } from './api';

const normalize = (s) => ({
  ...s,

  nearHospitalId:
    s.near_hospital_id ?? s.nearHospitalId,

  distanceFromHospital:
    s.distance_from_hospital ??
    s.distanceFromHospital ??
    null,

  distanceText:
    s.distance_text ??
    s.distanceText ??
    null,

  pricePerDay:
    s.price_per_day ??
    s.pricePerDay ??
    null,

  foodPerDay:
    s.food_per_day ??
    s.foodPerDay ??
    null,

  mandatoryCharges:
    s.mandatory_charges ??
    s.mandatoryCharges ??
    null,

  longStaySupport:
    s.long_stay_support ??
    s.longStaySupport ??
    false,

  caregiverFriendly:
    s.caregiver_friendly ??
    s.caregiverFriendly ??
    false,

  stayBreakdown:
    s.stay_breakdown ??
    s.stayBreakdown ??
    {},

  facilities:
    Array.isArray(s.facilities)
      ? s.facilities
      : [],

  reviews:
    Array.isArray(s.reviews)
      ? s.reviews
      : [],

  source:
    s.source ?? 'meditrust',

  isMediTrustListed:
    s.is_meditrust_listed ??
    s.isMediTrustListed ??
    false,

  googleMapsUrl:
    s.google_maps_url ??
    s.googleMapsUrl ??
    null,

  rating:
    s.rating ?? null,

  reviewsCount:
    s.reviews_count ??
    s.reviewsCount ??
    0,

  contact:
    s.contact ?? null,

  latitude:
    s.latitude ?? null,

  longitude:
    s.longitude ?? null,

  roomOptions:
    Array.isArray(s.room_options)
      ? s.room_options
      : [],
});

// Extra fields returned by /stays/recommend.
const normalizeMatch = (s) => ({
  ...normalize(s),
  matchScore: s.match_score,
  scoreBreakdown: s.score_breakdown || {},
  distanceKm: s.distance_km,
  walkMinutes: s.walk_minutes,
  withinDistance: s.within_distance,
  qualityScore: s.quality_score,
  recommendedRoom: s.recommended_room,
  rooms: Array.isArray(s.rooms) ? s.rooms : [],
  reasons: s.reasons || [],
  warnings: s.warnings || [],
  rank: s.rank,
  isBestMatch: Boolean(s.is_best_match),
});

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// Real-world stays from /stays/live (Google Places, estimated prices).
const normalizeLive = (s, hospitalId) => ({
  ...s,
  isLive: true,
  nearHospitalId: hospitalId,
  distanceKm: s.distance_km,
  distanceText: s.distance_text,
  walkMinutes: s.walk_minutes,
  matchScore: s.match_score,
  reviewsCount: s.reviews_count || 0,
  googleMapsUrl: s.google_maps_url,
  roomsNeeded: s.rooms_needed,
  dailyCostMin: s.daily_cost_min,
  dailyCostMax: s.daily_cost_max,
  totalCostMin: s.total_cost_min,
  totalCostMax: s.total_cost_max,
  withinBudget: Boolean(s.within_budget),
  isAffordable: Boolean(s.is_affordable),
  isBestMatch: Boolean(s.is_best_match),
  priceText: `≈ ${inr(s.daily_cost_min)} – ${inr(s.daily_cost_max)}/day (estimate)`,
  reasons: s.reasons || [],
  warnings: s.warnings || [],
});


export const stayService = {

  // Existing MediTrust DB stays
  list: async (hospitalId) => {
    const { data } = await api.get(
      '/stays',
      {
        params: hospitalId
          ? { hospital_id: hospitalId }
          : undefined,
      }
    );

    return Array.isArray(data)
      ? data.map(normalize)
      : [];
  },


  // MediTrust + real-world nearby accommodation
  nearby: async (
    hospitalId,
    radiusKm = 10
  ) => {
    const { data } = await api.get(
      '/stays/nearby',
      {
        params: {
          hospital_id: hospitalId,
          radius_km: radiusKm,
        },
      }
    );

    return Array.isArray(data)
      ? data.map(normalize)
      : [];
  },


  // Ranked stays + best room for the patient's needs
  recommend: async (hospitalId, prefs = {}) => {
    const { data } = await api.get(
      '/stays/recommend',
      {
        params: {
          hospital_id: hospitalId,
          budget_per_day: prefs.budgetPerDay,
          nights: prefs.nights,
          guests: prefs.guests,
          include_food: prefs.includeFood,
          need_caregiver: prefs.needCaregiver,
          need_accessible: prefs.needAccessible,
          need_ac: prefs.needAc,
          max_distance_km: prefs.maxDistanceKm,
        },
      }
    );

    return {
      hospital: data.hospital,
      stays: (data.stays || []).map(normalizeMatch),
    };
  },


  // Real PGs / hostels / dharamshalas / hotels around any hospital location
  live: async (hospital, prefs = {}) => {
    const { data } = await api.get(
      '/stays/live',
      {
        params: {
          latitude: hospital.latitude,
          longitude: hospital.longitude,
          radius_km: prefs.maxDistanceKm,
          budget_per_day: prefs.budgetPerDay,
          nights: prefs.nights,
          guests: prefs.guests,
          affordable_only: prefs.affordableOnly || undefined,
        },
      }
    );

    return (data.stays || []).map((s) => normalizeLive(s, hospital.id));
  },


  createRequest: async (payload) => {
    const { data } = await api.post(
      '/stays/requests',
      payload
    );

    return data;
  },


  myRequests: async () => {
    const { data } = await api.get(
      '/stays/requests/me'
    );

    return data;
  },


  cancelRequest: async (requestId) => {
    const { data } = await api.patch(
      `/stays/requests/${requestId}/cancel`
    );

    return data;
  },
};
