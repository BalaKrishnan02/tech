# AI-Powered Digital Twin Framework for Land Use Change in Disaster-Affected Regions

An end-to-end multi-temporal geospatial and computer vision platform designed to detect, analyze, simulate, and predict land use land cover (LULC) changes, flood inundation extents, and disaster impacts across vulnerable regions.

---

## Key Capabilities

- **2026 Real-Time Flood Intelligence & Inundation Monitoring**: Primary location-based surveillance engine driven by actual 2026 observations from legitimate external agencies.
- **Google Maps & Satellite Hybrid GIS**: Interactive Google Maps with place search throughout India (defaulting to Chennai: T. Nagar, Velachery, Adyar, Tambaram), click-to-select, and custom boundary polygon drawing.
- **Sentinel-1 SAR Flood Detection (Copernicus CDSE)**: All-weather 10m C-SAR microwave flood delineation using calibrated backscatter thresholding (Otsu & Lee filtering) without requiring manual before/after image uploads.
- **Multi-Sensor Rainfall Telemetry**: Real-time AWS rain gauge readings (IMD YMCA Nandanam / Nungambakkam) corroborated with NASA GPM IMERG (0.1° gridded multi-satellite precipitation estimates).
- **Reservoir & River Water Level Monitoring**: Tamil Nadu WRD telemetry for Chembarambakkam, Poondi, Red Hills, and live river gauges on Adyar, Cooum, and Kosasthalaiyar rivers.
- **Evidence-Based Impact & Damage Assessment**: Rigorous 3-way spatial GIS classification distinguishing Model-Estimated Exposure, Officially Confirmed Damage (NDMA/GCC), and Transparent Gaps (Unavailable Information).
- **2026 Disaster Event Registry**: Searchable timeline of documented 2026 flood and cyclone events (Northeast Monsoon 2026, Cyclone Dana, Krishna basin flash floods, Brahmaputra floods) with separate Pre-2026 Historical Benchmark comparisons.
- **Interactive Digital Twin Dashboard**: Real-time spatio-temporal tracking of disaster events, water bodies, urban expansion, and environmental vulnerability.
- **Before / After Satellite Comparison**: Split-slider image comparison with automated homography registration.
- **Land Cover & Vegetation Classification**: Random Forest classification models (v1 and v2) alongside NDVI temporal analysis.
- **Tamil & English Voice Assistant**: Bilingual voice and text chatbot with natural speech synthesis for emergency response guidance.

---

## System Architecture

```
tech/
├── backend/                  # FastAPI Geospatial & ML Backend
│   ├── app/
│   │   ├── api/v1/endpoints/ # REST API route handlers
│   │   ├── core/             # Configuration & security settings
│   │   ├── database/         # SQLAlchemy session & automatic migrations
│   │   ├── models/           # Database entity definitions
│   │   ├── schemas/          # Pydantic validation schemas
│   │   └── services/         # Image processing, GIS, ML & Voice logic
│   ├── tests/                # Automated pytest test suites
│   ├── requirements.txt      # Python dependencies
│   └── run.py                # Server entry point
│
├── frontend/                 # React + TypeScript + Vite SPA
│   ├── src/
│   │   ├── components/       # Geospatial maps, comparison sliders, voice bot
│   │   ├── pages/            # Dashboard, flood, land use, rainfall, user portal
│   │   ├── services/         # API client & backend integration
│   │   └── types/            # TypeScript data contracts
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── data/                     # Data directory (samples, uploads, geography)
├── models/                   # Pre-trained ML models (Random Forest)
├── scripts/                  # Synthetic data generators & utilities
├── .env.example              # Environment configuration template
└── README.md
```

---

## Getting Started

### Prerequisites
- **Python**: 3.10+
- **Node.js**: 18+ & npm

### 1. Environment Setup

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the backend server (runs on port 8000)
python run.py
```
API Documentation will be available at:
- Swagger UI: `http://localhost:8000/api/v1/docs`
- ReDoc: `http://localhost:8000/api/v1/redoc`

### 3. Frontend Setup

```bash
# In a separate terminal, navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Start Vite dev server (runs on port 5173)
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Root Commands

You can also run project scripts from the root directory using `package.json`:

```bash
# Start frontend
npm run dev

# Build frontend
npm run build

# Start backend
npm run backend

# Run backend tests
npm run test:backend
```

---

## Machine Learning & Geospatial Processing

- **Computer Vision**: OpenCV image alignment, morphological filtering, and difference segmentation.
- **Spectral Indices**: NDWI (`(Green - NIR) / (Green + NIR)`) & NDVI (`(NIR - Red) / (NIR + Red)`).
- **Land Cover Classifier**: Scikit-learn Random Forest model trained on multi-band spectral profiles.
- **Voice Synthesis**: gTTS and browser Web Speech API for Tamil voice assistance.

---

## License

MIT License. Designed for Disaster Risk Reduction and Geospatial Digital Twin research.
