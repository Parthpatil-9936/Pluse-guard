import React, { useState } from 'react';
import {
  Activity,
  Server,
  Cloud,
  CloudOff,
  ShieldCheck,
  Zap,
  Volume2,
  VolumeX,
  Box,
  LayoutGrid,
  Columns3,
  AlertOctagon,
  Network,
} from 'lucide-react';
import { THEME } from '../theme';
import { ServerTopologyModal } from './ServerTopologyModal';

interface HeaderProps {
  cloudOnline: boolean;
  onToggleCloudOutage: () => void;
  suppressionRate: number;
  viewMode: '3d' | 'hybrid' | 'grid';
  onChangeViewMode: (mode: '3d' | 'hybrid' | 'grid') => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  activeTier1Count: number;
  activeTier2Count: number;
}

export const Header: React.FC<HeaderProps> = ({
  cloudOnline,
  onToggleCloudOutage,
  suppressionRate,
  viewMode,
  onChangeViewMode,
  soundEnabled,
  onToggleSound,
  activeTier1Count,
  activeTier2Count,
}) => {
  const [showTopology, setShowTopology] = useState(false);

  return (
    <>
      <header className="bg-white/95 backdrop-blur-xl border-b border-slate-300 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40 shadow-sm">
        {/* 1. Brand & Ward Subtitle */}
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 rounded-2xl bg-teal-600 text-white shadow-md shadow-teal-700/20 ring-1 ring-teal-500">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-black text-slate-900 tracking-tight">
                PulseGuard-AI
              </h1>
              <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 shadow-xs">
                3D ICU COMMAND CENTER
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              ICU Ward Alpha • 10-Bed Autonomous Telemetry Triage
            </p>
          </div>
        </div>

        {/* 2. View Mode Switcher (3D Ward, Hybrid, Grid Matrix) */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-xs">
          <button
            onClick={() => onChangeViewMode('3d')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 transition-all ${
              viewMode === '3d'
                ? 'bg-teal-600 text-white border border-teal-600 shadow-sm ring-1 ring-teal-500'
                : 'text-slate-600 hover:text-slate-900 border border-transparent'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D Ward Room</span>
          </button>

          <button
            onClick={() => onChangeViewMode('hybrid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 transition-all ${
              viewMode === 'hybrid'
                ? 'bg-teal-600 text-white border border-teal-600 shadow-sm ring-1 ring-teal-500'
                : 'text-slate-600 hover:text-slate-900 border border-transparent'
            }`}
          >
            <Columns3 className="w-3.5 h-3.5" />
            <span>Split Hybrid</span>
          </button>

          <button
            onClick={() => onChangeViewMode('grid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 transition-all ${
              viewMode === 'grid'
                ? 'bg-teal-600 text-white border border-teal-600 shadow-sm ring-1 ring-teal-500'
                : 'text-slate-600 hover:text-slate-900 border border-transparent'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Card Matrix</span>
          </button>
        </div>

        {/* 3. Center Status & Noise Suppression Metric */}
        <div className="hidden xl:flex items-center space-x-4">
          {/* Emergency Tally Badge */}
          {activeTier1Count > 0 ? (
            <div className="bg-red-50 border border-red-300 px-3.5 py-1.5 rounded-2xl flex items-center space-x-2 text-red-700 animate-pulse shadow-sm">
              <AlertOctagon className="w-4 h-4 text-red-600 animate-bounce" />
              <div>
                <div className="text-[9px] font-mono uppercase tracking-wider text-red-600 font-bold">
                  Critical Emergencies
                </div>
                <div className="text-xs font-mono font-extrabold text-red-800">
                  {activeTier1Count} Bed{activeTier1Count > 1 ? 's' : ''} in Tier 1
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-2xl flex items-center space-x-2 text-emerald-800 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-mono font-semibold">All Patient Vitals Stable</span>
            </div>
          )}

          {/* Noise Suppression Ring */}
          <div className="bg-slate-50 px-3.5 py-1.5 rounded-2xl border border-slate-200 flex items-center space-x-2.5 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <div>
              <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
                Noise Suppression
              </div>
              <div className="text-xs font-mono font-black text-teal-800">
                {suppressionRate}% <span className="text-[9px] text-slate-400 font-normal">(Target &gt;75%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Enhanced Server Architecture & Resilience Controls */}
        <div className="flex items-center space-x-2.5">
          {/* Local Edge Server Indicator */}
          <div
            onClick={() => setShowTopology(true)}
            className="cursor-pointer bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-2xl border border-slate-300 flex items-center space-x-2 transition-all shadow-xs"
            title="Local Edge Gateway: Online on port 8000. Click to inspect topology."
          >
            <div className="relative flex items-center justify-center">
              <Server className="w-3.5 h-3.5 text-teal-700" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping absolute -top-0.5 -right-0.5" />
            </div>
            <div className="text-left hidden lg:block">
              <div className="text-[8px] font-mono text-slate-400 uppercase font-semibold">Local Edge</div>
              <div className="text-[10px] font-mono font-bold text-slate-800">Active :8000</div>
            </div>
          </div>

          {/* Cloud Uplink Indicator */}
          <div
            onClick={() => setShowTopology(true)}
            className={`cursor-pointer flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl border text-xs font-mono font-bold transition-all shadow-xs ${
              cloudOnline
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                : 'bg-red-50 border-red-300 text-red-700 animate-pulse hover:bg-red-100'
            }`}
            title="Click to view Cloud & Edge resilience topology"
          >
            {cloudOnline ? (
              <>
                <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Cloud Synced</span>
              </>
            ) : (
              <>
                <CloudOff className="w-3.5 h-3.5 text-red-600" />
                <span className="hidden sm:inline">Cloud Offline</span>
              </>
            )}
          </div>

          {/* Architecture Topology Modal Trigger */}
          <button
            onClick={() => setShowTopology(true)}
            className="p-2 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-300 shadow-xs transition-all"
            title="View Full Edge & Cloud Resilience Topology"
          >
            <Network className="w-4 h-4 text-teal-600" />
          </button>

          {/* Audio Toggle */}
          <button
            onClick={onToggleSound}
            className={`p-2.5 rounded-2xl border transition-all flex items-center space-x-1.5 shadow-sm ${
              soundEnabled
                ? 'bg-teal-50 text-teal-800 border-teal-300 shadow-teal-100'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title={soundEnabled ? 'Medical Audio Siren Enabled' : 'Enable Medical Audio Sirens'}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-teal-600 animate-pulse" />
                <span className="text-xs font-mono font-bold hidden sm:inline">Audio On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-mono font-semibold text-slate-500 hidden sm:inline">Muted</span>
              </>
            )}
          </button>

          {/* Simulate Cloud Outage Toggle Button */}
          <button
            onClick={onToggleCloudOutage}
            className={`px-3 py-2 rounded-2xl text-xs font-semibold font-mono transition-all flex items-center space-x-1.5 border shadow-sm ${
              cloudOnline
                ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden md:inline">
              {cloudOnline ? 'Simulate Outage' : 'Restore Link'}
            </span>
          </button>
        </div>
      </header>

      {/* Resilience Topology Modal */}
      <ServerTopologyModal
        isOpen={showTopology}
        onClose={() => setShowTopology(false)}
        cloudOnline={cloudOnline}
        onToggleCloudOutage={onToggleCloudOutage}
        suppressionRate={suppressionRate}
      />
    </>
  );
};


