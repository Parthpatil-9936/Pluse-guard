import React, { useState } from 'react';
import { BedState } from '../types';
import { VitalsChart } from './VitalsChart';
import { BiometricHeart3D } from './3d/BiometricHeart3D';
import {
  AlertTriangle,
  CheckCircle,
  VolumeX,
  ShieldAlert,
  SlidersHorizontal,
  Activity,
  Heart,
  Gauge,
  Info,
} from 'lucide-react';

interface BedDetailPanelProps {
  bedState: BedState;
  onAcknowledge: (alertId: string) => void;
  onOverride: (alertId: string, newTier: number, justification: string) => void;
  onMute: (alertId: string, durationS: number) => void;
}

export const BedDetailPanel: React.FC<BedDetailPanelProps> = ({
  bedState,
  onAcknowledge,
  onOverride,
  onMute,
}) => {
  const { bed_id, signal_status, tick, alert, tier, history } = bedState;
  const [overrideModal, setOverrideModal] = useState(false);
  const [overrideTier, setOverrideTier] = useState<number>(1);
  const [justification, setJustification] = useState('');

  const alertId = alert?.alert_id || `alert_${bed_id}`;

  // Calculate derived hemodynamic parameters
  const mapValue = tick.bp_sys > 0 && tick.bp_dia > 0
    ? Math.round((2 * tick.bp_dia + tick.bp_sys) / 3)
    : 0;
  const pulsePressure = tick.bp_sys > 0 && tick.bp_dia > 0
    ? tick.bp_sys - tick.bp_dia
    : 0;

  const handleOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!justification.trim()) return;
    onOverride(alertId, overrideTier, justification);
    setOverrideModal(false);
    setJustification('');
  };

  return (
    <div className="bg-[#0B101A]/95 p-5 rounded-3xl border border-slate-800 space-y-4 shadow-2xl backdrop-blur-xl">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
        <div>
          <div className="flex items-center space-x-2.5">
            <h3 className="text-xl font-black text-white font-mono tracking-tight">
              {bed_id.toUpperCase()} Inspector
            </h3>
            <span
              className={`text-xs font-mono font-extrabold px-3 py-1 rounded-full border shadow-sm ${
                tier === 1
                  ? 'bg-red-500/20 text-red-400 border-red-500/60 animate-pulse'
                  : tier === 2
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/60'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              }`}
            >
              TIER {tier} • {tier === 1 ? 'CATASTROPHIC EMERGENCY' : tier === 2 ? 'MULTI-VITAL ANOMALY' : 'SUPPRESSED NOISE'}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Isolation Forest Edge Model: <span className="text-slate-300">isoforest_v1.pkl</span> | Seq: #{tick.seq} | Status:{' '}
            <span className={signal_status === 'online' ? 'text-emerald-400' : 'text-slate-500'}>
              {signal_status.toUpperCase()}
            </span>
          </p>
        </div>

        {/* Confidence & Drift Badges */}
        <div className="flex items-center space-x-2">
          {alert && (
            <div className="bg-slate-900/90 px-3.5 py-1.5 rounded-2xl border border-slate-800 text-right shadow">
              <span className="text-[9px] font-mono text-slate-400 block uppercase">
                ML Anomaly Confidence
              </span>
              <span className="text-sm font-mono font-black text-cyan-300">
                {(alert.confidence * 100).toFixed(0)}%
              </span>
            </div>
          )}

          {alert && alert.drift_flag !== 'none' && (
            <div className="bg-amber-950/50 px-3.5 py-1.5 rounded-2xl border border-amber-500/50 text-right shadow">
              <span className="text-[9px] font-mono text-amber-400 block uppercase">
                Artifact Filter
              </span>
              <span className="text-xs font-mono font-bold text-amber-300 uppercase">
                {alert.drift_flag}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Plain Language Clinical Reason Bar */}
      <div
        className={`p-3.5 rounded-2xl border flex items-center space-x-3.5 shadow-md ${
          tier === 1
            ? 'bg-red-950/40 border-red-500/60 text-red-200'
            : tier === 2
            ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
            : 'bg-slate-900/80 border-slate-800 text-slate-200'
        }`}
      >
        <AlertTriangle
          className={`w-5 h-5 shrink-0 ${
            tier === 1 ? 'text-red-400 animate-bounce' : tier === 2 ? 'text-amber-400' : 'text-emerald-400'
          }`}
        />
        <div className="flex-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
            Plain-Language Clinical Triage Rationale
          </span>
          <p className="text-xs font-bold font-mono">
            {alert?.reason || 'All continuous vital signs are within standard ICU homeostatic baseline.'}
          </p>
        </div>
      </div>

      {/* Middle Row: 3D Biometric Hologram + Hemodynamic Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left: 3D Biometric Heart Visualizer (5 Cols) */}
        <div className="md:col-span-5">
          <BiometricHeart3D
            hr={tick.hr}
            spo2={tick.spo2}
            tier={tier}
            isSignalLost={signal_status === 'no_signal'}
          />
        </div>

        {/* Right: Derived Hemodynamic Gauges (7 Cols) */}
        <div className="md:col-span-7 grid grid-cols-2 gap-2.5">
          <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span className="flex items-center space-x-1">
                <Heart className="w-3.5 h-3.5 text-red-400" />
                <span>Heart Rate</span>
              </span>
              <span className="text-[10px] text-slate-500">Normal: 60-100</span>
            </div>
            <div className="mt-1">
              <span className={`text-2xl font-mono font-black ${tick.hr < 30 || tick.hr > 180 ? 'text-red-400' : 'text-white'}`}>
                {signal_status === 'online' ? `${tick.hr}` : '--'}
              </span>
              <span className="text-xs text-slate-400 ml-1 font-mono">BPM</span>
            </div>
          </div>

          <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span className="flex items-center space-x-1">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Oxygen Saturation</span>
              </span>
              <span className="text-[10px] text-slate-500">Normal: &gt;95%</span>
            </div>
            <div className="mt-1">
              <span className={`text-2xl font-mono font-black ${tick.spo2 < 85 ? 'text-red-400' : 'text-cyan-300'}`}>
                {signal_status === 'online' ? `${tick.spo2}%` : '--'}
              </span>
              <span className="text-xs text-slate-400 ml-1 font-mono">SpO2</span>
            </div>
          </div>

          <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span className="flex items-center space-x-1">
                <Gauge className="w-3.5 h-3.5 text-amber-400" />
                <span>Mean Arterial (MAP)</span>
              </span>
              <span className="text-[10px] text-slate-500">Target: &gt;65</span>
            </div>
            <div className="mt-1">
              <span className="text-xl font-mono font-black text-amber-300">
                {signal_status === 'online' ? `${mapValue}` : '--'}
              </span>
              <span className="text-xs text-slate-400 ml-1 font-mono">mmHg</span>
            </div>
          </div>

          <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span className="flex items-center space-x-1">
                <Info className="w-3.5 h-3.5 text-purple-400" />
                <span>Pulse Pressure (PP)</span>
              </span>
              <span className="text-[10px] text-slate-500">Sys - Dia</span>
            </div>
            <div className="mt-1">
              <span className="text-xl font-mono font-black text-purple-300">
                {signal_status === 'online' ? `${pulsePressure}` : '--'}
              </span>
              <span className="text-xs text-slate-400 ml-1 font-mono">mmHg</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rolling 30s Live Waveform Telemetry Chart */}
      <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 shadow-inner">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-bold text-slate-300">
            Real-Time Multi-Vital Waveform Trace (Rolling 30s Buffer)
          </span>
          <div className="flex items-center space-x-3 text-[10px] font-mono">
            <span className="text-red-400 font-bold">● HR ({tick.hr} bpm)</span>
            <span className="text-cyan-400 font-bold">● SpO2 ({tick.spo2}%)</span>
            <span className="text-amber-400 font-bold">● BP ({tick.bp_sys}/{tick.bp_dia})</span>
          </div>
        </div>
        <VitalsChart history={history} bedId={bed_id} />
      </div>

      {/* Clinician Fast Action Triage Controls */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          onClick={() => onAcknowledge(alertId)}
          className="flex-1 py-2.5 px-4 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold flex items-center justify-center space-x-2 transition-all shadow-md active:scale-95"
        >
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>Acknowledge Alert</span>
        </button>

        <button
          onClick={() => setOverrideModal(true)}
          className="flex-1 py-2.5 px-4 rounded-2xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold flex items-center justify-center space-x-2 transition-all shadow-md active:scale-95"
        >
          <SlidersHorizontal className="w-4 h-4 text-amber-400" />
          <span>Override / Escalate Tier</span>
        </button>

        <button
          onClick={() => onMute(alertId, 300)}
          className="flex-1 py-2.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-bold flex items-center justify-center space-x-2 transition-all shadow-md active:scale-95"
        >
          <VolumeX className="w-4 h-4 text-slate-400" />
          <span>Mute 5m (Server Clamped)</span>
        </button>
      </div>

      {/* Override Modal */}
      {overrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <form
            onSubmit={handleOverrideSubmit}
            className="bg-[#0D131F] p-6 rounded-3xl border border-slate-700 max-w-md w-full space-y-4 shadow-2xl"
          >
            <h4 className="text-base font-bold text-white flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <span>Clinician Manual Tier Override</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Logged to immutable audit trail. Requires clinical justification rationale for medico-legal compliance.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-300">Select New Override Tier:</label>
              <select
                value={overrideTier}
                onChange={(e) => setOverrideTier(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:ring-2 focus:ring-amber-500 font-mono"
              >
                <option value={1}>Tier 1 — Catastrophic Priority Alert</option>
                <option value={2}>Tier 2 — Multi-Vital Anomaly Warning</option>
                <option value={3}>Tier 3 — Suppress Noise to Audit Log</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-300">Justification Rationale:</label>
              <textarea
                required
                rows={3}
                placeholder="e.g., Bedside assessment confirms patient in severe respiratory distress..."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder:text-slate-600 focus:ring-2 focus:ring-amber-500 font-mono"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setOverrideModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-mono text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-mono font-bold text-white shadow-lg shadow-amber-600/30"
              >
                Submit Audit Override
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
