import React, { useRef, useEffect } from 'react';
import { BedState } from '../types';
import { THEME } from '../theme';
import { Heart, Activity, AlertOctagon, Zap } from 'lucide-react';

interface BedCard3DProps {
  bedState: BedState;
  isSelected: boolean;
  onSelect: () => void;
}

export const BedCard3D: React.FC<BedCard3DProps> = ({ bedState, isSelected, onSelect }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { bed_id, signal_status, tick, alert, tier } = bedState;

  // Determine visual theme based on tier & signal from centralized THEME
  let statusColor: string = THEME.colors.tier3.color;
  let statusBg = 'bg-white border-slate-200 shadow-sm';
  let badgeText = 'TIER 3 • NORMAL';
  let badgeBg: string = THEME.colors.tier3.bg;
  let badgeTextColor: string = THEME.colors.tier3.text;
  let cardGlow = 'hover:border-teal-400 hover:shadow-md';


  if (signal_status === 'no_signal') {
    statusColor = THEME.colors.offline.color;
    statusBg = 'bg-slate-50/80 border-slate-300 opacity-75';
    badgeText = 'NO SIGNAL';
    badgeBg = THEME.colors.offline.bg;
    badgeTextColor = THEME.colors.offline.text;
    cardGlow = 'hover:border-slate-400';
  } else if (tier === 1) {
    statusColor = THEME.colors.tier1.color;
    statusBg = 'bg-red-50/80 border-red-300 pulse-red-glow';
    badgeText = 'TIER 1 • CATASTROPHIC';
    badgeBg = THEME.colors.tier1.bg;
    badgeTextColor = THEME.colors.tier1.text;
    cardGlow = 'border-red-400 shadow-red-100';
  } else if (tier === 2) {
    statusColor = THEME.colors.tier2.color;
    statusBg = 'bg-amber-50/80 border-amber-300 pulse-yellow-glow';
    badgeText = 'TIER 2 • ANOMALY';
    badgeBg = THEME.colors.tier2.bg;
    badgeTextColor = THEME.colors.tier2.text;
    cardGlow = 'border-amber-400 shadow-amber-100';
  }

  // 3D Canvas Isometric Bed Graphic (Tuned for Medium Theme)
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
    ctx.fillStyle = '#334155';
    ctx.fill();
    ctx.strokeStyle = statusColor;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Bed Side 3D Drop Left
    ctx.beginPath();
    ctx.moveTo(-55, -5);
    ctx.lineTo(0, 15);
    ctx.lineTo(0, 25);
    ctx.lineTo(-55, 5);
    ctx.closePath();
    ctx.fillStyle = '#1E293B';
    ctx.fill();
    ctx.stroke();

    // Bed Side 3D Drop Right
    ctx.beginPath();
    ctx.moveTo(0, 15);
    ctx.lineTo(55, -5);
    ctx.lineTo(55, 5);
    ctx.lineTo(0, 25);
    ctx.closePath();
    ctx.fillStyle = '#0F172A';
    ctx.fill();
    ctx.stroke();

    // Pillow Headrest 3D box (White Linen)
    ctx.beginPath();
    ctx.moveTo(-35, -20);
    ctx.lineTo(-15, -26);
    ctx.lineTo(5, -18);
    ctx.lineTo(-15, -12);
    ctx.closePath();
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    // Bedside 3D Medical Monitor Screen
    ctx.save();
    ctx.translate(-45, -35);

    // Stand pole
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 25);
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Screen Monitor Case
    ctx.beginPath();
    ctx.rect(-18, -25, 36, 25);
    ctx.fillStyle = '#0F172A';
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
      ctx.strokeStyle = '#94A3B8';
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
          ? 'ring-2 ring-teal-600 scale-[1.02] shadow-lg bg-teal-50/30 border-teal-500'
          : cardGlow
      } flex flex-col justify-between`}
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center space-x-2">
          <span className="font-mono font-black text-sm text-slate-900">{bed_id.toUpperCase()}</span>
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor: statusColor,
              boxShadow: `0 0 6px ${statusColor}`,
            }}
          />
        </div>

        <span
          className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md uppercase border"
          style={{
            backgroundColor: badgeBg,
            color: badgeTextColor,
            borderColor: `${statusColor}40`,
          }}
        >
          {badgeText}
        </span>
      </div>

      {/* 3D Canvas Bed Graphic */}
      <div className="h-24 flex items-center justify-center relative overflow-hidden my-1 bg-slate-100/90 rounded-xl border border-slate-200">
        <canvas ref={canvasRef} width={190} height={105} className="block" />

        {/* Emergency Pulsing Badge */}
        {tier === 1 && (
          <div className="absolute top-2 right-2 bg-red-600 text-white text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded flex items-center space-x-1 animate-pulse shadow-md">
            <AlertOctagon className="w-2.5 h-2.5" />
            <span>CRITICAL</span>
          </div>
        )}

        {/* Drift Flag Badge */}
        {alert && alert.drift_flag !== 'none' && (
          <div className="absolute bottom-2 left-2 text-[9px] font-mono uppercase bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded font-semibold">
            {alert.drift_flag}
          </div>
        )}
      </div>

      {/* Live Vital Telemetry Readouts */}
      <div className="grid grid-cols-3 gap-1.5 pt-1.5 text-center text-xs font-mono">
        <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-200">
          <div className="text-[9px] text-slate-500 flex items-center justify-center space-x-0.5">
            <Heart className="w-2.5 h-2.5 text-red-500" />
            <span>HR</span>
          </div>
          <span className={`font-black ${tier === 1 && tick.hr < 30 ? 'text-red-600 animate-pulse' : 'text-slate-900'}`}>
            {signal_status === 'online' ? `${tick.hr}` : '--'}
          </span>
          <span className="text-[8px] text-slate-400 block">bpm</span>
        </div>

        <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-200">
          <div className="text-[9px] text-slate-500 flex items-center justify-center space-x-0.5">
            <Activity className="w-2.5 h-2.5 text-sky-600" />
            <span>SpO2</span>
          </div>
          <span className={`font-black ${tier === 1 && tick.spo2 < 85 ? 'text-red-600 animate-pulse' : 'text-sky-700'}`}>
            {signal_status === 'online' ? `${tick.spo2}%` : '--'}
          </span>
          <span className="text-[8px] text-slate-400 block">sat</span>
        </div>

        <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-200">
          <div className="text-[9px] text-slate-500 flex items-center justify-center space-x-0.5">
            <Zap className="w-2.5 h-2.5 text-amber-600" />
            <span>BP</span>
          </div>
          <span className="font-bold text-slate-800 text-[11px]">
            {signal_status === 'online' ? `${tick.bp_sys}/${tick.bp_dia}` : '--'}
          </span>
          <span className="text-[8px] text-slate-400 block">mmHg</span>
        </div>
      </div>
    </div>
  );
};

