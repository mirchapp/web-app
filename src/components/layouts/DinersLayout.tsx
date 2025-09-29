import { ReactNode } from 'react';
import Link from 'next/link';

interface DinersLayoutProps {
  children: ReactNode;
}

export function DinersLayout({ children }: DinersLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-primary">
              Mirch - For Diners
            </h1>
            <div className="flex space-x-4">
              <Link href="/" className="text-sm hover:text-primary transition-colors">
                Home
              </Link>
              <Link href="/favorites" className="text-sm hover:text-primary transition-colors">
                Favorites
              </Link>
              <Link href="/profile" className="text-sm hover:text-primary transition-colors">
                Profile
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <main>
        {children}
      </main>
    </div>
  );
}
