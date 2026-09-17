# MediTrust — Full Stack

MediTrust is a React + FastAPI + PostgreSQL healthcare discovery and appointment prototype. The existing visual design is kept, while the important data operations now use a real backend.

## 1. Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL 14+

## 2. PostgreSQL

Create the development database:

```bash
createdb meditrust
```

If `createdb` is unavailable, create a database named `meditrust` in pgAdmin.

## 3. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
```

Open `backend/.env` and set your PostgreSQL password plus a long random `SECRET_KEY`.

Then:

```bash
alembic upgrade head
python -m app.db.seed
uvicorn app.main:app --reload --port 8000
```

API: `http://localhost:8000`
Swagger: `http://localhost:8000/docs`

## 4. Frontend

Open a second terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend: `http://localhost:5173`

`VITE_API_URL` defaults to `http://localhost:8000/api`.

## 5. Authentication

Signup creates a real PostgreSQL user and hashes the password. Login returns an access token and refresh token. The frontend automatically sends the access token and attempts one refresh when an access token expires.

Guest browsing remains available without creating an account. Booking, saved hospitals and reviews require login.

## 6. Maps and location

Hospital discovery requests browser location permission. If granted, the backend calculates distances using Haversine. The map is Leaflet + OpenStreetMap. If permission is denied, users can continue with normal search.

OpenStreetMap/Nominatim is used only for map tiles/reverse geocoding. Do not add private API keys to source files.

## 7. Development seed

`backend/app/db/seed_data.json` was derived from the original frontend dataset. It is development seed data only. The original dataset used simulated map-grid coordinates, so the seed converts those visual positions into development coordinates around New Delhi; these coordinates are not claims about real hospital locations.

## 8. Troubleshooting

### CORS error
Make sure backend is running on port 8000 and `ALLOWED_ORIGINS` includes the exact Vite origin (`http://localhost:5173`).

### `vite: command not found`
Run `npm install` inside `frontend` before `npm run dev`.

### `ModuleNotFoundError`
Activate the backend venv and run `python -m pip install -r requirements.txt`.

### Database connection error
Check PostgreSQL is running, database `meditrust` exists, and `DATABASE_URL` has the correct username/password.

### 401 after login
Clear the browser's MediTrust token storage, log in again, and confirm the backend secret did not change while the browser session was active.
