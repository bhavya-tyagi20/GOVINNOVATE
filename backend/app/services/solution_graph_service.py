from pathlib import Path
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

BASE = Path(__file__).resolve().parent.parent / "data"

def _load(name):
    path = BASE / name
    return pd.read_csv(path) if path.exists() else pd.DataFrame()

def _text(row):
    return " ".join(str(row.get(c, "")) for c in [
        "title", "sector", "required_technologies", "problem_statement",
        "solution_description", "capabilities", "pilot_location"
    ] if str(row.get(c, "")).strip())

def find_similar_solutions(challenge_id: str, top_n: int = 3):
    challenges = _load("challenges.csv")
    pilots = _load("pilots.csv")
    startups = _load("startups.csv")
    departments = _load("departments.csv")
    validations = _load("validations.csv")
    procurement = _load("procurement_decisions.csv")

    if challenges.empty:
        raise ValueError("Challenges dataset is empty")
    target_rows = challenges[challenges["challenge_id"].astype(str) == str(challenge_id)]
    if target_rows.empty:
        raise ValueError("Challenge not found")
    target = target_rows.iloc[0]

    # Only pilots with evidence of success are considered reusable.
    completed = pilots[pilots.get("status", pd.Series(dtype=str)).astype(str).str.lower().eq("completed")].copy()
    if completed.empty:
        return []

    if not validations.empty and "pilot_id" in validations.columns:
        passed_ids = set(validations.loc[
            validations.get("result", pd.Series(dtype=str)).astype(str).str.upper().isin(["PASSED", "PASS", "SUCCESSFUL"]),
            "pilot_id"
        ].astype(str))
    else:
        passed_ids = set()

    scale_ids = set()
    if not procurement.empty and "pilot_id" in procurement.columns and "decision" in procurement.columns:
        scale_ids = set(procurement.loc[procurement["decision"].astype(str).str.upper().str.contains("SCALE|PROCURE|APPROVE", regex=True), "pilot_id"].astype(str))

    # If explicit success evidence exists, use it. Otherwise completed pilots are demo candidates.
    if passed_ids or scale_ids:
        completed = completed[completed["pilot_id"].astype(str).isin(passed_ids | scale_ids)]

    completed = completed[completed["challenge_id"].astype(str) != str(challenge_id)]
    if completed.empty:
        return []

    challenge_lookup = challenges.set_index("challenge_id").to_dict("index")
    startup_lookup = startups.set_index("startup_id").to_dict("index") if not startups.empty and "startup_id" in startups.columns else {}
    department_lookup = departments.set_index("department_id").to_dict("index") if not departments.empty and "department_id" in departments.columns else {}
    target_text = _text(target)

    rows = []
    texts = []
    for _, pilot in completed.iterrows():
        c = challenge_lookup.get(str(pilot.get("challenge_id")), {})
        s = startup_lookup.get(str(pilot.get("startup_id")), {})
        merged = {**c, **s, **pilot.to_dict()}
        rows.append((pilot, c, s))
        texts.append(_text(merged))

    vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
    matrix = vectorizer.fit_transform([target_text] + texts)
    scores = cosine_similarity(matrix[0:1], matrix[1:]).flatten()

    validation_lookup = {}
    if not validations.empty and "pilot_id" in validations.columns:
        for _, v in validations.iterrows():
            validation_lookup[str(v.get("pilot_id"))] = v.to_dict()

    result = []
    for score, (pilot, c, s) in sorted(zip(scores, rows), key=lambda x: x[0], reverse=True)[:top_n]:
        pid = str(pilot.get("pilot_id", ""))
        dep_id = str(c.get("department_id", ""))
        dep = department_lookup.get(dep_id, {})
        val = validation_lookup.get(pid, {})
        result.append({
            "pilot_id": pid,
            "challenge_id": str(pilot.get("challenge_id", "")),
            "challenge_title": str(c.get("title", "")),
            "department_id": dep_id,
            "department_name": str(dep.get("department_name", dep_id)),
            "startup_name": str(s.get("startup_name", "")),
            "location": str(pilot.get("location", "")),
            "efficacy_score": val.get("verified_performance", ""),
            "similarity_score": round(float(score) * 100, 2),
            "status": str(pilot.get("status", "Completed")),
        })
    return result
