import React from 'react';
import { Syringe, AlertOctagon, Zap, Activity } from 'lucide-react';

interface DemoInjectorProps {
  selectedBedId: string;
  onInject: (bedId: string, eventType: string) => void;
}

export const DemoInjector: React.FC<DemoInjectorProps> = ({ selectedBedId, onInject }) => {
  return (
    <div className="bg-[#121824] p-4 rounded-2xl border border-slate-800 space-y-3 shadow-xl">
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <Syringe className="w-4 h-4 text-cyan-400" />
        <h3 className="text-xs font-mono font-bold text-slate-200 uppercase">
          Judge Demo Injection Panel (Targeting {selectedBedId.toUpperCase()})
        </h3>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onInject(selectedBedId, 'tier1_spo2')}
          className="px-3 py-2 rounded-xl bg-red-950/60 border border-red-500/50 hover:bg-red-900/60 text-red-300 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow"
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>Inject Tier-1 (SpO2 &lt;85%)</span>
        </button>

        <button
          onClick={() => onInject(selectedBedId, 'tier1_asystole')}
          className="px-3 py-2 rounded-xl bg-red-950/60 border border-red-500/50 hover:bg-red-900/60 text-red-300 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Inject Tier-1 (Asystole HR &lt;20)</span>
        </button>

        <button
          onClick={() => onInject(selectedBedId, 'tier3_spike')}
          className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow"
        >
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span>Inject Tier-3 Transient Spike</span>
        </button>

        <button
          onClick={() => onInject(selectedBedId, 'drift')}
          className="px-3 py-2 rounded-xl bg-amber-950/40 border border-amber-500/40 hover:bg-amber-900/40 text-amber-300 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow"
        >
          <span>Inject Multi-Vital Drift</span>
        </button>

        <button
          onClick={() => onInject(selectedBedId, 'tamper')}
          className="px-3 py-2 rounded-xl bg-purple-950/40 border border-purple-500/40 hover:bg-purple-900/40 text-purple-300 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow"
        >
          <span>Inject Contact Tamper</span>
        </button>
      </div>
    </div>
  );
};
