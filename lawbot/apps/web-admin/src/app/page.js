'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function HomePage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/dashboard');
    }, [router]);
    return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" }), _jsx("p", { className: "mt-4 text-gray-600", children: "\u0110ang chuy\u1EC3n h\u01B0\u1EDBng..." })] }) }));
}
