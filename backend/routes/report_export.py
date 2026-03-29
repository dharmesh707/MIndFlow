from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from database.supabase_client import supabase
from services.analytics_engine import generate_personal_metrics
from services.report_generator import generate_csv_personal_report, generate_html_personal_report

router = APIRouter()

@router.get("/api/personal/report/export/csv")
async def export_personal_report_csv(user_id: str):
    """
    Export personal report as CSV file
    """
    try:
        if not user_id or not user_id.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="user_id is required"
            )
        
        # Fetch all session logs and micrologs
        checkins_response = supabase.table("session_logs").select("*").eq(
            "user_id", user_id
        ).execute()
        checkins = checkins_response.data or []
        
        micrologs_response = supabase.table("micrologs").select("*").eq(
            "user_id", user_id
        ).execute()
        micrologs = micrologs_response.data or []
        
        # Get user name from Clerk (optional - fallback to user_id)
        user_name = user_id
        
        # Generate metrics
        recent_burnout = checkins[0].get("burnout_score", "Low") if checkins else "Low"
        metrics = generate_personal_metrics(checkins, micrologs, recent_burnout)
        
        # Generate insights (this would normally come from personal_report.py)
        # For now, return basic structure
        insights = {
            "strengths": ["Active tracking habit", "Consistent energy management"],
            "risks": [],
            "recommendations": ["Continue daily check-ins"]
        }
        
        # Generate CSV
        csv_content = generate_csv_personal_report(
            user_name,
            metrics,
            insights,
            checkins,
            micrologs
        )
        
        # Return as downloadable CSV
        return StreamingResponse(
            iter([csv_content]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=mindflow_report_{user_id}.csv"}
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating CSV report: {str(e)}"
        )


@router.get("/api/personal/report/export/html")
async def export_personal_report_html(user_id: str):
    """
    Export personal report as HTML (printable to PDF)
    """
    try:
        if not user_id or not user_id.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="user_id is required"
            )
        
        # Fetch all session logs and micrologs
        checkins_response = supabase.table("session_logs").select("*").eq(
            "user_id", user_id
        ).execute()
        checkins = checkins_response.data or []
        
        micrologs_response = supabase.table("micrologs").select("*").eq(
            "user_id", user_id
        ).execute()
        micrologs = micrologs_response.data or []
        
        # Get user name
        user_name = user_id
        
        # Generate metrics
        recent_burnout = checkins[0].get("burnout_score", "Low") if checkins else "Low"
        metrics = generate_personal_metrics(checkins, micrologs, recent_burnout)
        
        # Generate insights
        insights = {
            "strengths": ["Active tracking habit", "Consistent energy management"],
            "risks": [],
            "recommendations": ["Continue daily check-ins"]
        }
        
        # Generate HTML
        html_content = generate_html_personal_report(
            user_name,
            metrics,
            insights,
            checkins,
            micrologs
        )
        
        # Return as downloadable HTML
        return StreamingResponse(
            iter([html_content]),
            media_type="text/html",
            headers={"Content-Disposition": f"attachment; filename=mindflow_report_{user_id}.html"}
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating HTML report: {str(e)}"
        )
