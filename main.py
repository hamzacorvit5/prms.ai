from datetime import datetime
from typing import List
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from agent_engine import evaluate_langchain_agent, run_clinical_agent
from auth import (
    create_access_token,
    get_current_user,
    get_db_session,
    hash_password,
    require_roles,
    verify_password,
)
from database import CareGuideline, CareInstruction, ClinicalNote, Patient, User, init_db
from schemas import (
    AgentRunRequest,
    AgentRunResponse,
    EvalMatrixResponse,
    GuidelineCreate,
    GuidelineResponse,
    LoginRequest,
    NoteCreate,
    NoteResponse,
    NoteUpdate,
    PatientCreate,
    PatientResponse,
    PatientUpdate,
    TokenResponse,
)

load_dotenv()
init_db()

app = FastAPI(title="PRMS-AI Backend (FastAPI + LangChain + RBAC)", version="2.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AdminUserCreate(BaseModel):
    email: str
    full_name: str
    role: str = "nurse"  # admin | physician | nurse
    password: str = "prms1234"


@app.get("/health")
def health():
    return {"status": "ok", "service": "PRMS-AI", "rbac": True}


@app.post("/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db_session)):
    user = db.query(User).filter(User.email == payload.email.strip().lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    token = create_access_token(user.id, user.email, user.role, user.full_name)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
        },
    }


@app.get("/auth/me")
def me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
    }


@app.get("/users")
def list_users(
    db: Session = Depends(get_db_session),
    _: User = Depends(require_roles(["admin", "physician"])),
):
    rows = db.query(User).order_by(User.id.asc()).all()
    users_data = [
        {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
        }
        for u in rows
    ]
    return {"total_users": len(users_data), "users": users_data}


@app.post("/users", status_code=201)
def create_user_account(
    payload: AdminUserCreate,
    db: Session = Depends(get_db_session),
    _: User = Depends(require_roles(["admin"])),
):
    clean_email = payload.email.strip().lower()
    if payload.role not in {"admin", "physician", "nurse"}:
        raise HTTPException(status_code=400, detail="Role must be admin, physician, or nurse.")
    if db.query(User).filter(User.email == clean_email).first():
        raise HTTPException(status_code=400, detail="A user with this email already exists.")

    new_user = User(
        email=clean_email,
        full_name=payload.full_name.strip(),
        role=payload.role,
        password_hash=hash_password(payload.password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {
        "id": new_user.id,
        "email": new_user.email,
        "full_name": new_user.full_name,
        "role": new_user.role,
    }


@app.get("/patients", response_model=List[PatientResponse])
def list_patients(
    q: str = "",
    db: Session = Depends(get_db_session),
    _: User = Depends(get_current_user),
):
    query = db.query(Patient)
    if q.strip():
        like = f"%{q.strip()}%"
        query = query.filter(
            (Patient.full_name.ilike(like))
            | (Patient.mrn.ilike(like))
            | (Patient.problem_list.ilike(like))
        )
    return query.order_by(Patient.id.desc()).all()


@app.post("/patients", response_model=PatientResponse, status_code=201)
def create_patient(
    payload: PatientCreate,
    db: Session = Depends(get_db_session),
    _: User = Depends(require_roles(["admin", "physician", "nurse"])),
):
    existing = db.query(Patient).filter(Patient.mrn == payload.mrn).first()
    if existing:
        raise HTTPException(status_code=400, detail="MRN already exists.")
    patient = Patient(**payload.model_dump())
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@app.patch("/patients/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: int,
    payload: PatientUpdate,
    db: Session = Depends(get_db_session),
    _: User = Depends(require_roles(["admin", "physician", "nurse"])),
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(patient, k, v)
    db.commit()
    db.refresh(patient)
    return patient


@app.get("/patients/{patient_id}/notes", response_model=List[NoteResponse])
def get_patient_notes(
    patient_id: int,
    db: Session = Depends(get_db_session),
    _: User = Depends(get_current_user),
):
    return db.query(ClinicalNote).filter(ClinicalNote.patient_id == patient_id).order_by(ClinicalNote.id.desc()).all()


@app.post("/patients/{patient_id}/notes", response_model=NoteResponse, status_code=201)
def create_note(
    patient_id: int,
    payload: NoteCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_roles(["admin", "physician", "nurse"])),
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")
    note = ClinicalNote(
        patient_id=patient_id,
        author_name=current_user.full_name,
        author_role=current_user.role,
        source_type=payload.source_type,
        note_type=payload.note_type,
        content=payload.content,
        status="draft",
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@app.patch("/notes/{note_id}", response_model=NoteResponse)
def update_note(
    note_id: int,
    payload: NoteUpdate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_roles(["admin", "physician"])),
):
    note = db.query(ClinicalNote).filter(ClinicalNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Clinical note not found.")
    if note.status == "closed" and payload.action != "close":
        raise HTTPException(status_code=400, detail="Closed clinical notes cannot be modified.")

    if payload.addendum:
        note.addendum = f"{note.addendum}\n{payload.addendum}" if note.addendum else payload.addendum
    if payload.content and note.status == "draft":
        note.content = payload.content

    if payload.action == "authenticate":
        note.status = "authenticated"
        note.authenticated_by = current_user.full_name
        note.authenticated_at = datetime.utcnow()
    elif payload.action == "close":
        note.status = "closed"

    db.commit()
    db.refresh(note)
    return note


@app.get("/guidelines", response_model=List[GuidelineResponse])
def list_guidelines(
    db: Session = Depends(get_db_session),
    _: User = Depends(get_current_user),
):
    return db.query(CareGuideline).order_by(CareGuideline.id.desc()).all()


@app.post("/guidelines", response_model=GuidelineResponse, status_code=201)
def create_guideline(
    payload: GuidelineCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_roles(["admin", "physician"])),
):
    g = CareGuideline(**payload.model_dump(), created_by=current_user.full_name)
    db.add(g)
    db.commit()
    db.refresh(g)
    return g


@app.get("/patients/{patient_id}/instructions")
def list_instructions(
    patient_id: int,
    db: Session = Depends(get_db_session),
    _: User = Depends(get_current_user),
):
    rows = db.query(CareInstruction).filter(CareInstruction.patient_id == patient_id).order_by(CareInstruction.id.desc()).all()
    return [
        {
            "id": r.id,
            "context_type": r.context_type,
            "care_plan_summary": r.care_plan_summary,
            "instructions_text": r.instructions_text,
            "safety_warnings": r.safety_warnings,
            "created_at": r.created_at,
        }
        for r in rows
    ]


@app.post("/agent/run", response_model=AgentRunResponse)
def run_agent(
    payload: AgentRunRequest,
    db: Session = Depends(get_db_session),
    _: User = Depends(require_roles(["admin", "physician", "nurse"])),
):
    try:
        return run_clinical_agent(
            db=db,
            patient_id=payload.patient_id,
            goal=payload.goal,
            proposed_medications=payload.proposed_medications,
            context_type=payload.context_type,
            save_instruction=payload.save_instruction,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@app.get("/evaluation/langchain-matrix", response_model=EvalMatrixResponse)
def get_evaluation_matrix(
    db: Session = Depends(get_db_session),
    _: User = Depends(get_current_user),
):
    return evaluate_langchain_agent(db=db) 