import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Radio, 
  CloudRain, 
  Waves, 
  Droplets, 
  Battery, 
  BatteryWarning, 
  Signal, 
  Activity, 
  Search, 
  RefreshCw, 
  Zap, 
  Compass, 
  Sparkles, 
  X,
  ArrowUpRight
} from 'lucide-react';
import { 
  SensorItem, 
  SensorHealthOverview, 
  WatershedItem, 
  SensorReadingsResponse 
} from '../types';
import { apiService } from '../services/api';

export const SensorsPage: React.FC = () => {
  const [sensors, setSensors] = useState<SensorItem[]>([]);
  const [healthOverview, setHealthOverview] = useState<SensorHealthOverview | null>(null);
  const [watersheds, setWatersheds] = useState<WatershedItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [latestPacketTime, setLatestPacketTime] = useState<string>('Active');

  // Filters
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedWatershed, setSelectedWatershed] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Selected sensor for detailed history modal
  const [selectedSensor, setSelectedSensor] = useState<SensorItem | null>(null);
  const [historyData, setHistoryData] = useState<SensorReadingsResponse | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Live telemetry rolling buffer for real-time chart
  const [rainHistory, setRainHistory] = useState<{ time: string; val: number; code: string }[]>([]);
  const [riverHistory, setRiverHistory] = useState<{ time: string; val: number; code: string }[]>([]);
  const [soilHistory, setSoilHistory] = useState<{ time: string; val: number; code: string }[]>([]);

  const wsRef = useRef<WebSocket | null>(null);

  // Fetch initial sensors & health overview
  const fetchAllData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const [sensorList, healthData, wsList] = await Promise.all([
        apiService.getSensors(),
        apiService.getSensorsHealth(),
        apiService.getWatersheds()
      ]);
      setSensors(sensorList);
      setHealthOverview(healthData);
      setWatersheds(wsList);

      // Seed chart history from sensors' latest values
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      sensorList.forEach((s: SensorItem) => {
        if (s.latest_reading) {
          if (s.sensor_type === 'RAINFALL') {
            setRainHistory((prev) => [...prev.slice(-15), { time: nowStr, val: s.latest_reading!.value, code: s.sensor_code }]);
          } else if (s.sensor_type === 'RIVER_LEVEL') {
            setRiverHistory((prev) => [...prev.slice(-15), { time: nowStr, val: s.latest_reading!.value, code: s.sensor_code }]);
          } else if (s.sensor_type === 'SOIL_MOISTURE') {
            setSoilHistory((prev) => [...prev.slice(-15), { time: nowStr, val: s.latest_reading!.value, code: s.sensor_code }]);
          }
        }
      });
    } catch (err) {
      console.error('Error loading sensors:', err);
    } finally {
      if (isManualRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // WebSocket Live Connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname || 'localhost';
    const wsUrl = `${protocol}//${host}:8000/ws/sensors`;

    let socket: WebSocket | null = null;

    const connectWs = () => {
      try {
        socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          setWsConnected(true);
        };

        socket.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.event === 'sensor_reading' && parsed.data) {
              const packet = parsed.data;
              const packetDate = new Date();
              const timeStr = packetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              setLatestPacketTime(timeStr);

              // Update sensor item in list
              setSensors((prev) =>
                prev.map((s) => {
                  if (s.sensor_code === packet.sensor_code || s.id === packet.sensor_id) {
                    return {
                      ...s,
                      latest_reading: {
                        type: s.sensor_type,
                        value: packet.value,
                        unit: packet.unit,
                        timestamp: packet.timestamp,
                        flow_rate: packet.flow_rate,
                      },
                      battery_level: packet.battery_level ?? s.battery_level,
                      signal_strength: packet.signal_strength ?? s.signal_strength,
                      last_seen: packet.timestamp,
                    };
                  }
                  return s;
                })
              );

              // Update rolling time-series sparklines
              if (packet.sensor_type === 'RAINFALL') {
                setRainHistory((prev) => [...prev.slice(-14), { time: timeStr, val: packet.value, code: packet.sensor_code }]);
              } else if (packet.sensor_type === 'RIVER_LEVEL') {
                setRiverHistory((prev) => [...prev.slice(-14), { time: timeStr, val: packet.value, code: packet.sensor_code }]);
              } else if (packet.sensor_type === 'SOIL_MOISTURE') {
                setSoilHistory((prev) => [...prev.slice(-14), { time: timeStr, val: packet.value, code: packet.sensor_code }]);
              }
            }
          } catch (e) {
            console.error('Error handling sensor WS packet:', e);
          }
        };

        socket.onclose = () => {
          setWsConnected(false);
        };

        socket.onerror = () => {
          setWsConnected(false);
        };
      } catch (err) {
        setWsConnected(false);
      }
    };

    connectWs();

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, []);

  // Trigger real-time simulation on backend
  const triggerSimulation = async (isExtreme = false) => {
    try {
      if (isExtreme) {
        await apiService.advanceDemoStep();
      }
      await fetchAllData(true);
    } catch (e) {
      console.error('Failed to trigger simulation:', e);
    }
  };

  // Inspect Sensor History
  const handleOpenSensorDetail = async (sensor: SensorItem) => {
    setSelectedSensor(sensor);
    setLoadingHistory(true);
    try {
      const hist = await apiService.getSensorReadings(sensor.id, 40);
      setHistoryData(hist);
    } catch (e) {
      console.error('Failed to load readings history:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Filter logic
  const filteredSensors = useMemo(() => {
    return sensors.filter((s) => {
      if (selectedType !== 'ALL' && s.sensor_type !== selectedType) return false;
      if (selectedStatus !== 'ALL' && s.status !== selectedStatus) return false;
      if (selectedWatershed !== 'ALL' && s.watershed_id?.toString() !== selectedWatershed) return false;
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(query);
        const matchesCode = s.sensor_code.toLowerCase().includes(query);
        const matchesVillage = s.village?.toLowerCase().includes(query);
        const matchesWs = s.watershed_name?.toLowerCase().includes(query);
        if (!matchesName && !matchesCode && !matchesVillage && !matchesWs) return false;
      }
      return true;
    });
  }, [sensors, selectedType, selectedStatus, selectedWatershed, searchQuery]);

  const getSensorTypeInfo = (type: string) => {
    switch (type) {
      case 'RAINFALL':
        return { label: 'Rain Gauge', icon: CloudRain, color: 'text-blue-700 bg-blue-50 border-blue-200' };
      case 'RIVER_LEVEL':
        return { label: 'River Radar', icon: Waves, color: 'text-blue-700 bg-blue-50 border-blue-200' };
      case 'SOIL_MOISTURE':
        return { label: 'Soil Saturation', icon: Droplets, color: 'text-blue-700 bg-blue-50 border-blue-200' };
      case 'WEATHER':
        return { label: 'Weather Station', icon: Activity, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
      case 'MULTI_SENSOR':
      default:
        return { label: 'Multi-Sensor Node', icon: Radio, color: 'text-blue-700 bg-blue-50 border-blue-200' };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { label: 'ONLINE', style: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'OFFLINE':
        return { label: 'OFFLINE', style: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'MAINTENANCE':
        return { label: 'MAINTENANCE', style: 'bg-amber-50 text-amber-700 border-amber-200' };
      default:
        return { label: status, style: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const formatRelativeTime = (timestamp?: string) => {
    if (!timestamp) return 'No sync';
    const diffSeconds = Math.max(0, Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 1000));
    if (diffSeconds < 5) return 'Just now';
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    const mins = Math.floor(diffSeconds / 60);
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      {/* Top Banner & Telemetry Grid Status */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2.5 mb-2">
              <span className="text-[10px] font-mono font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                IoT Telemetry Grid
              </span>
              <div className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                wsConnected
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-blue-600 animate-ping' : 'bg-amber-500'}`}></span>
                <span>{wsConnected ? `LIVE WEBSOCKET STREAM (${latestPacketTime})` : 'POLLING FALLBACK'}</span>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              IoT Sensor Telemetry Grid & Real-Time Ingestion
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              High-frequency multi-sensor hydro-meteorological ingestion network with live WebSocket streaming and dynamic catchment hydrological response.
            </p>
          </div>

          {/* Action Simulator Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => triggerSimulation(true)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-all"
              title="Simulate sudden cloudburst downpour (40-75 mm/hr)"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Trigger Cloudburst Surge</span>
            </button>

            <button
              onClick={() => triggerSimulation(false)}
              className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-blue-700 border border-slate-300 text-xs font-bold flex items-center space-x-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Simulate Reading</span>
            </button>

            <button
              onClick={() => fetchAllData(true)}
              disabled={refreshing}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold flex items-center space-x-1.5 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Health Metrics Summary Strip */}
        {healthOverview && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-100">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Total Sensors</span>
              <span className="text-xl font-black text-slate-900 font-mono">{healthOverview.total_sensors}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-mono text-blue-600 uppercase tracking-wider block font-bold">Active Online</span>
              <span className="text-xl font-black text-blue-700 font-mono">{healthOverview.active_count}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-mono text-rose-600 uppercase tracking-wider block font-bold">Offline / Maint.</span>
              <span className="text-xl font-black text-rose-600 font-mono">
                {healthOverview.offline_count + healthOverview.maintenance_count}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-mono text-blue-600 uppercase tracking-wider block font-bold">Avg Battery</span>
              <span className="text-xl font-black text-slate-900 font-mono">{healthOverview.avg_battery}%</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-mono text-amber-600 uppercase tracking-wider block font-bold">Low Battery</span>
              <span className="text-xl font-black text-amber-600 font-mono">{healthOverview.low_battery_count} Nodes</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-mono text-indigo-600 uppercase tracking-wider block font-bold">Avg LoRa RSSI</span>
              <span className="text-xl font-black text-slate-900 font-mono">{healthOverview.avg_signal} dBm</span>
            </div>
          </div>
        )}
      </div>

      {/* Real-Time Live Hydrological Time-Series Sparklines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Chart 1: Rainfall Intensity */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <CloudRain className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Rainfall Intensity (mm/hr)</h2>
            </div>
            <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 font-bold">
              Live Stream
            </span>
          </div>

          <div className="h-28 flex items-end space-x-1.5 pt-2 pb-1 border-b border-slate-100">
            {rainHistory.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 font-mono">
                Listening for telemetry packets...
              </div>
            ) : (
              rainHistory.map((pt, idx) => {
                const heightPct = Math.min(100, Math.max(10, (pt.val / 75.0) * 100));
                const isCloudburst = pt.val > 30.0;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group relative">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t transition-all duration-300 ${
                        isCloudburst ? 'bg-rose-500' : 'bg-blue-600'
                      }`}
                    ></div>
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-1 hidden group-hover:block z-20 px-2 py-1 rounded bg-slate-900 text-[10px] font-mono text-white whitespace-nowrap shadow-xl">
                      {pt.code}: {pt.val} mm/hr ({pt.time})
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-2">
            <span>Threshold: 30 mm/hr</span>
            <span className="font-bold text-slate-800">Max Peak: {rainHistory.length > 0 ? Math.max(...rainHistory.map((p) => p.val)) : 0} mm/hr</span>
          </div>
        </div>

        {/* Chart 2: River Water Level */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Waves className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">River Stage Level (m)</h2>
            </div>
            <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 font-bold">
              Acoustic Radar
            </span>
          </div>

          <div className="h-28 flex items-end space-x-1.5 pt-2 pb-1 border-b border-slate-100">
            {riverHistory.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 font-mono">
                Listening for radar telemetry...
              </div>
            ) : (
              riverHistory.map((pt, idx) => {
                const heightPct = Math.min(100, Math.max(15, (pt.val / 7.0) * 100));
                const isHigh = pt.val > 4.5;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group relative">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t transition-all duration-300 ${
                        isHigh ? 'bg-amber-500' : 'bg-blue-600'
                      }`}
                    ></div>
                    <div className="absolute bottom-full mb-1 hidden group-hover:block z-20 px-2 py-1 rounded bg-slate-900 text-[10px] font-mono text-white whitespace-nowrap shadow-xl">
                      {pt.code}: {pt.val} m ({pt.time})
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-2">
            <span>Danger Stage: 4.5 m</span>
            <span className="font-bold text-slate-800">Current Max: {riverHistory.length > 0 ? Math.max(...riverHistory.map((p) => p.val)) : 0} m</span>
          </div>
        </div>

        {/* Chart 3: Soil Saturation */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Droplets className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Slope Soil Saturation (%)</h2>
            </div>
            <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 font-bold">
              Moisture Probes
            </span>
          </div>

          <div className="h-28 flex items-end space-x-1.5 pt-2 pb-1 border-b border-slate-100">
            {soilHistory.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 font-mono">
                Listening for slope moisture...
              </div>
            ) : (
              soilHistory.map((pt, idx) => {
                const heightPct = Math.min(100, Math.max(10, pt.val));
                const isSaturated = pt.val > 85.0;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group relative">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t transition-all duration-300 ${
                        isSaturated ? 'bg-amber-500' : 'bg-blue-600'
                      }`}
                    ></div>
                    <div className="absolute bottom-full mb-1 hidden group-hover:block z-20 px-2 py-1 rounded bg-slate-900 text-[10px] font-mono text-white whitespace-nowrap shadow-xl">
                      {pt.code}: {pt.val}% ({pt.time})
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-2">
            <span>Critical Saturation: 85%</span>
            <span className="font-bold text-slate-800">Peak Slope: {soilHistory.length > 0 ? Math.max(...soilHistory.map((p) => p.val)) : 0}%</span>
          </div>
        </div>

      </div>

      {/* Search & Multi-Criteria Filtering Strip */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by code, sensor name, village, watershed..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-mono font-medium">Showing {filteredSensors.length} of {sensors.length} nodes</span>
            <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'grid' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cards Grid
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'table' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Data Table
              </button>
            </div>
          </div>

        </div>

        {/* Filter Badges Strip */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
          
          {/* Sensor Type Filter */}
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
            <span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Type:</span>
            {['ALL', 'RAINFALL', 'RIVER_LEVEL', 'SOIL_MOISTURE', 'WEATHER', 'MULTI_SENSOR'].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold whitespace-nowrap transition-all ${
                  selectedType === t
                    ? 'bg-blue-50 text-blue-700 border border-blue-300 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {t === 'ALL' ? 'All Types' : t.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar ml-auto">
            <span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Status:</span>
            {['ALL', 'ACTIVE', 'OFFLINE', 'MAINTENANCE'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold whitespace-nowrap transition-all ${
                  selectedStatus === st
                    ? 'bg-blue-50 text-blue-700 border border-blue-300 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Watershed Filter */}
          {watersheds.length > 0 && (
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Catchment:</span>
              <select
                value={selectedWatershed}
                onChange={(e) => setSelectedWatershed(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold focus:outline-hidden"
              >
                <option value="ALL">All Catchments</option>
                {watersheds.map((ws) => (
                  <option key={ws.id} value={ws.id.toString()}>
                    {ws.name} ({ws.code})
                  </option>
                ))}
              </select>
            </div>
          )}

        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSensors.map((sensor) => {
            const typeInfo = getSensorTypeInfo(sensor.sensor_type);
            const statusBadge = getStatusBadge(sensor.status);
            const TypeIcon = typeInfo.icon;
            const isLowBattery = sensor.battery_level < 25;

            return (
              <div
                key={sensor.id}
                className="bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-5 shadow-xs transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar: Code + Status Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-blue-700 border border-slate-200">
                        {sensor.sensor_code}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${statusBadge.style}`}>
                        {statusBadge.label}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-500 font-mono flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                      <span>{formatRelativeTime(sensor.last_seen)}</span>
                    </span>
                  </div>

                  {/* Sensor Name & Catchment Location */}
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors mb-1">
                    {sensor.name}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center space-x-1.5 mb-4">
                    <Compass className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {sensor.village ? `${sensor.village} • ` : ''}
                      {sensor.watershed_name || 'Mountain Catchment'} ({sensor.elevation}m ASL)
                    </span>
                  </p>

                  {/* Primary Telemetry Value Display */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 mb-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${typeInfo.color}`}>
                        <TypeIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Current Observation
                        </span>
                        <div className="flex items-baseline space-x-1.5">
                          <span className="text-xl font-black text-slate-900 font-mono">
                            {sensor.latest_reading ? sensor.latest_reading.value : '--'}
                          </span>
                          <span className="text-xs font-mono text-blue-600 font-bold">
                            {sensor.latest_reading ? sensor.latest_reading.unit : typeInfo.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {sensor.latest_reading?.flow_rate && (
                      <div className="text-right border-l border-slate-200 pl-3">
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Discharge</span>
                        <span className="text-xs font-mono text-slate-700 font-bold">
                          {sensor.latest_reading.flow_rate} m³/s
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Health Diagnostics: Battery & Signal Bar */}
                  <div className="space-y-2 mb-4 text-xs font-mono">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 flex items-center space-x-1 font-semibold">
                        {isLowBattery ? (
                          <BatteryWarning className="w-3.5 h-3.5 text-rose-600" />
                        ) : (
                          <Battery className="w-3.5 h-3.5 text-blue-600" />
                        )}
                        <span>Battery Life:</span>
                      </span>
                      <span className={`font-bold ${isLowBattery ? 'text-rose-600' : 'text-slate-800'}`}>
                        {sensor.battery_level}%
                      </span>
                    </div>
                    {/* Battery Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        style={{ width: `${sensor.battery_level}%` }}
                        className={`h-full rounded-full transition-all duration-300 ${
                          sensor.battery_level > 60
                            ? 'bg-blue-600'
                            : sensor.battery_level > 25
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-slate-500 flex items-center space-x-1 font-semibold">
                        <Signal className="w-3.5 h-3.5 text-blue-600" />
                        <span>LoRa Signal:</span>
                      </span>
                      <span className="text-slate-700 font-bold">
                        {sensor.signal_strength || -68.0} dBm
                      </span>
                    </div>
                  </div>
                </div>

                {/* Inspect Readings Button */}
                <div className="pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenSensorDetail(sensor)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <span>View Telemetry History</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-50 text-slate-600 font-mono text-[10px] uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Sensor Code</th>
                  <th className="py-3.5 px-4">Station Name</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Territory / Catchment</th>
                  <th className="py-3.5 px-4">Latest Observation</th>
                  <th className="py-3.5 px-4">Battery</th>
                  <th className="py-3.5 px-4">Signal</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredSensors.map((sensor) => {
                  const typeInfo = getSensorTypeInfo(sensor.sensor_type);
                  const statusBadge = getStatusBadge(sensor.status);
                  return (
                    <tr key={sensor.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{sensor.sensor_code}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{sensor.name}</td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-bold ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {sensor.village || ''} {sensor.watershed_name ? `(${sensor.watershed_name})` : ''}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {sensor.latest_reading ? `${sensor.latest_reading.value} ${sensor.latest_reading.unit}` : '--'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">{sensor.battery_level}%</td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">{sensor.signal_strength || -68} dBm</td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${statusBadge.style}`}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenSensorDetail(sensor)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-bold transition-all"
                        >
                          History
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sensor Readings & Historical Chart Modal */}
      {selectedSensor && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-fade-in">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {selectedSensor.sensor_code}
                  </span>
                  <span className="text-xs font-mono text-slate-500 font-semibold">
                    {selectedSensor.sensor_type}
                  </span>
                </div>
                <h2 className="text-lg font-black text-slate-900 mt-1">{selectedSensor.name}</h2>
                <p className="text-xs text-slate-500">
                  {selectedSensor.village ? `${selectedSensor.village}, ` : ''}
                  {selectedSensor.watershed_name || 'Catchment'} • Elevation: {selectedSensor.elevation}m
                </p>
              </div>

              <button
                onClick={() => setSelectedSensor(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingHistory ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-xs font-mono">Fetching time-series telemetry records...</p>
              </div>
            ) : historyData ? (
              <div className="space-y-6">
                
                {/* Visual Chart of Historical Readings */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <span className="font-bold text-slate-900 uppercase tracking-wider">
                      Recent {historyData.unit} Trend ({historyData.readings.length} Samples)
                    </span>
                    <span className="font-mono text-blue-600 font-bold">Real-Time Database Records</span>
                  </div>

                  <div className="h-36 flex items-end space-x-1.5 pt-3 border-b border-slate-200">
                    {historyData.readings.slice().reverse().map((r, i) => {
                      const maxVal = Math.max(1.0, ...historyData.readings.map((x) => x.value));
                      const heightPct = Math.min(100, Math.max(10, (r.value / maxVal) * 100));
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center group relative">
                          <div
                            style={{ height: `${heightPct}%` }}
                            className="w-full rounded-t bg-blue-600 hover:bg-blue-700 transition-all"
                          ></div>
                          <div className="absolute bottom-full mb-1 hidden group-hover:block z-30 px-2 py-1 rounded bg-slate-900 text-[10px] font-mono text-white whitespace-nowrap shadow-xl">
                            {r.value} {historyData.unit} @ {new Date(r.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Readings Table */}
                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-50 sticky top-0 text-slate-600 text-[10px] uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Timestamp</th>
                        <th className="py-2.5 px-3">Observation ({historyData.unit})</th>
                        {historyData.readings[0]?.flow_rate !== undefined && (
                          <th className="py-2.5 px-3">Flow Rate (m³/s)</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {historyData.readings.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-slate-600">
                            {new Date(r.timestamp).toLocaleString()}
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-900">{r.value}</td>
                          {r.flow_rate !== undefined && (
                            <td className="py-2 px-3 text-slate-500">{r.flow_rate}</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            ) : (
              <p className="text-center text-xs text-slate-500 py-8">No historical readings recorded yet.</p>
            )}

            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedSensor(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all"
              >
                Close Inspector
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
