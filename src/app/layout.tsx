import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lon Nuvem',
  description: 'Sistema de Drive Minimalista',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="app-container">
          <Sidebar />
          <main className="main-content glass-panel">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
