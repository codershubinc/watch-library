import type { Metadata } from 'next';
import '@/index.css';

export const metadata: Metadata = {
  title: 'Watch Library - Personal Movies & Series Catalog',
  description: 'Personal Movies & Series Watch Library with episode progress tracking and admin management.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen font-sans selection:bg-amber-500 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
