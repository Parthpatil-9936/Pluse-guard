import React from 'react';
import { Activity, Wifi, WifiOff, ShieldCheck, Zap } from 'lucide-react';

interface HeaderProps {
  cloudOnline: boolean;
  onToggleCloudOutage: () => void;
  suppressionRate: number;
  totalEvents: number;
}

export const Header: React.FC<HeaderProps> = ({
  cloudOnline,
  onToggleCloudOutage,
  suppressionRate,
}) => {
  return (
    <header className="bg-[#121824] border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
      {/* Brand & Ward Title */}
      <div className="flex items-center space-x-3.5">
        <div className="p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20">
          <Activity className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-white tracking-tight">PulseGuard-AI</h1>
            <span className="text-[10px] font-mono font-semibold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-800/50">
              OFFLINE TRIAGE EDGE v1.0
            </span>
          </div>
          <p className="text-xs text-slate-400">ICU Ward Alpha — 10 Simulated Bed Telemetry Grid</p>
        </div>
      </div>

      {/* Center Metric: Suppression Counter (Headline Metric) */}
      <div className="flex items-center space-x-6">
        <div className="bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800 flex items-center space-x-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              Noise Suppression Rate
            </div>
            <div className="text-lg font-mono font-extrabold text-emerald-400">
              {suppressionRate}% <span className="text-xs font-normal text-slate-500">(Target &gt;75%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Controls: Cloud State & Simulate Cloud Outage Toggle */}
      <div className="flex items-center space-x-3">
        {/* Cloud Badge */}
        <div
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${
            cloudOnline
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
              : 'bg-red-950/40 border-red-500/40 text-red-400'
          }`}
        >
          {cloudOnline ? (
            <>
              <Wifi className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Cloud: ● Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-400" />
              <span>Cloud: ● Offline (Local Queueing)</span>
            </>
          )}
        </div>

        {/* Simulate Cloud Outage Button */}
        <button
          onClick={onToggleCloudOutage}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 shadow-md flex items-center space-x-1.5 border ${
            cloudOnline
              ? 'bg-amber-600/20 text-amber-300 border-amber-500/40 hover:bg-amber-600/30'
              : 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/30'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{cloudOnline ? 'Simulate Cloud Outage' : 'Restore Cloud Link'}</span>
        </button>
      </div>
    </header>
  );
};
