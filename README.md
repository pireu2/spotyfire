# SpotyFire 

**Disaster Response & Resilience Platform**  
48-Hour Hackathon Project

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11-blue.svg)
![Next.js](https://img.shields.io/badge/next.js-16-black.svg)

##  Overview

SpotyFire is a comprehensive disaster response platform that leverages satellite imagery (Sentinel-1 SAR) to detect and assess agricultural damage from floods and fires. The system provides real-time analysis, AI-powered insights, and automated insurance claim report generation.

### Key Features

-  **Satellite Analysis**: Sentinel-1 SAR imagery processing via Google Earth Engine
-  **AI Insights**: Groq-powered analysis (llama-3.3-70b) generating detailed Romanian reports
-  **PDF Reports**: Professional insurance claim documents with before/after overlays
-  **Interactive Maps**: Property management with real-time damage visualization
-  **Alert System**: Proactive notifications for detected incidents
-  **Neon Auth**: Secure authentication via Stack Auth integration

##  Architecture

```
spotyfire/
├── spotyfire-backend/      # FastAPI backend
├── spotyfire-frontend/     # Next.js 16 frontend
└── .github/                # Project documentation
```

### Backend Stack

- **Framework**: FastAPI (async)
- **Database**: Neon PostgreSQL (serverless)
- **Auth**: Neon Auth + Stack Auth
- **Satellite**: Google Earth Engine API
- **AI**: Groq API (llama-3.3-70b-versatile)
- **PDF**: FPDF2 with Romanian character normalization
- **ORM**: SQLAlchemy (async)

### Frontend Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Maps**: React Leaflet (OpenStreetMap)
- **Charts**: Recharts
- **UI**: shadcn/ui (Radix primitives)
- **Auth**: Stack Auth SDK

##  Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL (via Neon)
- Google Earth Engine service account
- Groq API key
- Stack Auth credentials

### Backend Setup

```bash
cd spotyfire-backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials:
# - DATABASE_URL (Neon)
# - GROQ_API_KEY
# - STACK_SECRET_SERVER_KEY
# - GOOGLE_APPLICATION_CREDENTIALS path

# Place Google Earth Engine key
cp /path/to/your/service-account.json .private-key.json

# Run migrations (if needed)
# Apply via Neon MCP or direct SQL

# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd spotyfire-frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with:
# - NEXT_PUBLIC_STACK_PROJECT_ID
# - NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY
# - STACK_SECRET_SERVER_KEY
# - NEXT_PUBLIC_API_URL (backend URL)

# Initialize Stack Auth
npx @stackframe/init-stack . --no-browser

# Start development server
npm run dev
```

## 📊 Core Workflow

### 1. Property Registration

Users register their land parcels via:

- Manual coordinate input
- Cadastral number lookup (ANCPI integration)
- Map drawing interface

### 2. Incident Analysis

When an incident occurs:

```
User inputs incident date
        ↓
System analyzes two periods:
  - Before: 30 days before incident
  - After: 30 days after incident
        ↓
Sentinel-1 SAR data processed via GEE
        ↓
Change detection algorithm runs
        ↓
Damage overlays generated
        ↓
Results stored in database
```

### 3. AI Report Generation

```python
# Backend: app/services/ai_agent.py
async def generate_report_insights(analysis_data, property_data):
    # Groq API generates 400-500 word Romanian analysis
    # Includes: summary, technical analysis, recommendations
    # Output: Markdown formatted text
```

### 4. PDF Report Creation

```python
# Backend: app/services/pdf_generator.py
def generate_satellite_report_pdf(...):
    # Page 1: General information
    # Page 2: Before incident (image + stats)
    # Page 3: After incident (image + damage stats)
    # Page 4: AI insights (parsed markdown)
    # Page 5: Conclusions
```

##  Database Schema

### Key Tables

**properties**

- User land parcels
- Geometry (PostGIS), crop type, area
- Links to analyses and alerts

**satellite_analyses**

- Analysis results per property
- Before/after overlays (base64)
- Damage metrics, costs, NDVI
- Cascade delete on property removal

**alerts**

- Fire/flood/NDVI warnings
- Severity levels, geolocation
- Active/dismissed states

**geometries**

- Polygon/MultiPolygon storage
- Shared across properties

## 🔧 Technical Highlights

### Satellite Processing

```python
# 30-day comparison windows
before_date = incident_date - 30 days
after_date = incident_date + 30 days

# Sentinel-1 VV polarization
# Change detection: ratio.gt(1.3)
# Water detection: low backscatter values
```

### Romanian Character Handling

```python
def normalize_romanian_text(text: str) -> str:
    replacements = {
        'ă': 'a', 'î': 'i', 'ș': 's', 'ț': 't', 'â': 'a'
    }
    # Transliteration for Times font compatibility
```

### Markdown Parsing in PDF

```python
def parse_markdown_to_pdf(pdf: FPDF, text: str):
    # Handles: #, ##, ###, **, bullets
    # Auto page breaks
    # Normalized Romanian characters
```

### Cascade Delete Prevention

```python
# SQLAlchemy models
property_id = Column(UUID, ForeignKey("properties.id", ondelete="CASCADE"))
property = relationship("Property", passive_deletes=True)

# Prevents NULL violations on property deletion
```

##  API Endpoints

### Satellite Analysis

```
POST /api/satellite/analyze
Body: {
  "property_id": "uuid",
  "incident_date": "2023-08-16"
}
Response: {
  "damage_percent": 34.38,
  "damaged_area_ha": 80.23,
  "overlay_before_b64": "...",
  "overlay_after_b64": "...",
  "ai_insights": "..."
}
```

### Report Generation

```
GET /api/analyses/{analysis_id}/report
Response: PDF file download
```

### Property Management

```
GET /api/properties
POST /api/properties
PUT /api/properties/{id}
DELETE /api/properties/{id}
```

##  Frontend Pages

### Dashboard (`/dashboard`)

- Property list
- Recent analyses
- Active alerts
- Quick actions

### Reports (`/dashboard/rapoarte`)

- Incident date input
- Historical analysis list
- PDF download

### Properties (`/dashboard/terenuri`)

- Map-based property management
- Add/edit/delete parcels
- Trigger new analyses

### Alerts (`/dashboard/alerte`)

- Real-time incident notifications
- Dismiss/activate toggles

##  Authentication Flow

```typescript
// Frontend: src/stack/server.tsx
export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  urls: {
    signIn: "/handler/sign-in",
    afterSignIn: "/dashboard",
    afterSignOut: "/",
  },
});

// Protected routes
const user = await stackServerApp.getUser({ or: "redirect" });
```

##  Environment Variables

### Backend (.env)

```bash
DATABASE_URL=postgresql://user:pass@host/db
GROQ_API_KEY=gsk_...
STACK_SECRET_SERVER_KEY=...
GOOGLE_APPLICATION_CREDENTIALS=.private-key.json
```

### Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_STACK_PROJECT_ID=...
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=...
STACK_SECRET_SERVER_KEY=...
```

##  Known Issues & Solutions

### Issue: Romanian characters in PDF

**Solution**: Custom `normalize_romanian_text()` function transliterates to ASCII

### Issue: Satellite images 500 error

**Solution**: Switched to direct overlay display without ArcGIS basemap

### Issue: Property deletion NULL violations

**Solution**: Added CASCADE DELETE constraints + `passive_deletes=True`

### Issue: Markdown not rendering in PDF

**Solution**: Custom `parse_markdown_to_pdf()` parser

##  Future Enhancements

- [ ] Real-time satellite monitoring
- [ ] Multi-language support (English, French)
- [ ] Mobile app (React Native)
- [ ] WebSocket notifications
- [ ] Historical trend analysis
- [ ] Integration with insurance APIs
- [ ] Drone imagery support
- [ ] Machine learning damage classification

##  License

MIT License - See LICENSE file for details

##  Team

Built during the 48h Polihack Hackathon

##  Acknowledgments

- Google Earth Engine for satellite data access
- Neon for serverless PostgreSQL
- Groq for fast AI inference
- Stack Auth for authentication
- Copernicus Programme (Sentinel-1)

##  Contact

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ for farmers and disaster resilience**
