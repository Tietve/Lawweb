'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslations } from 'next-intl';
import { Scale, Briefcase, Building2 } from 'lucide-react';
export const dynamic = 'force-dynamic';
export default function HomePage() {
    const t = useTranslations('home');
    const features = [
        {
            icon: Scale,
            title: t('features.civilLaw.title'),
            description: t('features.civilLaw.description'),
            color: 'text-blue-600 bg-blue-50',
        },
        {
            icon: Briefcase,
            title: t('features.laborLaw.title'),
            description: t('features.laborLaw.description'),
            color: 'text-green-600 bg-green-50',
        },
        {
            icon: Building2,
            title: t('features.businessLaw.title'),
            description: t('features.businessLaw.description'),
            color: 'text-purple-600 bg-purple-50',
        },
    ];
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-b from-blue-50 to-white", children: [_jsx("section", { className: "px-4 py-16 md:py-24 max-w-7xl mx-auto", children: _jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-4xl md:text-6xl font-bold text-gray-900 mb-6", children: t('hero.title') }), _jsx("p", { className: "text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto", children: t('hero.subtitle') }), _jsxs("div", { className: "flex flex-col sm:flex-row justify-center gap-4", children: [_jsx("button", { className: "px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium", children: t('hero.ctaPrimary') }), _jsx("button", { className: "px-8 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium", children: t('hero.ctaSecondary') })] })] }) }), _jsx("section", { className: "py-16 px-4 bg-white", children: _jsxs("div", { className: "max-w-7xl mx-auto", children: [_jsx("h2", { className: "text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900", children: t('features.title') }), _jsx("div", { className: "grid md:grid-cols-3 gap-8", children: features.map((feature, index) => (_jsxs("div", { className: "p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow bg-white", children: [_jsx("div", { className: `w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`, children: _jsx(feature.icon, { className: "w-6 h-6" }) }), _jsx("h3", { className: "text-xl font-semibold mb-2 text-gray-900", children: feature.title }), _jsx("p", { className: "text-gray-600", children: feature.description })] }, index))) })] }) }), _jsx("section", { className: "py-16 px-4", children: _jsxs("div", { className: "max-w-4xl mx-auto text-center bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-12 text-white", children: [_jsx("h2", { className: "text-3xl md:text-4xl font-bold mb-4", children: "B\u1EAFt \u0111\u1EA7u t\u01B0 v\u1EA5n ph\u00E1p lu\u1EADt ngay h\u00F4m nay" }), _jsx("p", { className: "text-xl mb-8 text-blue-50", children: "Tr\u1EA3i nghi\u1EC7m d\u1ECBch v\u1EE5 t\u01B0 v\u1EA5n ph\u00E1p lu\u1EADt AI mi\u1EC5n ph\u00ED" }), _jsx("button", { className: "px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium", children: t('hero.ctaPrimary') })] }) })] }));
}
