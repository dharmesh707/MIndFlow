from fastapi import APIRouter
from pydantic import BaseModel
from database.supabase_client import supabase
from services.burnout_scorer import calculate_burnout_score

router = APIRouter()

class CheckinRequest(BaseModel):
    user_id: str
    session_date: str
    checkin_number: int
    energy_level: int
    on_track: bool
    planned_hours: int
    actual_topic: str

@router.post("/api/checkin")
async def checkin(request: CheckinRequest):
    # Save this check-in to the database
    supabase.table("session_logs").insert({
        "user_id": request.user_id,
        "session_date": request.session_date,
        "checkin_number": request.checkin_number,
        "energy_level": request.energy_level,
        "on_track": request.on_track,
        "planned_hours": request.planned_hours,
        "actual_topic": request.actual_topic
    }).execute()

    # Fetch all check-ins from this session to calculate burnout
    response = supabase.table("session_logs").select("*").eq(
        "user_id", request.user_id
    ).eq(
        "session_date", request.session_date
    ).execute()

    checkins = response.data
    result = calculate_burnout_score(checkins)

    # Update all rows for this session with the new burnout score
    supabase.table("session_logs").update({
        "burnout_score": result["burnout_score"]
    }).eq("user_id", request.user_id).eq(
        "session_date", request.session_date
    ).execute()

    return result