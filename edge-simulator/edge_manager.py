import sys
import os
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

# Ensure package importability
sys.path.insert(0, os.path.dirname(__file__))

from sensor_node import EdgeSensorNode
from gateway import LoRaWANGateway

class EdgeSimulationManager:
    """
    Singleton Manager for LoRaWAN & Edge Resiliency Simulation.
    Coordinates edge sensor nodes, gateways, failure simulation,
    autonomous local siren actuation, and offline-event synchronization.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EdgeSimulationManager, cls).__new__(cls)
            cls._instance._init_simulation()
        return cls._instance

    def _init_simulation(self):
        self.network_online: bool = True
        self.simulation_mode: str = "SOFTWARE_SIMULATION_ACTIVE"
        
        # Initial Gateways in Rudraprayag / Kedarnath Basin
        self.gateways: Dict[str, LoRaWANGateway] = {
            "GW-KEDAR-01": LoRaWANGateway(
                gateway_id="GW-KEDAR-01",
                name="Kedarnath Ridge High-Site Gateway",
                latitude=30.7350,
                longitude=79.0680,
                elevation_m=3580.0,
                backhaul_type="Satellite VSAT + Solar"
            ),
            "GW-GAURI-02": LoRaWANGateway(
                gateway_id="GW-GAURI-02",
                name="Gaurikund Gorge Gateway",
                latitude=30.6510,
                longitude=79.0310,
                elevation_m=2020.0,
                backhaul_type="4G LTE + Battery Backup"
            ),
            "GW-GUPT-03": LoRaWANGateway(
                gateway_id="GW-GUPT-03",
                name="Guptkashi Command Tower Gateway",
                latitude=30.5240,
                longitude=79.0780,
                elevation_m=1340.0,
                backhaul_type="Fiber + 4G Fallback"
            )
        }

        # Initial Edge Sensor Nodes
        self.nodes: Dict[str, EdgeSensorNode] = {
            "NODE-RN-001": EdgeSensorNode(
                node_id="NODE-RN-001",
                name="Kedarnath Upper Glacier Rainfall Node",
                sensor_type="RAINFALL",
                latitude=30.7380,
                longitude=79.0660,
                elevation_m=3620.0,
                local_threshold=70.0,
                gateway_id="GW-KEDAR-01"
            ),
            "NODE-RV-002": EdgeSensorNode(
                node_id="NODE-RV-002",
                name="Mandakini Gorge Water Level Radar Node",
                sensor_type="RIVER_LEVEL",
                latitude=30.6480,
                longitude=79.0280,
                elevation_m=1980.0,
                local_threshold=65.0,
                gateway_id="GW-GAURI-02"
            ),
            "NODE-SM-003": EdgeSensorNode(
                node_id="NODE-SM-003",
                name="Sonprayag Debris Flow Soil Moisture Node",
                sensor_type="SOIL_MOISTURE",
                latitude=30.6310,
                longitude=78.9920,
                elevation_m=1820.0,
                local_threshold=80.0,
                gateway_id="GW-GAURI-02"
            ),
            "NODE-MS-004": EdgeSensorNode(
                node_id="NODE-MS-004",
                name="Rambara Ridge Acoustic Siren & Telemetry Node",
                sensor_type="MULTI_SENSOR",
                latitude=30.6920,
                longitude=79.0450,
                elevation_m=2750.0,
                local_threshold=75.0,
                gateway_id="GW-KEDAR-01"
            ),
            "NODE-MS-005": EdgeSensorNode(
                node_id="NODE-MS-005",
                name="Guptkashi Valley Multi-Channel Bridge Node",
                sensor_type="MULTI_SENSOR",
                latitude=30.5210,
                longitude=79.0750,
                elevation_m=1310.0,
                local_threshold=75.0,
                gateway_id="GW-GUPT-03"
            )
        }

        self.sync_audit_log: List[Dict[str, Any]] = []

    def get_overview(self) -> Dict[str, Any]:
        total_nodes = len(self.nodes)
        connected_nodes = sum(1 for n in self.nodes.values() if n.connected)
        offline_nodes = total_nodes - connected_nodes
        sirens_active = sum(1 for n in self.nodes.values() if n.siren_status)
        battery_low = sum(1 for n in self.nodes.values() if n.battery < 25.0)
        total_queued_events = sum(len(n.stored_offline_events) for n in self.nodes.values())

        return {
            "disclaimer": "SOFTWARE SIMULATION ONLY — Simulates LoRaWAN edge resilience, offline survival, local siren actuation, and delayed packet sync without physical hardware.",
            "network_online": self.network_online,
            "total_nodes": total_nodes,
            "connected_nodes": connected_nodes,
            "offline_nodes": offline_nodes,
            "total_gateways": len(self.gateways),
            "sirens_active": sirens_active,
            "battery_low_nodes": battery_low,
            "total_offline_queued_events": total_queued_events,
            "gateways": [gw.to_dict() for gw in self.gateways.values()],
            "nodes": [n.to_dict() for n in self.nodes.values()],
            "recent_sync_logs": self.sync_audit_log[-15:]
        }

    def simulate_network_failure(self) -> Dict[str, Any]:
        """
        Simulates total cellular / backhaul network collapse (e.g., fiber cut or satellite outage during extreme storm).
        All edge nodes continue running their local risk engine and local acoustic siren autonomously.
        """
        self.network_online = False
        for gw in self.gateways.values():
            gw.set_backhaul_connectivity(False)
        for node in self.nodes.values():
            node.set_connectivity(False)
            
        return {
            "status": "SIMULATION_NETWORK_FAILED",
            "message": "Backhaul network disconnected. Edge nodes operating in autonomous survival mode with local flash event caching & standalone siren logic.",
            "network_online": False,
            "affected_nodes_count": len(self.nodes)
        }

    def restore_network(self) -> Dict[str, Any]:
        """
        Restores backhaul connectivity and triggers automatic replay of queued offline events.
        """
        self.network_online = True
        synced_events_total = 0
        now_str = datetime.now(timezone.utc).isoformat()

        for gw in self.gateways.values():
            gw.set_backhaul_connectivity(True)

        for node in self.nodes.values():
            node.set_connectivity(True)
            flushed = node.flush_offline_events()
            synced_events_total += len(flushed)
            
            if flushed:
                self.sync_audit_log.append({
                    "sync_id": f"sync-{datetime.now(timezone.utc).strftime('%H%M%S')}-{node.node_id}",
                    "node_id": node.node_id,
                    "events_synced": len(flushed),
                    "timestamp": now_str,
                    "gateway_id": node.gateway_id,
                    "status": "COMPLETED_REPLAY"
                })

        return {
            "status": "SIMULATION_NETWORK_RESTORED",
            "message": f"Backhaul restored. Replayed and synchronized {synced_events_total} offline edge telemetry packets to central database.",
            "network_online": True,
            "total_events_synced": synced_events_total,
            "sync_timestamp": now_str
        }

    def trigger_hazard_on_node(self, node_id: str) -> Dict[str, Any]:
        """
        Simulates sudden severe physical flood surge at a specific edge node.
        Demonstrates that even when network_online == False, the local edge node
        immediately activates its acoustic siren on the ground without waiting for cloud commands.
        """
        node = self.nodes.get(node_id)
        if not node:
            return {"error": f"Node {node_id} not found"}

        result = node.sample_reading(force_critical=True)
        
        # Record packet attempt at gateway
        gw = self.gateways.get(node.gateway_id)
        if gw:
            gw.record_packet()

        return {
            "status": "HAZARD_TRIGGERED",
            "node_id": node_id,
            "network_online": self.network_online,
            "siren_active": node.siren_status,
            "local_risk_score": node.local_risk_score,
            "local_threshold": node.local_threshold,
            "siren_reason": node.siren_reason,
            "stored_in_offline_buffer": not node.connected,
            "current_offline_buffer_count": len(node.stored_offline_events)
        }

    def sample_all_nodes(self):
        """
        Advances one simulation cycle across all nodes.
        """
        for node in self.nodes.values():
            node.sample_reading(rainfall_delta=0.5, river_delta=0.02, soil_delta=0.2)
            gw = self.gateways.get(node.gateway_id)
            if gw:
                gw.record_packet()

# Singleton instance
edge_simulation_manager = EdgeSimulationManager()
