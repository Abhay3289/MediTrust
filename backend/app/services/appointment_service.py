from datetime import date
from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.appointment import Appointment
from app.models.doctor import Doctor

def create_appointment(db: Session, patient_id: int, data):
    doctor=db.get(Doctor,data.doctor_id)
    if not doctor: raise HTTPException(404,"Doctor not found")
    if data.appointment_date < date.today(): raise HTTPException(422,"Appointment date cannot be in the past")
    if data.appointment_date == date.today() and doctor.available_today and doctor.availability:
        requested=data.appointment_time.strftime("%H:%M")
        if requested not in doctor.availability: raise HTTPException(409,"Selected time is not in the doctor's available slots")
    conflict=db.scalar(select(Appointment).where(Appointment.doctor_id==data.doctor_id, Appointment.appointment_date==data.appointment_date, Appointment.appointment_time==data.appointment_time, Appointment.status.in_(["pending","confirmed"])))
    if conflict: raise HTTPException(409,"That appointment slot is already booked")
    a=Appointment(patient_id=patient_id, **data.model_dump())
    db.add(a); db.commit(); db.refresh(a); return a
