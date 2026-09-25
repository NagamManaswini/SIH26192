# Deployment & Operations Guide

## 1. Quick Start with Docker Compose

The simplest way to spin up the complete platform is using `docker-compose`:

```bash
# Clone and navigate into project directory
cd "c:/SIH FINAL PROJECT2"

# Start backend, frontend, and edge simulator
docker compose up --build -d

# Verify all containers are running
docker compose ps
```

- **Frontend PWA Web App**: `http://localhost:5173`
- **FastAPI Backend REST & Docs**: `http://localhost:8000/docs`
- **Edge Simulator Service**: Integrated via background process / container

---

## 2. Manual Local Development Setup

### Prerequisites
- Python 3.10+ (Tested up to Python 3.14)
- Node.js 18+ and npm

### Backend Setup
```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
pip install -r requirements.txt

# 3. Initialize SQLite/PostgreSQL tables & seed baseline sensors
python -m app.db.init_db

# 4. Run FastAPI development server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Setup
```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install packages
npm install

# 3. Start Vite PWA development server
npm run dev
```

---

## 3. Environment Variables Reference (`.env`)

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PROJECT_NAME` | `Flash Flood Early Warning Platform` | Title for OpenAPI docs and logs |
| `DATABASE_URL` | `sqlite:///flash_flood.db` | PostgreSQL connection string or SQLite file path |
| `SECRET_KEY` | `super_secret_dev_key_for_sih2026` | Secret key used for signing JWT bearer tokens |
| `ALGORITHM` | `HS256` | JWT cryptographic algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Token lifetime |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Allowed web origins |
| `VITE_API_BASE_URL` | `http://localhost:8000/api` | Frontend API connection URL |
