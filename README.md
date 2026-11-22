# PRMS-AI: Agentic AI Patient Record Management System (VS Code Ready)

Complete VS Code-ready project implementing **PRMS: Patient Record Management System** (Supervisor: Dr. Syed Shah Muhammad, `syed@vu.edu.pk`) with:
- **Backend**: Python FastAPI + SQLAlchemy (SQLite/PostgreSQL) + JWT RBAC (`admin`, `physician`, `nurse`) + **LangChain Agentic AI** + **LangChain / LangSmith Evaluation Matrix**
- **Frontend**: Next.js 14 + Material UI (`@mui/material`) + `shadcn/ui` primitives + Tailwind CSS
- **Infrastructure & VS Code**: `docker-compose.yml`, `.vscode/launch.json`, `.vscode/tasks.json`, `.vscode/settings.json`

---

## Quick Start in VS Code

### Option A: Run Directly in VS Code (Recommended)
1. Open the unzipped `prms-ai-project` folder in **VS Code**.
2. Open the **Run and Debug** panel (`Ctrl+Shift+D`) and select **"PRMS-AI: Full Stack (Backend + Frontend)"**, OR run two integrated terminals:
   - **Terminal 1 (Backend)**:
     ```bash
     cd backend
     python -m venv .venv
     # Windows: .venv\Scripts\activate | macOS/Linux: source .venv/bin/activate
     pip install -r requirements.txt
     copy .env.example .env   # or: cp .env.example .env
     uvicorn main:app --reload --port 8000
     ```
   - **Terminal 2 (Frontend)**:
     ```bash
     cd frontend
     npm install
     copy .env.local.example .env.local   # or: cp .env.local.example .env.local
     npm run dev
     ```
3. Open **http://localhost:3000** in your browser.
   - Demo Login Accounts (Password for all: `prms1234`):
     - **Physician**: `dr.syed@prms.local`
     - **Admin**: `admin@prms.local`
     - **Nurse**: `nurse.sara@prms.local`

### Option B: Run via Docker Compose (PostgreSQL + Backend + Frontend)
```bash
docker compose up --build
```
