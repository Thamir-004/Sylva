# main.py
# Entry point for the Sylva FastAPI backend.
# Run with: uvicorn main:app --reload

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import predict, history
from services.embedder import load_model


# ---------------------------------------------------------------------------
# Lifespan: runs once when the server starts and once when it stops.
# WHY: We load the ML model here instead of on every request. Loading a model
# takes ~2 seconds. Doing it once at startup means every prediction is fast.
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    load_model()          # load fine-tuned model into memory
    print("✓ Model loaded and ready")
    yield
    print("Server shutting down")


app = FastAPI(
    title="Sylva API",
    description="Kenya tree species prediction from bioclim data",
    version="1.0.0",
    lifespan=lifespan
)


# ---------------------------------------------------------------------------
# CORS — allows the React frontend to call this API.
# WHY: Browsers block cross-origin requests by default. This tells the browser
# it's safe to call our API from the React dev server (localhost:5173).
# In production you'd replace "*" with your actual frontend domain.
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register route groups
app.include_router(predict.router)
app.include_router(history.router)


@app.get("/")
def root():
    return {"status": "Sylva API is running"}

