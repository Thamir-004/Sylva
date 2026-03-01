# services/db.py
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

_supabase: Client = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_ANON_KEY"]
)


def save_query(user_id, lat, lng, bioclim, anchor_text, results):
    _supabase.table("query_history").insert({
        "user_id":     user_id,
        "lat":         lat,
        "lng":         lng,
        "bio01":       bioclim.get("bio01"),
        "bio05":       bioclim.get("bio05"),
        "bio06":       bioclim.get("bio06"),
        "bio12":       bioclim.get("bio12"),
        "bio15":       bioclim.get("bio15"),
        "bio19":       bioclim.get("bio19"),
        "anchor_text": anchor_text,
        "results":     results
    }).execute()


def get_history(user_id: str, limit: int = 20) -> list[dict]:
    response = (
        _supabase.table("query_history")
        .select("id, lat, lng, anchor_text, results, created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return response.data or []