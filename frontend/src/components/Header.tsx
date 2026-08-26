import React from 'react';
import {
  Activity,
  Wifi,
  WifiOff,
  ShieldCheck,
  Zap,
  Volume2,
  VolumeX,
  Box,
  LayoutGrid,
  Columns3,
  AlertOctagon,
} from 'lucide-react';

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
  return (
    <header className="bg-[#0A0E17]/95 backdrop-blur-xl border-b border-slate-800/80 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40 shadow-2xl">
      {/* 1. Brand & Ward Subtitle */}
      <div className="flex items-center space-x-3.5">
        <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/25 ring-1 ring-white/20">
          <Activity className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-black text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-cyan-200">
              PulseGuard-AI
            </h1>
            <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-800/60 shadow-sm">
              3D ICU COMMAND CENTER
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            ICU Ward Alpha • 10-Bed Autonomous Telemetry Triage
          </p>
        </div>
      </div>

      {/* 2. View Mode Switcher (3D Ward, Hybrid, Grid Matrix) */}
      <div className="flex items-center bg-slate-950/80 p-1 rounded-2xl border border-slate-800 shadow-inner">
        <button
          onClick={() => onChangeViewMode('3d')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 transition-all ${
            viewMode === '3d'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-md ring-1 ring-cyan-400/40'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span>3D Ward Room</span>
        </button>

        <button
          onClick={() => onChangeViewMode('hybrid')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 transition-all ${
            viewMode === 'hybrid'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-md ring-1 ring-cyan-400/40'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <Columns3 className="w-3.5 h-3.5" />
          <span>Split Hybrid</span>
        </button>

        <button
          onClick={() => onChangeViewMode('grid')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 transition-all ${
            viewMode === 'grid'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-md ring-1 ring-cyan-400/40'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
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
          <div className="bg-red-950/70 border border-red-500/70 px-3.5 py-1.5 rounded-2xl flex items-center space-x-2 text-red-300 animate-pulse shadow-lg shadow-red-900/30">
            <AlertOctagon className="w-4 h-4 text-red-400 animate-bounce" />
            <div>
              <div className="text-[9px] font-mono uppercase tracking-wider text-red-400 font-bold">
                Critical Emergencies
              </div>
              <div className="text-xs font-mono font-extrabold text-white">
                {activeTier1Count} Bed{activeTier1Count > 1 ? 's' : ''} in Tier 1
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-2xl flex items-center space-x-2 text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono font-semibold">All Patient Vitals Stable</span>
          </div>
        )}

        {/* Noise Suppression Ring */}
        <div className="bg-slate-900/80 px-3.5 py-1.5 rounded-2xl border border-slate-800 flex items-center space-x-2.5 shadow">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <div>
            <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
              Noise Suppression
            </div>
            <div className="text-xs font-mono font-black text-cyan-300">
              {suppressionRate}% <span className="text-[9px] text-slate-500 font-normal">(Target &gt;75%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Right Controls: Sound, Cloud Outage Toggle */}
      <div className="flex items-center space-x-2.5">
        {/* Audio Toggle */}
        <button
          onClick={onToggleSound}
          className={`p-2.5 rounded-2xl border transition-all flex items-center space-x-1.5 shadow ${
            soundEnabled
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-cyan-500/10'
              : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
          title={soundEnabled ? 'Medical Audio Siren Enabled' : 'Enable Medical Audio Sirens'}
        >
          {soundEnabled ? (
            <>
              <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="text-xs font-mono font-bold hidden sm:inline">Audio On</span>
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-mono font-semibold text-slate-400 hidden sm:inline">Muted</span>
            </>
          )}
        </button>

        {/* Cloud Link Badge */}
        <div
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl border text-xs font-mono font-bold ${
            cloudOnline
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
              : 'bg-red-950/40 border-red-500/50 text-red-400 animate-pulse'
          }`}
        >
          {cloudOnline ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">Cloud Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Cloud Offline (Queueing)</span>
            </>
          )}
        </div>

        {/* Simulate Cloud Outage Toggle Button */}
        <button
          onClick={onToggleCloudOutage}
          className={`px-3 py-2 rounded-2xl text-xs font-semibold font-mono transition-all flex items-center space-x-1.5 border shadow ${
            cloudOnline
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/40 hover:bg-amber-500/20'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span className="hidden md:inline">
            {cloudOnline ? 'Simulate Outage' : 'Restore Link'}
          </span>
        </button>
      </div>
    </header>
  );
};
