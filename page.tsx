"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  createTheme,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  ThemeProvider,
} from "@mui/material";
import { AlertBox, Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/shadcn-primitives";
import { apiGet, apiPatch, apiPost } from "@/lib/api";

const prmsTheme = createTheme({
  palette: {
    primary: { main: "#0f766e" },
    secondary: { main: "#4f46e5" },
  },
  shape: { borderRadius: 10 },
});

interface UserSession {
  id: number;
  email: string;
  full_name: string;
  role: "admin" | "physician" | "nurse";
}

interface Patient {
  id: number;
  mrn: string;
  full_name: string;
  dob: string;
  gender: string;
  allergies: string;
  medications: string;
  problem_list: string;
  procedural_family_history: string;
  latest_vitals: string;
  lab_radiology_summary: string;
}

interface ClinicalNote {
  id: number;
  patient_id: number;
  author_name: string;
  author_role: string;
  source_type: string;
  note_type: string;
  content: string;
  addendum: string | null;
  status: string;
  authenticated_by: string | null;
}

interface Guideline {
  id: number;
  title: string;
  condition_tag: string;
  protocol_steps: string;
  created_by: string;
}

interface AgentResponse {
  patient_id: number;
  goal: string;
  tools_invoked: string[];
  safety_warnings: string[];
  care_plan_summary: string;
  patient_instructions: string;
  guideline_references: string[];
  latency_ms: number;
  mode: string;
  langsmith_tracing_enabled: boolean;
}

interface EvalMatrixResponse {
  framework_reference: string;
  langsmith_project: string;
  total_cases: number;
  mean_tool_accuracy: number;
  mean_allergy_recall: number;
  mean_groundedness_1_to_5: number;
  mean_completeness_1_to_5: number;
  schema_compliance_rate: number;
  avg_latency_ms: number;
  results: Array<{
    case_id: string;
    description: string;
    invoked_tools: string[];
    tool_accuracy: number;
    allergy_recall: number;
    groundedness_score: number;
    completeness_score: number;
    latency_ms: number;
    notes: string;
  }>;
}

interface SystemUser {
  id: number;
  email: string;
  full_name: string;
  role: "admin" | "physician" | "nurse";
}

export default function PrmsDashboard() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loginEmail, setLoginEmail] = useState("dr.syed@prms.local");
  const [loginPassword, setLoginPassword] = useState("prms1234");
  const [authError, setAuthError] = useState("");

  const [tab, setTab] = useState(0);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [evalData, setEvalData] = useState<EvalMatrixResponse | null>(null);

  const [mrn, setMrn] = useState("");
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("1990-01-01");
  const [gender, setGender] = useState("Female");
  const [allergies, setAllergies] = useState("None recorded");
  const [medications, setMedications] = useState("None recorded");
  const [problems, setProblems] = useState("Routine checkup");

  const [noteType, setNoteType] = useState("Consultation Note");
  const [sourceType, setSourceType] = useState("direct_entry");
  const [noteContent, setNoteContent] = useState("");

  const [gTitle, setGTitle] = useState("");
  const [gTag, setGTag] = useState("hypertension");
  const [gSteps, setGSteps] = useState("");

  const [agentGoal, setAgentGoal] = useState(
    "Review clinical record, check medication safety, align with guidelines, and draft discharge instructions."
  );
  const [proposedMedsText, setProposedMedsText] = useState("Amoxicillin 500mg");
  const [contextType, setContextType] = useState("discharge");
  const [agentResult, setAgentResult] = useState<AgentResponse | null>(null);
  const [loadingAgent, setLoadingAgent] = useState(false);

  const [usersList, setUsersList] = useState<SystemUser[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "physician" | "nurse">("nurse");
  const [newUserPassword, setNewUserPassword] = useState("prms1234");
  const [userMsg, setUserMsg] = useState("");

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || patients[0] || null;
  const canAuthenticateOrPublish = user?.role === "physician" || user?.role === "admin";

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    try {
      const res = await apiPost<{ access_token: string; user: UserSession }>("/auth/login", {
        email: loginEmail,
        password: loginPassword,
      });
      localStorage.setItem("prms_token", res.access_token);
      setUser(res.user);
    } catch {
      setAuthError("Invalid credentials. Try dr.syed@prms.local / prms1234");
    }
  }

  function handleLogout() {
    localStorage.removeItem("prms_token");
    setUser(null);
  }

  async function loadUsers() {
    try {
      const data = await apiGet<{ total_users: number; users: SystemUser[] }>("/users");
      setTotalUsers(data.total_users);
      setUsersList(data.users);
    } catch {
      setUsersList([]);
    }
  }

  async function loadAll(q = "") {
    const [pList, gList, eData] = await Promise.all([
      apiGet<Patient[]>(`/patients?q=${encodeURIComponent(q)}`),
      apiGet<Guideline[]>("/guidelines"),
      apiGet<EvalMatrixResponse>("/evaluation/langchain-matrix"),
    ]);
    setPatients(pList);
    setGuidelines(gList);
    setEvalData(eData);
    await loadUsers();
    if (pList.length > 0 && !pList.some((p) => p.id === selectedPatientId)) {
      setSelectedPatientId(pList[0].id);
    }
  }

  async function loadNotes(pid: number) {
    if (!pid) return;
    const nList = await apiGet<ClinicalNote[]>(`/patients/${pid}/notes`);
    setNotes(nList);
  }

  useEffect(() => {
    const token = localStorage.getItem("prms_token");
    if (token) {
      apiGet<UserSession>("/auth/me")
        .then((u) => setUser(u))
        .catch(() => localStorage.removeItem("prms_token"));
    }
  }, []);

  useEffect(() => {
    if (user) loadAll();
  }, [user]);

  useEffect(() => {
    if (user && selectedPatientId) loadNotes(selectedPatientId);
  }, [user, selectedPatientId]);

  async function handleCreatePatient(e: React.FormEvent) {
    e.preventDefault();
    if (!mrn.trim() || !fullName.trim()) return;
    const created = await apiPost<Patient>("/patients", {
      mrn,
      full_name: fullName,
      dob,
      gender,
      allergies,
      medications,
      problem_list: problems,
    });
    setMrn("");
    setFullName("");
    await loadAll(searchQuery);
    setSelectedPatientId(created.id);
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPatient || !noteContent.trim()) return;
    await apiPost(`/patients/${selectedPatient.id}/notes`, {
      source_type: sourceType,
      note_type: noteType,
      content: noteContent,
    });
    setNoteContent("");
    await loadNotes(selectedPatient.id);
  }

  async function handleNoteAction(noteId: number, action: "authenticate" | "close") {
    await apiPatch(`/notes/${noteId}`, {
      action,
      addendum: action === "authenticate" ? `Authenticated by ${user?.full_name}` : undefined,
    });
    if (selectedPatient) await loadNotes(selectedPatient.id);
  }

  async function handleCreateGuideline(e: React.FormEvent) {
    e.preventDefault();
    if (!gTitle.trim() || !gSteps.trim()) return;
    await apiPost("/guidelines", {
      title: gTitle,
      condition_tag: gTag,
      protocol_steps: gSteps,
    });
    setGTitle("");
    setGSteps("");
    await loadAll(searchQuery);
  }

  async function handleRunAgent(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPatient) return;
    setLoadingAgent(true);
    try {
      const meds = proposedMedsText.split(",").map((s) => s.trim()).filter(Boolean);
      const res = await apiPost<AgentResponse>("/agent/run", {
        patient_id: selectedPatient.id,
        goal: agentGoal,
        proposed_medications: meds,
        context_type: contextType,
        save_instruction: true,
      });
      setAgentResult(res);
      const updatedEval = await apiGet<EvalMatrixResponse>("/evaluation/langchain-matrix");
      setEvalData(updatedEval);
    } finally {
      setLoadingAgent(false);
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setUserMsg("");
    try {
      await apiPost("/users", {
        email: newUserEmail,
        full_name: newUserName,
        role: newUserRole,
        password: newUserPassword,
      });
      setNewUserEmail("");
      setNewUserName("");
      setUserMsg("New user created successfully.");
      await loadUsers();
    } catch (err) {
      setUserMsg(err instanceof Error ? err.message : "Could not create user.");
    }
  }

  if (!user) {
    return (
      <ThemeProvider theme={prmsTheme}>
        <div className="min-h-screen flex items-center justify-center px-4">
          <Card accent="teal" className="w-full max-w-md shadow-xl">
            <CardHeader className="pb-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="info">Clinical Portal</Badge>
                <Badge variant="success">JWT RBAC</Badge>
              </div>
              <h1
                title="PRMS-AI by Hamza Imran student of Sir Iqbal Gill"
                className="text-lg sm:text-xl font-extrabold tracking-tight leading-snug bg-gradient-to-r from-teal-700 via-indigo-700 to-slate-900 bg-clip-text text-transparent transition-all duration-300 hover:from-teal-600 hover:via-indigo-600 hover:to-teal-800 hover:scale-[1.01] cursor-pointer select-none"
              >
                PRMS-AI by Hamza Imran student of Sir Iqbal Gill
              </h1>
              <p className="text-xs font-medium text-slate-600">
                Sign in with Physician, Admin, or Nurse credentials
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {authError && <AlertBox variant="danger">{authError}</AlertBox>}
              <form onSubmit={handleLogin} className="space-y-3">
                <TextField fullWidth size="small" label="Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
                <TextField fullWidth size="small" type="password" label="Password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
                <Button type="submit" fullWidth variant="contained" size="large">
                  Sign In to Dashboard
                </Button>
              </form>
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                <Button size="small" variant="outlined" onClick={() => { setLoginEmail("dr.syed@prms.local"); setLoginPassword("prms1234"); }}>
                  Physician Demo
                </Button>
                <Button size="small" variant="outlined" color="secondary" onClick={() => { setLoginEmail("admin@prms.local"); setLoginPassword("prms1234"); }}>
                  Admin Demo
                </Button>
                <Button size="small" variant="outlined" onClick={() => { setLoginEmail("nurse.sara@prms.local"); setLoginPassword("prms1234"); }}>
                  Nurse Demo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={prmsTheme}>
      <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-slate-900 via-teal-900 to-indigo-900 p-6 text-white shadow-lg">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight">PRMS-AI</h1>
              <Badge variant="success">Agentic AI • LangChain</Badge>
              <Badge variant="warning">{user.role.toUpperCase()}: {user.full_name}</Badge>
              {totalUsers > 0 && <Badge variant="info">Users: {totalUsers}</Badge>}
            </div>
            <p className="text-sm text-teal-100 mt-1">
              Patient Record Management System — Longitudinal Records, Care Guidelines, Clinical Notes & Evaluation Matrix
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-white/95 p-2.5 text-slate-900 shadow-sm">
            <TextField
              size="small"
              label="Search MRN / Name / Problem"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                loadAll(e.target.value);
              }}
            />
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="active-patient-label">Active Patient</InputLabel>
              <Select
                labelId="active-patient-label"
                label="Active Patient"
                value={selectedPatient?.id ?? ""}
                onChange={(e) => setSelectedPatientId(Number(e.target.value))}
              >
                {patients.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.mrn} — {p.full_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button size="small" variant="outlined" color="error" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        <Box sx={{ bgcolor: "rgba(255,255,255,0.92)", borderRadius: 3, border: "1px solid #cbd5e1", boxShadow: 1 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
            <Tab label="1. Patient Record & Notes" />
            <Tab label="2. Agentic AI Copilot" />
            <Tab label="3. Guidelines & Protocols" />
            <Tab label="4. LangChain Evaluation Matrix" />
            <Tab label="5. Users & Roles" />
          </Tabs>
        </Box>

        {/* TAB 1 */}
        {tab === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {selectedPatient && (
                <Card accent="teal">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-teal-950">
                        {selectedPatient.full_name} ({selectedPatient.mrn})
                      </CardTitle>
                      <Badge variant="info">{selectedPatient.gender} • DOB {selectedPatient.dob}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-indigo-50/70 border border-indigo-100 p-3">
                      <strong className="text-indigo-950">Problems:</strong> {selectedPatient.problem_list}
                    </div>
                    <div className="rounded-xl bg-rose-50/80 border border-rose-200 p-3">
                      <strong className="text-rose-900">Allergies:</strong>{" "}
                      <span className="text-rose-700 font-semibold">{selectedPatient.allergies}</span>
                    </div>
                    <div className="rounded-xl bg-teal-50/70 border border-teal-100 p-3">
                      <strong className="text-teal-950">Medications:</strong> {selectedPatient.medications}
                    </div>
                    <div className="rounded-xl bg-sky-50/70 border border-sky-100 p-3">
                      <strong className="text-sky-950">Vitals:</strong> {selectedPatient.latest_vitals}
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 sm:col-span-2">
                      <strong>Labs / Radiology:</strong> {selectedPatient.lab_radiology_summary}
                    </div>
                    <div className="rounded-xl bg-amber-50/60 border border-amber-100 p-3 sm:col-span-2">
                      <strong>Procedural & Family History:</strong> {selectedPatient.procedural_family_history}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card accent="indigo">
                <CardHeader>
                  <CardTitle className="text-indigo-950">
                    Clinical Documentation & Lifecycle (Draft → Authenticated → Closed)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleAddNote} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormControl size="small">
                        <InputLabel id="note-type-lbl">Note Type</InputLabel>
                        <Select labelId="note-type-lbl" label="Note Type" value={noteType} onChange={(e) => setNoteType(e.target.value)}>
                          <MenuItem value="Consultation Note">Consultation Note</MenuItem>
                          <MenuItem value="Progress Note">Progress Note</MenuItem>
                          <MenuItem value="Discharge Summary">Discharge Summary</MenuItem>
                        </Select>
                      </FormControl>
                      <FormControl size="small">
                        <InputLabel id="src-type-lbl">Source</InputLabel>
                        <Select labelId="src-type-lbl" label="Source" value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
                          <MenuItem value="direct_entry">Direct Entry</MenuItem>
                          <MenuItem value="transcribed">Transcribed</MenuItem>
                          <MenuItem value="external_import">External Source</MenuItem>
                        </Select>
                      </FormControl>
                    </div>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      size="small"
                      label="Clinical Note / Pertinent History"
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                    />
                    <Button type="submit" variant="contained">Save Draft Note</Button>
                  </form>

                  <div className="space-y-3 pt-2">
                    {notes.map((n) => (
                      <div key={n.id} className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-sm font-medium">
                            {n.note_type} — <span className="text-slate-600">{n.author_name} ({n.author_role}, {n.source_type})</span>
                          </div>
                          <Badge variant={n.status === "closed" ? "default" : n.status === "authenticated" ? "success" : "warning"}>
                            {n.status.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-800 whitespace-pre-line">{n.content}</p>
                        {n.addendum && (
                          <p className="text-xs text-slate-700 bg-indigo-50/70 border border-indigo-100 p-2 rounded-lg">
                            <strong>Addendum:</strong> {n.addendum}
                          </p>
                        )}
                        {n.status !== "closed" && canAuthenticateOrPublish && (
                          <div className="flex gap-2">
                            {n.status === "draft" && (
                              <Button size="small" variant="outlined" onClick={() => handleNoteAction(n.id, "authenticate")}>
                                Authenticate
                              </Button>
                            )}
                            <Button size="small" variant="outlined" color="secondary" onClick={() => handleNoteAction(n.id, "close")}>
                              Close Record
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card accent="sky">
              <CardHeader>
                <CardTitle className="text-sky-950">Register New Patient</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreatePatient} className="space-y-3">
                  <TextField fullWidth required size="small" label="MRN (e.g. PRMS-1003)" value={mrn} onChange={(e) => setMrn(e.target.value)} />
                  <TextField fullWidth required size="small" label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  <TextField fullWidth size="small" label="DOB (YYYY-MM-DD)" value={dob} onChange={(e) => setDob(e.target.value)} />
                  <TextField fullWidth size="small" label="Gender" value={gender} onChange={(e) => setGender(e.target.value)} />
                  <TextField fullWidth size="small" label="Allergies" value={allergies} onChange={(e) => setAllergies(e.target.value)} />
                  <TextField fullWidth size="small" label="Medications" value={medications} onChange={(e) => setMedications(e.target.value)} />
                  <TextField fullWidth size="small" label="Problem List" value={problems} onChange={(e) => setProblems(e.target.value)} />
                  <Button type="submit" fullWidth variant="contained">Create Patient Record</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 2 */}
        {tab === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card accent="indigo">
              <CardHeader>
                <CardTitle className="text-indigo-950">Run LangChain Clinical Agent</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRunAgent} className="space-y-3.5">
                  <FormControl fullWidth size="small">
                    <InputLabel id="ctx-lbl">Instruction Context</InputLabel>
                    <Select labelId="ctx-lbl" label="Instruction Context" value={contextType} onChange={(e) => setContextType(e.target.value)}>
                      <MenuItem value="discharge">Discharge Instructions</MenuItem>
                      <MenuItem value="pre_procedural">Pre-Procedural Instructions</MenuItem>
                      <MenuItem value="post_procedural">Post-Procedural Instructions</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    fullWidth
                    size="small"
                    label="Proposed Medications (comma-separated)"
                    value={proposedMedsText}
                    onChange={(e) => setProposedMedsText(e.target.value)}
                  />
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    size="small"
                    label="Clinical Goal"
                    value={agentGoal}
                    onChange={(e) => setAgentGoal(e.target.value)}
                  />
                  <Button type="submit" variant="contained" disabled={loadingAgent}>
                    {loadingAgent ? "Executing Agent Tools..." : "Execute Agentic Workflow"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card accent="teal">
              <CardHeader>
                <CardTitle className="text-teal-950">Agent Output, Tool Trajectory & Safety Checks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {!agentResult ? (
                  <AlertBox>Select a patient and run the LangChain clinical agent to generate care & discharge guidance.</AlertBox>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="success">Mode: {agentResult.mode}</Badge>
                      <Badge variant="info">Latency: {agentResult.latency_ms} ms</Badge>
                      <Badge variant={agentResult.langsmith_tracing_enabled ? "success" : "default"}>
                        LangSmith Tracing: {agentResult.langsmith_tracing_enabled ? "ON" : "LOCAL"}
                      </Badge>
                    </div>
                    <div className="rounded-lg bg-indigo-50/70 border border-indigo-100 p-2.5">
                      <strong>Tools Invoked:</strong> {agentResult.tools_invoked.join(" → ")}
                    </div>
                    {agentResult.safety_warnings.length > 0 && (
                      <AlertBox variant="danger">
                        <strong>Clinical Safety Alerts:</strong>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                          {agentResult.safety_warnings.map((w, idx) => (
                            <li key={idx}>{w}</li>
                          ))}
                        </ul>
                      </AlertBox>
                    )}
                    <div className="rounded-xl bg-teal-50/70 border border-teal-200 p-3.5 whitespace-pre-line">
                      <strong className="text-teal-950">Care Plan Draft:</strong>
                      {"\n"}
                      {agentResult.care_plan_summary}
                    </div>
                    <div className="rounded-xl bg-sky-50/70 border border-sky-200 p-3.5 whitespace-pre-line">
                      <strong className="text-sky-950">Patient Instructions:</strong>
                      {"\n"}
                      {agentResult.patient_instructions}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 3 */}
        {tab === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card accent="amber">
              <CardHeader>
                <CardTitle className="text-amber-950">Create Organizational Care Guideline / Protocol</CardTitle>
              </CardHeader>
              <CardContent>
                {!canAuthenticateOrPublish ? (
                  <AlertBox>Nurse role has read-only access to organizational guidelines.</AlertBox>
                ) : (
                  <form onSubmit={handleCreateGuideline} className="space-y-3">
                    <TextField fullWidth required size="small" label="Guideline Title" value={gTitle} onChange={(e) => setGTitle(e.target.value)} />
                    <TextField fullWidth required size="small" label="Condition Tag" value={gTag} onChange={(e) => setGTag(e.target.value)} />
                    <TextField fullWidth required multiline rows={4} size="small" label="Protocol Steps" value={gSteps} onChange={(e) => setGSteps(e.target.value)} />
                    <Button type="submit" variant="contained">Publish Guideline</Button>
                  </form>
                )}
              </CardContent>
            </Card>

            <Card accent="teal">
              <CardHeader>
                <CardTitle className="text-teal-950">Active Clinical Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {guidelines.map((g) => (
                  <div key={g.id} className="rounded-xl border border-teal-100 bg-teal-50/40 p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-teal-950">{g.title}</span>
                      <Badge variant="info">{g.condition_tag}</Badge>
                    </div>
                    <p className="text-xs text-slate-700 whitespace-pre-line">{g.protocol_steps}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 4 */}
        {tab === 3 && evalData && (
          <Card accent="indigo">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-indigo-950">{evalData.framework_reference}</CardTitle>
                <Badge variant="info">LangSmith Project: {evalData.langsmith_project}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="rounded-xl border border-teal-200 p-3.5 bg-gradient-to-br from-teal-50 to-white">
                  <div className="text-xs font-medium text-teal-800">Tool Trajectory Acc.</div>
                  <div className="text-2xl font-bold text-teal-950">{(evalData.mean_tool_accuracy * 100).toFixed(1)}%</div>
                </div>
                <div className="rounded-xl border border-emerald-200 p-3.5 bg-gradient-to-br from-emerald-50 to-white">
                  <div className="text-xs font-medium text-emerald-800">Allergy Safety Recall</div>
                  <div className="text-2xl font-bold text-emerald-700">{(evalData.mean_allergy_recall * 100).toFixed(1)}%</div>
                </div>
                <div className="rounded-xl border border-indigo-200 p-3.5 bg-gradient-to-br from-indigo-50 to-white">
                  <div className="text-xs font-medium text-indigo-800">Groundedness (/5)</div>
                  <div className="text-2xl font-bold text-indigo-950">{evalData.mean_groundedness_1_to_5}</div>
                </div>
                <div className="rounded-xl border border-amber-200 p-3.5 bg-gradient-to-br from-amber-50 to-white">
                  <div className="text-xs font-medium text-amber-800">Completeness (/5)</div>
                  <div className="text-2xl font-bold text-amber-950">{evalData.mean_completeness_1_to_5}</div>
                </div>
                <div className="rounded-xl border border-sky-200 p-3.5 bg-gradient-to-br from-sky-50 to-white">
                  <div className="text-xs font-medium text-sky-800">Avg Latency</div>
                  <div className="text-2xl font-bold text-sky-950">{evalData.avg_latency_ms} ms</div>
                </div>
              </div>

              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f1f5f9" }}>
                    <TableCell><strong>Case</strong></TableCell>
                    <TableCell><strong>Scenario</strong></TableCell>
                    <TableCell><strong>Invoked Tools</strong></TableCell>
                    <TableCell><strong>Tool Acc.</strong></TableCell>
                    <TableCell><strong>Allergy Recall</strong></TableCell>
                    <TableCell><strong>Groundedness</strong></TableCell>
                    <TableCell><strong>Latency (ms)</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {evalData.results.map((r) => (
                    <TableRow key={r.case_id} hover>
                      <TableCell>{r.case_id}</TableCell>
                      <TableCell>{r.description}</TableCell>
                      <TableCell>{r.invoked_tools.join(", ")}</TableCell>
                      <TableCell>{r.tool_accuracy}</TableCell>
                      <TableCell>{r.allergy_recall}</TableCell>
                      <TableCell>{r.groundedness_score}/5</TableCell>
                      <TableCell>{r.latency_ms}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* TAB 5: USERS & ROLES */}
        {tab === 4 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card accent="teal" className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-teal-950">Registered System Users</CardTitle>
                  <Badge variant="success">Total Users: {totalUsers}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {usersList.length === 0 ? (
                  <AlertBox>Log in as Admin or Physician to view the registered users list.</AlertBox>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f1f5f9" }}>
                        <TableCell><strong>ID</strong></TableCell>
                        <TableCell><strong>Full Name</strong></TableCell>
                        <TableCell><strong>Email</strong></TableCell>
                        <TableCell><strong>Role</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {usersList.map((u) => (
                        <TableRow key={u.id} hover>
                          <TableCell>{u.id}</TableCell>
                          <TableCell>{u.full_name}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>
                            <Badge variant={u.role === "admin" ? "danger" : u.role === "physician" ? "info" : "warning"}>
                              {u.role.toUpperCase()}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card accent="indigo">
              <CardHeader>
                <CardTitle className="text-indigo-950">Create New User (Admin Only)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {user.role !== "admin" ? (
                  <AlertBox>Log in as Admin (admin@prms.local) to create new user accounts.</AlertBox>
                ) : (
                  <form onSubmit={handleCreateUser} className="space-y-3">
                    {userMsg && <AlertBox>{userMsg}</AlertBox>}
                    <TextField
                      fullWidth
                      required
                      size="small"
                      label="Full Name"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                    />
                    <TextField
                      fullWidth
                      required
                      size="small"
                      label="Email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                    />
                    <FormControl fullWidth size="small">
                      <InputLabel id="new-role-lbl">Role</InputLabel>
                      <Select
                        labelId="new-role-lbl"
                        label="Role"
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value as "admin" | "physician" | "nurse")}
                      >
                        <MenuItem value="physician">Physician</MenuItem>
                        <MenuItem value="nurse">Nurse</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      fullWidth
                      required
                      size="small"
                      label="Initial Password"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                    />
                    <Button type="submit" fullWidth variant="contained">
                      Create User Account
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ThemeProvider>
  );
}
