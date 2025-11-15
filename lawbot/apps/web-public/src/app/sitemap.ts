import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://lawbot.vn';
  const locales = ['vi', 'en'];
  const routes = ['', 'categories', 'search', 'news', 'contact', 'about'];

  const urls: MetadataRoute.Sitemap = [];

  locales.forEach((locale) => {
    routes.forEach((route) => {
      urls.push({
        url: `${baseUrl}/${locale}${route ? `/${route}` : ''}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: route === '' ? 1.0 : 0.8,
      });
    });
  });

  return urls;
}
