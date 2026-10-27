"""
Comprehensive test suite for 2026 real-time chatbot dataset & capabilities.
"""
from backend.app.services.chatbot.service import ChatbotService
from backend.app.database.session import SessionLocal

def test_chatbot_2026_weather_query():
    resp = ChatbotService.answer_query("What is the weather today in Chennai?")
    assert resp["language"] == "en"
    assert "Live Weather Telemetry" in resp["content"]
    assert "27.4" in resp["content"] or "Temperature" in resp["content"]
    assert "Forecast" in resp["content"]

def test_chatbot_2026_october_rainfall_query():
    db = SessionLocal()
    try:
        resp = ChatbotService.answer_query("How much rainfall was recorded in October 2026?", db=db)
        assert resp["language"] == "en"
        assert "October" in resp["content"]
        assert "2026" in resp["content"]
        assert "mm" in resp["content"]
    finally:
        db.close()

def test_chatbot_2026_flooded_locations_query():
    resp = ChatbotService.answer_query("Which areas and locations are flooded right now?")
    assert resp["language"] == "en"
    assert "Velachery" in resp["content"]
    assert "Mudichur" in resp["content"]
    assert "94.6" in resp["content"] or "Inundated" in resp["content"]

def test_chatbot_2026_reservoir_status_query():
    resp = ChatbotService.answer_query("What is the water level in Chembarambakkam reservoir?")
    assert resp["language"] == "en"
    assert "Chembarambakkam" in resp["content"]
    assert "3,500" in resp["content"] or "cusecs" in resp["content"]
    assert "85.6%" in resp["content"] or "22.8" in resp["content"]

def test_chatbot_2026_emergency_helpline_query():
    resp = ChatbotService.answer_query("What are the emergency helpline numbers?")
    assert resp["language"] == "en"
    assert "1070" in resp["content"]
    assert "1913" in resp["content"]

def test_chatbot_2015_vs_2026_comparison_query():
    resp = ChatbotService.answer_query("Compare 2026 floods with 2015 and 2023 Michaung")
    assert resp["language"] == "en"
    assert "2015" in resp["content"]
    assert "2026" in resp["content"]
    assert "380.0" in resp["content"] or "94.6" in resp["content"]

def test_chatbot_2026_tamil_weather_and_flood_queries():
    resp_w = ChatbotService.answer_query("இன்றைய வானிலை எப்படி இருக்கிறது?")
    assert resp_w["language"] == "ta"
    assert "வானிலை" in resp_w["content"]

    resp_f = ChatbotService.answer_query("எந்தெந்த இடங்களில் வெள்ளம் ஏற்பட்டுள்ளது?")
    assert resp_f["language"] == "ta"
    assert "வெள்ள" in resp_f["content"] or "பாதிக்கப்பட்ட" in resp_f["content"]
