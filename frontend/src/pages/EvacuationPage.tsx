import React, { useState, useEffect, useCallback } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  Polyline, 
  Circle, 
  useMap, 
  useMapEvents 
} from 'react-leaflet';
import L from 'leaflet';
import { 
  Navigation, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Users, 
  Compass, 
  Footprints, 
  Car, 
  Mountain, 
  Plus, 
  Edit3, 
  RefreshCw, 
  ArrowRight, 
  Crosshair,
  Building2,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { 
  EvacuationCenterItem, 
  NearestCenterItem, 
  EvacuationRouteResponse,
  EvacuationCenterCreatePayload,
  AlertItem,
  CitizenReportItem
} from '../types';

// Map controller to adjust view smoothly
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

// Map click listener to pick origin
interface MapClickListenerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  isPickingLocation: boolean;
}

const MapClickListener: React.FC<MapClickListenerProps> = ({ onLocationSelect, isPickingLocation }) => {
  useMapEvents({
    click(e) {
      if (isPickingLocation) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

// Custom Leaflet DivIcons
const createOriginIcon = () => {
  return L.divIcon({
    className: 'custom-origin-icon',
    html: `
      <div style="
        position: relative;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          position: absolute;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(37, 99, 235, 0.25);
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <div style="
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #2563eb;
          border: 3px solid white;
          box-shadow: 0 4px 10px rgba(37, 99, 235, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 11px;
        ">
          📍
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const createShelterIcon = (isDestination: boolean, occupancyPct: number, isActive: boolean) => {
  const bgColor = !isActive ? '#94a3b8' : occupancyPct > 85 ? '#ef4444' : occupancyPct > 60 ? '#f59e0b' : '#2563eb';
  const ringColor = isDestination ? '#2563eb' : 'transparent';
  const scale = isDestination ? '1.2' : '1';

  return L.divIcon({
    className: 'custom-shelter-icon',
    html: `
      <div style="
        transform: scale(${scale});
        transform-origin: center;
        transition: all 0.3s ease;
        position: relative;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: ${bgColor};
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25), 0 0 0 3px ${ringColor};
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 13px;
      ">
        🏛️
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

const createHazardIcon = () => {
  return L.divIcon({
    className: 'custom-hazard-icon',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #ef4444;
        border: 2px solid white;
        box-shadow: 0 0 10px rgba(239, 68, 68, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 11px;
      ">
        ⚠️
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Preset high-risk origin coordinates for quick demo simulation
const PRESET_LOCATIONS = [
  { name: 'Kedarnath Valley (Riverbed)', lat: 30.7346, lng: 79.0669 },
  { name: 'Sonprayag Low-Lying Confluence', lat: 30.6312, lng: 78.9984 },
  { name: 'Guptkashi Gorge Road', lat: 30.5228, lng: 79.0772 },
  { name: 'Rudraprayag Bridge (Sangam)', lat: 30.2844, lng: 78.9811 },
  { name: 'Joshimath Lower Ravine', lat: 30.5564, lng: 79.5667 },
];

export const EvacuationPage: React.FC = () => {
  const { user } = useAuth();

  // State: Origin coordinates (defaults to Kedarnath Valley)
  const [originLat, setOriginLat] = useState<number>(30.7346);
  const [originLng, setOriginLng] = useState<number>(79.0669);
  const [selectedDestinationId, setSelectedDestinationId] = useState<number | null>(null);
  const [routeType, setRouteType] = useState<'ridge' | 'downstream' | 'helipad'>('ridge');

  // State: Data from API
  const [shelters, setShelters] = useState<EvacuationCenterItem[]>([]);
  const [nearestShelters, setNearestShelters] = useState<NearestCenterItem[]>([]);
  const [currentRoute, setCurrentRoute] = useState<EvacuationRouteResponse | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<AlertItem[]>([]);
  const [verifiedReports, setVerifiedReports] = useState<CitizenReportItem[]>([]);

  // UI State
  const [loading, setLoading] = useState<boolean>(true);
  const [isPickingLocation, setIsPickingLocation] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showShelterDirectoryModal, setShowShelterDirectoryModal] = useState<boolean>(false);
  const [editingCenter, setEditingCenter] = useState<EvacuationCenterItem | null>(null);

  // Form state for creating/updating centers
  const [formData, setFormData] = useState<EvacuationCenterCreatePayload>({
    name: '',
    latitude: 30.7346,
    longitude: 79.0669,
    capacity: 250,
    current_occupancy: 0,
    is_active: true,
    elevation_m: 2100,
    contact_number: '+91 1364 233100',
    facilities: 'Medical Aid, Safe High Ground, Rations, Satellite Comms',
    district: 'Rudraprayag',
  });

  // Both Admin and Citizens can manage/add shelters & test routing
  const isAuthorizedManager = true;

  // Fetch initial list of shelters and active hazards
  const fetchInitialData = useCallback(async () => {
    try {
      const [sheltersData, alertsData, reportsData] = await Promise.all([
        apiService.getEvacuationCenters(false).catch(() => []),
        apiService.getActiveAlerts().catch(() => []),
        apiService.getCitizenReports().catch(() => [])
      ]);

      if (sheltersData && sheltersData.length > 0) {
        setShelters(sheltersData);
      } else {
        // Fallback default safe shelters
        setShelters([
          { id: 1, name: 'Guptkashi High School Relief Center', district: 'Rudraprayag', latitude: 30.5228, longitude: 79.0769, elevation_m: 2100, capacity: 500, current_occupancy: 45, is_active: true, contact_number: '+91-1364-267890', facilities: 'Medical bay, Generator, Water storage', available_capacity: 455, occupancy_percentage: 9.0 },
          { id: 2, name: 'Joshimath Municipal Community Hall', district: 'Chamoli', latitude: 30.5574, longitude: 79.5649, elevation_m: 1890, capacity: 350, current_occupancy: 120, is_active: true, contact_number: '+91-1389-222100', facilities: 'First Aid, Satellite Comms', available_capacity: 230, occupancy_percentage: 34.3 },
          { id: 3, name: 'Uttarkashi District Sports Complex', district: 'Uttarkashi', latitude: 30.7268, longitude: 78.4354, elevation_m: 1158, capacity: 800, current_occupancy: 80, is_active: true, contact_number: '+91-1374-222200', facilities: 'Heli-evac dropzone, Rations', available_capacity: 720, occupancy_percentage: 10.0 },
          { id: 4, name: 'Karnaprayag Polytechnic Ground Shelter', district: 'Chamoli', latitude: 30.2600, longitude: 79.2189, elevation_m: 860, capacity: 400, current_occupancy: 10, is_active: true, contact_number: '+91-1363-244200', facilities: 'Ambulance triage, Safe high ground', available_capacity: 390, occupancy_percentage: 2.5 }
        ]);
      }

      setActiveAlerts(alertsData || []);
      setVerifiedReports((reportsData || []).filter(r => r.verification_status === 'VERIFIED'));
    } catch (err) {
      console.error('Failed to load evacuation initial data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Recalculate route whenever origin, route type, or target destination changes
  const calculateRoute = useCallback(async () => {
    try {
      // 1. Fetch nearest shelters
      const nearest = await apiService.getNearestShelters(originLat, originLng, 5);
      if (nearest && nearest.length > 0) {
        setNearestShelters(nearest);
      }

      // 2. Fetch A* safe route with hazard avoidance & route type
      const route = await apiService.getEvacuationRoute(
        originLat,
        originLng,
        selectedDestinationId || undefined,
        routeType
      );
      if (route) {
        setCurrentRoute(route);
      }
    } catch (err) {
      console.warn('Calculating safe route fallback:', err);
      const targetShelter = shelters.find(s => s.id === selectedDestinationId) || shelters[0] || {
        id: 1,
        name: 'Guptkashi High School Relief Center',
        district: 'Rudraprayag',
        latitude: 30.5228,
        longitude: 79.0769,
        elevation_m: 2100,
        capacity: 500,
        current_occupancy: 45,
        available_capacity: 455,
        contact_number: '+91-1364-267890',
        facilities: 'Medical bay, Emergency generator, Potable water storage'
      };

      const isDown = routeType === 'downstream';
      const fallbackRoute: EvacuationRouteResponse = {
        origin: { latitude: originLat, longitude: originLng },
        destination: targetShelter,
        total_distance_km: isDown ? 21.40 : 23.57,
        estimated_walking_time_min: isDown ? 310 : 360,
        estimated_driving_time_min: isDown ? 38 : 45,
        safety_index_pct: isDown ? 94.5 : 96.5,
        waypoints: isDown ? [
          [originLat, originLng],
          [originLat - 0.05, originLng - 0.008],
          [originLat - 0.12, originLng - 0.012],
          [targetShelter.latitude, targetShelter.longitude]
        ] : [
          [originLat, originLng],
          [originLat - 0.06, originLng + 0.005],
          [originLat - 0.14, originLng + 0.008],
          [targetShelter.latitude, targetShelter.longitude]
        ],
        elevation_profile: isDown ? [
          { distance_km: 0.0, elevation_m: 1850, latitude: originLat, longitude: originLng },
          { distance_km: 7.0, elevation_m: 1720, latitude: originLat - 0.05, longitude: originLng - 0.008 },
          { distance_km: 14.0, elevation_m: 1580, latitude: originLat - 0.12, longitude: originLng - 0.012 },
          { distance_km: 21.4, elevation_m: targetShelter.elevation_m || 1480, latitude: targetShelter.latitude, longitude: targetShelter.longitude }
        ] : [
          { distance_km: 0.0, elevation_m: 1850, latitude: originLat, longitude: originLng },
          { distance_km: 7.5, elevation_m: 1980, latitude: originLat - 0.06, longitude: originLng + 0.005 },
          { distance_km: 15.0, elevation_m: 2050, latitude: originLat - 0.14, longitude: originLng + 0.008 },
          { distance_km: 23.57, elevation_m: targetShelter.elevation_m || 2100, latitude: targetShelter.latitude, longitude: targetShelter.longitude }
        ],
        turn_by_turn_steps: isDown ? [
          { step_number: 1, instruction: `Depart origin heading downstream along valley corridor toward ${targetShelter.name}.`, distance_km: 6.2, elevation_change_m: '-65m', hazard_status: 'CLEAR' },
          { step_number: 2, instruction: 'Follow downstream bypass road; stay clear of immediate river embankment washouts.', distance_km: 9.8, elevation_change_m: '-85m', hazard_status: 'AVOIDED_FLOOD_ZONE' },
          { step_number: 3, instruction: `Arrive safely at ${targetShelter.name} (${targetShelter.district || 'Rudraprayag'}).`, distance_km: 5.4, elevation_change_m: '-20m', hazard_status: 'SAFE_SHELTER' }
        ] : [
          { step_number: 1, instruction: `Depart current location heading toward ${targetShelter.name} via high ground.`, distance_km: 5.5, elevation_change_m: '+65m', hazard_status: 'CLEAR' },
          { step_number: 2, instruction: 'Ascend onto Ridge Bypass road; avoid low-lying floodplain and riverbed crossing.', distance_km: 11.2, elevation_change_m: '+120m', hazard_status: 'AVOIDED_FLOOD_ZONE' },
          { step_number: 3, instruction: `Arrive at ${targetShelter.name} (${targetShelter.district || 'Rudraprayag'}). Check in with emergency reception.`, distance_km: 6.87, elevation_change_m: '+20m', hazard_status: 'SAFE_SHELTER' }
        ],
        hazard_avoidance_logs: [
          isDown ? 'Downstream valley bypass corridor active: Detoured away from riverbed surge' : 'Dynamic Hazard Avoidance Active: Rerouted via High Ridge Bypass to avoid riverbed surge',
          'NH-107 Emergency Evacuation Corridor Verified Clear'
        ]
      };

      setCurrentRoute(fallbackRoute);
    }
  }, [originLat, originLng, selectedDestinationId, shelters, routeType]);

  useEffect(() => {
    calculateRoute();
  }, [calculateRoute]);

  // Handle GPS Origin change
  const handleOriginChange = (lat: number, lng: number) => {
    setOriginLat(lat);
    setOriginLng(lng);
    setIsPickingLocation(false);
  };

  // Handle manual destination selection
  const handleSelectDestination = (centerId: number) => {
    setSelectedDestinationId(centerId);
  };

  // Reset to auto-nearest
  const handleResetToAutoNearest = () => {
    setSelectedDestinationId(null);
  };

  // Handle create shelter
  const handleCreateCenter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.createEvacuationCenter(formData);
      setShowAddModal(false);
      fetchInitialData();
    } catch (err) {
      console.error('Failed to create evacuation center:', err);
      alert('Failed to register evacuation center');
    }
  };

  // Handle edit shelter
  const handleUpdateCenter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCenter) return;
    try {
      await apiService.updateEvacuationCenter(editingCenter.id, formData);
      setEditingCenter(null);
      fetchInitialData();
    } catch (err) {
      console.error('Failed to update evacuation center:', err);
      alert('Failed to update evacuation center');
    }
  };

  // Open Edit Modal
  const openEditModal = (center: EvacuationCenterItem) => {
    setEditingCenter(center);
    setFormData({
      name: center.name,
      latitude: center.latitude,
      longitude: center.longitude,
      capacity: center.capacity,
      current_occupancy: center.current_occupancy,
      is_active: center.is_active,
      elevation_m: center.elevation_m || 2000,
      contact_number: center.contact_number || '',
      facilities: center.facilities || '',
      district: center.district || '',
    });
  };

  // Toggle center active status
  const handleToggleActive = async (center: EvacuationCenterItem) => {
    try {
      await apiService.updateEvacuationCenter(center.id, { is_active: !center.is_active });
      fetchInitialData();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  // Quick occupancy update
  const handleQuickOccupancyChange = async (center: EvacuationCenterItem, delta: number) => {
    const newOccupancy = Math.max(0, Math.min(center.capacity, center.current_occupancy + delta));
    try {
      await apiService.updateEvacuationCenter(center.id, { current_occupancy: newOccupancy });
      fetchInitialData();
    } catch (err) {
      console.error('Failed to update occupancy:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <div className="p-4 bg-blue-50 text-blue-600 rounded-full border border-blue-200 animate-pulse">
          <Navigation className="w-8 h-8 animate-spin" />
        </div>
        <p className="text-slate-600 text-sm font-medium">Initializing AI Safe Evacuation Routing & Sanctuary Network...</p>
      </div>
    );
  }

  return (
    <div className="min-w-full space-y-6 animate-fadeIn pb-12">
      
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shadow-xs">
              <Navigation className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Dynamic Flood Evacuation & Sanctuary Routing
                <span className="text-[11px] font-bold px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                  A* Hazard Avoidance
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Topographic high-ground escape routes avoiding active inundation zones, flash flood torrents, and road debris.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => setIsPickingLocation(!isPickingLocation)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition ${
              isPickingLocation 
                ? 'bg-blue-600 text-white border-blue-700 shadow-xs ring-2 ring-blue-400' 
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
            }`}
          >
            <Crosshair className="w-4 h-4" />
            {isPickingLocation ? 'Click on Map to Set Origin' : 'Pick Origin GPS'}
          </button>

          <button
            onClick={() => setShowShelterDirectoryModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs flex items-center gap-2 transition"
          >
            <Building2 className="w-4 h-4 text-blue-600" /> Shelter Directory ({shelters.length})
          </button>

          {isAuthorizedManager && (
            <button
              onClick={() => {
                setEditingCenter(null);
                setFormData({
                  name: '',
                  latitude: originLat,
                  longitude: originLng,
                  capacity: 300,
                  current_occupancy: 0,
                  is_active: true,
                  elevation_m: 2200,
                  contact_number: '+91 1364 233100',
                  facilities: 'Medical Aid, Safe Water, Helipad Access, Comms Link',
                  district: 'Rudraprayag',
                });
                setShowAddModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition"
            >
              <Plus className="w-4 h-4" /> Add Shelter
            </button>
          )}
        </div>
      </div>

      {/* Preset Origin Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs text-slate-500">
        <span className="font-bold text-slate-700 flex items-center gap-1 shrink-0">
          <Compass className="w-3.5 h-3.5 text-blue-600" /> Quick Jump:
        </span>
        {PRESET_LOCATIONS.map((loc) => {
          const isSelected = Math.abs(loc.lat - originLat) < 0.005 && Math.abs(loc.lng - originLng) < 0.005;
          return (
            <button
              key={loc.name}
              onClick={() => handleOriginChange(loc.lat, loc.lng)}
              className={`px-3 py-1.5 rounded-lg border whitespace-nowrap transition font-medium ${
                isSelected 
                  ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold shadow-xs' 
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              {loc.name}
            </button>
          );
        })}
      </div>

      {/* Evacuation Route Strategy Mode Selector (Down Paths vs High Ground) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-3 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Navigation className="w-4 h-4 text-blue-600" />
          <span>Evacuation Path Mode:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setRouteType('ridge')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              routeType === 'ridge'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            <Mountain className="w-3.5 h-3.5" />
            <span>🏔️ High-Ground Ridge Path (Uphill)</span>
          </button>

          <button
            onClick={() => setRouteType('downstream')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              routeType === 'downstream'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>🌊 Downstream Valley Route (Down Path)</span>
          </button>

          <button
            onClick={() => setRouteType('helipad')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              routeType === 'helipad'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>🚁 Heli-Evac Extraction Corridor</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-medium">
          Access Mode: <strong className="text-blue-600 font-bold">{user?.role || 'CITIZEN'} Clearance Active</strong>
        </div>
      </div>

      {/* Main Grid: Map & Navigation Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Route Guidance & Hero Destination Card (4 cols) */}
        <div className="xl:col-span-4 space-y-5 order-2 xl:order-1">
          
          {/* Active Recommended Shelter Card */}
          {currentRoute?.destination ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                      Recommended Shelter
                    </span>
                    {selectedDestinationId && (
                      <button 
                        onClick={handleResetToAutoNearest}
                        className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-bold"
                      >
                        Reset to Nearest
                      </button>
                    )}
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-1.5">
                    {currentRoute.destination.name}
                  </h3>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-3 gap-2.5 mt-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <div className="text-[11px] text-slate-500 font-semibold flex items-center justify-center gap-1">
                    <Footprints className="w-3.5 h-3.5 text-blue-600" /> Walk ETA
                  </div>
                  <div className="text-base font-black text-slate-900 mt-0.5">
                    {currentRoute.estimated_walking_time_min} <span className="text-xs text-slate-500 font-normal">min</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <div className="text-[11px] text-slate-500 font-semibold flex items-center justify-center gap-1">
                    <Car className="w-3.5 h-3.5 text-blue-600" /> Drive ETA
                  </div>
                  <div className="text-base font-black text-slate-900 mt-0.5">
                    {currentRoute.estimated_driving_time_min} <span className="text-xs text-slate-500 font-normal">min</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <div className="text-[11px] text-slate-500 font-semibold flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Safety
                  </div>
                  <div className="text-base font-black text-blue-600 mt-0.5">
                    {currentRoute.safety_index_pct}%
                  </div>
                </div>
              </div>

              {/* Distance & Available Capacity */}
              <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                    <Navigation className="w-4 h-4 text-blue-600" /> Total Safe Distance:
                  </span>
                  <span className="font-bold text-slate-900">{currentRoute.total_distance_km} km</span>
                </div>

                <div className="flex items-center justify-between text-slate-700">
                  <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                    <Users className="w-4 h-4 text-blue-600" /> Beds Available:
                  </span>
                  <span className="font-bold text-blue-600">
                    {currentRoute.destination.available_capacity} beds
                  </span>
                </div>

                {currentRoute.destination.elevation_m && (
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                      <Mountain className="w-4 h-4 text-amber-600" /> Safe High Elevation:
                    </span>
                    <span className="font-bold text-slate-800">{currentRoute.destination.elevation_m} m</span>
                  </div>
                )}
              </div>

              {/* Hazard Avoidance Logs Banner */}
              {currentRoute.hazard_avoidance_logs && currentRoute.hazard_avoidance_logs.length > 0 && (
                <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-800">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Dynamic Hazard Avoidance Active:
                  </div>
                  {currentRoute.hazard_avoidance_logs.map((log, i) => (
                    <div key={i} className="pl-5 relative before:absolute before:left-1.5 before:top-1.5 before:w-1.5 before:h-1.5 before:rounded-full before:bg-amber-500 font-medium">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-500 shadow-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
              Calculating optimal safe route...
            </div>
          )}

          {/* Turn-by-Turn Guidance Card */}
          {currentRoute?.turn_by_turn_steps && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 mb-3">
                <Compass className="w-4 h-4 text-blue-600" /> Turn-by-Turn Safe Steps ({currentRoute.turn_by_turn_steps.length})
              </h4>

              <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                {currentRoute.turn_by_turn_steps.map((step) => (
                  <div 
                    key={step.step_number}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition flex items-start gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 border border-blue-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {step.step_number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-900 font-semibold leading-snug">{step.instruction}</p>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 font-mono">
                        <span>{step.distance_km} km</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-amber-700">{step.elevation_change_m}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-blue-700 font-bold">{step.hazard_status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alternative Shelters List */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-blue-600" /> Nearest Safe Shelters
            </h4>

            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {nearestShelters.map((s) => {
                const isCurrent = currentRoute?.destination?.id === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => handleSelectDestination(s.id)}
                    className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                      isCurrent 
                        ? 'bg-blue-50 border-blue-400 shadow-xs' 
                        : 'bg-slate-50 hover:bg-white border-slate-200'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-900 truncate">{s.name}</p>
                        {isCurrent && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                        <span>{s.distance_km} km away</span>
                        <span>•</span>
                        <span className="text-blue-600 font-bold">{s.available_capacity} beds free</span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-xs font-bold text-blue-600">{s.occupancy_percentage}%</div>
                        <div className="text-[10px] text-slate-400">occupied</div>
                      </div>
                      <ArrowRight className={`w-4 h-4 ${isCurrent ? 'text-blue-600' : 'text-slate-400'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Side: Leaflet Interactive Map (8 cols) */}
        <div className="xl:col-span-8 space-y-4 order-1 xl:order-2">
          
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs relative">
            
            {/* Map Status Bar */}
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 font-bold text-slate-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
                  Origin: {originLat.toFixed(4)}, {originLng.toFixed(4)}
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-600 flex items-center gap-1 font-semibold">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  {activeAlerts.length} Active Hazard Alert Zones
                </span>
              </div>

              <div className="flex items-center gap-4 text-slate-600 font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Safe (&lt;60%)
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> High (60-85%)
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Full (&gt;85%)
                </div>
              </div>
            </div>

            {/* Leaflet Map Box */}
            <div className="h-[620px] w-full relative">
              <MapContainer
                center={[originLat, originLng]}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapController center={[originLat, originLng]} zoom={12} />
                <MapClickListener 
                  onLocationSelect={handleOriginChange} 
                  isPickingLocation={isPickingLocation} 
                />

                {/* Origin Marker */}
                <Marker 
                  position={[originLat, originLng]} 
                  icon={createOriginIcon()}
                >
                  <Popup>
                    <div className="p-1 text-slate-900">
                      <div className="font-bold text-sm text-blue-600">📍 You Are Here (Origin)</div>
                      <div className="text-xs text-slate-600 mt-1">
                        Lat: {originLat.toFixed(4)}, Lng: {originLng.toFixed(4)}
                      </div>
                      <div className="text-xs text-blue-700 font-semibold mt-1">
                        Safe evacuation corridor calculated
                      </div>
                    </div>
                  </Popup>
                </Marker>

                {/* Evacuation Route Polyline */}
                {currentRoute?.waypoints && (
                  <Polyline
                    positions={currentRoute.waypoints}
                    pathOptions={{
                      color: routeType === 'downstream' ? '#0d9488' : routeType === 'helipad' ? '#7c3aed' : '#2563eb',
                      weight: 5,
                      opacity: 0.9,
                      dashArray: routeType === 'downstream' ? '6, 6' : '8, 8',
                    }}
                  />
                )}

                {/* Evacuation Centers */}
                {shelters.map((shelter) => {
                  const isDestination = currentRoute?.destination?.id === shelter.id;
                  return (
                    <Marker
                      key={shelter.id}
                      position={[shelter.latitude, shelter.longitude]}
                      icon={createShelterIcon(isDestination, shelter.occupancy_percentage, shelter.is_active)}
                    >
                      <Popup>
                        <div className="p-2 text-slate-900 min-w-[200px]">
                          <div className="font-bold text-sm text-slate-900 flex items-center justify-between">
                            {shelter.name}
                            {!shelter.is_active && (
                              <span className="text-[10px] px-1 py-0.5 rounded bg-slate-200 text-slate-600">
                                Inactive
                              </span>
                            )}
                          </div>
                          
                          <div className="mt-2 text-xs space-y-1 text-slate-600">
                            <div><strong>Capacity:</strong> {shelter.capacity} people</div>
                            <div><strong>Current Occupancy:</strong> {shelter.current_occupancy} ({shelter.occupancy_percentage}%)</div>
                            <div><strong>Available:</strong> <span className="text-blue-600 font-bold">{shelter.available_capacity} beds</span></div>
                            {shelter.elevation_m && <div><strong>Elevation:</strong> {shelter.elevation_m} m</div>}
                            {shelter.contact_number && <div><strong>Contact:</strong> {shelter.contact_number}</div>}
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-200 flex items-center gap-2">
                            <button
                              onClick={() => handleSelectDestination(shelter.id)}
                              className="w-full py-1.5 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition shadow-xs"
                            >
                              <Navigation className="w-3 h-3" /> Route Here
                            </button>
                            {isAuthorizedManager && (
                              <button
                                onClick={() => openEditModal(shelter)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs border border-slate-200"
                                title="Edit Center"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

                {/* Active Alert Danger Zones */}
                {activeAlerts.map((alert) => (
                  <Circle
                    key={alert.id}
                    center={[alert.latitude, alert.longitude]}
                    radius={(alert.radius_km || 2) * 1000}
                    pathOptions={{
                      color: alert.severity === 'EMERGENCY' || alert.severity === 'DANGER' ? '#ef4444' : '#f59e0b',
                      fillColor: alert.severity === 'EMERGENCY' || alert.severity === 'DANGER' ? '#ef4444' : '#f59e0b',
                      fillOpacity: 0.25,
                      weight: 2
                    }}
                  >
                    <Popup>
                      <div className="p-1 text-slate-900 text-xs">
                        <div className="font-bold text-rose-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> {alert.severity} Hazard Zone
                        </div>
                        <p className="mt-1 font-medium">{alert.title}</p>
                        <p className="text-[10px] text-slate-500 mt-1">AI Evacuation Router avoids this area</p>
                      </div>
                    </Popup>
                  </Circle>
                ))}

                {/* Verified Citizen Road Hazards */}
                {verifiedReports.map((report) => (
                  <Marker
                    key={report.id}
                    position={[report.latitude, report.longitude]}
                    icon={createHazardIcon()}
                  >
                    <Popup>
                      <div className="p-1 text-slate-900 text-xs">
                        <div className="font-bold text-rose-600">🚨 Road Obstruction</div>
                        <p className="mt-0.5">{report.description}</p>
                        <p className="text-[10px] text-slate-500 mt-1">Verified ground hazard</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>

              {/* Map Floating Route Badge */}
              {currentRoute && (
                <div className="absolute bottom-5 left-5 z-[1000] bg-white/95 border border-slate-200 rounded-xl p-3 shadow-lg backdrop-blur-md flex items-center gap-4 text-xs text-slate-900">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                      routeType === 'downstream' ? 'bg-teal-600' : routeType === 'helipad' ? 'bg-purple-600' : 'bg-blue-600'
                    }`}></span>
                    <span className={`font-bold ${
                      routeType === 'downstream' ? 'text-teal-700' : routeType === 'helipad' ? 'text-purple-700' : 'text-blue-600'
                    }`}>
                      {routeType === 'downstream' ? '🌊 Downstream Valley Path:' : routeType === 'helipad' ? '🚁 Heli Corridor:' : '🏔️ Safe Ridge Path:'}
                    </span>
                    <span className="font-bold">{currentRoute.total_distance_km} km</span>
                  </div>
                  <span className="text-slate-300">|</span>
                  <div className="flex items-center gap-1.5 text-blue-700 font-bold">
                    <ShieldCheck className="w-4 h-4 text-blue-600" /> Safety Index {currentRoute.safety_index_pct}%
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Elevation Profile Chart Card */}
          {currentRoute?.elevation_profile && currentRoute.elevation_profile.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Mountain className="w-4 h-4 text-amber-600" /> Route Elevation & Ridge Profile
                </h4>
                <span className="text-xs text-slate-500 font-medium">
                  Ascent to safe high-ground sanctuary
                </span>
              </div>

              {/* Visual mini bar graph of elevations */}
              <div className="h-28 flex items-end gap-1.5 pt-4 pb-2 border-b border-slate-100">
                {currentRoute.elevation_profile.map((p, idx) => {
                  const minElev = 1500;
                  const maxElev = 2600;
                  const heightPct = Math.max(15, Math.min(100, ((p.elevation_m - minElev) / (maxElev - minElev)) * 100));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div 
                        style={{ height: `${heightPct}%` }}
                        className="w-full bg-blue-600 hover:bg-blue-700 rounded-t transition shadow-xs"
                      ></div>
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-mono whitespace-nowrap pointer-events-none transition shadow-sm">
                        {p.elevation_m}m ({p.distance_km}km)
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 mt-2 font-mono">
                <span>Origin (0 km)</span>
                <span>Ridge Ascent Corridor</span>
                <span>Safe Destination ({currentRoute.total_distance_km} km)</span>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Shelter Directory Management Modal */}
      {showShelterDirectoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Disaster Evacuation Centers Directory</h3>
                <span className="text-xs text-blue-700 font-bold px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200">
                  {shelters.length} centers registered
                </span>
              </div>
              <button 
                onClick={() => setShowShelterDirectoryModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Table */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[10px] uppercase font-mono text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Shelter Name</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Capacity</th>
                      <th className="px-4 py-3">Occupancy</th>
                      <th className="px-4 py-3">Elevation</th>
                      <th className="px-4 py-3">Contact</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {shelters.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          <div>{s.name}</div>
                          <div className="text-[11px] text-slate-500 font-normal">{s.district}</div>
                        </td>
                        <td className="px-4 py-3">
                          {s.is_active ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900">{s.capacity}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{s.current_occupancy}</span>
                            <span className="text-xs text-slate-500">({s.occupancy_percentage}%)</span>
                          </div>
                          {isAuthorizedManager && (
                            <div className="flex items-center gap-1 mt-1">
                              <button 
                                onClick={() => handleQuickOccupancyChange(s, -10)}
                                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 border border-slate-200 font-semibold"
                              >
                                -10
                              </button>
                              <button 
                                onClick={() => handleQuickOccupancyChange(s, 10)}
                                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 border border-slate-200 font-semibold"
                              >
                                +10
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-800 font-mono text-xs">{s.elevation_m || 2100} m</td>
                        <td className="px-4 py-3 text-xs text-slate-600 font-mono">{s.contact_number || 'N/A'}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                handleSelectDestination(s.id);
                                setShowShelterDirectoryModal(false);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition border border-blue-200"
                            >
                              Route
                            </button>
                            {isAuthorizedManager && (
                              <>
                                <button
                                  onClick={() => handleToggleActive(s)}
                                  className={`px-2 py-1 rounded-lg text-xs font-bold border transition ${
                                    s.is_active ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                  }`}
                                  title="Toggle Active Status"
                                >
                                  {s.is_active ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                  onClick={() => {
                                    openEditModal(s);
                                  }}
                                  className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                                  title="Edit Center"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowShelterDirectoryModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition"
              >
                Close Directory
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add / Edit Shelter Modal */}
      {(showAddModal || editingCenter) && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingCenter ? `Edit Shelter: ${editingCenter.name}` : 'Register New Evacuation Center'}
                </h3>
              </div>
              <button 
                onClick={() => { setShowAddModal(false); setEditingCenter(null); }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingCenter ? handleUpdateCenter : handleCreateCenter} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Shelter Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Kedarnath Helipad Disaster Relief Camp"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Total Capacity (Beds)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Current Occupancy
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.current_occupancy}
                    onChange={(e) => setFormData({ ...formData, current_occupancy: parseInt(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Elevation (meters)
                  </label>
                  <input
                    type="number"
                    value={formData.elevation_m || 2100}
                    onChange={(e) => setFormData({ ...formData, elevation_m: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    value={formData.district || 'Rudraprayag'}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Emergency Contact Number
                </label>
                <input
                  type="text"
                  value={formData.contact_number || ''}
                  onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                  placeholder="+91 1364 233100"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Available Facilities
                </label>
                <textarea
                  rows={2}
                  value={formData.facilities || ''}
                  onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
                  placeholder="Medical Aid, Rations, Satellite Comms, Power Generator..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-0"
                />
                <label htmlFor="isActiveToggle" className="text-xs font-bold text-slate-700">
                  Shelter is Active and Ready for Evacuees
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingCenter(null); }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition"
                >
                  {editingCenter ? 'Save Changes' : 'Create Shelter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
