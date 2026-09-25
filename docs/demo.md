# 15-Stage Flood Scenario Demonstration Guide

The platform includes an automated **15-Stage Deterministic Flash Flood Scenario Engine** specifically tailored for Smart India Hackathon jury evaluations.

---

## 1. How to Run the Demo

### Method A: From the UI (Recommended)
1. Open the **Command Room** (`/command-center`).
2. Click the pulsing **"START FLOOD DEMO"** button in the top action bar.
3. In the demo modal:
   - Click **"START FLOOD DEMO"** for automatic step progression.
   - Or click **"Next Step (+1)"** to manually guide the jury through each stage.
   - Select individual stage buttons (1–15) to jump directly to specific phenomena.

### Method B: Via REST API
```bash
# Start auto-play (4 seconds per stage)
curl -X POST http://localhost:8000/api/demo/start -H "Content-Type: application/json" -d '{"auto_play": true, "seconds_per_stage": 4}'

# Manually advance one stage
curl -X POST http://localhost:8000/api/demo/advance-step

# Reset to baseline
curl -X POST http://localhost:8000/api/demo/stop
```

---

## 2. The 15 Deterministic Stages

| Stage | Title | Physical State | Key System Trigger |
| :--- | :--- | :--- | :--- |
| **1** | Baseline Calm Conditions | Rain: 2 mm/h, River: 1.8m, Soil: 35% | Normal DEFCON 4 green status |
| **2** | Low Pressure Gathering | Rain: 12 mm/h, River: 2.1m, Soil: 48% | Risk engine: MODERATE watch |
| **3** | Precipitation Intensification | Rain: 38 mm/h, River: 2.9m, Soil: 62% | Sensor telemetry alerts |
| **4** | AI Early Prediction Trigger | Rain: 55 mm/h, River: 3.5m, Predicted: 6.2m | AI 60-min forecast rises to HIGH |
| **5** | Cloudburst Event Ignition | Rain: 110 mm/h, River: 4.8m, Soil: 88% | Cloudburst rule triggered |
| **6** | Rapid River Stage Surge | Rain: 125 mm/h, River: 6.9m (Rate: 3.2m/h)| Risk engine score reaches 84 (CRITICAL) |
| **7** | Emergency Alert Broadcast | Rain: 140 mm/h, River: 7.8m | Red EMERGENCY alert + IVR/SMS queue |
| **8** | Cellular Infrastructure Outage| Rain: 135 mm/h, GSM down | Nodes transition to offline LoRa mesh |
| **9** | LoRaWAN Edge Siren Trigger | Offline buffer queue: 18 events | Edge node hardware relay triggers solar siren |
| **10**| Hazard Evacuation Routing | Mandakini valley path blocked | Dijkstra router recalculates high-ground route |
| **11**| Peak Catchment Inundation | River: 8.9m (Extreme crest) | Real-time map displays danger buffer zones |
| **12**| Storm Subsidence | Rain falls to 22 mm/h | Soil saturation remains 92% |
| **13**| Flood Crest Recession | River receding to 4.9m | Downgrade from EMERGENCY to WARNING |
| **14**| Cellular Reconnection & Sync | GSM restored | Edge buffer & offline citizen reports sync |
| **15**| Post-Event Analytics & Debrief | Normalization | Analytics dashboard displays event hydrograph & NSE |
