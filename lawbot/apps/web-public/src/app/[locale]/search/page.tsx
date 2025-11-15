'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, FileText, Filter, X } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface SearchResult {
  id: string;
  title: string;
  code: string;
  category: string;
  date: string;
  excerpt: string;
  relevance: number;
}

export default function SearchPage() {
  const t = useTranslations('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    dateFrom: '',
    dateTo: '',
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const mockResults: SearchResult[] = [
        {
          id: '1',
          title: 'Bộ luật Dân sự 2015',
          code: '91/2015/QH13',
          category: 'Luật Dân Sự',
          date: '2015-11-24',
          excerpt:
            'Bộ luật này quy định về thể nhân, pháp nhân, quyền sở hữu và các quyền khác...',
          relevance: 95,
        },
        {
          id: '2',
          title: 'Nghị định 45/2020/NĐ-CP',
          code: '45/2020/NĐ-CP',
          category: 'Luật Dân Sự',
          date: '2020-04-08',
          excerpt:
            'Nghị định này quy định chi tiết một số điều của Bộ luật Dân sự...',
          relevance: 87,
        },
        {
          id: '3',
          title: 'Luật Hợp đồng 2023',
          code: '23/2023/QH15',
          category: 'Luật Dân Sự',
          date: '2023-06-15',
          excerpt:
            'Luật này quy định về giao kết hợp đồng, thực hiện hợp đồng...',
          relevance: 82,
        },
      ];

      setResults(mockResults);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      dateFrom: '',
      dateTo: '',
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-gray-900">
        Tìm Kiếm Văn Bản Pháp Luật
      </h1>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('placeholder')}
            className="w-full px-4 py-3 pr-32 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute right-2 top-2 flex gap-2">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              aria-label="Toggle filters"
            >
              <Filter className="w-5 h-5" />
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
              <span className="hidden sm:inline">{t('button')}</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Bộ lọc</h3>
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Xóa bộ lọc
              </button>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Danh mục
                </label>
                <select
                  value={filters.category}
                  onChange={(e) =>
                    setFilters({ ...filters, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tất cả</option>
                  <option value="dan-su">Luật Dân Sự</option>
                  <option value="lao-dong">Luật Lao Động</option>
                  <option value="doanh-nghiep">Luật Doanh Nghiệp</option>
                  <option value="hinh-su">Luật Hình Sự</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Từ ngày
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) =>
                    setFilters({ ...filters, dateFrom: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Đến ngày
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) =>
                    setFilters({ ...filters, dateTo: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('loading')}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {t('results')} ({results.length})
            </h2>
          </div>
          <div className="space-y-4">
            {results.map((result) => (
              <a
                key={result.id}
                href="#"
                className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-4">
                  <FileText className="w-6 h-6 text-gray-400 group-hover:text-blue-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 mb-2">
                      {result.title}
                    </h3>
                    <p className="text-gray-600 mb-3">{result.excerpt}</p>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
                        {result.code}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                        {result.category}
                      </span>
                      <span className="text-gray-500">{result.date}</span>
                      <span className="ml-auto text-blue-600 font-medium">
                        {result.relevance}% phù hợp
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {!loading && results.length === 0 && query && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {t('noResults')}
          </h3>
          <p className="text-gray-600">
            Thử sử dụng từ khóa khác hoặc điều chỉnh bộ lọc
          </p>
        </div>
      )}

      {/* Empty State */}
      {!loading && results.length === 0 && !query && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Bắt đầu tìm kiếm
          </h3>
          <p className="text-gray-600">
            Nhập từ khóa để tìm kiếm văn bản pháp luật
          </p>
        </div>
      )}
    </div>
  );
}
