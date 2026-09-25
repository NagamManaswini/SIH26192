import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  RotateCcw, 
  Droplets, 
  Waves, 
  ShieldAlert, 
  Layers, 
  Sparkles, 
  Volume2, 
  Wifi, 
  WifiOff, 
  X,
  FastForward,
  CheckCircle2,
  Info
} from 'lucide-react';
import { apiService } from '../services/api';
import { DemoStatusResponse, DemoStageInfo } from '../types';

interface DemoControlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Deterministic 15-Stage Fallback Simulation Definitions (ensures 100% reliable UI operation)
const FALLBACK_STAGES: Record<number, DemoStageInfo> = {
  1: {
    stage_number: 1,
    stage_title: 'Baseline Normal Hydrology',
    stage_category: 'Baseline Normalcy',
    risk_level: 'LOW',
    risk_score: 12.4,
    rainfall_rate_mmh: 2.1,
    river_water_level_m: 1.45,
    predicted_level_m: 1.50,
    soil_moisture_pct: 32.0,
    active_alert_severity: 'None (Clear)',
    evacuation_status: 'STANDBY',
    edge_siren_active: false,
    network_online: true,
    offline_buffer_count: 0,
    description: 'Mandakini and Alaknanda valleys report normal post-monsoon conditions. Catchment soil saturation is at seasonal baseline and all sensor nodes transmit healthy telemetry.',
    system_effects: [
      'Sensor nodes online and pinging at 60s intervals',
      'Watershed risk indices green across all 29 catchments',
      'Evacuation shelters in standby readiness'
    ]
  },
  2: {
    stage_number: 2,
    stage_title: 'Atmospheric Depression Detected',
    stage_category: 'Pre-Event Inundation Watch',
    risk_level: 'LOW',
    risk_score: 24.5,
    rainfall_rate_mmh: 14.2,
    river_water_level_m: 1.80,
    predicted_level_m: 2.10,
    soil_moisture_pct: 44.5,
    active_alert_severity: 'None (Advisory)',
    evacuation_status: 'STANDBY',
    edge_siren_active: false,
    network_online: true,
    offline_buffer_count: 0,
    description: 'Doppler radar telemetry indicates rapid convective buildup over Kedarnath ridge. Precipitation rates begin increasing in upper catchment tributaries.',
    system_effects: [
      'Automated weather stations ramp ping cadence to 30s',
      'AI forecaster flags potential cloudburst vector within 3 hours',
      'Disaster command room enters Elevated Watch state'
    ]
  },
  3: {
    stage_number: 3,
    stage_title: 'Intense Orographic Precipitation',
    stage_category: 'Early Warning Transition',
    risk_level: 'MODERATE',
    risk_score: 46.8,
    rainfall_rate_mmh: 42.0,
    river_water_level_m: 2.65,
    predicted_level_m: 3.40,
    soil_moisture_pct: 68.2,
    active_alert_severity: 'ADVISORY',
    evacuation_status: 'ADVISORY',
    edge_siren_active: false,
    network_online: true,
    offline_buffer_count: 0,
    description: 'Rainfall exceeds 40 mm/h across Mandakini Upper Catchment. Topsoil approaches near-saturation levels, significantly decreasing infiltration capacity.',
    system_effects: [
      'Moderate Risk badge broadcast to GIS Live Situation Map',
      'Field ops teams notified of impending tributary swelling',
      'Citizen reporting app pushes localized preparedness guidelines'
    ]
  },
  4: {
    stage_number: 4,
    stage_title: 'AI Multi-Model Flash Surge Prediction',
    stage_category: 'Early Warning Transition',
    risk_level: 'HIGH',
    risk_score: 68.4,
    rainfall_rate_mmh: 78.5,
    river_water_level_m: 3.80,
    predicted_level_m: 5.60,
    soil_moisture_pct: 86.0,
    active_alert_severity: 'WARNING',
    evacuation_status: 'RECOMMENDED',
    edge_siren_active: false,
    network_online: true,
    offline_buffer_count: 0,
    description: 'Ensemble neural forecaster predicts catastrophic river crest in Kedarnath valley in 45 minutes, exceeding warning threshold by 1.8 meters.',
    system_effects: [
      'High-Risk Warning Polygon generated over 8 downstream villages',
      'Automated evacuation routes calculated avoiding low-lying bridges',
      'Hospital casualty wards put on standby code yellow'
    ]
  },
  5: {
    stage_number: 5,
    stage_title: 'Flash Cloudburst & Glacial Outburst (GLOF)',
    stage_category: 'Disaster Inundation Surge',
    risk_level: 'CRITICAL',
    risk_score: 94.2,
    rainfall_rate_mmh: 135.0,
    river_water_level_m: 5.40,
    predicted_level_m: 7.20,
    soil_moisture_pct: 98.5,
    active_alert_severity: 'EMERGENCY',
    evacuation_status: 'MANDATORY',
    edge_siren_active: true,
    network_online: true,
    offline_buffer_count: 0,
    description: 'Massive cloudburst event strikes Chorabari catchment. River levels surge at 0.8 meters/minute with extreme debris velocity.',
    system_effects: [
      'DEFCON 1 Flash Flood Emergency declared by NDMA portal',
      'Cell-broadcast emergency siren triggered on citizen devices',
      'All upstream sensor nodes switch to emergency burst telemetry mode'
    ]
  },
  6: {
    stage_number: 6,
    stage_title: 'River Surge & Inundation Propagation',
    stage_category: 'Disaster Inundation Surge',
    risk_level: 'CRITICAL',
    risk_score: 97.6,
    rainfall_rate_mmh: 155.0,
    river_water_level_m: 6.90,
    predicted_level_m: 8.10,
    soil_moisture_pct: 100.0,
    active_alert_severity: 'EMERGENCY',
    evacuation_status: 'MANDATORY',
    edge_siren_active: true,
    network_online: true,
    offline_buffer_count: 0,
    description: 'River exceeds highest recorded flood level. Severe bank cutting and localized debris dams threaten low-lying residential clusters in Rambara and Gaurikund.',
    system_effects: [
      'Live GIS updates dynamic inundation contours in real-time',
      'Safe evacuation routing dynamically recalculates to bypass submerged NH-107',
      'Emergency relief camps activated at Sonprayag High Grounds'
    ]
  },
  7: {
    stage_number: 7,
    stage_title: 'Red Danger Multi-Catchment Alert',
    stage_category: 'Disaster Inundation Surge',
    risk_level: 'CRITICAL',
    risk_score: 99.1,
    rainfall_rate_mmh: 148.0,
    river_water_level_m: 7.80,
    predicted_level_m: 8.40,
    soil_moisture_pct: 100.0,
    active_alert_severity: 'EMERGENCY',
    evacuation_status: 'MANDATORY',
    edge_siren_active: true,
    network_online: true,
    offline_buffer_count: 0,
    description: 'Red danger polygon expands to encompass Alaknanda confluence at Rudraprayag. Flood wave propagation speed tracked at 42 km/h.',
    system_effects: [
      'Automated siren activation across 12 riverside settlements',
      'Field responders receive automated rescue dispatch coordinate bundles',
      'Citizen hazard reports prioritized with offline sync capability'
    ]
  },
  8: {
    stage_number: 8,
    stage_title: 'Cellular Tower Failure & Grid Blackout',
    stage_category: 'Resilient Edge Survival',
    risk_level: 'CRITICAL',
    risk_score: 96.5,
    rainfall_rate_mmh: 120.0,
    river_water_level_m: 7.40,
    predicted_level_m: 7.60,
    soil_moisture_pct: 99.0,
    active_alert_severity: 'EMERGENCY',
    evacuation_status: 'MANDATORY',
    edge_siren_active: true,
    network_online: false,
    offline_buffer_count: 14,
    description: 'Commercial 4G/5G cellular towers lose power and fiber backhaul in the upper valley. Public cloud connectivity is temporarily severed.',
    system_effects: [
      'Edge IoT nodes switch seamlessly to 868MHz LoRa Mesh communication',
      'Offline PWA continues local risk calculation and route rendering',
      'Autonomous edge siren controllers maintain independent local alarming'
    ]
  },
  9: {
    stage_number: 9,
    stage_title: 'Autonomous LoRa Edge Siren & Mesh Relay',
    stage_category: 'Resilient Edge Survival',
    risk_level: 'CRITICAL',
    risk_score: 93.0,
    rainfall_rate_mmh: 98.0,
    river_water_level_m: 6.95,
    predicted_level_m: 7.10,
    soil_moisture_pct: 97.5,
    active_alert_severity: 'EMERGENCY',
    evacuation_status: 'MANDATORY',
    edge_siren_active: true,
    network_online: false,
    offline_buffer_count: 28,
    description: 'LoRa mesh network successfully routes critical river level telemetry around damaged valley repeaters. Local sirens warn remaining residents to climb to high ground.',
    system_effects: [
      '100% telemetry packet recovery via decentralized peer nodes',
      'Field officers receive offline vector map directions on mobile PWA',
      'Citizen offline reports stored securely in browser IndexedDB'
    ]
  },
  10: {
    stage_number: 10,
    stage_title: 'Dynamic Safe Evacuation Routing',
    stage_category: 'Evacuation & Relief Operations',
    risk_level: 'HIGH',
    risk_score: 82.0,
    rainfall_rate_mmh: 75.0,
    river_water_level_m: 6.10,
    predicted_level_m: 6.30,
    soil_moisture_pct: 95.0,
    active_alert_severity: 'WARNING',
    evacuation_status: 'ACTIVE_EVACUATION',
    edge_siren_active: true,
    network_online: false,
    offline_buffer_count: 42,
    description: 'A* Topological graph algorithm guides 8,400+ citizens along high-elevation ridge trails directly to designated relief shelters.',
    system_effects: [
      'Shelter capacity monitors update occupancy status in real-time',
      'Hazardous submerged bridges dynamically excluded from route suggestions',
      'Medical triage teams dispatched to intercept priority evacuees'
    ]
  },
  11: {
    stage_number: 11,
    stage_title: 'Peak Flood Crest Inundation',
    stage_category: 'Evacuation & Relief Operations',
    risk_level: 'HIGH',
    risk_score: 79.5,
    rainfall_rate_mmh: 52.0,
    river_water_level_m: 5.60,
    predicted_level_m: 5.50,
    soil_moisture_pct: 92.0,
    active_alert_severity: 'WARNING',
    evacuation_status: 'ACTIVE_EVACUATION',
    edge_siren_active: false,
    network_online: false,
    offline_buffer_count: 56,
    description: 'Flood crest passes downstream through Rudraprayag gorge. Flood inundation depth begins stabilizing across all observation stations.',
    system_effects: [
      'Evacuation shelters report 89% safe occupancy rate',
      'Zero reported casualties in automated warning polygon zones',
      'Emergency food and medical supplies delivered to high-elevation safe zones'
    ]
  },
  12: {
    stage_number: 12,
    stage_title: 'Precipitation Subsides & Water Retreat',
    stage_category: 'Recession & Damage Assessment',
    risk_level: 'MODERATE',
    risk_score: 54.0,
    rainfall_rate_mmh: 18.0,
    river_water_level_m: 4.20,
    predicted_level_m: 3.90,
    soil_moisture_pct: 84.0,
    active_alert_severity: 'ADVISORY',
    evacuation_status: 'CONTROLLED_RETURN',
    edge_siren_active: false,
    network_online: false,
    offline_buffer_count: 65,
    description: 'Heavy rain bands dissipate over the valley. Water levels recede below danger marks, allowing ground assessment teams to deploy.',
    system_effects: [
      'Threat level downgraded from DEFCON 1 to DEFCON 2 Watch',
      'Search and rescue drones deployed for debris mapping',
      'Structural stability checks initiated for valley transport links'
    ]
  },
  13: {
    stage_number: 13,
    stage_title: 'Flood Crest Cleared & Inflow Stabilization',
    stage_category: 'Recession & Damage Assessment',
    risk_level: 'MODERATE',
    risk_score: 38.0,
    rainfall_rate_mmh: 8.5,
    river_water_level_m: 3.10,
    predicted_level_m: 2.80,
    soil_moisture_pct: 72.0,
    active_alert_severity: 'None (Advisory)',
    evacuation_status: 'CONTROLLED_RETURN',
    edge_siren_active: false,
    network_online: true,
    offline_buffer_count: 20,
    description: 'River discharge stabilizes at normal monsoon flow rates. Downstream dam spillways regulate excess volume smoothly.',
    system_effects: [
      'Watershed risk indicators revert to moderate/low status',
      'Citizen reports shift to post-event debris and road clearance requests',
      'Medical units confirm zero epidemic or contamination outbreaks'
    ]
  },
  14: {
    stage_number: 14,
    stage_title: 'GSM Cellular Restored & Offline Sync',
    stage_category: 'System Recovery & Synchronization',
    risk_level: 'LOW',
    risk_score: 22.0,
    rainfall_rate_mmh: 3.0,
    river_water_level_m: 2.20,
    predicted_level_m: 2.05,
    soil_moisture_pct: 58.0,
    active_alert_severity: 'None (Clear)',
    evacuation_status: 'ALL_CLEAR',
    edge_siren_active: false,
    network_online: true,
    offline_buffer_count: 0,
    description: 'Cellular coverage is fully restored across the valley. IndexedDB queues automatically flush pending citizen reports to the central FastAPI database.',
    system_effects: [
      'PWA background sync successfully processes all queued citizen reports',
      'Central database reconciles LoRa mesh logs with telemetry archives',
      'Emergency sirens reset to standby monitoring state'
    ]
  },
  15: {
    stage_number: 15,
    stage_title: 'Post-Disaster Analytics & AI Model Retraining',
    stage_category: 'System Recovery & Synchronization',
    risk_level: 'LOW',
    risk_score: 11.2,
    rainfall_rate_mmh: 1.2,
    river_water_level_m: 1.60,
    predicted_level_m: 1.55,
    soil_moisture_pct: 42.0,
    active_alert_severity: 'None (Normal)',
    evacuation_status: 'ALL_CLEAR',
    edge_siren_active: false,
    network_online: true,
    offline_buffer_count: 0,
    description: 'Disaster lifecycle concludes with full data retention. Historical analytics calculate 94.2% AI prediction accuracy and generate downloadable audit reports.',
    system_effects: [
      'Comprehensive event timeline archived for national disaster review',
      'AI flood forecasting weights updated with newly captured empirical hydrographs',
      'Standard 24/7 autonomous monitoring operations resumed'
    ]
  }
};

export const DemoControlModal: React.FC<DemoControlModalProps> = ({ isOpen, onClose }) => {
  const [currentStageNum, setCurrentStageNum] = useState<number>(1);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [secondsPerStage, setSecondsPerStage] = useState<number>(4);
  const [status, setStatus] = useState<DemoStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchStatus = async () => {
    try {
      const data = await apiService.getDemoStatus();
      setStatus(data);
      if (data.current_stage) {
        setCurrentStageNum(data.current_stage);
      }
      setIsRunning(data.is_running);
    } catch {
      // Offline / network fallback is handled smoothly
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      const interval = setInterval(fetchStatus, 2500);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Local auto-play timer fallback if backend is offline
  useEffect(() => {
    let timer: any;
    if (isRunning) {
      timer = setInterval(() => {
        setCurrentStageNum((prev) => (prev >= 15 ? 1 : prev + 1));
      }, secondsPerStage * 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, secondsPerStage]);

  const handleStart = async (autoPlay: boolean = true) => {
    setLoading(true);
    setIsRunning(autoPlay);
    try {
      const res = await apiService.startDemo({ 
        auto_play: autoPlay, 
        seconds_per_stage: secondsPerStage,
        jump_to_stage: currentStageNum 
      });
      setStatus(res);
      if (res.current_stage) setCurrentStageNum(res.current_stage);
    } catch {
      // Local fallback active
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    setIsRunning(false);
    try {
      const res = await apiService.stopDemo();
      setStatus(res);
      setCurrentStageNum(1);
    } catch {
      setCurrentStageNum(1);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvance = async () => {
    setLoading(true);
    const nextStage = currentStageNum >= 15 ? 1 : currentStageNum + 1;
    setCurrentStageNum(nextStage);
    try {
      const res = await apiService.advanceDemoStep();
      setStatus(res);
      if (res.current_stage) setCurrentStageNum(res.current_stage);
    } catch {
      // Local fallback already advanced
    } finally {
      setLoading(false);
    }
  };

  const handleJumpToStage = async (stageNum: number) => {
    setLoading(true);
    setCurrentStageNum(stageNum);
    try {
      const res = await apiService.startDemo({ auto_play: false, jump_to_stage: stageNum });
      setStatus(res);
    } catch {
      // Local state already updated
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentStageInfo: DemoStageInfo = status?.stage_info || FALLBACK_STAGES[currentStageNum] || FALLBACK_STAGES[1];

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'CRITICAL':
        return 'bg-rose-100 text-rose-700 border-rose-300';
      case 'HIGH':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'MODERATE':
        return 'bg-amber-100 text-amber-700 border-amber-300';
      default:
        return 'bg-emerald-100 text-emerald-700 border-emerald-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl text-slate-800 flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-gradient-to-tr from-amber-500 to-orange-500 text-white rounded-2xl shadow-md">
              <FastForward className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Hydro-Disaster Simulation & 15-Stage Flood Lifecycle Demo
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                  LIVE SCENARIO ENGINE
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Mandakini Valley / Kedarnath deterministic early warning & disaster response lifecycle
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
            title="Close Demo Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1">
          
          {/* Responsive 15-Stage Timeline Stepper */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
              <span className="flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-600" />
                Scenario Timeline Progress
              </span>
              <span className="text-blue-700 font-mono bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200">
                Stage {currentStageNum} of 15
              </span>
            </div>

            {/* Stepper Dots & Bars */}
            <div className="grid grid-cols-5 sm:grid-cols-15 gap-1.5 pt-1">
              {Array.from({ length: 15 }, (_, i) => i + 1).map((sNum) => {
                const isCurrent = currentStageNum === sNum;
                const isCompleted = currentStageNum > sNum;
                return (
                  <button
                    key={sNum}
                    onClick={() => handleJumpToStage(sNum)}
                    title={`Stage ${sNum}: ${FALLBACK_STAGES[sNum]?.stage_title || ''}`}
                    className={`h-8 rounded-lg font-bold text-[11px] font-mono transition-all flex items-center justify-center border shadow-xs ${
                      isCurrent
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 ring-2 ring-blue-400/40 scale-105 shadow-md'
                        : isCompleted
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {sNum}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Active Stage Hero Card */}
          <div className="bg-white border-2 border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-mono font-black text-xs shadow-sm">
                  STAGE {currentStageInfo.stage_number}
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {currentStageInfo.stage_title}
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    Category: <strong className="text-slate-700">{currentStageInfo.stage_category}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono border ${getRiskBadge(currentStageInfo.risk_level)}`}>
                  {currentStageInfo.risk_level} RISK ({currentStageInfo.risk_score.toFixed(1)}/100)
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed font-normal">
              {currentStageInfo.description}
            </p>

            {/* Physical Telemetry Grid (4 Stat Cards) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                <span className="text-slate-500 flex items-center gap-1.5 font-bold">
                  <Droplets className="w-4 h-4 text-blue-600" />
                  Rainfall Intensity
                </span>
                <span className="text-xl font-black text-slate-900 block mt-1.5 font-mono">
                  {currentStageInfo.rainfall_rate_mmh.toFixed(1)} <span className="text-xs font-semibold text-slate-500">mm/h</span>
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                <span className="text-slate-500 flex items-center gap-1.5 font-bold">
                  <Waves className="w-4 h-4 text-cyan-600" />
                  River Water Level
                </span>
                <span className="text-xl font-black text-slate-900 block mt-1.5 font-mono">
                  {currentStageInfo.river_water_level_m.toFixed(2)} <span className="text-xs font-semibold text-slate-500">m</span>
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                <span className="text-slate-500 flex items-center gap-1.5 font-bold">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  AI Predicted (+60m)
                </span>
                <span className="text-xl font-black text-purple-700 block mt-1.5 font-mono">
                  {currentStageInfo.predicted_level_m.toFixed(2)} <span className="text-xs font-semibold text-purple-500">m</span>
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                <span className="text-slate-500 flex items-center gap-1.5 font-bold">
                  <Layers className="w-4 h-4 text-amber-600" />
                  Soil Moisture
                </span>
                <span className="text-xl font-black text-amber-700 block mt-1.5 font-mono">
                  {currentStageInfo.soil_moisture_pct.toFixed(1)} <span className="text-xs font-semibold text-amber-500">%</span>
                </span>
              </div>
            </div>

            {/* Status Indicators Row */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                <span className="text-slate-500">Active Alert:</span>
                <strong className="text-slate-800">{currentStageInfo.active_alert_severity || 'None (Normal)'}</strong>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                <Volume2 className={`w-3.5 h-3.5 ${currentStageInfo.edge_siren_active ? 'text-rose-600 animate-bounce' : 'text-slate-400'}`} />
                <span className="text-slate-500">Edge Siren:</span>
                <strong className={currentStageInfo.edge_siren_active ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                  {currentStageInfo.edge_siren_active ? 'ACTIVE ALARM' : 'Standby'}
                </strong>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                {currentStageInfo.network_online ? (
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                )}
                <span className="text-slate-500">Telemetry Link:</span>
                <strong className={currentStageInfo.network_online ? 'text-emerald-700' : 'text-amber-700 font-bold'}>
                  {currentStageInfo.network_online ? 'GSM Cloud Online' : 'OFFLINE (LoRa Mesh)'}
                </strong>
              </div>
            </div>

            {/* Synchronized System Effects */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Synchronized Module Responses:</span>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {currentStageInfo.system_effects.map((effect, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{effect}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Quick Stage Jump Selectors (15 clickable pills) */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-600 block">Quick Stage Jump (1 - 15)</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs">
              {Object.values(FALLBACK_STAGES).map((st) => (
                <button
                  key={st.stage_number}
                  onClick={() => handleJumpToStage(st.stage_number)}
                  className={`px-3 py-2 rounded-xl border text-left font-medium transition text-[11px] truncate ${
                    currentStageNum === st.stage_number
                      ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="font-bold">{st.stage_number}. {st.stage_title.split(' ')[0]}</div>
                  <div className="text-[10px] text-slate-400 truncate">{st.stage_title}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Playback Controls */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/90 flex flex-wrap items-center justify-between gap-4 sticky bottom-0 z-10 rounded-b-3xl">
          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-600 font-bold">Speed:</label>
            <select
              value={secondsPerStage}
              onChange={(e) => setSecondsPerStage(Number(e.target.value))}
              className="bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-xl px-3 py-1.5 focus:outline-none shadow-xs"
            >
              <option value={2}>2s / stage (Fast)</option>
              <option value={4}>4s / stage (Standard)</option>
              <option value={8}>8s / stage (Narrated)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStop}
              disabled={loading}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>

            {isRunning ? (
              <button
                onClick={() => setIsRunning(false)}
                disabled={loading}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-200 transition active:scale-95"
              >
                <Pause className="w-3.5 h-3.5" />
                Pause Auto-Play
              </button>
            ) : (
              <button
                onClick={() => handleStart(true)}
                disabled={loading}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-200 transition active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                START FLOOD DEMO
              </button>
            )}

            <button
              onClick={handleAdvance}
              disabled={loading}
              className="px-4 py-2 bg-[#3b49df] hover:bg-[#2f3dbd] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-200 transition active:scale-95"
            >
              <SkipForward className="w-3.5 h-3.5" />
              Next Step (+1)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
