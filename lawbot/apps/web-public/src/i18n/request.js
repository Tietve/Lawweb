import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
const locales = ['vi', 'en'];
export default getRequestConfig(async ({ locale }) => {
    if (!locales.includes(locale))
        notFound();
    return {
        messages: (await import(`../locales/${locale}.json`)).default,
    };
});
