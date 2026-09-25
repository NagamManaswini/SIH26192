import math
from typing import Dict, Any, List, Tuple
import numpy as np


class SyntheticHydrographSimulator:
    """
    Simulates dynamic storm runoff hydrographs using hydrologic routing equations,
    unit hydrograph principles, and infiltration-excess surface runoff modeling.
    """

    def generate_synthetic_event(
        self,
        base_river_level: float = 1.85,
        peak_rainfall_intensity: float = 45.0,
        slope_deg: float = 25.0,
        initial_soil_moisture: float = 65.0,
        event_duration_hours: float = 4.0
    ) -> List[Dict[str, float]]:
        """
        Generate a multi-hour hydrograph profile with time steps.
        """
        steps = int(event_duration_hours * 12)  # 5-minute time steps
        hydrograph = []

        current_river = base_river_level
        soil_moisture = initial_soil_moisture

        # Time-to-peak lag influenced by slope and saturation
        t_peak_steps = max(4, int(18 - (slope_deg / 40.0) * 8 - (initial_soil_moisture / 100.0) * 6))

        for step in range(steps):
            t_min = step * 5

            # Convective rainfall pulse (Gaussian distribution)
            rain_rate = peak_rainfall_intensity * math.exp(-((step - t_peak_steps * 0.6) ** 2) / (2 * (6 ** 2)))
            rain_rate = max(0.2, rain_rate)

            # Infiltration and runoff coefficient
            runoff_coeff = min(0.95, (soil_moisture / 100.0) * 0.75 + (slope_deg / 45.0) * 0.25)
            effective_rain = rain_rate * runoff_coeff

            # River stage hydrograph lagged wave equation
            surge = (effective_rain / 12.0) * (1.0 / (1.0 + math.exp(-0.2 * (step - t_peak_steps))))
            drainage = max(0.0, (current_river - base_river_level) * 0.04)
            current_river = max(base_river_level, current_river + surge - drainage)

            # Soil moisture saturation increases with rainfall
            soil_moisture = min(98.0, soil_moisture + (rain_rate / 35.0) * 2.0 - 0.15)

            hydrograph.append({
                "time_minutes": t_min,
                "rainfall_intensity_mm_hr": round(rain_rate, 2),
                "water_level_m": round(current_river, 2),
                "soil_moisture_pct": round(soil_moisture, 1)
            })

        return hydrograph


synthetic_simulator = SyntheticHydrographSimulator()
