'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await fetch('/api/v1/admin/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            if (!response.ok) {
                throw new Error('Login failed');
            }
            const data = await response.json();
            api.setToken(data.token);
            document.cookie = `admin_token=${data.token}; path=/; max-age=86400`;
            router.push('/dashboard');
        }
        catch (err) {
            setError('Email hoặc mật khẩu không đúng');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50 px-4", children: _jsxs("div", { className: "max-w-md w-full space-y-8", children: [_jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-3xl font-bold text-primary-600", children: "LawBot Admin" }), _jsx("p", { className: "mt-2 text-gray-600", children: "\u0110\u0103ng nh\u1EADp v\u00E0o h\u1EC7 th\u1ED1ng qu\u1EA3n l\u00FD" })] }), _jsxs("form", { onSubmit: handleSubmit, className: "mt-8 space-y-6 bg-white p-8 rounded-lg shadow", children: [error && (_jsx("div", { className: "bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm", children: error })), _jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700 mb-2", children: "Email" }), _jsx("input", { id: "email", type: "email", value: email, onChange: (e) => setEmail(e.target.value), required: true, className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500", placeholder: "admin@lawbot.vn" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-gray-700 mb-2", children: "M\u1EADt kh\u1EA9u" }), _jsx("input", { id: "password", type: "password", value: password, onChange: (e) => setPassword(e.target.value), required: true, className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" })] }), _jsx("button", { type: "submit", disabled: loading, className: "w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50", children: loading ? 'Đang đăng nhập...' : 'Đăng nhập' })] }), _jsx("p", { className: "text-center text-sm text-gray-500", children: "Demo: admin@lawbot.vn / admin123" })] }) }));
}
