from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import auth as auth_routes

app = FastAPI(
    title="MediTrust API",
    description="Authentication system for the MediTrust healthcare platform.",
    version="0.1.0",
)

# CORS: by default, a browser blocks a frontend running on one origin
# (e.g. http://localhost:5173) from calling an API on a different
# origin (e.g. http://localhost:8000), unless the API explicitly says
# it's allowed. We only allow the frontend's own local dev addresses -
# never "*" (which would let ANY website on the internet call this API
# using a logged-in user's browser).
#
# The frontend isn't decided yet, so both common React dev server
# ports are allowed for now. Once the real frontend exists, narrow
# this list down to just the one port it actually uses.
FRONTEND_DEV_ORIGINS = [
    "http://localhost:5173",  # Vite default
    "http://localhost:3000",  # Create React App default
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_DEV_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)


@app.get("/health", tags=["Health"])
def health_check():
    """
    Confirms the API process is running.
    Does not touch the database - this only proves the server itself is alive.
    """
    return {"status": "ok", "service": "MediTrust API"}
