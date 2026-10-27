from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import FileResponse
from backend.app.services.voice.service import VoiceService
from backend.app.core.config import settings
from pathlib import Path

router = APIRouter()

@router.get("/tts")
def stream_text_to_speech(
    text: str = Query(..., min_length=1, max_length=1000),
    lang: str = Query("ta")
):
    filename = VoiceService.generate_speech(text, lang)
    if not filename:
        raise HTTPException(status_code=500, detail="Voice synthesis failed.")

    filepath = settings.PROCESSED_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Audio file not found.")

    return FileResponse(
        path=str(filepath),
        media_type="audio/mpeg",
        filename=filename
    )
