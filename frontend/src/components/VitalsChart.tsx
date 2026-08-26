import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { TelemetryTick } from '../types';
import { THEME } from '../theme';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface VitalsChartProps {
  history: TelemetryTick[];
  bedId: string;
}

export const VitalsChart: React.FC<VitalsChartProps> = ({ history, bedId }) => {
  const recentHistory = history.slice(-30);

  const labels = recentHistory.map((_, i) => `-${recentHistory.length - i}s`);
  const hrData = recentHistory.map((t) => t.hr);
  const spo2Data = recentHistory.map((t) => t.spo2);
  const bpSysData = recentHistory.map((t) => t.bp_sys);

  const data = {
    labels,
    datasets: [
      {
        label: 'Heart Rate (bpm)',
        data: hrData,
        borderColor: THEME.colors.tier1.color,
        backgroundColor: 'rgba(220, 38, 38, 0.08)',
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 0,
        yAxisID: 'y_hr',
        fill: true,
      },
      {
        label: 'SpO2 (%)',
        data: spo2Data,
        borderColor: THEME.colors.spo2.color,
        backgroundColor: 'rgba(2, 132, 199, 0.08)',
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 0,
        yAxisID: 'y_spo2',
        fill: true,
      },
      {
        label: 'Systolic BP (mmHg)',
        data: bpSysData,
        borderColor: THEME.colors.tier2.color,
        backgroundColor: 'transparent',
        borderDash: [4, 4],
        tension: 0.3,
        borderWidth: 1.5,
        pointRadius: 0,
        yAxisID: 'y_hr',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: THEME.colors.textSecondary,
          font: { size: 10, family: 'monospace', weight: 'bold' as const },
          boxWidth: 12,
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#FFFFFF',
        bodyColor: '#F1F5F9',
        borderColor: '#CBD5E1',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(15, 23, 42, 0.06)' },
        ticks: { color: THEME.colors.textMuted, font: { size: 9, family: 'monospace' } },
      },
      y_hr: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        min: 0,
        max: 220,
        grid: { color: 'rgba(15, 23, 42, 0.06)' },
        ticks: { color: THEME.colors.tier1.color, font: { size: 9, weight: 'bold' as const } },
      },
      y_spo2: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        min: 60,
        max: 100,
        grid: { drawOnChartArea: false },
        ticks: { color: THEME.colors.spo2.color, font: { size: 9, weight: 'bold' as const } },
      },
    },
  };

  return (
    <div className="h-56 w-full relative">
      <Line data={data} options={options} />
    </div>
  );
};

