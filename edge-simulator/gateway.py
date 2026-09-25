from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

class LoRaWANGateway:
    """
    Simulated LoRaWAN Gateway.
    Aggregates multi-channel RF uplink packets from surrounding edge nodes,
    handles backhaul connectivity (4G LTE / Satellite Starlink / Fiber),
    and relays telemetry to the central backend.
    """
    def __init__(
        self,
        gateway_id: str,
        name: str,
        latitude: float,
        longitude: float,
        elevation_m: float = 2400.0,
        backhaul_type: str = "4G LTE / Satellite Fallback"
    ):
        self.gateway_id = gateway_id
        self.name = name
        self.latitude = latitude
        self.longitude = longitude
        self.elevation_m = elevation_m
        self.backhaul_type = backhaul_type
        
        self.connected: bool = True
        self.packets_received: int = 1420
        self.packets_dropped: int = 4
        self.last_uplink_at: str = datetime.now(timezone.utc).isoformat()

    def set_backhaul_connectivity(self, connected: bool):
        self.connected = connected

    def record_packet(self, packet_size_bytes: int = 64):
        if self.connected:
            self.packets_received += 1
            self.last_uplink_at = datetime.now(timezone.utc).isoformat()
        else:
            self.packets_dropped += 1

    def to_dict(self) -> Dict[str, Any]:
        return {
            "gateway_id": self.gateway_id,
            "name": self.name,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "elevation_m": self.elevation_m,
            "backhaul_type": self.backhaul_type,
            "connected": self.connected,
            "packets_received": self.packets_received,
            "packets_dropped": self.packets_dropped,
            "packet_delivery_rate_pct": round(
                (self.packets_received / max(1, self.packets_received + self.packets_dropped)) * 100.0, 1
            ),
            "last_uplink_at": self.last_uplink_at
        }
