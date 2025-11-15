'use client';

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="px-4 py-16 md:py-24 max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            {t('hero.title')}
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            {t('hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              {t('hero.ctaPrimary')}
            </button>
            <button className="px-8 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium">
              {t('hero.ctaSecondary')}
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
            {t('features.title')}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow bg-white"
              >
                <div
                  className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}
                >
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-12 text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Bắt đầu tư vấn pháp luật ngay hôm nay
          </h2>
          <p className="text-xl mb-8 text-blue-50">
            Trải nghiệm dịch vụ tư vấn pháp luật AI miễn phí
          </p>
          <button className="px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium">
            {t('hero.ctaPrimary')}
          </button>
        </div>
      </section>
    </div>
  );
}
