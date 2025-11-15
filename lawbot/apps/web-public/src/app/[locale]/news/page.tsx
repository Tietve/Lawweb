'use client';

import { Newspaper } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function NewsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center py-20">
        <Newspaper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Tin Tức Pháp Luật
        </h1>
        <p className="text-gray-600">Trang này đang được xây dựng</p>
      </div>
    </div>
  );
}
