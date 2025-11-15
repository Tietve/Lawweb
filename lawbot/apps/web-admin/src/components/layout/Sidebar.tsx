'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  FileText,
  Settings,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Tổng Quan', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Người Dùng', href: '/users', icon: Users },
  { name: 'Cuộc Trò Chuyện', href: '/conversations', icon: MessageSquare },
  { name: 'Văn Bản', href: '/content', icon: FileText },
  { name: 'Phân Tích', href: '/analytics', icon: BarChart3 },
  { name: 'Cài Đặt', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white border-r border-gray-200">
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-primary-600">LawBot Admin</h1>
      </div>
      <nav className="p-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
