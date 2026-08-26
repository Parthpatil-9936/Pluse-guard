import React from 'react';
import {
  Syringe,
  AlertOctagon,
  Zap,
  Activity,
  CheckCircle2,
  Sliders,
  Shield,
} from 'lucide-react';

interface DemoInjectorProps {
  selectedBedId: string;
  onInject: (bedId: string, eventType: string) => void;
}

export const DemoInjector: React.FC<DemoInjectorProps> = ({ selectedBedId, onInject }) => {
  return (
    <div className="bg-[#0B101A]/95 p-4 sm:p-5 rounded-3xl border border-slate-800 space-y-3.5 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Syringe className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-black text-white uppercase tracking-wider">
              Synthetic Anomaly Injector
            </h3>
            <span className="text-[10px] font-mono text-cyan-400">
              Targeting: <strong className="text-white">{selectedBedId.toUpperCase()}</strong>
            </span>
          </div>
        </div>

        {/* Clear/Reset button for selected bed */}
        <button
          onClick={() => onInject(selectedBedId, 'normal')}
          className="px-2.5 py-1 rounded-xl bg-emerald-950/60 border border-emerald-500/40 hover:bg-emerald-900/60 text-emerald-300 text-[11px] font-mono font-bold flex items-center space-x-1 transition-all shadow"
        >
          <CheckCircle2 className="w-3 h-3" />
          <span>Reset Normal</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Tier-1 SpO2 */}
        <button
          onClick={() => onInject(selectedBedId, 'tier1_spo2')}
          className="p-2.5 rounded-2xl bg-red-950/60 border border-red-500/50 hover:bg-red-900/60 text-red-300 text-xs font-mono font-bold flex items-center space-x-2 transition-all shadow-md active:scale-95 text-left"
        >
          <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
          <div>
            <span className="block text-[11px]">Tier-1 Hypoxia</span>
            <span className="text-[9px] text-red-400/80 font-normal">SpO2 &lt; 85%</span>
          </div>
        </button>

        {/* Tier-1 Asystole */}
        <button
          onClick={() => onInject(selectedBedId, 'tier1_asystole')}
          className="p-2.5 rounded-2xl bg-red-950/60 border border-red-500/50 hover:bg-red-900/60 text-red-300 text-xs font-mono font-bold flex items-center space-x-2 transition-all shadow-md active:scale-95 text-left"
        >
          <Activity className="w-4 h-4 text-red-400 shrink-0" />
          <div>
            <span className="block text-[11px]">Tier-1 Asystole</span>
            <span className="text-[9px] text-red-400/80 font-normal">HR &lt; 20 BPM</span>
          </div>
        </button>

        {/* Tier-3 Transient Spike */}
        <button
          onClick={() => onInject(selectedBedId, 'tier3_spike')}
          className="p-2.5 rounded-2xl bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-300 text-xs font-mono font-bold flex items-center space-x-2 transition-all shadow-md active:scale-95 text-left"
        >
          <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
          <div>
            <span className="block text-[11px]">Tier-3 Spike</span>
            <span className="text-[9px] text-slate-400 font-normal">Transient Filter</span>
          </div>
        </button>

        {/* Multi-Vital Drift */}
        <button
          onClick={() => onInject(selectedBedId, 'drift')}
          className="p-2.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 hover:bg-amber-900/40 text-amber-300 text-xs font-mono font-bold flex items-center space-x-2 transition-all shadow-md active:scale-95 text-left"
        >
          <Sliders className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <span className="block text-[11px]">Multi-Vital Drift</span>
            <span className="text-[9px] text-amber-400/80 font-normal">ML Isolation</span>
          </div>
        </button>

        {/* Electrode Tamper */}
        <button
          onClick={() => onInject(selectedBedId, 'tamper')}
          className="col-span-2 p-2.5 rounded-2xl bg-purple-950/40 border border-purple-500/40 hover:bg-purple-900/40 text-purple-300 text-xs font-mono font-bold flex items-center space-x-2 transition-all shadow-md active:scale-95 text-left"
        >
          <Shield className="w-4 h-4 text-purple-400 shrink-0" />
          <div>
            <span className="block text-[11px]">Electrode Disconnect / Contact Tamper</span>
            <span className="text-[9px] text-purple-400/80 font-normal">ECG lead artifact signal breach</span>
          </div>
        </button>
      </div>
    </div>
  );
};
