'use client';

import { Button } from '@/components/ui/button';

export default function Home() {
  // Show choice screen for localhost development
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-4">Mirch</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Choose your experience
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <a href="/diners">
              For Diners
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/restaurants">
              For Restaurants
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
