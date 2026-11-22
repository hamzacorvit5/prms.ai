from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]


class PatientCreate(BaseModel):
    mrn: str
    full_name: str
    dob: str
    gender: str
    phone: Optional[str] = None
    address: Optional[str] = None
    allergies: str = "None recorded"
    medications: str = "None recorded"
    problem_list: str = "None recorded"
    procedural_family_history: str = "None recorded"
    latest_vitals: str = "BP 120/80 mmHg, HR 72 bpm, Temp 98.6F, SpO2 98%"
    lab_radiology_summary: str = "No recent labs or imaging."


class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    allergies: Optional[str] = None
    medications: Optional[str] = None
    problem_list: Optional[str] = None
    procedural_family_history: Optional[str] = None
    latest_vitals: Optional[str] = None
    lab_radiology_summary: Optional[str] = None


class PatientResponse(PatientCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class NoteCreate(BaseModel):
    source_type: str = "direct_entry"
    note_type: str = "Progress Note"
    content: str


class NoteUpdate(BaseModel):
    addendum: Optional[str] = None
    content: Optional[str] = None
    action: Optional[str] = Field(default=None, description="authenticate | close")


class NoteResponse(BaseModel):
    id: int
    patient_id: int
    author_name: str
    author_role: str
    source_type: str
    note_type: str
    content: str
    addendum: Optional[str]
    status: str
    authenticated_by: Optional[str]
    authenticated_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class GuidelineCreate(BaseModel):
    title: str
    condition_tag: str
    protocol_steps: str


class GuidelineResponse(GuidelineCreate):
    id: int
    created_by: str
    created_at: datetime

    class Config:
        from_attributes = True


class AgentRunRequest(BaseModel):
    patient_id: int
    goal: str = Field(..., description="Clinical task, e.g., draft discharge & care plan")
    proposed_medications: List[str] = Field(default_factory=list)
    context_type: str = Field(default="discharge", description="pre_procedural | post_procedural | discharge")
    save_instruction: bool = True


class AgentRunResponse(BaseModel):
    patient_id: int
    goal: str
    tools_invoked: List[str]
    safety_warnings: List[str]
    care_plan_summary: str
    patient_instructions: str
    guideline_references: List[str]
    latency_ms: float
    mode: str
    langsmith_tracing_enabled: bool
    saved_instruction_id: Optional[int] = None


class EvalCaseResult(BaseModel):
    case_id: str
    description: str
    expected_tools: List[str]
    invoked_tools: List[str]
    tool_accuracy: float
    allergy_recall: float
    groundedness_score: float
    completeness_score: float
    schema_valid: bool
    latency_ms: float
    notes: str


class EvalMatrixResponse(BaseModel):
    framework_reference: str
    langsmith_project: str
    total_cases: int
    mean_tool_accuracy: float
    mean_allergy_recall: float
    mean_groundedness_1_to_5: float
    mean_completeness_1_to_5: float
    schema_compliance_rate: float
    avg_latency_ms: float
    results: List[EvalCaseResult]
    metrics_rubric: List[Dict[str, Any]]
