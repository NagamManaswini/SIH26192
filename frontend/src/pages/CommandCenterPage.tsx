import React, { useState, useEffect, useCallback } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  GeoJSON, 
  Marker, 
  Popup, 
  Circle, 
  useMap 
} from 'react-leaflet';
import L from 'leaflet';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Radio, 
  Activity, 
  Users, 
  Flame, 
  Layers, 
  Clock, 
  RefreshCw, 
  TrendingUp, 
  Battery, 
  Wifi, 
  Filter, 
  Volume2, 
  Compass,
  Play
} from 'lucide-react';
import { DemoControlModal } from '../components/DemoControlModal';
import { apiService } from '../services/api';
import { 
  CommandCenterOverviewKPIs, 
  IncidentTimelineEvent, 
  CommandCenterTrendsResponse, 
  CommandCenterSensorHealthResponse,
  GeoJSONFeatureCollection,
  MapSensorProperties,
  MapWatershedProperties,
  MapRiskZoneProperties,
  MapEvacuationCenterProperties,
  MapCitizenReportProperties,
  MapAlertProperties,
  WatershedItem
} from '../types';

// Map controller to adjust view smoothly
interface MapControllerProps {
  center: [number, number];
  zoom: number;
}

const MapController: React.FC<MapControllerProps> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.0 });
  }, [center, zoom, map]);
  return null;
};

// Custom Leaflet DivIcons
const createCommandSensorIcon = (type: string, status: string) => {
  let color = '#0284c7';
  if (status === 'OFFLINE' || status === 'INACTIVE') color = '#64748b';
  else if (type === 'RIVER_LEVEL') color = '#06b6d4';
  else if (type === 'SOIL_MOISTURE') color = '#d97706';

  return L.divIcon({
    className: 'custom-command-sensor',
    html: `
      <div style="
        width: 18px; 
        height: 18px; 
        border-radius: 50%; 
        background: ${color}; 
        border: 2px solid #ffffff; 
        box-shadow: 0 0 8px ${color};
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 6px; height: 6px; border-radius: 50%; background: #ffffff;"></div>
      </div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
};

const createShelterIcon = () => {
  return L.divIcon({
    className: 'custom-shelter-pin',
    html: `
      <div style="
        width: 22px; 
        height: 22px; 
        border-radius: 6px; 
        background: #10b981; 
        border: 2px solid #ffffff; 
        box-shadow: 0 0 10px rgba(16,185,129,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
      ">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });
};

const createReportIcon = (status: string) => {
  const isVerified = status === 'VERIFIED';
  return L.divIcon({
    className: 'custom-report-pin',
    html: `
      <div style="
        width: 20px; 
        height: 20px; 
        border-radius: 50%; 
        background: ${isVerified ? '#ef4444' : '#f59e0b'}; 
        border: 2px solid #ffffff; 
        box-shadow: 0 0 8px ${isVerified ? 'rgba(239,68,68,0.8)' : 'rgba(245,158,11,0.8)'};
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
      ">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/></svg>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

export const CommandCenterPage: React.FC = () => {
  // State: High-level overview & Timeline
  const [overview, setOverview] = useState<CommandCenterOverviewKPIs | null>(null);
  const [timeline, setTimeline] = useState<IncidentTimelineEvent[]>([]);
  const [trends, setTrends] = useState<CommandCenterTrendsResponse | null>(null);
  const [sensorHealth, setSensorHealth] = useState<CommandCenterSensorHealthResponse | null>(null);
  const [watersheds, setWatersheds] = useState<WatershedItem[]>([]);

  // Map GeoJSON Layers
  const [sensorGeoJSON, setSensorGeoJSON] = useState<GeoJSONFeatureCollection<MapSensorProperties> | null>(null);
  const [watershedGeoJSON, setWatershedGeoJSON] = useState<GeoJSONFeatureCollection<MapWatershedProperties> | null>(null);
  const [riskZoneGeoJSON, setRiskZoneGeoJSON] = useState<GeoJSONFeatureCollection<MapRiskZoneProperties> | null>(null);
  const [shelterGeoJSON, setShelterGeoJSON] = useState<GeoJSONFeatureCollection<MapEvacuationCenterProperties> | null>(null);
  const [reportsGeoJSON, setReportsGeoJSON] = useState<GeoJSONFeatureCollection<MapCitizenReportProperties> | null>(null);
  const [alertGeoJSON, setAlertGeoJSON] = useState<GeoJSONFeatureCollection<MapAlertProperties> | null>(null);

  // Filters
  const [selectedWatershedId, setSelectedWatershedId] = useState<number | undefined>(undefined);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('ALL');
  const [timeWindow, setTimeWindow] = useState<string>('24h');
  const [activeRightTab, setActiveRightTab] = useState<'timeline' | 'health'>('timeline');

  // Layer Visibility Switchboard
  const [layers, setLayers] = useState({
    sensors: true,
    watersheds: true,
    riskZones: true,
    alerts: true,
    shelters: true,
    reports: true,
    topographicRelief: false,
    evacuationRoutes: true
  });

  const [mapCenter, setMapCenter] = useState<[number, number]>([30.6500, 79.0300]);
  const [mapZoom, setMapZoom] = useState<number>(11);
  const [loading, setLoading] = useState<boolean>(true);
  const [demoModalOpen, setDemoModalOpen] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>(new Date().toISOString());

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toISOString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all Command Center data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        ovRes,
        tlRes,
        trRes,
        shRes,
        wsList,
        sensorsRes,
        watershedsRes,
        riskZonesRes,
        sheltersRes,
        reportsRes,
        alertsRes
      ] = await Promise.all([
        apiService.getCommandCenterOverview(),
        apiService.getIncidentTimeline(30, selectedDistrict !== 'ALL' ? selectedDistrict : undefined, selectedWatershedId, selectedRiskLevel !== 'ALL' ? selectedRiskLevel : undefined),
        apiService.getCommandCenterTrends(selectedWatershedId, timeWindow),
        apiService.getCommandCenterSensorHealth(),
        apiService.getWatersheds(),
        apiService.getMapSensors().catch(() => null),
        apiService.getMapWatersheds().catch(() => null),
        apiService.getMapRiskZones().catch(() => null),
        apiService.getMapEvacuationCenters().catch(() => null),
        apiService.getMapCitizenReports().catch(() => null),
        apiService.getMapAlerts().catch(() => null)
      ]);

      setOverview(ovRes);
      setTimeline(tlRes);
      setTrends(trRes);
      setSensorHealth(shRes);
      setWatersheds(wsList);

      if (sensorsRes) setSensorGeoJSON(sensorsRes);
      if (watershedsRes) setWatershedGeoJSON(watershedsRes);
      if (riskZonesRes) setRiskZoneGeoJSON(riskZonesRes);
      if (sheltersRes) setShelterGeoJSON(sheltersRes);
      if (reportsRes) setReportsGeoJSON(reportsRes);
      if (alertsRes) setAlertGeoJSON(alertsRes);
    } catch (err) {
      console.error('Failed to load command center telemetry:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedWatershedId, selectedDistrict, selectedRiskLevel, timeWindow]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle watershed selection
  const handleSelectWatershed = (wsId?: number) => {
    setSelectedWatershedId(wsId);
    if (wsId) {
      const target = watersheds.find(w => w.id === wsId);
      if (target) {
        // Center on watershed area (approx coordinates)
        setMapCenter([30.7346 - (wsId * 0.05), 79.0669 - (wsId * 0.03)]);
        setMapZoom(12);
      }
    } else {
      setMapCenter([30.6500, 79.0300]);
      setMapZoom(11);
    }
  };

  // GeoJSON Styling for Watersheds
  const getWatershedStyle = (feature: any) => {
    const risk = feature.properties?.risk_level || 'LOW';
    let color = '#10b981';
    if (risk === 'CRITICAL') color = '#ef4444';
    else if (risk === 'HIGH') color = '#f97316';
    else if (risk === 'MODERATE') color = '#f59e0b';

    return {
      fillColor: color,
      weight: 2,
      opacity: 0.9,
      color: color,
      fillOpacity: layers.topographicRelief ? 0.35 : 0.22,
      dashArray: '4, 4'
    };
  };

  // GeoJSON Styling for Risk Zones
  const getRiskZoneStyle = (feature: any) => {
    const risk = feature.properties?.risk_category || 'MODERATE';
    let color = '#ef4444';
    if (risk === 'HIGH') color = '#f97316';
    else if (risk === 'MODERATE') color = '#f59e0b';

    return {
      fillColor: color,
      weight: 1.5,
      opacity: 0.8,
      color: color,
      fillOpacity: 0.28
    };
  };

  const getThreatBadge = (threat: string = 'DEFCON 4 (NORMAL)') => {
    if (threat.includes('DEFCON 1')) {
      return {
        label: 'DEFCON 1 • CRITICAL EMERGENCY',
        cls: 'bg-red-950/90 border-red-500 text-red-300 ring-2 ring-red-500/50 animate-pulse'
      };
    } else if (threat.includes('DEFCON 2')) {
      return {
        label: 'DEFCON 2 • SEVERE FLOOD RISK',
        cls: 'bg-orange-950/90 border-orange-500 text-orange-300 ring-1 ring-orange-500/50'
      };
    } else if (threat.includes('DEFCON 3')) {
      return {
        label: 'DEFCON 3 • ELEVATED WATCH',
        cls: 'bg-amber-950/90 border-amber-500 text-amber-300'
      };
    }
    return {
      label: 'DEFCON 4 • NORMAL OPERATIONS',
      cls: 'bg-emerald-950/90 border-emerald-500 text-emerald-300'
    };
  };

  const threatBadge = getThreatBadge(overview?.threat_level);

  return (
    <div className="space-y-4 pb-8">
      {/* Top System Status Bar */}
      <div className="bg-gradient-to-r from-[#171347] via-[#2a1352] to-[#451052] text-white border border-purple-900/40 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        {/* Threat Level Badge */}
        <div className="flex items-center gap-3.5">
          <span className="p-3 rounded-xl bg-white/10 text-cyan-300 border border-white/15 shadow-inner">
            <Radio className="w-6 h-6 animate-pulse" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider border ${threatBadge.cls}`}>
                {threatBadge.label}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 border border-white/20 text-white">
                Disaster Control Room
              </span>
            </div>
            <div className="text-xs text-slate-300 mt-1 flex items-center gap-2">
              <span>Readiness: <strong className="text-emerald-400">{overview?.system_readiness_pct || 98.4}%</strong></span>
              <span>•</span>
              <span>Telemetry Pings: <strong className="text-cyan-300">Active Real-Time Ingestion</strong></span>
            </div>
          </div>
        </div>

        {/* Clocks & Controls */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="bg-black/30 border border-white/10 rounded-xl px-3.5 py-2 text-slate-200">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Local IST Clock</div>
            <div className="font-bold text-amber-300 mt-0.5">
              {new Date(currentTime).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
            </div>
          </div>

          <div className="bg-black/30 border border-white/10 rounded-xl px-3.5 py-2 text-slate-200">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">UTC Military Time</div>
            <div className="font-bold text-cyan-300 mt-0.5">
              {new Date(currentTime).toISOString().substring(11, 19)}Z
            </div>
          </div>

          <button
            onClick={() => setDemoModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-950/40 transition active:scale-95 animate-pulse"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>START FLOOD DEMO</span>
          </button>

          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white disabled:opacity-50 transition"
            title="Force Full Sensor Health Sync"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-300' : ''}`} />
          </button>
        </div>
      </div>

      <DemoControlModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
      />

      {/* 8 Control Room KPI Cards Row (Clean White Cards matching Screenshot 2) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        
        {/* Active Emergencies */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Emergencies</span>
            <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <Flame className="w-4 h-4 animate-bounce" />
            </span>
          </div>
          <div className="text-3xl font-black text-rose-600 mt-2">
            {overview?.active_emergencies || 0}
          </div>
        </div>

        {/* Critical Watersheds */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Critical Basins</span>
            <span className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-black text-orange-600 mt-2">
            {overview?.critical_watersheds || 0}
          </div>
        </div>

        {/* High Risk Zones */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">High Risk Zones</span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <ShieldAlert className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-black text-amber-600 mt-2">
            {overview?.high_risk_zones || 0}
          </div>
        </div>

        {/* Active Alerts */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Alerts</span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Volume2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-black text-blue-600 mt-2">
            {overview?.active_alerts || 0}
          </div>
        </div>

        {/* Online Sensors */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Online Sensors</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <Radio className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-black text-emerald-600 mt-2">
            {overview?.online_sensors || 0}
          </div>
        </div>

        {/* Offline Sensors */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Offline Sensors</span>
            <span className="p-1.5 bg-slate-100 text-slate-600 rounded-lg">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-black text-slate-700 mt-2">
            {overview?.offline_sensors || 0}
          </div>
        </div>

        {/* Citizen Reports */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Citizen Reports</span>
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-black text-indigo-600 mt-2">
            {overview?.citizen_reports || 0}
          </div>
        </div>

        {/* People at Risk */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pop. at Risk</span>
            <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-purple-600 mt-2 truncate">
            {overview?.people_at_risk?.toLocaleString() || '1,420'}
          </div>
        </div>

      </div>

      {/* Main 3-Pane Command Room Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* LEFT PANE: Filters & Switchboard (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Watershed Quick Selection List */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm text-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-blue-600" /> Catchment Selector
              </h3>
              {selectedWatershedId && (
                <button
                  onClick={() => handleSelectWatershed(undefined)}
                  className="text-[11px] text-blue-600 font-semibold hover:underline"
                >
                  All Basins
                </button>
              )}
            </div>

            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 text-xs">
              <button
                onClick={() => handleSelectWatershed(undefined)}
                className={`w-full text-left px-3 py-2 rounded-xl transition flex items-center justify-between ${
                  selectedWatershedId === undefined 
                    ? 'bg-blue-50 border border-blue-500 text-blue-700 font-bold shadow-xs' 
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60'
                }`}
              >
                <span>All Catchments (Unified View)</span>
                <span className="text-[10px] text-slate-500 font-semibold">{watersheds.length}</span>
              </button>

              {watersheds.map((ws) => {
                const isSelected = selectedWatershedId === ws.id;
                const risk = ws.risk_level || 'LOW';
                return (
                  <button
                    key={ws.id}
                    onClick={() => handleSelectWatershed(ws.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl transition flex items-center justify-between border ${
                      isSelected 
                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold shadow-xs' 
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-700'
                    }`}
                  >
                    <span className="truncate font-medium">{ws.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      risk === 'CRITICAL' ? 'bg-rose-100 text-rose-700' :
                      risk === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                      risk === 'MODERATE' ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {risk}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Operational Filter Deck */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-3 text-xs text-slate-800">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-blue-600" /> Control Room Filters
            </h3>

            <div>
              <label className="text-[11px] text-slate-500 block mb-1 font-bold">District Hierarchy</label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Districts (Uttarakhand)</option>
                <option value="Rudraprayag">Rudraprayag District</option>
                <option value="Chamoli">Chamoli District</option>
                <option value="Uttarkashi">Uttarkashi District</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-500 block mb-1 font-bold">Risk Filter Threshold</label>
              <select
                value={selectedRiskLevel}
                onChange={(e) => setSelectedRiskLevel(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Risk Severities</option>
                <option value="CRITICAL">CRITICAL Only</option>
                <option value="HIGH">HIGH & Above</option>
                <option value="MODERATE">MODERATE & Above</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-500 block mb-1 font-bold">Trend Window</label>
              <div className="grid grid-cols-3 gap-1">
                {['12h', '24h', '7d'].map((tw) => (
                  <button
                    key={tw}
                    onClick={() => setTimeWindow(tw)}
                    className={`py-1.5 rounded-lg border font-bold text-xs ${
                      timeWindow === tw 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {tw}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Map Layer Switchboard */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-2.5 text-xs text-slate-800">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Layers className="w-4 h-4 text-emerald-600" /> Layer Switchboard
            </h3>

            {[
              { id: 'sensors', label: 'IoT Sensor Nodes', count: overview?.online_sensors },
              { id: 'watersheds', label: 'Watershed Catchment Polygons', count: watersheds.length },
              { id: 'riskZones', label: 'Calculated Flood Risk Zones', count: overview?.high_risk_zones },
              { id: 'alerts', label: 'Geo-Fenced Alert Buffers', count: overview?.active_alerts },
              { id: 'shelters', label: 'Safe Evacuation Shelters' },
              { id: 'reports', label: 'Citizen Verified Hazards', count: overview?.citizen_reports },
              { id: 'topographicRelief', label: '3D / Topo Relief Mode', is3D: true }
            ].map((ly: any) => (
              <label key={ly.id} className="flex items-center justify-between text-slate-700 cursor-pointer hover:text-slate-900 transition font-medium p-1 rounded hover:bg-slate-50">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={(layers as any)[ly.id]}
                    onChange={(e) => setLayers({ ...layers, [ly.id]: e.target.checked })}
                    className="rounded bg-slate-100 border-slate-300 text-blue-600 focus:ring-0"
                  />
                  {ly.label}
                  {ly.is3D && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-100 text-amber-800 font-bold border border-amber-200">
                      3D DEM
                    </span>
                  )}
                </span>
                {ly.count !== undefined && (
                  <span className="text-[10px] font-mono text-slate-500 font-bold">{ly.count}</span>
                )}
              </label>
            ))}
          </div>

        </div>

        {/* CENTER PANE: Large Live GIS Map (6 cols) */}
        <div className="lg:col-span-6 space-y-3">
          
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm relative">
            
            {/* Map Header Overlay */}
            <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="font-bold text-slate-900 uppercase tracking-wider">Live GIS Disaster Situation Map</span>
              </div>
              <div className="flex items-center gap-3 text-slate-500 font-mono text-[11px] font-semibold">
                <span>Coords: {mapCenter[0].toFixed(3)}°N, {mapCenter[1].toFixed(3)}°E</span>
                <span>Zoom: {mapZoom}x</span>
              </div>
            </div>

            {/* Map Container */}
            <div className="h-[520px] w-full relative">
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
              >
                {/* Tile Layer with Topographic style switch */}
                {layers.topographicRelief ? (
                  <TileLayer
                    attribution='&copy; OpenTopoMap contributors'
                    url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                  />
                ) : (
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                )}

                <MapController center={mapCenter} zoom={mapZoom} />

                {/* Watershed Polygons */}
                {layers.watersheds && watershedGeoJSON && (
                  <GeoJSON
                    data={watershedGeoJSON as any}
                    style={getWatershedStyle}
                    onEachFeature={(feature, layer) => {
                      layer.bindPopup(`
                        <div style="color: #0f172a; font-family: sans-serif; min-width: 180px;">
                          <div style="font-weight: bold; font-size: 13px;">${feature.properties?.name}</div>
                          <div style="font-size: 11px; margin-top: 4px;">Risk: <strong>${feature.properties?.risk_level}</strong></div>
                          <div style="font-size: 11px;">District: ${feature.properties?.district}</div>
                          <div style="font-size: 11px;">Slope: ${feature.properties?.average_slope_deg || 24}°</div>
                        </div>
                      `);
                    }}
                  />
                )}

                {/* Risk Zones */}
                {layers.riskZones && riskZoneGeoJSON && (
                  <GeoJSON
                    data={riskZoneGeoJSON as any}
                    style={getRiskZoneStyle}
                  />
                )}

                {/* Sensor Markers */}
                {layers.sensors && sensorGeoJSON?.features.map((feature: any, idx: number) => {
                  const coords = feature.geometry.coordinates;
                  const p = feature.properties;
                  return (
                    <Marker
                      key={`s-${idx}`}
                      position={[coords[1], coords[0]]}
                      icon={createCommandSensorIcon(p.sensor_type, p.status)}
                    >
                      <Popup>
                        <div className="p-1 text-slate-900 text-xs">
                          <div className="font-bold text-sm text-blue-600">{p.name}</div>
                          <div>Type: {p.sensor_type}</div>
                          <div>Status: <strong>{p.status}</strong></div>
                          <div>Reading: {p.latest_reading?.value || 'N/A'} {p.latest_reading?.unit || ''}</div>
                          <div>Battery: {p.battery_level}%</div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

                {/* Evacuation Centers */}
                {layers.shelters && shelterGeoJSON?.features.map((feature: any, idx: number) => {
                  const coords = feature.geometry.coordinates;
                  const p = feature.properties;
                  return (
                    <Marker
                      key={`sh-${idx}`}
                      position={[coords[1], coords[0]]}
                      icon={createShelterIcon()}
                    >
                      <Popup>
                        <div className="p-1 text-slate-900 text-xs">
                          <div className="font-bold text-emerald-700">{p.name}</div>
                          <div>Capacity: {p.capacity}</div>
                          <div>Occupancy: {p.current_occupancy}</div>
                          <div>Beds Free: <strong>{p.capacity - (p.current_occupancy || 0)}</strong></div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

                {/* Citizen Reports */}
                {layers.reports && reportsGeoJSON?.features.map((feature: any, idx: number) => {
                  const coords = feature.geometry.coordinates;
                  const p = feature.properties;
                  return (
                    <Marker
                      key={`rp-${idx}`}
                      position={[coords[1], coords[0]]}
                      icon={createReportIcon(p.verification_status)}
                    >
                      <Popup>
                        <div className="p-1 text-slate-900 text-xs">
                          <div className="font-bold text-red-600">{p.report_type}</div>
                          <div>{p.description}</div>
                          <div>Status: <strong>{p.verification_status}</strong></div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

                {/* Geo-Fenced Alert Buffers */}
                {layers.alerts && alertGeoJSON?.features.map((feature: any, idx: number) => {
                  const coords = feature.geometry.coordinates;
                  const p = feature.properties;
                  return (
                    <Circle
                      key={`al-${idx}`}
                      center={[coords[1], coords[0]]}
                      radius={(p.radius_km || 2) * 1000}
                      pathOptions={{
                        color: p.severity === 'EMERGENCY' ? '#ef4444' : '#f59e0b',
                        fillColor: p.severity === 'EMERGENCY' ? '#ef4444' : '#f59e0b',
                        fillOpacity: 0.25,
                        weight: 2
                      }}
                    >
                      <Popup>
                        <div className="p-1 text-slate-900 text-xs">
                          <div className="font-bold text-red-600">{p.severity} Alert</div>
                          <div>{p.title}</div>
                          <div>{p.message}</div>
                        </div>
                      </Popup>
                    </Circle>
                  );
                })}

              </MapContainer>

              {/* Map Floating HUD status */}
              <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 border border-slate-200 rounded-xl px-3 py-2 text-[11px] text-slate-800 backdrop-blur-md flex items-center gap-3 shadow-md">
                <span className="flex items-center gap-1.5 font-bold text-blue-600">
                  <Activity className="w-3.5 h-3.5" /> Sensor Grid Sync
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-emerald-600 font-mono font-bold">100% Data Integrity</span>
              </div>
            </div>
          </div>

          {/* Synchronized Trend Charts Box */}
          {trends && trends.series && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm text-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-blue-600" /> Multi-Metric Trend Streams ({trends.watershed_name})
                </h4>
                <div className="flex items-center gap-4 text-[10px] text-slate-500 font-semibold">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-blue-500"></span> Rain (mm)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-cyan-500"></span> River (m)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-amber-500"></span> Soil (%)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-red-500"></span> Risk Index
                  </span>
                </div>
              </div>

              {/* Mini Multi-Bar Timeline Chart */}
              <div className="h-28 flex items-end gap-1 pt-3 pb-1 border-b border-slate-100">
                {trends.series.map((pt, idx) => {
                  const riskHeight = Math.max(10, Math.min(100, pt.risk_score));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                      <div 
                        style={{ height: `${riskHeight}%` }}
                        className={`w-full rounded-t transition ${
                          pt.risk_score >= 75 ? 'bg-red-500 group-hover:bg-red-600' :
                          pt.risk_score >= 50 ? 'bg-orange-500 group-hover:bg-orange-600' :
                          pt.risk_score >= 25 ? 'bg-amber-500 group-hover:bg-amber-600' :
                          'bg-cyan-500 group-hover:bg-cyan-600'
                        }`}
                      ></div>
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-12 z-20 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-[10px] text-white whitespace-nowrap pointer-events-none shadow-xl">
                        <div>Rain: {pt.rainfall_mm} mm | River: {pt.river_level_m} m</div>
                        <div>Soil: {pt.soil_moisture_pct}% | Risk: {pt.risk_score}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono font-medium">
                <span>{timeWindow} ago</span>
                <span>Hydrological Correlation Window</span>
                <span>Current (Now)</span>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT PANE: Incident Feed & Telemetry Health (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Tab Switcher */}
          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-1.5 flex items-center gap-1 shadow-xs">
            <button
              onClick={() => setActiveRightTab('timeline')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeRightTab === 'timeline' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" /> Incident Timeline ({timeline.length})
            </button>
            <button
              onClick={() => setActiveRightTab('health')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeRightTab === 'health' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Radio className="w-3.5 h-3.5" /> Sensor Health
            </button>
          </div>

          {/* Tab 1: Live Incident Timeline */}
          {activeRightTab === 'timeline' && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm text-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600" /> Chronological Feed
                </h4>
                <span className="text-[10px] text-slate-400 font-semibold">Live Auto-Ingest</span>
              </div>

              <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
                {timeline.map((evt) => {
                  const isCrit = evt.severity === 'CRITICAL' || evt.severity === 'EMERGENCY';
                  return (
                    <div 
                      key={evt.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isCrit ? 'bg-rose-100 text-rose-700' :
                          evt.severity === 'HIGH' || evt.severity === 'WARNING' ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {evt.severity}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 font-medium">
                          {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>

                      <div className="font-bold text-slate-900 leading-snug">
                        {evt.title}
                      </div>

                      <p className="text-slate-600 text-[11px] line-clamp-2 leading-relaxed font-normal">
                        {evt.description}
                      </p>

                      <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200 font-medium">
                        <span>{evt.location_name}</span>
                        <span className="text-blue-600 font-bold">{evt.source}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: Sensor Health & Telemetry Audit */}
          {activeRightTab === 'health' && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-3 text-slate-800">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-emerald-600" /> Sensor Telemetry Audit
                </h4>
                <span className="text-[10px] text-emerald-700 font-bold font-mono bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {sensorHealth?.online_count}/{sensorHealth?.total_sensors} Online
                </span>
              </div>

              {/* Warning Badges */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                  <div className="text-[10px] text-slate-500 font-medium">Battery &lt; 25%</div>
                  <div className="text-lg font-black text-amber-700">{sensorHealth?.battery_warnings_count || 0}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
                  <div className="text-[10px] text-slate-500 font-medium">Signal Warnings</div>
                  <div className="text-lg font-black text-rose-700">{sensorHealth?.signal_warnings_count || 0}</div>
                </div>
              </div>

              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {sensorHealth?.sensors.map((s) => (
                  <div 
                    key={s.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 truncate">{s.name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        s.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {s.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                      <div className="flex items-center gap-1 font-medium">
                        <Battery className={`w-3.5 h-3.5 ${s.has_battery_warning ? 'text-amber-500' : 'text-emerald-500'}`} />
                        <span>{s.battery_level}%</span>
                      </div>
                      <div className="flex items-center gap-1 font-medium">
                        <Wifi className={`w-3.5 h-3.5 ${s.has_signal_warning ? 'text-rose-500' : 'text-blue-500'}`} />
                        <span>{s.signal_strength}%</span>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono">
                      Last Seen: {s.last_communication ? new Date(s.last_communication).toLocaleTimeString() : 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
