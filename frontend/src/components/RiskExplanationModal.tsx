import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldAlert, 
  CloudRain, 
  Waves, 
  TrendingUp, 
  Layers, 
  History, 
  CheckCircle2, 
  Compass, 
  RefreshCw,
  ChevronRight,
  Info
} from 'lucide-react';
import { apiService } from '../services/api';
import { WatershedRiskEvaluation } from '../types';

interface RiskExplanationModalProps {
  watershedId: number;
  isOpen: boolean;
  onClose: () => void;
}

export const RiskExplanationModal: React.FC<RiskExplanationModalProps> = ({
  watershedId,
  isOpen,
  onClose,
}) => {
  const [data, setData] = useState<WatershedRiskEvaluation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'breakdown' | 'history' | 'formula'>('breakdown');

  const fetchEvaluation = async () => {
    if (!watershedId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.getWatershedRiskEvaluation(watershedId);
      setData(res);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to evaluate explainable risk score.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && watershedId) {
      fetchEvaluation();
    }
  }, [isOpen, watershedId]);

  if (!isOpen) return null;

  const getTierColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return {
          bg: 'bg-rose-950/80',
          border: 'border-rose-600',
          text: 'text-rose-400',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          glow: 'shadow-rose-500/20',
          bar: 'bg-rose-500'
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-950/80',
          border: 'border-orange-600',
          text: 'text-orange-400',
          badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
          glow: 'shadow-orange-500/20',
          bar: 'bg-orange-500'
        };
      case 'MODERATE':
        return {
          bg: 'bg-amber-950/80',
          border: 'border-amber-600',
          text: 'text-amber-400',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          glow: 'shadow-amber-500/20',
          bar: 'bg-amber-500'
        };
      default:
        return {
          bg: 'bg-emerald-950/80',
          border: 'border-emerald-600',
          text: 'text-emerald-400',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          glow: 'shadow-emerald-500/20',
          bar: 'bg-emerald-500'
        };
    }
  };

  const colors = data ? getTierColor(data.risk_level) : getTierColor('LOW');

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${colors.badgeBg}`}>
              <ShieldAlert className={`w-6 h-6 ${colors.text}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {data?.watershed_name || 'Catchment Risk Details'}
                </h2>
                {data && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                    {data.watershed_code}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Transparent Explainable Risk Engine • Multi-Factor Weighted Evaluation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchEvaluation}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Recalculate live risk evaluation"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 border border-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-slate-800/80 bg-slate-900/50 text-xs font-medium">
          <button
            onClick={() => setActiveTab('breakdown')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'breakdown' 
                ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-700/60 font-semibold' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Factor Breakdown & Explanations
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'history' 
                ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-700/60 font-semibold' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Historical Disaster Comparison
          </button>
          <button
            onClick={() => setActiveTab('formula')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'formula' 
                ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-700/60 font-semibold' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Transparent Scoring Formulation
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
              <p className="text-sm font-medium">Evaluating multi-parameter hydrological risk model...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-700 text-rose-300 text-sm">
              <div className="font-bold mb-1">Evaluation Error</div>
              {error}
            </div>
          ) : data ? (
            <>
              {/* Top Hero Score Banner */}
              <div className={`p-5 rounded-2xl border ${colors.border} ${colors.bg} flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl`}>
                <div className="flex items-center gap-5">
                  {/* Circular Score Gauge representation */}
                  <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-slate-900/90 border-4 border-slate-700 shadow-inner">
                    <div className="text-center">
                      <span className={`text-3xl font-extrabold font-mono ${colors.text}`}>
                        {data.risk_score}
                      </span>
                      <div className="text-[10px] text-slate-400 font-semibold">/ 100</div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${colors.badgeBg}`}>
                        {data.risk_level} RISK LEVEL
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {data.district}, {data.state}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white">
                      Comprehensive Catchment Vulnerability Assessment
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Area: <span className="font-mono font-semibold">{data.area_sq_km} km²</span> • Normalized Hydrological Composite
                    </p>
                  </div>
                </div>

                {/* Recommendation Box */}
                <div className="w-full md:w-80 p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Protocol Action Recommendation:
                  </div>
                  <p className="text-slate-200 font-medium leading-relaxed">
                    {data.recommendation}
                  </p>
                </div>
              </div>

              {/* TAB 1: Factor Breakdown & Explanations */}
              {activeTab === 'breakdown' && (
                <div className="space-y-6">
                  {/* "Why is risk high?" Plain-Language Explanation Section */}
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                    <h4 className="text-sm font-bold text-cyan-300 flex items-center gap-2 mb-3">
                      <Info className="w-4 h-4 text-cyan-400" />
                      Explainability Diagnostic Summary ("Why this score?")
                    </h4>
                    <div className="space-y-2">
                      {data.explanation.map((item, idx) => (
                        <div 
                          key={idx} 
                          className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80 text-xs text-slate-200"
                        >
                          <ChevronRight className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Factor Scoring Cards */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-200 mb-3 flex items-center justify-between">
                      <span>Multi-Factor Mathematical Weights & Sub-scores:</span>
                      <span className="text-xs text-slate-400 font-normal">7 Core Hydrological Dimensions</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {/* 1. Rainfall Intensity */}
                      <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/70 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <CloudRain className="w-4 h-4 text-sky-400" />
                            Rainfall Intensity
                          </span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-sky-300 border border-slate-700">
                            Weight: {Math.round(data.factors.rainfall.weight * 100)}%
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between mb-1.5">
                          <span className="text-xs text-slate-400">Measured Rate:</span>
                          <span className="text-sm font-bold font-mono text-white">
                            {data.factors.rainfall.value} {data.factors.rainfall.unit}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-400">Sub-Score Impact:</span>
                            <span className="font-mono font-bold text-cyan-400">{data.factors.rainfall.score} / 100</span>
                          </div>
                          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full bg-sky-400 rounded-full" style={{ width: `${data.factors.rainfall.score}%` }} />
                          </div>
                        </div>
                      </div>

                      {/* 2. 3h Cumulative Rain */}
                      <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/70 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <CloudRain className="w-4 h-4 text-blue-400" />
                            Accumulated Rainfall (3h)
                          </span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-blue-300 border border-slate-700">
                            Weight: {Math.round(data.factors.accumulated_rain.weight * 100)}%
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between mb-1.5">
                          <span className="text-xs text-slate-400">Storm Total:</span>
                          <span className="text-sm font-bold font-mono text-white">
                            {data.factors.accumulated_rain.value} {data.factors.accumulated_rain.unit}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-400">Sub-Score Impact:</span>
                            <span className="font-mono font-bold text-cyan-400">{data.factors.accumulated_rain.score} / 100</span>
                          </div>
                          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full bg-blue-400 rounded-full" style={{ width: `${data.factors.accumulated_rain.score}%` }} />
                          </div>
                        </div>
                      </div>

                      {/* 3. River Water Level */}
                      <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/70 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <Waves className="w-4 h-4 text-cyan-400" />
                            River Stage Depth
                          </span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-700">
                            Weight: {Math.round(data.factors.river_level.weight * 100)}%
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between mb-1.5">
                          <span className="text-xs text-slate-400">Current Gauge:</span>
                          <span className="text-sm font-bold font-mono text-white">
                            {data.factors.river_level.value} {data.factors.river_level.unit}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-400">Sub-Score Impact:</span>
                            <span className="font-mono font-bold text-cyan-400">{data.factors.river_level.score} / 100</span>
                          </div>
                          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${data.factors.river_level.score}%` }} />
                          </div>
                        </div>
                      </div>

                      {/* 4. River Rate of Rise */}
                      <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/70 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4 text-rose-400" />
                            River Rate of Rise (Δh/Δt)
                          </span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-rose-300 border border-slate-700">
                            Weight: {Math.round(data.factors.rate_of_rise.weight * 100)}%
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between mb-1.5">
                          <span className="text-xs text-slate-400">Surge Velocity:</span>
                          <span className="text-sm font-bold font-mono text-white">
                            +{data.factors.rate_of_rise.value} {data.factors.rate_of_rise.unit}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-400">Sub-Score Impact:</span>
                            <span className="font-mono font-bold text-cyan-400">{data.factors.rate_of_rise.score} / 100</span>
                          </div>
                          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full bg-rose-400 rounded-full" style={{ width: `${data.factors.rate_of_rise.score}%` }} />
                          </div>
                        </div>
                      </div>

                      {/* 5. Soil Moisture Saturation */}
                      <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/70 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-amber-400" />
                            Soil Moisture Saturation
                          </span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-amber-300 border border-slate-700">
                            Weight: {Math.round(data.factors.soil_moisture.weight * 100)}%
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between mb-1.5">
                          <span className="text-xs text-slate-400">Saturation Level:</span>
                          <span className="text-sm font-bold font-mono text-white">
                            {data.factors.soil_moisture.value} {data.factors.soil_moisture.unit}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-400">Sub-Score Impact:</span>
                            <span className="font-mono font-bold text-cyan-400">{data.factors.soil_moisture.score} / 100</span>
                          </div>
                          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${data.factors.soil_moisture.score}%` }} />
                          </div>
                        </div>
                      </div>

                      {/* 6. Slope & Terrain */}
                      <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/70 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <Compass className="w-4 h-4 text-emerald-400" />
                            Topographical Slope Gradient
                          </span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-emerald-300 border border-slate-700">
                            Weight: {Math.round(data.factors.slope.weight * 100)}%
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between mb-1.5">
                          <span className="text-xs text-slate-400">Catchment Incline:</span>
                          <span className="text-sm font-bold font-mono text-white">
                            {data.factors.slope.value}°
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-400">Sub-Score Impact:</span>
                            <span className="font-mono font-bold text-cyan-400">{data.factors.slope.score} / 100</span>
                          </div>
                          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${data.factors.slope.score}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Historical Disaster Comparison */}
              {activeTab === 'history' && (
                <div className="space-y-5">
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                    <h4 className="text-sm font-bold text-cyan-300 flex items-center gap-2 mb-2">
                      <History className="w-4 h-4 text-cyan-400" />
                      Historical Benchmark & Disaster Similarity
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Cross-references current hydraulic and meteorological observations against historical severe flood inundation events recorded in {data.district} and the {data.watershed_name}.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 text-center">
                      <div className="text-xs text-slate-400 mb-1">Past Severe Events</div>
                      <div className="text-2xl font-bold font-mono text-white">
                        {data.historical_comparison.past_events_count}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">Recorded in registry</div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 text-center">
                      <div className="text-xs text-slate-400 mb-1">Worst Recorded Peak Stage</div>
                      <div className="text-2xl font-bold font-mono text-rose-400">
                        {data.historical_comparison.worst_event_max_water_m} m
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">{data.historical_comparison.worst_event_name}</div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 text-center">
                      <div className="text-xs text-slate-400 mb-1">Disaster Pattern Match</div>
                      <div className="text-2xl font-bold font-mono text-amber-400">
                        {data.historical_comparison.similarity_index_pct}%
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">Hydrological profile alignment</div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Transparent Scoring Formulation */}
              {activeTab === 'formula' && (
                <div className="space-y-4 text-xs text-slate-300">
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                    <h4 className="text-sm font-bold text-white mb-2">Mathematical Formulation (No Black Box)</h4>
                    <p className="leading-relaxed mb-3">
                      The Explainable Flood Risk Engine calculates the normalized final risk score using a weighted linear combination of normalized sub-factor scores:
                    </p>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-cyan-300 text-xs overflow-x-auto">
                      Risk_Score = Σ (Weight_i × Score_i) / Σ (Weight_i)
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                    <h5 className="font-bold text-slate-200 mb-2">Standard Severity Tiers</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                      <div className="p-2 rounded bg-emerald-950/60 border border-emerald-700 text-emerald-300 font-semibold">
                        0 – 25 : LOW
                      </div>
                      <div className="p-2 rounded bg-amber-950/60 border border-amber-700 text-amber-300 font-semibold">
                        26 – 50 : MODERATE
                      </div>
                      <div className="p-2 rounded bg-orange-950/60 border border-orange-700 text-orange-300 font-semibold">
                        51 – 75 : HIGH
                      </div>
                      <div className="p-2 rounded bg-rose-950/60 border border-rose-700 text-rose-300 font-semibold">
                        76 – 100 : CRITICAL
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-950/70 text-xs text-slate-400">
          <span>Evaluated at: {data?.evaluated_at ? new Date(data.evaluated_at).toLocaleTimeString() : 'N/A'}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};
