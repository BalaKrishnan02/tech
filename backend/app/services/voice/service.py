import os
from pathlib import Path
from typing import Optional
import uuid
from backend.app.core.config import settings

class VoiceService:
    @staticmethod
    def generate_speech(text: str, language: str = "en") -> Optional[str]:
        """
        Synthesizes speech into an MP3 file using gTTS (Google Text-to-Speech)
        with native English ('en') and Tamil ('ta') support.
        Returns the absolute filepath or None if synthesis fails.
        """
        try:
            from gtts import gTTS
        except ImportError:
            return None

        clean_text = text.strip()
        if not clean_text:
            return None

        # Clean markdown symbols for natural pronunciation
        clean_text = clean_text.replace("*", "").replace("#", "").replace("_", "")

        lang_code = "ta" if language.startswith("ta") else "en"
        filename = f"tts_{uuid.uuid4().hex[:10]}.mp3"
        out_path = settings.PROCESSED_DIR / filename

        try:
            tts = gTTS(text=clean_text[:500], lang=lang_code, slow=False)
            tts.save(str(out_path))
            return filename
        except Exception as e:
            print(f"TTS Synthesis error: {e}")
            return None
