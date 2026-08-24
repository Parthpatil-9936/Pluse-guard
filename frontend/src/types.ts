export type TierType = 1 | 2 | 3;
export type SignalStatus = 'online' | 'no_signal';
export type DriftFlag = 'none' | 'drift' | 'tamper';

export interface TelemetryTick {
  bed_id: string;
  ts: string;
  hr: number;
  spo2: number;
  bp_sys: number;
  bp_dia: number;
  ecg_lead_ok: boolean;
  seq: number;
}

export interface AlertEvent {
  alert_id: string;
  bed_id: string;
  tier: TierType;
  confidence: number;
  reason: string;
  drift_flag: DriftFlag;
  schema_version: string;
  ts: string;
  vitals_snapshot?: {
    hr: number;
    spo2: number;
    bp_sys: number;
    bp_dia: number;
    ecg_lead_ok: boolean;
    seq: number;
  };
}

export interface BedState {
  bed_id: string;
  signal_status: SignalStatus;
  tick: TelemetryTick;
  alert: AlertEvent | null;
  tier: TierType;
  suppressed: boolean;
  history: TelemetryTick[];
}

export interface AuditLogItem {
  id: string;
  bed_id: string;
  event_type: string;
  tier?: number;
  confidence?: number;
  reason?: string;
  drift_flag?: string;
  clinician_id?: string;
  justification?: string;
  mute_duration_s?: number;
  model_version?: string;
  ts: string;
}
