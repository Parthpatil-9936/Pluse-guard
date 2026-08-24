import React from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface GatewayUnreachableOverlayProps {
  isDisconnected: boolean;
  onRetry: () => void;
}

export const GatewayUnreachableOverlay: React.FC<GatewayUnreachableOverlayProps> = ({
  isDisconnected,
  onRetry,
}) => {
  if (!isDisconnected) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-fadeIn">
      <div className="bg-[#121824] p-8 rounded-3xl border-2 border-red-500 max-w-lg w-full text-center space-y-5 shadow-2xl pulse-red-glow">
        <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 border border-red-500/50 flex items-center justify-center mx-auto shadow-xl">
          <ShieldAlert className="w-8 h-8 animate-bounce" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-widest">
            GATEWAY PROCESS UNREACHABLE
          </span>
          <h3 className="text-2xl font-extrabold text-white">Edge Service Disconnected</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            The Edge Gateway FastAPI process is unreachable. Emergency local hardware bypass mode engaged. Local bedside hardware alarms remain active per safety rules.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-left text-xs font-mono space-y-1.5 text-slate-400">
          <div>● WebSocket stream: DISCONNECTED</div>
          <div>● Host: localhost:8000</div>
          <div>● Single Point of Failure: Acknowledged (Phase 2 Hot-Standby)</div>
        </div>

        <button
          onClick={onRetry}
          className="w-full py-3.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-lg"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Attempt Gateway Reconnection</span>
        </button>
      </div>
    </div>
  );
};
