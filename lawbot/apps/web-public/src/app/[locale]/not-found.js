'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from 'next/link';
import { useTranslations } from 'next-intl';
export default function LocaleNotFound() {
    const t = useTranslations();
    return (_jsx("div", { className: "min-h-[60vh] flex items-center justify-center px-4", children: _jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-6xl font-bold text-gray-900 mb-4", children: "404" }), _jsx("p", { className: "text-xl text-gray-600 mb-8", children: "Trang kh\u00F4ng t\u1ED3n t\u1EA1i" }), _jsx(Link, { href: "/", className: "inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors", children: "V\u1EC1 trang ch\u1EE7" })] }) }));
}
