# Phase 06: Web 1 - Public Website (Cloudflare Pages)

## Context Links
- [Parent Plan](plan.md)
- [Prev: API Layer](phase-05-api-layer.md)
- [Next: Chatbot Widget](phase-07-chatbot-widget.md)

## Overview
- **Date**: 2025-11-15
- **Description**: Public-facing legal consultation website with modern UI/UX
- **Priority**: P1 - Primary user interface
- **Implementation Status**: 🔴 Not Started
- **Review Status**: 🔴 Not Started

## Key Insights
- Cloudflare Pages for static hosting
- Edge-side rendering capabilities
- React/Next.js recommended
- Mobile-first design essential
- Vietnamese UI/UX patterns

## Requirements

### Functional
- Landing page with service intro
- Legal category browsing
- Document search interface
- User registration/login
- Legal news/updates section
- Contact information

### Non-functional
- <1s page load time
- Mobile responsive
- SEO optimized
- Accessibility (WCAG 2.1)
- Vietnamese & English support

## Architecture

```
apps/web-public/
├── src/
│   ├── pages/         # Page components
│   ├── components/    # Reusable components
│   ├── hooks/         # Custom hooks
│   ├── lib/           # Utilities
│   └── styles/        # Global styles
├── public/            # Static assets
└── locales/           # i18n files
```

## Related Code Files

### Create
- `/apps/web-public/src/pages/index.tsx` - Homepage
- `/apps/web-public/src/pages/search.tsx` - Search page
- `/apps/web-public/src/pages/categories.tsx` - Categories
- `/apps/web-public/src/components/Layout.tsx` - Layout wrapper
- `/apps/web-public/src/components/ChatButton.tsx` - Chat launcher

## Implementation Steps

1. **Setup Next.js with Cloudflare Pages**
```bash
# Initialize Next.js app
npx create-next-app@latest apps/web-public --typescript --tailwind --app

# Configure for Cloudflare Pages
npm install @cloudflare/next-on-pages
```

```javascript
// next.config.js
module.exports = {
  experimental: {
    runtime: 'edge'
  },
  i18n: {
    locales: ['vi', 'en'],
    defaultLocale: 'vi'
  }
};
```

2. **Create Homepage**
```typescript
// apps/web-public/src/pages/index.tsx
export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="px-4 py-16 max-w-7xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold text-center mb-6">
          Tư Vấn Pháp Luật AI
        </h1>
        <p className="text-xl text-center text-gray-600 mb-8">
          Giải đáp thắc mắc pháp lý 24/7 với AI được đào tạo từ luật Việt Nam
        </p>

        <div className="flex justify-center gap-4">
          <button className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Bắt Đầu Chat
          </button>
          <button className="px-8 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50">
            Tìm Hiểu Thêm
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon="⚖️"
            title="Luật Dân Sự"
            description="Tư vấn hợp đồng, tranh chấp, thừa kế"
          />
          <FeatureCard
            icon="💼"
            title="Luật Lao Động"
            description="Quyền lợi người lao động, hợp đồng lao động"
          />
          <FeatureCard
            icon="🏢"
            title="Luật Doanh Nghiệp"
            description="Thành lập công ty, thuế, giấy phép"
          />
        </div>
      </section>

      {/* CTA */}
      <ChatButton />
    </div>
  );
}
```

3. **Legal Categories Page**
```typescript
// apps/web-public/src/pages/categories.tsx
import { useState, useEffect } from 'react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const res = await fetch('/api/v1/categories');
    const data = await res.json();
    setCategories(data.categories);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Danh Mục Pháp Luật</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Category List */}
        <div className="space-y-4">
          {categories.map(cat => (
            <CategoryCard
              key={cat.id}
              category={cat}
              onClick={() => setSelectedCategory(cat)}
              isSelected={selectedCategory?.id === cat.id}
            />
          ))}
        </div>

        {/* Category Details */}
        {selectedCategory && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">
              {selectedCategory.name}
            </h2>
            <p className="text-gray-600 mb-6">
              {selectedCategory.description}
            </p>

            <div className="space-y-3">
              <h3 className="font-semibold">Văn bản pháp luật:</h3>
              {selectedCategory.documents.map(doc => (
                <DocumentLink key={doc.id} document={doc} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

4. **Search Interface**
```typescript
// apps/web-public/src/pages/search.tsx
export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/v1/search/documents?q=${query}`);
      const data = await res.json();
      setResults(data.results);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm văn bản pháp luật..."
            className="w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="absolute right-2 top-2 p-2 bg-blue-600 text-white rounded-lg"
          >
            <SearchIcon />
          </button>
        </div>
      </form>

      {/* Results */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-4">
          {results.map(result => (
            <SearchResult key={result.id} result={result} />
          ))}
        </div>
      )}
    </div>
  );
}
```

5. **Chat Button Component**
```typescript
// apps/web-public/src/components/ChatButton.tsx
export default function ChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center z-50"
      >
        <ChatIcon />
      </button>

      {/* Chat Widget Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-end p-4">
          <div className="w-full max-w-md h-[600px] bg-white rounded-lg shadow-xl">
            <iframe
              src="/chat-widget"
              className="w-full h-full rounded-lg"
              title="Legal Chat"
            />
          </div>
        </div>
      )}
    </>
  );
}
```

6. **Responsive Layout**
```typescript
// apps/web-public/src/components/Layout.tsx
export default function Layout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Logo />

            {/* Desktop Menu */}
            <div className="hidden md:flex space-x-8">
              <NavLink href="/">Trang Chủ</NavLink>
              <NavLink href="/categories">Danh Mục</NavLink>
              <NavLink href="/search">Tìm Kiếm</NavLink>
              <NavLink href="/news">Tin Tức</NavLink>
              <NavLink href="/contact">Liên Hệ</NavLink>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <MenuIcon />
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && <MobileMenu />}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
```

7. **Internationalization**
```typescript
// apps/web-public/src/lib/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  resources: {
    vi: {
      translation: {
        'hero.title': 'Tư Vấn Pháp Luật AI',
        'hero.subtitle': 'Giải đáp thắc mắc pháp lý 24/7'
      }
    },
    en: {
      translation: {
        'hero.title': 'AI Legal Consultation',
        'hero.subtitle': '24/7 Legal Q&A Support'
      }
    }
  },
  lng: 'vi',
  fallbackLng: 'en'
});
```

## Todo List
- [ ] Setup Next.js project
- [ ] Configure Cloudflare Pages
- [ ] Create homepage
- [ ] Build categories page
- [ ] Implement search interface
- [ ] Add chat button
- [ ] Create responsive layout
- [ ] Setup i18n
- [ ] Add SEO meta tags
- [ ] Implement analytics
- [ ] Deploy to Pages

## Success Criteria
- Lighthouse score >90
- Mobile responsive on all devices
- Vietnamese/English switching works
- Chat widget loads properly
- Search returns relevant results

## Risk Assessment
- **Risk**: SSR performance issues
- **Mitigation**: Use edge runtime, optimize bundles
- **Risk**: SEO indexing problems
- **Mitigation**: Proper meta tags, sitemap

## Security Considerations
- CSP headers configuration
- XSS protection
- Rate limiting on API calls
- Secure authentication flow

## Next Steps
- Phase 07: Chatbot Widget (embedded)
- Phase 08: Admin Dashboard (parallel)