'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';

export default function Footer() {
  const t = useTranslations('footer');
  const locale = useLocale();

  const links = [
    { name: t('about'), href: `/${locale}/about` },
    { name: t('contact'), href: `/${locale}/contact` },
    { name: t('terms'), href: `/${locale}/terms` },
    { name: t('privacy'), href: `/${locale}/privacy` },
  ];

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap justify-center gap-6">
            {links.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
              >
                {link.name}
              </Link>
            ))}
          </div>
          <div className="text-gray-600 text-sm">{t('copyright')}</div>
        </div>
      </div>
    </footer>
  );
}
