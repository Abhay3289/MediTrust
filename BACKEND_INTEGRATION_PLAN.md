# MediTrust Backend Integration Plan

## Existing frontend
- React + Vite single-page app with hash navigation.
- Hospital discovery/results + hospital detail.
- Doctor directory/detail + online consultation.
- Appointment booking.
- Login/signup/guest flow.
- Health-problem matching.
- Patient stays.
- Reviews, trust/match score UI, help/FAQ, and navigation.
- The original `src/data/healthcareData.js` is retained for non-transactional UI copy and to seed development records; core hospital/doctor/booking/auth data is now API-driven.

## Backend modules
- `core`: settings, JWT/password security, auth dependency.
- `db`: SQLAlchemy base, PostgreSQL connection, seed data.
- `models`: users, hospitals, doctors, appointments, consultations, reviews, saved hospitals, notifications, health problems, stays.
- `schemas`: Pydantic request/response validation.
- `routers`: API endpoints by feature.
- `services`: authentication, appointments, location/geocoding, OTP abstraction, notifications.

## Database
`users`, `hospitals`, `doctors`, `appointments`, `consultations`, `reviews`, `saved_hospitals`, `notifications`, `health_problems`, `stays`.

## Frontend integration
Central Axios client in `frontend/src/services/api.js`, with separate service modules and JWT injection/refresh. Authentication is managed by `AuthContext`.

## Location/map
The browser requests real geolocation permission. Coordinates are sent to `/api/hospitals/nearby` and distance is calculated server-side with Haversine. The results map uses Leaflet/OpenStreetMap; no fake user coordinates are used.

## Environment
Backend: `DATABASE_URL`, `SECRET_KEY`, token expiry, CORS origins, map/geocoding/SMS provider settings.
Frontend: `VITE_API_URL`.

## Run order
1. Create PostgreSQL database `meditrust`.
2. Configure `backend/.env`.
3. `cd backend && python3 -m venv venv && source venv/bin/activate`.
4. `python -m pip install -r requirements.txt`.
5. `alembic upgrade head`.
6. `python -m app.db.seed`.
7. Start API on port 8000.
8. `cd frontend && npm install && npm run dev`.
