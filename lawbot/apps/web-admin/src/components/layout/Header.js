'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Search, User } from 'lucide-react';
import NotificationCenter from '../realtime/NotificationCenter';
export default function Header() {
    return (_jsxs("header", { className: "h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6", children: [_jsx("div", { className: "flex items-center flex-1 max-w-lg", children: _jsxs("div", { className: "relative w-full", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" }), _jsx("input", { type: "text", placeholder: "T\u00ECm ki\u1EBFm...", className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" })] }) }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsx(NotificationCenter, {}), _jsxs("div", { className: "flex items-center space-x-3 pl-4 border-l border-gray-200", children: [_jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: "Admin User" }), _jsx("p", { className: "text-xs text-gray-500", children: "admin@lawbot.vn" })] }), _jsx("div", { className: "w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center", children: _jsx(User, { className: "w-6 h-6 text-white" }) })] })] })] }));
}
