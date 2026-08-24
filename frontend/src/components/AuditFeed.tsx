import React from 'react';
import { AuditLogItem } from '../types';
import { FileText, ShieldAlert, CheckCircle, VolumeX, AlertCircle } from 'lucide-react';

interface AuditFeedProps {
  logs: AuditLogItem[];
}

export const AuditFeed: React.FC<AuditFeedProps> = ({ logs }) => {
  return (
    <div className="bg-[#121824] p-5 rounded-2xl border border-slate-800 space-y-3 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-mono font-bold text-slate-200 uppercase">
            Immutable Audit Feed (Newest First)
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-500">{logs.length} Logged Events</span>
      </div>

      <div className="h-64 overflow-y-auto space-y-2 pr-1">
        {logs.length === 0 ? (
          <div className="text-center text-xs text-slate-500 py-12">Listening for audit logs...</div>
        ) : (
          logs.map((log) => {
            const isGap = log.event_type === 'GAP_MARKER';
            const isAck = log.event_type === 'ACKNOWLEDGE';
            const isOverride = log.event_type === 'OVERRIDE';
            const isMute = log.event_type === 'MUTE';

            return (
              <div
                key={log.id}
                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                  isGap
                    ? 'bg-purple-950/40 border-purple-500/50 text-purple-200'
                    : isAck
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                    : isOverride
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                    : isMute
                    ? 'bg-slate-900 border-slate-700 text-slate-300'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2.5 overflow-hidden">
                  {isGap && <AlertCircle className="w-4 h-4 text-purple-400 shrink-0" />}
                  {isAck && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
                  {isOverride && <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />}
                  {isMute && <VolumeX className="w-4 h-4 text-slate-400 shrink-0" />}
                  {!isGap && !isAck && !isOverride && !isMute && (
                    <div className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                  )}

                  <div className="truncate">
                    <div className="flex items-center space-x-2 font-mono text-[11px]">
                      <span className="font-bold text-white">{log.bed_id}</span>
                      <span className="text-slate-400">[{log.event_type}]</span>
                      {log.clinician_id && (
                        <span className="text-cyan-400">by {log.clinician_id}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 truncate">{log.reason || log.justification}</p>
                  </div>
                </div>

                <div className="text-right font-mono text-[10px] text-slate-500 shrink-0">
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
