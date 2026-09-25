import os
import sys
import time
import random
import argparse
import asyncio
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

# Ensure backend directory is in Python path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.models.sensor import Sensor
from app.models.readings import RainfallReading, RiverReading, SoilMoistureReading
from app.models.sensor_health import SensorHealth
from app.models.enums import SensorType, SensorStatus
from app.websocket.manager import ws_manager

class SensorState:
    """
    Maintains physical and hydrological state for a single simulated sensor.
    """
    def __init__(self, sensor: Sensor):
        self.sensor_id = sensor.id
        self.sensor_code = sensor.sensor_code
        self.name = sensor.name
        self.sensor_type = sensor.sensor_type
        self.watershed_id = sensor.watershed_id
        
        # Hydrological & physical state variables
        self.base_river_level = random.uniform(1.6, 2.4)
        self.current_river_level = self.base_river_level
        self.current_soil_moisture = random.uniform(55.0, 72.0)
        self.accumulated_rain_last_10_mins = 0.0
        self.current_rainfall_mm = 0.0
        self.battery_level = sensor.battery_level or 100.0
        self.signal_strength = -65.0 + random.uniform(-10.0, 5.0)
        self.status = sensor.status or SensorStatus.ACTIVE
        self.offline_cooldown = 0
        self.rain_surge_remaining = 0

    def tick(self, global_cloudburst: bool = False):
        """
        Advance simulated physics by one time step.
        """
        # 1. Randomly simulate intermittent offline state (approx 4% chance)
        if self.offline_cooldown > 0:
            self.offline_cooldown -= 1
            if self.offline_cooldown == 0:
                self.status = SensorStatus.ACTIVE
        else:
            if random.random() < 0.04:
                self.status = random.choice([SensorStatus.OFFLINE, SensorStatus.MAINTENANCE])
                self.offline_cooldown = random.randint(2, 4)

        # 2. Battery depletion: slowly reduce battery
        depletion = random.uniform(0.01, 0.04)
        self.battery_level = max(5.0, round(self.battery_level - depletion, 2))

        # 3. Signal strength slight jitter
        self.signal_strength = round(max(-95.0, min(-50.0, self.signal_strength + random.uniform(-2.0, 2.0))), 1)

        # 4. Rainfall simulation
        if global_cloudburst or self.rain_surge_remaining > 0:
            # Cloudburst / heavy convective storm (35 - 75 mm/hr)
            self.current_rainfall_mm = round(random.uniform(38.0, 72.5), 1)
            if self.rain_surge_remaining > 0:
                self.rain_surge_remaining -= 1
        else:
            # Random occasional heavy rainfall spike (15% chance) or gentle mountain drizzle (0 - 12 mm/hr)
            if random.random() < 0.15:
                self.rain_surge_remaining = random.randint(3, 6)
                self.current_rainfall_mm = round(random.uniform(28.0, 52.0), 1)
            else:
                self.current_rainfall_mm = round(random.uniform(0.0, 8.5), 1)

        # Update rolling rain buffer
        self.accumulated_rain_last_10_mins = (self.accumulated_rain_last_10_mins * 0.85) + (self.current_rainfall_mm * 0.15)

        # 5. Soil moisture saturation curve (prolonged rain increases saturation towards 98%)
        if self.current_rainfall_mm > 15.0:
            soil_gain = (self.current_rainfall_mm / 50.0) * random.uniform(1.2, 3.5)
            self.current_soil_moisture = min(98.5, self.current_soil_moisture + soil_gain)
        else:
            # Slow drainage when rain subsides
            soil_drain = random.uniform(0.1, 0.5)
            self.current_soil_moisture = max(42.0, self.current_soil_moisture - soil_drain)
        self.current_soil_moisture = round(self.current_soil_moisture, 1)

        # 6. River level hydrograph response (rises proportionally after rainfall)
        if self.accumulated_rain_last_10_mins > 10.0:
            river_surge = (self.accumulated_rain_last_10_mins / 30.0) * random.uniform(0.15, 0.45)
            self.current_river_level = min(7.5, self.current_river_level + river_surge)
        else:
            # Gradually drain back towards base level
            if self.current_river_level > self.base_river_level:
                self.current_river_level = max(self.base_river_level, self.current_river_level - random.uniform(0.04, 0.12))
        self.current_river_level = round(self.current_river_level, 2)


class SensorSimulator:
    """
    Orchestrates real-time telemetry generation across all database sensors.
    """
    def __init__(self, interval: float = 3.0):
        self.interval = interval
        self.states: Dict[int, SensorState] = {}
        self.cycle_count = 0

    def init_sensors(self):
        """
        Load sensors from database and create physical state models.
        """
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        try:
            sensors = db.query(Sensor).all()
            if not sensors:
                print("[SIMULATOR] No sensors found in DB. Running seeder first...")
                from scripts.seed_mock_data import seed_database
                seed_database()
                sensors = db.query(Sensor).all()

            for s in sensors:
                self.states[s.id] = SensorState(s)
            print(f"[SIMULATOR] Loaded {len(self.states)} sensors into physics engine.")
        finally:
            db.close()

    async def step(self, force_cloudburst: bool = False):
        """
        Executes a single simulation cycle, saves readings to DB, and broadcasts via WebSocket.
        """
        self.cycle_count += 1
        now = datetime.now(timezone.utc)
        db = SessionLocal()

        try:
            print(f"\n--- [CYCLE #{self.cycle_count}] Telemetry Generation at {now.strftime('%H:%M:%S UTC')} ---")
            
            for sensor_id, state in self.states.items():
                state.tick(global_cloudburst=force_cloudburst)
                
                # Fetch DB model to update
                sensor = db.query(Sensor).filter(Sensor.id == sensor_id).first()
                if not sensor:
                    continue

                sensor.last_seen = now
                sensor.battery_level = state.battery_level
                sensor.status = state.status

                # Prepare broadcast payload
                reading_summary = ""
                
                # Record specific readings based on sensor type
                if state.sensor_type in (SensorType.RAINFALL, SensorType.MULTI_SENSOR, SensorType.WEATHER):
                    db.add(RainfallReading(
                        sensor_id=sensor.id,
                        rainfall_mm=state.current_rainfall_mm,
                        timestamp=now
                    ))
                    reading_summary += f"Rain: {state.current_rainfall_mm} mm/hr | "

                if state.sensor_type in (SensorType.RIVER_LEVEL, SensorType.MULTI_SENSOR):
                    flow = round(state.current_river_level * 32.5, 1)
                    db.add(RiverReading(
                        sensor_id=sensor.id,
                        water_level_m=state.current_river_level,
                        flow_rate=flow,
                        timestamp=now
                    ))
                    reading_summary += f"River: {state.current_river_level} m | "

                if state.sensor_type in (SensorType.SOIL_MOISTURE, SensorType.MULTI_SENSOR):
                    db.add(SoilMoistureReading(
                        sensor_id=sensor.id,
                        moisture_percentage=state.current_soil_moisture,
                        timestamp=now
                    ))
                    reading_summary += f"Soil: {state.current_soil_moisture}% | "

                # Record health log
                db.add(SensorHealth(
                    sensor_id=sensor.id,
                    battery_level=state.battery_level,
                    signal_strength=state.signal_strength,
                    status=state.status,
                    last_seen=now,
                    recorded_at=now
                ))

                # Log status in console
                status_color = "[ACTIVE]" if state.status == SensorStatus.ACTIVE else f"[{state.status.value}]"
                print(f"  * {sensor.sensor_code} ({sensor.name[:24]}...): {status_color} {reading_summary}Bat: {state.battery_level}% | Sig: {state.signal_strength}dBm")

                # Broadcast via WebSocket
                ws_payload = {
                    "event": "sensor_reading",
                    "data": {
                        "sensor_id": sensor.id,
                        "sensor_code": sensor.sensor_code,
                        "name": sensor.name,
                        "sensor_type": sensor.sensor_type.value,
                        "status": sensor.status.value,
                        "battery_level": state.battery_level,
                        "signal_strength": state.signal_strength,
                        "rainfall_mm": state.current_rainfall_mm if state.sensor_type in (SensorType.RAINFALL, SensorType.MULTI_SENSOR, SensorType.WEATHER) else None,
                        "water_level_m": state.current_river_level if state.sensor_type in (SensorType.RIVER_LEVEL, SensorType.MULTI_SENSOR) else None,
                        "moisture_percentage": state.current_soil_moisture if state.sensor_type in (SensorType.SOIL_MOISTURE, SensorType.MULTI_SENSOR) else None,
                        "last_seen": now.isoformat(),
                        "watershed_id": sensor.watershed_id,
                        "watershed_name": sensor.watershed.name if sensor.watershed else None
                    }
                }
                
                try:
                    await ws_manager.broadcast_json(ws_payload)
                except Exception:
                    pass

            db.commit()
            print(f"[OK] Ingested & Broadcasted {len(self.states)} sensor packets.")

        except Exception as e:
            db.rollback()
            print(f"[ERROR] Simulation cycle failed: {e}")
        finally:
            db.close()

    async def run(self, cycles: Optional[int] = None, cloudburst: bool = False):
        """
        Continuous simulation loop.
        """
        self.init_sensors()
        print(f"[SIMULATOR] Starting telemetry generation loop (Interval: {self.interval}s, Cloudburst Mode: {cloudburst})...")
        print("[SIMULATOR] Press Ctrl+C to terminate.\n")

        count = 0
        try:
            while True:
                await self.step(force_cloudburst=cloudburst)
                count += 1
                if cycles and count >= cycles:
                    print(f"[SIMULATOR] Completed requested {cycles} cycles.")
                    break
                await asyncio.sleep(self.interval)
        except (KeyboardInterrupt, asyncio.CancelledError):
            print("\n[SIMULATOR] Terminated by user.")


def main():
    parser = argparse.ArgumentParser(description="SIH26192 Real-Time Sensor Telemetry Simulator")
    parser.add_argument("--interval", type=float, default=3.0, help="Interval in seconds between telemetry generation cycles (default: 3.0)")
    parser.add_argument("--cycles", type=int, default=None, help="Number of simulation cycles to run (default: infinite)")
    parser.add_argument("--cloudburst", action="store_true", help="Force heavy rainfall and cloudburst conditions across mountain catchments")
    
    args = parser.parse_args()

    simulator = SensorSimulator(interval=args.interval)
    asyncio.run(simulator.run(cycles=args.cycles, cloudburst=args.cloudburst))


if __name__ == "__main__":
    main()
