from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from database.supabase_client import supabase
from groq import Groq
from dotenv import load_dotenv
load_dotenv()
import os

router = APIRouter()

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class WellnessChatRequest(BaseModel):
    user_id: str
    message: str
    history: Optional[List[ChatMessage]] = []

@router.post("/api/wellness-chat")
async def wellness_chat(request: WellnessChatRequest):
    try:
        # ── Fetch user context from Supabase ──────────────
        
        # Last 7 burnout scores
        burnout_resp = supabase.table("session_logs").select(
            "burnout_score, energy_level, session_date, on_track"
        ).eq("user_id", request.user_id).order(
            "created_at", desc=True
        ).limit(7).execute()
        burnout_data = burnout_resp.data or []

        # Current streak
        streak_resp = supabase.table("micrologs").select(
            "streak_day, win_text"
        ).eq("user_id", request.user_id).order(
            "created_at", desc=True
        ).limit(5).execute()
        streak_data = streak_resp.data or []
        current_streak = streak_data[0]["streak_day"] if streak_data else 0

        # Recent wins
        recent_wins = [r["win_text"] for r in streak_data if r.get("win_text")]

        # Cognitive states from ML
        cognitive_resp = supabase.table("cognitive_states").select(
            "predicted_state, confidence, typing_speed, timestamp"
        ).eq("user_id", "vscode_user").order(
            "timestamp", desc=True
        ).limit(5).execute()
        cognitive_data = cognitive_resp.data or []

        # ── Build user context string ──────────────────────
        burnout_summary = "No check-in data yet"
        if burnout_data:
            scores = [r["burnout_score"] for r in burnout_data if r.get("burnout_score")]
            energies = [r["energy_level"] for r in burnout_data if r.get("energy_level")]
            on_track_count = sum(1 for r in burnout_data if r.get("on_track"))
            
            burnout_summary = f"""
- Last {len(scores)} burnout scores: {', '.join(scores)}
- Energy levels (1=depleted, 2=okay, 3=flow): {', '.join(str(e) for e in energies)}
- Sessions on track: {on_track_count}/{len(burnout_data)}
- Most recent burnout: {scores[0] if scores else 'Unknown'}"""

        cognitive_summary = "No keystroke data yet"
        if cognitive_data:
            states = [r["predicted_state"] for r in cognitive_data]
            cognitive_summary = f"Recent cognitive states (ML detected): {', '.join(states)}"

        streak_summary = f"Current logging streak: {current_streak} days"
        wins_summary = f"Recent wins: {', '.join(recent_wins[:3])}" if recent_wins else "No wins logged yet"

        # ── System prompt ──────────────────────────────────
        system_prompt = f"""You are MindFlow's personal wellness advisor — an AI that gives 
personalized productivity and mental wellness advice based on the user's actual behavioral data.

You are NOT a generic chatbot. You have access to this specific user's real data:

BURNOUT & ENERGY DATA:
{burnout_summary}

COGNITIVE STATE (from keystroke ML analysis):
{cognitive_summary}

HABIT TRACKING:
{streak_summary}
{wins_summary}

YOUR BEHAVIOR RULES:
1. Always reference the user's actual data in your response — make it feel personal
2. Be direct and actionable — no generic advice like "drink water" without context
3. Connect advice to the research backing MindFlow uses:
   - Ultradian Rhythm Research (90-min focus cycles)
   - Attention Residue Theory (23 min to refocus after interruption)
   - BJ Fogg's Tiny Habits (small consistent actions)
4. Keep responses concise — 3-5 sentences max unless asked for more
5. If user seems to be in distress, prioritize rest over productivity
6. Reference their streak positively if it's > 3 days
7. If cognitive state shows fatigued/frustrated, acknowledge it directly

Tone: Warm but data-driven. Like a coach who has been watching your performance data."""

        # ── Build message history for Groq ─────────────────
        groq_messages = [{"role": "system", "content": system_prompt}]
        
        # Add last 5 messages of history
        for msg in request.history[-5:]:
            groq_messages.append({
                "role": msg.role,
                "content": msg.content
            })
        
        # Add current message
        groq_messages.append({
            "role": "user",
            "content": request.message
        })

        # ── Call Groq ──────────────────────────────────────
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=groq_messages,
            max_tokens=300,
            temperature=0.7,
        )

        answer = response.choices[0].message.content

        return {
            "answer": answer,
            "context_used": {
                "burnout_records": len(burnout_data),
                "cognitive_records": len(cognitive_data),
                "streak": current_streak,
            }
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Wellness chat failed: {str(e)}"
        )