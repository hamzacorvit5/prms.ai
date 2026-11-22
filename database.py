import os
from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, create_engine
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./prms_ai.db")
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(140), unique=True, index=True, nullable=False)
    full_name = Column(String(120), nullable=False)
    role = Column(String(30), nullable=False, default="physician")  # admin | physician | nurse
    password_hash = Column(String(256), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    mrn = Column(String(32), unique=True, index=True, nullable=False)
    full_name = Column(String(120), nullable=False)
    dob = Column(String(20), nullable=False)
    gender = Column(String(20), nullable=False)
    phone = Column(String(40), nullable=True)
    address = Column(Text, nullable=True)
    allergies = Column(Text, default="None recorded")
    medications = Column(Text, default="None recorded")
    problem_list = Column(Text, default="None recorded")
    procedural_family_history = Column(Text, default="None recorded")
    latest_vitals = Column(Text, default="BP 120/80 mmHg, HR 72 bpm, Temp 98.6F, SpO2 98%")
    lab_radiology_summary = Column(Text, default="No recent labs or imaging.")
    created_at = Column(DateTime, default=datetime.utcnow)

    notes = relationship("ClinicalNote", back_populates="patient", cascade="all, delete-orphan")
    instructions = relationship("CareInstruction", back_populates="patient", cascade="all, delete-orphan")


class ClinicalNote(Base):
    __tablename__ = "clinical_notes"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    author_name = Column(String(120), nullable=False)
    author_role = Column(String(30), default="physician")
    source_type = Column(String(40), default="direct_entry")  # direct_entry | transcribed | external_import
    note_type = Column(String(60), default="Progress Note")
    content = Column(Text, nullable=False)
    addendum = Column(Text, nullable=True)
    status = Column(String(20), default="draft")  # draft | authenticated | closed
    authenticated_by = Column(String(120), nullable=True)
    authenticated_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="notes")


class CareGuideline(Base):
    __tablename__ = "care_guidelines"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(160), nullable=False)
    condition_tag = Column(String(80), index=True, nullable=False)
    protocol_steps = Column(Text, nullable=False)
    created_by = Column(String(120), default="Admin")
    created_at = Column(DateTime, default=datetime.utcnow)


class CareInstruction(Base):
    __tablename__ = "care_instructions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    context_type = Column(String(40), default="discharge")
    instructions_text = Column(Text, nullable=False)
    care_plan_summary = Column(Text, nullable=False)
    safety_warnings = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="instructions")


def init_db():
    from auth import hash_password

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            users = [
                User(
                    email="dr.syed@prms.local",
                    full_name="Dr. Syed Shah Muhammad",
                    role="physician",
                    password_hash=hash_password("prms1234"),
                ),
                User(
                    email="admin@prms.local",
                    full_name="PRMS Clinical Administrator",
                    role="admin",
                    password_hash=hash_password("prms1234"),
                ),
                User(
                    email="nurse.sara@prms.local",
                    full_name="Nurse Sara Khan",
                    role="nurse",
                    password_hash=hash_password("prms1234"),
                ),
            ]
            db.add_all(users)
            db.commit()

        if db.query(Patient).count() == 0:
            p1 = Patient(
                mrn="PRMS-1001",
                full_name="Amina Tariq",
                dob="1984-05-14",
                gender="Female",
                phone="+92-300-5550192",
                address="Model Town, Lahore",
                allergies="Penicillin (rash/hives), Sulfa drugs",
                medications="Metformin 500mg BID, Lisinopril 10mg daily",
                problem_list="Type 2 Diabetes Mellitus, Hypertension",
                procedural_family_history="Appendectomy (2016); Father history of CAD",
                latest_vitals="BP 138/86 mmHg, HR 78 bpm, Temp 98.4F, SpO2 98%",
                lab_radiology_summary="HbA1c 7.4%, eGFR 78 mL/min, Chest X-ray clear.",
            )
            p2 = Patient(
                mrn="PRMS-1002",
                full_name="Bilal Mahmood",
                dob="1972-11-02",
                gender="Male",
                phone="+92-321-5550148",
                address="DHA Phase 5, Lahore",
                allergies="No known drug allergies",
                medications="Atorvastatin 20mg QHS, Aspirin 81mg daily",
                problem_list="Hyperlipidemia, Post-cholecystectomy status",
                procedural_family_history="Laparoscopic cholecystectomy (2021); Mother history of T2DM",
                latest_vitals="BP 124/78 mmHg, HR 68 bpm, Temp 98.7F, SpO2 99%",
                lab_radiology_summary="LDL 92 mg/dL, ALT 24 U/L, Abdominal ultrasound normal.",
            )
            db.add_all([p1, p2])
            db.commit()

        if db.query(CareGuideline).count() == 0:
            g1 = CareGuideline(
                title="Diabetes & Hypertension Outpatient Care Protocol",
                condition_tag="diabetes",
                protocol_steps=(
                    "1. Review home BP and blood glucose logs.\n"
                    "2. Screen allergies prior to adding antimicrobials or analgesics.\n"
                    "3. Reinforce low-sodium, glycemic-balanced diet and 3-month HbA1c/renal check.\n"
                    "4. Provide clear discharge red flags (chest pain, severe dyspnea, hypoglycemia)."
                ),
                created_by="Dr. Syed Shah Muhammad",
            )
            g2 = CareGuideline(
                title="Post-Procedural & Discharge Safety Standard",
                condition_tag="discharge",
                protocol_steps=(
                    "1. Verify patient allergies and current medication list before discharge instructions.\n"
                    "2. Specify wound/site care, activity limits, and medication schedule.\n"
                    "3. Schedule follow-up visit and list urgent return precautions."
                ),
                created_by="Dr. Syed Shah Muhammad",
            )
            db.add_all([g1, g2])
            db.commit()
    finally:
        db.close()
