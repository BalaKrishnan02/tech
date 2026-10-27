from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional, Dict, Any
import uuid

from backend.app.database.session import get_db
from backend.app.models.entities import (
    ChatbotSession, ChatbotMessage, Region, AnalysisRun,
    RainfallObservation, Alert, DigitalTwinState
)
from backend.app.schemas.schemas import ChatMessageRequest, ChatMessageResponse
from backend.app.services.chatbot.service import ChatbotService
from backend.app.services.voice.service import VoiceService
from backend.app.services.rainfall.service import RainfallService
from backend.app.core.security import get_optional_user_payload

router = APIRouter()

@router.post("/message", response_model=ChatMessageResponse)
def handle_chat_message(
    payload: ChatMessageRequest,
    current_payload: Optional[Dict[str, Any]] = Depends(get_optional_user_payload),
    db: Session = Depends(get_db)
):
    user_id = current_payload.get("sub") if current_payload else None

    # 1. Resolve or create session
    session_id = payload.session_id or str(uuid.uuid4())
    session = db.query(ChatbotSession).filter(ChatbotSession.id == session_id).first()
    if not session:
        session = ChatbotSession(id=session_id, user_id=user_id, region_id=payload.region_id)
        db.add(session)
        db.commit()
    elif user_id and not session.user_id:
        session.user_id = user_id
        db.commit()

    # Save user message
    user_msg = ChatbotMessage(
        session_id=session.id,
        role="user",
        content=payload.message,
        language=ChatbotService.detect_language(payload.message)
    )
    db.add(user_msg)
    db.commit()

    # 2. Gather DB Ground-Truth Context
    region_info = None
    analysis_data = None
    rainfall_summary = None

    reg_id = payload.region_id or session.region_id
    if reg_id:
        reg = db.query(Region).filter((Region.id == reg_id) | (Region.slug == reg_id)).first()
        if reg:
            region_info = {
                "id": reg.id,
                "name": reg.name,
                "state": reg.state,
                "lat": reg.latitude,
                "lon": reg.longitude
            }

            # Latest Analysis
            latest_run = db.query(AnalysisRun).filter(
                AnalysisRun.region_id == reg.id,
                AnalysisRun.status == "completed"
            ).order_by(AnalysisRun.created_at.desc()).first()

            if latest_run:
                analysis_data = {
                    "status": "completed",
                    "visual_change_percent": latest_run.change_result.visual_change_percent if latest_run.change_result else 0.0,
                    "water_change_percent": latest_run.flood_result.water_change_percent if latest_run.flood_result else 0.0,
                    "newly_detected_water_sqkm": latest_run.flood_result.newly_detected_water_sqkm if latest_run.flood_result else None,
                    "vegetation_loss_percent": latest_run.vegetation_result.vegetation_loss_percent if latest_run.vegetation_result else 0.0,
                    "risk_status": "High Risk"
                }

            # Rainfall Records
            rain_records = db.query(RainfallObservation).filter(
                RainfallObservation.region_id == reg.id
            ).all()
            if rain_records:
                rainfall_summary = RainfallService.get_accumulation_summary([
                    {"rainfall_mm": r.rainfall_mm} for r in rain_records
                ])

            # Active alerts
            reg_alerts = db.query(Alert).filter(Alert.region_id == reg.id).all()

    # 3. Generate Evidence-Grounded Answer with User & Historical Context
    # Default preferred_language to "en" so Tamil mic/text speech is translated to English!
    pref_lang = payload.language if payload.language in ["en", "ta"] else "en"

    response_dict = ChatbotService.answer_query(
        user_text=payload.message,
        region_info=region_info,
        analysis_data=analysis_data,
        rainfall_summary=rainfall_summary,
        alerts=reg_alerts if 'reg_alerts' in locals() else None,
        user_id=user_id,
        db=db,
        preferred_language=pref_lang
    )

    # 4. High-Performance Instant Delivery:
    # Bypass synchronous remote gTTS network call to guarantee sub-50ms instant replies.
    # Voice speech playback is handled with zero latency on client via Web Speech API or on-demand streaming.
    audio_url = None

    # Save Assistant Message
    assistant_msg = ChatbotMessage(
        session_id=session.id,
        role="assistant",
        content=response_dict["content"],
        language=response_dict["language"],
        audio_path=audio_url,
        evidence_sources=response_dict["evidence_sources"]
    )
    db.add(assistant_msg)
    db.commit()

    return ChatMessageResponse(
        session_id=session.id,
        role="assistant",
        content=response_dict["content"],
        language=response_dict["language"],
        audio_url=audio_url,
        evidence_sources=response_dict["evidence_sources"],
        is_evidence_complete=response_dict["is_evidence_complete"],
        missing_data_explanation=response_dict["missing_data_explanation"],
        created_at=assistant_msg.created_at
    )

@router.get("/history/{session_id}")
def get_session_history(
    session_id: str,
    current_payload: Optional[Dict[str, Any]] = Depends(get_optional_user_payload),
    db: Session = Depends(get_db)
):
    session = db.query(ChatbotSession).filter(ChatbotSession.id == session_id).first()
    if session and session.user_id and current_payload:
        user_id = current_payload.get("sub")
        if session.user_id != user_id and current_payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Forbidden: You cannot access another user's chat history.")

    msgs = db.query(ChatbotMessage).filter(ChatbotMessage.session_id == session_id).order_by(ChatbotMessage.created_at.asc()).all()
    return [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "language": m.language,
            "audio_url": m.audio_path,
            "evidence_sources": m.evidence_sources or [],
            "created_at": m.created_at
        }
        for m in msgs
    ]

@router.delete("/clear/{session_id}")
def clear_session_history(
    session_id: str,
    current_payload: Optional[Dict[str, Any]] = Depends(get_optional_user_payload),
    db: Session = Depends(get_db)
):
    session = db.query(ChatbotSession).filter(ChatbotSession.id == session_id).first()
    if session and session.user_id and current_payload:
        user_id = current_payload.get("sub")
        if session.user_id != user_id and current_payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Forbidden: You cannot delete another user's chat session.")

    db.query(ChatbotMessage).filter(ChatbotMessage.session_id == session_id).delete()
    db.commit()
    return {"status": "cleared", "session_id": session_id}
