from supabase import create_client, Client
from app.core.config import settings

# Initialize Supabase client
def get_supabase_client() -> Client:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

# Global client instance
supabase: Client = get_supabase_client()
