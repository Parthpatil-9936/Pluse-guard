import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { BedGrid } from './components/BedGrid';
import { BedDetailPanel } from './components/BedDetailPanel';
import { AuditFeed } from './components/AuditFeed';
import { DemoInjector } from './components/DemoInjector';
import { GatewayUnreachableOverlay } from './components/GatewayUnreachableOverlay';
import { BedState, AuditLogItem, TelemetryTick, AlertEvent } from './types';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/alerts';

export function App() {
  const [cloudOnline, setCloudOnline] = useState(true);
  const [suppressionRate, setSuppressionRate] = useState(82.5);
  const [selectedBedId, setSelectedBedId] = useState('bed-01');
  const [isDisconnected, setIsDisconnected] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [clinicianToken, setClinicianToken] = useState('');

  // 10 Bed State Dictionary
  const [beds, setBeds] = useState<Record<string, BedState>>(() => {
    const initial: Record<string, BedState> = {};
    for (let i = 1; i <= 10; i++) {
      const id = `bed-${String(i).padStart(2, '0')}`;
      initial[id] = {
        bed_id: id,
        signal_status: 'online',
        tick: { bed_id: id, ts: new Date().toISOString(), hr: 72, spo2: 98, bp_sys: 120, bp_dia: 80, ecg_lead_ok: true, seq: 1 },
        alert: null,
        tier: 3,
        suppressed: true,
        history: [],
      };
    }
    return initial;
  });

  const wsRef = useRef<WebSocket | null>(null);

  // Authenticate clinician session token
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/auth/login`, { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        if (data.access_token) {
          setClinicianToken(data.access_token);
        }
      })
      .catch((err) => console.log('Auth login fallback active', err));
  }, []);

  // Fetch initial audit logs
  const fetchAuditLogs = () => {
    fetch(`${BACKEND_URL}/api/audit/logs`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAuditLogs(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchAuditLogs();
    const interval = setInterval(fetchAuditLogs, 4000);
    return () => clearInterval(interval);
  }, []);

  // Connect WebSocket Stream
  const connectWebSocket = () => {
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsDisconnected(false);
        console.log('[WebSocket] Connected to PulseGuard Gateway');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'TELEMETRY_UPDATE') {
            const { bed_id, signal_status, tick, alert, tier, suppressed, suppression_rate, cloud_online } = data;

            if (suppression_rate !== undefined) setSuppressionRate(suppression_rate);
            if (cloud_online !== undefined) setCloudOnline(cloud_online);

            setBeds((prev) => {
              const currentBed = prev[bed_id] || {
                bed_id,
                signal_status: 'online',
                tick,
                alert: null,
                tier: 3,
                suppressed: true,
                history: [],
              };

              const newHistory = [...currentBed.history, tick].slice(-30);

              return {
                ...prev,
                [bed_id]: {
                  ...currentBed,
                  signal_status,
                  tick,
                  alert: alert || currentBed.alert,
                  tier: alert ? alert.tier : (suppressed ? 3 : tier),
                  suppressed,
                  history: newHistory,
                },
              };
            });
          } else if (data.type === 'CLOUD_STATUS_CHANGE') {
            setCloudOnline(data.online);
          } else if (data.type === 'ACTION_LOG') {
            fetchAuditLogs();
          }
        } catch (e) {
          console.error('[WS Message Error]', e);
        }
      };

      ws.onerror = () => {
        setIsDisconnected(true);
      };

      ws.onclose = () => {
        setIsDisconnected(true);
        setTimeout(connectWebSocket, 3000); // Auto reconnect
      };
    } catch (e) {
      setIsDisconnected(true);
    }
  };

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // Action handlers
  const handleToggleCloudOutage = () => {
    const nextState = !cloudOnline;
    setCloudOnline(nextState);
    fetch(`${BACKEND_URL}/api/test/toggle-cloud-outage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ simulate_outage: !nextState }),
    }).catch(() => {});
  };

  const handleAcknowledge = (alertId: string) => {
    fetch(`${BACKEND_URL}/alerts/${alertId}/acknowledge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clinicianToken}`,
      },
      body: JSON.stringify({ clinician_id: 'nurse_johnson_rn', ts: new Date().toISOString() }),
    })
      .then(() => fetchAuditLogs())
      .catch(() => {});
  };

  const handleOverride = (alertId: string, newTier: number, justification: string) => {
    fetch(`${BACKEND_URL}/alerts/${alertId}/override`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clinicianToken}`,
      },
      body: JSON.stringify({
        clinician_id: 'nurse_johnson_rn',
        ts: new Date().toISOString(),
        new_tier: newTier,
        justification,
      }),
    })
      .then(() => fetchAuditLogs())
      .catch(() => {});
  };

  const handleMute = (alertId: string, durationS: number) => {
    fetch(`${BACKEND_URL}/alerts/${alertId}/mute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clinicianToken}`,
      },
      body: JSON.stringify({
        clinician_id: 'nurse_johnson_rn',
        ts: new Date().toISOString(),
        duration_s: durationS,
      }),
    })
      .then(() => fetchAuditLogs())
      .catch(() => {});
  };

  const handleInject = (bedId: string, eventType: string) => {
    fetch(`${BACKEND_URL}/api/test/inject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bed_id: bedId, event_type: eventType }),
    }).catch(() => {});
  };

  const selectedBedState = beds[selectedBedId] || beds['bed-01'];

  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-100 flex flex-col font-sans">
      {/* Header Bar */}
      <Header
        cloudOnline={cloudOnline}
        onToggleCloudOutage={handleToggleCloudOutage}
        suppressionRate={suppressionRate}
        totalEvents={100}
      />

      {/* Main Grid & Inspector Area */}
      <main className="flex-1 p-4 sm:p-6 space-y-6 max-w-[1600px] w-full mx-auto">
        {/* 10-Bed Grid */}
        <BedGrid
          beds={beds}
          selectedBedId={selectedBedId}
          onSelectBed={(id) => setSelectedBedId(id)}
        />

        {/* Selected Bed Inspector & Demo Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Selected Bed Detail Panel (8 Cols) */}
          <div className="lg:col-span-8">
            <BedDetailPanel
              bedState={selectedBedState}
              onAcknowledge={handleAcknowledge}
              onOverride={handleOverride}
              onMute={handleMute}
            />
          </div>

          {/* Side Panel: Demo Injector & Audit Feed (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            <DemoInjector selectedBedId={selectedBedId} onInject={handleInject} />
            <AuditFeed logs={auditLogs} />
          </div>
        </div>
      </main>

      {/* Gateway Unreachable Resilience Overlay */}
      <GatewayUnreachableOverlay
        isDisconnected={isDisconnected}
        onRetry={connectWebSocket}
      />
    </div>
  );
}

export default App;
