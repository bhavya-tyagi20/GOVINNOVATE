from __future__ import annotations

from datetime import date, datetime, timedelta
from io import BytesIO
from pathlib import Path
from typing import Any, Dict, List, Optional
import hashlib
import json
import math
import re
import os

import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, StreamingResponse
from pydantic import BaseModel, Field
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

try:
    import qrcode
except Exception:  # optional dependency; passport still works without QR image generation
    qrcode = None

app = FastAPI(title="GOVINNOVATE API", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA = Path(__file__).resolve().parent.parent / "data"
LEGACY = DATA / "legacy"
TODAY = date(2026, 9, 27)
PUBLIC_URL = os.getenv("GOVINNOVATE_PUBLIC_URL", "http://localhost:5173")
TRUST_CACHE: Dict[str, Dict[str, Any]] = {}

RESOURCE_FILES = {
    "departments": "departments.csv",
    "challenges": "challenges.csv",
    "challenge-requirements": "challenge_requirements.csv",
    "startups": "startups.csv",
    "startup-capabilities": "startup_capabilities.csv",
    "experts": "experts.csv",
    "applications": "applications.csv",
    "evaluations": "evaluations.csv",
    "pilots": "pilots.csv",
    "milestones": "milestones.csv",
    "pilot-kpis": "pilot_kpis.csv",
    "validations": "validations.csv",
    "payment-sla": "payment_sla.csv",
    "payment-releases": "payment_releases.csv",
    "security-checks": "security_checks.csv",
    "trust-scores": "trust_scores.csv",
    "identity-verifications": "identity_verifications.csv",
    "matches": "startup_challenge_matches.csv",
    "proven-solutions": "proven_solutions.csv",
    "solution-passports": "solution_passports.csv",
    "grievances": "grievances.csv",
    "federated-pilots": "federated_pilots.csv",
    "scaleups": "scaleups.csv",
    "demand-radar": "demand_radar.csv",
    "policy-what-if": "policy_what_if.csv",
    "audit-logs": "audit_logs.csv",
    "challenge-drafts": "challenge_drafts.csv",
    "explainable-rejections": "explainable_rejections.csv",
    # Compatibility datasets retained from the previous project.
    "procurement": "procurement_decisions.csv",
    "procurement-rules": "procurement_rules.csv",
    "expert-roles": "expert_roles.csv",
    "sources": "sources.csv",
}


def path_for(filename: str) -> Path:
    return DATA / filename


def _clean_columns(frame: pd.DataFrame) -> pd.DataFrame:
    if frame.empty:
        return frame
    frame.columns = [str(c).replace("\ufeff", "").strip() for c in frame.columns]
    return frame


def df(filename: str) -> pd.DataFrame:
    path = path_for(filename)
    if not path.exists():
        return pd.DataFrame()
    try:
        return _clean_columns(pd.read_csv(path, dtype=str, keep_default_na=False)).fillna("")
    except Exception:
        return pd.DataFrame()


def write_df(filename: str, frame: pd.DataFrame) -> None:
    global TRUST_CACHE
    path = path_for(filename)
    path.parent.mkdir(parents=True, exist_ok=True)
    frame.to_csv(path, index=False, encoding="utf-8-sig")
    if filename in {"milestones.csv","validations.csv","evaluations.csv","security_checks.csv","identity_verifications.csv","applications.csv","pilots.csv","trust_scores.csv"}:
        TRUST_CACHE = {}


def append_row(filename: str, row: Dict[str, Any]) -> Dict[str, Any]:
    table = df(filename)
    if table.empty and not path_for(filename).exists():
        table = pd.DataFrame(columns=list(row.keys()))
    for col in row:
        if col not in table.columns:
            table[col] = ""
    row = {c: row.get(c, "") for c in table.columns}
    table = pd.concat([table, pd.DataFrame([row])], ignore_index=True)
    write_df(filename, table)
    return row


def rows(filename: str) -> List[Dict[str, Any]]:
    return df(filename).to_dict(orient="records")


def as_int(value: Any, default: int = 0) -> int:
    try:
        return int(float(value))
    except Exception:
        return default


def as_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except Exception:
        return default


def truth(value: Any) -> bool:
    return str(value).strip().lower() in {"yes", "true", "1", "pass", "passed", "approved"}


def next_id(filename: str, column: str, prefix: str, width: int = 4) -> str:
    table = df(filename)
    if table.empty or column not in table.columns:
        n = 1
    else:
        nums = []
        for value in table[column].astype(str):
            m = re.search(r"(\d+)$", value)
            if m:
                nums.append(int(m.group(1)))
        n = max(nums or [0]) + 1
    return f"{prefix}{n:0{width}d}"


def one(filename: str, key: str, value: str) -> Dict[str, Any]:
    table = df(filename)
    if table.empty or key not in table.columns:
        raise HTTPException(404, f"{key} not found")
    hit = table[table[key].astype(str).str.upper() == str(value).upper()]
    if hit.empty:
        raise HTTPException(404, f"{key} not found: {value}")
    return hit.iloc[0].to_dict()


def lookup_dict(filename: str, key: str) -> Dict[str, Dict[str, Any]]:
    table = df(filename)
    if table.empty or key not in table.columns:
        return {}
    return {str(r[key]): r for r in table.to_dict(orient="records")}


def challenge_view(row: Dict[str, Any]) -> Dict[str, Any]:
    """New schema plus aliases required by legacy pages."""
    r = dict(row)
    r.setdefault("state", "Maharashtra")
    r["department"] = r.get("department_name", r.get("department", ""))
    r["required_technologies"] = r.get("required_capabilities", r.get("required_technologies", "" )).replace(" | ", ";")
    r["pilot_location"] = r.get("city", r.get("pilot_location", ""))
    days = as_int(r.get("pilot_duration_days"), 90)
    r["duration_days"] = days
    r["duration_months"] = max(1, round(days / 30))
    r["problem"] = r.get("problem_statement", r.get("problem", ""))
    r["expected_outcome"] = r.get("target_metric", r.get("expected_outcome", ""))
    budget = as_int(r.get("budget_ceiling_inr"), 0)
    r["budget_range"] = f"₹{budget:,} pilot ceiling" if budget else r.get("budget_range", "")
    r["source"] = r.get("data_label", "Prototype Demonstration Data")
    r["official_tender"] = r.get("official_tender", "No")
    return r


def startup_view(row: Dict[str, Any]) -> Dict[str, Any]:
    r = dict(row)
    r["industry"] = r.get("sector", r.get("industry", ""))
    r["solution_description"] = r.get("solution_description", f"Prototype {r.get('sector','')} capability for public-sector use.")
    r["stage"] = r.get("startup_stage", r.get("stage", ""))
    r["data_status"] = r.get("data_label", "SYNTHETIC / PROTOTYPE")
    r["capabilities"] = str(r.get("capabilities", "")).replace(" | ", ";")
    r["verification_status"] = r.get("verification_status", "Pending Manual Review")
    return r


def application_view(row: Dict[str, Any]) -> Dict[str, Any]:
    r = dict(row)
    r["status"] = r.get("application_status", r.get("status", "Submitted"))
    r["submitted_on"] = r.get("submitted_date", r.get("submitted_on", ""))
    r["notes"] = r.get("proposed_solution", r.get("notes", ""))
    return r


def evaluation_view(row: Dict[str, Any]) -> Dict[str, Any]:
    r = dict(row)
    r["problem_fit"] = r.get("feasibility_score", r.get("problem_fit", ""))
    r["risk_score"] = r.get("security_score", r.get("risk_score", ""))
    r["decision"] = r.get("recommendation", r.get("decision", ""))
    return r


def pilot_progress(pilot_id: str) -> int:
    ms = df("milestones.csv")
    if ms.empty or "pilot_id" not in ms.columns:
        return 0
    sub = ms[ms.pilot_id.astype(str) == str(pilot_id)]
    if sub.empty:
        return 0
    return int(round(pd.to_numeric(sub.percentage, errors="coerce").fillna(0).mean()))


def pilot_view(row: Dict[str, Any]) -> Dict[str, Any]:
    r = dict(row)
    ch = one("challenges.csv", "challenge_id", str(r.get("challenge_id", ""))) if r.get("challenge_id") else {}
    r["pilot_location"] = ch.get("city", "")
    r["progress"] = pilot_progress(str(r.get("pilot_id", "")))
    r["status"] = r.get("overall_status", r.get("status", ""))
    r["security_status"] = r.get("security_status", "NEEDS_REVIEW")
    return r


def validation_view(row: Dict[str, Any]) -> Dict[str, Any]:
    r = dict(row)
    if "result" in r:
        r["overall_status"] = "PASSED" if str(r["result"]).upper() == "PASS" else "FAILED"
        r["validator"] = r.get("expert_id", "")
        r["technical_status"] = r["overall_status"]
        r["impact_status"] = r["overall_status"]
        r["security_status"] = r["overall_status"]
    return r


def requirements_for(challenge_id: str) -> List[Dict[str, Any]]:
    req = df("challenge_requirements.csv")
    if req.empty or "challenge_id" not in req.columns:
        return []
    return req[req.challenge_id.astype(str).str.upper() == str(challenge_id).upper()].to_dict("records")


def capability_set(value: Any) -> set[str]:
    return {x.strip().lower() for x in re.split(r"[|;,]", str(value or "")) if x.strip()}


def token_set(value: Any) -> set[str]:
    return {x for x in re.findall(r"[a-z0-9]+", str(value or "").lower()) if len(x) > 2}


def matching_score(ch: Dict[str, Any], startup: Dict[str, Any]) -> Dict[str, Any]:
    required = capability_set(ch.get("required_capabilities", ch.get("required_technologies", "")))
    capabilities = capability_set(startup.get("capabilities", ""))
    matched = sorted(required & capabilities)
    capability_score = round(100 * len(matched) / max(1, len(required)), 1)
    sector_score = 100.0 if str(ch.get("sector", "")).strip().lower() == str(startup.get("sector", "")).strip().lower() else 0.0
    # Give related terms partial credit without making Maharashtra location a ranking advantage.
    if not sector_score:
        sector_score = round(100 * len(token_set(ch.get("sector")) & token_set(startup.get("sector"))) / max(1, len(token_set(ch.get("sector")))), 1)
    trust = live_trust_score(str(startup.get("startup_id", "")))
    experience = clamp(35 + as_int(startup.get("pilot_experience")) * 8 + min(as_int(startup.get("past_projects")), 8) * 3)
    overall = round(capability_score * 0.40 + sector_score * 0.30 + trust * 0.20 + experience * 0.10, 1)
    reasons = [f"{x.title()} capability matches" for x in matched[:4]]
    if sector_score >= 100:
        reasons.append("Sector alignment")
    if trust >= 60:
        reasons.append("Current trust evidence supports eligibility")
    if not reasons:
        reasons.append("Partial evidence match; expert review required")
    return {
        "capability_score": capability_score,
        "sector_score": sector_score,
        "trust_score_component": trust,
        "experience_score": experience,
        "overall_match_score": overall,
        "score": overall,
        "match_score": overall,
        "matched_requirements": matched,
        "missing": sorted(required - capabilities),
        "reasons": reasons,
        "label": "Strong Match" if overall >= 80 else ("Good Match" if overall >= 60 else "Review Match"),
    }


def all_matches(challenge_id: str) -> List[Dict[str, Any]]:
    ch = one("challenges.csv", "challenge_id", challenge_id)
    startups = df("startups.csv")
    results=[]
    for raw in startups.to_dict("records"):
        s = startup_view(raw)
        score = matching_score(ch, s)
        results.append({
            "startup_id": s.get("startup_id"), "startup_name": s.get("startup_name"),
            "city": s.get("city"), "state": s.get("state"), "country": s.get("country", "India"),
            "sector": s.get("sector"), "capabilities": s.get("capabilities"),
            "solution_description": s.get("solution_description"), "startup_stage": s.get("startup_stage"),
            "eligible_track": "micro-pilot" if score["trust_score_component"] < 40 else "standard",
            **score,
        })
    return sorted(results, key=lambda x: x["overall_match_score"], reverse=True)


def all_startup_matches(startup_id: str) -> List[Dict[str, Any]]:
    startup = startup_view(one("startups.csv", "startup_id", startup_id))
    out=[]
    for ch in df("challenges.csv").to_dict("records"):
        score=matching_score(ch,startup)
        out.append({"challenge_id":ch.get("challenge_id"),"title":ch.get("title"),"challenge_title":ch.get("title"),
                    "department_id":ch.get("department_id"),"sector":ch.get("sector"),"district":ch.get("district"),
                    "city":ch.get("city"),"pilot_location":ch.get("city"),"budget_ceiling_inr":ch.get("budget_ceiling_inr"),
                    "duration_days":ch.get("pilot_duration_days"),"problem_statement":ch.get("problem_statement"),**score})
    return sorted(out,key=lambda x:x["overall_match_score"],reverse=True)


def clamp(x: float, lo: float = 0, hi: float = 100) -> float:
    return max(lo, min(hi, x))


def _build_trust_cache() -> Dict[str, Dict[str, Any]]:
    global TRUST_CACHE
    if TRUST_CACHE:
        return TRUST_CACHE
    startups=rows("startups.csv"); milestones=df("milestones.csv"); pilots=df("pilots.csv"); validations=df("validations.csv"); evaluations=df("evaluations.csv"); security=df("security_checks.csv"); identities=df("identity_verifications.csv"); apps=df("applications.csv")
    for startup in startups:
        sid=str(startup.get("startup_id")); pids=set(pilots[pilots.startup_id.astype(str)==sid].pilot_id.astype(str)) if not pilots.empty else set()
        ms=milestones[milestones.pilot_id.astype(str).isin(pids)] if not milestones.empty else pd.DataFrame()
        completed=ms[ms.status.astype(str).str.lower().isin(["completed","completed late"])] if not ms.empty else pd.DataFrame()
        on_time=0 if completed.empty else float((pd.to_datetime(completed.completion_date,errors="coerce")<=pd.to_datetime(completed.due_date,errors="coerce")).mean()*100)
        vv=validations[validations.pilot_id.astype(str).isin(pids)] if not validations.empty else pd.DataFrame(); vp=0 if vv.empty else float(vv.result.astype(str).str.upper().eq("PASS").mean()*100)
        aids=set(apps[apps.startup_id.astype(str)==sid].application_id.astype(str)) if not apps.empty else set(); ee=evaluations[evaluations.application_id.astype(str).isin(aids)] if not evaluations.empty else pd.DataFrame(); ex=0 if ee.empty else float(pd.to_numeric(ee.overall_score,errors="coerce").mean())
        ss=security[security.startup_id.astype(str)==sid] if not security.empty else pd.DataFrame(); sec=100 if (not ss.empty and ss.overall_status.astype(str).str.upper().eq("SECURITY_CLEARED").any()) else 45
        iv=identities[identities.startup_id.astype(str)==sid] if not identities.empty else pd.DataFrame(); ident=100 if (not iv.empty and iv.status.astype(str).str.lower().str.startswith("verified").any()) else 40
        if not aids and ms.empty and vv.empty and ee.empty:
            base=as_float(startup.get("trust_score"),0); on_time=max(on_time,base); vp=max(vp,base); ex=max(ex,base)
        score=round(clamp(.25*on_time+.25*vp+.30*ex+.15*sec+.05*ident),1)
        TRUST_CACHE[sid]={"startup_id":sid,"trust_score":score,"on_time_milestone_performance":round(on_time,1),"validation_pass_rate":round(vp,1),"average_expert_score":round(ex,1),"security_status_score":sec,"identity_verification_score":ident,"eligible_track":"micro-pilot" if score<40 else "standard","formula":"25% on-time milestones + 25% validation pass rate + 30% average expert score + 15% security + 5% identity","label":"Prototype eligibility/risk score — not an official government credit score"}
    return TRUST_CACHE


def live_trust_score(startup_id: str) -> float:
    return as_float(_build_trust_cache().get(str(startup_id),{}).get("trust_score"),0)


def trust_breakdown(startup_id: str) -> Dict[str, Any]:
    data=dict(_build_trust_cache().get(str(startup_id),{}))
    if not data:
        one("startups.csv","startup_id",startup_id)
        data=dict(_build_trust_cache().get(str(startup_id),{}))
    return data


def audit(action: str, entity_type: str, entity_id: str, actor_type: str = "Government", actor_id: str = "GOV-DEMO", details: str = "") -> Dict[str, Any]:
    row={"audit_id":next_id("audit_logs.csv","audit_id","AUD",5),"action":action,"entity_type":entity_type,"entity_id":entity_id,
         "actor_type":actor_type,"actor_id":actor_id,"timestamp":datetime.now().isoformat(timespec="seconds"),"details":details or "Prototype audit event."}
    return append_row("audit_logs.csv",row)


# ---------------- Models ----------------
class ChallengeInput(BaseModel):
    title: str
    department: str = ""
    department_id: Optional[str] = None
    sector: str
    required_technologies: str = ""
    required_capabilities: Optional[str] = None
    pilot_location: str = ""
    city: Optional[str] = None
    district: Optional[str] = None
    duration_months: int = 3
    pilot_duration_days: Optional[int] = None
    problem: str = ""
    problem_statement: Optional[str] = None
    baseline_metric: str = ""
    expected_outcome: str = ""
    target_metric: Optional[str] = None
    success_metric: str = ""
    budget_range: str = ""
    budget_ceiling_inr: Optional[int] = None
    data_sensitivity: str = "Public"
    citizen_facing: str = "No"

class StartupInput(BaseModel):
    startup_name: str
    founder_name: str = "Synthetic Founder"
    state: str
    city: str
    sector: str
    industry: Optional[str] = None
    capabilities: str
    technology_stack: str = "Python | React | Cloud"
    solution_description: str = ""
    stage: str = "Seed"
    startup_stage: Optional[str] = None
    years_experience: int = 1
    turnover_band: str = "Pre-revenue"
    team_size: int = 5

class ApplicationInput(BaseModel):
    challenge_id: str
    startup_id: str
    proposed_solution: str = ""
    notes: str = ""
    requested_budget: int = 0
    proposed_duration: int = 90
    expected_kpi: str = ""

class EvaluationInput(BaseModel):
    application_id: str
    expert_id: str
    technical_score: int = Field(ge=0, le=100)
    innovation_score: int = Field(default=0, ge=0, le=100)
    feasibility_score: int = Field(default=0, ge=0, le=100)
    impact_score: int = Field(default=0, ge=0, le=100)
    security_score: int = Field(default=0, ge=0, le=100)
    problem_fit: Optional[int] = Field(default=None, ge=0, le=100)
    risk_score: Optional[int] = Field(default=None, ge=0, le=100)
    comments: str = ""

class IdentityInput(BaseModel):
    mode: str = "prototype"
    liveness: bool = True

class SecurityInput(BaseModel):
    access_control: str = "PASS"
    encryption_in_transit: str = "PASS"
    api_exposure: str = "PASS"
    dependency_risk: str = "PASS"
    data_access: str = "PASS"

class MilestoneApprovalInput(BaseModel):
    expert_id: str
    department_user: str

class KPIInput(BaseModel):
    kpi_name: str
    baseline: float
    target: float
    actual: float
    unit: str = "%"

class ValidationInput(BaseModel):
    pilot_id: str
    expert_id: str
    metric: Optional[str] = None
    comments: str = ""

class GrievanceInput(BaseModel):
    pilot_id: str
    department_id: str
    category: str
    description: str
    sentiment: str = "Neutral"

class ChatInput(BaseModel):
    message: str
    role: str = "government"
    startup_id: str = ""

class ScenarioInput(BaseModel):
    minimum_trust_score: int = 40
    minimum_years_experience: int = 2
    minimum_turnover_band: str = "Pre-revenue"
    pilot_budget_ceiling_inr: int = 10000000


@app.get("/api/health")
def health():
    return {"status":"ok","project":"GOVINNOVATE","data_layer":"CSV","dataset_label":"Prototype Demonstration Data"}

@app.get("/api/states")
def states():
    st=df("startups.csv")
    values=sorted(set(st.state.astype(str))) if not st.empty and "state" in st.columns else []
    return values

@app.get("/api/statistics")
def statistics():
    ch=df("challenges.csv"); st=df("startups.csv"); apps=df("applications.csv"); ev=df("evaluations.csv"); p=df("pilots.csv"); vals=df("validations.csv"); scale=df("scaleups.csv"); ms=df("milestones.csv"); passp=df("solution_passports.csv")
    return {"startups":len(st),"challenges":len(ch),"open_challenges":int(ch.status.astype(str).str.lower().eq("open").sum()) if not ch.empty else 0,
            "applications":len(apps),"evaluations":len(ev),"pilots":len(p),
            "active_pilots":int(p.overall_status.astype(str).str.lower().isin(["in progress","pilot ready"]).sum()) if not p.empty else 0,
            "completed_pilots":int(p.overall_status.astype(str).str.lower().eq("completed").sum()) if not p.empty else 0,
            "at_risk_pilots":len(early_warnings()),"validations":len(vals),
            "successful_validations":int(vals.result.astype(str).str.upper().eq("PASS").sum()) if not vals.empty else 0,
            "validated_solutions":len(passp),"scaleups":len(scale),"scaleup_ready":len([x for x in passp.to_dict("records") if str(x.get("credential_status"))=="VALIDATED"]),
            "pending_milestones":int(ms.status.astype(str).str.lower().isin(["pending","at risk","overdue"]).sum()) if not ms.empty else 0,
            "procurements":len(p),
            "departments":len(df("departments.csv")),"experts":len(df("experts.csv")),"states":int(st.state.nunique()) if not st.empty else 0}

@app.get("/api/challenges")
def get_challenges(): return [challenge_view(x) for x in rows("challenges.csv")]

@app.get("/api/challenges/{challenge_id}")
def get_challenge(challenge_id: str):
    r=challenge_view(one("challenges.csv","challenge_id",challenge_id)); r["requirements"]=requirements_for(challenge_id)
    r["application_count"]=int((df("applications.csv").challenge_id.astype(str)==challenge_id).sum()) if not df("applications.csv").empty else 0
    return r

@app.put("/api/challenges/{challenge_id}")
def update_challenge(challenge_id: str, data: ChallengeInput):
    table=df("challenges.csv"); hit=table[table.challenge_id.astype(str)==challenge_id]
    if hit.empty: raise HTTPException(404,"Challenge not found")
    idx=hit.index[0]
    department_id=data.department_id or str(hit.loc[idx,"department_id"])
    if data.department and not data.department_id:
        depts=df("departments.csv"); h=depts[depts.department_name.astype(str).str.lower()==data.department.lower()]
        if not h.empty: department_id=str(h.iloc[0].department_id)
    days=data.pilot_duration_days or max(30,data.duration_months*30); budget=data.budget_ceiling_inr or as_int(hit.loc[idx,"budget_ceiling_inr"])
    updates={"department_id":department_id,"department_name":one("departments.csv","department_id",department_id).get("department_name",data.department),"title":data.title,
             "problem_statement":data.problem_statement or data.problem,"sector":data.sector,"district":data.district or data.city or hit.loc[idx,"district"],"city":data.city or data.pilot_location or hit.loc[idx,"city"],
             "baseline_metric":data.baseline_metric,"target_metric":data.target_metric or data.expected_outcome,"success_metric":data.success_metric or data.target_metric or data.expected_outcome,
             "budget_ceiling_inr":budget,"pilot_duration_days":days,"data_sensitivity":data.data_sensitivity or hit.loc[idx,"data_sensitivity"],"required_capabilities":data.required_capabilities or data.required_technologies or hit.loc[idx,"required_capabilities"],"citizen_facing":data.citizen_facing or hit.loc[idx,"citizen_facing"]}
    for k,v in updates.items(): table.loc[idx,k]=v
    write_df("challenges.csv",table); audit("Challenge Posted","challenge",challenge_id,"Government","GOV-DEMO","Challenge updated in prototype dataset.")
    return challenge_view(table.loc[idx].to_dict())

@app.post("/api/challenges")
def create_challenge(data: ChallengeInput):
    dept_id=data.department_id
    depts=df("departments.csv")
    if not dept_id and not depts.empty and data.department:
        hit=depts[depts.department_name.astype(str).str.lower()==data.department.strip().lower()]
        if not hit.empty: dept_id=str(hit.iloc[0].department_id)
    if not dept_id:
        dept_id="D001"
    department=one("departments.csv","department_id",dept_id)
    cid=next_id("challenges.csv","challenge_id","CH",3)
    days=data.pilot_duration_days or max(30,data.duration_months*30)
    budget=data.budget_ceiling_inr
    if budget is None:
        nums=[as_int(x) for x in re.findall(r"\d+",data.budget_range)]
        budget=(max(nums)*100000) if nums else 5000000
    row={"challenge_id":cid,"department_id":dept_id,"department_name":department.get("department_name",data.department),"title":data.title,
         "problem_statement":data.problem_statement or data.problem,"sector":data.sector,"district":data.district or data.city or "Maharashtra",
         "city":data.city or data.pilot_location,"baseline_metric":data.baseline_metric,"target_metric":data.target_metric or data.expected_outcome,
         "success_metric":data.success_metric or data.target_metric or data.expected_outcome,"budget_ceiling_inr":budget,"pilot_duration_days":days,
         "data_sensitivity":data.data_sensitivity,"required_capabilities":data.required_capabilities or data.required_technologies,
         "eligibility_requirements":"Indian startup; capability evidence; security review; pilot delivery capacity",
         "created_date":TODAY.isoformat(),"application_deadline":(TODAY+timedelta(days=45)).isoformat(),"status":"Open","citizen_facing":data.citizen_facing,
         "data_label":"Prototype Demonstration Data","official_tender":"No"}
    append_row("challenges.csv",row)
    reqs=capability_set(row["required_capabilities"])
    for idx,req in enumerate(sorted(reqs),1):
        append_row("challenge_requirements.csv",{"requirement_id":f"{cid}{idx:02d}","challenge_id":cid,"requirement":req.title(),"mandatory":"Yes" if idx<=2 else "No","weight":round(1/max(1,len(reqs)),3)})
    audit("Challenge Posted","challenge",cid,"Government","GOV-DEMO", "Prototype challenge created; not an official tender.")
    return challenge_view(row)

@app.get("/api/challenges/{challenge_id}/matches")
def challenge_matches(challenge_id: str):
    one("challenges.csv","challenge_id",challenge_id); matches=all_matches(challenge_id)
    return {"challenge":challenge_view(one("challenges.csv","challenge_id",challenge_id)),"total_startups":len(matches),"matches":matches}

@app.get("/api/matching/startups/{challenge_id}")
def legacy_matching_startups(challenge_id: str): return all_matches(challenge_id)

@app.get("/api/matching/challenges/{startup_id}")
def legacy_matching_challenges(startup_id: str): return all_startup_matches(startup_id)

@app.get("/api/startups")
def get_startups(): return [startup_view(x) for x in rows("startups.csv")]

@app.get("/api/startups/{startup_id}")
def get_startup(startup_id: str):
    r=startup_view(one("startups.csv","startup_id",startup_id)); r["trust_score_detail"]=trust_breakdown(startup_id); return r

@app.post("/api/startups")
def create_startup(data: StartupInput):
    sid=next_id("startups.csv","startup_id","S",4)
    row={"startup_id":sid,"startup_name":data.startup_name,"founder_name":data.founder_name,"city":data.city,"state":data.state,"country":"India",
         "sector":data.sector,"founded_year":TODAY.year-data.years_experience,"team_size":data.team_size,"startup_stage":data.startup_stage or data.stage,
         "capabilities":data.capabilities.replace(","," | "),"technology_stack":data.technology_stack,"years_experience":data.years_experience,"turnover_band":data.turnover_band,
         "past_projects":0,"pilot_experience":0,"verification_status":"Pending Manual Review","trust_score":40,"security_status":"NEEDS_REVIEW","eligible_track":"standard","data_label":"SYNTHETIC / PROTOTYPE"}
    append_row("startups.csv",row); append_row("identity_verifications.csv",{"identity_verification_id":next_id("identity_verifications.csv","identity_verification_id","IDV",4),"startup_id":sid,"status":"Pending Manual Review","method":"Prototype face-match/liveness verification","checked_date":TODAY.isoformat(),"prototype_only":"Yes"})
    audit("Application Submitted","startup",sid,"Startup",sid,"Startup onboarding record created.")
    return startup_view(row)

@app.post("/api/startups/register")
def register_startup(data: StartupInput): return create_startup(data)

@app.post("/api/startups/{startup_id}/verify-identity")
def verify_identity(startup_id: str, data: IdentityInput):
    one("startups.csv","startup_id",startup_id); table=df("identity_verifications.csv");
    if table.empty: raise HTTPException(500,"Identity verification dataset unavailable")
    idx=table[table.startup_id.astype(str)==startup_id].index
    status="Verified — Face Matched" if data.liveness else "Pending Manual Review"
    if len(idx):
        table.loc[idx[0],"status"]=status; table.loc[idx[0],"checked_date"]=TODAY.isoformat(); write_df("identity_verifications.csv",table)
    else:
        append_row("identity_verifications.csv",{"identity_verification_id":next_id("identity_verifications.csv","identity_verification_id","IDV",4),"startup_id":startup_id,"status":status,"method":"Prototype face-match/liveness verification","checked_date":TODAY.isoformat(),"prototype_only":"Yes"})
    st=df("startups.csv"); sidx=st[st.startup_id.astype(str)==startup_id].index
    if len(sidx): st.loc[sidx[0],"verification_status"]="Verified — Face Matched" if data.liveness else "Pending Manual Review"; write_df("startups.csv",st)
    audit("Security Check","startup",startup_id,"Startup",startup_id,"Prototype face-match/liveness verification.")
    return {"startup_id":startup_id,"status":status,"liveness":"PASS" if data.liveness else "REVIEW","label":"Prototype face-match/liveness verification"}

@app.get("/api/startups/{startup_id}/trust-score")
def startup_trust(startup_id: str): return trust_breakdown(startup_id)

@app.get("/api/startups/{startup_id}/recommendations")
def startup_recommendations(startup_id: str):
    return {"startup":startup_view(one("startups.csv","startup_id",startup_id)),"matches":all_startup_matches(startup_id)[:50]}

@app.get("/api/startups/{startup_id}/matches")
def startup_matches(startup_id: str): return {"startup":startup_view(one("startups.csv","startup_id",startup_id)),"startup_id":startup_id,"total_challenges":len(df("challenges.csv")),"matches":all_startup_matches(startup_id)}

@app.get("/api/applications")
def get_applications():
    apps=rows("applications.csv"); challenges=lookup_dict("challenges.csv","challenge_id"); startups=lookup_dict("startups.csv","startup_id"); sec=df("security_checks.csv"); out=[]
    for raw in apps:
        r=application_view(raw); ch=challenges.get(str(raw.get("challenge_id"))); st=startups.get(str(raw.get("startup_id")))
        if ch and st:
            r["overall_match_score"]=matching_score(ch,startup_view(st))["overall_match_score"]
        if not sec.empty:
            ss=sec[sec.startup_id.astype(str)==str(raw.get("startup_id"))]; r["security_status"]=ss.iloc[-1].overall_status if not ss.empty else st.get("security_status","") if st else ""
        out.append(r)
    return out

@app.get("/api/applications/{application_id}")
def get_application(application_id: str): return application_view(one("applications.csv","application_id",application_id))

@app.post("/api/applications")
def create_application(data: ApplicationInput):
    ch=one("challenges.csv","challenge_id",data.challenge_id); startup=one("startups.csv","startup_id",data.startup_id)
    trust=live_trust_score(data.startup_id); track="micro-pilot" if trust<40 else "standard"
    budget=data.requested_budget or as_int(ch.get("budget_ceiling_inr"))
    appid=next_id("applications.csv","application_id","APP",4)
    row={"application_id":appid,"challenge_id":data.challenge_id,"startup_id":data.startup_id,"submitted_date":TODAY.isoformat(),
         "proposed_solution":data.proposed_solution or data.notes,"requested_budget":budget,"proposed_duration":data.proposed_duration,
         "eligibility_status":"Eligible" if track=="standard" else "Micro-pilot eligible","trust_score_at_application":trust,"eligible_track":track,
         "application_status":"Submitted","data_label":"Prototype Demonstration Data"}
    append_row("applications.csv",row); audit("Application Submitted","application",appid,"Startup",data.startup_id,"Application submitted to Maharashtra challenge.")
    return application_view(row)


class ApplicationDecisionInput(BaseModel):
    action: str
    reason: str = ""

@app.post("/api/applications/{application_id}/decision")
def application_decision(application_id: str, data: ApplicationDecisionInput):
    allowed={"shortlist":"Shortlisted","reject":"Rejected","pilot":"Pilot Selected"}
    key=data.action.strip().lower()
    if key not in allowed:
        raise HTTPException(422,"action must be shortlist, reject or pilot")
    apps=df("applications.csv"); hit=apps[apps.application_id.astype(str)==application_id]
    if hit.empty: raise HTTPException(404,"Application not found")
    idx=hit.index[0]
    evaluations=df("evaluations.csv")
    evhit=evaluations[evaluations.application_id.astype(str)==application_id] if not evaluations.empty else pd.DataFrame()
    if key=="pilot" and evhit.empty:
        raise HTTPException(409,"An expert evaluation is required before pilot selection")
    apps.loc[idx,"application_status"]=allowed[key]; write_df("applications.csv",apps)
    result={"application":application_view(apps.loc[idx].to_dict()),"pilot":None}
    audit("Shortlisted" if key=="shortlist" else ("Pilot Approved" if key=="pilot" else "Application Rejected"),"application",application_id,"Government","GOV-DEMO",data.reason)
    if key=="pilot":
        existing=df("pilots.csv"); existing_hit=existing[existing.application_id.astype(str)==application_id] if not existing.empty else pd.DataFrame()
        if existing_hit.empty:
            a=apps.loc[idx].to_dict(); ch=one("challenges.csv","challenge_id",a["challenge_id"]); startup=one("startups.csv","startup_id",a["startup_id"])
            pid=next_id("pilots.csv","pilot_id","P",3); start=TODAY.isoformat(); end=(TODAY+timedelta(days=as_int(ch.get("pilot_duration_days"),90))).isoformat()
            row={"pilot_id":pid,"challenge_id":a["challenge_id"],"application_id":application_id,"startup_id":a["startup_id"],"department_id":ch["department_id"],"pilot_name":f"Maharashtra {ch['title']} — Pilot {pid}","start_date":start,"end_date":end,"budget":a.get("requested_budget",ch.get("budget_ceiling_inr",0)),"status":"Pilot Ready","overall_status":"Pilot Ready","citizen_facing":ch.get("citizen_facing","No"),"security_status":"NEEDS_REVIEW","validation_status":"Pending","data_label":"Prototype Demonstration Data"}
            append_row("pilots.csv",row)
            for j,name in enumerate(["Discovery & Baseline","Prototype Deployment","Pilot Measurement","Final Handover"],1):
                due=(TODAY+timedelta(days=max(7,as_int(ch.get("pilot_duration_days"),90)*j//4))).isoformat()
                append_row("milestones.csv",{"milestone_id":f"{pid}{j}","pilot_id":pid,"milestone_name":name,"description":f"Prototype milestone for {ch['title']}.","due_date":due,"completion_date":"","status":"Pending","percentage":0,"payment_amount":as_int(a.get("requested_budget",0))//4,"department_approval":"Pending","expert_approval":"Pending"})
            result["pilot"]=pilot_view(row)
        else: result["pilot"]=pilot_view(existing_hit.iloc[0].to_dict())
    return result

@app.get("/api/evaluations")
def get_evaluations(): return [evaluation_view(x) for x in rows("evaluations.csv")]

@app.post("/api/evaluations")
def create_evaluation(data: EvaluationInput):
    approw=one("applications.csv","application_id",data.application_id); one("experts.csv","expert_id",data.expert_id)
    vals=[data.technical_score,data.innovation_score,data.feasibility_score,data.impact_score,data.security_score]
    if data.problem_fit is not None: vals[2]=data.problem_fit
    if data.risk_score is not None: vals[4]=data.risk_score
    overall=round(sum(vals)/5,1)
    rec="Recommend Pilot" if overall>=75 else ("Further Review" if overall>=55 else "Do Not Recommend")
    eid=next_id("evaluations.csv","evaluation_id","EVAL",4)
    row={"evaluation_id":eid,"application_id":data.application_id,"expert_id":data.expert_id,"technical_score":data.technical_score,
         "innovation_score":data.innovation_score,"feasibility_score":vals[2],"impact_score":data.impact_score,"security_score":vals[4],"overall_score":overall,
         "recommendation":rec,"comments":data.comments,"evaluation_date":TODAY.isoformat()}
    append_row("evaluations.csv",row); audit("Application Evaluated","application",data.application_id,"Expert",data.expert_id,f"Overall score {overall}.")
    return evaluation_view(row)

@app.get("/api/experts")
def get_experts(): return rows("experts.csv")

@app.get("/api/pilots")
def get_pilots(): return [pilot_view(x) for x in rows("pilots.csv")]

@app.get("/api/pilots/early-warnings")
def get_early_warnings_pre_detail(): return early_warnings()

@app.get("/api/pilots/{pilot_id}")
def get_pilot(pilot_id: str):
    p=pilot_view(one("pilots.csv","pilot_id",pilot_id)); ms=df("milestones.csv"); kk=df("pilot_kpis.csv"); vv=df("validations.csv"); sec=df("security_checks.csv");
    p["milestones"]=ms[ms.pilot_id.astype(str)==pilot_id].to_dict("records") if not ms.empty else []
    p["kpis"]=kk[kk.pilot_id.astype(str)==pilot_id].to_dict("records") if not kk.empty else []
    p["validation"]=[validation_view(x) for x in vv[vv.pilot_id.astype(str)==pilot_id].to_dict("records")] if not vv.empty else []
    p["security_check"]=sec[sec.pilot_id.astype(str)==pilot_id].to_dict("records")[-1] if not sec.empty and not sec[sec.pilot_id.astype(str)==pilot_id].empty else None
    p["startup"]=startup_view(one("startups.csv","startup_id",p["startup_id"]))
    p["challenge"]=challenge_view(one("challenges.csv","challenge_id",p["challenge_id"]))
    return p


def early_warnings() -> List[Dict[str, Any]]:
    pilots=df("pilots.csv"); ms=df("milestones.csv"); kk=df("pilot_kpis.csv"); sec=df("security_checks.csv")
    out=[]
    if pilots.empty: return out
    for p in pilots.to_dict("records"):
        pid=str(p.get("pilot_id")); reasons=[]; risk="GREEN"
        pm=ms[ms.pilot_id.astype(str)==pid] if not ms.empty else pd.DataFrame()
        if not pm.empty:
            overdue=pm[pm.status.astype(str).str.lower().isin(["overdue"])]
            if not overdue.empty: risk="RED"; reasons.append("Overdue milestone")
            elif (pm.status.astype(str).str.lower()=="at risk").any(): risk="AMBER"; reasons.append("Milestone at risk")
        pk=kk[kk.pilot_id.astype(str)==pid] if not kk.empty else pd.DataFrame()
        if not pk.empty:
            failures=pk[pk.status.astype(str).str.upper().eq("FAIL")]
            if not failures.empty: risk="RED"; reasons.append("KPI failure")
        ps=sec[sec.pilot_id.astype(str)==pid] if not sec.empty else pd.DataFrame()
        if not ps.empty and ps.overall_status.astype(str).str.upper().eq("NEEDS_REVIEW").any(): risk="RED"; reasons.append("Security issue")
        if risk!="GREEN" or str(p.get("overall_status",""))=="At Risk":
            if str(p.get("overall_status"))=="At Risk": reasons.append("Pilot marked at risk")
            startup=one("startups.csv","startup_id",str(p.get("startup_id")))
            out.append({"pilot_id":pid,"startup_id":p.get("startup_id"),"startup_name":startup.get("startup_name"),"risk":risk,"reason":"; ".join(dict.fromkeys(reasons)) or "Potential delivery gap","recommended_action":"Review milestone/KPI evidence and intervene before the next gate."})
    return out

@app.get("/api/pilots/early-warnings")
def get_early_warnings(): return early_warnings()

@app.post("/api/pilots/{pilot_id}/security-check")
def run_security_check(pilot_id: str, data: SecurityInput = SecurityInput()):
    p=one("pilots.csv","pilot_id",pilot_id); sid=str(p["startup_id"])
    values=[data.access_control,data.encryption_in_transit,data.api_exposure,data.dependency_risk,data.data_access]
    status="SECURITY_CLEARED" if all(str(x).upper()=="PASS" for x in values) else "NEEDS_REVIEW"
    row={"security_check_id":next_id("security_checks.csv","security_check_id","SEC",3),"pilot_id":pilot_id,"startup_id":sid,
         "access_control":data.access_control,"encryption_in_transit":data.encryption_in_transit,"api_exposure":data.api_exposure,
         "dependency_risk":data.dependency_risk,"data_access":data.data_access,"overall_status":status,"checked_date":TODAY.isoformat(),
         "prototype_label":"Prototype automated security pre-check"}
    append_row("security_checks.csv",row)
    pilots=df("pilots.csv"); idx=pilots[pilots.pilot_id.astype(str)==pilot_id].index
    if len(idx):
        pilots.loc[idx[0],"security_status"]=status
        if status=="SECURITY_CLEARED" and str(pilots.loc[idx[0],"overall_status"]).lower() in {"pilot ready","approved","security cleared"}:
            pilots.loc[idx[0],"overall_status"]="In Progress"; pilots.loc[idx[0],"status"]="In Progress"
        write_df("pilots.csv",pilots)
    audit("Security Cleared" if status=="SECURITY_CLEARED" else "Security Check","pilot",pilot_id,"System","SEC-GATE",status)
    return row

@app.get("/api/milestones")
def get_milestones(): return rows("milestones.csv")

@app.post("/api/milestones/{milestone_id}/approve")
def approve_milestone(milestone_id: str, data: MilestoneApprovalInput):
    ms=df("milestones.csv"); hit=ms[ms.milestone_id.astype(str)==milestone_id]
    if hit.empty: raise HTTPException(404,"Milestone not found")
    idx=hit.index[0]; pilot_id=str(hit.iloc[0].pilot_id); p=one("pilots.csv","pilot_id",pilot_id)
    if str(p.get("security_status","NEEDS_REVIEW")).upper()!="SECURITY_CLEARED":
        sec=df("security_checks.csv"); latest=sec[sec.pilot_id.astype(str)==pilot_id].tail(1)
        if latest.empty or str(latest.iloc[0].overall_status).upper()!="SECURITY_CLEARED": raise HTTPException(409,"Security gate must be cleared before milestone approval")
    one("experts.csv","expert_id",data.expert_id)
    if not data.department_user.strip(): raise HTTPException(422,"department_user approval is required")
    ms.loc[idx,"status"]="Completed"; ms.loc[idx,"percentage"]=100; ms.loc[idx,"completion_date"]=TODAY.isoformat(); ms.loc[idx,"department_approval"]="Approved"; ms.loc[idx,"expert_approval"]="Approved"; write_df("milestones.csv",ms)
    amount=as_int(hit.iloc[0].payment_amount)
    pay=append_row("payment_releases.csv",{"payment_release_id":next_id("payment_releases.csv","payment_release_id","PAY",4),"milestone_id":milestone_id,"pilot_id":pilot_id,"amount":amount,"release_status":"Released","release_date":TODAY.isoformat(),"workflow_label":"Prototype Payment Workflow / Escrow Simulation"})
    append_row("payment_sla.csv",{"sla_id":next_id("payment_sla.csv","sla_id","SLA",4),"milestone_id":milestone_id,"approval_date":TODAY.isoformat(),"sla_days":7,"payment_due_date":(TODAY+timedelta(days=7)).isoformat(),"workflow_label":"Prototype Payment Workflow / Escrow Simulation"})
    trust=trust_breakdown(str(p["startup_id"]))
    # Persist a current trust snapshot.
    ts=df("trust_scores.csv"); existing=ts[ts.startup_id.astype(str)==str(p["startup_id"])]
    row={"trust_score_id":existing.iloc[0].trust_score_id if not existing.empty else next_id("trust_scores.csv","trust_score_id","TRUST",4),**{k:trust[k] for k in ["startup_id","on_time_milestone_performance","validation_pass_rate","average_expert_score","security_status_score","identity_verification_score","trust_score","eligible_track","formula","label"]}}
    if existing.empty: append_row("trust_scores.csv",row)
    else:
        idx2=existing.index[0]
        for k,v in row.items(): ts.loc[idx2,k]=v
        write_df("trust_scores.csv",ts)
    audit("Milestone Approved","milestone",milestone_id,"Government",data.department_user,"Both department and expert approvals recorded.")
    audit("Payment Released","milestone",milestone_id,"System","ESCROW-DEMO",f"Released {amount}.")
    audit("Validation Recorded","startup",str(p["startup_id"]),"System","TRUST-ENGINE",f"Trust score recalculated: {trust['trust_score']}.")
    return {"milestone":ms.loc[idx].to_dict(),"payment":pay,"trust_score":trust,"audit":"created","message":"Milestone approved → payment released → trust score updated → audit logged."}

@app.get("/api/pilot-kpis")
def get_kpis(): return rows("pilot_kpis.csv")
@app.get("/api/metrics")
def get_metrics(): return rows("pilot_kpis.csv")

@app.post("/api/pilots/{pilot_id}/kpis")
def add_pilot_kpi(pilot_id: str, data: KPIInput):
    one("pilots.csv","pilot_id",pilot_id)
    status = "PASS" if (data.actual >= data.target if data.unit.lower() not in {"minutes","hours","index"} else data.actual <= data.target) else "FAIL"
    row={"kpi_id":next_id("pilot_kpis.csv","kpi_id","KPI",5),"pilot_id":pilot_id,"kpi_name":data.kpi_name,"baseline":data.baseline,"target":data.target,"actual":data.actual,"unit":data.unit,"status":status,"measurement_date":TODAY.isoformat()}
    append_row("pilot_kpis.csv",row); audit("KPI Recorded","pilot",pilot_id,"Government","GOV-DEMO",f"{data.kpi_name}: {data.actual} vs {data.target}.")
    return row

@app.get("/api/validations")
def get_validations(): return [validation_view(x) for x in rows("validations.csv")]

@app.post("/api/validations")
def create_validation(data: ValidationInput):
    p=one("pilots.csv","pilot_id",data.pilot_id); approw=one("applications.csv","application_id",p["application_id"]); ev=df("evaluations.csv"); original=ev[ev.application_id.astype(str)==str(p["application_id"])]
    if not original.empty and any(str(x).strip()==str(data.expert_id).strip() for x in original.expert_id.astype(str)):
        raise HTTPException(409,"Validation expert must differ from every original application evaluator")
    one("experts.csv","expert_id",data.expert_id)
    kk=df("pilot_kpis.csv"); subset=kk[kk.pilot_id.astype(str)==data.pilot_id]
    if subset.empty: raise HTTPException(409,"No pilot KPI evidence available")
    metric=data.metric
    k=subset.iloc[0] if not metric else subset[subset.kpi_name.astype(str).str.lower()==metric.lower()].iloc[0] if not subset[subset.kpi_name.astype(str).str.lower()==metric.lower()].empty else subset.iloc[0]
    target=as_float(k.target); actual=as_float(k.actual); unit=str(k.unit).lower()
    passed=actual<=target if unit in {"minutes","hours","index"} else actual>=target
    vid=next_id("validations.csv","validation_id","VAL",3)
    row={"validation_id":vid,"pilot_id":data.pilot_id,"expert_id":data.expert_id,"metric":k.kpi_name,"target":k.target,"actual":k.actual,"result":"PASS" if passed else "FAIL","validation_date":TODAY.isoformat(),"comments":data.comments or "Independent prototype KPI validation."}
    append_row("validations.csv",row); audit("Validation Recorded","validation",vid,"Expert",data.expert_id,row["result"])
    if passed:
        issue_passport(data.pilot_id)
    return validation_view(row)


def issue_passport(pilot_id: str) -> Optional[Dict[str, Any]]:
    vv=df("validations.csv"); passed=vv[(vv.pilot_id.astype(str)==pilot_id)&(vv.result.astype(str).str.upper()=="PASS")]
    if passed.empty: return None
    p=one("pilots.csv","pilot_id",pilot_id); v=passed.iloc[-1].to_dict(); payload=f"{pilot_id}|{p['challenge_id']}|{p['startup_id']}|{v['metric']}|{v['target']}|{v['actual']}|{v['validation_date']}|{p.get('security_status','')}"; h=hashlib.sha256(payload.encode()).hexdigest()
    existing=df("solution_passports.csv"); hit=existing[existing.pilot_id.astype(str)==pilot_id] if not existing.empty else pd.DataFrame()
    if not hit.empty: return hit.iloc[-1].to_dict()
    row={"passport_id":next_id("solution_passports.csv","passport_id","PASS",3),"pilot_id":pilot_id,"challenge_id":p["challenge_id"],"startup_id":p["startup_id"],"validated_metric":v["metric"],"target":v["target"],"actual":v["actual"],"validation_date":v["validation_date"],"security_status":p.get("security_status","NEEDS_REVIEW"),"payload_hash":h,"credential_status":"VALIDATED","credential_label":"Prototype credential — SHA-256 verification, not blockchain."}
    append_row("solution_passports.csv",row); audit("Passport Issued","passport",row["passport_id"],"System","PASSPORT-ENGINE","Issued only after PASS validation."); return row

@app.get("/api/pilots/{pilot_id}/passport")
def pilot_passport(pilot_id: str):
    hit=df("solution_passports.csv"); hit=hit[hit.pilot_id.astype(str)==pilot_id] if not hit.empty else pd.DataFrame()
    if hit.empty: raise HTTPException(404,"No validated solution passport for this pilot")
    return hit.iloc[-1].to_dict()

@app.get("/api/passports/{passport_id}")
def passport(passport_id: str): return one("solution_passports.csv","passport_id",passport_id)

@app.get("/api/passports/{passport_id}/qr")
def passport_qr(passport_id: str):
    one("solution_passports.csv","passport_id",passport_id)
    if qrcode is None: raise HTTPException(503,"QR generator dependency unavailable")
    target=f"{PUBLIC_URL.rstrip('/')}/passport/{passport_id}"
    img=qrcode.make(target); b=BytesIO(); img.save(b,format="PNG"); b.seek(0); return StreamingResponse(b,media_type="image/png")

@app.get("/passport/{passport_id}",response_class=HTMLResponse)
def public_passport(passport_id: str):
    p=one("solution_passports.csv","passport_id",passport_id); s=one("startups.csv","startup_id",p["startup_id"]); c=one("challenges.csv","challenge_id",p["challenge_id"])
    return f"""<!doctype html><html><head><meta charset='utf-8'><title>GovInnovate Passport {passport_id}</title><style>body{{font-family:Arial;background:#f5f7fb;padding:40px;color:#162033}}.card{{max-width:720px;margin:auto;background:#fff;border:1px solid #dce2ec;border-radius:18px;padding:32px;box-shadow:0 15px 45px #0001}}.tag{{display:inline-block;background:#e8f5ef;color:#18794e;padding:7px 11px;border-radius:999px;font-size:12px;font-weight:bold}}dt{{color:#68758a;font-size:12px;margin-top:16px}}dd{{margin:4px 0 0;font-weight:600}}small{{color:#68758a}}</style></head><body><div class='card'><span class='tag'>VALIDATED PROTOTYPE CREDENTIAL</span><h1>Solution Passport {passport_id}</h1><p>{s.get('startup_name','')} · {s.get('city','')}, {s.get('state','')}</p><dl><dt>Challenge</dt><dd>{c.get('title','')} ({p['challenge_id']})</dd><dt>Validated KPI</dt><dd>{p['validated_metric']}</dd><dt>Target</dt><dd>{p['target']}</dd><dt>Actual</dt><dd>{p['actual']}</dd><dt>Validation date</dt><dd>{p['validation_date']}</dd><dt>Security status</dt><dd>{p['security_status']}</dd><dt>SHA-256 payload hash</dt><dd style='word-break:break-all'>{p['payload_hash']}</dd></dl><p><small>Prototype credential — SHA-256 verification, not blockchain. Synthetic prototype data.</small></p></div></body></html>"""

@app.get("/api/security-checks")
def security_checks(): return rows("security_checks.csv")
@app.get("/api/trust-scores")
def trust_scores():
    return [trust_breakdown(str(s["startup_id"])) for s in rows("startups.csv")]
@app.get("/api/proven-solutions")
def proven_solutions(): return rows("proven_solutions.csv")
@app.get("/api/federated-pilots")
def federated_pilots(): return rows("federated_pilots.csv")
@app.get("/api/scaleups")
def scaleups(): return rows("scaleups.csv")
@app.get("/api/demand-radar")
def demand_radar(): return rows("demand_radar.csv")
@app.get("/api/grievances")
def grievances(): return rows("grievances.csv")

@app.post("/api/grievances")
def create_grievance(data: GrievanceInput):
    p=one("pilots.csv","pilot_id",data.pilot_id); ch=one("challenges.csv","challenge_id",p["challenge_id"])
    if str(p.get("citizen_facing","No")).lower()!="yes": raise HTTPException(409,"Citizen feedback is only enabled for citizen-facing pilots")
    row={"grievance_id":next_id("grievances.csv","grievance_id","GRV",4),"pilot_id":data.pilot_id,"department_id":data.department_id,"district":ch.get("district",ch.get("city","Maharashtra")),"category":data.category,"description":data.description,"sentiment":data.sentiment,"status":"Open","created_date":TODAY.isoformat(),"resolved_date":""}
    append_row("grievances.csv",row); audit("Citizen Feedback","pilot",data.pilot_id,"Citizen","PUBLIC",data.category); return row

@app.get("/api/audit-logs")
def audit_logs(): return rows("audit_logs.csv")

@app.get("/api/policy-what-if")
def policy_what_if(): return rows("policy_what_if.csv")

TURNOVER_RANK={"Pre-revenue":0,"<₹1 Cr":1,"₹1–5 Cr":2,"₹5–25 Cr":3,"₹25–100 Cr":4}

def policy_calc(data: ScenarioInput):
    startups=rows("startups.csv"); baseline=[]; after=[]
    for s in startups:
        score=live_trust_score(s["startup_id"]); exp=as_int(s.get("years_experience")); turnover=TURNOVER_RANK.get(s.get("turnover_band","Pre-revenue"),0)
        base=score>=40 and exp>=2
        new=score>=data.minimum_trust_score and exp>=data.minimum_years_experience and turnover>=TURNOVER_RANK.get(data.minimum_turnover_band,0)
        if base: baseline.append(s["startup_id"])
        if new and data.pilot_budget_ceiling_inr>=0: after.append(s["startup_id"])
    b=set(baseline); a=set(after)
    return {"currently_eligible":len(b),"after_change":len(a),"newly_eligible":len(a-b),"excluded":len(b-a),"scenario":data.model_dump(),"calculation_basis":"Derived from current startups.csv and live trust scores."}

@app.post("/api/lab/scenario")
def lab_scenario(data: ScenarioInput): return policy_calc(data)

@app.get("/api/lab/{tool}")
def lab_tool(tool: str):
    if tool=="trust": return {"title":"GovTech Trust Score","result":[trust_breakdown(s["startup_id"]) for s in rows("startups.csv")[:30]]}
    if tool=="rejection": return {"title":"Explainable Rejection Report","result":rows("explainable_rejections.csv")[:30]}
    if tool=="scenario": return {"title":"Policy What-if Sandbox","result":policy_calc(ScenarioInput())}
    if tool=="precedent": return {"title":"Proven Solutions / Precedent Search","result":rows("proven_solutions.csv")[:30]}
    if tool=="cyber": return {"title":"Prototype Security Pre-Check","result":rows("security_checks.csv")[:30]}
    if tool=="payments": return {"title":"Prototype Payment Workflow / Escrow Simulation","result":rows("payment_releases.csv")[:30]}
    if tool=="duplicate":
        ch=rows("challenges.csv"); result=[]
        for i,a in enumerate(ch):
            for b in ch[i+1:]:
                common=token_set(a.get("title")) & token_set(b.get("title"))
                if len(common)>=2: result.append({"first":a["challenge_id"],"second":b["challenge_id"],"common_terms":sorted(common),"risk":"Review"})
                if len(result)>=20: break
            if len(result)>=20: break
        return {"title":"Duplicate Challenge Detector","result":result or [{"message":"No strong duplicate pair detected."}]}
    if tool=="eligibility": return {"title":"Alternative Eligibility Signals","result":{"signals":["identity verification","technical evidence","pilot history","security review","independent validation"],"message":"Prototype decision support; final legal eligibility remains with the department."}}
    if tool=="counterfactual":
        s=rows("startups.csv")[0]; c=rows("challenges.csv")[0]; current=matching_score(c,s)["overall_match_score"]; return {"title":"Counterfactual Matching","result":{"startup":s["startup_name"],"challenge":c["challenge_id"],"current_score":current,"scenario":"Add one missing capability","projected_score":min(100,current+10)}}
    if tool=="integrity": return {"title":"COI & Anomaly Screening","result":{"message":"Screening signals only; no automatic accusation.","experts_checked":len(rows("experts.csv"))}}
    if tool=="readiness": return {"title":"Pilot-to-Production Gate","result":early_warnings()}
    if tool=="expert-load": return {"title":"Expert Load Balancer","result":rows("experts.csv")}
    if tool=="consortium": return {"title":"Consortium Matching","result":[{"startup_a":rows("startups.csv")[0]["startup_name"],"startup_b":rows("startups.csv")[1]["startup_name"],"reason":"Complementary prototype capabilities"}]}
    return {"title":"Innovation Lab","result":{"message":"Tool available for prototype demonstration."}}

@app.get("/api/procurement")
def procurement():
    # Keep old procurement page working, while deriving records from pilot evidence.
    out=[]
    p=rows("pilots.csv"); vals=df("validations.csv"); k=df("pilot_kpis.csv"); warning_map={w["pilot_id"]:w for w in early_warnings()}
    for x in p:
        pid=x["pilot_id"]; vv=vals[vals.pilot_id.astype(str)==pid] if not vals.empty else pd.DataFrame(); passed=bool(not vv.empty and vv.result.astype(str).str.upper().eq("PASS").any()); warnings=[warning_map[pid]] if pid in warning_map else []
        readiness=90 if passed and not warnings else 60 if not warnings else 40
        out.append({"decision_id":f"DEC-{pid}","pilot_id":pid,"readiness_score":readiness,"recommendation":"SCALE" if passed and not warnings else "REVIEW","procurement_status":"Evidence Review" if not passed else "Scale-up Ready","reason":"Derived from validation, KPI and early-warning evidence."})
    return out

@app.get("/api/procurement/{pilot_id}/report")
def procurement_report(pilot_id: str):
    p=pilot_view(one("pilots.csv","pilot_id",pilot_id)); ch=challenge_view(one("challenges.csv","challenge_id",p["challenge_id"])); st=startup_view(one("startups.csv","startup_id",p["startup_id"])); k=df("pilot_kpis.csv"); k=k[k.pilot_id.astype(str)==pilot_id] if not k.empty else pd.DataFrame(); vals=df("validations.csv"); vals=vals[vals.pilot_id.astype(str)==pilot_id] if not vals.empty else pd.DataFrame(); decision=next((x for x in procurement() if x["pilot_id"]==pilot_id),None)
    b=BytesIO(); c=canvas.Canvas(b,pagesize=A4); y=A4[1]-50; c.setFont("Helvetica-Bold",18); c.drawString(50,y,"GOVINNOVATE"); y-=25; c.setFont("Helvetica-Bold",13); c.drawString(50,y,"Prototype Procurement Evidence Report"); y-=25; c.setFont("Helvetica",10)
    lines=[f"Pilot: {pilot_id}",f"Challenge: {ch.get('title','')}",f"Startup: {st.get('startup_name','')} — {st.get('city','')}, {st.get('state','')}",f"Department: {ch.get('department_name','')}",f"Status: {p.get('status','')}",f"Readiness: {decision.get('readiness_score') if decision else 'N/A'}/100",f"Recommendation: {decision.get('recommendation') if decision else 'REVIEW'}","","KPI evidence:"]
    lines += [f"- {r['kpi_name']}: target {r['target']}{r['unit']}, actual {r['actual']}{r['unit']} ({r['status']})" for r in k.to_dict('records')]
    lines += ["",f"Validation: {vals.iloc[-1]['result'] if not vals.empty else 'PENDING'}","","Prototype decision-support artifact — not an official procurement decision."]
    for line in lines:
        if y<55: c.showPage(); y=A4[1]-50; c.setFont("Helvetica",10)
        c.drawString(50,y,str(line)[:120]); y-=15
    c.save(); b.seek(0); return StreamingResponse(b,media_type="application/pdf",headers={"Content-Disposition":f"attachment; filename=GOVINNOVATE_{pilot_id}_report.pdf"})

@app.post("/api/procurement/generate-dossier/{pilot_id}")
def generate_dossier(pilot_id: str):
    return {"pilot_id":pilot_id,"status":"generated","report_url":f"/api/procurement/{pilot_id}/report","label":"Prototype procurement dossier"}

@app.get("/api/challenges/{challenge_id}/similar-solutions")
def similar_solutions(challenge_id: str):
    target=challenge_view(one("challenges.csv","challenge_id",challenge_id)); solutions=rows("proven_solutions.csv"); out=[]
    for s in solutions:
        score=len(token_set(target.get("title")) & token_set(s.get("problem_solved"))) + len(token_set(target.get("sector")) & token_set(s.get("sector")))
        out.append((score,s))
    out.sort(key=lambda x:x[0],reverse=True); return [x[1] for x in out[:8]]

@app.post("/api/pilots/{pilot_id}/reuse-framework")
def reuse_framework(pilot_id: str):
    p=one("pilots.csv","pilot_id",pilot_id); passp=df("solution_passports.csv");
    if passp.empty or not (passp.pilot_id.astype(str)==pilot_id).any(): raise HTTPException(409,"Only validated pilots can be reused")
    source=p["department_id"]; depts=df("departments.csv"); target=depts[depts.department_id.astype(str)!=str(source)].iloc[0].department_id if not depts.empty else "D001"
    row={"scaleup_id":next_id("scaleups.csv","scaleup_id","SCU",3),"source_pilot_id":pilot_id,"source_department_id":source,"adopting_department_id":target,"startup_id":p["startup_id"],"reuse_reason":"Validated solution reused through prototype registry","budget":p["budget"],"status":"Planned","created_date":TODAY.isoformat()}
    append_row("scaleups.csv",row); audit("Scale-Up Created","scaleup",row["scaleup_id"],"Government","GOV-DEMO","Validated solution reuse."); return row

@app.get("/api/chat")
def legacy_chat(q: str = Query("")): return chat(ChatInput(message=q))

@app.post("/api/chat")
def chat(data: ChatInput):
    t=data.message.lower().strip()
    startups=rows("startups.csv"); challenges=rows("challenges.csv"); pilots=rows("pilots.csv"); vals=rows("validations.csv"); kpis=rows("pilot_kpis.csv")
    sid=data.startup_id or (startups[0]["startup_id"] if startups else "")
    if "trust" in t and sid:
        tr=trust_breakdown(sid)
        return {"reply":f"Your current prototype Trust Score is {tr['trust_score']}/100 ({tr['eligible_track']}). It is weighted 25% milestones, 25% validation, 30% expert score, 15% security and 5% identity.","suggestions":["Show recommended challenges","Show security status"]}
    if "rejected" in t:
        rej=rows("explainable_rejections.csv")
        reasons=sorted(set(x.get("reason_code","") for x in rej[:6] if x.get("reason_code")))
        return {"reply":f"The prototype keeps explainable rejection reasons such as {', '.join(reasons) or 'evidence or eligibility gaps'}. Open an application to inspect its supporting evidence.","suggestions":["Why was this application rejected?","What challenges match my startup?"]}
    if "match" in t or "recommend" in t:
        matches=all_startup_matches(sid)[:3] if sid else []
        return {"reply":"Top prototype challenge matches: "+(", ".join(f"{x['challenge_id']} ({x['overall_match_score']}%)" for x in matches) or "none available")+". Matching uses 40% capability, 30% sector, 20% trust and 10% previous experience.","suggestions":[]}
    if "how many" in t and "state" in t:
        states=sorted({str(x.get("state","")) for x in startups if x.get("state")})
        return {"reply":f"The prototype startup pool covers {len(states)} Indian states/UT locations.","suggestions":[]}
    if "how many" in t and "startup" in t:
        return {"reply":f"There are {len(startups)} synthetic startup records across the India-wide supply pool.","suggestions":[]}
    if "at risk" in t or "early warning" in t:
        warnings=early_warnings()
        if not warnings:
            reply="No pilots currently have an early-warning record in the prototype dataset."
        else:
            reply="At-risk pilot signals: "+"; ".join(f"{x['pilot_id']} ({x['risk']}: {x['reason']})" for x in warnings[:6])+"."
        return {"reply":reply,"suggestions":["Show KPI performance","Run security check"]}
    if "kpi" in t or "performance" in t:
        passed=sum(str(x.get("status","")).upper()=="PASS" for x in kpis)
        failed=sum(str(x.get("status","")).upper()=="FAIL" for x in kpis)
        return {"reply":f"The prototype has {len(kpis)} KPI evidence records: {passed} PASS and {failed} FAIL. KPI status is computed from target vs actual using the metric unit.","suggestions":["Which pilots are at risk?","Show validation status"]}
    if "procurement" in t:
        decisions=procurement()
        scale_ready=sum(1 for x in decisions if x.get("recommendation")=="SCALE")
        return {"reply":f"The procurement desk derives a prototype readiness record for {len(decisions)} pilots; {scale_ready} currently have a SCALE recommendation from validation and early-warning evidence. These are decision-support records, not official procurement decisions.","suggestions":["Which pilots are at risk?","Show KPI performance"]}
    if "pilot" in t:
        return {"reply":f"The dataset contains {len(pilots)} pilots. Current records include In Progress, Completed, At Risk and Pilot Ready states.","suggestions":["Which pilots are at risk?","Show KPI performance"]}
    if "security" in t:
        return {"reply":"Security is a prototype gate covering access control, encryption in transit, API exposure, dependency risk and data access. A pilot should not move into In Progress until the gate is cleared.","suggestions":["What is my Trust Score?","Which pilots are at risk?"]}
    if "water" in t or "validated solutions" in t or "proven" in t:
        sols=[x for x in rows("proven_solutions.csv") if "water" in (x.get("sector","")+x.get("problem_solved","")).lower()][:5]
        return {"reply":f"The proven-solutions registry contains {len(rows('proven_solutions.csv'))} validated prototype solutions. Water-related examples found: {len(sols)}.","suggestions":["Search proven solutions","Show demand radar"]}
    if "challenge" in t:
        return {"reply":f"Maharashtra is the demand side in this prototype, with {len(challenges)} challenge records. Startups are the India-wide supply side.","suggestions":["What challenges match my startup?","Show demand radar"]}
    if "validation" in t:
        return {"reply":f"There are {len(vals)} validation records; {sum(str(x.get('result')).upper()=='PASS' for x in vals)} are PASS. Validation must use an expert different from every original evaluator.","suggestions":[]}
    return {"reply":"I can answer about challenges, startup matching, Trust Score, applications, pilots, security, KPI performance, validation, proven solutions, demand radar and the procurement workflow.","suggestions":["What challenges match my startup?","What is my Trust Score?","Which pilots are at risk?"]}

@app.get("/api/{resource}")
def generic_resource(resource: str):
    filename=RESOURCE_FILES.get(resource)
    if not filename: raise HTTPException(404,"Resource not found")
    data=rows(filename)
    if resource=="challenges": return [challenge_view(x) for x in data]
    if resource=="startups": return [startup_view(x) for x in data]
    if resource=="applications": return [application_view(x) for x in data]
    if resource=="evaluations": return [evaluation_view(x) for x in data]
    if resource=="pilots": return [pilot_view(x) for x in data]
    if resource=="validations": return [validation_view(x) for x in data]
    return data
