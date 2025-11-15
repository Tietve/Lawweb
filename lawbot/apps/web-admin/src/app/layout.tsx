import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LawBot Admin Dashboard',
  description: 'Admin dashboard for LawBot management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
