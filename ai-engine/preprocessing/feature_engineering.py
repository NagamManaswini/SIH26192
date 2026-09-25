from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import numpy as np


class HydrologicalFeatureExtractor:
    """
    Extracts 11 temporal, physical, and historical hydrological features
    for multi-horizon flash flood forecasting.
    """

    FEATURE_NAMES = [
        "rainfall_5min",
        "rainfall_15min",
        "rainfall_30min",
        "rainfall_60min",
        "accumulated_rainfall",
        "river_level",
        "river_rate_of_rise",
        "soil_moisture",
        "elevation",
        "slope",
        "historical_risk",
    ]

    def extract_from_records(
        self,
        rainfall_records: List[Dict[str, Any]],
        river_records: List[Dict[str, Any]],
        soil_records: List[Dict[str, Any]],
        watershed_meta: Dict[str, Any],
        historical_events_count: int = 0
    ) -> Dict[str, float]:
        """
        Extract normalized and raw feature dict from raw time-series records.
        """
        # 1. Rainfall series extraction (assumes records ordered by desc timestamp)
        r_rates = [r.get("rainfall_mm", 0.0) for r in rainfall_records] if rainfall_records else [0.0]
        
        rainfall_5min = float(r_rates[0]) if len(r_rates) > 0 else 0.0
        rainfall_15min = float(np.mean(r_rates[:3])) if len(r_rates) >= 3 else rainfall_5min
        rainfall_30min = float(np.mean(r_rates[:6])) if len(r_rates) >= 6 else rainfall_15min
        rainfall_60min = float(np.mean(r_rates[:12])) if len(r_rates) >= 12 else rainfall_30min
        accumulated_rainfall = float(sum(r_rates[:15]) * 0.5) if r_rates else 0.0

        # 2. River stage & Rate of Rise (m/hr)
        h_levels = [r.get("water_level_m", 1.8) for r in river_records] if river_records else [1.8]
        river_level = float(h_levels[0]) if len(h_levels) > 0 else 1.8
        
        if len(h_levels) >= 2:
            dh = h_levels[0] - h_levels[-1]
            dt_hours = max(0.2, len(h_levels) * 0.1)
            river_rate_of_rise = float(round(max(-2.0, min(5.0, dh / dt_hours)), 3))
        else:
            river_rate_of_rise = 0.0

        # 3. Soil moisture percentage
        s_moistures = [r.get("moisture_percentage", 60.0) for r in soil_records] if soil_records else [60.0]
        soil_moisture = float(s_moistures[0]) if len(s_moistures) > 0 else 60.0

        # 4. Watershed characteristics
        elevation = float(watershed_meta.get("elevation_m", 1850.0))
        slope = float(watershed_meta.get("average_slope_deg", 24.5))
        historical_risk = float(min(100.0, historical_events_count * 35.0))

        return {
            "rainfall_5min": round(rainfall_5min, 2),
            "rainfall_15min": round(rainfall_15min, 2),
            "rainfall_30min": round(rainfall_30min, 2),
            "rainfall_60min": round(rainfall_60min, 2),
            "accumulated_rainfall": round(accumulated_rainfall, 2),
            "river_level": round(river_level, 2),
            "river_rate_of_rise": round(river_rate_of_rise, 3),
            "soil_moisture": round(soil_moisture, 1),
            "elevation": round(elevation, 1),
            "slope": round(slope, 1),
            "historical_risk": round(historical_risk, 1),
        }

    def to_feature_vector(self, feature_dict: Dict[str, float]) -> np.ndarray:
        """Convert feature dictionary to ordered numpy vector."""
        return np.array([feature_dict.get(k, 0.0) for k in self.FEATURE_NAMES], dtype=np.float32)


feature_extractor = HydrologicalFeatureExtractor()
