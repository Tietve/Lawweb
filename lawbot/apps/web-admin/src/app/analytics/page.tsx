'use client';

import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAnalytics } from '@/hooks/useAnalytics';

Chart.register(...registerables);

export default function AnalyticsPage() {
  const { stats } = useAnalytics();
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || !stats?.conversationHistory) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    const last20Points = stats.conversationHistory.slice(-20);

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: last20Points.map(d => d.time),
        datasets: [{
          label: 'Tin nhắn/phút',
          data: last20Points.map(d => d.value),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.3,
          fill: true,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 750,
        },
        scales: {
          y: {
            beginAtZero: true,
          }
        }
      }
    });

    const interval = setInterval(() => {
      if (!chartInstance.current) return;
      chartInstance.current.update('none');
    }, 60000);

    return () => {
      clearInterval(interval);
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [stats]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Phân Tích Thời Gian Thực</h1>
          <p className="text-gray-600 mt-1">Theo dõi hoạt động hệ thống theo thời gian thực</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Hoạt Động Thời Gian Thực (20 điểm gần nhất)
          </h3>
          <div className="h-96">
            <canvas ref={chartRef}></canvas>
          </div>
          <p className="text-sm text-gray-500 mt-4 text-center">
            Biểu đồ tự động cập nhật mỗi phút
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
