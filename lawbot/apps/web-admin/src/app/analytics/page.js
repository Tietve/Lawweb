'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAnalytics } from '@/hooks/useAnalytics';
Chart.register(...registerables);
export default function AnalyticsPage() {
    const { stats } = useAnalytics();
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    useEffect(() => {
        if (!chartRef.current || !stats?.conversationHistory)
            return;
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        const ctx = chartRef.current.getContext('2d');
        if (!ctx)
            return;
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
            if (!chartInstance.current)
                return;
            chartInstance.current.update('none');
        }, 60000);
        return () => {
            clearInterval(interval);
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [stats]);
    return (_jsx(DashboardLayout, { children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Ph\u00E2n T\u00EDch Th\u1EDDi Gian Th\u1EF1c" }), _jsx("p", { className: "text-gray-600 mt-1", children: "Theo d\u00F5i ho\u1EA1t \u0111\u1ED9ng h\u1EC7 th\u1ED1ng theo th\u1EDDi gian th\u1EF1c" })] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Ho\u1EA1t \u0110\u1ED9ng Th\u1EDDi Gian Th\u1EF1c (20 \u0111i\u1EC3m g\u1EA7n nh\u1EA5t)" }), _jsx("div", { className: "h-96", children: _jsx("canvas", { ref: chartRef }) }), _jsx("p", { className: "text-sm text-gray-500 mt-4 text-center", children: "Bi\u1EC3u \u0111\u1ED3 t\u1EF1 \u0111\u1ED9ng c\u1EADp nh\u1EADt m\u1ED7i ph\u00FAt" })] })] }) }));
}
