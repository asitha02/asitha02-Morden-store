import type { ReactNode } from 'react';

export const metadata = { title: 'Spare parts API' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'sans-serif', padding: 24 }}>{children}</body>
    </html>
  );
}
