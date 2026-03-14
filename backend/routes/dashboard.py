from fastapi import APIRouter
from database.supabase_client import supabase

router = APIRouter()

@router.get("/api/dashboard")
async def dashboard(user_id: str):
    # Last 7 session logs for trend chart
    trend_response = supabase.table("session_logs").select("*").eq(
        "user_id", user_id
    ).order("created_at", desc=True).limit(7).execute()

    # Last 90 micrologs for heatmap
    heatmap_response = supabase.table("micrologs").select("*").eq(
        "user_id", user_id
    ).order("log_date", desc=True).limit(90).execute()

    trend_data = trend_response.data
    heatmap_data = heatmap_response.data

    # Get current burnout score from most recent session log
    current_burnout = "Low"
    if trend_data:
        current_burnout = trend_data[0].get("burnout_score", "Low")

    # Get current streak from most recent microlog
    current_streak = 0
    if heatmap_data:
        current_streak = heatmap_data[0].get("streak_day", 0)

    return {
        "trend_data": trend_data,
        "heatmap_data": heatmap_data,
        "current_burnout_score": current_burnout,
        "current_streak": current_streak
    }