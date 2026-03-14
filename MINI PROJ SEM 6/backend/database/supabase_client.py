import os
from supabase import create_client, Client

# Initialize the Supabase client using environment variables
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if not url or not key:
    raise ValueError("Supabase credentials not found. Ensure SUPABASE_URL and SUPABASE_KEY are set.")

supabase: Client = create_client(url, key)
