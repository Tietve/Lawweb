'use client';

import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface PlatformChartProps {
  data: { platform: string; count: number }[];
}

const platformColors = {
  zalo: '#0068ff',
  telegram: '#0088cc',
  web: '#10b981',
  widget: '#8b5cf6',
};

export default function PlatformChart({ data }: PlatformChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.platform.toUpperCase()),
        datasets: [{
          data: data.map(d => d.count),
          backgroundColor: data.map(d =>
            platformColors[d.platform as keyof typeof platformColors] || '#6b7280'
          ),
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          },
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Phân Bố Nền Tảng
      </h3>
      <div className="h-64">
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
}
