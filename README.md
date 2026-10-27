# AI-Powered Digital Twin Framework for Land Use Change in Disaster-Affected Regions

An end-to-end multi-temporal geospatial and computer vision platform designed to detect, analyze, simulate, and predict land use land cover (LULC) changes, flood inundation extents, and disaster impacts across vulnerable regions.

---

## Key Capabilities

- **Interactive Digital Twin Dashboard**: Real-time spatio-temporal tracking of disaster events, water bodies, urban expansion, and environmental vulnerability.
- **Before / After Satellite Comparison**: Split-slider image comparison with automated homography registration and difference highlighting.
- **Automated Flood & Water Detection**: Normalized Difference Water Index (NDWI) calculation, adaptive thresholding, and submerged infrastructure estimation.
- **Land Cover & Vegetation Classification**: Random Forest classification models (v1 and v2) alongside Normalized Difference Vegetation Index (NDVI) temporal analysis.
- **Climate & Rainfall Tracking**: Precipitation anomalies, historical trends, and correlation with disaster inundation events.
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
