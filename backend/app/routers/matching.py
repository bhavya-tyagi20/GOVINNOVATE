from fastapi import APIRouter, HTTPException
from app.services.matching_service import get_matching_startups, get_startup_match, get_matching_challenges, get_challenge_match

router = APIRouter(prefix="/api/matching", tags=["Matching"])

@router.get("/challenge/{challenge_id}")
def match_startups(challenge_id: str):
    results = get_matching_startups(challenge_id)
    if results is None:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return {"challenge_id": challenge_id, "total_startups": len(results), "matches": results}

@router.get("/challenge/{challenge_id}/startup/{startup_id}")
def match_one_startup(challenge_id: str, startup_id: str):
    result = get_startup_match(challenge_id, startup_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Startup or challenge not found")
    return {"challenge_id": challenge_id, "startup": result}

@router.get("/startup/{startup_id}")
def match_challenges(startup_id: str):
    results = get_matching_challenges(startup_id)
    if results is None:
        raise HTTPException(status_code=404, detail="Startup not found")
    return {"startup_id": startup_id, "total_challenges": len(results), "matches": results}

@router.get("/startup/{startup_id}/challenge/{challenge_id}")
def match_one_challenge(startup_id: str, challenge_id: str):
    result = get_challenge_match(startup_id, challenge_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Startup or challenge not found")
    return {"startup_id": startup_id, "challenge": result}
