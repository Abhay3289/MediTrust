# MediTrust Deployment Guide: Render + Vercel

This guide covers deploying MediTrust with:
- **Frontend**: Vercel
- **Database**: Render PostgreSQL
- **Backend**: Vercel (as service)

## 1. Create PostgreSQL Database on Render

1. Go to [render.com](https://render.com) and sign up
2. Click **New +** → **PostgreSQL**
3. Fill in:
   - **Name**: `meditrust-db`
   - **Database**: `meditrust`
   - **User**: `postgres`
   - **Region**: Choose your region
   - **Plan**: Free (or paid if needed)
4. Click **Create Database**
5. Copy the **External Database URL** (starts with `postgresql://`)
6. Save this URL — you'll need it for backend environment variables

## 2. Run Migrations & Seed Data

On your local machine:

```bash
cd backend
source venv/bin/activate

# Set the database URL to Render's PostgreSQL
export DATABASE_URL="<your-render-database-url>"

# Run migrations
alembic upgrade head

# Seed sample data
python -m app.db.seed

deactivate
```

> **Note:** Replace `<your-render-database-url>` with the URL from Render (step 1).

## 3. Deploy to Vercel

### 3.1 Push to GitHub

Make sure your code is pushed to `github.com/Abhay3289/MediTrust`:

```bash
cd "/home/abhay/Downloads/MediTrust-FullStack-2 2 (2)/MediTrust-FullStack-2"
git add .
git commit -m "Remove Google OAuth; prepare for Render + Vercel deploy"
git push origin main
```

### 3.2 Import Project in Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Select **Import Git Repository** → **Abhay3289/MediTrust**
4. Click **Import**

Vercel will detect `vercel.json` and automatically configure:
- Frontend (Vite) at root
- Backend (FastAPI) at `/api`

### 3.3 Set Environment Variables

In Vercel dashboard → **Settings** → **Environment Variables**, add:

| Name | Value | Notes |
|---|---|---|
| `DATABASE_URL` | `postgresql://...` | From Render step 1 |
| `SECRET_KEY` | Long random value | Generate with `openssl rand -hex 32` |
| `FRONTEND_URL` | `https://<your-project>.vercel.app` | Your Vercel URL |
| `ALLOWED_ORIGINS` | `https://<your-project>.vercel.app,http://localhost:5173` | Add localhost for local testing |
| `SMTP_USERNAME` | Your Gmail | For welcome/login emails (optional) |
| `SMTP_PASSWORD` | Gmail App Password | [Create here](https://myaccount.google.com/apppasswords) (optional) |

### 3.4 Deploy

1. Click **Deploy** button
2. Wait for build to complete (5-10 minutes)
3. Once deployed, your frontend is live at `https://<your-project>.vercel.app`
4. Backend is at `https://<your-project>.vercel.app/api`

## 4. Test the Deployment

### 4.1 Test API

```bash
curl https://<your-project>.vercel.app/api/health
```

Should return:
```json
{
  "status": "ok"
}
```

### 4.2 Test Frontend

Open `https://<your-project>.vercel.app` in browser. You should see MediTrust login page.

### 4.3 Test Registration

1. Go to signup page
2. Enter email and password
3. Should be able to create account (if email setup is configured)

## 5. Troubleshooting

### Database Connection Error
- Check `DATABASE_URL` in Vercel env vars
- Verify Render database is not paused
- Check Render firewall: allow connections from any IP (0.0.0.0/0)

### Backend Returns 404
- Vercel `vercel.json` routes `/api/(.*)` to backend service ✓
- Backend `app/main.py` has `prefix="/api"` on all routers ✓
- Check Vercel build logs for import errors

### Emails Not Sending
- Leave `SMTP_USERNAME` and `SMTP_PASSWORD` empty (both optional)
- If you want emails, create Gmail App Password and set both

### Local Testing After Deploy

Update `frontend/.env` temporarily:
```
VITE_API_URL=https://<your-project>.vercel.app/api
```

Then `npm run dev` and test locally against the live backend.

## 6. Monitoring

- **Vercel**: Dashboard → **Deployments** → View logs
- **Render**: Dashboard → Database → Check metrics
- **Backend logs**: Vercel → Functions → Click `/api` function → Logs

## 7. Next Steps

- [ ] Configure SMTP for welcome/login emails
- [ ] Set up custom domain (vercel.com settings)
- [ ] Enable Render automatic backups
- [ ] Monitor database usage
