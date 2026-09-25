import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

class EdgeSensorNode:
    """
    Simulated LoRaWAN Edge Sensor Node.
    Capable of local sensor data sampling, autonomous edge threshold evaluation,
    local siren activation during network isolation, and offline event caching.
    """
    def __init__(
        self,
        node_id: str,
        name: str,
        sensor_type: str = "MULTI_SENSOR",
        latitude: float = 30.6500,
        longitude: float = 79.0300,
        elevation_m: float = 2150.0,
        local_threshold: float = 75.0,
        gateway_id: str = "GW-KEDAR-01"
    ):
        self.node_id = node_id
        self.name = name
        self.sensor_type = sensor_type
        self.latitude = latitude
        self.longitude = longitude
        self.elevation_m = elevation_m
        
        # Power & RF telemetry
        self.battery: float = 94.5  # %
        self.signal: float = 88.0   # RSSI / SNR proxy in %
        self.rssi_dbm: int = -76
        self.snr_db: float = 9.2
        self.frequency_mhz: float = 868.1
        self.spreading_factor: int = 7
        
        # Network & Connectivity State
        self.connected: bool = True
        self.gateway_id: str = gateway_id
        
        # Local Risk & Actuation Engine
        self.local_risk_score: float = 18.0  # 0 - 100
        self.local_threshold: float = local_threshold
        self.siren_status: bool = False  # True = sounding local acoustic alarm
        self.siren_reason: Optional[str] = None
        
        # Current Physical Readings
        self.rainfall_rate_mmh: float = 4.2
        self.river_level_m: float = 1.45
        self.soil_moisture_pct: float = 42.0
        
        # Offline Event Buffer
        self.stored_offline_events: List[Dict[str, Any]] = []
        self.last_sampled_at: str = datetime.now(timezone.utc).isoformat()
        self.last_synced_at: Optional[str] = datetime.now(timezone.utc).isoformat()

    def sample_reading(
        self,
        rainfall_delta: float = 0.0,
        river_delta: float = 0.0,
        soil_delta: float = 0.0,
        force_critical: bool = False
    ) -> Dict[str, Any]:
        """
        Samples simulated physical environment, updates battery consumption,
        and computes autonomous local edge risk score.
        """
        now = datetime.now(timezone.utc)
        self.last_sampled_at = now.isoformat()
        
        # Minor battery drain on sample
        self.battery = max(5.0, round(self.battery - 0.02, 2))
        
        if force_critical:
            self.rainfall_rate_mmh = 92.5
            self.river_level_m = 4.85
            self.soil_moisture_pct = 94.0
        else:
            self.rainfall_rate_mmh = max(0.0, round(self.rainfall_rate_mmh + rainfall_delta, 1))
            self.river_level_m = max(0.2, round(self.river_level_m + river_delta, 2))
            self.soil_moisture_pct = min(100.0, max(10.0, round(self.soil_moisture_pct + soil_delta, 1)))
        
        # Autonomous Local Edge Risk Evaluation (Explainable Edge Model)
        rain_score = min(100.0, (self.rainfall_rate_mmh / 80.0) * 100.0)
        river_score = min(100.0, (self.river_level_m / 4.5) * 100.0)
        soil_score = self.soil_moisture_pct
        
        self.local_risk_score = round(
            (rain_score * 0.40) + (river_score * 0.40) + (soil_score * 0.20),
            1
        )
        
        # Local Siren Actuation Logic
        if self.local_risk_score >= self.local_threshold:
            if not self.siren_status:
                self.siren_status = True
                self.siren_reason = (
                    f"Autonomous Edge Siren Triggered: Risk {self.local_risk_score} >= Threshold {self.local_threshold} "
                    f"(Rain: {self.rainfall_rate_mmh}mm/h, River: {self.river_level_m}m)"
                )
        else:
            self.siren_status = False
            self.siren_reason = None
            
        reading_payload = {
            "event_id": f"evt-{uuid.uuid4().hex[:8]}",
            "node_id": self.node_id,
            "timestamp": self.last_sampled_at,
            "rainfall_rate_mmh": self.rainfall_rate_mmh,
            "river_level_m": self.river_level_m,
            "soil_moisture_pct": self.soil_moisture_pct,
            "local_risk_score": self.local_risk_score,
            "siren_active": self.siren_status,
            "siren_reason": self.siren_reason,
            "battery": self.battery,
            "rssi_dbm": self.rssi_dbm
        }
        
        # If offline/disconnected, store event in local flash buffer
        if not self.connected:
            self.stored_offline_events.append(reading_payload)
            
        return reading_payload

    def set_connectivity(self, connected: bool):
        self.connected = connected

    def flush_offline_events(self) -> List[Dict[str, Any]]:
        """
        Dumps offline stored events for synchronization upon reconnection.
        """
        events = list(self.stored_offline_events)
        self.stored_offline_events.clear()
        self.last_synced_at = datetime.now(timezone.utc).isoformat()
        return events

    def to_dict(self) -> Dict[str, Any]:
        return {
            "node_id": self.node_id,
            "name": self.name,
            "sensor_type": self.sensor_type,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "elevation_m": self.elevation_m,
            "battery": self.battery,
            "signal": self.signal,
            "rssi_dbm": self.rssi_dbm,
            "snr_db": self.snr_db,
            "frequency_mhz": self.frequency_mhz,
            "spreading_factor": self.spreading_factor,
            "connected": self.connected,
            "gateway_id": self.gateway_id,
            "local_risk_score": self.local_risk_score,
            "local_threshold": self.local_threshold,
            "siren_status": self.siren_status,
            "siren_reason": self.siren_reason,
            "rainfall_rate_mmh": self.rainfall_rate_mmh,
            "river_level_m": self.river_level_m,
            "soil_moisture_pct": self.soil_moisture_pct,
            "offline_events_count": len(self.stored_offline_events),
            "last_sampled_at": self.last_sampled_at,
            "last_synced_at": self.last_synced_at
        }
