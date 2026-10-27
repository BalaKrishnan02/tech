import uuid
from datetime import datetime
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session

from backend.app.models.entities import DigitalTwinState, Region, Alert

class DigitalTwinService:
    @staticmethod
    def calculate_risk_index(
        water_change_percent: float,
        rainfall_peak_mm: float,
        vegetation_loss_percent: float,
        built_up_inundation_percent: float = 0.0
    ) -> Dict[str, Any]:
        """
        Evidence-Based Composite Vulnerability Index (0 to 100)
        Formula:
          Norm_Water = min(1.0, water_change_percent / 25.0)
          Norm_Rain = min(1.0, rainfall_peak_mm / 250.0)
          Norm_Veg = min(1.0, vegetation_loss_percent / 40.0)
          Norm_Urban = min(1.0, built_up_inundation_percent / 15.0)
          Risk = (0.35 * Norm_Water + 0.30 * Norm_Rain + 0.20 * Norm_Veg + 0.15 * Norm_Urban) * 100
        """
        norm_water = min(1.0, max(0.0, water_change_percent / 25.0))
        norm_rain = min(1.0, max(0.0, rainfall_peak_mm / 250.0))
        norm_veg = min(1.0, max(0.0, vegetation_loss_percent / 40.0))
        norm_urban = min(1.0, max(0.0, built_up_inundation_percent / 15.0))

        raw_score = (0.35 * norm_water + 0.30 * norm_rain + 0.20 * norm_veg + 0.15 * norm_urban) * 100.0
        score = float(round(raw_score, 1))

        if score < 25.0:
            status = "Low Risk"
            status_ta = "குறைந்த இடர் (Low Risk)"
        elif score < 55.0:
            status = "Moderate Risk"
            status_ta = "மிதமான இடர் (Moderate Risk)"
        elif score < 75.0:
            status = "High Risk"
            status_ta = "அதிக இடர் (High Risk)"
        else:
            status = "Critical Risk"
            status_ta = "மிக தீவிர இடர் (Critical Risk)"

        formula_text = (
            "Composite Risk Formula: 0.35 * Normalized Water Surge + 0.30 * 24h Peak Rainfall Intensity "
            "+ 0.20 * Vegetation Canopy Distress + 0.15 * Urban Inundation Exposure. "
            "Notice: This score is a computer-vision and hydro-meteorological monitoring aid, not an official statutory civil defense evacuation order."
        )

        return {
            "score": score,
            "status": status,
            "status_tamil": status_ta,
            "formula_details": formula_text,
            "component_breakdown": {
                "water_surge_component": round(0.35 * norm_water * 100, 1),
                "rainfall_intensity_component": round(0.30 * norm_rain * 100, 1),
                "vegetation_distress_component": round(0.20 * norm_veg * 100, 1),
                "urban_exposure_component": round(0.15 * norm_urban * 100, 1)
            }
        }

    @classmethod
    def generate_evidence_summaries(
        cls,
        region_name: str,
        water_change_pct: float,
        water_area_sqkm: Optional[float],
        peak_rain_mm: float,
        veg_loss_pct: float,
        risk_status: str,
        is_urban: bool = False,
        dominant_loss_class: str = "Agricultural Land"
    ) -> Dict[str, str]:
        area_phrase = f"an estimated newly inundated surface area of {water_area_sqkm:.2f} sq km" if water_area_sqkm else f"a {water_change_pct:.1f}% expansion in detected water pixels"
        area_phrase_ta = f"சுமார் {water_area_sqkm:.2f} சதுர கி.மீ பரப்பளவில் புதிய நீர் தேக்கம்" if water_area_sqkm else f"நீர் பரப்பில் {water_change_pct:.1f}% அதிகரிப்பு"

        if is_urban or dominant_loss_class == "Built-up":
            # Urban Municipal Environment - Truthful 0% Agricultural Grounding
            en_summary = (
                f"In {region_name}, comparative satellite/aerial analysis indicates {area_phrase} across an urban municipal environment. "
                f"Machine-learning classification detects 0.0% agricultural land in this dense built-up sector. "
                f"Concurrently, meteorological observations recorded {peak_rain_mm:.1f} mm peak 24-hour precipitation during this event window. "
                f"Urban tree canopy distress is measured at {veg_loss_pct:.1f}%, while inundation is concentrated across paved street corridors and ground-level built infrastructure. "
                f"The combined spatial and climatic observations indicate urban street waterlogging ({risk_status}). "
                f"Establishing full statutory causation requires local municipal stormwater drainage telemetry."
            )
            ta_summary = (
                f"{region_name} நகர்ப்புறப் பகுதியில் எடுக்கப்பட்ட முன்-பின் செயற்கைக்கோள் படங்களின் ஒப்பீட்டில், {area_phrase_ta} கண்டறியப்பட்டுள்ளது. "
                f"இப்பகுதி அடர்ந்த நகர்ப்புற மற்றும் குடியிருப்பு உள்கட்டமைப்பைக் கொண்டதால், இதில் விவசாய நிலப் பாதிப்பு ஏதுமில்லை (விவசாய நிலம்: 0.0%). "
                f"அதே காலகட்டத்தில் அதிகபட்சமாக 24 மணி நேரத்தில் {peak_rain_mm:.1f} மி.மீ மழை பதிவாகியுள்ளது. "
                f"சாலை ஓர மரங்கள் மற்றும் நகர்ப்புற பசுமைப் பரப்பில் {veg_loss_pct:.1f}% பாதிப்பு ஏற்பட்டுள்ளது. "
                f"வெள்ள நீர் நகர்ப்புற சாலைகள் மற்றும் உள்கட்டமைப்புகளில் தேங்கியுள்ளதன் அடிப்படையில் இப்பகுதி '{risk_status}' நிலையில் கண்காணிக்கப்படுகிறது."
            )
        else:
            # Rural / Agricultural Floodplain Environment
            en_summary = (
                f"In {region_name}, comparative satellite/aerial analysis indicates {area_phrase}. "
                f"Concurrently, meteorological observations recorded {peak_rain_mm:.1f} mm peak 24-hour precipitation during this event window. "
                f"Vegetation and crop canopy distress is measured at {veg_loss_pct:.1f}%. "
                f"The combined spatial and climatic observations are consistent with potential flood-related land use change ({risk_status}). "
                f"Establishing full statutory causation requires local hydrological stage-discharge and drainage telemetry."
            )
            ta_summary = (
                f"{region_name} பகுதியில் எடுக்கப்பட்ட முன்-பின் செயற்கைக்கோள் படங்களின் ஒப்பீட்டில், {area_phrase_ta} கண்டறியப்பட்டுள்ளது. "
                f"அதே காலகட்டத்தில் அதிகபட்சமாக 24 மணி நேரத்தில் {peak_rain_mm:.1f} மி.மீ மழை பதிவாகியுள்ளது. "
                f"பயிர் மற்றும் தாவரப் பரப்பில் {veg_loss_pct:.1f}% பாதிப்பு ஏற்பட்டுள்ளது. "
                f"இந்த அனைத்து ஆதாரங்களின் அடிப்படையில் இப்பகுதி '{risk_status}' நிலையில் கண்காணிக்கப்படுகிறது. "
                f"இது வெள்ளப் பாதிப்பினால் ஏற்பட்ட மாற்றங்களுடன் ஒத்துப் போகிறது."
            )

        return {
            "summary_en": en_summary,
            "summary_ta": ta_summary
        }
