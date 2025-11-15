'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
export default function StatCard({ title, value, change, icon }) {
    const isPositive = change && change > 0;
    const displayValue = typeof value === 'number' ? formatNumber(value) : value;
    return (_jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("div", { className: "p-3 bg-primary-50 rounded-lg", children: icon }), change !== undefined && (_jsxs("div", { className: `flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`, children: [isPositive ? _jsx(TrendingUp, { className: "w-4 h-4" }) : _jsx(TrendingDown, { className: "w-4 h-4" }), _jsxs("span", { className: "text-sm font-medium ml-1", children: [Math.abs(change), "%"] })] }))] }), _jsx("h3", { className: "text-gray-600 text-sm mb-1", children: title }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: displayValue })] }));
}
