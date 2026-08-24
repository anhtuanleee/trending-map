import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Trending Map · Moderation',
  description: 'Community map moderation console',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
