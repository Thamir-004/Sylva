# =============================================================
# SYLVA - Seed Script: seed_embeddings.py
# =============================================================
# PURPOSE: One-time script that reads your training_pairs.jsonl,
# embeds every "positive" (species description) using your
# fine-tuned model, and inserts them into Supabase.
#
#
# HOW TO RUN (from your backend/ folder):
#   pip install sentence-transformers supabase python-dotenv tqdm
#   python scripts/seed_embeddings.py
# =============================================================

import json
import os
import re
import sys
from pathlib import Path

from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from supabase import create_client, Client
from tqdm import tqdm

# -------------------------------------------------------------
# CONFIG
# -------------------------------------------------------------
# WHY load_dotenv: keeps your secrets (Supabase URL, service key)
# out of source code. Never hardcode credentials in scripts.
load_dotenv()

SUPABASE_URL      = os.environ["SUPABASE_URL"]
# WHY service_role key here (not anon key):
# The anon key is blocked from inserting into species_embeddings
# by our RLS policy. The service_role key bypasses RLS and is
# safe to use in a backend/script context — NEVER expose it in
# your React frontend.
SUPABASE_KEY      = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

# Path to your training data — adjust if your folder structure differs
TRAINING_FILE     = Path("data/training_pairs (1).jsonl")

# Path to your fine-tuned model folder
MODEL_PATH        = Path("models/fine-tuned-kenya-tree-model")

# How many rows to insert per Supabase request.
# WHY 100: Supabase has a ~1MB request body limit. Each row is
# ~1.5KB (384 floats + text), so 100 rows ≈ 150KB — safely under
# the limit. Going higher risks failed inserts with no clear error.
BATCH_SIZE        = 100

# How many descriptions to encode at once with the model.
# WHY 64: all-MiniLM-L6-v2 is small (22M params). Batches of 64
# fit comfortably in CPU RAM. On a machine with a GPU this could
# go higher, but 64 keeps it safe and still processes 16k rows
# in under 2 minutes on CPU.
ENCODE_BATCH_SIZE = 64
# -------------------------------------------------------------
# HELPERS
# -------------------------------------------------------------
def extract_species_info(positive_text: str) -> dict:
    """
    Parse the positive text from your training pairs to extract
    structured fields: species_name and family.

    WHY parse instead of storing raw text only:
    Storing species_name and family as separate columns lets the
    frontend display them cleanly (species name as a heading,
    family as a subtitle) without string parsing in JavaScript.

    Expected format :
    "Carissa edulis (Forssk.) Vahl – Apocynaceae family tree,
     observed in Kenya"

    We use regex with fallbacks so malformed rows don't crash
    the whole script.
    """
    species_name = "Unknown"
    family       = "Unknown"

    # Try to extract species name: text before the first "–" or "("
    name_match = re.match(r"^([A-Z][a-z]+ [a-z]+)", positive_text)
    if name_match:
        species_name = name_match.group(1).strip()

    # Try to extract family: word before "family"
    family_match = re.search(r"(\w+)\s+family", positive_text, re.IGNORECASE)
    if family_match:
        family = family_match.group(1).strip()

    return {
        "species_name": species_name,
        "family":       family,
        "description":  positive_text.strip()
    }


def load_training_pairs(filepath: Path) -> list[dict]:
    """
    Load and deduplicate training pairs.

    WHY deduplicate: your 16,000 training pairs may contain the
    same species description used in multiple anchor-positive pairs
    (one species can appear across many climate profiles). Storing
    duplicate embeddings wastes space and inflates search results
    with identical entries. We deduplicate by description text.
    """
    pairs    = []
    seen     = set()
    skipped  = 0

    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError as e:
                print(f"  ⚠ Skipping malformed line: {e}")
                skipped += 1
                continue

            positive = obj.get("positive", "").strip()
            if not positive:
                skipped += 1
                continue

            # Deduplicate by the description text itself
            if positive in seen:
                skipped += 1
                continue

            seen.add(positive)
            pairs.append(extract_species_info(positive))

    print(f"  Loaded {len(pairs)} unique species descriptions")
    if skipped:
        print(f"  Skipped {skipped} duplicate or malformed rows")

    return pairs
# -------------------------------------------------------------
# MAIN
# -------------------------------------------------------------

def main():
    print("\n🌿 SYLVA — Species Embedding Seed Script")
    print("=" * 50)

    # --- 1. Validate files exist before doing any work ----------
    if not TRAINING_FILE.exists():
        print(f" Training file not found: {TRAINING_FILE}")
        print("  Make sure you're running this from the backend/ folder")
        sys.exit(1)

    if not MODEL_PATH.exists():
        print(f" Model folder not found: {MODEL_PATH}")
        print("  Download your fine-tuned model from Colab and place it here")
        sys.exit(1)

    # --- 2. Connect to Supabase ---------------------------------
    print("\n[1/4] Connecting to Supabase...")
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        # Quick connectivity check
        supabase.table("species_embeddings").select("id").limit(1).execute()
        print("  Connected")
    except Exception as e:
        print(f"   Connection failed: {e}")
        print("  Check your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env")
        sys.exit(1)

    # --- 3. Check if already seeded -----------------------------
    # WHY: if you re-run this script accidentally, we warn you
    # rather than creating duplicate embeddings silently.
    count_res = supabase.table("species_embeddings").select("id", count="exact").execute()
    existing  = count_res.count or 0

    if existing > 0:
        print(f"\n  ⚠ species_embeddings already has {existing} rows.")
        answer = input("  Do you want to clear and re-seed? (yes/no): ").strip().lower()
        if answer == "yes":
            supabase.table("species_embeddings").delete().neq("id", 0).execute()
            print("  ✓ Table cleared")
        else:
            print("  Aborting. Nothing was changed.")
            sys.exit(0)

    # --- 4. Load training data ----------------------------------
    print(f"\n[2/4] Loading training pairs from {TRAINING_FILE}...")
    species_list = load_training_pairs(TRAINING_FILE)

    if not species_list:
        print("  ✗ No species descriptions found. Check your training file.")
        sys.exit(1)

    # --- 5. Load model ------------------------------------------
    print(f"\n[3/4] Loading fine-tuned model from {MODEL_PATH}...")
    # WHY load from local path: this ensures we use YOUR fine-tuned
    # weights, not the base all-MiniLM-L6-v2 from HuggingFace Hub.
    # The embeddings must be from the same model used at query time
    # in the FastAPI backend — mixing models would make search useless.
    model = SentenceTransformer(str(MODEL_PATH))
    print(f"  ✓ Model loaded (embedding dim: {model.get_sentence_embedding_dimension()})")

    # Safety check: confirm dimension matches our DB schema
    dim = model.get_sentence_embedding_dimension()
    if dim != 384:
        print(f"  ✗ Expected 384-dim embeddings but model outputs {dim}.")
        print("    Update VECTOR(384) in your schema to match.")
        sys.exit(1)

    # --- 6. Embed and insert ------------------------------------
    print(f"\n[4/4] Embedding {len(species_list)} descriptions and inserting into Supabase...")
    print(f"  Encoding batch size : {ENCODE_BATCH_SIZE}")
    print(f"  Insert batch size   : {BATCH_SIZE}")
    print()

    descriptions = [s["description"] for s in species_list]

    # WHY encode all at once then batch insert (rather than one-by-one):
    # sentence-transformers is much faster when encoding in batches —
    # it pads sequences to the same length and processes them in parallel.
    # Inserting to Supabase in batches reduces HTTP round-trips from
    # 16,000 (one per row) to ~160 (one per 100 rows).
    embeddings = model.encode(
        descriptions,
        batch_size=ENCODE_BATCH_SIZE,
        show_progress_bar=True,
        convert_to_numpy=True,
        normalize_embeddings=True  
        # WHY normalize: cosine similarity on normalized vectors is
        # equivalent to dot product, which is what pgvector's <=>
        # operator optimizes for. Normalizing at insert time and at
        # query time ensures consistent, correct similarity scores.
    )

    # Insert in batches with progress tracking
    total_inserted = 0
    errors         = []

    for batch_start in tqdm(
        range(0, len(species_list), BATCH_SIZE),
        desc="Inserting batches",
        unit="batch"
    ):
        batch_species    = species_list[batch_start : batch_start + BATCH_SIZE]
        batch_embeddings = embeddings[batch_start : batch_start + BATCH_SIZE]

        rows = []
        for species, embedding in zip(batch_species, batch_embeddings):
            rows.append({
                "species_name": species["species_name"],
                "family":       species["family"],
                "description":  species["description"],
                # WHY tolist(): Supabase expects a plain Python list
                # of floats for the vector column, not a numpy array.
                "embedding":    embedding.tolist()
            })

        try:
            supabase.table("species_embeddings").insert(rows).execute()
            total_inserted += len(rows)
        except Exception as e:
            errors.append({"batch_start": batch_start, "error": str(e)})
            print(f"\n  ✗ Batch at row {batch_start} failed: {e}")

    # --- 7. Summary ---------------------------------------------
    print("\n" + "=" * 50)
    print(f"✓ Inserted : {total_inserted} / {len(species_list)} species")

    if errors:
        print(f"✗ Failed   : {len(errors)} batches")
        print("  Failed batches:")
        for err in errors:
            print(f"    Row {err['batch_start']}: {err['error']}")
        print("\n  Tip: re-run the script and choose 'no' when asked to clear.")
        print("  Already-inserted rows are safe. Only failed batches need retry.")
    else:
        print("✓ All batches succeeded — species_embeddings is ready!")
        print("\n  Next step: run the FastAPI backend and test /predict")


if __name__ == "__main__":
    main()