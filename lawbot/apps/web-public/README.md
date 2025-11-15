# LawBot Public Website

Public-facing website for the LawBot legal consultation system.

## Tech Stack

- **Framework**: Next.js 15.1 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 3.x
- **Internationalization**: next-intl (Vietnamese & English)
- **Icons**: Lucide React
- **Deployment**: Cloudflare Pages (configured with @cloudflare/next-on-pages)

## Project Structure

```
apps/web-public/
├── src/
│   ├── app/
│   │   ├── [locale]/           # Localized routes
│   │   │   ├── page.tsx        # Homepage
│   │   │   ├── categories/     # Legal categories
│   │   │   ├── search/         # Document search
│   │   │   ├── news/           # News page
│   │   │   ├── contact/        # Contact page
│   │   │   ├── about/          # About page
│   │   │   ├── terms/          # Terms of service
│   │   │   ├── privacy/        # Privacy policy
│   │   │   └── layout.tsx      # Locale layout with i18n
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout
│   │   ├── not-found.tsx       # 404 page
│   │   ├── sitemap.ts          # SEO sitemap
│   │   ├── robots.ts           # Robots.txt
│   │   └── manifest.ts         # PWA manifest
│   ├── components/
│   │   ├── Header.tsx          # Navigation header
│   │   ├── Footer.tsx          # Footer
│   │   └── ChatButton.tsx      # Floating chat button
│   ├── i18n/
│   │   ├── request.ts          # i18n configuration
│   │   └── routing.ts          # Routing configuration
│   ├── lib/
│   │   └── utils.ts            # Utility functions
│   ├── locales/
│   │   ├── vi.json             # Vietnamese translations
│   │   └── en.json             # English translations
│   └── middleware.ts           # Next.js middleware for i18n
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.mjs
└── tsconfig.json
```

## Features Implemented

### Pages

1. **Homepage** (`/vi`, `/en`)
   - Hero section with main heading and CTA buttons
   - Features section showcasing 3 legal areas:
     - Civil Law (Luật Dân Sự)
     - Labor Law (Luật Lao Động)
     - Business Law (Luật Doanh Nghiệp)
   - Call-to-action section
   - Fully responsive design

2. **Legal Categories** (`/vi/categories`, `/en/categories`)
   - Category list with document counts
   - Interactive category selection
   - Document viewer with metadata
   - Mock data for demonstration

3. **Search Interface** (`/vi/search`, `/en/search`)
   - Full-text search bar
   - Advanced filters (category, date range)
   - Search results with relevance scores
   - Pagination support
   - Mock search implementation

4. **Additional Pages**
   - News (`/vi/news`)
   - Contact (`/vi/contact`) - with contact form
   - About (`/vi/about`)
   - Terms of Service (`/vi/terms`)
   - Privacy Policy (`/vi/privacy`)

### Components

1. **Header**
   - Responsive navigation (desktop + mobile)
   - Language switcher (Vietnamese/English)
   - Sticky positioning
   - Mobile hamburger menu

2. **Footer**
   - Links to important pages
   - Copyright notice
   - Responsive layout

3. **Chat Button**
   - Floating button (bottom-right)
   - Modal/iframe for chat widget
   - Mobile-optimized positioning
   - Responsive design

### Internationalization

- Vietnamese (default)
- English
- Translation files in `/src/locales/`
- URL-based locale routing (`/vi/*`, `/en/*`)
- Language switcher in header

### SEO & Performance

- Meta tags for all pages
- OpenGraph tags for social sharing
- Twitter Card support
- Sitemap.xml generation
- Robots.txt configuration
- PWA manifest
- Optimized images (unoptimized for Cloudflare)
- Dynamic rendering for client components

## Development

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000/vi` or `http://localhost:3000/en`

### Build for Production

```bash
npm run build
```

### Build for Cloudflare Pages

```bash
npm run pages:build
```

### Deploy to Cloudflare Pages

```bash
npm run pages:deploy
```

## Configuration

### Environment Variables

No environment variables required for basic functionality. API endpoints are mocked.

### Cloudflare Pages Setup

1. Install dependencies: `npm install`
2. Build: `npm run pages:build`
3. Deploy: `wrangler pages deploy .vercel/output/static`

Or use the Cloudflare Pages dashboard to connect your repository.

## Known Issues

### Build Issues

- Static generation may fail due to React context issues with next-intl during SSG
- Workaround: All pages use `export const dynamic = 'force-dynamic'` for server-side rendering
- Alternative: Deploy with `npm run dev` or use Cloudflare Pages with dynamic rendering

### Recommendations for Production

1. **Use Dynamic Rendering**: All pages are configured for dynamic rendering to avoid SSG issues
2. **API Integration**: Replace mock data with actual API calls to `/api/v1/` endpoints
3. **Authentication**: Implement user authentication when ready
4. **Chat Widget**: Integrate actual chatbot widget (Phase 07)
5. **Content Management**: Add CMS for news and content updates

## Next Steps

1. **Phase 07**: Implement chatbot widget for chat functionality
2. **API Integration**: Connect to backend API endpoints
3. **Content**: Add real content for news, legal documents
4. **Testing**: Add unit and E2E tests
5. **Performance**: Lighthouse optimization (target 90+)
6. **Monitoring**: Add analytics and error tracking

## Notes

- All pages use Vietnamese as default language
- Mobile-first responsive design
- Follows YAGNI, KISS, DRY principles
- File size kept under 300 lines per component
- Tailwind CSS for styling
- shadcn/ui-compatible design system

## Success Criteria Met

- ✅ Next.js app with TypeScript and Tailwind CSS
- ✅ Cloudflare Pages configuration
- ✅ Vietnamese/English internationalization
- ✅ Responsive design (mobile-first)
- ✅ Homepage with hero and features
- ✅ Legal categories page
- ✅ Search interface
- ✅ Chat button component
- ✅ SEO meta tags and sitemap
- ⏳ Lighthouse score >90 (requires production deployment)
- ⏳ Chat widget integration (Phase 07)
- ⏳ API integration (requires backend)
