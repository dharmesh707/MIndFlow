# """
# Links real Clerk accounts to existing demo data.
# Run from backend folder: py scripts/link_real_accounts.py
# """
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database.supabase_client import supabase

# Real Clerk IDs from Supabase users table
REAL_DHARMESH = "user_3CDjC5eKkc3HdSfPr5gUDQdQSF7"
REAL_MANAGER = "user_3CDjSvUoFR8SUe6lB60kkGIfsyx"

def copy_data(from_id, to_id, table, id_column):
    resp = supabase.table(table).select("*").eq(id_column, from_id).execute()
    if not resp.data:
        print(f"  No data in {table} for {from_id}")
        return
    for row in resp.data:
        new_row = {k: v for k, v in row.items() if k != "id"}
        new_row[id_column] = to_id
        try:
            supabase.table(table).insert(new_row).execute()
        except Exception as e:
            pass
    print(f"  ✅ Copied {len(resp.data)} rows in {table}")

def main():
    print("🔗 Linking real accounts to demo data...")
    
    print(f"\n👤 Dharmesh: demo_dharmesh → {REAL_DHARMESH}")
    copy_data("demo_dharmesh", REAL_DHARMESH, "session_logs", "user_id")
    copy_data("demo_dharmesh", REAL_DHARMESH, "micrologs", "user_id")
    copy_data("demo_dharmesh", REAL_DHARMESH, "cognitive_states", "user_id")

    print(f"\n👔 Manager: demo_manager → {REAL_MANAGER}")
    # Update team ownership
    resp = supabase.table("teams").select("*").eq("manager_id", "demo_manager").execute()
    for team in resp.data or []:
        supabase.table("teams").update({"manager_id": REAL_MANAGER}).eq("id", team["id"]).execute()
    print(f"  ✅ Updated {len(resp.data or [])} teams")

    print("\n✅ Done! Sign in with real accounts to see demo data.")

if __name__ == "__main__":
    main()