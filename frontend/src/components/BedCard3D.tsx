import React, { useRef, useEffect } from 'react';
import { BedState } from '../types';
import { Heart, Activity, AlertOctagon, Zap } from 'lucide-react';

interface BedCard3DProps {
  bedState: BedState;
  isSelected: boolean;
  onSelect: () => void;
}

export const BedCard3D: React.FC<BedCard3DProps> = ({ bedState, isSelected, onSelect }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { bed_id, signal_status, tick, alert, tier } = bedState;

  // Determine visual theme based on tier & signal
  let statusColor = '#10B981'; // Emerald
  let statusBg = 'bg-emerald-950/15 border-emerald-500/30';
  let badgeText = 'TIER 3 • NORMAL';
  let cardGlow = 'hover:border-emerald-500/50 hover:shadow-emerald-950/40';

  if (signal_status === 'no_signal') {
    statusColor = '#64748B'; // Slate
    statusBg = 'bg-slate-900/60 border-slate-700/40 opacity-70';
    badgeText = 'NO SIGNAL';
    cardGlow = 'hover:border-slate-500';
  } else if (tier === 1) {
    statusColor = '#EF4444'; // Red
    statusBg = 'bg-red-950/40 border-red-500 pulse-red-glow';
    badgeText = 'TIER 1 • CATASTROPHIC';
    cardGlow = 'border-red-500 shadow-red-900/40';
  } else if (tier === 2) {
    statusColor = '#F59E0B'; // Amber
    statusBg = 'bg-amber-950/30 border-amber-500/80 pulse-yellow-glow';
    badgeText = 'TIER 2 • ANOMALY';
    cardGlow = 'border-amber-500 shadow-amber-900/40';
  }

  // 3D Canvas Isometric Bed Graphic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2, height / 2 + 10);

    // Bed Mattress 3D Top Polygon
    ctx.beginPath();
    ctx.moveTo(0, -25);
    ctx.lineTo(55, -5);
    ctx.lineTo(0, 15);
    ctx.lineTo(-55, -5);
    ctx.closePath();
    ctx.fillStyle = '#1E293B';
    ctx.fill();
    ctx.strokeStyle = statusColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Bed Side 3D Drop Left
    ctx.beginPath();
    ctx.moveTo(-55, -5);
    ctx.lineTo(0, 15);
    ctx.lineTo(0, 25);
    ctx.lineTo(-55, 5);
    ctx.closePath();
    ctx.fillStyle = '#0F172A';
    ctx.fill();
    ctx.stroke();

    // Bed Side 3D Drop Right
    ctx.beginPath();
    ctx.moveTo(0, 15);
    ctx.lineTo(55, -5);
    ctx.lineTo(55, 5);
    ctx.lineTo(0, 25);
    ctx.closePath();
    ctx.fillStyle = '#090D16';
    ctx.fill();
    ctx.stroke();

    // Pillow Headrest 3D box
    ctx.beginPath();
    ctx.moveTo(-35, -20);
    ctx.lineTo(-15, -26);
    ctx.lineTo(5, -18);
    ctx.lineTo(-15, -12);
    ctx.closePath();
    ctx.fillStyle = '#475569';
    ctx.fill();

    // Bedside 3D Medical Monitor Screen
    ctx.save();
    ctx.translate(-45, -35);

    // Stand pole
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 25);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Screen Monitor Case
    ctx.beginPath();
    ctx.rect(-18, -25, 36, 25);
    ctx.fillStyle = '#020617';
    ctx.fill();
    ctx.strokeStyle = statusColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Live ECG Wave line inside monitor screen
    if (signal_status === 'online') {
      ctx.beginPath();
      ctx.moveTo(-15, -12);
      ctx.lineTo(-8, -12);
      ctx.lineTo(-5, -22);
      ctx.lineTo(0, -2);
      ctx.lineTo(4, -16);
      ctx.lineTo(8, -12);
      ctx.lineTo(15, -12);
      ctx.strokeStyle = statusColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(-15, -12);
      ctx.lineTo(15, -12);
      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.restore();
    ctx.restore();
  }, [statusColor, signal_status]);

  return (
    <div
      onClick={onSelect}
      className={`p-3.5 rounded-2xl cursor-pointer transition-all duration-300 border ${statusBg} ${
        isSelected
          ? 'ring-2 ring-cyan-400 scale-[1.02] shadow-2xl bg-slate-900/90'
          : cardGlow
      } flex flex-col justify-between`}
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center space-x-2">
          <span className="font-mono font-black text-sm text-white">{bed_id.toUpperCase()}</span>
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor: statusColor,
              boxShadow: `0 0 8px ${statusColor}`,
            }}
          />
        </div>

        <span
          className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md uppercase"
          style={{ backgroundColor: `${statusColor}25`, color: statusColor }}
        >
          {badgeText}
        </span>
      </div>

      {/* 3D Canvas Bed Graphic */}
      <div className="h-24 flex items-center justify-center relative overflow-hidden my-1 bg-slate-950/60 rounded-xl border border-slate-800/80">
        <canvas ref={canvasRef} width={190} height={105} className="block" />

        {/* Emergency Pulsing Badge */}
        {tier === 1 && (
          <div className="absolute top-2 right-2 bg-red-600/90 text-white text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded flex items-center space-x-1 animate-pulse shadow-md">
            <AlertOctagon className="w-2.5 h-2.5" />
            <span>CRITICAL</span>
          </div>
        )}

        {/* Drift Flag Badge */}
        {alert && alert.drift_flag !== 'none' && (
          <div className="absolute bottom-2 left-2 text-[9px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded">
            {alert.drift_flag}
          </div>
        )}
      </div>

      {/* Live Vital Telemetry Readouts */}
      <div className="grid grid-cols-3 gap-1.5 pt-1.5 text-center text-xs font-mono">
        <div className="bg-slate-900/90 p-1.5 rounded-xl border border-slate-800/90">
          <div className="text-[9px] text-slate-400 flex items-center justify-center space-x-0.5">
            <Heart className="w-2.5 h-2.5 text-red-400" />
            <span>HR</span>
          </div>
          <span className={`font-black ${tier === 1 && tick.hr < 30 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
            {signal_status === 'online' ? `${tick.hr}` : '--'}
          </span>
          <span className="text-[8px] text-slate-500 block">bpm</span>
        </div>

        <div className="bg-slate-900/90 p-1.5 rounded-xl border border-slate-800/90">
          <div className="text-[9px] text-slate-400 flex items-center justify-center space-x-0.5">
            <Activity className="w-2.5 h-2.5 text-cyan-400" />
            <span>SpO2</span>
          </div>
          <span className={`font-black ${tier === 1 && tick.spo2 < 85 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`}>
            {signal_status === 'online' ? `${tick.spo2}%` : '--'}
          </span>
          <span className="text-[8px] text-slate-500 block">sat</span>
        </div>

        <div className="bg-slate-900/90 p-1.5 rounded-xl border border-slate-800/90">
          <div className="text-[9px] text-slate-400 flex items-center justify-center space-x-0.5">
            <Zap className="w-2.5 h-2.5 text-amber-400" />
            <span>BP</span>
          </div>
          <span className="font-bold text-slate-200 text-[11px]">
            {signal_status === 'online' ? `${tick.bp_sys}/${tick.bp_dia}` : '--'}
          </span>
          <span className="text-[8px] text-slate-500 block">mmHg</span>
        </div>
      </div>
    </div>
  );
};
