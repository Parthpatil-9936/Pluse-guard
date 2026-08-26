/**
 * PulseGuard-AI Centralized Theme Configuration
 * Medium-toned, clean clinical medical palette.
 */

export const THEME = {
  // Hex strings for UI, HTML/CSS, 2D Canvas & Chart.js
  colors: {
    // Backgrounds & Surfaces
    bgApp: '#E2E8F0', // Medium slate backdrop
    bgCard: '#FFFFFF', // Clean card surface
    bgCardMuted: '#F8FAFC', // Secondary soft surface
    bgInset: '#F1F5F9', // Inset telemetry/chart wells
    bgOverlay: 'rgba(15, 23, 42, 0.65)', // Modal backdrop

    // Borders & Dividers
    border: '#CBD5E1', // Subtle divider
    borderLight: '#E2E8F0', // Faint border
    borderFocus: '#0D9488', // Active focus ring

    // Typography
    textPrimary: '#0F172A', // Deep slate (WCAG AAA)
    textSecondary: '#475569', // Muted slate
    textMuted: '#64748B', // Units / subtle timestamps
    textInverse: '#FFFFFF', // White text on dark accents

    // Medical Brand Accents
    teal: '#0D9488', // Primary Clinical Teal
    tealLight: '#E6F4F1',
    tealDark: '#115E59',
    blue: '#2563EB', // Trust Medical Blue
    blueLight: '#EFF6FF',

    // Clinical Triage Tiers & Alert Vitals
    tier1: {
      color: '#DC2626', // Crimson Red
      bg: '#FEF2F2',
      border: '#FECACA',
      text: '#991B1B',
      glow: 'rgba(220, 38, 38, 0.25)',
    },
    tier2: {
      color: '#D97706', // Clinical Amber
      bg: '#FFFBEB',
      border: '#FDE68A',
      text: '#92400E',
      glow: 'rgba(217, 119, 6, 0.25)',
    },
    tier3: {
      color: '#059669', // Stable Emerald
      bg: '#ECFDF5',
      border: '#A7F3D0',
      text: '#065F46',
      glow: 'rgba(5, 150, 105, 0.2)',
    },
    spo2: {
      color: '#0284C7', // Cerulean Blue
      bg: '#F0F9FF',
      border: '#BAE6FD',
      text: '#0369A1',
    },
    artifact: {
      color: '#7C3AED', // Violet
      bg: '#F5F3FF',
      border: '#DDD6FE',
      text: '#5B21B6',
    },
    offline: {
      color: '#64748B', // Slate Gray
      bg: '#F1F5F9',
      border: '#CBD5E1',
      text: '#475569',
    },
  },

  // Numeric hex values (0x...) for Three.js Lighting, Materials & Shaders
  three: {
    sceneBg: 0xdce3e8,
    fogColor: 0xdce3e8,
    ambientLight: 0xffffff,
    directionalLight: 0xffffff,
    fillLight: 0xb0c4de,

    floorColor: 0xe2e8f0,
    floorGridCenter: 0x3a7ca5,
    floorGridLines: 0xc8d3dc,
    aislePathway: 0x0d9488,
    particles: 0x3a7ca5,

    bedZoneFloor: 0xf1f5f9,
    bedZoneBorder: 0xcbd5e1,
    bedFrame: 0x64748b,
    bedRails: 0xcfd8dc,
    mattress: 0x334155,
    pillow: 0xffffff,
    board: 0x64748b,

    monitorStand: 0x94a3b8,
    monitorCase: 0x1e293b,
    ivPole: 0x94a3b8,
    ivBag: 0xbae6fd,

    // Dynamic Tier Status in 3D
    tier1: 0xdc2626,
    tier2: 0xd97706,
    tier3: 0x059669,
    offline: 0x64748b,
    tealAccent: 0x0d9488,
  },
} as const;
