'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Menu, X, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    window.location.href = window.location.pathname.replace(
      `/${locale}`,
      `/${newLocale}`
    );
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link
              href={`/${locale}`}
              className="text-2xl font-bold text-blue-600"
            >
              {t('common.appName')}
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                {item.name}
              </Link>
            ))}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition-colors"
            >
              <Globe className="w-5 h-5" />
              <span className="text-sm font-medium">
                {locale === 'vi' ? 'EN' : 'VI'}
              </span>
            </button>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block py-2 text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <button
              onClick={() => {
                toggleLanguage();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 py-2 text-gray-700 hover:text-blue-600 transition-colors"
            >
              <Globe className="w-5 h-5" />
              <span>{locale === 'vi' ? 'English' : 'Tiếng Việt'}</span>
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}
