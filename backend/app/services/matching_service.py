from app.services.data_service import get_challenges, get_startups

TECHNOLOGY_WEIGHT = 40
CAPABILITY_WEIGHT = 30
SECTOR_WEIGHT = 20
LOCATION_WEIGHT = 10


def clean_text(value):
    if value is None:
        return ""
    return str(value).strip().lower()


def split_values(value):
    if value is None:
        return []
    text = str(value).replace(";", ",")
    return [item.strip().lower() for item in text.split(",") if item.strip()]


def get_value(row, key):
    value = row.get(key, "")
    return "" if value is None else str(value).strip()


def calculate_match(challenge, startup):
    required = split_values(challenge.get("required_technologies", ""))
    capabilities = split_values(startup.get("capabilities", ""))

    technology_matches = []
    for technology in required:
        if any(technology in capability or capability in technology for capability in capabilities):
            technology_matches.append(technology)

    technology_score = len(technology_matches) / len(required) * 100 if required else 0

    challenge_text = clean_text(challenge.get("problem_statement", ""))
    solution_text = clean_text(startup.get("solution_description", ""))
    capability_matches = [c for c in capabilities if c in challenge_text or c in solution_text]
    capability_score = len(capability_matches) / len(capabilities) * 100 if capabilities else 0

    challenge_sector = clean_text(challenge.get("sector", ""))
    startup_sector = clean_text(startup.get("sector", ""))
    sector_score = 100 if challenge_sector and challenge_sector == startup_sector else 0

    location = clean_text(challenge.get("pilot_location", ""))
    city = clean_text(startup.get("city", ""))
    state = clean_text(startup.get("state", ""))
    location_score = 100 if (city and city in location) or (state and state in location) else 0

    final_score = (
        technology_score * TECHNOLOGY_WEIGHT / 100
        + capability_score * CAPABILITY_WEIGHT / 100
        + sector_score * SECTOR_WEIGHT / 100
        + location_score * LOCATION_WEIGHT / 100
    )

    return {
        "technology_score": round(technology_score, 2),
        "capability_score": round(capability_score, 2),
        "sector_score": round(sector_score, 2),
        "location_score": round(location_score, 2),
        "match_score": round(final_score, 2),
        "technology_matches": technology_matches,
        "capability_matches": capability_matches,
    }


def get_matching_startups(challenge_id):
    challenges = get_challenges()
    startups = get_startups()

    rows = challenges[challenges["challenge_id"].astype(str).str.strip() == str(challenge_id).strip()]
    if rows.empty:
        return None

    challenge = rows.iloc[0].fillna("").to_dict()
    results = []

    for _, row in startups.iterrows():
        startup = row.fillna("").to_dict()
        score = calculate_match(challenge, startup)
        results.append({
            "startup_id": get_value(startup, "startup_id"),
            "startup_name": get_value(startup, "startup_name"),
            "state": get_value(startup, "state"),
            "city": get_value(startup, "city"),
            "industry": get_value(startup, "industry"),
            "sector": get_value(startup, "sector"),
            "capabilities": get_value(startup, "capabilities"),
            "solution_description": get_value(startup, "solution_description"),
            "stage": get_value(startup, "stage"),
            "data_status": get_value(startup, "data_status"),
            **score,
        })

    results.sort(key=lambda x: x["match_score"], reverse=True)
    for rank, item in enumerate(results, 1):
        item["rank"] = rank
    return results


def get_startup_match(challenge_id, startup_id):
    matches = get_matching_startups(challenge_id)
    if matches is None:
        return None
    return next((m for m in matches if str(m["startup_id"]) == str(startup_id)), None)


def get_matching_challenges(startup_id):
    challenges = get_challenges()
    startups = get_startups()

    rows = startups[startups["startup_id"].astype(str).str.strip() == str(startup_id).strip()]
    if rows.empty:
        return None

    startup = rows.iloc[0].fillna("").to_dict()
    results = []

    for _, row in challenges.iterrows():
        challenge = row.fillna("").to_dict()
        score = calculate_match(challenge, startup)
        results.append({
            "challenge_id": get_value(challenge, "challenge_id"),
            "title": get_value(challenge, "title"),
            "department_id": get_value(challenge, "department_id"),
            "sector": get_value(challenge, "sector"),
            "required_technologies": get_value(challenge, "required_technologies"),
            "pilot_location": get_value(challenge, "pilot_location"),
            "duration_days": get_value(challenge, "duration_days"),
            "problem_statement": get_value(challenge, "problem_statement"),
            **score,
        })

    results.sort(key=lambda x: x["match_score"], reverse=True)
    for rank, item in enumerate(results, 1):
        item["rank"] = rank
    return results


def get_challenge_match(startup_id, challenge_id):
    matches = get_matching_challenges(startup_id)
    if matches is None:
        return None
    return next((m for m in matches if str(m["challenge_id"]) == str(challenge_id)), None)
