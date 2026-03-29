from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from database.supabase_client import supabase
from datetime import date, timedelta

router = APIRouter()

class LogRequest(BaseModel):
    user_id: str
    win_text: str
    log_date: str

@router.post("/api/log")
async def log_win(request: LogRequest):
    try:
        # Validate inputs
        if not request.user_id or not request.user_id.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="user_id is required"
            )
        if not request.win_text or not request.win_text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="win_text cannot be empty"
            )
        if not request.log_date or not request.log_date.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="log_date is required (format: YYYY-MM-DD)"
            )
        
        # Save the win entry
        supabase.table("micrologs").insert({
            "user_id": request.user_id,
            "win_text": request.win_text,
            "log_date": request.log_date,
            "streak_day": 1  # placeholder, we'll calculate below
        }).execute()

        # Fetch all logs for this user sorted by date descending
        response = supabase.table("micrologs").select("log_date").eq(
            "user_id", request.user_id
        ).order("log_date", desc=True).execute()

        logs = response.data
        dates = [entry["log_date"] for entry in logs]

        # Count consecutive days streak
        streak = 1
        check_date = date.fromisoformat(request.log_date) - timedelta(days=1)
        for d in dates[1:]:
            if d == str(check_date):
                streak += 1
                check_date -= timedelta(days=1)
            else:
                break

        # Update the entry we just inserted with the correct streak
        supabase.table("micrologs").update({
            "streak_day": streak
        }).eq("user_id", request.user_id).eq(
            "log_date", request.log_date
        ).execute()

        messages = [
            "Great work today! Keep it going.",
            "Another day, another win. You're building something real.",
            "Consistency is your superpower. See you tomorrow."
        ]
        return {"streak_day": streak, "message": messages[streak % 3]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing win log: {str(e)}"
        )