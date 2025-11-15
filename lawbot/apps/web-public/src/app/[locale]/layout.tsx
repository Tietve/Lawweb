import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ChatButton from '@/components/ChatButton';

const locales = ['vi', 'en'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale });

  return {
    title: {
      default: t('common.appName') + ' - ' + t('common.tagline'),
      template: `%s | ${t('common.appName')}`,
    },
    description: t('home.hero.subtitle'),
    keywords: [
      'tư vấn pháp luật',
      'luật việt nam',
      'AI legal',
      'chatbot pháp lý',
      'văn bản pháp luật',
    ],
    authors: [{ name: 'LawBot Team' }],
    openGraph: {
      type: 'website',
      locale: locale === 'vi' ? 'vi_VN' : 'en_US',
      url: 'https://lawbot.vn',
      title: t('common.appName'),
      description: t('home.hero.subtitle'),
      siteName: t('common.appName'),
    },
    twitter: {
      card: 'summary_large_image',
      title: t('common.appName'),
      description: t('home.hero.subtitle'),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <ChatButton />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
