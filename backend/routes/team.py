from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from database.supabase_client import supabase
import random
import string

router = APIRouter()

# --- Helper to generate a random 6-character invite code ---
def generate_invite_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))


# --- Models ---

class CreateTeamRequest(BaseModel):
    manager_id: str
    team_name: str

class JoinTeamRequest(BaseModel):
    student_id: str
    invite_code: str

class AddMemberRequest(BaseModel):
    manager_id: str
    team_id: str
    student_email: str

class SetRoleRequest(BaseModel):
    clerk_user_id: str
    email: str
    role: str  # 'student' or 'manager'


# --- Endpoints ---

@router.post("/api/team/set-role")
async def set_role(request: SetRoleRequest):
    """Called during signup — saves user with their chosen role."""
    try:
        if request.role not in ["student", "manager"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="role must be 'student' or 'manager'"
            )

        # Upsert — insert if new user, update if already exists
        supabase.table("users").upsert({
            "clerk_user_id": request.clerk_user_id,
            "email": request.email,
            "role": request.role
        }, on_conflict="clerk_user_id").execute()

        return {"message": "Role saved", "role": request.role}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error setting role: {str(e)}"
        )


@router.get("/api/team/role/{clerk_user_id}")
async def get_role(clerk_user_id: str):
    """Frontend calls this after login to know where to redirect."""
    try:
        response = supabase.table("users").select("role").eq(
            "clerk_user_id", clerk_user_id
        ).execute()

        if not response.data:
            return {"role": "student"}  # default if not found

        return {"role": response.data[0]["role"]}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching role: {str(e)}"
        )


@router.post("/api/team/create")
async def create_team(request: CreateTeamRequest):
    """Manager creates a team — gets back an invite code."""
    try:
        if not request.manager_id or not request.team_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="manager_id and team_name are required"
            )

        invite_code = generate_invite_code()

        response = supabase.table("teams").insert({
            "manager_id": request.manager_id,
            "team_name": request.team_name,
            "invite_code": invite_code
        }).execute()

        team = response.data[0]
        return {
            "team_id": team["id"],
            "team_name": team["team_name"],
            "invite_code": team["invite_code"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating team: {str(e)}"
        )


@router.post("/api/team/join")
async def join_team(request: JoinTeamRequest):
    """Student joins a team using invite code."""
    try:
        # Find the team by invite code
        team_response = supabase.table("teams").select("*").eq(
            "invite_code", request.invite_code.upper()
        ).execute()

        if not team_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invalid invite code — no team found"
            )

        team = team_response.data[0]

        # Check if student already in this team
        existing = supabase.table("team_members").select("*").eq(
            "team_id", team["id"]
        ).eq("student_id", request.student_id).execute()

        if existing.data:
            return {
                "message": "Already a member of this team",
                "team_name": team["team_name"]
            }

        # Add student to team
        supabase.table("team_members").insert({
            "team_id": team["id"],
            "student_id": request.student_id
        }).execute()

        return {
            "message": "Joined team successfully",
            "team_name": team["team_name"],
            "team_id": team["id"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error joining team: {str(e)}"
        )


@router.post("/api/team/add-member")
async def add_member_by_email(request: AddMemberRequest):
    """Manager adds a student directly by email."""
    try:
        # Find student by email in users table
        user_response = supabase.table("users").select("clerk_user_id").eq(
            "email", request.student_email
        ).execute()

        if not user_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No user found with that email. They must sign up first."
            )

        student_id = user_response.data[0]["clerk_user_id"]

        # Check if already a member
        existing = supabase.table("team_members").select("*").eq(
            "team_id", request.team_id
        ).eq("student_id", student_id).execute()

        if existing.data:
            return {"message": "Student is already in this team"}

        supabase.table("team_members").insert({
            "team_id": request.team_id,
            "student_id": student_id
        }).execute()

        return {"message": f"{request.student_email} added to team successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error adding member: {str(e)}"
        )


@router.get("/api/team/dashboard/{manager_id}")
async def get_team_dashboard(manager_id: str):
    """Returns all data the manager needs to render their dashboard."""
    try:
        # Get manager's teams
        teams_response = supabase.table("teams").select("*").eq(
            "manager_id", manager_id
        ).execute()

        if not teams_response.data:
            return {"teams": []}

        result = []

        for team in teams_response.data:
            # Get all members of this team
            members_response = supabase.table("team_members").select(
                "student_id, joined_at"
            ).eq("team_id", team["id"]).execute()

            members_data = []

            for member in members_response.data:
                sid = member["student_id"]

                # Get user email
                user_resp = supabase.table("users").select("email").eq(
                    "clerk_user_id", sid
                ).execute()
                email = user_resp.data[0]["email"] if user_resp.data else "Unknown"

                # Get latest burnout score
                burnout_resp = supabase.table("session_logs").select(
                    "burnout_score, session_date, energy_level"
                ).eq("user_id", sid).order(
                    "created_at", desc=True
                ).limit(1).execute()

                current_burnout = burnout_resp.data[0]["burnout_score"] if burnout_resp.data else "No data"

                # Get 7-day trend
                trend_resp = supabase.table("session_logs").select(
                    "session_date, burnout_score, energy_level"
                ).eq("user_id", sid).order(
                    "created_at", desc=True
                ).limit(7).execute()

                # Get streak
                streak_resp = supabase.table("micrologs").select(
                    "streak_day"
                ).eq("user_id", sid).order(
                    "created_at", desc=True
                ).limit(1).execute()

                streak = streak_resp.data[0]["streak_day"] if streak_resp.data else 0

                # Get today's win
                from datetime import date
                today = date.today().isoformat()
                win_resp = supabase.table("micrologs").select(
                    "win_text"
                ).eq("user_id", sid).eq("log_date", today).execute()

                win_today = win_resp.data[0]["win_text"] if win_resp.data else None

                # Active today = has a session log today
                active_resp = supabase.table("session_logs").select(
                    "id"
                ).eq("user_id", sid).eq("session_date", today).execute()

                active_today = len(active_resp.data) > 0

                members_data.append({
                    "student_id": sid,
                    "email": email,
                    "current_burnout": current_burnout,
                    "streak": streak,
                    "active_today": active_today,
                    "win_today": win_today,
                    "trend": trend_resp.data
                })

            # Calculate team average burnout
            scores = [m["current_burnout"] for m in members_data if m["current_burnout"] != "No data"]
            score_map = {"Low": 1, "Medium": 2, "High": 3}
            if scores:
                avg = sum(score_map.get(s, 0) for s in scores) / len(scores)
                team_avg = "Low" if avg < 1.5 else "Medium" if avg < 2.5 else "High"
            else:
                team_avg = "No data"

            result.append({
                "team_id": team["id"],
                "team_name": team["team_name"],
                "invite_code": team["invite_code"],
                "team_average_burnout": team_avg,
                "members": members_data
            })

        return {"teams": result}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching team dashboard: {str(e)}"
        )
        
@router.get("/api/team/my-team/{student_id}")
async def get_my_team(student_id: str):
    """Returns the team a student belongs to."""
    try:
        member_resp = supabase.table("team_members").select(
            "team_id"
        ).eq("student_id", student_id).execute()

        if not member_resp.data:
            return {"team": None}

        team_id = member_resp.data[0]["team_id"]

        team_resp = supabase.table("teams").select("*").eq(
            "id", team_id
        ).execute()

        if not team_resp.data:
            return {"team": None}

        team = team_resp.data[0]

        # Get all members
        members_resp = supabase.table("team_members").select(
            "student_id"
        ).eq("team_id", team_id).execute()

        members_data = []
        today = __import__("datetime").date.today().isoformat()

        for m in members_resp.data:
            sid = m["student_id"]
            user_resp = supabase.table("users").select("email").eq(
                "clerk_user_id", sid
            ).execute()
            email = user_resp.data[0]["email"] if user_resp.data else "Unknown"

            active_resp = supabase.table("session_logs").select("id").eq(
                "user_id", sid
            ).eq("session_date", today).execute()

            members_data.append({
                "email": email,
                "active_today": len(active_resp.data) > 0,
            })

        return {
            "team": {
                "team_name": team["team_name"],
                "invite_code": team["invite_code"],
                "member_count": len(members_data),
                "members": members_data,
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching team: {str(e)}"
        )