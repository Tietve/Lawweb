import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LawBot - Tư Vấn Pháp Luật AI',
  description: 'Giải đáp thắc mắc pháp lý 24/7 với AI được đào tạo từ luật Việt Nam',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
