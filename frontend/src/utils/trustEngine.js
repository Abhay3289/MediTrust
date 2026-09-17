
// MediTrust Trust Engine
// Safe version — handles missing/null hospital data without crashing.
// This is a navigation/coordination aid, not a medical or guarantee-of-outcome score.

export const TRUST_WEIGHTS = {
  verifiedExperience: 0.30,
  hospitalVerification: 0.20,
  serviceAvailability: 0.15,
  doctorVerification: 0.15,
  complaintResolution: 0.10,
  transparency: 0.10,
};

export const TRUST_FACTOR_LABELS = {
  verifiedExperience: 'Verified Patient Experience',
  hospitalVerification: 'Hospital Verification',
  serviceAvailability: 'Required Service Availability',
  doctorVerification: 'Doctor Verification',
  complaintResolution: 'Complaint Resolution',
  transparency: 'Information / Price Transparency',
};

/**
 * Weighted MediTrust Trust Score (0-100).
 *
 * Safely handles:
 * - undefined breakdown
 * - null breakdown
 * - missing trust fields
 */
export function computeTrustScore(breakdown = {}) {
  // Important:
  // Default parameters do NOT handle null.
  // So explicitly convert null/invalid values to an empty object.
  const safeBreakdown =
    breakdown && typeof breakdown === 'object'
      ? breakdown
      : {};

  const total = Object.entries(TRUST_WEIGHTS).reduce(
    (sum, [key, weight]) => {
      const value = Number(safeBreakdown[key]) || 0;
      return sum + value * weight;
    },
    0
  );

  return Math.round(total);
}

export function trustScoreLabel(score) {
  if (score >= 90) {
    return {
      label: 'Excellent Trust',
      tone: 'excellent',
    };
  }

  if (score >= 75) {
    return {
      label: 'Good Trust',
      tone: 'good',
    };
  }

  return {
    label: 'Fair Trust',
    tone: 'fair',
  };
}

/**
 * Healthcare Match Score (0-100).
 *
 * Safely handles missing/null:
 * - hospital
 * - specialties
 * - trustBreakdown
 * - distance
 * - emergency flag
 */
export function computeMatchScore(
  hospital = {},
  { specialty, hasVerifiedDoctor } = {}
) {
  const safeHospital =
    hospital && typeof hospital === 'object'
      ? hospital
      : {};

  const specialties = Array.isArray(safeHospital.specialties)
    ? safeHospital.specialties.filter(
        (s) => typeof s === 'string'
      )
    : [];

  let score = 74;

  if (specialty && typeof specialty === 'string') {
    const q = specialty.toLowerCase().trim();

    const exact = specialties.some(
      (s) => s.toLowerCase() === q
    );

    const partial = specialties.some(
      (s) =>
        s.toLowerCase().includes(q) ||
        q.includes(s.toLowerCase())
    );

    if (exact) {
      score += 14;
    } else if (partial) {
      score += 9;
    }
  } else {
    score += 8;
  }

  if (safeHospital.is24x7Emergency) {
    score += 3;
  }

  if (hasVerifiedDoctor) {
    score += 4;
  }

  const distance = Number(safeHospital.distance);

  if (!Number.isNaN(distance)) {
    if (distance <= 3) {
      score += 5;
    } else if (distance <= 6) {
      score += 2;
    }
  }

  // Safely calculate trust score even if trustBreakdown is null.
  const trust = computeTrustScore(
    safeHospital.trustBreakdown
  );

  score += Math.round((trust - 80) / 8);

  return Math.max(
    70,
    Math.min(99, Math.round(score))
  );
}

/**
 * Whether MediTrust has a verified doctor associated
 * with this hospital.
 */
export function hasVerifiedDoctorAt(
  hospital = {},
  doctors = []
) {
  const safeHospital =
    hospital && typeof hospital === 'object'
      ? hospital
      : {};

  const safeDoctors = Array.isArray(doctors)
    ? doctors
    : [];

  const hospitalName =
    typeof safeHospital.name === 'string'
      ? safeHospital.name.trim().toLowerCase()
      : '';

  if (!hospitalName) {
    return false;
  }

  const hospitalFirstWord =
    hospitalName.split(/[\s&]/)[0];

  return safeDoctors.some((doc) => {
    if (!doc || !doc.verified) {
      return false;
    }

    if (typeof doc.hospital !== 'string') {
      return false;
    }

    return doc.hospital
      .toLowerCase()
      .includes(hospitalFirstWord);
  });
}

/**
 * Explainable "Why MediTrust recommends this hospital"
 * bullet list.
 */
export function getWhyRecommended(
  hospital = {},
  { specialty, doctors = [] } = {}
) {
  const safeHospital =
    hospital && typeof hospital === 'object'
      ? hospital
      : {};

  const specialties = Array.isArray(
    safeHospital.specialties
  )
    ? safeHospital.specialties.filter(
        (s) => typeof s === 'string'
      )
    : [];

  const reasons = [];

  const verifiedDoctor = hasVerifiedDoctorAt(
    safeHospital,
    doctors
  );

  if (
    specialty &&
    typeof specialty === 'string' &&
    specialties.length > 0
  ) {
    const matched = specialties.find(
      (s) =>
        s
          .toLowerCase()
          .includes(specialty.toLowerCase()) ||
        specialty
          .toLowerCase()
          .includes(s.toLowerCase())
    );

    if (matched) {
      reasons.push(
        `Required specialty available: ${matched}`
      );
    }
  } else if (specialties.length > 0) {
    reasons.push(
      `Certified department available: ${specialties[0]}`
    );
  }

  if (safeHospital.is24x7Emergency) {
    reasons.push(
      '24/7 emergency service availability'
    );
  }

  if (verifiedDoctor) {
    reasons.push(
      'MediTrust Verified doctor associated with this hospital'
    );
  }

  if (safeHospital.hospitalVerified) {
    reasons.push(
      'Hospital identity, address & departments MediTrust Verified'
    );
  }

  if (safeHospital.qualityAccreditation) {
    reasons.push(
      `External quality signal: ${safeHospital.qualityAccreditation}`
    );
  }

  const verifiedExperience = Number(
    safeHospital.trustBreakdown?.verifiedExperience
  ) || 0;

  if (verifiedExperience >= 90) {
    reasons.push(
      'Strong verified patient experience history'
    );
  }

  if (safeHospital.distanceText) {
    reasons.push(
      `Suitable location — ${safeHospital.distanceText}`
    );
  }

  return reasons;
}

