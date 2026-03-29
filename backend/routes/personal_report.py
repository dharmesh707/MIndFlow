from fastapi import APIRouter, HTTPException, status
from database.supabase_client import supabase
from services.analytics_engine import generate_personal_metrics
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/api/personal/report")
async def get_personal_report(user_id: str):
    """
    Get comprehensive personal analytics report
    Includes: consistency, focus stability, burnout pressure, energy trend, weekly velocity
    """
    try:
        # Validate input
        if not user_id or not user_id.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="user_id is required"
            )
        
        # Fetch all session logs (check-ins) for this user
        checkins_response = supabase.table("session_logs").select("*").eq(
            "user_id", user_id
        ).execute()
        
        checkins = checkins_response.data or []
        
        # Fetch all micrologs (wins) for this user
        micrologs_response = supabase.table("micrologs").select("*").eq(
            "user_id", user_id
        ).execute()
        
        micrologs = micrologs_response.data or []
        
        # Get most recent burnout score
        recent_burnout = "Low"
        if checkins:
            recent_burnout = checkins[0].get("burnout_score", "Low")
        
        # Generate metrics
        metrics = generate_personal_metrics(
            checkins=checkins,
            micrologs=micrologs,
            recent_burnout_score=recent_burnout
        )
        
        # Generate insights and recommendations
        insights = generate_insights(metrics, checkins, micrologs)
        
        # Compile report
        report = {
            "user_id": user_id,
            "generated_at": datetime.now().isoformat(),
            "period": "last_30_days",
            "metrics": metrics,
            "insights": insights,
            "data_summary": {
                "total_checkins": len(checkins),
                "total_wins": len(micrologs),
                "data_quality": "sufficient" if len(checkins) >= 7 else "limited"
            }
        }
        
        return report
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating personal report: {str(e)}"
        )


def generate_insights(metrics: dict, checkins: list, micrologs: list) -> dict:
    """
    Generate human-readable insights based on metrics
    """
    insights = {
        "summary": "",
        "strengths": [],
        "risks": [],
        "recommendations": []
    }
    
    # Consistency insight
    consistency = metrics.get("consistency_score", 0)
    if consistency >= 80:
        insights["strengths"].append("Excellent logging consistency - you're staying on top of tracking")
    elif consistency >= 50:
        insights["strengths"].append("Good logging habit - keep up the regular check-ins")
    else:
        insights["risks"].append("Low logging consistency - try daily check-ins to build the habit")
        insights["recommendations"].append("Set a reminder for your daily check-in time")
    
    # Burnout pressure insight
    burnout_pressure = metrics.get("burnout_pressure", 0)
    if burnout_pressure >= 70:
        insights["risks"].append("High burnout risk detected - consider taking breaks or scaling back")
        insights["recommendations"].append("Schedule a full rest day this week")
    elif burnout_pressure >= 40:
        insights["risks"].append("Moderate stress levels - monitor your energy closely")
        insights["recommendations"].append("Practice a stress-relief technique daily")
    else:
        insights["strengths"].append("Good energy management - you're handling stress well")
    
    # Energy trend insight
    energy_trend = metrics.get("energy_trend", {})
    direction = energy_trend.get("direction", "unknown")
    if direction == "improving":
        insights["strengths"].append("Your energy is trending upward - keep doing what you're doing")
    elif direction == "declining":
        insights["risks"].append("Energy levels are declining - identify and address stressors")
        insights["recommendations"].append("Take a day off to recharge if possible")
    
    # Weekly velocity insight
    velocity = metrics.get("weekly_velocity", {})
    current = velocity.get("current_week", 0)
    trend = velocity.get("trend_avg", 0)
    if current > trend * 1.2:
        insights["strengths"].append("You're winning more this week than usual - riding momentum!")
    elif current < trend * 0.8 and current > 0:
        insights["recommendations"].append("You're logging fewer wins this week - what's changed?")
    
    # Focus stability insight
    stability = metrics.get("focus_stability", 0)
    if stability >= 70:
        insights["strengths"].append("Stable energy levels - consistent performance ahead")
    elif stability < 40:
        insights["risks"].append("High energy variability - work on consistent pacing")
    
    # Summary
    strength_count = len(insights["strengths"])
    risk_count = len(insights["risks"])
    
    if risk_count == 0 and strength_count >= 3:
        insights["summary"] = "You're doing great! Keep maintaining your habits."
    elif risk_count >= 2:
        insights["summary"] = "You have some areas to focus on. Check recommendations below."
    else:
        insights["summary"] = "You're on track. Keep up with your regular check-ins."
    
    return insights
