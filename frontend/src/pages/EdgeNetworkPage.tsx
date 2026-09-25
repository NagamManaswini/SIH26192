import React, { useState, useEffect, useCallback } from 'react';
import { 
  Radio, 
  Wifi, 
  WifiOff, 
  Volume2, 
  Battery, 
  BatteryWarning, 
  Activity, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Server, 
  Cpu, 
  Database, 
  Zap, 
  Info
} from 'lucide-react';
import { apiService } from '../services/api';
import { 
  EdgeNetworkOverviewResponse 
} from '../types';

export const EdgeNetworkPage: React.FC = () => {
  const [data, setData] = useState<EdgeNetworkOverviewResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchOverview = useCallback(async () => {
    try {
      const res = await apiService.getEdgeNetworkOverview();
      setData(res);
    } catch (err) {
      console.error('Failed to load edge network overview:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 4000);
    return () => clearInterval(interval);
  }, [fetchOverview]);

  const handleSimulateFailure = async () => {
    setActionLoading(true);
    try {
      const res = await apiService.simulateEdgeNetworkFailure();
      showNotification(res.message, 'warning');
      await fetchOverview();
    } catch (err: any) {
      showNotification('Failed to simulate network outage', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreNetwork = async () => {
    setActionLoading(true);
    try {
      const res = await apiService.restoreEdgeNetwork();
      showNotification(res.message, 'success');
      await fetchOverview();
    } catch (err: any) {
      showNotification('Failed to restore network', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTriggerLocalHazard = async (nodeId: string) => {
    setActionLoading(true);
    try {
      const res = await apiService.triggerEdgeNodeHazard(nodeId);
      showNotification(
        `Local Hazard Triggered on ${nodeId}! Autonomous Siren: ${res.siren_active ? 'ACTIVE 🚨' : 'OFF'} (Stored in Offline Buffer: ${res.stored_in_offline_buffer})`,
        res.siren_active ? 'warning' : 'success'
      );
      await fetchOverview();
    } catch (err: any) {
      showNotification('Failed to trigger hazard', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-2.5 animate-bounce ${
          notification.type === 'success' 
            ? 'bg-blue-50 border-blue-200 text-blue-900' 
            : notification.type === 'warning'
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-blue-600" /> : <AlertTriangle className="w-5 h-5 text-amber-600" />}
          <span className="text-xs font-bold">{notification.message}</span>
        </div>
      )}

      {/* Software Simulation Disclaimer Banner */}
      <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-2xl p-4 text-amber-900 flex items-start gap-3 shadow-xs">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <div className="font-bold uppercase tracking-wider text-amber-800">
            Software Edge & LoRaWAN Simulation Mode
          </div>
          <p className="leading-relaxed font-medium">
            This module provides a pure software emulation of physical LoRaWAN edge nodes, high-site gateways, RF packet loss, backhaul failure scenarios, autonomous local risk calculation, and delayed replay synchronization without requiring physical LoRa microcontrollers.
          </p>
        </div>
      </div>

      {/* Main Header & Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shadow-xs">
              <Cpu className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">LoRaWAN Edge Network & Siren Resiliency</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${
                  data?.network_online 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {data?.network_online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                  {data?.network_online ? 'Cloud Backhaul Online' : 'Network Partition (Offline Mode)'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Validates edge sensor autonomous acoustic sirens when central cloud connectivity is severed during mountain disasters.
              </p>
            </div>
          </div>
        </div>

        {/* Simulation Control Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {data?.network_online ? (
            <button
              onClick={handleSimulateFailure}
              disabled={actionLoading}
              className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <WifiOff className="w-4 h-4 text-rose-600" />
              Simulate Network Failure
            </button>
          ) : (
            <button
              onClick={handleRestoreNetwork}
              disabled={actionLoading}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Wifi className="w-4 h-4" />
              Restore Network & Sync Buffer
            </button>
          )}

          <button
            onClick={() => fetchOverview()}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 transition cursor-pointer"
            title="Refresh State"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 6 Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Sensor Nodes */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-blue-600" /> Sensor Nodes
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">
            {data?.total_nodes || 0}
          </div>
        </div>

        {/* Gateways */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Server className="w-4 h-4 text-blue-600" /> Gateways
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">
            {data?.total_gateways || 0}
          </div>
        </div>

        {/* Connected Nodes */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] text-blue-600 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Wifi className="w-4 h-4 text-blue-600" /> Connected
          </div>
          <div className="text-2xl font-black text-blue-600 font-mono mt-1">
            {data?.connected_nodes || 0}
          </div>
        </div>

        {/* Offline Nodes */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] text-rose-600 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <WifiOff className="w-4 h-4 text-rose-600" /> Offline / Isolated
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono mt-1">
            {data?.offline_nodes || 0}
          </div>
        </div>

        {/* Siren Active */}
        <div className={`rounded-2xl p-4 shadow-xs border transition ${
          (data?.sirens_active || 0) > 0 
            ? 'bg-rose-50 border-rose-300' 
            : 'bg-white border-slate-200'
        }`}>
          <div className="text-[11px] text-rose-600 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-rose-600" /> Siren Active
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono mt-1">
            {data?.sirens_active || 0}
          </div>
        </div>

        {/* Low Battery */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] text-amber-600 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <BatteryWarning className="w-4 h-4 text-amber-600" /> Battery Low
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono mt-1">
            {data?.battery_low_nodes || 0}
          </div>
        </div>

      </div>

      {/* LoRaWAN Gateways Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <Server className="w-4 h-4 text-blue-600" /> High-Site LoRaWAN Gateways (Rudraprayag Catchment)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data?.gateways.map((gw) => (
            <div 
              key={gw.gateway_id}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs text-slate-700"
            >
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-900 text-sm">{gw.name}</div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  gw.connected ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {gw.connected ? 'UPLINK ONLINE' : 'OUTAGE'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 font-medium">
                <div>ID: <strong className="text-slate-800">{gw.gateway_id}</strong></div>
                <div>Elevation: <strong className="text-slate-800">{gw.elevation_m}m</strong></div>
                <div>Backhaul: <strong className="text-slate-800">{gw.backhaul_type}</strong></div>
                <div>Delivery: <strong className="text-blue-600 font-bold">{gw.packet_delivery_rate_pct}%</strong></div>
              </div>

              <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-200 font-semibold">
                Packets: {gw.packets_received} RX | {gw.packets_dropped} Dropped
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edge Sensor Nodes Interactive Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-600" /> Edge Sensor Nodes & Autonomous Risk Engine
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Each node independently executes threshold scoring. If isolated without network, local acoustic sirens sound immediately upon dangerous surge.
            </p>
          </div>
          <div className="text-xs text-slate-500 font-mono bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            Total Flash Buffer: <strong className="text-blue-600">{data?.total_offline_queued_events || 0} queued events</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data?.nodes.map((node) => {
            const isSirenOn = node.siren_status;
            const isCritical = node.local_risk_score >= node.local_threshold;
            return (
              <div 
                key={node.node_id}
                className={`p-4 rounded-xl border transition relative overflow-hidden flex flex-col justify-between gap-3 ${
                  isSirenOn 
                    ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400/30' 
                    : 'bg-white border-slate-200 hover:border-blue-300 shadow-xs'
                }`}
              >
                {/* Flashing Beacon if Siren Active */}
                {isSirenOn && (
                  <div className="absolute top-0 right-0 px-3 py-1 bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <Volume2 className="w-3 h-3" /> SIREN SOUNDING
                  </div>
                )}

                <div>
                  <div className="flex items-start justify-between gap-2 pr-12">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{node.name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{node.node_id} • Gateway: {node.gateway_id}</div>
                    </div>
                  </div>

                  {/* Physical Telemetry & Risk Meters */}
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                      <div className="text-[10px] text-slate-500 font-bold">Rain Rate</div>
                      <div className="text-sm font-black text-blue-600 font-mono">{node.rainfall_rate_mmh} mm/h</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                      <div className="text-[10px] text-slate-500 font-bold">River Gauge</div>
                      <div className="text-sm font-black text-slate-900 font-mono">{node.river_level_m} m</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                      <div className="text-[10px] text-slate-500 font-bold">Soil Sat.</div>
                      <div className="text-sm font-black text-amber-600 font-mono">{node.soil_moisture_pct}%</div>
                    </div>
                  </div>

                  {/* Edge Local Risk vs Threshold Bar */}
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-600 flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5 text-blue-600" /> Edge Local Risk Score:
                      </span>
                      <span className={`font-mono font-bold ${isCritical ? 'text-rose-600' : 'text-blue-600'}`}>
                        {node.local_risk_score} / 100
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden relative">
                      <div 
                        style={{ width: `${Math.min(100, node.local_risk_score)}%` }}
                        className={`h-full transition-all duration-500 ${
                          isCritical ? 'bg-rose-500' : 'bg-blue-600'
                        }`}
                      ></div>
                    </div>
                    <div className="text-[10px] text-slate-400 flex justify-between font-mono font-semibold">
                      <span>Threshold: {node.local_threshold}</span>
                      <span>Elevation: {node.elevation_m}m</span>
                    </div>
                  </div>

                  {/* Hardware Status Pills */}
                  <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2.5 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 font-semibold">
                        <Battery className={`w-3.5 h-3.5 ${node.battery < 25 ? 'text-rose-600' : 'text-blue-600'}`} />
                        {node.battery}%
                      </span>
                      <span className="flex items-center gap-1 font-mono font-semibold">
                        <Wifi className="w-3.5 h-3.5 text-blue-600" />
                        {node.rssi_dbm} dBm
                      </span>
                    </div>

                    <div>
                      {node.connected ? (
                        <span className="text-blue-700 font-bold text-[11px] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">Synced Live</span>
                      ) : (
                        <span className="text-amber-700 font-bold text-[11px] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          {node.offline_events_count} buffered
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Local Action Button */}
                <button
                  onClick={() => handleTriggerLocalHazard(node.node_id)}
                  disabled={actionLoading}
                  className="w-full py-2 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-blue-600" />
                  Trigger Local Flash Flood Surge (Test Siren)
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Offline Event Replay & Synchronization Audit Ledger */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-600" /> Reconnection Synchronization Audit Log
        </h3>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-mono uppercase text-[10px]">
              <tr>
                <th className="px-4 py-2.5">Sync Batch ID</th>
                <th className="px-4 py-2.5">Edge Node</th>
                <th className="px-4 py-2.5">Gateway Used</th>
                <th className="px-4 py-2.5">Packets Replayed</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {data?.recent_sync_logs && data.recent_sync_logs.length > 0 ? (
                data.recent_sync_logs.map((log) => (
                  <tr key={log.sync_id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-bold text-blue-600">{log.sync_id}</td>
                    <td className="px-4 py-2.5 text-slate-900 font-sans font-semibold">{log.node_id}</td>
                    <td className="px-4 py-2.5 text-slate-500">{log.gateway_id}</td>
                    <td className="px-4 py-2.5 text-blue-700 font-bold">{log.events_synced} telemetry frames</td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200 text-[10px]">
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400 font-sans">
                    No reconnection replay events yet. Click "Simulate Network Failure", trigger a local surge, then click "Restore Network" to witness automatic delayed packet sync.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
