# MediTrust — Poori Codebase Ki Documentation

Yeh file batati hai ki project ke **andar har file kya kaam karti hai**. Isse aap kisi bhi cheez ko badalna ho to pata chal jayega **kahan jaana hai**.

> Simple soch: **Frontend** = website jo browser me dikhti hai (React). **Backend** = server jo data deta/leta hai (FastAPI/Python). **Database** = jahan sab data (users, hospitals, bookings) save hota hai (PostgreSQL).

---

## 1. Project ka structure (top-level)

```
MediTrust-FullStack-2/
├── frontend/              ← React website (yeh live hai)
├── frontend-backup/        ← purani copy, ignore karein
├── backend/                ← FastAPI server + database code
├── vercel.json             ← Vercel ko batata hai frontend+backend kaise deploy karna hai
├── render.yaml              ← (abhi use nahi ho raha, future ke liye rakha hai)
├── README.md                ← project setup ke steps
├── API_DOCUMENTATION.md     ← saare API endpoints ki list
└── DEPLOY_RENDER_VERCEL.md  ← Render/Vercel par deploy karne ka guide
```

**Kaise chalta hai (bahut simple):**

```
Browser (React) → api.js → Backend (FastAPI) → Database (PostgreSQL)
                                ↓
                    Google Maps / OpenStreetMap (external services)
```

---

## 2. BACKEND (`backend/`)

Backend **FastAPI** (Python) se bana hai. Iska structure "layers" me bata hua hai — har layer ka apna kaam hai:

| Folder | Kaam |
|---|---|
| `models/` | Database ki **tables** define karta hai (jaise Excel ke columns) |
| `schemas/` | API me **kya data aana/jana chahiye** uska shape define karta hai |
| `routers/` | **URLs** define karte hain (jaise `/api/hospitals`) |
| `services/` | Asli **logic/calculation** yahan hota hai |
| `core/` | Settings, security (password/token) |
| `db/` | Database se connect karna, sample data dalna |
| `alembic/` | Database me table banane/badalne ki history |
| `tests/` | Automatic tests |

### 2.1 `backend/app/main.py`
Poori app ki **shuruaat** yahan se hoti hai. Yeh sab routers (URLs) ko jod ke ek app banata hai, aur CORS (kaun si website backend ko call kar sakti hai) set karta hai.

### 2.2 `backend/app/core/` — Settings & Security

| File | Kaam |
|---|---|
| `config.py` | Saari settings ek jagah — database URL, secret key, Google Maps key waghera. Yeh `.env` file se values padhta hai. |
| `security.py` | Password ko hash (encrypt) karna, login token (JWT) banana/padhna |
| `dependencies.py` | `get_current_user` — pata karta hai request bhejne wala user **login hai ya nahi** |

### 2.3 `backend/app/db/` — Database Connection

| File | Kaam |
|---|---|
| `database.py` | Database se connection banata hai |
| `base.py` | Saari tables ka common parent (SQLAlchemy ka rule) |
| `seed.py` + `seed_data.json` | Database khaali ho to **sample data** (hospitals, doctors) bhar deta hai |

### 2.4 `backend/app/models/` — Database Tables

Har file = ek table. **Yahan se aapko pata chalega database me kya-kya column hain.**

| File | Table | Kya store hota hai |
|---|---|---|
| `user.py` | `users` | Naam, email, phone, password (hashed), role |
| `hospital.py` | `hospitals` | Naam, address, rating, specialties, trust score ke numbers |
| `doctor.py` | `doctors` | Naam, specialty, fee, availability |
| `appointment.py` | `appointments` | Kaunsa patient, kaunsa doctor, kab, kaisi (in-clinic/video) |
| `consultation.py` | `consultations` | Online video consultation ki details |
| `review.py` | `reviews` | Hospital/doctor ke reviews aur rating |
| `saved_hospital.py` | `saved_hospitals` | User ne kaunse hospitals "save" kiye |
| `health_problem.py` | `health_problems` | "Diabetes", "Cardiology" jaise problems aur unse judi keywords |
| `stay.py` | `stays`, `stay_requests` | Patient Stay (PG/hotel) listings aur booking requests |
| `notification.py` | `notifications` | User ko diye gaye notifications |

### 2.5 `backend/app/schemas/` — API ka "shape"

Yeh files batati hain ki jab aap API ko data bhejo ya API aapko data de, to woh **kaise dikhna chahiye** (kaunse fields zaroori hain, kaunse optional). Har model ki apni schema file hai (`auth.py`, `hospital.py`, `doctor.py`, `appointment.py`, `consultation.py`, `review.py`, `stay.py`, `user.py`, `location.py`, `common.py`).

Example: `auth.py` me `RegisterRequest` batata hai signup karte waqt kya-kya bhejna hai (naam, email/phone, password).

### 2.6 `backend/app/routers/` — URLs (API Endpoints)

Yeh sabse important folder hai — **yahan har URL likha hai jo frontend call karta hai.**

| File | URL Prefix | Kya karta hai |
|---|---|---|
| `health.py` | `/api/health` | Server "zinda" hai ya nahi check karne ke liye |
| `auth.py` | `/api/auth` | Signup, login, password bhool gaye, OTP, token refresh |
| `users.py` | `/api/users` | Apni profile dekhna/update karna |
| `hospitals.py` | `/api/hospitals` | Database ke hospitals + Google/OSM se real hospitals dhoondhna |
| `doctors.py` | `/api/doctors` | Doctors ki list, search, availability |
| `appointments.py` | `/api/appointments` | Appointment book/dekhna/cancel karna |
| `consultations.py` | `/api/consultations` | Online video consultation book karna |
| `reviews.py` | `/api/hospitals/{id}/reviews`, `/api/doctors/{id}/reviews` | Reviews likhna/padhna |
| `saved.py` | `/api/saved-hospitals` | Hospital ko "save"/"unsave" karna |
| `health_problems.py` | `/api/health-problems` | "Mujhe diabetes hai" type search se hospitals suggest karna |
| `stays.py` | `/api/stays` | Patient Stay — MediTrust ki listings + Google se real PG/hotel dhoondhna |
| `location.py` | `/api/location` | Latitude/longitude se shehar/address pata karna (reverse geocoding) |

**Zaroori cheez:** `hospitals.py` me `/real/nearby` aur `/real/search` naam ke do endpoints hain jo **Google Maps** se live hospitals laate hain (jo MediTrust ki apni database me nahi hain).

### 2.7 `backend/app/services/` — Asli Logic

Router sirf URL leta hai, **calculation/kaam services me hota hai.**

| File | Kaam |
|---|---|
| `auth_service.py` | Signup/login ki poori logic, password check, sahi user dhoondhna |
| `location_service.py` | Do coordinates ke beech distance nikalna (haversine formula), reverse-geocoding (OpenStreetMap se) |
| `google_places_service.py` | Google Maps API ko call karke real hospitals/PG/hotels laata hai |
| `osm_hospital_service.py` | ⚠️ **Abhi use nahi ho raha.** OpenStreetMap se (bina Google key ke) hospital dhoondhne ka backup code — banaya tha lekin filhaal band hai |
| `stay_service.py` | MediTrust ki apni listed stays (PG/hotel) ko patient ki zaroorat ke hisaab se score/rank karta hai |
| `live_stay_service.py` | Google se aayi real PG/hotel listings ke price ka **andaaza** lagata hai aur unhe rank karta hai |
| `appointment_service.py` | Appointment book karte waqt clash/date check karta hai |
| `otp_service.py` | Phone par OTP bhejna (Twilio se) |
| `email_service.py` | Welcome/login email bhejna (agar SMTP set ho) |
| `notification_service.py` | User ke liye notification banana |

### 2.8 `backend/alembic/` — Database History

Jab bhi database ki table me kuch badla jaata hai, ek "migration" file banti hai — taaki dusre computer/server par bhi wahi changes lagaye ja sakein.

| File | Kaam |
|---|---|
| `env.py` | Migration chalane ka setup |
| `versions/0001_initial.py` | Sabse pehli tables (users, hospitals, doctors, etc.) |
| `versions/0002_stay_rooms_requests.py` | Patient Stay ke rooms aur requests wali tables baad me jodi gayi |

### 2.9 `backend/tests/`

| File | Kya test karta hai |
|---|---|
| `test_health_api.py` | Server chal raha hai ya nahi |
| `test_location.py` | Distance calculate karne wala formula sahi hai |
| `test_security.py` | Password hash/verify sahi kaam karta hai |
| `test_live_stays.py` | Google se aayi PG/hotel listings ka price-andaaza aur ranking sahi hai |

---

## 3. FRONTEND (`frontend/src/`)

Frontend **React** se bana hai. Yeh "single page app" hai — poori website ek hi HTML file me load hoti hai, aur JavaScript se page switch hota hai (URL me `#` ke baad wala hissa dekh kar).

### 3.1 Shuruaat ki files

| File | Kaam |
|---|---|
| `main.jsx` | Website ki pehli line — React ko browser me "mount" karta hai |
| `App.jsx` | **Sabse zaroori file.** URL (`#home`, `#results`, waghera) padh kar sahi page dikhata hai — isse "router" kehte hain |
| `App.css` | Poori website ki styling (5000+ lines — colors, buttons, cards, animations) |
| `index.css` | Design ke "tokens" (colors, fonts, shadows) jo App.css poore App me use karta hai |

### 3.2 `context/AuthContext.jsx`
Yeh batata hai **user login hai ya nahi**, aur poore app me kahin se bhi `useAuth()` bulakar login/logout/register kiya ja sakta hai. Login token browser ki `localStorage` me save hota hai.

### 3.3 `pages/` — Har Page Ek File

Yeh woh screens hain jo user dekhta hai.

| File | Page | Kya dikhata hai |
|---|---|---|
| `HomePage.jsx` | `#home` | Search box, popular hospitals, "how it works", trust engine |
| `HospitalResultsPage.jsx` | `#results` | Search results — list + map, filters |
| `HospitalDetailsPage.jsx` | `#hospital/:id` | Ek hospital ki poori details, trust score, reviews |
| `HealthProblemPage.jsx` | `#health-problem` | "Mujhe yeh problem hai" daalkar matching hospitals dikhana |
| `OnlineConsultationPage.jsx` | `#consultation` | Video consultation ke liye doctors dhoondhna |
| `DoctorDetailsPage.jsx` | `#doctor/:id` | Ek doctor ki details |
| `AppointmentBookingPage.jsx` | `#book-appointment` | Appointment book karne ka form |
| `PatientStayPage.jsx` | `#stays` | PG/hostel/hotel dhoondhna (hospital ke paas) |
| `CustomerHelpPage.jsx` | `#help` | FAQs aur help guide |
| `LoginPage.jsx` | `#login` | Login + Signup (dono ek hi page par tabs se) |
| `ForgotPasswordPage.jsx` | `#forgot-password` | Password bhool gaye — OTP mangwana |
| `OTPPage.jsx` | `#otp` | OTP verify karna |
| `ResetPasswordPage.jsx` | `#reset-password` | Naya password set karna |
| `LogoutPage.jsx` | `#logout` | Logout karke home bhej deta hai |

**Unused/backup files (inhe chhed na)** — kaam ki nahi hain, kabhi delete karna ho to bata dena:
- `LoginPage.before-auth-ui.jsx` — LoginPage ka purana version
- `PatientStayPage.backup.jsx` — PatientStayPage ka purana version

### 3.4 `components/` — Dobara Use Hone Wale Hisse

| File | Kaam |
|---|---|
| `Navbar.jsx` | Sabse upar ka menu bar (logo, links, login button) |
| `Footer.jsx` | Sabse neeche ka hissa |
| `Icons.jsx` | Poori website ke saare icons (SVG) yahan se aate hain |
| `HospitalMap.jsx` | Hospital Results page ka interactive map (Leaflet) |
| `StayMap.jsx` | Patient Stay page ka map |
| `HospitalSkyline.jsx` | Hero sections me background me dikhne wali imaginary buildings ki drawing |
| `DoctorIllustration.jsx` | Online Consultation page ke background me doctor ki drawing (naya, abhi add kiya) |
| `TrustBadge.jsx` | Chhota "Trust 96" jaisa badge |
| `TrustScorePanel.jsx` | Poora trust score ka breakdown (bade cards me) |
| `MatchScoreBadge.jsx` | "94% Match" wala badge (Health Problem page par) |
| `StayScoreBadge.jsx` | Stay ke liye "Trust Badge" jaisa hi badge |
| `WhyRecommended.jsx` | "Why MediTrust recommends it" wali list |
| `ReviewCarousel.jsx` | Reviews ka auto-sliding carousel |

**Unused/backup components (homepage ka purana design, ab kahin use nahi hote)**:
`About.jsx`, `AppointmentModal.jsx`, `Hero.jsx`, `Services.jsx`, `Stats.jsx`, `WhyUs.jsx`

### 3.5 `services/` — Backend Ko Call Karne Wala Code

Har file backend ke ek group of URLs ko call karti hai, aur data ko frontend ke format me badalti hai (jaise `snake_case` ko `camelCase` me).

| File | Kis backend router ko call karta hai |
|---|---|
| `api.js` | **Sabse base file.** Yahan se saari requests jaati hain — token lagana, error handle karna, yahin hota hai |
| `authService.js` | `/auth/*` — login, signup, OTP |
| `userService.js` | `/users/*` — profile |
| `hospitalService.js` | `/hospitals/*` — list, search, nearby, Google real-search |
| `doctorService.js` | `/doctors/*` |
| `appointmentService.js` | `/appointments/*` |
| `consultationService.js` | `/consultations/*` |
| `healthProblemService.js` | `/health-problems/*` |
| `stayService.js` | `/stays/*` — MediTrust listings + live (Google) search |
| `locationService.js` | `/hospitals/nearby`, `/location/reverse-geocode` |

### 3.6 `utils/` — Calculation Ka Logic (Frontend Side)

| File | Kaam |
|---|---|
| `trustEngine.js` | Hospital ka "Trust Score" (0-100) calculate karta hai, 6 factors ke weighted average se |
| `stayEngine.js` | Stay (PG/hotel) ka score calculate karta hai — waise hi jaise trustEngine karta hai |

### 3.7 `data/healthcareData.js`

Kuch static/demo data yahan hai — jaise FAQs (`customerHelpFaqs`) aur testimonials (`patientTestimonials`) jo **abhi bhi live use ho rahe hain**. Isme kuch purana demo data (`hospitalsData`, `patientStaysData`) bhi hai jo sirf **unused components** (About, Doctors, Services, Stats — upar dekhein) use karte hain.

---

## 4. Config Files (root folder me)

| File | Kaam |
|---|---|
| `vercel.json` | Vercel ko batata hai: frontend (Vite) alag service, backend (FastAPI) alag service, aur `/api` wali requests backend ko bhejni hain |
| `render.yaml` | ⚠️ Abhi use nahi ho raha — Render par backend deploy karne ka "blueprint", future ke liye rakha hai |
| `.vercelignore` | Deploy karte waqt kaunsi files na bhejein (jaise local `.env`) |
| `backend/requirements.txt` | Python ki saari libraries jo backend chalane ke liye chahiye |
| `backend/.env` / `.env.example` | Secret keys (database URL, Google Maps key, JWT secret) — `.env` kabhi GitHub par nahi jaati |
| `frontend/package.json` | Frontend ki libraries aur run/build commands |
| `frontend/.env` / `.env.example` | Frontend ki settings (jaise backend ka URL) |
| `frontend/vite.config.js` | Vite (jo React ko build/run karta hai) ka setup |

---

## 5. Ek request kaise travel karti hai — poora example

Maan lijiye user **"diabetes"** search karta hai:

1. Browser me `HealthProblemPage.jsx` khulta hai.
2. User type karta hai → yeh `healthProblemService.js` ko call karta hai.
3. `healthProblemService.js` → `api.js` ke through → backend ke `/api/health-problems` URL par request jaati hai.
4. Backend ka `routers/health_problems.py` yeh request pakadta hai.
5. Woh `models/health_problem.py` (table) se database me dhoondhta hai.
6. Matching hospitals `models/hospital.py` se nikaalta hai.
7. Data wapas JSON banke frontend tak aata hai.
8. `HealthProblemPage.jsx` usse cards me dikha deta hai, `TrustBadge.jsx` aur `MatchScoreBadge.jsx` use karke.

---

## 6. Kya cheez kahan badlein (quick reference)

| Aapko yeh karna hai... | Yahan jaayein |
|---|---|
| Kisi page ka **look/design** badalna | `frontend/src/App.css` + us page ki `.jsx` file |
| Naya button/feature kisi page par | Us page ki file, `frontend/src/pages/` me |
| Naya API endpoint banana | `backend/app/routers/` me naya function |
| Database me naya column/table | `backend/app/models/` + naya alembic migration |
| Trust Score ka formula badalna | `backend/app/services/stay_service.py` (backend calc ke liye) ya `frontend/src/utils/trustEngine.js` (frontend display ke liye) |
| Google Maps se related kuch | `backend/app/services/google_places_service.py` |
| Login/signup ki logic | `backend/app/services/auth_service.py` (backend) + `frontend/src/context/AuthContext.jsx` (frontend) |

---

*Yeh documentation 2026-09-17 ko banayi gayi, project ke us waqt ke code ke hisaab se. Agar naye files jud jaayein, is file ko update kar dena.*
