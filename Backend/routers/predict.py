# routers/predict.py
# Handles POST /predict — the core endpoint of Sylva.

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.raster import extract_bioclim
from services.prompt_builder import build_anchor_text
from services.embedder import encode
from services.vector_search import find_similar_species
from services.db import save_query   # saves to history if user is logged in

router = APIRouter(prefix="/predict", tags=["predict"])


# ---------------------------------------------------------------------------
# Request and Response shapes
# WHY Pydantic models: FastAPI uses these to automatically validate incoming
# JSON. If lat/lng are missing or wrong type, FastAPI returns a clear 422
# error before our code even runs. No manual validation needed.
# ---------------------------------------------------------------------------

class PredictRequest(BaseModel):
    lat:     float = Field(..., description="Latitude",  example=-1.286)
    lng:     float = Field(..., description="Longitude", example=36.817)
    user_id: str   = Field(None, description="Supabase user ID (optional)")


class SpeciesResult(BaseModel):
    species_name: str
    family:       str
    description:  str
    similarity:   float


class PredictResponse(BaseModel):
    anchor_text: str               # the generated climate prompt
    bioclim:     dict              # the raw bioclim values
    results:     list[SpeciesResult]


# ---------------------------------------------------------------------------
# The endpoint
# ---------------------------------------------------------------------------

@router.post("/", response_model=PredictResponse)
async def predict(req: PredictRequest):
    """
    Full pipeline:
    lat/lng → bioclim values → anchor text → embedding → species results
    """

    # Step 1: Extract BioClim values from raster files
    try:
        bioclim = extract_bioclim(req.lat, req.lng)
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except ValueError as e:
        # Location is outside Kenya or over water
        raise HTTPException(status_code=422, detail=str(e))

    # Step 2: Build the natural language anchor prompt
    anchor_text = build_anchor_text(bioclim)

    # Step 3: Embed the anchor text using our fine-tuned model
    embedding = encode(anchor_text)

    # Step 4: Search for the most similar species in Supabase
    raw_results = find_similar_species(embedding)

    if not raw_results:
        raise HTTPException(
            status_code=404,
            detail="No species found above the similarity threshold for this location."
        )

    # Step 5: Format results
    results = [SpeciesResult(**r) for r in raw_results]

    # Step 6: Save to history if user is logged in (non-blocking)
    if req.user_id:
        try:
            save_query(
                user_id=req.user_id,
                lat=req.lat,
                lng=req.lng,
                bioclim=bioclim,
                anchor_text=anchor_text,
                results=[r.model_dump() for r in results]
            )
        except Exception:
            pass  # History save failing should never break a prediction

    return PredictResponse(
        anchor_text=anchor_text,
        bioclim=bioclim,
        results=results
    )