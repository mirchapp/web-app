import { ReactNode } from 'react';
import Link from 'next/link';

interface RestaurantsLayoutProps {
  children: ReactNode;
}

export function RestaurantsLayout({ children }: RestaurantsLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-primary">
              Mirch - For Restaurants
            </h1>
            <div className="flex space-x-4">
              <Link href="/" className="text-sm hover:text-primary transition-colors">
                Dashboard
              </Link>
              <Link href="/menu" className="text-sm hover:text-primary transition-colors">
                Menu
              </Link>
              <Link href="/orders" className="text-sm hover:text-primary transition-colors">
                Orders
              </Link>
              <Link href="/analytics" className="text-sm hover:text-primary transition-colors">
                Analytics
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
