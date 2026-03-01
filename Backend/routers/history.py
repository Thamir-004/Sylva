# routers/history.py
# Returns past predictions for a logged-in user.

from fastapi import APIRouter, HTTPException
from services.db import get_history

router = APIRouter(prefix="/history", tags=["history"])


@router.get("/{user_id}")
def user_history(user_id: str, limit: int = 20):
    """
    Returns the last N predictions made by this user.
    The frontend uses this to show past query markers on the map.
    """
    try:
        records = get_history(user_id, limit)
        return {"history": records}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))