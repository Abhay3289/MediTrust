import { api } from './api';


// =========================================================
// NORMALIZE HOSPITAL DATA
// =========================================================

const normalize = (h) => ({
  ...h,

  reviewsCount: h.reviews_count,
  hospitalVerified: h.hospital_verified,
  qualityAccreditation: h.quality_accreditation,

  is24x7Emergency: h.is_24x7_emergency,
  hasPediatrics: h.has_pediatrics,
  hasDiagnostics: h.has_diagnostics,

  erWaitTime: h.er_wait_time,
  emergencyHotline: h.emergency_hotline,
  openingHours: h.opening_hours,

  trustBreakdown: h.trust_breakdown,

  distanceText:
    h.distance_text ||
    (h.distance != null
      ? `${h.distance.toFixed(1)} km away`
      : null),

  coordinates:
    h.latitude != null && h.longitude != null
      ? {
          lat: h.latitude,
          lng: h.longitude,
        }
      : null,
});


// =========================================================
// HOSPITAL SERVICE
// =========================================================

export const hospitalService = {

  // -------------------------------------------------------
  // GET ALL HOSPITALS
  // -------------------------------------------------------

  list: async (params = {}) => {
    const { data } = await api.get(
      '/hospitals',
      { params }
    );

    return {
      ...data,
      items: (data.items || []).map(normalize),
    };
  },


  // -------------------------------------------------------
  // SEARCH HOSPITALS
  // -------------------------------------------------------

  search: async (q) => {
    const query = String(q ?? '').trim();

    // Don't call API for empty search
    if (!query) {
      return [];
    }

    const { data } = await api.get(
      '/hospitals/search',
      {
        params: {
          q: query,
        },
      }
    );

    return (data || []).map(normalize);
  },


  // -------------------------------------------------------
  // NEARBY HOSPITALS
  // -------------------------------------------------------

  nearby: async (
    latitude,
    longitude,
    radius_km = 25,
    specialty = null
  ) => {

    // Location required
    if (
      latitude == null ||
      longitude == null
    ) {
      return [];
    }

    const params = {
      latitude,
      longitude,
      radius_km,
    };

    // Add specialty only when provided
    if (
      specialty &&
      String(specialty).trim()
    ) {
      params.specialty =
        String(specialty).trim();
    }

    const { data } = await api.get(
      '/hospitals/nearby',
      { params }
    );

    return (data || []).map(normalize);
  },


  // -------------------------------------------------------
  // EMERGENCY NEARBY
  // -------------------------------------------------------

  emergencyNearby: async (
    latitude,
    longitude,
    radius_km = 25
  ) => {

    if (
      latitude == null ||
      longitude == null
    ) {
      return [];
    }

    const { data } = await api.get(
      '/hospitals/emergency/nearby',
      {
        params: {
          latitude,
          longitude,
          radius_km,
        },
      }
    );

    return (data || []).map(
      (h) => ({
        ...normalize(h),

        is24x7Emergency:
          h.is_24x7_emergency,

        distance:
          h.distance_km,

        distanceText:
          `${h.distance_km} km away`,
      })
    );
  },


  // -------------------------------------------------------
  // GET SINGLE HOSPITAL
  // -------------------------------------------------------

  get: async (id) => {
    const { data } = await api.get(
      `/hospitals/${id}`
    );

    return normalize(data);
  },


  // -------------------------------------------------------
  // HOSPITAL REVIEWS
  // -------------------------------------------------------

  reviews: async (id) => {
    const { data } = await api.get(
      `/hospitals/${id}/reviews`
    );

    return (data || []).map(
      (review) => ({
        ...review,

        author:
          review.reviewer_name ||
          `User ${review.user_id}`,

        date:
          new Date(
            review.created_at
          ).toLocaleDateString(),
      })
    );
  },


  // -------------------------------------------------------
  // ADD REVIEW
  // -------------------------------------------------------

  addReview: async (
    id,
    payload
  ) => {
    const { data } = await api.post(
      `/hospitals/${id}/reviews`,
      payload
    );

    return data;
  },


  // -------------------------------------------------------
  // SAVE HOSPITAL
  // -------------------------------------------------------

  save: async (id) => {
    const { data } = await api.post(
      `/saved-hospitals/${id}`
    );

    return normalize(data);
  },


  // -------------------------------------------------------
  // UNSAVE HOSPITAL
  // -------------------------------------------------------

  unsave: async (id) => {
    const { data } = await api.delete(
      `/saved-hospitals/${id}`
    );

    return data;
  },


  // -------------------------------------------------------
  // GET SAVED HOSPITALS
  // -------------------------------------------------------

  saved: async () => {
    const { data } = await api.get(
      '/saved-hospitals'
    );

    return (data || []).map(normalize);
  },

  realNearby: async (
    latitude,
    longitude,
    radius_km = 25
  ) => {
    const { data } = await api.get(
      '/hospitals/real/nearby',
      {
        params: {
          latitude,
          longitude,
          radius_km,
        },
      }
    );

    return data || [];
  },

  realSearch: async (
    q,
    latitude = null,
    longitude = null,
    radius_km = 25
  ) => {
    const { data } = await api.get(
      '/hospitals/real/search',
      {
        params: {
          q,
          latitude,
          longitude,
          radius_km,
        },
      }
    );

    return data || [];
  },
};