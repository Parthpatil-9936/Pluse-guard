import React from 'react';
import {
  Server,
  Cloud,
  CloudOff,
  Database,
  Cpu,
  Radio,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Zap,
  X,
  ShieldCheck,
} from 'lucide-react';
import { THEME } from '../theme';

interface ServerTopologyModalProps {
  isOpen: boolean;
  onClose: () => void;
  cloudOnline: boolean;
  onToggleCloudOutage: () => void;
  suppressionRate: number;
}

export const ServerTopologyModal: React.FC<ServerTopologyModalProps> = ({
  isOpen,
  onClose,
  cloudOnline,
  onToggleCloudOutage,
  suppressionRate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-300 max-w-2xl w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-teal-50 border border-teal-200 text-teal-700">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Hospital Edge & Cloud Architecture Topology
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Real-Time Multi-Tier Resilience & Failover Inspector
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Topology Visualization */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block">
            Live Telemetry Data Pipeline
          </span>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
            {/* Node 1: Bedside Telemetry */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2 text-center">
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center mx-auto">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">10x ICU Bed Pods</h4>
                <p className="text-[10px] font-mono text-slate-500">10 Hz Telemetry Feeds</p>
              </div>
              <div className="text-[9px] font-mono text-emerald-700 bg-emerald-50 py-0.5 px-2 rounded-full inline-block border border-emerald-200 font-semibold">
                ● 100% Signal Online
              </div>
            </div>

            {/* Node 2: Local Edge Server */}
            <div className="bg-white p-3.5 rounded-2xl border-2 border-teal-500 shadow-sm space-y-2 text-center relative">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center mx-auto">
                <Cpu className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Local Edge Gateway</h4>
                <p className="text-[10px] font-mono text-slate-500">localhost:8000 • In-Ward</p>
              </div>
              <div className="text-[9px] font-mono text-teal-800 bg-teal-50 py-0.5 px-2 rounded-full inline-block border border-teal-200 font-bold">
                ● Autonomous Edge Core
              </div>
            </div>

            {/* Node 3: Cloud Central EHR */}
            <div
              className={`p-3.5 rounded-2xl border space-y-2 text-center transition-all ${
                cloudOnline
                  ? 'bg-white border-emerald-300 shadow-xs'
                  : 'bg-red-50/60 border-red-300 shadow-xs'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center mx-auto border ${
                  cloudOnline
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-red-100 text-red-600 border-red-300'
                }`}
              >
                {cloudOnline ? (
                  <Cloud className="w-4 h-4 animate-pulse" />
                ) : (
                  <CloudOff className="w-4 h-4 animate-bounce" />
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Cloud EHR Central</h4>
                <p className="text-[10px] font-mono text-slate-500">FHIR Warehouse Sync</p>
              </div>
              <div
                className={`text-[9px] font-mono py-0.5 px-2 rounded-full inline-block border font-bold ${
                  cloudOnline
                    ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                    : 'text-red-700 bg-red-100 border-red-200'
                }`}
              >
                {cloudOnline ? '● Uplink Active (Synced)' : '● Outage (Queueing)'}
              </div>
            </div>
          </div>
        </div>

        {/* Resilience Specs & Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center font-mono">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="text-[9px] text-slate-500 uppercase block font-semibold">Local Latency</span>
            <span className="text-xs font-bold text-slate-900">&lt; 2 ms</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="text-[9px] text-slate-500 uppercase block font-semibold">Edge ML Inference</span>
            <span className="text-xs font-bold text-teal-700">isoforest_v1</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="text-[9px] text-slate-500 uppercase block font-semibold">Local Buffer</span>
            <span className="text-xs font-bold text-slate-900">SQLite + Ring</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="text-[9px] text-slate-500 uppercase block font-semibold">Noise Suppression</span>
            <span className="text-xs font-bold text-teal-700">{suppressionRate}%</span>
          </div>
        </div>

        {/* Edge Safety Guarantees */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2 text-xs">
          <h5 className="font-bold text-slate-900 flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Autonomous Edge Failover Guarantees:</span>
          </h5>
          <ul className="space-y-1 text-slate-600 text-[11px] list-disc list-inside">
            <li>
              <strong>Zero Telemetry Drop:</strong> Local edge node processes patient vitals continuously without relying on WAN/Cloud uptime.
            </li>
            <li>
              <strong>Store-and-Forward:</strong> In the event of a cloud outage, all audit logs and telemetry markers are buffered in local memory/SQLite and synchronized automatically once connectivity returns.
            </li>
            <li>
              <strong>Independent Audio Alarms:</strong> Local bedside sirens and visual strobes operate autonomously per IEC 60601-1-8 medical standards.
            </li>
          </ul>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-200">
          <div className="text-xs font-mono text-slate-500">
            Current Status:{' '}
            <strong className={cloudOnline ? 'text-emerald-700' : 'text-amber-700'}>
              {cloudOnline ? 'Normal Synchronized Mode' : 'Autonomous Edge Fallback Mode'}
            </strong>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onToggleCloudOutage}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 border shadow-sm transition-all ${
                cloudOnline
                  ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{cloudOnline ? 'Simulate Cloud Outage' : 'Restore Cloud Link'}</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono border border-slate-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
