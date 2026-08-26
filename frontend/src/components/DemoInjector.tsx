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
import { THEME } from '../theme';

interface DemoInjectorProps {
  selectedBedId: string;
  onInject: (bedId: string, eventType: string) => void;
}

export const DemoInjector: React.FC<DemoInjectorProps> = ({ selectedBedId, onInject }) => {
  return (
    <div className="bg-white/95 p-4 sm:p-5 rounded-3xl border border-slate-300 space-y-3.5 shadow-md backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-700">
            <Syringe className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-black text-slate-900 uppercase tracking-wider">
              Synthetic Anomaly Injector
            </h3>
            <span className="text-[10px] font-mono text-teal-800">
              Targeting: <strong className="text-slate-900 font-bold">{selectedBedId.toUpperCase()}</strong>
            </span>
          </div>
        </div>

        {/* Clear/Reset button for selected bed */}
        <button
          onClick={() => onInject(selectedBedId, 'normal')}
          className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-800 text-[11px] font-mono font-bold flex items-center space-x-1 transition-all shadow-xs"
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Reset Normal</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Tier-1 SpO2 */}
        <button
          onClick={() => onInject(selectedBedId, 'tier1_spo2')}
          className="p-2.5 rounded-2xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-900 text-xs font-mono font-bold flex items-center space-x-2 transition-all shadow-xs active:scale-95 text-left"
        >
          <AlertOctagon className="w-4 h-4 text-red-600 shrink-0" />
          <div>
            <span className="block text-[11px] text-red-900">Tier-1 Hypoxia</span>
            <span className="text-[9px] text-red-700 font-normal">SpO2 &lt; 85%</span>
          </div>
        </button>

        {/* Tier-1 Asystole */}
        <button
          onClick={() => onInject(selectedBedId, 'tier1_asystole')}
          className="p-2.5 rounded-2xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-900 text-xs font-mono font-bold flex items-center space-x-2 transition-all shadow-xs active:scale-95 text-left"
        >
          <Activity className="w-4 h-4 text-red-600 shrink-0" />
          <div>
            <span className="block text-[11px] text-red-900">Tier-1 Asystole</span>
            <span className="text-[9px] text-red-700 font-normal">HR &lt; 20 BPM</span>
          </div>
        </button>

        {/* Tier-3 Transient Spike */}
        <button
          onClick={() => onInject(selectedBedId, 'tier3_spike')}
          className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-mono font-bold flex items-center space-x-2 transition-all shadow-xs active:scale-95 text-left"
        >
          <Zap className="w-4 h-4 text-teal-600 shrink-0" />
          <div>
            <span className="block text-[11px] text-slate-900">Tier-3 Spike</span>
            <span className="text-[9px] text-slate-500 font-normal">Transient Filter</span>
          </div>
        </button>

        {/* Multi-Vital Drift */}
        <button
          onClick={() => onInject(selectedBedId, 'drift')}
          className="p-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-mono font-bold flex items-center space-x-2 transition-all shadow-xs active:scale-95 text-left"
        >
          <Sliders className="w-4 h-4 text-amber-600 shrink-0" />
          <div>
            <span className="block text-[11px] text-amber-900">Multi-Vital Drift</span>
            <span className="text-[9px] text-amber-700 font-normal">ML Isolation</span>
          </div>
        </button>

        {/* Electrode Tamper */}
        <button
          onClick={() => onInject(selectedBedId, 'tamper')}
          className="col-span-2 p-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 text-xs font-mono font-bold flex items-center space-x-2 transition-all shadow-xs active:scale-95 text-left"
        >
          <Shield className="w-4 h-4 text-purple-600 shrink-0" />
          <div>
            <span className="block text-[11px] text-purple-900">Electrode Disconnect / Contact Tamper</span>
            <span className="text-[9px] text-purple-700 font-normal">ECG lead artifact signal breach</span>
          </div>
        </button>
      </div>
    </div>
  );
};

