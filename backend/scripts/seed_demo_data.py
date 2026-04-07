# """
# MindFlow Demo Data Seeder
# Run this once to populate Supabase with realistic demo data for presentation.
# Run from backend folder: py scripts/seed_demo_data.py
# """

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.supabase_client import supabase
from datetime import datetime, timedelta
import random
import uuid

# ─── Demo Users ────────────────────────────────────────────
USERS = [
    {"id": "demo_dharmesh", "first_name": "Dharmesh", "email": "dharmesh@mindflow.demo", "role": "student"},
    {"id": "demo_om", "first_name": "Om", "email": "om@mindflow.demo", "role": "student"},
    {"id": "demo_deon", "first_name": "Deon", "email": "deon@mindflow.demo", "role": "student"},
    {"id": "demo_dev", "first_name": "Dev", "email": "dev@mindflow.demo", "role": "student"},
    {"id": "demo_manager", "first_name": "Manager", "email": "manager@mindflow.demo", "role": "manager"},
]

# ─── Realistic win messages per user ───────────────────────
WINS = {
    "demo_dharmesh": [
        "Completed the RAG pipeline upgrade",
        "Fixed the asyncio conflict on Windows",
        "Built the team dashboard backend",
        "Deployed backend to Render successfully",
        "Solved binary search tree problem",
        "Refactored the burnout scorer",
        "Added 1250 chunks to ChromaDB",
        "Fixed the hydration error in Next.js",
        "Completed the cognitive ML classifier",
        "Built the wellness chatbot",
    ],
    "demo_om": [
        "Finished the dashboard UI components",
        "Fixed the MicroLog heatmap bug",
        "Completed the TrendChart component",
        "Added mobile responsive design",
        "Integrated Recharts successfully",
        "Fixed the Clerk auth hydration issue",
        "Built the CheckinPopup component",
        "Styled the analytics page",
        "Completed the BurnoutCard component",
        "Fixed CSS conflicts in globals",
    ],
    "demo_deon": [
        "Set up Supabase database schema",
        "Configured Clerk authentication",
        "Deployed frontend to Vercel",
        "Set up GitHub CI/CD pipeline",
        "Completed environment variables setup",
        "Fixed CORS configuration",
        "Set up Render deployment",
        "Configured domain and SSL",
        "Completed database migrations",
        "Set up monitoring and logging",
    ],
    "demo_dev": [
        "Solved dynamic programming problem",
        "Completed graph traversal assignment",
        "Built REST API for practice",
        "Finished React hooks tutorial",
        "Solved 5 LeetCode problems",
        "Completed OS assignment",
        "Finished database normalization task",
        "Built portfolio project",
        "Completed Python scripting task",
        "Solved recursion problems",
    ],
}

TOPICS = [
    "DSA practice", "React development", "FastAPI backend",
    "Database design", "System design", "ML concepts",
    "OS concepts", "Computer networks", "Study session",
    "Project work", "Bug fixing", "Feature development",
]

def get_date_str(days_ago):
    return (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")

def get_burnout_score(energy_levels):
    """Calculate burnout based on energy pattern."""
    if not energy_levels:
        return "Low"
    recent = energy_levels[-3:]
    avg = sum(recent) / len(recent)
    if avg >= 2.5:
        return "Low"
    elif avg >= 1.8:
        return "Medium"
    return "High"

def seed_users():
    print("\n👥 Seeding users...")
    for user in USERS:
        try:
            supabase.table("users").upsert({
                "clerk_user_id": user["id"],
                "email": user["email"],
                "role": user["role"],
            }, on_conflict="clerk_user_id").execute()
            print(f"  ✅ {user['first_name']} ({user['role']})")
        except Exception as e:
            print(f"  ❌ {user['first_name']}: {e}")

def seed_team():
    print("\n🏢 Seeding team...")
    try:
        # Create team
        team_resp = supabase.table("teams").insert({
            "manager_id": "demo_manager",
            "team_name": "MindFlow Dev Team",
            "invite_code": "MFDEV1",
        }).execute()
        team_id = team_resp.data[0]["id"]
        print(f"  ✅ Team created: MindFlow Dev Team (code: MFDEV1)")

        # Add all students to team
        students = ["demo_dharmesh", "demo_om", "demo_deon", "demo_dev"]
        for student_id in students:
            supabase.table("team_members").insert({
                "team_id": team_id,
                "student_id": student_id,
            }).execute()
        print(f"  ✅ Added {len(students)} members to team")
    except Exception as e:
        print(f"  ❌ Team seeding failed: {e}")

def seed_session_logs():
    print("\n📊 Seeding session logs...")

    # Different energy patterns per user for interesting data
    energy_patterns = {
        "demo_dharmesh": [3, 3, 2, 3, 3, 2, 3, 3, 3, 2, 3, 3, 2, 3, 3, 3, 2, 3, 3, 3, 2, 3, 3, 3, 2, 3, 3, 3, 3, 2],
        "demo_om":       [3, 2, 3, 2, 1, 2, 3, 2, 3, 3, 2, 3, 2, 2, 3, 2, 3, 2, 3, 2, 3, 3, 2, 3, 2, 3, 2, 3, 3, 2],
        "demo_deon":     [2, 2, 3, 2, 2, 1, 2, 3, 2, 2, 1, 2, 2, 3, 2, 2, 2, 1, 2, 3, 2, 2, 2, 3, 2, 2, 1, 2, 2, 3],
        "demo_dev":      [3, 3, 3, 2, 3, 3, 2, 3, 3, 3, 2, 3, 3, 3, 2, 3, 3, 3, 2, 3, 3, 3, 3, 2, 3, 3, 3, 2, 3, 3],
    }

    students = ["demo_dharmesh", "demo_om", "demo_deon", "demo_dev"]

    for user_id in students:
        pattern = energy_patterns[user_id]
        energy_history = []
        count = 0

        for days_ago in range(29, -1, -1):
            # Skip some days randomly (not everyone checks in every day)
            if user_id == "demo_deon" and days_ago % 4 == 0:
                continue
            if user_id == "demo_dev" and days_ago % 7 == 0:
                continue

            energy = pattern[days_ago % len(pattern)]
            energy_history.append(energy)
            burnout = get_burnout_score(energy_history)

            try:
                supabase.table("session_logs").insert({
                    "user_id": user_id,
                    "session_date": get_date_str(days_ago),
                    "planned_hours": random.choice([2, 3, 4]),
                    "actual_topic": random.choice(TOPICS),
                    "checkin_number": 1,
                    "energy_level": energy,
                    "on_track": energy >= 2,
                    "burnout_score": burnout,
                }).execute()
                count += 1
            except Exception as e:
                pass

        print(f"  ✅ {user_id}: {count} session logs")

def seed_micrologs():
    print("\n🏆 Seeding micrologs...")

    students = ["demo_dharmesh", "demo_om", "demo_deon", "demo_dev"]

    for user_id in students:
        wins = WINS.get(user_id, [])
        count = 0
        streak = 0

        for days_ago in range(14, -1, -1):
            # Skip some days
            if user_id == "demo_deon" and days_ago % 3 == 0:
                continue

            streak += 1
            win_text = wins[days_ago % len(wins)]

            try:
                supabase.table("micrologs").insert({
                    "user_id": user_id,
                    "log_date": get_date_str(days_ago),
                    "win_text": win_text,
                    "streak_day": streak,
                }).execute()
                count += 1
            except Exception as e:
                pass

        print(f"  ✅ {user_id}: {count} micrologs (streak: {streak})")

def seed_cognitive_states():
    print("\n🧠 Seeding cognitive states...")

    cognitive_patterns = {
        "demo_dharmesh": ["flow", "flow", "struggling", "flow", "flow", "flow", "fatigued", "flow", "flow", "struggling"],
        "demo_om":       ["flow", "struggling", "flow", "fatigued", "flow", "struggling", "flow", "flow", "frustrated", "flow"],
        "demo_deon":     ["struggling", "fatigued", "flow", "struggling", "fatigued", "flow", "struggling", "flow", "fatigued", "struggling"],
        "demo_dev":      ["flow", "flow", "flow", "struggling", "flow", "flow", "flow", "fatigued", "flow", "flow"],
    }

    confidence_map = {
        "flow": 72.5,
        "struggling": 61.0,
        "fatigued": 58.5,
        "frustrated": 55.0,
    }

    speed_map = {
        "flow": 185,
        "struggling": 65,
        "fatigued": 40,
        "frustrated": 145,
    }

    students = ["demo_dharmesh", "demo_om", "demo_deon", "demo_dev"]

    for user_id in students:
        pattern = cognitive_patterns[user_id]
        count = 0

        for i, state in enumerate(pattern):
            days_ago = len(pattern) - i
            ts = datetime.now() - timedelta(days=days_ago, hours=random.randint(0, 8))

            try:
                supabase.table("cognitive_states").insert({
                    "user_id": user_id,
                    "session_date": get_date_str(days_ago),
                    "timestamp": ts.isoformat(),
                    "typing_speed": speed_map[state] + random.randint(-20, 20),
                    "pause_frequency": random.uniform(0.5, 5.0),
                    "backspace_ratio": random.uniform(0.05, 0.35),
                    "burst_score": random.uniform(0.3, 0.9),
                    "predicted_state": state,
                    "confidence": confidence_map[state] + random.uniform(-5, 5),
                    "raw_features": {"scores": {state: 0.9}},
                }).execute()
                count += 1
            except Exception as e:
                pass

        print(f"  ✅ {user_id}: {count} cognitive states")

def main():
    print("🚀 MindFlow Demo Data Seeder")
    print("=" * 40)

    seed_users()
    seed_team()
    seed_session_logs()
    seed_micrologs()
    seed_cognitive_states()

    print("\n" + "=" * 40)
    print("✅ Demo data seeding complete!")
    print("\nDemo accounts:")
    print("  Manager  → localhost:3000/team-dashboard?demo=demo_manager")
    print("  Dharmesh → localhost:3000/dashboard (user: demo_dharmesh)")
    print("  Om       → localhost:3000/dashboard (user: demo_om)")
    print("  Deon     → localhost:3000/dashboard (user: demo_deon)")
    print("  Dev      → localhost:3000/dashboard (user: demo_dev)")

if __name__ == "__main__":
    main()