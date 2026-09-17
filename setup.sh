#!/usr/bin/env bash
set -e
command -v python3 >/dev/null || { echo "Python 3 is required."; exit 1; }
command -v node >/dev/null || { echo "Node.js is required."; exit 1; }
[ -f backend/.env ] || cp backend/.env.example backend/.env
[ -f frontend/.env ] || cp frontend/.env.example frontend/.env
cd backend
python3 -m venv venv
source venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
cd ../frontend
npm install
cd ..
echo "Setup dependencies installed. Edit backend/.env, create PostgreSQL database 'meditrust', then run:"
echo "  cd backend && source venv/bin/activate && alembic upgrade head && python -m app.db.seed"
