'use client';

export const dynamic = 'force-dynamic';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-gray-900">
        Về LawBot
      </h1>
      <div className="prose prose-lg max-w-none">
        <p className="text-gray-600 mb-4">
          LawBot là hệ thống tư vấn pháp luật thông minh được phát triển bởi AI,
          giúp người dùng tiếp cận thông tin pháp luật một cách dễ dàng và nhanh
          chóng.
        </p>
        <p className="text-gray-600 mb-4">
          Chúng tôi cung cấp dịch vụ tư vấn pháp luật 24/7 với độ chính xác cao,
          dựa trên cơ sở dữ liệu văn bản pháp luật Việt Nam được cập nhật liên
          tục.
        </p>
      </div>
    </div>
  );
}
