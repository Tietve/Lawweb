'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
export default function ChatButton() {
    const [isOpen, setIsOpen] = useState(false);
    return (_jsxs(_Fragment, { children: [!isOpen && (_jsx("button", { onClick: () => setIsOpen(true), className: "fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 flex items-center justify-center z-50", "aria-label": "Open chat", children: _jsx(MessageCircle, { className: "w-6 h-6" }) })), isOpen && (_jsx("div", { className: "fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center md:justify-end p-0 md:p-4", children: _jsxs("div", { className: "w-full md:max-w-md h-full md:h-[600px] bg-white md:rounded-lg shadow-xl flex flex-col md:mr-6 md:mb-6", children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b bg-blue-600 text-white md:rounded-t-lg", children: [_jsx("h3", { className: "font-semibold", children: "LawBot Chat" }), _jsx("button", { onClick: () => setIsOpen(false), className: "hover:bg-blue-700 p-1 rounded transition-colors", "aria-label": "Close chat", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsx("div", { className: "flex-1 overflow-hidden", children: _jsx("iframe", { src: "/chat-widget", className: "w-full h-full border-0", title: "Legal Chat Widget" }) })] }) }))] }));
}
