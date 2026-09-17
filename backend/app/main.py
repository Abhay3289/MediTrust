from fastapi import FastAPI,Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.routers import auth,users,hospitals,doctors,appointments,consultations,reviews,saved,location,health,health_problems,stays
app=FastAPI(title=settings.app_name,version="1.0.0",description="MediTrust healthcare discovery and booking API")
app.add_middleware(CORSMiddleware,allow_origins=settings.cors_origins,allow_credentials=True,allow_methods=["*"],allow_headers=["*"])
for r in [health.router,auth.router,users.router,hospitals.router,doctors.router,appointments.router,consultations.router,reviews.router,saved.router,location.router,health_problems.router,stays.router]: app.include_router(r,prefix="/api")
@app.exception_handler(Exception)
async def unhandled(request:Request,exc:Exception):
    # Avoid exposing internal stack traces through the public API.
    return JSONResponse(status_code=500,content={"detail":"Internal server error"})
@app.get("/",tags=["Health"])
def root(): return {"name":"MediTrust API","docs":"/docs"}
