'use client';

import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  change?: number;
  icon: ReactNode;
}

export default function StatCard({ title, value, change, icon }: StatCardProps) {
  const isPositive = change && change > 0;
  const displayValue = typeof value === 'number' ? formatNumber(value) : value;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-primary-50 rounded-lg">
          {icon}
        </div>
        {change !== undefined && (
          <div className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="text-sm font-medium ml-1">{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <h3 className="text-gray-600 text-sm mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{displayValue}</p>
    </div>
  );
}
