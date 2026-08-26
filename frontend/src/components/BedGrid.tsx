import React, { useState } from 'react';
import { BedState } from '../types';
import { BedCard3D } from './BedCard3D';
import { THEME } from '../theme';
import { Filter, AlertOctagon, Activity, CheckCircle } from 'lucide-react';

interface BedGridProps {
  beds: Record<string, BedState>;
  selectedBedId: string;
  onSelectBed: (bedId: string) => void;
}

export const BedGrid: React.FC<BedGridProps> = ({ beds, selectedBedId, onSelectBed }) => {
  const [filter, setFilter] = useState<'all' | 'critical' | 'anomaly' | 'normal'>('all');

  const bedKeys = Array.from({ length: 10 }, (_, i) => `bed-${String(i + 1).padStart(2, '0')}`);

  const filteredBedKeys = bedKeys.filter((bedId) => {
    const bed = beds[bedId];
    if (filter === 'critical') return bed?.tier === 1;
    if (filter === 'anomaly') return bed?.tier === 2;
    if (filter === 'normal') return bed?.tier === 3 || !bed?.tier;
    return true;
  });

  const critCount = bedKeys.filter((b) => beds[b]?.tier === 1).length;
  const anomCount = bedKeys.filter((b) => beds[b]?.tier === 2).length;

  return (
    <div className="space-y-3.5">
      {/* Grid Top Bar with Filters & Ward Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/90 p-3 rounded-2xl border border-slate-300 backdrop-blur-md shadow-sm">
        <div className="flex items-center space-x-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-ping" />
          <h2 className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider">
            10-Bed Clinical Telemetry Matrix (2x5 Grid)
          </h2>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-mono">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              filter === 'all'
                ? 'bg-teal-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All (10)
          </button>

          <button
            onClick={() => setFilter('critical')}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center space-x-1 ${
              filter === 'critical'
                ? 'bg-red-600 text-white font-bold shadow-xs'
                : 'text-red-700 hover:bg-red-50'
            }`}
          >
            <AlertOctagon className="w-3 h-3" />
            <span>Tier-1 ({critCount})</span>
          </button>

          <button
            onClick={() => setFilter('anomaly')}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center space-x-1 ${
              filter === 'anomaly'
                ? 'bg-amber-600 text-white font-bold shadow-xs'
                : 'text-amber-800 hover:bg-amber-50'
            }`}
          >
            <Activity className="w-3 h-3" />
            <span>Tier-2 ({anomCount})</span>
          </button>

          <button
            onClick={() => setFilter('normal')}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center space-x-1 ${
              filter === 'normal'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            <CheckCircle className="w-3 h-3" />
            <span>Normal</span>
          </button>
        </div>
      </div>

      {/* 2x5 Bed Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {filteredBedKeys.map((bedId) => {
          const bedState = beds[bedId] || {
            bed_id: bedId,
            signal_status: 'no_signal',
            tick: { bed_id: bedId, ts: '', hr: 0, spo2: 0, bp_sys: 0, bp_dia: 0, ecg_lead_ok: true, seq: 0 },
            alert: null,
            tier: 3,
            suppressed: true,
            history: [],
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

