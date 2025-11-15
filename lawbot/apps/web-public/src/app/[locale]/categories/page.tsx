'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { FileText, ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Category {
  id: string;
  name: string;
  description: string;
  documentCount: number;
}

interface Document {
  id: string;
  title: string;
  code: string;
  date: string;
}

export default function CategoriesPage() {
  const t = useTranslations('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const mockCategories: Category[] = [
        {
          id: '1',
          name: 'Luật Dân Sự',
          description: 'Các quy định về dân sự, hợp đồng, thừa kế',
          documentCount: 45,
        },
        {
          id: '2',
          name: 'Luật Lao Động',
          description: 'Quyền và nghĩa vụ của người lao động',
          documentCount: 32,
        },
        {
          id: '3',
          name: 'Luật Doanh Nghiệp',
          description: 'Thành lập, hoạt động và giải thể doanh nghiệp',
          documentCount: 28,
        },
        {
          id: '4',
          name: 'Luật Hình Sự',
          description: 'Các tội phạm và hình phạt',
          documentCount: 56,
        },
        {
          id: '5',
          name: 'Luật Đất Đai',
          description: 'Quyền sử dụng đất và quản lý đất đai',
          documentCount: 38,
        },
      ];
      setCategories(mockCategories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
    const mockDocs: Document[] = [
      {
        id: '1',
        title: `${category.name} 2015`,
        code: '91/2015/QH13',
        date: '2015-11-24',
      },
      {
        id: '2',
        title: `Nghị định hướng dẫn thi hành ${category.name}`,
        code: '45/2020/NĐ-CP',
        date: '2020-04-08',
      },
      {
        id: '3',
        title: `Thông tư số 01 về ${category.name}`,
        code: '01/2021/TT-BTP',
        date: '2021-01-15',
      },
    ];
    setDocuments(mockDocs);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-gray-900">
        {t('title')}
      </h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Category List */}
        <div className="space-y-4">
          {categories.map((category) => (
            <div
              key={category.id}
              onClick={() => handleCategoryClick(category)}
              className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                selectedCategory?.id === category.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">
                    {category.name}
                  </h3>
                  <p className="text-gray-600 mb-2">{category.description}</p>
                  <p className="text-sm text-gray-500">
                    {category.documentCount} văn bản
                  </p>
                </div>
                <ChevronRight
                  className={`w-6 h-6 transition-colors ${
                    selectedCategory?.id === category.id
                      ? 'text-blue-600'
                      : 'text-gray-400'
                  }`}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Category Details */}
        <div className="sticky top-24 h-fit">
          {selectedCategory ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">
                {selectedCategory.name}
              </h2>
              <p className="text-gray-600 mb-6">
                {selectedCategory.description}
              </p>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">
                  {t('documents')}:
                </h3>
                {documents.map((doc) => (
                  <a
                    key={doc.id}
                    href="#"
                    className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                  >
                    <FileText className="w-5 h-5 text-gray-400 group-hover:text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900 group-hover:text-blue-600 mb-1">
                        {doc.title}
                      </h4>
                      <div className="text-sm text-gray-500">
                        <span>{doc.code}</span>
                        <span className="mx-2">•</span>
                        <span>{doc.date}</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                Chọn một danh mục để xem chi tiết văn bản
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
