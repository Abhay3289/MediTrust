# MediTrust Backend

FastAPI + PostgreSQL backend for the MediTrust React application.

## Run

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
# edit DATABASE_URL and SECRET_KEY
alembic upgrade head
python -m app.db.seed
uvicorn app.main:app --reload --port 8000
```

Swagger: `http://localhost:8000/docs`

The seed data is development-only. Hospital coordinates are mapped into the New Delhi area so the real map has usable development coordinates; they are not claims about real facilities.
