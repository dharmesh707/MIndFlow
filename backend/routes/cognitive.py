from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from database.supabase_client import supabase
from services.cognitive_ml import classify_cognitive_state, compute_burst_score
from datetime import datetime

router = APIRouter()


class CognitiveStateRequest(BaseModel):
    user_id: str
    typing_speed: float          # chars per minute
    pause_frequency: float       # pauses >2s per minute
    backspace_ratio: float       # 0-1
    burst_score: Optional[float] = None
    raw_event_count: Optional[int] = 0
    session_date: Optional[str] = None


@router.post("/api/cognitive/analyze")
async def analyze_cognitive_state(request: CognitiveStateRequest):
    """
    Receives keystroke features from VS Code extension,
    runs ML classifier, stores result, returns cognitive state.
    """
    try:
        # Get user's personal baseline from recent history
        user_baseline = None
        try:
            history = supabase.table("cognitive_states").select(
                "typing_speed"
            ).eq("user_id", request.user_id).order(
                "timestamp", desc=True
            ).limit(20).execute()

            if history.data and len(history.data) >= 5:
                speeds = [r["typing_speed"] for r in history.data if r["typing_speed"]]
                if speeds:
                    user_baseline = {"avg_typing_speed": sum(speeds) / len(speeds)}
        except:
            pass

        # Run classifier
        result = classify_cognitive_state(
            typing_speed=request.typing_speed,
            pause_frequency=request.pause_frequency,
            backspace_ratio=request.backspace_ratio,
            burst_score=request.burst_score or 0.5,
            user_baseline=user_baseline
        )

        # Store in Supabase
        today = request.session_date or datetime.now().date().isoformat()
        try:
            supabase.table("cognitive_states").insert({
                "user_id": request.user_id,
                "session_date": today,
                "typing_speed": request.typing_speed,
                "pause_frequency": request.pause_frequency,
                "backspace_ratio": request.backspace_ratio,
                "burst_score": request.burst_score,
                "predicted_state": result["state"],
                "confidence": result["confidence"],
                "raw_features": {
                    "raw_event_count": request.raw_event_count,
                    "scores": result["scores"]
                }
            }).execute()
        except Exception as db_err:
            print(f"DB write failed: {db_err}")

        return {
            "state": result["state"],
            "confidence": result["confidence"],
            "message": result["message"],
            "emoji": result["emoji"],
            "scores": result["scores"],
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cognitive analysis failed: {str(e)}"
        )


@router.get("/api/cognitive/history/{user_id}")
async def get_cognitive_history(user_id: str, limit: int = 50):
    """Returns recent cognitive state history for dashboard visualization."""
    try:
        response = supabase.table("cognitive_states").select(
            "predicted_state, confidence, typing_speed, timestamp, session_date"
        ).eq("user_id", user_id).order(
            "timestamp", desc=True
        ).limit(limit).execute()

        return {"history": response.data or []}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch history: {str(e)}"
        )