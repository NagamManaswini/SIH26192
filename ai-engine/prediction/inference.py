from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.watershed import Watershed
from app.models.sensor import Sensor
from app.models.readings import RainfallReading, RiverReading, SoilMoistureReading
from app.models.historical import HistoricalFloodEvent
from app.models.prediction import FloodPrediction
from app.models.enums import RiskLevel

from ai_engine.preprocessing.feature_engineering import feature_extractor
from ai_engine.models.baseline_forecaster import forecaster_model, HorizonForecast


class FloodInferencePipeline:
    """
    End-to-end inference pipeline bridging live catchment telemetry with
    multi-horizon AI forecasting models.
    """

    def __init__(self):
        self.feature_extractor = feature_extractor
        self.model = forecaster_model

    def run_inference_for_watershed(
        self,
        db: Session,
        watershed_id: int,
        persist_predictions: bool = False
    ) -> Dict[str, Any]:
        """
        Extract telemetry features and predict +30, +60, +90, +120 min river levels.
        """
        watershed = db.query(Watershed).filter(Watershed.id == watershed_id).first()
        if not watershed:
            raise ValueError(f"Watershed with ID {watershed_id} not found.")

        sensor_ids = [s.id for s in watershed.sensors] if watershed.sensors else []
        now = datetime.now(timezone.utc)

        # 1. Fetch raw time-series data
        rain_records: List[Dict[str, Any]] = []
        river_records: List[Dict[str, Any]] = []
        soil_records: List[Dict[str, Any]] = []

        if sensor_ids:
            # Rainfall
            rr = db.query(RainfallReading).filter(
                RainfallReading.sensor_id.in_(sensor_ids)
            ).order_by(desc(RainfallReading.timestamp)).limit(20).all()
            rain_records = [{"rainfall_mm": r.rainfall_mm, "timestamp": r.timestamp} for r in rr]

            # River Level
            rv = db.query(RiverReading).filter(
                RiverReading.sensor_id.in_(sensor_ids)
            ).order_by(desc(RiverReading.timestamp)).limit(10).all()
            river_records = [{"water_level_m": r.water_level_m, "timestamp": r.timestamp} for r in rv]

            # Soil Moisture
            sm = db.query(SoilMoistureReading).filter(
                SoilMoistureReading.sensor_id.in_(sensor_ids)
            ).order_by(desc(SoilMoistureReading.timestamp)).limit(10).all()
            soil_records = [{"moisture_percentage": r.moisture_percentage, "timestamp": r.timestamp} for r in sm]

        # Historical events count
        hist_count = db.query(HistoricalFloodEvent).filter(
            HistoricalFloodEvent.location.ilike(f"%{watershed.name.split()[0]}%") |
            HistoricalFloodEvent.affected_area.ilike(f"%{watershed.district}%")
        ).count()

        watershed_meta = {
            "elevation_m": getattr(watershed, "elevation_m", 1850.0),
            "average_slope_deg": getattr(watershed, "average_slope_deg", 24.5),
            "area_sq_km": watershed.area_sq_km,
        }

        # 2. Extract 11 Hydrological Features
        features = self.feature_extractor.extract_from_records(
            rainfall_records=rain_records,
            river_records=river_records,
            soil_records=soil_records,
            watershed_meta=watershed_meta,
            historical_events_count=hist_count
        )

        # 3. Multi-Horizon Prediction Inference
        horizon_forecasts: List[HorizonForecast] = self.model.predict_multi_horizon(features)

        # 4. Optionally Persist to FloodPrediction Table
        if persist_predictions:
            for h in horizon_forecasts:
                # Convert risk level string to RiskLevel enum
                enum_risk = RiskLevel[h.risk_level] if hasattr(RiskLevel, h.risk_level) else RiskLevel.LOW
                db.add(FloodPrediction(
                    watershed_id=watershed.id,
                    prediction_time=now,
                    forecast_for=now + timedelta(minutes=h.minutes_ahead),
                    predicted_water_level=h.predicted_water_level,
                    probability=h.flood_probability,
                    risk_level=enum_risk,
                    confidence=h.confidence,
                    model_version=self.model.model_version
                ))
            db.commit()

        # 5. Format Structured Response Payload
        prediction_items = []
        for h in horizon_forecasts:
            forecast_time = now + timedelta(minutes=h.minutes_ahead)
            prediction_items.append({
                "minutes_ahead": h.minutes_ahead,
                "forecast_timestamp": forecast_time.isoformat(),
                "predicted_water_level": h.predicted_water_level,
                "flood_probability": h.flood_probability,
                "risk_level": h.risk_level,
                "confidence": h.confidence,
                "confidence_lower": h.confidence_lower,
                "confidence_upper": h.confidence_upper
            })

        return {
            "watershed_id": watershed.id,
            "watershed_name": watershed.name,
            "watershed_code": watershed.code,
            "district": watershed.district,
            "state": watershed.state,
            "current_water_level": features["river_level"],
            "current_rainfall_rate": features["rainfall_5min"],
            "current_soil_moisture": features["soil_moisture"],
            "features_extracted": features,
            "predictions": prediction_items,
            "model_metadata": self.model.get_metadata(),
            "model_version": self.model.model_version,
            "generated_at": now.isoformat()
        }


inference_pipeline = FloodInferencePipeline()
