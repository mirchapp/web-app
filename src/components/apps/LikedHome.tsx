'use client';

import * as React from 'react';
import { Heart } from 'lucide-react';

export function LikedHome() {
  return (
    <div className="h-full overflow-y-auto pb-24">
      {/* Header */}
      <div className="px-4 pt-28 pb-6">
        <h1 className="text-3xl font-semibold text-foreground mb-2">
          Liked
        </h1>
        <p className="text-sm text-muted-foreground">
          Your saved restaurants and dishes
        </p>
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center px-4 py-20">
        <div className="relative mb-6">
          <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
            <Heart className="h-12 w-12 text-primary" />
          </div>
        </div>
        
        <h3 className="text-xl font-semibold text-foreground mb-2">
          No favorites yet
        </h3>
        <p className="text-center text-sm text-muted-foreground max-w-xs">
          Start exploring and tap the heart icon to save your favorite restaurants and dishes
        </p>
      </div>
    </div>
  );
}

