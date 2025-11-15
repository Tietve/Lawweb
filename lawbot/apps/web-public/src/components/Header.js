'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Menu, X, Globe } from 'lucide-react';
export default function Header() {
    const t = useTranslations();
    const locale = useLocale();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigation = [
        { name: t('nav.home'), href: `/${locale}` },
        { name: t('nav.categories'), href: `/${locale}/categories` },
        { name: t('nav.search'), href: `/${locale}/search` },
        { name: t('nav.news'), href: `/${locale}/news` },
        { name: t('nav.contact'), href: `/${locale}/contact` },
    ];
    const toggleLanguage = () => {
        const newLocale = locale === 'vi' ? 'en' : 'vi';
        window.location.href = window.location.pathname.replace(`/${locale}`, `/${newLocale}`);
    };
    return (_jsx("header", { className: "bg-white shadow-sm sticky top-0 z-50", children: _jsxs("nav", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "flex justify-between items-center h-16", children: [_jsx("div", { className: "flex items-center", children: _jsx(Link, { href: `/${locale}`, className: "text-2xl font-bold text-blue-600", children: t('common.appName') }) }), _jsxs("div", { className: "hidden md:flex items-center space-x-8", children: [navigation.map((item) => (_jsx(Link, { href: item.href, className: "text-gray-700 hover:text-blue-600 transition-colors", children: item.name }, item.name))), _jsxs("button", { onClick: toggleLanguage, className: "flex items-center gap-1 text-gray-700 hover:text-blue-600 transition-colors", children: [_jsx(Globe, { className: "w-5 h-5" }), _jsx("span", { className: "text-sm font-medium", children: locale === 'vi' ? 'EN' : 'VI' })] })] }), _jsx("button", { className: "md:hidden p-2", onClick: () => setMobileMenuOpen(!mobileMenuOpen), children: mobileMenuOpen ? (_jsx(X, { className: "w-6 h-6" })) : (_jsx(Menu, { className: "w-6 h-6" })) })] }), mobileMenuOpen && (_jsxs("div", { className: "md:hidden py-4 space-y-3", children: [navigation.map((item) => (_jsx(Link, { href: item.href, className: "block py-2 text-gray-700 hover:text-blue-600 transition-colors", onClick: () => setMobileMenuOpen(false), children: item.name }, item.name))), _jsxs("button", { onClick: () => {
                                toggleLanguage();
                                setMobileMenuOpen(false);
                            }, className: "flex items-center gap-2 py-2 text-gray-700 hover:text-blue-600 transition-colors", children: [_jsx(Globe, { className: "w-5 h-5" }), _jsx("span", { children: locale === 'vi' ? 'English' : 'Tiếng Việt' })] })] }))] }) }));
}
