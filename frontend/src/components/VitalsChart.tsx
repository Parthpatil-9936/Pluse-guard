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
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 0,
        yAxisID: 'y_hr',
      },
      {
        label: 'SpO2 (%)',
        data: spo2Data,
        borderColor: '#00D6FF',
        backgroundColor: 'rgba(0, 214, 255, 0.08)',
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 0,
        yAxisID: 'y_spo2',
      },
      {
        label: 'Systolic BP (mmHg)',
        data: bpSysData,
        borderColor: '#F59E0B',
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
          color: '#94A3B8',
          font: { size: 10, family: 'monospace' },
          boxWidth: 12,
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#64748B', font: { size: 9, family: 'monospace' } },
      },
      y_hr: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        min: 0,
        max: 220,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#EF4444', font: { size: 9 } },
      },
      y_spo2: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        min: 60,
        max: 100,
        grid: { drawOnChartArea: false },
        ticks: { color: '#00D6FF', font: { size: 9 } },
      },
    },
  };

  return (
    <div className="h-56 w-full relative">
      <Line data={data} options={options} />
    </div>
  );
};
