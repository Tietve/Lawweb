'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
const platformColors = {
    zalo: '#0068ff',
    telegram: '#0088cc',
    web: '#10b981',
    widget: '#8b5cf6',
};
export default function PlatformChart({ data }) {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    useEffect(() => {
        if (!chartRef.current)
            return;
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        const ctx = chartRef.current.getContext('2d');
        if (!ctx)
            return;
        chartInstance.current = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.map(d => d.platform.toUpperCase()),
                datasets: [{
                        data: data.map(d => d.count),
                        backgroundColor: data.map(d => platformColors[d.platform] || '#6b7280'),
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
    return (_jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Ph\u00E2n B\u1ED1 N\u1EC1n T\u1EA3ng" }), _jsx("div", { className: "h-64", children: _jsx("canvas", { ref: chartRef }) })] }));
}
