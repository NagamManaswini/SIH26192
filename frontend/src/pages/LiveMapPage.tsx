import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Layers, 
  RefreshCw, 
  ShieldAlert, 
  Radio, 
  Battery, 
  Wifi, 
  Home, 
  AlertTriangle, 
  Info, 
  Clock,
  Compass
} from 'lucide-react';

import { apiService } from '../services/api';
import { RiskExplanationModal } from '../components/RiskExplanationModal';
import { 
  GeoJSONFeatureCollection, 
  MapSensorProperties, 
  MapWatershedProperties, 
  MapRiskZoneProperties, 
  MapEvacuationCenterProperties, 
  MapCitizenReportProperties, 
  MapAlertProperties 
} from '../types';

// Helper component to adjust map view programmatically
interface MapControllerProps {
  center: [number, number];
  zoom: number;
}

const MapController: React.FC<MapControllerProps> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
};

// Create custom Leaflet DivIcons for sensors
const createSensorIcon = (sensorType: string, status: string, valueStr?: string) => {
  let bgColor = '#0284c7'; // Blue
  let borderColor = '#38bdf8';
  let iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/></svg>`;

  if (sensorType === 'RIVER_LEVEL') {
    bgColor = '#0891b2'; // Cyan
    borderColor = '#22d3ee';
    iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>`;
  } else if (sensorType === 'SOIL_MOISTURE') {
    bgColor = '#d97706'; // Amber
    borderColor = '#fbbf24';
    iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`;
  } else if (sensorType === 'WEATHER') {
    bgColor = '#7c3aed'; // Violet
    borderColor = '#a78bfa';
    iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>`;
  } else if (sensorType === 'MULTI_SENSOR') {
    bgColor = '#059669'; // Emerald
    borderColor = '#34d399';
    iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>`;
  }

  // Status modifiers
  let statusBadge = '';
  let pulseRing = '';
  if (status === 'ACTIVE') {
    statusBadge = `<span class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border border-slate-900 rounded-full"></span>`;
    pulseRing = `<div class="absolute inset-0 rounded-full animate-ping opacity-25" style="background-color: ${borderColor}"></div>`;
  } else if (status === 'OFFLINE') {
    bgColor = '#475569';
    borderColor = '#ef4444';
    statusBadge = `<span class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 border border-slate-900 rounded-full"></span>`;
  } else if (status === 'MAINTENANCE') {
    borderColor = '#f59e0b';
    statusBadge = `<span class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 border border-slate-900 rounded-full"></span>`;
  }

  const html = `
    <div class="relative flex items-center justify-center cursor-pointer group" style="width: 36px; height: 36px;">
      ${pulseRing}
      <div class="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg transition-transform transform group-hover:scale-110" style="background-color: ${bgColor}; border: 2px solid ${borderColor}; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
        ${iconSvg}
      </div>
      ${statusBadge}
      ${valueStr ? `<div class="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-700/80 text-[10px] font-mono text-cyan-300 pointer-events-none shadow">${valueStr}</div>` : ''}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-sensor-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
};

// Evacuation Center Icon
const createEvacuationIcon = (occupancyRate: number) => {
  const isHigh = occupancyRate >= 85;
  const isFull = occupancyRate >= 100;
  const bg = isFull ? '#ef4444' : isHigh ? '#f59e0b' : '#10b981';

  const html = `
    <div class="relative flex items-center justify-center cursor-pointer group" style="width: 34px; height: 34px;">
      <div class="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-lg transition-transform transform group-hover:scale-110" style="background-color: ${bg}; border: 2px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      </div>
      <span class="absolute -top-1 -right-1 px-1 py-0.2 bg-slate-900 text-white text-[9px] font-bold rounded-full border border-slate-600">${occupancyRate}%</span>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-evacuation-marker',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
};

// Citizen Report Icon
const createCitizenReportIcon = (_reportType: string, verified: boolean) => {
  const bg = verified ? '#f97316' : '#64748b';
  const html = `
    <div class="relative flex items-center justify-center cursor-pointer group" style="width: 32px; height: 32px;">
      <div class="w-6 h-6 rounded-full flex items-center justify-center text-white shadow-lg transition-transform transform group-hover:scale-110" style="background-color: ${bg}; border: 2px solid #fdba74; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/></svg>
      </div>
      ${verified ? `<span class="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border border-slate-900 rounded-full"></span>` : ''}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-citizen-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

// Alert Icon
const createAlertIcon = (severity: string) => {
  const bg = severity === 'CRITICAL' ? '#ef4444' : '#f59e0b';
  const html = `
    <div class="relative flex items-center justify-center cursor-pointer" style="width: 38px; height: 38px;">
      <div class="absolute inset-0 rounded-full animate-ping opacity-40" style="background-color: ${bg};"></div>
      <div class="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg" style="background-color: ${bg}; border: 2px solid #ffffff; box-shadow: 0 4px 14px rgba(0,0,0,0.6);">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-alert-marker',
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20],
  });
};

export const LiveMapPage: React.FC = () => {
  // Map Layer States
  const [sensorsData, setSensorsData] = useState<GeoJSONFeatureCollection<MapSensorProperties> | null>(null);
  const [watershedsData, setWatershedsData] = useState<GeoJSONFeatureCollection<MapWatershedProperties> | null>(null);
  const [riskZonesData, setRiskZonesData] = useState<GeoJSONFeatureCollection<MapRiskZoneProperties> | null>(null);
  const [evacuationData, setEvacuationData] = useState<GeoJSONFeatureCollection<MapEvacuationCenterProperties> | null>(null);
  const [citizenReportsData, setCitizenReportsData] = useState<GeoJSONFeatureCollection<MapCitizenReportProperties> | null>(null);
  const [alertsData, setAlertsData] = useState<GeoJSONFeatureCollection<MapAlertProperties> | null>(null);

  // Map View State & Layer Visibility Controls
  const [mapCenter, setMapCenter] = useState<[number, number]>([30.6500, 79.0300]);
  const [mapZoom, setMapZoom] = useState<number>(11);
  const [selectedBasemap, setSelectedBasemap] = useState<'osm' | 'topo' | 'esri'>('osm');

  const [showSensors, setShowSensors] = useState(true);
  const [showWatersheds, setShowWatersheds] = useState(true);
  const [showRiskZones, setShowRiskZones] = useState(true);
  const [showEvacuation, setShowEvacuation] = useState(true);
  const [showCitizenReports, setShowCitizenReports] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);

  // Sensor sub-filters
  const [sensorTypeFilter, setSensorTypeFilter] = useState<string>('ALL');
  const [selectedWatershedId, setSelectedWatershedId] = useState<number | null>(null);

  // Expose modal trigger globally for Leaflet popup HTML strings
  useEffect(() => {
    (window as any).__openRiskModal = (id: number) => {
      setSelectedWatershedId(id);
    };
    return () => {
      delete (window as any).__openRiskModal;
    };
  }, []);

  // Real-time WebSocket connection state
  const [wsConnected, setWsConnected] = useState(false);
  const [lastLiveEvent, setLastLiveEvent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all GIS Map datasets + Explainable Risk Engine Live Calculations
  const fetchMapData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [sensorsRes, watershedsRes, riskZonesRes, evacRes, citizenRes, alertsRes, riskMatrix] = await Promise.all([
        apiService.getMapSensors(),
        apiService.getMapWatersheds(),
        apiService.getMapRiskZones(),
        apiService.getMapEvacuationCenters(),
        apiService.getMapCitizenReports(),
        apiService.getMapAlerts(),
        apiService.getAllWatershedsRisk().catch(() => []),
      ]);

      // Merge live explainable risk levels into watershed properties
      if (watershedsRes && riskMatrix && riskMatrix.length > 0) {
        const riskMap = new Map(riskMatrix.map((r) => [r.watershed_id, r]));
        watershedsRes.features = watershedsRes.features.map((f) => {
          const evalItem = riskMap.get(f.properties.id);
          if (evalItem) {
            return {
              ...f,
              properties: {
                ...f.properties,
                risk_level: evalItem.risk_level as any,
                risk_score: evalItem.risk_score,
              }
            };
          }
          return f;
        });
      }

      setSensorsData(sensorsRes);
      setWatershedsData(watershedsRes);
      setRiskZonesData(riskZonesRes);
      setEvacuationData(evacRes);
      setCitizenReportsData(citizenRes);
      setAlertsData(alertsRes);
    } catch (err) {
      console.error('Failed to load GIS map data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMapData();
  }, [fetchMapData]);

  // Real-time WebSocket Synchronization
  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.hostname || 'localhost';
    const wsUrl = `${wsProtocol}//${wsHost}:8000/ws/sensors`;

    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWebSocket = () => {
      try {
        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          setWsConnected(true);
          console.log('[GIS MAP] Connected to real-time WebSocket telemetry stream.');
        };

        socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            if (message.event === 'sensor_reading' && message.data) {
              const reading = message.data;
              setLastLiveEvent(`${reading.sensor_code}: ${reading.reading_type} updated`);

              // Update sensor in map state dynamically
              setSensorsData((prev) => {
                if (!prev) return prev;
                const updatedFeatures = prev.features.map((f) => {
                  if (f.properties.id === reading.sensor_id || f.properties.sensor_code === reading.sensor_code) {
                    return {
                      ...f,
                      properties: {
                        ...f.properties,
                        battery_level: reading.battery_level ?? f.properties.battery_level,
                        signal_strength: reading.signal_strength ?? f.properties.signal_strength,
                        last_seen: reading.timestamp ?? new Date().toISOString(),
                        latest_reading: {
                          value: reading.rainfall_mm ?? reading.water_level_m ?? reading.moisture_percentage ?? f.properties.latest_reading?.value ?? 0,
                          unit: reading.rainfall_mm !== undefined ? 'mm/hr' : reading.water_level_m !== undefined ? 'm' : '%',
                          param: reading.reading_type ?? 'Telemetry',
                          timestamp: reading.timestamp ?? new Date().toISOString(),
                        },
                      },
                    };
                  }
                  return f;
                });
                return { ...prev, features: updatedFeatures };
              });
            }
          } catch (e) {
            console.error('Error parsing live WebSocket message:', e);
          }
        };

        socket.onclose = () => {
          setWsConnected(false);
          reconnectTimeout = setTimeout(connectWebSocket, 4000);
        };

        socket.onerror = (err) => {
          console.warn('GIS WebSocket encountered error:', err);
          socket?.close();
        };
      } catch (err) {
        console.error('Failed to create WebSocket client:', err);
      }
    };

    connectWebSocket();

    return () => {
      if (socket) socket.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  // Filtered Sensors based on selection
  const filteredSensors = useMemo(() => {
    if (!sensorsData) return [];
    return sensorsData.features.filter((f) => {
      if (sensorTypeFilter === 'ALL') return true;
      return f.properties.sensor_type === sensorTypeFilter;
    });
  }, [sensorsData, sensorTypeFilter]);

  // Watershed Polygon Style Resolver
  const getWatershedStyle = (feature: any) => {
    const risk = feature?.properties?.risk_level || 'LOW';
    let fillColor = '#10B981'; // LOW Emerald
    let borderColor = '#34D399';
    let fillOpacity = 0.25;

    if (risk === 'MODERATE') {
      fillColor = '#F59E0B'; // Amber
      borderColor = '#FBBF24';
      fillOpacity = 0.35;
    } else if (risk === 'HIGH') {
      fillColor = '#F97316'; // Orange
      borderColor = '#FB923C';
      fillOpacity = 0.45;
    } else if (risk === 'CRITICAL') {
      fillColor = '#EF4444'; // Red
      borderColor = '#F87171';
      fillOpacity = 0.55;
    }

    return {
      fillColor,
      weight: 2,
      opacity: 0.9,
      color: borderColor,
      dashArray: '4, 4',
      fillOpacity,
    };
  };

  // Preset Valley Views
  const quickJump = (target: 'mandakini' | 'alaknanda' | 'beas' | 'all') => {
    if (target === 'mandakini') {
      setMapCenter([30.68, 79.05]);
      setMapZoom(11);
    } else if (target === 'alaknanda') {
      setMapCenter([30.55, 79.56]);
      setMapZoom(11);
    } else if (target === 'beas') {
      setMapCenter([32.05, 77.20]);
      setMapZoom(10);
    } else {
      setMapCenter([31.0, 78.5]);
      setMapZoom(8);
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-4.5rem)] flex flex-col bg-[#f8fafc] text-slate-900 overflow-hidden">
      
      {/* Top GIS Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-white border-b border-slate-200 shadow-xs z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-2">
              Interactive GIS Flood Risk Map
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Leaflet Engine
              </span>
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block font-normal">
              GeoJSON watershed catchments, sensor telemetry, evacuation zones, and crowd reports
            </p>
          </div>
        </div>

        {/* Real-time sync & Quick Valleys */}
        <div className="flex items-center gap-2.5">
          {/* Status beacon */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700">
            <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-blue-600 animate-ping' : 'bg-amber-500'}`} />
            <span className="text-[11px] font-mono">
              {wsConnected ? 'STREAMING LIVE' : 'SYNCING...'}
            </span>
          </div>

          {/* Quick Valley Jumps */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-500 px-1.5 text-[11px] font-bold">Valley:</span>
            <button 
              onClick={() => quickJump('mandakini')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white hover:bg-blue-600 hover:text-white transition text-slate-700 shadow-xs"
            >
              Mandakini
            </button>
            <button 
              onClick={() => quickJump('alaknanda')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white hover:bg-blue-600 hover:text-white transition text-slate-700 shadow-xs"
            >
              Alaknanda
            </button>
            <button 
              onClick={() => quickJump('beas')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white hover:bg-blue-600 hover:text-white transition text-slate-700 shadow-xs"
            >
              Beas (HP)
            </button>
            <button 
              onClick={() => quickJump('all')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white hover:bg-slate-200 transition text-slate-600 shadow-xs"
            >
              Fit All
            </button>
          </div>

          {/* Basemap Switcher */}
          <select 
            value={selectedBasemap}
            onChange={(e) => setSelectedBasemap(e.target.value as any)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 font-medium shadow-xs"
          >
            <option value="osm">Standard OpenStreetMap (Clear)</option>
            <option value="topo">Topographic Contours (OpenTopoMap)</option>
            <option value="esri">Esri High-Resolution Topography</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={fetchMapData}
            disabled={isLoading}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition shadow-xs"
            title="Refresh All Map Layers"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Map Container & Overlays */}
      <div className="relative flex-1 w-full h-full min-h-[600px] rounded-2xl overflow-hidden shadow-md border border-slate-200">

        {/* Leaflet Map */}
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={true}
          className="w-full h-full z-0"
        >
          <MapController center={mapCenter} zoom={mapZoom} />

          {/* Tile Layer based on basemap selection */}
          {selectedBasemap === 'osm' && (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          )}
          {selectedBasemap === 'topo' && (
            <TileLayer
              attribution='&copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              maxZoom={17}
            />
          )}
          {selectedBasemap === 'esri' && (
            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
              maxZoom={18}
            />
          )}

          {/* 1. Watershed Boundaries GeoJSON Layer */}
          {showWatersheds && watershedsData && (
            <GeoJSON
              key={`watersheds-${watershedsData.features.length}`}
              data={watershedsData as any}
              style={getWatershedStyle}
              onEachFeature={(feature, layer) => {
                const props: MapWatershedProperties = feature.properties;
                const riskBadgeColor = 
                  props.risk_level === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border-rose-600' :
                  props.risk_level === 'HIGH' ? 'bg-orange-950 text-orange-300 border-orange-600' :
                  props.risk_level === 'MODERATE' ? 'bg-amber-950 text-amber-300 border-amber-600' :
                  'bg-emerald-950 text-emerald-300 border-emerald-600';

                const popupHtml = `
                  <div class="p-4 min-w-[260px] text-slate-100 font-sans">
                    <div class="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-700/70">
                      <div>
                        <div class="text-[11px] font-mono text-cyan-400 font-semibold uppercase tracking-wider">${props.code}</div>
                        <div class="text-sm font-bold text-white">${props.name}</div>
                      </div>
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${riskBadgeColor}">${props.risk_level}</span>
                    </div>

                    <div class="space-y-1.5 text-xs text-slate-300">
                      <div class="flex justify-between">
                        <span class="text-slate-400">District / State:</span>
                        <span class="font-medium text-slate-200">${props.district}, ${props.state}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-slate-400">Catchment Area:</span>
                        <span class="font-medium text-slate-200">${props.area_sq_km} km²</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-slate-400">Active Sensors:</span>
                        <span class="font-medium text-cyan-400">${props.sensor_count} units</span>
                      </div>
                    </div>

                    <div class="mt-3 pt-2.5 border-t border-slate-700/60">
                      <div class="text-[11px] font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                        <span>Hydrological Telemetry:</span>
                      </div>
                      <div class="grid grid-cols-3 gap-1.5 text-center">
                        <div class="p-1.5 rounded bg-slate-800/80 border border-slate-700/60">
                          <div class="text-[10px] text-slate-400">Rainfall</div>
                          <div class="text-xs font-bold font-mono text-cyan-400">${props.rainfall_avg_mm} <span class="text-[9px] font-normal">mm/h</span></div>
                        </div>
                        <div class="p-1.5 rounded bg-slate-800/80 border border-slate-700/60">
                          <div class="text-[10px] text-slate-400">River Stage</div>
                          <div class="text-xs font-bold font-mono text-blue-400">${props.river_level_max_m} <span class="text-[9px] font-normal">m</span></div>
                        </div>
                        <div class="p-1.5 rounded bg-slate-800/80 border border-slate-700/60">
                          <div class="text-[10px] text-slate-400">Soil Sat.</div>
                          <div class="text-xs font-bold font-mono text-amber-400">${props.soil_moisture_avg_pct}%</div>
                        </div>
                      </div>
                    </div>

                    ${props.prediction ? `
                      <div class="mt-3 pt-2 border-t border-slate-700/60 text-xs">
                        <div class="text-[11px] font-semibold text-emerald-400 mb-1 flex items-center justify-between">
                          <span>AI Inundation Prediction</span>
                          <span class="text-[10px] text-slate-400 font-mono">${props.prediction.confidence}% conf.</span>
                        </div>
                        <div class="flex justify-between text-slate-300 text-[11px]">
                          <span>Forecast Water Level:</span>
                          <span class="font-mono font-bold text-white">${props.prediction.predicted_water_level}m (${props.prediction.probability}%)</span>
                        </div>
                      </div>
                    ` : ''}

                    ${props.active_alert ? `
                      <div class="mt-2.5 p-2 rounded bg-rose-950/80 border border-rose-700/60 text-xs">
                        <div class="flex items-center gap-1.5 font-bold text-rose-300 text-[11px]">
                          <span>⚠️ ${props.active_alert.title}</span>
                        </div>
                        <p class="text-[10px] text-rose-200/90 mt-1">${props.active_alert.message}</p>
                      </div>
                    ` : ''}

                    <div class="mt-3 pt-2.5 border-t border-slate-700/60">
                      <button 
                        type="button"
                        onclick="window.__openRiskModal && window.__openRiskModal(${props.id})"
                        class="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-900/30 transition transform active:scale-95 cursor-pointer"
                      >
                        <span>🔍 Open Explainable Risk Engine</span>
                      </button>
                    </div>
                  </div>
                `;
                layer.bindPopup(popupHtml, { className: 'custom-leaflet-popup' });
              }}
            />
          )}

          {/* 2. Flood Risk Zones Overlay */}
          {showRiskZones && riskZonesData && (
            <GeoJSON
              key={`risk-zones-${riskZonesData.features.length}`}
              data={riskZonesData as any}
              style={(feature) => ({
                fillColor: feature?.properties?.color || '#ef4444',
                weight: 1.5,
                opacity: 0.8,
                color: '#ffffff',
                fillOpacity: 0.35,
              })}
              onEachFeature={(feature, layer) => {
                const props: MapRiskZoneProperties = feature.properties;
                const popupHtml = `
                  <div class="p-3 text-slate-100 font-sans min-w-[220px]">
                    <div class="flex items-center gap-2 pb-1.5 mb-2 border-b border-slate-700">
                      <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${props.color}"></span>
                      <div class="text-xs font-bold text-white">${props.name}</div>
                    </div>
                    <div class="space-y-1 text-xs text-slate-300">
                      <div class="flex justify-between"><span class="text-slate-400">Risk Tier:</span> <span class="font-bold text-white">${props.risk_level}</span></div>
                      <div class="flex justify-between"><span class="text-slate-400">Expected Flood Depth:</span> <span class="font-mono text-cyan-300 font-bold">${props.expected_depth_m} m</span></div>
                      <div class="flex justify-between"><span class="text-slate-400">Hazard Type:</span> <span class="text-slate-200">${props.hazard_type}</span></div>
                      <div class="mt-2 text-[11px] font-semibold text-rose-400">${props.evacuation_status}</div>
                    </div>
                  </div>
                `;
                layer.bindPopup(popupHtml);
              }}
            />
          )}

          {/* 3. Active Alert Buffer Circles */}
          {showAlerts && alertsData && alertsData.features.map((alert) => {
            const props = alert.properties;
            const radiusMeters = (props.radius_km || 5) * 1000;
            const isCritical = props.severity === 'CRITICAL';
            return (
              <React.Fragment key={`alert-${props.id}`}>
                <Circle
                  center={[props.latitude, props.longitude]}
                  radius={radiusMeters}
                  pathOptions={{
                    color: isCritical ? '#ef4444' : '#f59e0b',
                    fillColor: isCritical ? '#ef4444' : '#f59e0b',
                    fillOpacity: 0.2,
                    weight: 2,
                    dashArray: '6, 6',
                  }}
                />
                <Marker
                  position={[props.latitude, props.longitude]}
                  icon={createAlertIcon(props.severity)}
                >
                  <Popup>
                    <div className="p-3 text-slate-100 min-w-[240px]">
                      <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs mb-1">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{props.severity} ALERT: {props.alert_type}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-white mb-1">{props.title}</h4>
                      <p className="text-xs text-slate-300 mb-2">{props.message}</p>
                      <div className="text-[10px] text-slate-400 flex justify-between">
                        <span>Buffer: {props.radius_km} km</span>
                        <span>Expires: {props.expires_at ? new Date(props.expires_at).toLocaleTimeString() : 'N/A'}</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}

          {/* 4. Evacuation Center Markers */}
          {showEvacuation && evacuationData && evacuationData.features.map((ec) => {
            const props = ec.properties;
            return (
              <Marker
                key={`evac-${props.id}`}
                position={[props.latitude, props.longitude]}
                icon={createEvacuationIcon(props.occupancy_rate)}
              >
                <Popup>
                  <div className="p-3 text-slate-100 min-w-[240px]">
                    <div className="flex items-center gap-2 pb-1.5 mb-2 border-b border-slate-700">
                      <Home className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="text-xs font-bold text-white">{props.name}</div>
                        <div className="text-[10px] text-slate-400">Emergency Shelter</div>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5 text-xs text-slate-300 mb-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Capacity:</span>
                        <span className="font-mono font-bold text-white">{props.current_occupancy} / {props.capacity} Persons</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                        <div 
                          className={`h-full rounded-full ${props.occupancy_rate >= 85 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                          style={{ width: `${Math.min(100, props.occupancy_rate)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Available Spaces:</span>
                        <span className="text-emerald-400 font-bold">{props.available_spaces} remaining</span>
                      </div>
                      {props.contact_number && (
                        <div className="flex justify-between text-[11px] pt-1 border-t border-slate-800">
                          <span className="text-slate-400">Emergency Helplines:</span>
                          <span className="text-cyan-400 font-mono">{props.contact_number}</span>
                        </div>
                      )}
                    </div>

                    {props.facilities && (
                      <div className="p-2 rounded bg-slate-800/80 text-[10px] text-slate-300 border border-slate-700/60">
                        <span className="font-semibold text-slate-200">Amenities: </span>
                        {props.facilities}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* 5. Citizen Reports Markers */}
          {showCitizenReports && citizenReportsData && citizenReportsData.features.map((cr) => {
            const props = cr.properties;
            const isVerified = props.verification_status === 'VERIFIED';
            return (
              <Marker
                key={`report-${props.id}`}
                position={[props.latitude, props.longitude]}
                icon={createCitizenReportIcon(props.report_type, isVerified)}
              >
                <Popup>
                  <div className="p-3 text-slate-100 min-w-[220px]">
                    <div className="flex items-center justify-between gap-1 pb-1.5 mb-2 border-b border-slate-700">
                      <span className="text-xs font-bold text-orange-300 uppercase">{props.report_type.replace(/_/g, ' ')}</span>
                      <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded ${isVerified ? 'bg-emerald-950 text-emerald-400 border border-emerald-700' : 'bg-slate-800 text-slate-400'}`}>
                        {props.verification_status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 mb-2 leading-relaxed">{props.description}</p>
                    {props.image_url && (
                      <div className="mb-2 rounded overflow-hidden border border-slate-700 max-h-28">
                        <img src={props.image_url} alt="Field observation" className="w-full object-cover" />
                      </div>
                    )}
                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Field Ground Truth</span>
                      <span>{props.created_at ? new Date(props.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* 6. Real-Time Telemetry Sensors Markers */}
          {showSensors && filteredSensors.map((sensor) => {
            const props = sensor.properties;
            const readingVal = props.latest_reading?.value;
            const readingUnit = props.latest_reading?.unit || '';
            const valueStr = readingVal !== undefined ? `${readingVal}${readingUnit !== 'multi' ? ` ${readingUnit}` : ''}` : undefined;

            return (
              <Marker
                key={`sensor-${props.id}`}
                position={[props.latitude, props.longitude]}
                icon={createSensorIcon(props.sensor_type, props.status, valueStr)}
              >
                <Popup>
                  <div className="p-3.5 text-slate-100 font-sans min-w-[250px]">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-700/70">
                      <div>
                        <div className="text-[10px] font-mono text-cyan-400 font-bold">{props.sensor_code}</div>
                        <div className="text-xs font-bold text-white line-clamp-1">{props.name}</div>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        props.status === 'ACTIVE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-700' :
                        props.status === 'OFFLINE' ? 'bg-rose-950 text-rose-400 border border-rose-700' :
                        'bg-amber-950 text-amber-400 border border-amber-700'
                      }`}>
                        {props.status}
                      </span>
                    </div>

                    {/* Sensor Type & Watershed */}
                    <div className="space-y-1 text-xs text-slate-300 mb-2.5">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Sensor Type:</span>
                        <span className="text-slate-200 font-medium">{props.sensor_type.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Catchment:</span>
                        <span className="text-cyan-300 font-medium">{props.watershed_name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Elevation:</span>
                        <span className="text-slate-200 font-mono">{props.elevation} m ASL</span>
                      </div>
                    </div>

                    {/* Telemetry Highlight Box */}
                    <div className="p-2.5 rounded-lg bg-slate-800/90 border border-slate-700/70 mb-2.5">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                        {props.latest_reading?.param || 'Current Observation'}
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-bold font-mono text-cyan-400">
                          {readingVal !== undefined ? readingVal : '--'}
                        </span>
                        <span className="text-xs text-slate-300 font-medium">{readingUnit}</span>
                      </div>
                    </div>

                    {/* Diagnostics: Battery & Signal */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Battery className={`w-3.5 h-3.5 ${props.battery_level < 20 ? 'text-rose-400' : 'text-emerald-400'}`} />
                        <span className="font-mono text-[11px]">{Math.round(props.battery_level)}%</span>
                      </div>
                      <div className="flex items-center justify-end gap-1.5 text-slate-300">
                        <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="font-mono text-[11px]">{props.signal_strength} dBm</span>
                      </div>
                    </div>

                    {/* Last Updated Timestamp */}
                    <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {props.last_seen ? new Date(props.last_seen).toLocaleTimeString() : 'N/A'}
                      </span>
                      <span className="text-emerald-400 font-medium">Live Synced</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Floating Layer Controls (Top Left) */}
        <div className="absolute top-4 left-4 z-[1000] w-64 bg-white/95 border border-slate-200 rounded-xl p-3 shadow-xl backdrop-blur-md text-slate-800">
          <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-200">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              GIS Map Layers
            </span>
            <span className="text-[10px] text-slate-500 font-mono font-semibold">
              {filteredSensors.length} Sensors
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            {/* Watersheds Toggle */}
            <label className="flex items-center justify-between p-1.5 rounded hover:bg-slate-100 cursor-pointer">
              <span className="flex items-center gap-2 text-slate-700 font-medium">
                <span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500"></span>
                Watershed Polygons
              </span>
              <input
                type="checkbox"
                checked={showWatersheds}
                onChange={(e) => setShowWatersheds(e.target.checked)}
                className="rounded bg-slate-100 border-slate-300 text-blue-600 focus:ring-0"
              />
            </label>

            {/* Risk Zones Toggle */}
            <label className="flex items-center justify-between p-1.5 rounded hover:bg-slate-100 cursor-pointer">
              <span className="flex items-center gap-2 text-slate-700 font-medium">
                <span className="w-3 h-3 rounded bg-rose-500/30 border border-rose-500"></span>
                Flood Inundation Zones
              </span>
              <input
                type="checkbox"
                checked={showRiskZones}
                onChange={(e) => setShowRiskZones(e.target.checked)}
                className="rounded bg-slate-100 border-slate-300 text-blue-600 focus:ring-0"
              />
            </label>

            {/* Telemetry Sensors Toggle */}
            <label className="flex items-center justify-between p-1.5 rounded hover:bg-slate-100 cursor-pointer">
              <span className="flex items-center gap-2 text-slate-700 font-medium">
                <Radio className="w-3.5 h-3.5 text-blue-600" />
                Live Sensor Telemetry
              </span>
              <input
                type="checkbox"
                checked={showSensors}
                onChange={(e) => setShowSensors(e.target.checked)}
                className="rounded bg-slate-100 border-slate-300 text-blue-600 focus:ring-0"
              />
            </label>

            {/* Sensor Type Sub-filter */}
            {showSensors && (
              <div className="pl-5 pt-1 pb-1">
                <select
                  value={sensorTypeFilter}
                  onChange={(e) => setSensorTypeFilter(e.target.value)}
                  className="w-full text-[11px] bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-700 font-medium focus:outline-none"
                >
                  <option value="ALL">All Sensor Types</option>
                  <option value="RAINFALL">🌧️ Rainfall Gauges</option>
                  <option value="RIVER_LEVEL">🌊 River Level Radars</option>
                  <option value="SOIL_MOISTURE">🌱 Soil Moisture Probes</option>
                  <option value="WEATHER">⚡ Weather Stations</option>
                  <option value="MULTI_SENSOR">🎛️ Multi-Telemetry Hubs</option>
                </select>
              </div>
            )}

            {/* Evacuation Centers Toggle */}
            <label className="flex items-center justify-between p-1.5 rounded hover:bg-slate-100 cursor-pointer">
              <span className="flex items-center gap-2 text-slate-700 font-medium">
                <Home className="w-3.5 h-3.5 text-emerald-600" />
                Evacuation Shelters
              </span>
              <input
                type="checkbox"
                checked={showEvacuation}
                onChange={(e) => setShowEvacuation(e.target.checked)}
                className="rounded bg-slate-100 border-slate-300 text-blue-600 focus:ring-0"
              />
            </label>

            {/* Citizen Reports Toggle */}
            <label className="flex items-center justify-between p-1.5 rounded hover:bg-slate-100 cursor-pointer">
              <span className="flex items-center gap-2 text-slate-700 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Citizen Ground Reports
              </span>
              <input
                type="checkbox"
                checked={showCitizenReports}
                onChange={(e) => setShowCitizenReports(e.target.checked)}
                className="rounded bg-slate-100 border-slate-300 text-blue-600 focus:ring-0"
              />
            </label>

            {/* Alert Zones Toggle */}
            <label className="flex items-center justify-between p-1.5 rounded hover:bg-slate-100 cursor-pointer">
              <span className="flex items-center gap-2 text-slate-700 font-medium">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                Active Warning Buffers
              </span>
              <input
                type="checkbox"
                checked={showAlerts}
                onChange={(e) => setShowAlerts(e.target.checked)}
                className="rounded bg-slate-100 border-slate-300 text-blue-600 focus:ring-0"
              />
            </label>
          </div>
        </div>

        {/* Floating GIS Map Legend (Bottom Left) */}
        <div className="absolute bottom-4 left-4 z-[1000] w-64 bg-white/95 border border-slate-200 rounded-xl p-3 shadow-xl backdrop-blur-md text-slate-800">
          <div className="text-xs font-bold text-slate-900 mb-2 pb-1.5 border-b border-slate-200 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              GIS Symbology Legend
            </span>
          </div>

          {/* Risk Level Colors */}
          <div className="mb-2.5">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Catchment Risk Levels:</div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500 border border-emerald-600"></span>
                <span className="text-slate-700 font-medium">LOW</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-500 border border-amber-600"></span>
                <span className="text-slate-700 font-medium">MODERATE</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-orange-500 border border-orange-600"></span>
                <span className="text-slate-700 font-medium">HIGH</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-rose-500 border border-rose-600"></span>
                <span className="text-rose-700 font-bold">CRITICAL</span>
              </div>
            </div>
          </div>

          {/* Sensor Marker Icons */}
          <div className="pt-2 border-t border-slate-200">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Sensor Markers:</div>
            <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-[11px] text-slate-700">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-sky-500 border border-sky-600 inline-block"></span>
                <span>Rainfall</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-cyan-500 border border-cyan-600 inline-block"></span>
                <span>River Radar</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500 border border-amber-600 inline-block"></span>
                <span>Soil Moisture</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-emerald-600 inline-block"></span>
                <span>Multi-Sensor</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-emerald-600 border border-white inline-block"></span>
                <span>Shelter</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-orange-500 border border-orange-600 inline-block"></span>
                <span>Citizen Pin</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Event Toast (Bottom Right) */}
        {lastLiveEvent && (
          <div className="absolute bottom-4 right-4 z-[1000] px-3 py-2 bg-slate-900/90 border border-cyan-500/40 rounded-lg shadow-xl backdrop-blur-md flex items-center gap-2 text-xs text-cyan-300 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-mono">{lastLiveEvent}</span>
          </div>
        )}

      </div>

      {/* Explainable Risk Details Modal */}
      {selectedWatershedId !== null && (
        <RiskExplanationModal
          watershedId={selectedWatershedId}
          isOpen={selectedWatershedId !== null}
          onClose={() => setSelectedWatershedId(null)}
        />
      )}
    </div>
  );
};
