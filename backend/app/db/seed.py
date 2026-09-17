import json
from pathlib import Path
from sqlalchemy import select
from app.db.database import SessionLocal
from app.models.hospital import Hospital
from app.models.doctor import Doctor
from app.models.health_problem import HealthProblem
from app.models.stay import Stay
from app.models.review import Review
from app.models.user import User
from app.core.security import hash_password

def run():
    data=json.loads(Path(__file__).with_name("seed_data.json").read_text())
    db=SessionLocal()
    try:
        for item in data["hospitalsData"]:
            if db.get(Hospital,item["id"]): continue
            coords=item.get("coordinates",{})
            db.add(Hospital(id=item["id"],name=item["name"],tagline=item.get("tagline"),type=item.get("type"),address=item["address"],city=item["city"],phone=item.get("phone"),emergency_hotline=item.get("emergencyHotline"),website=item.get("website"),opening_hours=item.get("openingHours"),latitude=28.6139 + (coords.get("y",50)-50)*0.01,longitude=77.2090 + (coords.get("x",50)-50)*0.01,rating=float(item.get("rating",0)),reviews_count=item.get("reviewsCount",0),hospital_verified=item.get("hospitalVerified",False),quality_accreditation=item.get("qualityAccreditation"),is_24x7_emergency=item.get("is24x7Emergency",False),has_pediatrics=item.get("hasPediatrics",False),has_diagnostics=item.get("hasDiagnostics",False),er_wait_time=item.get("erWaitTime"),specialties=item.get("specialties",[]),facilities=item.get("facilities",[]),trust_breakdown=item.get("trustBreakdown",{}),overview=item.get("overview")))
        db.flush()
        for item in data["featuredDoctors"]:
            if db.get(Doctor,item["id"]): continue
            # Link by the hospital label from the existing UI data.
            hospital_id=next((h.id for h in db.scalars(select(Hospital)).all() if h.name.lower() in item.get("hospital","").lower() or item.get("hospital","").split("•")[-1].strip().lower() in h.name.lower()),None)
            if not hospital_id:
                if "MetroHealth" in item.get("hospital",""): hospital_id="hosp-metro-general"
                elif "Sunrise" in item.get("hospital",""): hospital_id="hosp-sunrise-pediatrics"
                elif "Beacon" in item.get("hospital",""): hospital_id="hosp-beacon-neuro-cancer"
                elif "Mercy" in item.get("hospital",""): hospital_id="hosp-mercy-community"
            db.add(Doctor(id=item["id"],name=item["name"],specialty=item["specialty"],experience=item.get("experience"),hospital_id=hospital_id,hospital_label=item.get("hospital"),rating=float(item.get("rating",0)),reviews_count=item.get("reviewsCount",0),available_today=item.get("availableToday",False),avatar_bg=item.get("avatarBg"),initials=item.get("initials"),consultation_fee=item.get("consultationFee"),bio=item.get("bio"),verified=item.get("verified",False),availability=["09:00","10:30","11:15","13:30","14:45","16:00","17:30","18:45","19:30"] if item.get("availableToday",False) else []))
        # Seed review records using reviewer names from the original development dataset.
        seed_user=db.scalar(select(User).where(User.email=="seed-reviewer@meditrust.local"))
        if not seed_user:
            seed_user=User(full_name="MediTrust Development Reviewer",email="seed-reviewer@meditrust.local",hashed_password=hash_password("development-only-not-for-production"),role="patient",consent=True)
            db.add(seed_user); db.flush()
        for h in data["hospitalsData"]:
            for rev in h.get("reviews",[]):
                if not db.scalar(select(Review).where(Review.hospital_id==h["id"],Review.comment==rev["comment"])):
                    db.add(Review(user_id=seed_user.id,hospital_id=h["id"],rating=rev["rating"],comment=rev["comment"],reviewer_name=rev.get("author")))
        for d in data["featuredDoctors"]:
            for rev in d.get("reviews",[]):
                if not db.scalar(select(Review).where(Review.doctor_id==d["id"],Review.comment==rev["comment"])):
                    db.add(Review(user_id=seed_user.id,doctor_id=d["id"],rating=rev["rating"],comment=rev["comment"],reviewer_name=rev.get("author")))
        for item in data["healthProblemsCatalog"]:
            if not db.get(HealthProblem,item["id"]): db.add(HealthProblem(id=item["id"],name=item["name"],keywords=item.get("keywords",[]),recommended_departments=item.get("recommendedDepartments",[]),relevant_hospital_ids=item.get("relevantHospitalIds",[]),guidance=item.get("guidance")))
        for item in data["patientStaysData"]:
            stay=db.get(Stay,item["id"])
            if not stay: stay=Stay(id=item["id"],name=item["name"],type=item["type"],near_hospital_id=item["nearHospitalId"],address=item["address"],distance_from_hospital=item["distanceFromHospital"],verified=item.get("verified",False),price_per_day=item["pricePerDay"],food_per_day=item["foodPerDay"],mandatory_charges=item["mandatoryCharges"],long_stay_support=item.get("longStaySupport",False),caregiver_friendly=item.get("caregiverFriendly",False),accessible=item.get("accessible",False),facilities=item.get("facilities",[]),contact=item.get("contact"),stay_breakdown=item.get("stayBreakdown",{})); db.add(stay)
            # Backfill map/room/review data for stays seeded before these fields existed.
            if stay.latitude is None: stay.latitude,stay.longitude=item.get("latitude"),item.get("longitude")
            if not stay.room_options: stay.room_options=item.get("roomOptions",[])
            if not stay.reviews: stay.reviews=item.get("reviews",[])
        db.commit()
        print("Development seed completed.")
    finally: db.close()
if __name__=="__main__": run()
