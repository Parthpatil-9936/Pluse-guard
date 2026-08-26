import React from 'react';
import { AuditLogItem } from '../types';
import { THEME } from '../theme';
import {
  FileText,
  ShieldAlert,
  CheckCircle,
  VolumeX,
  AlertCircle,
  Activity,
  History,
} from 'lucide-react';

interface AuditFeedProps {
  logs: AuditLogItem[];
}

export const AuditFeed: React.FC<AuditFeedProps> = ({ logs }) => {
  return (
    <div className="bg-white/95 p-4 sm:p-5 rounded-3xl border border-slate-300 space-y-3 shadow-md backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-700">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-black text-slate-900 uppercase tracking-wider">
              Immutable Audit Trail
            </h3>
            <span className="text-[10px] font-mono text-slate-500">
              Live SQLite Event Ledger (Newest First)
            </span>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
          {logs.length} Events
        </span>
      </div>

      <div className="h-64 sm:h-72 overflow-y-auto space-y-2 pr-1">
        {logs.length === 0 ? (
          <div className="text-center text-xs font-mono text-slate-400 py-12">
            Listening for telemetry events...
          </div>
        ) : (
          logs.map((log) => {
            const isGap = log.event_type === 'GAP_MARKER';
            const isAck = log.event_type === 'ACKNOWLEDGE';
            const isOverride = log.event_type === 'OVERRIDE';
            const isMute = log.event_type === 'MUTE';
            const isTier1 = log.event_type === 'TIER_1_ALERT';
            const isTier2 = log.event_type === 'TIER_2_ALERT';
            const isSuppressed = log.event_type === 'TIER_3_SUPPRESSED';

            return (
              <div
                key={log.id}
                className={`p-2.5 rounded-2xl border text-xs flex items-center justify-between gap-3 transition-all ${
                  isTier1
                    ? 'bg-red-50/90 border-red-200 text-red-900'
                    : isTier2
                    ? 'bg-amber-50/90 border-amber-200 text-amber-900'
                    : isAck
                    ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
                    : isOverride
                    ? 'bg-amber-50/90 border-amber-300 text-amber-900'
                    : isMute
                    ? 'bg-slate-100 border-slate-200 text-slate-700'
                    : isGap
                    ? 'bg-purple-50/90 border-purple-200 text-purple-900'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center space-x-2.5 overflow-hidden">
                  {isTier1 && <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 animate-pulse" />}
                  {isTier2 && <Activity className="w-4 h-4 text-amber-600 shrink-0" />}
                  {isAck && <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />}
                  {isOverride && <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />}
                  {isMute && <VolumeX className="w-4 h-4 text-slate-500 shrink-0" />}
                  {isGap && <AlertCircle className="w-4 h-4 text-purple-600 shrink-0" />}
                  {isSuppressed && <div className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />}

                  <div className="truncate">
                    <div className="flex items-center space-x-2 font-mono text-[11px]">
                      <span className="font-bold text-slate-900">{log.bed_id}</span>
                      <span className="text-slate-500 font-semibold">[{log.event_type}]</span>
                      {log.clinician_id && (
                        <span className="text-teal-700 font-medium">by {log.clinician_id}</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-600 truncate mt-0.5">
                      {log.reason || log.justification || 'Telemetry event processed'}
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono text-[9px] text-slate-400 shrink-0">
                  {new Date(log.ts).toLocaleTimeString()}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

