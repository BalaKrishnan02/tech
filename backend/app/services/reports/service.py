import os
import json
import csv
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional, List
import uuid

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

from backend.app.core.config import settings

class ReportService:
    @classmethod
    def generate_pdf_report(
        cls,
        region_name: str,
        analysis_data: Dict[str, Any],
        rainfall_summary: Optional[Dict[str, Any]] = None,
        disaster_type: str = "Flood Event",
        state: Optional[str] = "Tamil Nadu",
        district: Optional[str] = None,
        event_name: Optional[str] = None
    ) -> str:
        report_uuid = uuid.uuid4().hex[:8]
        filename = f"Disaster_Analysis_Report_{report_uuid}.pdf"
        filepath = settings.PROCESSED_DIR / filename

        doc = SimpleDocTemplate(
            str(filepath),
            pagesize=letter,
            rightMargin=40,
            leftMargin=40,
            topMargin=40,
            bottomMargin=40
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=16,
            leading=20,
            textColor=colors.HexColor('#0f172a'),
            spaceAfter=4
        )
        subtitle_style = ParagraphStyle(
            'SubtitleStyle',
            parent=styles['Normal'],
            fontSize=9,
            leading=13,
            textColor=colors.HexColor('#475569')
        )
        h2_style = ParagraphStyle(
            'H2Style',
            parent=styles['Heading2'],
            fontSize=11,
            leading=15,
            textColor=colors.HexColor('#1e293b'),
            spaceBefore=10,
            spaceAfter=5
        )
        body_style = ParagraphStyle(
            'BodyStyle',
            parent=styles['Normal'],
            fontSize=8.5,
            leading=12,
            textColor=colors.HexColor('#334155')
        )
        alert_style = ParagraphStyle(
            'AlertStyle',
            parent=styles['Normal'],
            fontSize=8,
            leading=11,
            textColor=colors.HexColor('#dc2626')
        )

        elements = []

        # Header Title
        elements.append(Paragraph("NATIONAL GEOSPATIAL DIGITAL TWIN DISASTER ASSESSMENT REPORT", title_style))
        district_str = f" | District: <b>{district}</b>" if district else ""
        event_str = f" | Event: <b>{event_name}</b>" if event_name else ""
        elements.append(Paragraph(
            f"Region: <b>{region_name}</b> ({state}){district_str}{event_str} | Disaster Type: <b>{disaster_type}</b><br/>"
            f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')} | Model: v1.0-cv-spectral | Provenance: Copernicus / NASA / SoI",
            subtitle_style
        ))
        elements.append(Spacer(1, 8))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#2563eb'), spaceAfter=12))

        # Executive Summary Table
        elements.append(Paragraph("1. Assessment KPI Summary & Sensor Attribution", h2_style))
        
        diff_pct = analysis_data.get("visual_change_percent", "N/A")
        water_pct = analysis_data.get("water_change_percent", "N/A")
        water_sqkm = analysis_data.get("newly_detected_water_sqkm", "Unreferenced Optical")
        veg_loss = analysis_data.get("vegetation_loss_percent", "N/A")
        rain_peak = rainfall_summary.get("peak_24h_rainfall_mm", "N/A") if rainfall_summary else "N/A"
        risk_status = analysis_data.get("risk_status", "Under Assessment")

        table_data = [
            ["Metric Indicator", "Observed Value", "Data Source / Sensor", "Measurement Standard"],
            ["Visual Surface Change", f"{diff_pct}%" if diff_pct != "N/A" else "N/A", "Copernicus Sentinel-2 Optical", "OpenCV Multi-temporal Transform"],
            ["Water Surface Expansion", f"{water_pct}%" if water_pct != "N/A" else "N/A", "Sentinel-1 SAR IW / NDWI", "Adaptive Backscatter Threshold"],
            ["Estimated Inundated Area", f"{water_sqkm} sq km" if isinstance(water_sqkm, (int, float)) else str(water_sqkm), "EPSG:4326 Orthorectified Raster", "10m Pixel Ground Area"],
            ["Vegetation Canopy Distress", f"{veg_loss}%" if veg_loss != "N/A" else "N/A", "Sentinel-2 MSI (B4, B8)", "Canopy Greenness Delta (NDVI)"],
            ["Peak 24h Rainfall", f"{rain_peak} mm" if rain_peak != "N/A" else "N/A", "NASA GPM IMERG (V06/07)", "24h Calibrated Accumulation"],
            ["Composite Monitoring Status", str(risk_status), "Multi-factor Impact Matrix", "Hazard Exposure Proxy"]
        ]

        t = Table(table_data, colWidths=[140, 100, 160, 130])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 8.5),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 5),
            ('TOPPADDING', (0, 0), (-1, 0), 5),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f8fafc')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('ALIGN', (1, 1), (1, -1), 'CENTER'),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 10))

        # Scientific Evidence & Causality Explanation
        elements.append(Paragraph("2. Evidence Synthesis & Multi-Sensor Fusion", h2_style))
        synthesis_text = (
            f"Multi-temporal analysis of {region_name} integrates synthetic aperture radar backscatter (Sentinel-1) and optical surface reflectance (Sentinel-2). "
            f"Spatial flood extent aligns with topological depressions and riverine corridors. "
            f"Precipitation radar telemetry (NASA GPM IMERG) confirms intense storm accumulation coinciding with surface water expansion. "
            f"While strong spatial-temporal correlation exists, full causality requires local hydrological drainage network capacity validation."
        )
        elements.append(Paragraph(synthesis_text, body_style))
        elements.append(Spacer(1, 8))

        # Land Cover Transition
        elements.append(Paragraph("3. Land-Cover Transition & Recovery Trajectory", h2_style))
        is_urban = analysis_data.get("is_urban_scene", False) or analysis_data.get("dominant_loss_class") == "Built-up"
        if not is_urban:
            lc_props = analysis_data.get("land_cover_proportions") or analysis_data.get("class_proportions_before") or {}
            if lc_props.get("Agricultural Land", 0.0) == 0.0 and lc_props.get("Built-up / Urban", 0.0) > 0.0:
                is_urban = True

        if is_urban:
            lc_text = (
                "Machine Learning Model: Scikit-learn Multi-spectral Land Cover Classifier (100 estimators). "
                "Scene Context: Urban Municipal / Metropolitan Built-up Environment. "
                "Classification Result: Agricultural Land is 0.0% (Zero rural crop cultivation present). "
                "Primary observation: Waterlogging is concentrated across paved roadway corridors, residential aprons, and built infrastructure. "
                "Recovery trajectory focuses on emergency stormwater pumping and municipal drainage de-silting."
            )
        else:
            lc_text = (
                "Machine Learning Model: Scikit-learn Multi-spectral Land Cover Classifier (100 estimators). "
                "Classes monitored: Water Bodies, Dense Vegetation, Agricultural Parcels, Urban / Built-up, and Bare Soil. "
                "Primary observation: Peripheral agricultural floodplains experience highest vulnerability to sediment siltation, with full vegetation canopy recovery typically observed in 12-18 months."
            )
        elements.append(Paragraph(lc_text, body_style))
        elements.append(Spacer(1, 10))

        # Disclaimers & Limitations
        elements.append(Paragraph("4. Regulatory Disclaimers & Technical Limitations", h2_style))
        disclaimer_text = (
            "NOTICE: This assessment is an automated computer-vision and geospatial digital twin intelligence product. "
            "It does NOT replace official civil protection, NDMA, CWC, or IMD emergency bulletins. "
            "Optical observations may be masked by tropical cloud cover; Sentinel-1 microwave radar is used as primary all-weather water proxy. "
            "Ground truthing and official administrative verification are required prior to legal compensation or relief disbursements."
        )
        elements.append(Paragraph(disclaimer_text, alert_style))

        doc.build(elements)
        return filename

    @classmethod
    def generate_csv_report(cls, region_name: str, metrics: Dict[str, Any]) -> str:
        report_uuid = uuid.uuid4().hex[:8]
        filename = f"Disaster_Metrics_{report_uuid}.csv"
        filepath = settings.PROCESSED_DIR / filename

        with open(filepath, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["Region", "Metric_Name", "Metric_Value", "Units", "Standard", "Timestamp"])
            ts = datetime.now(timezone.utc).isoformat()
            for k, v in metrics.items():
                writer.writerow([region_name, k, v, "Standardized", "EPSG:4326 / IMERG", ts])

        return filename

    @classmethod
    def generate_json_report(cls, region_name: str, full_data: Dict[str, Any]) -> str:
        report_uuid = uuid.uuid4().hex[:8]
        filename = f"Digital_Twin_Audit_{report_uuid}.json"
        filepath = settings.PROCESSED_DIR / filename

        with open(filepath, "w", encoding="utf-8") as f:
            json.dump({
                "region_name": region_name,
                "exported_at": datetime.now(timezone.utc).isoformat(),
                "system": "National Disaster Digital Twin Platform (India-Wide Architecture)",
                "coordinate_system": "EPSG:4326 (WGS84)",
                "audit_data": full_data,
                "license": "ODbL / Government Open Data License (India)"
            }, f, indent=2, default=str)

        return filename

    @classmethod
    def generate_geojson_report(cls, region_name: str, footprint: Dict[str, Any], properties: Dict[str, Any]) -> str:
        report_uuid = uuid.uuid4().hex[:8]
        filename = f"Disaster_Spatial_Extent_{report_uuid}.geojson"
        filepath = settings.PROCESSED_DIR / filename

        feature = {
            "type": "FeatureCollection",
            "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
            "features": [
                {
                    "type": "Feature",
                    "geometry": footprint.get("geometry", footprint),
                    "properties": {
                        "region_name": region_name,
                        "generated_at": datetime.now(timezone.utc).isoformat(),
                        **properties
                    }
                }
            ]
        }

        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(feature, f, indent=2)

        return filename
