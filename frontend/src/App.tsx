import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { BedGrid } from './components/BedGrid';
import { BedDetailPanel } from './components/BedDetailPanel';
import { AuditFeed } from './components/AuditFeed';
import { DemoInjector } from './components/DemoInjector';
import { GatewayUnreachableOverlay } from './components/GatewayUnreachableOverlay';
import { ICUWard3D } from './components/3d/ICUWard3D';
import { BedState, AuditLogItem, TelemetryTick, AlertEvent } from './types';
import { medicalAudio } from './services/audioAlerts';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/alerts';

export function App() {
  const [cloudOnline, setCloudOnline] = useState(true);
  const [suppressionRate, setSuppressionRate] = useState(82.5);
  const [selectedBedId, setSelectedBedId] = useState('bed-04');
  const [isDisconnected, setIsDisconnected] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [clinicianToken, setClinicianToken] = useState('');
  const [viewMode, setViewMode] = useState<'3d' | 'hybrid' | 'grid'>('3d');
  const [soundEnabled, setSoundEnabled] = useState(false);

  // 10 Bed State Dictionary
  const [beds, setBeds] = useState<Record<string, BedState>>(() => {
    const initial: Record<string, BedState> = {};
    for (let i = 1; i <= 10; i++) {
      const id = `bed-${String(i).padStart(2, '0')}`;
      initial[id] = {
        bed_id: id,
        signal_status: 'online',
        tick: {
          bed_id: id,
          ts: new Date().toISOString(),
          hr: 72,
          spo2: 98,
          bp_sys: 120,
          bp_dia: 80,
          ecg_lead_ok: true,
          seq: 1,
        },
        alert: null,
        tier: 3,
        suppressed: true,
        history: [],
      };
    }
    return initial;
  });

  const wsRef = useRef<WebSocket | null>(null);

  // Toggle Sound State
  const handleToggleSound = () => {
    const nextSound = !soundEnabled;
    setSoundEnabled(nextSound);
    medicalAudio.setMuted(!nextSound);
    if (nextSound) {
      medicalAudio.playActionBeep();
    }
  };

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
    const interval = setInterval(fetchAuditLogs, 3000);
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
            const {
              bed_id,
              signal_status,
              tick,
              alert,
              tier,
              suppressed,
              suppression_rate,
              cloud_online,
            } = data;

            if (suppression_rate !== undefined) setSuppressionRate(suppression_rate);
            if (cloud_online !== undefined) setCloudOnline(cloud_online);

            // Audio Alert if Tier 1 emergency occurs
            if (alert && alert.tier === 1 && !suppressed) {
              medicalAudio.triggerTier1Chime();
            }

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
                  tier: alert ? alert.tier : suppressed ? 3 : tier,
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
    medicalAudio.playActionBeep();
    fetch(`${BACKEND_URL}/api/test/toggle-cloud-outage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ simulate_outage: !nextState }),
    }).catch(() => {});
  };

  const handleAcknowledge = (alertId: string) => {
    medicalAudio.playActionBeep();
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
    medicalAudio.playActionBeep();
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
    medicalAudio.playActionBeep();
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
    medicalAudio.playActionBeep();
    fetch(`${BACKEND_URL}/api/test/inject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bed_id: bedId, event_type: eventType }),
    }).catch(() => {});
  };

  const selectedBedState = beds[selectedBedId] || beds['bed-04'] || beds['bed-01'];
  const activeTier1Count = Object.values(beds).filter(
    (b) => b.tier === 1 && b.signal_status === 'online'
  ).length;
  const activeTier2Count = Object.values(beds).filter(
    (b) => b.tier === 2 && b.signal_status === 'online'
  ).length;

  return (
    <div className="min-h-screen bg-[#070B12] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Header Bar */}
      <Header
        cloudOnline={cloudOnline}
        onToggleCloudOutage={handleToggleCloudOutage}
        suppressionRate={suppressionRate}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        activeTier1Count={activeTier1Count}
        activeTier2Count={activeTier2Count}
      />

      {/* Main Command Center Layout */}
      <main className="flex-1 p-4 sm:p-6 space-y-6 max-w-[1720px] w-full mx-auto">
        {/* VIEW MODE 1: FULL 3D WARD ROOM VIEW */}
        {viewMode === '3d' && (
          <div className="space-y-6 animate-fadeIn">
            <ICUWard3D
              beds={beds}
              selectedBedId={selectedBedId}
              onSelectBed={(id) => setSelectedBedId(id)}
            />
          </div>
        )}

        {/* VIEW MODE 2: SPLIT HYBRID (3D WARD + 10-BED MATRIX SIDE-BY-SIDE) */}
        {viewMode === 'hybrid' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 animate-fadeIn">
            <div className="xl:col-span-6">
              <ICUWard3D
                beds={beds}
                selectedBedId={selectedBedId}
                onSelectBed={(id) => setSelectedBedId(id)}
              />
            </div>
            <div className="xl:col-span-6">
              <BedGrid
                beds={beds}
                selectedBedId={selectedBedId}
                onSelectBed={(id) => setSelectedBedId(id)}
              />
            </div>
          </div>
        )}

        {/* VIEW MODE 3: CARD MATRIX ONLY */}
        {viewMode === 'grid' && (
          <div className="animate-fadeIn">
            <BedGrid
              beds={beds}
              selectedBedId={selectedBedId}
              onSelectBed={(id) => setSelectedBedId(id)}
            />
          </div>
        )}

        {/* Bed Inspector & Clinical Telemetry Deck */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Selected Bed Detail Panel (8 Columns) */}
          <div className="lg:col-span-8">
            <BedDetailPanel
              bedState={selectedBedState}
              onAcknowledge={handleAcknowledge}
              onOverride={handleOverride}
              onMute={handleMute}
            />
          </div>

          {/* Side Panel: Demo Injector & Audit Feed (4 Columns) */}
          <div className="lg:col-span-4 space-y-6">
            <DemoInjector
              selectedBedId={selectedBedId}
              onInject={handleInject}
            />
            <AuditFeed logs={auditLogs} />
          </div>
        </div>
      </main>

      {/* Gateway Unreachable Overlay */}
      <GatewayUnreachableOverlay
        isDisconnected={isDisconnected}
        onRetry={connectWebSocket}
      />
    </div>
  );
}

export default App;
