'use client';

import * as React from 'react';

export function PostScreen() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 py-6">
        <div className="h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="h-12 w-12 rounded-xl bg-muted mx-auto mb-3" />
            <h1 className="text-xl font-semibold">Post</h1>
            <p className="text-sm text-muted-foreground mt-1">Coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
}


