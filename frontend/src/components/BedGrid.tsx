import React from 'react';
import { BedState } from '../types';
import { BedCard3D } from './BedCard3D';

interface BedGridProps {
  beds: Record<string, BedState>;
  selectedBedId: string;
  onSelectBed: (bedId: string) => void;
}

export const BedGrid: React.FC<BedGridProps> = ({ beds, selectedBedId, onSelectBed }) => {
  const bedKeys = Array.from({ length: 10 }, (_, i) => `bed-${String(i + 1).padStart(2, '0')}`);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>10-Bed Triage Monitor Matrix (2x5 Grid)</span>
        </h2>
        <span className="text-xs text-slate-500 font-mono">Select bed to inspect live vitals</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
        {bedKeys.map((bedId) => {
          const bedState = beds[bedId] || {
            bed_id: bedId,
            signal_status: 'no_signal',
            tick: { bed_id: bedId, ts: '', hr: 0, spo2: 0, bp_sys: 0, bp_dia: 0, ecg_lead_ok: true, seq: 0 },
            alert: null,
            tier: 3,
            suppressed: true,
            history: []
          };

          return (
            <BedCard3D
              key={bedId}
              bedState={bedState}
              isSelected={selectedBedId === bedId}
              onSelect={() => onSelectBed(bedId)}
            />
          );
        })}
      </div>
    </div>
  );
};
