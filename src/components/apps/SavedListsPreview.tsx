"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SavedListItem {
  id: string;
  title: string;
  slug?: string;
  imageUrl?: string;
  count?: number;
}

interface SavedListsPreviewProps {
  onSeeAll?: () => void;
  onListClick?: (list: SavedListItem) => void;
}

export function SavedListsPreview({ onSeeAll, onListClick }: SavedListsPreviewProps) {









  const sampleLists: SavedListItem[] = [
    { id: 'sample-1', title: 'Neighborhood Favorites', slug: 'neighborhood-favorites', imageUrl: '/splash_screens/sample1.jpg', count: 12 },
    { id: 'sample-2', title: 'Late Night Bites', slug: 'late-night-bites', imageUrl: '/splash_screens/sample2.jpg', count: 8 },
    { id: 'sample-3', title: 'Best Brunch Spots', slug: 'best-brunch-spots', imageUrl: '/splash_screens/sample3.jpg', count: 10 },
  ];

  // Always show sample lists for demo
  const displayLists = sampleLists;

  return (
    <div className="mb-6 opacity-0" style={{ animation: 'fadeIn 0.6s ease-out forwards', animationDelay: '0.08s' }}>
      <div className="px-5 sm:px-6 mb-4 flex items-center justify-between">
  <h2 className="text-xl font-light text-gray-900 dark:text-white tracking-tight">Your Saved Lists</h2>
        {onSeeAll && (
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/90 -mr-2 font-medium" onClick={onSeeAll}>
            See all
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>

      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 px-5 sm:px-6 pb-2">
          {displayLists.map((list) => (
            <div
              key={list.id}
              onClick={() => onListClick?.(list)}
              className="flex-none w-[260px] sm:w-[300px] overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 hover:shadow-[0_8px_30px_rgba(138,66,214,0.12)] dark:hover:shadow-[0_8px_30px_rgba(138,66,214,0.2)] transition-all duration-300 cursor-pointer group h-40"
            >
              <div className="relative w-full h-full bg-gray-100 dark:bg-white/5 rounded-2xl overflow-hidden">
                {list.imageUrl ? (
                  <Image src={list.imageUrl} alt={list.title} fill sizes="(max-width: 640px) 260px, 300px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-white/[0.02]">
                    <svg className="h-10 w-10 text-gray-300 dark:text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 7v14h18V7H3zm0-4h18v2H3V3z" />
                    </svg>
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                  <h3 className="text-md font-light text-white truncate">{list.title}</h3>
                  {typeof list.count === 'number' && (
                    <p className="text-xs text-white/90 mt-1">{list.count} items</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
