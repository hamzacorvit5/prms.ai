# Project Proposal: PRMS-AI (Agentic AI-Enabled Patient Record Management System)

## 1. Project Identification & Attribution
* **Project Title:** PRMS-AI: Agentic AI-Enabled Patient Record Management System
* **Project Attribution:** PRMS-AI by Hamza Imran student of Sir Iqbal Gill
* **Domain & Category:** Web Application / Healthcare Informatics & Agentic AI
* **Supervisor:** Dr. Syed Shah Muhammad (`syed@vu.edu.pk` | Skype: `mscsvu`)

---

## 2. Executive Summary & Problem Statement
Fragmented, paper-based, and siloed clinical record workflows expose healthcare facilities to lost longitudinal medical histories, duplicate laboratory or radiology orders, overlooked drug-allergy contraindications, and inconsistent discharge guidance. Unauthenticated or loosely governed notes also create compliance and patient-safety risks during care transitions.

**PRMS-AI** addresses these challenges by combining a centralized, role-secured electronic patient record system with a **LangChain Agentic AI Clinical Copilot**. The platform unifies longitudinal patient records, clinical note lifecycle governance, organizational care protocols, role-based user administration, and automated agent evaluation in a single web workspace.

---

## 3. Core Objectives & Scope
* **Longitudinal Patient Records:** Maintain patient demographics, Medical Record Numbers (MRNs), problem lists, active medications, allergies, procedural/surgical and family histories, vital signs, and laboratory/radiology summaries with instant search.
* **Clinical Documentation Governance:** Enforce structured note creation and lifecycle transitions across **Draft**, **Authenticated**, and **Closed** states, supporting direct entry, transcription, external clinical imports, and addenda.
* **Organizational Care Guidelines:** Provide administrative and physician tooling to author, publish, and retrieve standardized clinical care protocols.
* **Agentic AI Clinical Copilot:** Execute a tool-calling LangChain workflow that inspects patient charts, screens proposed medications for allergies, cross-reactivity, and interactions, aligns with care guidelines, and drafts pre-procedural, post-procedural, or discharge instructions.
* **Role-Based Access Control (RBAC) & User Management:** Authenticate users via JWT across `admin`, `physician`, and `nurse` roles, with user count visibility and administrative account provisioning.
* **Quality & Safety Evaluation:** Measure agent reliability using a structured **LangChain / LangSmith Evaluation Matrix** covering tool trajectory accuracy, allergy recall, groundedness, instruction completeness, and schema compliance.

---

## 4. System Architecture & Technology Stack
PRMS-AI follows a decoupled client-server architecture designed for smooth local development in Visual Studio Code as well as containerized deployment:

* **Frontend Layer:** Next.js 14 (TypeScript), Material UI (`@mui/material`) with a custom teal and indigo theme, `shadcn/ui` card/badge/alert primitives, and Tailwind CSS gradients and layout utilities.
* **Backend API Layer:** Python FastAPI REST service (`backend/main.py`) with Pydantic request/response validation, JWT bearer authentication (`backend/auth.py`), and CORS support.
* **Data & Persistence Layer:** SQLAlchemy ORM (`backend/database.py`) supporting zero-configuration SQLite (`prms_ai.db`) for local VS Code runs and PostgreSQL 16 via Docker Compose (`docker-compose.yml`), pre-seeded with demo users, patients, and clinical guidelines.
* **Agentic AI & Observability Layer:** LangChain `@tool` orchestration (`backend/agent_engine.py`) with OpenAI model support (`ChatOpenAI`), a deterministic clinical safety agent fallback when no external API key is configured, and LangSmith `@traceable` hooks.

---

## 5. Functional Requirements & Module Breakdown
| Module / ID | Capability | Key Workflow & Governance |
| :--- | :--- | :--- |
| **FR-01 & FR-02** | Patient Registry & Longitudinal Chart | Create, search (by MRN, name, or condition), and update demographics, allergies, medications, problem lists, vitals, and lab/radiology findings. |
| **FR-03** | Procedural, Surgical & Family History | Store structured longitudinal history alongside external clinical source metadata. |
| **FR-04 & FR-05** | Clinical Notes Lifecycle & Ingestion | Create notes (`direct_entry`, `transcribed`, `external_import`), append addenda, and transition `draft` -> `authenticated` -> `closed` (authentication/closure restricted to `physician` and `admin`). |
| **FR-06** | Care Guidelines & Protocols | Publish and browse condition-tagged organizational care protocols (`admin` and `physician` publish; `nurse` read-only). |
| **FR-07** | Pre-/Post-Procedural & Discharge AI | Run the LangChain agent with proposed medications and encounter context (`pre_procedural`, `post_procedural`, `discharge`) to surface safety alerts and save instructions. |
| **FR-08** | JWT RBAC & User Administration | Enforce role permissions across endpoints, display total user counts, and allow `admin` users to create new `admin`, `physician`, or `nurse` accounts. |

---

## 6. Agentic AI Safety & LangChain Evaluation Matrix
To keep AI outputs clinically safe and auditable, the agent invokes three core tools—`get_patient_chart`, `check_medication_safety` (including cross-reactivity checks such as Penicillin to Amoxicillin and drug-drug interaction checks), and `search_care_guidelines`—while requiring human clinicians to authenticate or close clinical notes.

| Evaluation Metric | Reference & Guardrail | Weight | Target |
| :--- | :--- | :--- | :--- |
| **Tool Trajectory Accuracy** | LangChain `TrajectoryEvaluator` (expected vs. invoked tools) | 25% | >= 90% |
| **Allergy & Contraindication Recall** | Deterministic clinical safety check across allergies & cross-reactivity | 25% | 100% |
| **Guideline Groundedness** | LangSmith / RAGAS groundedness rubric (1-5 scale) | 20% | >= 4.2 / 5.0 |
| **Instruction Completeness** | LangChain `CriteriaEvaluator` for patient guidance & follow-up (1-5 scale) | 15% | >= 4.0 / 5.0 |
| **Schema & Lifecycle Integrity** | Pydantic response validation & role-guarded note authentication | 15% | 100% |

---

## 7. Implementation Milestones & Deliverables
* **Phase 1 — Workspace & Database Foundation:** Establish VS Code project structure (`.vscode/`, `backend/`, `frontend/`, `docs/`), SQLAlchemy schema, seed records, and JWT RBAC authentication.
* **Phase 2 — Longitudinal Records & Note Lifecycle:** Implement patient registration/search, clinical note creation, addenda, authentication, and record closure workflows.
* **Phase 3 — Care Guidelines & LangChain Copilot:** Build organizational guideline publishing, the three-tool LangChain clinical agent, deterministic safety checks, and instruction persistence.
* **Phase 4 — UI Polish, User Management & Evaluation Matrix:** Deliver the teal/indigo Material UI + `shadcn/ui` dashboard, user count & account creation controls, and the live LangChain evaluation matrix view.