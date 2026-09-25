import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  FileText, 
  CheckCircle, 
  Shield, 
  Activity, 
  Radio, 
  Users, 
  Calendar,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePwa } from '../context/PwaContext';

export type ReportType = 'sitrep' | 'telemetry' | 'predictions' | 'evacuation' | 'citizen-log';

interface ReportGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultReportType?: ReportType;
}

export const ReportGenerationModal: React.FC<ReportGenerationModalProps> = ({
  isOpen,
  onClose,
  defaultReportType = 'sitrep'
}) => {
  const { user } = useAuth();
  const { isOnline } = usePwa();

  const [reportType, setReportType] = useState<ReportType>(defaultReportType);
  const [classification, setClassification] = useState<string>('URGENT DISASTER SITREP // LEVEL-3 ACTIVATION');
  const [basinRegion, setBasinRegion] = useState<string>('Mandakini Basin (Kedarnath / Gaurikund / Rudraprayag)');
  const [commanderName, setCommanderName] = useState<string>(user?.name || 'District Emergency Operation Commander (DEOC)');
  const [generatedDate, setGeneratedDate] = useState<string>('');
  const [reportId, setReportId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      setGeneratedDate(now.toLocaleString('en-IN', {
        dateStyle: 'full',
        timeStyle: 'medium',
        timeZone: 'Asia/Kolkata'
      }));
      setReportId(`SITREP-IN-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`);
      if (user?.name) {
        setCommanderName(`${user.name} (${user.role.replace('_', ' ')})`);
      }
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    const reportData = {
      reportId,
      reportType,
      classification,
      basinRegion,
      commanderName,
      generatedDate,
      reportingPeriod: 'Live Real-Time Operational Snapshot (0-120 min)',
      hydrologyTelemetry: [
        { station: 'Kedarnath Upper Gauge (KG-01)', river: 'Mandakini', waterLevelM: 4.82, dangerLevelM: 5.0, rainfallRateMmHr: 48.5, status: 'CRITICAL WARNING' },
        { station: 'Gaurikund Bridge Station (GB-02)', river: 'Mandakini', waterLevelM: 3.90, dangerLevelM: 4.5, rainfallRateMmHr: 36.2, status: 'WARNING' },
        { station: 'Sonprayag Confluence (SC-03)', river: 'Mandakini / Songanga', waterLevelM: 3.15, dangerLevelM: 4.2, rainfallRateMmHr: 28.0, status: 'ELEVATED' },
        { station: 'Rudraprayag Sangam (RS-04)', river: 'Alaknanda Confluence', waterLevelM: 7.20, dangerLevelM: 9.0, rainfallRateMmHr: 18.5, status: 'NORMAL' },
      ],
      aiForecastSurge: [
        { horizon: '+30 Mins', predictedLevelM: 5.35, probabilityPct: 94.2, alertStatus: 'RED FLASH FLOOD SURGE' },
        { horizon: '+60 Mins', predictedLevelM: 5.68, probabilityPct: 89.7, alertStatus: 'SEVERE INUNDATION PEAK' },
        { horizon: '+90 Mins', predictedLevelM: 5.12, probabilityPct: 76.4, alertStatus: 'RECEDING RECEDING PHASE' },
        { horizon: '+120 Mins', predictedLevelM: 4.40, probabilityPct: 62.1, alertStatus: 'STABILIZING FLOW' },
      ],
      evacuationLogistics: [
        { shelter: 'Sonprayag High School Relief Camp', capacity: 600, occupied: 380, safeRoute: 'Route A-North Open', readiness: '95%' },
        { shelter: 'Guptkashi Sports Complex', capacity: 1200, occupied: 450, safeRoute: 'NH-107 Bypass Active', readiness: '98%' },
        { shelter: 'Agastyamuni Community Center', capacity: 800, occupied: 120, safeRoute: 'South Ridge Road Safe', readiness: '92%' },
      ],
      edgeSirens: [
        { node: 'Node-LORA-KD01', location: 'Kedarnath Temple Perimeter', status: 'ACTIVE // BROADCASTING', batteryPct: 94 },
        { node: 'Node-LORA-GK02', location: 'Gaurikund Helipad Junction', status: 'ACTIVE // STANDBY', batteryPct: 88 },
        { node: 'Node-LORA-SP03', location: 'Sonprayag Market Gate', status: 'ACTIVE // STANDBY', batteryPct: 91 },
      ]
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportId}_REPORT.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:overflow-visible">
      {/* Container */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden print:max-w-none print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Modal Header (Hidden during Print) */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between gap-4 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">Executive Incident & Operational Report Generator</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  LIVE COMPILER
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Generate, configure, and export standardized disaster operational SITREPs, telemetry logs, and AI forecasts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black rounded-xl flex items-center gap-2 shadow-md transition active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>PRINT / SAVE AS PDF</span>
            </button>
            <button
              onClick={handleDownloadJSON}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition border border-slate-700"
              title="Download Report JSON Data"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export Data</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Configuration Bar (Hidden during Print) */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs print:hidden">
          {/* Report Type Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Report Format
            </label>
            <div className="relative">
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 appearance-none pr-8 cursor-pointer"
              >
                <option value="sitrep">Disaster Operational SITREP (Comprehensive)</option>
                <option value="telemetry">IoT Sensor & Hydrological Gauge Audit</option>
                <option value="predictions">AI Flood Surge & Inundation Risk Forecast</option>
                <option value="evacuation">Evacuation Shelters & Safe Route Readiness</option>
                <option value="citizen-log">Citizen Field Reports & Incident Timeline</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Region Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Disaster Zone / Basin
            </label>
            <div className="relative">
              <select
                value={basinRegion}
                onChange={(e) => setBasinRegion(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 appearance-none pr-8 cursor-pointer"
              >
                <option value="Mandakini Basin (Kedarnath / Gaurikund / Rudraprayag)">Mandakini Basin (Kedarnath / Rudraprayag)</option>
                <option value="Alaknanda Basin (Joshimath / Chamoli)">Alaknanda Basin (Joshimath / Chamoli)</option>
                <option value="Bhagirathi Basin (Uttarkashi / Dharasu)">Bhagirathi Basin (Uttarkashi / Dharasu)</option>
                <option value="Pindar River Watershed (Tharali / Karnaprayag)">Pindar River Watershed (Tharali / Karnaprayag)</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Classification */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Classification Tag
            </label>
            <input
              type="text"
              value={classification}
              onChange={(e) => setClassification(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
            />
          </div>

          {/* Reporting Authority */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Reporting Officer / Authority
            </label>
            <input
              type="text"
              value={commanderName}
              onChange={(e) => setCommanderName(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
            />
          </div>
        </div>

        {/* Report Preview Body (Printable Area) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 text-slate-900 bg-white font-sans print:overflow-visible print:p-0">
          
          {/* Printable Document Header */}
          <div className="border-b-2 border-slate-900 pb-5 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-md border-2 border-amber-500">
                  ⚡
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight uppercase">
                    NATIONAL FLASH FLOOD EARLY WARNING & DISASTER RESPONSE SYSTEM
                  </h1>
                  <p className="text-xs font-semibold text-slate-600 flex items-center gap-2 mt-0.5">
                    <span>MINISTRY OF JAL SHAKTI // STATE DISASTER MANAGEMENT AUTHORITY (SDMA)</span>
                    <span>•</span>
                    <span className="font-mono text-indigo-700 font-bold">{reportId}</span>
                  </p>
                </div>
              </div>

              {/* Classification Stamp */}
              <div className="text-right sm:self-center">
                <div className="inline-block px-3 py-1 bg-red-100 border-2 border-red-600 text-red-800 font-black text-xs uppercase tracking-widest rounded-md shadow-xs">
                  {classification}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">
                  ISSUED UNDER DISASTER MANAGEMENT ACT, 2005
                </div>
              </div>
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium">
              <div>
                <span className="text-[10px] uppercase text-slate-500 font-bold block">Incident / Target Basin</span>
                <span className="font-bold text-slate-900">{basinRegion}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-500 font-bold block">Timestamp (IST)</span>
                <span className="font-mono font-bold text-slate-900">{generatedDate}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-500 font-bold block">Reporting Authority</span>
                <span className="font-bold text-slate-900">{commanderName}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-500 font-bold block">Network / Mesh Status</span>
                <span className={`inline-flex items-center gap-1 font-bold ${isOnline ? 'text-emerald-700' : 'text-amber-700'}`}>
                  <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-600' : 'bg-amber-600'}`}></span>
                  {isOnline ? '100% ONLINE // LORA EDGE SYNC' : 'OFFLINE BUFFERING'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 1: Executive Incident Summary & Threat Level */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-sm font-black text-slate-950 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-600" />
                <span>1. Operational Threat Assessment & Critical Warnings</span>
              </h2>
              <span className="text-[11px] font-mono text-red-700 font-black bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                STAGE-IV FLASH FLOOD EMERGENCY
              </span>
            </div>

            <div className="p-4 bg-gradient-to-br from-red-50 to-orange-50/40 border-l-4 border-red-600 rounded-r-xl text-xs space-y-2 text-slate-800">
              <p className="leading-relaxed">
                <strong className="text-red-950 font-black">EXECUTIVE SUMMARY:</strong> Heavy convective cloudburst event detected upstream in the Kedarnath Catchment. Cloudburst intensity exceeded <strong className="font-bold text-red-900">48.5 mm/hr</strong> at 3,584m altitude. Flash surge wave estimated to reach Sonprayag confluence within <strong className="font-bold text-red-900">22 minutes</strong>. Autonomous sirens have been triggered across 3 critical LoRa mesh edge nodes.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-white/80 p-2.5 rounded-lg border border-red-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Peak Projected Discharge</span>
                  <span className="text-lg font-black text-red-600 font-mono">1,420 m³/s</span>
                  <span className="text-[10px] text-red-700 block mt-0.5 font-bold">▲ 285% above Danger Datum</span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-lg border border-orange-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Estimated Time to Peak (T_p)</span>
                  <span className="text-lg font-black text-orange-600 font-mono">35 Minutes</span>
                  <span className="text-[10px] text-orange-700 block mt-0.5 font-bold">Fast-rising flash hydrograph</span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-lg border border-red-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Vulnerable Population at Risk</span>
                  <span className="text-lg font-black text-red-700 font-mono">3,850 Citizens</span>
                  <span className="text-[10px] text-emerald-700 block mt-0.5 font-bold">✓ 1,240 Evacuated to High Ground</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Real-time Hydrology & Gauge Telemetry Table */}
          <div className="mb-6">
            <h2 className="text-sm font-black text-slate-950 uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>2. River Hydrology & Gauge Station Telemetry</span>
            </h2>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-black text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Station Code & Name</th>
                    <th className="py-2.5 px-3">River Reach</th>
                    <th className="py-2.5 px-3 font-mono">Water Level (m)</th>
                    <th className="py-2.5 px-3 font-mono">Danger Level (m)</th>
                    <th className="py-2.5 px-3 font-mono">Rainfall (mm/hr)</th>
                    <th className="py-2.5 px-3">Operational Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  <tr className="bg-red-50/50">
                    <td className="py-2 px-3 font-bold text-slate-900">KG-01 • Kedarnath Upper Gauge</td>
                    <td className="py-2 px-3 text-slate-600">Mandakini (Glacial)</td>
                    <td className="py-2 px-3 font-mono font-black text-red-700">4.82 m</td>
                    <td className="py-2 px-3 font-mono text-slate-600">5.00 m</td>
                    <td className="py-2 px-3 font-mono font-bold text-red-600">48.5 mm/h</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-600 text-white">
                        CRITICAL SURGE
                      </span>
                    </td>
                  </tr>
                  <tr className="bg-orange-50/40">
                    <td className="py-2 px-3 font-bold text-slate-900">GB-02 • Gaurikund Bridge Sensor</td>
                    <td className="py-2 px-3 text-slate-600">Mandakini Mid-Reach</td>
                    <td className="py-2 px-3 font-mono font-black text-orange-700">3.90 m</td>
                    <td className="py-2 px-3 font-mono text-slate-600">4.50 m</td>
                    <td className="py-2 px-3 font-mono font-bold text-orange-600">36.2 mm/h</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-orange-500 text-white">
                        HIGH WARNING
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-slate-900">SC-03 • Sonprayag Confluence Node</td>
                    <td className="py-2 px-3 text-slate-600">Mandakini / Songanga</td>
                    <td className="py-2 px-3 font-mono font-bold text-amber-700">3.15 m</td>
                    <td className="py-2 px-3 font-mono text-slate-600">4.20 m</td>
                    <td className="py-2 px-3 font-mono font-bold text-amber-600">28.0 mm/h</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                        ELEVATED FLOW
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-slate-900">RS-04 • Rudraprayag Sangam Hydrometric</td>
                    <td className="py-2 px-3 text-slate-600">Alaknanda Confluence</td>
                    <td className="py-2 px-3 font-mono font-bold text-emerald-700">7.20 m</td>
                    <td className="py-2 px-3 font-mono text-slate-600">9.00 m</td>
                    <td className="py-2 px-3 font-mono text-slate-600">18.5 mm/h</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                        NORMAL / MONITORING
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: AI Model Projections & Horizon Predictions */}
          <div className="mb-6">
            <h2 className="text-sm font-black text-slate-950 uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>3. AI Machine Learning Hydrograph & Peak Predictions</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-[10px] font-black text-slate-500 uppercase block">+30 Min Horizon</span>
                <span className="text-lg font-black text-red-600 font-mono">5.35 m (+0.53m)</span>
                <div className="text-[10px] text-slate-600 font-semibold mt-1">Surge Confidence: 94.2%</div>
                <span className="mt-1.5 inline-block px-2 py-0.5 rounded text-[9px] font-black bg-red-600 text-white">RED ALERT</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-[10px] font-black text-slate-500 uppercase block">+60 Min Horizon</span>
                <span className="text-lg font-black text-red-700 font-mono">5.68 m (PEAK)</span>
                <div className="text-[10px] text-slate-600 font-semibold mt-1">Inundation Prob: 89.7%</div>
                <span className="mt-1.5 inline-block px-2 py-0.5 rounded text-[9px] font-black bg-red-700 text-white">PEAK CREST</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-[10px] font-black text-slate-500 uppercase block">+90 Min Horizon</span>
                <span className="text-lg font-black text-orange-600 font-mono">5.12 m (-0.56m)</span>
                <div className="text-[10px] text-slate-600 font-semibold mt-1">Receding Rate: 0.18 m/h</div>
                <span className="mt-1.5 inline-block px-2 py-0.5 rounded text-[9px] font-black bg-orange-500 text-white">RECEDING</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-[10px] font-black text-slate-500 uppercase block">+120 Min Horizon</span>
                <span className="text-lg font-black text-emerald-600 font-mono">4.40 m (SAFE)</span>
                <div className="text-[10px] text-slate-600 font-semibold mt-1">Below Danger Threshold</div>
                <span className="mt-1.5 inline-block px-2 py-0.5 rounded text-[9px] font-black bg-emerald-600 text-white">CONTROLLED</span>
              </div>
            </div>
          </div>

          {/* Section 4: Evacuation Shelters & LoRa Mesh Network */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Shelters */}
            <div>
              <h2 className="text-sm font-black text-slate-950 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>4. Evacuation Shelters & Relief Capacity</span>
              </h2>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-black text-[10px] uppercase">
                    <tr>
                      <th className="py-2 px-3">Relief Center</th>
                      <th className="py-2 px-3">Occupancy</th>
                      <th className="py-2 px-3">Safe Route</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    <tr>
                      <td className="py-2 px-3 font-bold">Sonprayag High School</td>
                      <td className="py-2 px-3 font-mono font-bold text-amber-700">380 / 600 (63%)</td>
                      <td className="py-2 px-3 text-emerald-700 font-semibold">Route A Open</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-bold">Guptkashi Sports Complex</td>
                      <td className="py-2 px-3 font-mono font-bold text-emerald-700">450 / 1200 (37%)</td>
                      <td className="py-2 px-3 text-emerald-700 font-semibold">NH-107 Bypass</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-bold">Agastyamuni Camp</td>
                      <td className="py-2 px-3 font-mono font-bold text-emerald-700">120 / 800 (15%)</td>
                      <td className="py-2 px-3 text-emerald-700 font-semibold">South Ridge Safe</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Edge Sirens */}
            <div>
              <h2 className="text-sm font-black text-slate-950 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                <Radio className="w-4 h-4 text-amber-600" />
                <span>5. Autonomous Edge Sirens (LoRa Mesh)</span>
              </h2>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-black text-[10px] uppercase">
                    <tr>
                      <th className="py-2 px-3">Edge Node ID</th>
                      <th className="py-2 px-3">Location</th>
                      <th className="py-2 px-3">Siren Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    <tr className="bg-red-50/40">
                      <td className="py-2 px-3 font-mono font-bold">LORA-KD01</td>
                      <td className="py-2 px-3">Kedarnath Perimeter</td>
                      <td className="py-2 px-3 font-black text-red-700">TRIGGERED (110dB)</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono font-bold">LORA-GK02</td>
                      <td className="py-2 px-3">Gaurikund Helipad</td>
                      <td className="py-2 px-3 font-bold text-slate-600">ARMED // STANDBY</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono font-bold">LORA-SP03</td>
                      <td className="py-2 px-3">Sonprayag Gateway</td>
                      <td className="py-2 px-3 font-bold text-slate-600">ARMED // STANDBY</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Section 5: Standard Operating Procedure (SOP) Action Directive Checklist */}
          <div className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <h2 className="text-sm font-black text-slate-950 uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span>6. Mandatory Incident Command Directive Checklist</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 font-black">☑</span>
                <span>Deploy NDRF & SDRF Quick Reaction Teams to Sector-1</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 font-black">☑</span>
                <span>Halt all pedestrian and vehicular traffic across Gaurikund bridge</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 font-black">☑</span>
                <span>Transmit CAP Cell-Broadcast Alert in Hindi & English</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 font-black">☑</span>
                <span>Activate Offline PWA local cache synchronization for field workers</span>
              </div>
            </div>
          </div>

          {/* Official Sign-off and Authorization Footer */}
          <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Report Prepared By</span>
              <p className="font-bold text-slate-950 mt-1">{commanderName}</p>
              <p className="text-[11px] text-slate-500">DEOC Disaster Response Cell</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Incident Commander Signature</span>
              <div className="h-8 border-b border-dashed border-slate-400 mt-2 flex items-end">
                <span className="text-[10px] font-mono text-slate-400 italic">Digitally Certified via PKI Token</span>
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1 text-right">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Verification Security Hash</span>
              <p className="font-mono text-[10px] text-slate-600 break-all mt-1">
                SHA256: 9f82a1c0d4e3...b7189f2
              </p>
              <p className="text-[9px] text-slate-400 mt-0.5">Govt. of Uttarakhand / SDMA Portal</p>
            </div>
          </div>

        </div>

        {/* Modal Footer Controls (Hidden during Print) */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Generated for {basinRegion}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl font-bold text-slate-700 transition"
            >
              Close Preview
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-black rounded-xl flex items-center gap-2 shadow-md transition active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>GENERATE & PRINT PDF REPORT</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
