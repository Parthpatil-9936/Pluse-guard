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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl animate-fadeIn">
      <div className="bg-white p-8 rounded-3xl border-2 border-red-500 max-w-lg w-full text-center space-y-5 shadow-2xl pulse-red-glow">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 border border-red-300 flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="w-8 h-8 animate-bounce" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold text-red-700 uppercase tracking-widest">
            GATEWAY PROCESS UNREACHABLE
          </span>
          <h3 className="text-2xl font-extrabold text-slate-900">Edge Service Disconnected</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            The Edge Gateway FastAPI process is unreachable. Emergency local hardware bypass mode engaged. Local bedside hardware alarms remain active per safety rules.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs font-mono space-y-1.5 text-slate-600">
          <div>● WebSocket stream: <span className="text-red-600 font-bold">DISCONNECTED</span></div>
          <div>● Host: localhost:8000</div>
          <div>● Single Point of Failure: Acknowledged (Phase 2 Hot-Standby)</div>
        </div>

        <button
          onClick={onRetry}
          className="w-full py-3.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Attempt Gateway Reconnection</span>
        </button>
      </div>
    </div>
  );
};

