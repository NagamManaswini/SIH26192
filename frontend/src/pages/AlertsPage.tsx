import React, { useState, useEffect, useCallback } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  GeoJSON, 
  Marker, 
  Popup, 
  useMap 
} from 'react-leaflet';
import L from 'leaflet';
import { 
  BellRing, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Radio, 
  PhoneCall, 
  Smartphone, 
  Volume2, 
  Zap, 
  MapPin, 
  Clock, 
  Filter, 
  Layers, 
  Send, 
  Activity, 
  Check 
} from 'lucide-react';
import { apiService } from '../services/api';
import { 
  AlertItem, 
  NotificationLogItem, 
  AlertZoneProperties, 
  AlertSeverityType,
  GeoJSONFeatureCollection
} from '../types';

// Map controller helper to fly to selected alert
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

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<AlertItem[]>([]);
  const [zonesGeoJson, setZonesGeoJson] = useState<GeoJSONFeatureCollection<AlertZoneProperties> | null>(null);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [acknowledgingId, setAcknowledgingId] = useState<number | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [mapCenter, setMapCenter] = useState<[number, number]>([30.7346, 79.0669]);
  const [mapZoom, setMapZoom] = useState<number>(10);
  const [activeTab, setActiveTab] = useState<'alerts' | 'notifications' | 'zones'>('alerts');
  const [lastEvaluated, setLastEvaluated] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);
  const [evaluationFeedback, setEvaluationFeedback] = useState<string | null>(null);

  // Fetch all alerts data
  const fetchData = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    setError(null);
    try {
      const [allA, actA, zones, logs] = await Promise.allSettled([
        apiService.getAlerts(),
        apiService.getActiveAlerts(),
        apiService.getAlertZonesGeoJSON(),
        apiService.getNotificationLogs(50),
      ]);

      if (allA.status === 'fulfilled') setAlerts(allA.value);
      if (actA.status === 'fulfilled') {
        setActiveAlerts(actA.value);
        if (actA.value.length > 0 && !selectedAlert) {
          setSelectedAlert(actA.value[0]);
          setMapCenter([actA.value[0].latitude, actA.value[0].longitude]);
        }
      }
      if (zones.status === 'fulfilled') setZonesGeoJson(zones.value);
      if (logs.status === 'fulfilled') setNotificationLogs(logs.value);
      setLastEvaluated(new Date());
    } catch (err: any) {
      console.error('Failed to load alerts data:', err);
      setError('Failed to communicate with alert engine service.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedAlert]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Periodic polling & WebSocket simulation
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(false);
    }, 12000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Trigger evaluation
  const handleTriggerEvaluation = async () => {
    setEvaluating(true);
    setEvaluationFeedback(null);
    try {
      const res = await apiService.evaluateAlerts();
      const created = res.results.filter(r => r.action === 'ALERT_CREATED' || r.action === 'ALERT_ESCALATED');
      const suppressed = res.results.filter(r => r.action === 'DUPLICATE_SUPPRESSED');
      setEvaluationFeedback(
        `Evaluation Complete: ${created.length} new/escalated alert(s) dispatched, ${suppressed.length} duplicate(s) suppressed across ${res.total_evaluated} catchments.`
      );
      await fetchData(false);
    } catch (err: any) {
      setError('Evaluation trigger failed: ' + (err.message || 'Unknown error'));
    } finally {
      setEvaluating(false);
    }
  };

  // Acknowledge alert
  const handleAcknowledge = async (alertId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAcknowledgingId(alertId);
    try {
      await apiService.acknowledgeAlert(alertId);
      await fetchData(false);
    } catch (err: any) {
      setError('Failed to acknowledge alert: ' + (err.message || 'Unknown error'));
    } finally {
      setAcknowledgingId(null);
    }
  };

  // Select alert and center map
  const handleSelectAlert = (alert: AlertItem) => {
    setSelectedAlert(alert);
    setMapCenter([alert.latitude, alert.longitude]);
    setMapZoom(11);
  };

  const getSeverityBadge = (sev: AlertSeverityType) => {
    switch (sev) {
      case 'EMERGENCY':
        return 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse';
      case 'DANGER':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'WARNING':
      case 'WATCH':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      case 'INFO':
      case 'ADVISORY':
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    }
  };

  const getStatusBadge = (stat: string) => {
    switch (stat) {
      case 'ACTIVE':
        return 'bg-red-950/60 text-red-300 border-red-700/60';
      case 'ACKNOWLEDGED':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60';
      case 'EXPIRED':
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getChannelIcon = (ch: string) => {
    switch (ch) {
      case 'SMS':
        return <Smartphone className="w-4 h-4 text-emerald-400" />;
      case 'VOICE_IVR':
        return <PhoneCall className="w-4 h-4 text-blue-400" />;
      case 'PUSH':
        return <Radio className="w-4 h-4 text-purple-400" />;
      case 'SIREN':
        return <Volume2 className="w-4 h-4 text-red-400 animate-pulse" />;
      default:
        return <BellRing className="w-4 h-4 text-slate-400" />;
    }
  };

  // Filter alerts
  const filteredAlerts = alerts.filter(a => {
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
    return true;
  });

  const emergencyCount = activeAlerts.filter(a => a.severity === 'EMERGENCY').length;
  const dangerCount = activeAlerts.filter(a => a.severity === 'DANGER').length;
  const warningCount = activeAlerts.filter(a => a.severity === 'WARNING' || a.severity === 'WATCH').length;

  // Custom marker for alert locations on map
  const createAlertMarker = (alert: AlertItem) => {
    const isEmerg = alert.severity === 'EMERGENCY';
    const isDang = alert.severity === 'DANGER';
    const color = isEmerg ? '#EF4444' : isDang ? '#F97316' : '#F59E0B';
    return L.divIcon({
      html: `
        <div style="
          background-color: ${color};
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 0 15px ${color};
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 13px;
          font-weight: bold;
          animation: ${isEmerg ? 'pulse 1.5s infinite' : 'none'};
        ">
          ⚠
        </div>
      `,
      className: 'custom-alert-icon',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  };

  if (loading && alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="p-4 bg-red-500/10 text-red-400 rounded-full border border-red-500/30 animate-pulse">
          <ShieldAlert className="w-10 h-10 animate-spin" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-lg font-bold text-white">Initializing Real-Time Alert Engine</h3>
          <p className="text-sm text-slate-400">Loading active emergency zones and notification channels...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-full space-y-6 animate-fadeIn pb-12 text-slate-800">
      {/* 1. TOP STATUS & EMERGENCY BANNER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-200">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  Emergency Alert Operations Engine
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full">
                    {activeAlerts.length} Active Hazards
                  </span>
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Real-time rule-based threshold evaluation, geo-fenced hazard zones, and multi-channel broadcast dispatch.
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Trigger Engine Button */}
            <button
              onClick={handleTriggerEvaluation}
              disabled={evaluating}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Zap className={`w-4 h-4 ${evaluating ? 'animate-spin' : ''}`} />
              <span>{evaluating ? 'Evaluating Rules...' : 'Trigger Rule Engine'}</span>
            </button>

            {/* Manual refresh */}
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              title="Manual Refresh"
              className="p-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            {/* Live indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              <span>LIVE ({lastEvaluated.toLocaleTimeString()})</span>
            </div>
          </div>
        </div>

        {/* Feedback / Error banner */}
        {evaluationFeedback && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between font-medium">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {evaluationFeedback}
            </span>
            <button onClick={() => setEvaluationFeedback(null)} className="underline hover:text-emerald-950 font-bold">Dismiss</button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between font-medium">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              {error}
            </span>
            <button onClick={() => setError(null)} className="underline hover:text-rose-950 font-bold">Dismiss</button>
          </div>
        )}
      </div>

      {/* 2. STATS CARDS BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Active Emergency Alerts</div>
            <div className="text-3xl font-black font-mono text-rose-600 mt-1">{emergencyCount}</div>
            <div className="text-[11px] text-rose-600/80 font-medium mt-0.5">Mandatory Evacuation</div>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Danger / High Risk Zones</div>
            <div className="text-3xl font-black font-mono text-orange-600 mt-1">{dangerCount}</div>
            <div className="text-[11px] text-orange-600/80 font-medium mt-0.5">Response Teams Alerted</div>
          </div>
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl border border-orange-100">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Warning & Watch Advisories</div>
            <div className="text-3xl font-black font-mono text-amber-600 mt-1">{warningCount}</div>
            <div className="text-[11px] text-amber-600/80 font-medium mt-0.5">Hydrological Stage High</div>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Multi-Channel Dispatches</div>
            <div className="text-3xl font-black font-mono text-blue-600 mt-1">{notificationLogs.length}</div>
            <div className="text-[11px] text-blue-600/80 font-medium mt-0.5">SMS, Voice, Push & Siren</div>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <Send className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'alerts'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Incident Feed & GIS Map ({alerts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'notifications'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Broadcast Notification Center ({notificationLogs.length})</span>
        </button>
      </div>

      {/* 4. MAIN CONTENT AREA: TAB 1 - ALERTS & MAP */}
      {activeTab === 'alerts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Alerts List (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Filter Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs flex items-center justify-between gap-2 flex-wrap text-xs">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-slate-500 font-bold">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 text-slate-700 border border-slate-200 rounded-xl px-2.5 py-1 focus:outline-none font-medium"
                  aria-label="Filter Alerts by Status"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                  <option value="EXPIRED">EXPIRED</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-bold">Severity:</span>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="bg-slate-50 text-slate-700 border border-slate-200 rounded-xl px-2.5 py-1 focus:outline-none font-medium"
                  aria-label="Filter Alerts by Severity"
                >
                  <option value="ALL">All Severities</option>
                  <option value="EMERGENCY">EMERGENCY</option>
                  <option value="DANGER">DANGER</option>
                  <option value="WARNING">WARNING</option>
                  <option value="INFO">INFO</option>
                </select>
              </div>
            </div>

            {/* List */}
            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {filteredAlerts.length === 0 ? (
                <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-slate-400 text-sm">
                  No alerts match current filter criteria.
                </div>
              ) : (
                filteredAlerts.map((alert) => {
                  const isSelected = selectedAlert?.id === alert.id;
                  const isAck = alert.status === 'ACKNOWLEDGED';
                  return (
                    <div
                      key={alert.id}
                      onClick={() => handleSelectAlert(alert)}
                      className={`cursor-pointer rounded-2xl p-4 border transition-all duration-200 ${
                        isSelected 
                          ? 'bg-blue-50/70 border-blue-500 shadow-md ring-1 ring-blue-400/40' 
                          : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-xs'
                      }`}
                    >
                      {/* Top badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getSeverityBadge(alert.severity)}`}>
                            {alert.severity}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getStatusBadge(alert.status)}`}>
                            {alert.status}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {alert.created_at ? new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-sm font-bold text-slate-900 mb-1.5 line-clamp-1">
                        {alert.title}
                      </h3>

                      {/* Message preview */}
                      <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                        {alert.message}
                      </p>

                      {/* Footer Info & Action */}
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          <span>Radius: {alert.radius_km} km</span>
                        </div>

                        {alert.status === 'ACTIVE' && (
                          <button
                            onClick={(e) => handleAcknowledge(alert.id, e)}
                            disabled={acknowledgingId === alert.id}
                            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-300 transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{acknowledgingId === alert.id ? 'Acknowledging...' : 'Acknowledge'}</span>
                          </button>
                        )}
                        {isAck && (
                          <span className="text-emerald-600 text-[11px] flex items-center gap-1 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Acknowledged
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Interactive Danger Zone Map (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">Geo-Fenced Danger Zones (GIS Live Map)</h2>
              </div>
              {selectedAlert && (
                <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200">
                  Target: {selectedAlert.title.split(':')[0]}
                </span>
              )}
            </div>

            <div className="w-full h-[580px] rounded-2xl overflow-hidden border border-slate-200 relative shadow-xs">
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                scrollWheelZoom={true}
                className="w-full h-full z-0"
              >
                <MapController center={mapCenter} zoom={mapZoom} />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Render Danger Polygon Zones */}
                {zonesGeoJson && (
                  <GeoJSON
                    key={JSON.stringify(zonesGeoJson)}
                    data={zonesGeoJson as any}
                    style={(feature: any) => ({
                      color: feature?.properties?.color || '#EF4444',
                      weight: 2.5,
                      dashArray: feature?.properties?.severity === 'EMERGENCY' ? '6, 6' : undefined,
                      fillColor: feature?.properties?.color || '#EF4444',
                      fillOpacity: feature?.properties?.fill_opacity || 0.25,
                    })}
                    onEachFeature={(feature: any, layer: any) => {
                      const p = feature.properties;
                      layer.bindPopup(`
                        <div style="font-family: system-ui; color: #1e293b; padding: 4px;">
                          <h4 style="font-weight: bold; margin: 0 0 4px 0; color: ${p.color};">${p.title}</h4>
                          <p style="font-size: 12px; margin: 0 0 6px 0;">${p.message}</p>
                          <div style="font-size: 11px; font-family: monospace; background: #f1f5f9; padding: 4px; border-radius: 4px;">
                            <strong>Severity:</strong> ${p.severity}<br/>
                            <strong>Radius:</strong> ${p.radius_km} km<br/>
                            <strong>Status:</strong> ${p.status}
                          </div>
                        </div>
                      `);
                    }}
                  />
                )}

                {/* Render Alert Markers */}
                {activeAlerts.map((a) => (
                  <Marker
                    key={a.id}
                    position={[a.latitude, a.longitude]}
                    icon={createAlertMarker(a)}
                  >
                    <Popup>
                      <div className="text-slate-900 font-sans p-1">
                        <div className="font-bold text-sm text-red-600">{a.title}</div>
                        <p className="text-xs text-slate-700 mt-1">{a.message}</p>
                        <div className="text-[11px] font-mono mt-2 bg-slate-100 p-1.5 rounded">
                          <div>Severity: <strong>{a.severity}</strong></div>
                          <div>Radius: <strong>{a.radius_km} km</strong></div>
                          <div>Status: <strong>{a.status}</strong></div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>

              {/* Map Overlay Legend */}
              <div className="absolute bottom-4 left-4 bg-white/95 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5 backdrop-blur-md z-1000 shadow-md">
                <div className="font-bold text-slate-900 text-[11px] uppercase tracking-wider mb-1">Danger Zone Legend</div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500 inline-block border border-red-300"></span>
                  <span className="text-slate-700 font-mono text-[11px]">EMERGENCY (Evacuation)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-orange-500 inline-block border border-orange-300"></span>
                  <span className="text-slate-700 font-mono text-[11px]">DANGER (High Inundation)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block border border-amber-300"></span>
                  <span className="text-slate-700 font-mono text-[11px]">WARNING (Rising River)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500 inline-block border border-blue-300"></span>
                  <span className="text-slate-700 font-mono text-[11px]">INFO (Advisory)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 2 - MULTI-CHANNEL NOTIFICATION AUDIT CENTER */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          {/* Provider Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* SMS Provider Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                  <Smartphone className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  ONLINE
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">SMS Telecom Gateway</h3>
                <p className="text-xs text-slate-500 mt-0.5">Cellular broadcast to village pradhans & registered citizens.</p>
              </div>
              <div className="text-xs font-mono text-slate-500 pt-2 border-t border-slate-100 flex justify-between">
                <span>Avg Latency:</span>
                <span className="text-blue-700 font-bold">142 ms</span>
              </div>
            </div>

            {/* Voice IVR Provider Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  ONLINE
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Automated IVR Voice Calls</h3>
                <p className="text-xs text-slate-500 mt-0.5">Automated priority speech queue to district emergency magistrates.</p>
              </div>
              <div className="text-xs font-mono text-slate-500 pt-2 border-t border-slate-100 flex justify-between">
                <span>Call Duration:</span>
                <span className="text-blue-700 font-bold">28 sec</span>
              </div>
            </div>

            {/* Push Provider Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
                  <Radio className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  ONLINE
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Mobile & Web Push (FCM)</h3>
                <p className="text-xs text-slate-500 mt-0.5">High-priority heads-up notifications delivered to field workers.</p>
              </div>
              <div className="text-xs font-mono text-slate-500 pt-2 border-t border-slate-100 flex justify-between">
                <span>Devices Reached:</span>
                <span className="text-purple-700 font-bold">1,420 Active</span>
              </div>
            </div>

            {/* Siren Provider Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
                  <Volume2 className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
                  RELAY READY
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Edge IoT Siren Array</h3>
                <p className="text-xs text-slate-500 mt-0.5">110dB Acoustic siren tone triggers for riverbank evacuation.</p>
              </div>
              <div className="text-xs font-mono text-slate-500 pt-2 border-t border-slate-100 flex justify-between">
                <span>Tone Pattern:</span>
                <span className="text-rose-700 font-bold">Warble 110dB</span>
              </div>
            </div>
          </div>

          {/* Detailed Audit Log Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-600" />
                Real-Time Notification Dispatch Audit Trail
              </h2>
              <span className="text-xs text-slate-500 font-mono font-semibold">Last 50 Dispatches</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200 font-bold">
                  <tr>
                    <th className="py-3 px-3">Dispatch ID</th>
                    <th className="py-3 px-3">Channel</th>
                    <th className="py-3 px-3">Recipient / Target Zone</th>
                    <th className="py-3 px-3">Severity</th>
                    <th className="py-3 px-3">Message Preview</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {notificationLogs.map((log) => (
                    <tr key={log.dispatch_id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 text-blue-600 font-bold">{log.dispatch_id}</td>
                      <td className="py-3 px-3">
                        <span className="flex items-center gap-1.5 text-slate-800 font-sans font-medium">
                          {getChannelIcon(log.channel)}
                          {log.channel}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-900 font-medium">{log.recipient}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadge(log.severity)}`}>
                          {log.severity}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-600 max-w-xs truncate">{log.title}: {log.message}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-sans">
                        {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
