# REST & WebSocket API Reference

The SIH26192 Flash Flood Early Warning API is built using **FastAPI** with automatic OpenAPI/Swagger documentation available at `/docs` or `/redoc`.

**Base URL**: `http://localhost:8000/api`

---

## 1. Authentication & Role-Based Access Control (RBAC)

| Method | Endpoint | Description | Access Tier |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Register new user account | Public |
| `POST` | `/auth/login` | Authenticate and obtain JWT bearer token | Public |
| `GET` | `/auth/me` | Fetch authenticated user profile & permissions | Authenticated |
| `GET` | `/rbac/permissions` | Inspect role permission matrix | Authenticated |

---

## 2. Sensors & Telemetry Ingestion

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/sensors` | List all sensors with status and latest reading |
| `GET` | `/sensors/{id}` | Retrieve sensor details and metadata |
| `GET` | `/sensors/{id}/readings` | Retrieve historical sensor readings with limit |
| `GET` | `/sensors/health/overview` | Summary counts of active/offline/battery status |
| `POST` | `/sensors/ingest` | Ingest single or batch telemetry reading |

---

## 3. Explainable Risk Engine

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/risk/watershed/{id}` | Compute weighted explainable risk score & factors |
| `GET` | `/risk/all` | Compute real-time risk scores for all catchments |
| `GET` | `/risk/configuration` | Fetch active scoring weights and threshold tiers |
| `PUT` | `/risk/configuration` | Update scoring weights and thresholds (Admin) |

---

## 4. AI Forecasting Engine

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/predictions/generate` | Trigger temporal multi-horizon prediction engine |
| `GET` | `/predictions/watershed/{id}`| Fetch 30, 60, 90, 120 min forecast horizons |
| `GET` | `/predictions/all` | Fetch predictions for all monitored watersheds |
| `GET` | `/predictions/metadata` | Fetch model architecture, weights, RMSE, and features |

---

## 5. Alerts & Notification Early Warning

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/alerts` | Query historical alerts filtered by status/severity |
| `GET` | `/alerts/active` | Get active warning broadcasts with danger polygons |
| `POST` | `/alerts/evaluate` | Trigger rule-based alert evaluation pipeline |
| `POST` | `/alerts/{id}/acknowledge`| Acknowledge alert by response official |
| `GET` | `/alerts/zones/geojson` | GeoJSON FeatureCollection of active danger zones |
| `GET` | `/alerts/notifications/log` | Audit logs of SMS, Voice, Push, Siren dispatches |

---

## 6. Citizen Ground Truth Reports

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/reports` | Submit geo-tagged observation (River rise, Flood, etc.) |
| `GET` | `/reports` | List reports with verification filter |
| `GET` | `/reports/{id}` | Inspect report with nearby sensor cross-referencing |
| `POST` | `/reports/{id}/verify` | Verify or reject report with operator notes |

---

## 7. Evacuation Management & Safe Routing

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/evacuation/centers` | List emergency evacuation centers and capacities |
| `POST` | `/evacuation/centers` | Create new evacuation center (Admin) |
| `PUT` | `/evacuation/centers/{id}` | Update center capacity or occupancy |
| `GET` | `/evacuation/nearest` | Find nearest safe shelters by Haversine distance |
| `GET` | `/evacuation/routes` | Compute hazard-avoiding safe evacuation route |

---

## 8. Analytics & Historical Flood Analysis

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/analytics/summary` | Summary KPIs (Averages, Maxima, Uptime %, RMSE, NSE) |
| `GET` | `/analytics/charts` | 8-chart series datasets for visual analysis |
| `GET` | `/analytics/export/csv` | Download complete telemetry and incident report in CSV |

---

## 9. 15-Stage Presentation Demo Engine

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/demo/status` | Get current stage, telemetry, and physical effects |
| `POST` | `/demo/start` | Start auto-play or jump to specific demo stage |
| `POST` | `/demo/stop` | Reset scenario to baseline Stage 1 |
| `POST` | `/demo/advance-step` | Manually advance demo scenario by +1 step |

---

## 10. WebSockets

- `ws://localhost:8000/ws`: Real-time general telemetry and state broadcast.
- `ws://localhost:8000/ws/sensors`: Dedicated high-frequency sensor readings stream.
- `ws://localhost:8000/ws/alerts`: Instantaneous alert broadcasts and siren triggers.
