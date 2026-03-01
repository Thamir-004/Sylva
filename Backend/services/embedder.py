# services/embedder.py
# Loads your fine-tuned model once and provides an encode function.

import os
from sentence_transformers import SentenceTransformer

# Module-level variable — the model lives here after load_model() is called.
# WHY module-level: Python modules are singletons. Storing the model here
# means every part of the app shares the same loaded model without reloading.
_model: SentenceTransformer | None = None

MODEL_PATH = os.getenv("MODEL_PATH", "models/fine-tuned-kenya-tree-model")


def load_model():
    """Called once at server startup (from main.py lifespan)."""
    global _model
    _model = SentenceTransformer(MODEL_PATH)


def encode(text: str) -> list[float]:
    """
    Encodes a single text string into a 384-dim embedding vector.
    Returns a plain Python list of floats (required by Supabase).

    WHY normalize_embeddings=True: matches what we did in the seed script.
    Both stored vectors and query vectors must be normalized the same way
    or cosine similarity scores will be wrong.
    """
    if _model is None:
        raise RuntimeError("Model not loaded. Call load_model() first.")

    embedding = _model.encode(
        text,
        normalize_embeddings=True,
        convert_to_numpy=True
    )
    return embedding.tolist()