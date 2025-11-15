'use client';

import { Mail, Phone, MapPin } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-gray-900">
        Liên Hệ
      </h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <Mail className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Email</h3>
              <p className="text-gray-600">contact@lawbot.vn</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Phone className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Điện thoại</h3>
              <p className="text-gray-600">+84 123 456 789</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <MapPin className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Địa chỉ</h3>
              <p className="text-gray-600">Hà Nội, Việt Nam</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Gửi tin nhắn</h2>
          <form className="space-y-4">
            <input
              type="text"
              placeholder="Họ tên"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              rows={4}
              placeholder="Nội dung"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Gửi
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
