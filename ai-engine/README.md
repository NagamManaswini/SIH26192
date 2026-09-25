# AI Engine - Flash Flood Forecasting

This subsystem provides hyper-local temporal forecasting and hydrological risk evaluation for mountainous micro-watersheds.

## Directory Structure
- `models/`: Model architecture definitions and serialized model checkpoints.
- `preprocessing/`: Feature extraction, rolling hydrological metrics (API - Antecedent Precipitation Index, soil saturation indices).
- `prediction/`: Inference services for 30-min, 60-min, 90-min, and 120-min lead time flood probability predictions.
- `training/`: Training pipelines, cross-validation, and performance evaluation scripts.
- `simulation/`: Synthetic sensor telemetry generators simulating extreme cloudburst scenarios in hilly catchments.
