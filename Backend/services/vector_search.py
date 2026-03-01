
# Queries Supabase for the most similar species to a given embedding.
# services/vector_search.py
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

_supabase: Client = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_ANON_KEY"]
)

TOP_N     = int(os.getenv("TOP_N_RESULTS", 5))
THRESHOLD = float(os.getenv("MATCH_THRESHOLD", 0.3))


def find_similar_species(embedding: list[float]) -> list[dict]:
    response = _supabase.rpc(
        "match_species",
        {
            "query_embedding": embedding,
            "match_count":     TOP_N,
            "match_threshold": THRESHOLD
        }
    ).execute()
    return response.data or []