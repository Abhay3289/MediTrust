# MediTrust API Contract

Base URL: `http://localhost:8000/api`

| Method | Endpoint | Auth |
|---|---|---|
| GET | `/health` | No |
| GET | `/health/db` | No |
| POST | `/auth/register` | No |
| POST | `/auth/login` | No |
| GET | `/auth/me` | Yes |
| POST | `/auth/refresh` | No |
| POST | `/auth/logout` | Yes |
| GET/PATCH | `/users/me` | Yes |
| GET/POST | `/hospitals` | POST Yes |
| GET/PATCH/DELETE | `/hospitals/{id}` | PATCH/DELETE Yes |
| GET | `/hospitals/search?q=` | No |
| GET | `/hospitals/nearby` | No |
| GET | `/hospitals/emergency/nearby` | No |
| GET | `/doctors` | No |
| GET | `/doctors/search?q=` | No |
| GET | `/doctors/{id}` | No |
| GET | `/doctors/{id}/availability` | No |
| POST/GET | `/appointments` | Yes |
| GET/PATCH/DELETE | `/appointments/{id}` | Yes |
| POST/GET | `/consultations` | Yes |
| GET/PATCH | `/consultations/{id}` | Yes |
| GET/POST | `/hospitals/{id}/reviews` | POST Yes |
| GET/POST | `/doctors/{id}/reviews` | POST Yes |
| POST/DELETE/GET | `/saved-hospitals/{id}` / `/saved-hospitals` | Yes |
| GET | `/location/reverse-geocode` | No |
| GET | `/health-problems` | No |
| GET | `/health-problems/{id}/recommendations` | No |
| GET | `/stays` | No |
| GET | `/stays/live?latitude=&longitude=&radius_km=&budget_per_day=&nights=&guests=&affordable_only=` (real nearby PG/hostel/dharamshala/hotels from Google, estimated prices) | No |

Protected requests use `Authorization: Bearer <access_token>`.

Swagger and ReDoc are available at `/docs` and `/redoc`.
