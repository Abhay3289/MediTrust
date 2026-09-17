import { useEffect, useState } from "react";
import { api } from "../services/api";
import { StayScoreBadge } from "../components/StayScoreBadge";
export default function PatientStayPage() {
  const [query, setQuery] = useState("");
  const [hospitalResults, setHospitalResults] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);

  const [stays, setStays] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [loadingStays, setLoadingStays] = useState(false);
  const [error, setError] = useState("");

  // Hospital search
  useEffect(() => {
    const searchHospitals = async () => {
      const search = query.trim();

      if (search.length < 2) {
        setHospitalResults([]);
        return;
      }

      try {
        setLoadingHospitals(true);
        setError("");

        const { data } = await api.get("/hospitals/real/search", {
          params: {
            query: search,
            radius_km: 25,
          },
        });

        setHospitalResults(data || []);
      } catch (err) {
        console.error("Hospital search error:", err);
        setHospitalResults([]);
        setError("Unable to search hospitals right now.");
      } finally {
        setLoadingHospitals(false);
      }
    };

    const timer = setTimeout(searchHospitals, 400);

    return () => clearTimeout(timer);
  }, [query]);

  // Load nearby patient stays after hospital selection
  const selectHospital = async (hospital) => {
    setSelectedHospital(hospital);
    setQuery(hospital.name);
    setHospitalResults([]);
    setStays(data?.items || []);
    setError("");

    try {
      setLoadingStays(true);

      const hospitalId = hospital.id;

      const { data } = await api.get("/stays/nearby", {
        params: {
          hospital_id: hospitalId,
          radius_km: 10,
        },
      });

      setStays(data || []);
    } catch (err) {
      console.error("Nearby stays error:", err);

      if (err.response?.status === 404) {
        setError(
          "Nearby stays could not be found for this hospital."
        );
      } else {
        setError("Unable to load nearby stays right now.");
      }

      setStays([]);
    } finally {
      setLoadingStays(false);
    }
  };

  const getDistance = (stay) => {
    if (stay.distance_from_hospital != null) {
      return `${Number(stay.distance_from_hospital).toFixed(1)} km`;
    }

    if (stay.distanceFromHospital != null) {
      return `${Number(stay.distanceFromHospital).toFixed(1)} km`;
    }

    if (stay.distance_km != null) {
      return `${Number(stay.distance_km).toFixed(1)} km`;
    }

    return "Distance unavailable";
  };

  const getName = (stay) =>
    stay.name || stay.display_name || "Accommodation";

  const getAddress = (stay) =>
    stay.address || stay.formatted_address || "Address unavailable";

  const isExternal = (stay) =>
    stay.source === "google_places" ||
    stay.is_meditrust_listed === false;

  const getMapsUrl = (stay) =>
    stay.google_maps_uri ||
    stay.googleMapsUri ||
    stay.maps_url ||
    null;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-600">
            Patient Stay
          </p>

          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Find a place to stay near your hospital
          </h1>

          <p className="mt-3 max-w-3xl text-slate-600">
            Search for your hospital and discover nearby PGs, hostels,
            guest houses and other accommodation options for patients
            and caregivers.
          </p>
        </div>

        {/* Hospital Search */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label
            htmlFor="hospital-search"
            className="mb-2 block text-sm font-semibold text-slate-800"
          >
            Search Hospital
          </label>

          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400">
              🔍
            </span>

            <input
              id="hospital-search"
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedHospital(null);
                setStays([]);
              }}
              placeholder="Search hospital name, e.g. AIIMS, Apollo, Fortis..."
              className="w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-11 pr-4 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Search results */}
          {query.trim().length >= 2 && (
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
              {loadingHospitals && (
                <div className="px-4 py-4 text-sm text-slate-500">
                  Searching hospitals...
                </div>
              )}

              {!loadingHospitals &&
                hospitalResults.length === 0 && (
                  <div className="px-4 py-4 text-sm text-slate-500">
                    No hospitals found.
                  </div>
                )}

              {!loadingHospitals &&
                hospitalResults.map((hospital) => (
                  <button
                    key={hospital.id}
                    type="button"
                    onClick={() => selectHospital(hospital)}
                    className="block w-full border-b border-slate-100 px-4 py-4 text-left transition last:border-b-0 hover:bg-slate-50"
                  >
                    <div className="font-semibold text-slate-900">
                      {hospital.name}
                    </div>

                    <div className="mt-1 text-sm text-slate-500">
                      {hospital.address || hospital.formatted_address}
                    </div>

                    {hospital.distance != null && (
                      <div className="mt-1 text-xs text-blue-600">
                        {Number(hospital.distance).toFixed(1)} km away
                      </div>
                    )}
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Selected Hospital */}
        {selectedHospital && (
          <div className="mb-8 rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              Selected Hospital
            </div>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              {selectedHospital.name}
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              {selectedHospital.address ||
                selectedHospital.formatted_address}
            </p>

            <p className="mt-3 text-sm text-blue-700">
              Showing nearby accommodation for the patient and caregiver.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Before hospital selection */}
        {!selectedHospital && !loadingStays && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <div className="text-4xl">🏠</div>

            <h2 className="mt-4 text-xl font-semibold text-slate-900">
              Search for a hospital first
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
              Select the hospital where the patient is receiving treatment.
              We will then show nearby PGs, hostels, guest houses and other
              accommodation options.
            </p>
          </div>
        )}

        {/* Loading */}
        {loadingStays && (
          <div className="rounded-2xl bg-white px-6 py-12 text-center shadow-sm">
            <div className="text-3xl">🔎</div>

            <h2 className="mt-3 font-semibold text-slate-900">
              Finding nearby places to stay...
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Searching around the selected hospital.
            </p>
          </div>
        )}

        {/* Results */}
        {!loadingStays &&
          selectedHospital &&
          stays.length > 0 && (
            <section>
              <div className="mb-5">
                <h2 className="text-2xl font-bold text-slate-900">
                  Nearby places to stay
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Accommodation options near {selectedHospital.name}
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {stays.map((stay, index) => {
                  const external = isExternal(stay);
                  const mapsUrl = getMapsUrl(stay);

                  return (
                    <article
                      key={
                        stay.id ||
                        stay.place_id ||
                        `${getName(stay)}-${index}`
                      }
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                    >
                      <div className="p-5">

                        {/* Type */}
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                            {external
                              ? "Nearby Place"
                              : "MediTrust Stay"}
                          </span>

                          {!external && stay.verified && (
                            <span className="text-xs font-semibold text-green-600">
                              ✓ Verified
                            </span>
                          )}
                        </div>

                        {/* Name */}
                        <h3 className="text-lg font-bold text-slate-900">
                          {getName(stay)}
                        </h3>

                        {/* Address */}
                        <p className="mt-2 text-sm text-slate-500">
                          📍 {getAddress(stay)}
                        </p>

                        {/* Distance */}
                        <div className="mt-3 flex items-center gap-2 text-sm font-medium text-slate-700">
                          <span>📏</span>
                          <span>
                            {getDistance(stay)} from hospital
                          </span>
                        </div>

                        {/* Google rating */}
                        {external &&
                          stay.rating != null && (
                            <div className="mt-3 text-sm text-slate-700">
                              ⭐ {stay.rating}
                              {stay.user_rating_count != null && (
                                <span className="text-slate-500">
                                  {" "}
                                  ({stay.user_rating_count} reviews)
                                </span>
                              )}
                            </div>
                          )}

                        {/* MediTrust score */}
                        {!external && stay.stay_breakdown && (
                          <div className="mt-4">
                            <StayScoreBadge
                              score={
                                stay.stay_score ||
                                stay.stayScore ||
                                0
                              }
                            />
                          </div>
                        )}

                        {/* Facilities */}
                        {!external &&
                          Array.isArray(stay.facilities) &&
                          stay.facilities.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {stay.facilities
                                .slice(0, 5)
                                .map((facility) => (
                                  <span
                                    key={facility}
                                    className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
                                  >
                                    {facility}
                                  </span>
                                ))}
                            </div>
                          )}

                        {/* Pricing only for MediTrust listings */}
                        {!external && (
                          <div className="mt-5 rounded-xl bg-slate-50 p-4">
                            <div className="text-xs text-slate-500">
                              Estimated daily cost
                            </div>

                            <div className="mt-1 text-lg font-bold text-slate-900">
                              ₹
                              {(Number(
                                stay.price_per_day ??
                                  stay.pricePerDay ??
                                  0
                              ) +
                                Number(
                                  stay.food_per_day ??
                                    stay.foodPerDay ??
                                    0
                                )).toLocaleString()}
                              /day
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="mt-5 flex gap-2">
                          {mapsUrl && (
                            <a
                              href={mapsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              📍 View on Map
                            </a>
                          )}

                          {!external && stay.contact && (
                            <a
                              href={`tel:${stay.contact}`}
                              className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                              Call
                            </a>
                          )}
                        </div>

                        {external && (
                          <p className="mt-3 text-xs leading-5 text-slate-400">
                            This place is shown from external places data
                            and is not verified by MediTrust.
                          </p>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

        {/* No results */}
        {!loadingStays &&
          selectedHospital &&
          stays.length === 0 &&
          !error && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <div className="text-4xl">🏠</div>

              <h2 className="mt-4 text-xl font-semibold text-slate-900">
                No nearby accommodation found
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Try another hospital or search again.
              </p>
            </div>
          )}
      </div>
    </div>
  );
}