# GOVINNOVATE — SIH 2026 | Problem Statement 26136

GOVINNOVATE is a prototype startup-friendly public procurement / innovation platform.

**Core model**

```text
MAHARASHTRA GOVERNMENT = DEMAND
        ↓
Government problem / challenge
        ↓
Problem Statement Doctor
        ↓
India-wide startup discovery
        ↓
40/30/20/10 reverse matchmaking
        ↓
Trust + eligibility
        ↓
Application
        ↓
Expert evaluation
        ↓
Security gate
        ↓
Controlled pilot
        ↓
Milestones
        ↓
Prototype payment workflow
        ↓
Independent KPI validation
        ↓
Solution Passport
        ↓
Proven Solutions Registry
        ↓
Reuse / Scale-up across Maharashtra departments
```

## Prototype disclaimer

This repository contains **Prototype Demonstration Data**. All generated startup/company records are marked **SYNTHETIC / PROTOTYPE**. They are not real vendors, government suppliers, tender winners or government-endorsed companies.

Challenge records are synthetic prototype challenges and **are not official government tenders**.

The following components are simulations for a hackathon demonstration:

- Founder face-match / liveness verification
- Automated security pre-check
- Payment / escrow workflow
- SHA-256 Solution Passport credential

The prototype does **not** claim Aadhaar/UIDAI access, DigiLocker integration, production biometric security, production cybersecurity certification, real government payment-gateway integration or blockchain.

## Three role workspaces

### Government

- Maharashtra challenge management
- Problem Statement Doctor
- India-wide startup directory
- Reverse matchmaking
- Application review / shortlist / reject / pilot selection
- Pilot Command Center
- Early-warning risk monitor
- Demand Radar
- Policy What-If Sandbox
- Proven Solutions Registry
- Federated pilots
- Live audit trail
- Prototype procurement reports

### Startup

- India-wide startup profile
- Prototype founder verification
- GovTech Trust Score
- Micro-pilot / standard eligibility track
- Recommended Maharashtra challenges
- Application submission
- Pilot tracking
- Security status
- Validation / passport visibility

### Expert / Validation

- Application evaluation queue
- Technical / innovation / feasibility / impact / security scoring
- Independent validation
- KPI target-vs-actual validation
- Validator independence rule
- Reviewer integrity / evidence analytics

## Matching engine

For startup ↔ challenge matching:

- **40%** capability match
- **30%** sector match
- **20%** Trust Score
- **10%** previous experience

Maharashtra location is displayed as government demand context; it is not used as a Maharashtra-only startup restriction.

## Trust Score

The prototype Trust Score is calculated as:

- 25% on-time milestone performance
- 25% validation pass rate
- 30% average expert score
- 15% security status
- 5% identity verification

`< 40` → `micro-pilot`

`>= 40` → `standard`

This is a prototype eligibility/risk signal, **not an official government credit score**.

## Flagship chained action

From a pilot's milestone timeline:

**Approve Milestone**

→ verify department + expert approvals

→ verify security gate

→ mark milestone approved

→ calculate payment SLA

→ release prototype payment

→ recalculate Trust Score

→ append audit events

The UI reports the complete chain immediately.

## Dataset

The primary CSV dataset is under:

```text
backend/data/
```

Important files include:

```text
departments.csv
challenges.csv
challenge_requirements.csv
startups.csv
startup_capabilities.csv
experts.csv
applications.csv
evaluations.csv
pilots.csv
milestones.csv
pilot_kpis.csv
validations.csv
payment_sla.csv
payment_releases.csv
security_checks.csv
trust_scores.csv
identity_verifications.csv
startup_challenge_matches.csv
proven_solutions.csv
solution_passports.csv
grievances.csv
federated_pilots.csv
scaleups.csv
demand_radar.csv
policy_what_if.csv
audit_logs.csv
challenge_drafts.csv
explainable_rejections.csv
```

The previous project's CSV files are retained under:

```text
backend/data/legacy/
backend/app/data/
```

The new Maharashtra + India-wide dataset is the primary prototype data source.

## Architecture

```text
React + Vite
      ↓
FastAPI REST API
      ↓
Pandas CSV service
      ↓
Prototype workflow / scoring / validation logic
```

No PostgreSQL, MySQL, MongoDB, Firebase, Supabase or other database server is required.

## Important API routes

```text
GET  /api/challenges
POST /api/challenges
GET  /api/challenges/{id}
GET  /api/challenges/{id}/matches
GET  /api/challenges/{id}/similar-solutions

GET  /api/startups
GET  /api/startups/{id}
GET  /api/startups/{id}/trust-score
GET  /api/startups/{id}/recommendations
POST /api/startups/{id}/verify-identity

GET  /api/applications
POST /api/applications
POST /api/applications/{id}/decision

GET  /api/evaluations
POST /api/evaluations

GET  /api/pilots
GET  /api/pilots/{id}
GET  /api/pilots/early-warnings
POST /api/pilots/{id}/security-check
POST /api/pilots/{id}/kpis
GET  /api/pilots/{id}/passport
POST /api/pilots/{id}/reuse-framework

GET  /api/milestones
POST /api/milestones/{id}/approve

GET  /api/validations
POST /api/validations
GET  /api/demand-radar
GET  /api/proven-solutions
GET  /api/federated-pilots
GET  /api/audit-logs
POST /api/grievances
POST /api/lab/scenario
POST /api/chat
```

## Installation

### Backend

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

Backend health:

```text
http://127.0.0.1:8000/api/health
```

Swagger documentation:

```text
http://127.0.0.1:8000/docs
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

The Vite development server proxies `/api` to `http://127.0.0.1:8000`.

## START_GOVINNOVATE.bat

Double-click:

```text
START_GOVINNOVATE.bat
```

The launcher:

1. Checks Python and Node/npm.
2. Creates the backend virtual environment when needed.
3. Installs backend dependencies when needed.
4. Installs frontend dependencies when needed.
5. Clears stale development ports 8000/5173.
6. Starts FastAPI.
7. Waits for `/api/health`.
8. Starts Vite.
9. Opens the browser.
10. Keeps server windows open so errors remain visible.

Optional environment variable for QR links:

```text
GOVINNOVATE_PUBLIC_URL=http://localhost:5173
```

## Recommended SIH demo workflow

1. Enter **Government** workspace.
2. Open a Maharashtra challenge.
3. Run **Problem Statement Doctor**.
4. Open reverse matchmaking and show startups from different Indian states.
5. Open a startup and show Trust Score + eligibility track.
6. Enter **Startup** workspace and submit an application.
7. Enter **Expert** workspace and evaluate it.
8. Return to Government and select the evaluated application as a pilot.
9. Run the prototype security pre-check.
10. Open the Pilot Control Room.
11. Record KPI evidence.
12. Approve a milestone.
13. Show payment release + Trust Score update + audit log.
14. Independently validate the KPI with a different expert.
15. Show the generated Solution Passport and QR code.
16. Open Proven Solutions Registry.
17. Reuse the validated solution for another Maharashtra department.

## Empty/error states

The backend returns empty arrays where appropriate and explicit HTTP errors for invalid workflow actions. Frontend pages display meaningful empty states rather than assuming records exist.

## Testing performed during build

Backend endpoint and workflow checks include:

- FastAPI startup and `/api/health`
- Statistics and all primary CSV resources
- Challenge detail and reverse matchmaking
- Startup trust and recommendations
- Application decision workflow
- Security gate
- Milestone → payment → Trust Score → audit chain
- KPI recording
- Independent validation rejection for the original evaluator
- Independent validation PASS
- SHA-256 Solution Passport
- QR endpoint
- Public passport endpoint
- Demand Radar
- Proven Solutions Registry
- Policy What-If
- Deterministic chatbot

The supplied ZIP contains Windows-specific `node_modules` from the original project only during the source inspection; the final deliverable intentionally excludes `node_modules` and `venv`. Run `npm install` and the launcher on the target Windows machine to install the correct platform dependencies.


FINAL STARTUP FIX: launcher uses backend/govinnovate_app.py directly, avoiding fragile app.main import resolution on Windows extraction environments.
