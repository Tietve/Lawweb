import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'preact/hooks';
export function Citations({ citations }) {
    const [expanded, setExpanded] = useState(false);
    if (!citations || citations.length === 0) {
        return null;
    }
    return (_jsxs("div", { class: "mt-3 pt-3 border-t border-gray-200", children: [_jsxs("button", { onClick: () => setExpanded(!expanded), class: "text-xs text-blue-600 hover:underline flex items-center gap-1", children: [_jsx("svg", { class: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-width": "2", d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" }) }), citations.length, " ngu\u1ED3n tham kh\u1EA3o", _jsx("svg", { class: `w-4 h-4 transform transition-transform ${expanded ? 'rotate-180' : ''}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-width": "2", d: "M19 9l-7 7-7-7" }) })] }), expanded && (_jsx("div", { class: "mt-2 space-y-2", children: citations.map((citation, idx) => (_jsxs("div", { class: "text-xs bg-gray-50 p-2 rounded", children: [_jsxs("div", { class: "font-semibold text-gray-800", children: [citation.law, " - \u0110i\u1EC1u ", citation.article] }), _jsxs("div", { class: "text-gray-600 mt-1", children: ["\u0110\u1ED9 tin c\u1EADy: ", (citation.confidence * 100).toFixed(0), "%"] }), citation.url && (_jsx("a", { href: citation.url, target: "_blank", rel: "noopener noreferrer", class: "text-blue-500 hover:underline mt-1 inline-block", children: "Xem chi ti\u1EBFt \u2192" }))] }, idx))) }))] }));
}
