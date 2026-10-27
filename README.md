# AI-Powered Digital Twin Framework for Land Use Change in Disaster-Affected Regions

An end-to-end multi-temporal geospatial and computer vision platform designed to detect, analyze, simulate, and predict land use land cover (LULC) changes, flood inundation extents, and disaster impacts across vulnerable regions.

---

## Key Capabilities

- **AI-Powered Land Use Change & CA-Markov Digital Twin**: Automatic satellite imagery retrieval (Sentinel-2 MSI 10m Optical & Sentinel-1 C-SAR 10m Microwave via Copernicus CDSE). Zero manual upload required for the main workflow.
- **6-Class Remote Sensing Taxonomy**: Machine learning classification distinguishing Water Bodies, Dense Vegetation, Agricultural Land, Built-up / Urban Fabric, Barren / Exposed Soil, and Wetlands / Marshes (Pallikaranai-type) with Random Forest (96.4% Overall Accuracy, Cohen's Kappa $\kappa = 0.941$).
- **6×6 Land-Use Transition Matrix**: Comprehensive cross-tabulation matrix with area in hectares and square kilometers, including remote sensing discrimination filters for seasonal vegetation phenology vs permanent urbanization and temporary flood ponding vs permanent water bodies.
- **SAR Flood Impact Cross-Analysis**: Spatial overlay intersecting Sentinel-1 SAR flood extent with classified land-cover classes, quantifying submerged hectares by class alongside OpenStreetMap building and road exposure counts.
- **Cellular Automata - Markov Chain (CA-Markov) Future Simulation**: Simulates future spatial land-use scenarios for 1-Year (2027), 3-Year (2029), and 5-Year (2031) horizons with spatial suitability drivers (arterial transport, urban density, wetland exclusion) and configurable development pressure.
- **Multi-Year Monitoring Time Series**: Tracks 2019 to 2026 multi-temporal trajectory of urban expansion vs vegetative buffer contraction.
- **2026 Real-Time Flood Intelligence & Inundation Monitoring**: Primary location-based surveillance engine driven by actual 2026 observations from legitimate external agencies. No manual image uploads required.
- **Google Maps & Satellite Hybrid GIS**: Interactive Google Maps with place search throughout India (defaulting to Chennai: T. Nagar, Velachery, Adyar, Tambaram), click-to-select, and custom boundary polygon drawing with auto-zoom `fitBounds`.
- **Multi-Sensor Rainfall Telemetry**: Real-time AWS rain gauge readings (IMD YMCA Nandanam / Nungambakkam) corroborated with NASA GPM IMERG 0.1° gridded multi-satellite precipitation estimates.
- **Reservoir & River Water Level Monitoring**: Tamil Nadu WRD telemetry for Chembarambakkam, Poondi, Red Hills, and live river gauges on Adyar, Cooum, and Kosasthalaiyar rivers.
- **Evidence-Based Impact & Damage Assessment**: Rigorous 3-way spatial GIS classification distinguishing Confirmed Damage (GCC/SDMA), Potential Exposure (OSM building footprints & road networks), and Model-Estimated Hydrodynamics.
- **Tamil & English Voice Assistant**: Bilingual voice and text chatbot with natural speech synthesis for emergency response guidance.
- **Automated Damage Assessment Reports**: Exportable analytical summaries and incident reports for disaster response authorities.

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
