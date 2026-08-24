import React, { useState } from 'react';
import { BedState } from '../types';
import { VitalsChart } from './VitalsChart';
import { AlertTriangle, CheckCircle, VolumeX, ShieldAlert, SlidersHorizontal } from 'lucide-react';

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

  const handleOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!justification.trim()) return;
    onOverride(alertId, overrideTier, justification);
    setOverrideModal(false);
    setJustification('');
  };

  return (
    <div className="bg-[#121824] p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-bold text-white font-mono">{bed_id.toUpperCase()} Inspector</h3>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                tier === 1
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                  : tier === 2
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              }`}
            >
              TIER {tier} {tier === 1 ? 'CATASTROPHIC' : tier === 2 ? 'MULTI-VITAL ANOMALY' : 'SUPPRESSED'}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Model: isoforest_v1.pkl | Seq: #{tick.seq} | Status: {signal_status.toUpperCase()}
          </p>
        </div>

        {/* Confidence & Drift Badges */}
        <div className="flex items-center space-x-2">
          {alert && (
            <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-right">
              <span className="text-[9px] font-mono text-slate-400 block uppercase">ML Confidence</span>
              <span className="text-xs font-mono font-bold text-cyan-400">
                {(alert.confidence * 100).toFixed(0)}%
              </span>
            </div>
          )}

          {alert && alert.drift_flag !== 'none' && (
            <div className="bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-500/40 text-right">
              <span className="text-[9px] font-mono text-amber-400 block uppercase">Signal Check</span>
              <span className="text-xs font-mono font-bold text-amber-300 uppercase">
                {alert.drift_flag}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Plain Language Reason (NEVER raw model score) */}
      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center space-x-3">
        <AlertTriangle className={`w-5 h-5 shrink-0 ${tier === 1 ? 'text-red-400' : tier === 2 ? 'text-amber-400' : 'text-emerald-400'}`} />
        <div>
          <span className="text-[10px] font-mono text-slate-400 uppercase">Plain-Language Triage Reason</span>
          <p className="text-xs font-semibold text-white">
            {alert?.reason || 'Multi-vital parameters within normal baseline range.'}
          </p>
        </div>
      </div>

      {/* Rolling 30s Live Vitals Chart */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-bold text-slate-300">Live Telemetry Tele-Trace (Rolling 30s)</span>
          <div className="flex items-center space-x-3 text-[10px] font-mono">
            <span className="text-red-400">● HR ({tick.hr})</span>
            <span className="text-cyan-400">● SpO2 ({tick.spo2}%)</span>
            <span className="text-amber-400">● BP ({tick.bp_sys}/{tick.bp_dia})</span>
          </div>
        </div>
        <VitalsChart history={history} bedId={bed_id} />
      </div>

      {/* Clinician Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          onClick={() => onAcknowledge(alertId)}
          className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-md"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Acknowledge Alert</span>
        </button>

        <button
          onClick={() => setOverrideModal(true)}
          className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-md"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Override / Escalate Tier</span>
        </button>

        <button
          onClick={() => onMute(alertId, 300)}
          className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-md"
        >
          <VolumeX className="w-4 h-4" />
          <span>Mute 5 Min (Server Clamped)</span>
        </button>
      </div>

      {/* Override Modal */}
      {overrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <form onSubmit={handleOverrideSubmit} className="bg-[#121824] p-6 rounded-2xl border border-slate-700 max-w-md w-full space-y-4 shadow-2xl">
            <h4 className="text-base font-bold text-white flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <span>Clinician Manual Tier Override</span>
            </h4>
            <p className="text-xs text-slate-400">
              Logged to immutable audit trail. Requires rationale for medico-legal compliance.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-300">Select New Override Tier:</label>
              <select
                value={overrideTier}
                onChange={(e) => setOverrideTier(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
              >
                <option value={1}>Tier 1 — Catastrophic Priority</option>
                <option value={2}>Tier 2 — Multi-Vital Anomaly</option>
                <option value={3}>Tier 3 — Suppress to Audit Feed</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-300">Justification Rationale:</label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Clinical assessment indicates patient distress..."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder:text-slate-600"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setOverrideModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-600 text-xs font-semibold text-white shadow-lg"
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
