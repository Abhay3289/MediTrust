// MediTrust Stay Matching Engine — PRD Section 29/30/31 (Module 8: Verified
// Patient Stay Network). Scores accommodation the same explainable way the
// Trust Engine scores hospitals: real signals, published weights, no ranking for sale.

export const STAY_WEIGHTS = {
  hospitalDistance: 0.20,
  longStaySupport: 0.20,
  priceTransparency: 0.20,
  verificationHygiene: 0.15,
  caregiverSupport: 0.10,
  accessibility: 0.10,
  patientExperience: 0.05,
};

export const STAY_FACTOR_LABELS = {
  hospitalDistance: 'Hospital Distance',
  longStaySupport: 'Long-Stay Support',
  priceTransparency: 'Price Transparency',
  verificationHygiene: 'Verification / Hygiene Information',
  caregiverSupport: 'Caregiver Support',
  accessibility: 'Accessibility',
  patientExperience: 'Patient Experience',
};

/** Weighted MediTrust Stay Score (0-100), computed live from a stay's breakdown. */
export function computeStayScore(breakdown = {}) {
  const total = Object.entries(STAY_WEIGHTS).reduce(
    (sum, [key, weight]) => sum + (breakdown[key] || 0) * weight,
    0
  );
  return Math.round(total);
}

/** Transparent Stay Pricing — PRD Section 31: Room + Food + Mandatory charges -> 30-day estimate. */
export function estimateStayCost(stay) {
  const dailyTotal = (stay.pricePerDay || 0) + (stay.foodPerDay || 0);
  const estimated30Day = dailyTotal * 30 + (stay.mandatoryCharges || 0);
  return { dailyTotal, estimated30Day };
}
