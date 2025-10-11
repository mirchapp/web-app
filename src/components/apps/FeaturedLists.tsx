"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeaturedList {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  progress?: number;
  total?: number;
}

interface FeaturedListsProps {
  lists: FeaturedList[];
  onSeeAll?: () => void;
  onListClick?: (list: FeaturedList) => void;
}

export function FeaturedLists({
  lists,
  onSeeAll,
  onListClick,
}: FeaturedListsProps) {
  return (
    <div
      className="mb-6 opacity-0"
      style={{
        animation: 'fadeIn 0.6s ease-out forwards',
        animationDelay: '0.1s'
      }}
    >
      <div className="px-5 sm:px-6 mb-4 flex items-center justify-between">
        <h2 className="text-xl font-light text-gray-900 dark:text-white tracking-tight">
          Featured Lists
        </h2>
        {onSeeAll && (
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary/90 -mr-2 font-medium"
            onClick={onSeeAll}
          >
            See all
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>

      {/* Horizontal scrolling featured cards */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 px-5 sm:px-6 pb-2">
          {lists.map((list, index) => (
            <div
              key={list.id}
              className="flex-none w-[300px] sm:w-[340px] overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 hover:shadow-[0_8px_30px_rgba(138,66,214,0.15)] dark:hover:shadow-[0_8px_30px_rgba(138,66,214,0.25)] transition-all duration-300 cursor-pointer group h-48 opacity-0"
              style={{
                boxShadow: "0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.1)",
                animation: 'fadeIn 0.5s ease-out forwards',
                animationDelay: `${0.15 + index * 0.1}s`
              }}
              onClick={() => onListClick?.(list)}
            >
              <div className="relative w-full h-full">
                <Image
                  src={list.imageUrl}
                  alt={list.title}
                  fill
                  sizes="(max-width: 640px) 300px, 340px"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  style={{ position: "absolute" }}
                />

                {/* Gradient overlay */}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"
                  style={{ position: "absolute", zIndex: 1 }}
                />

                {/* Text overlay */}
                <div
                  className="absolute bottom-0 left-0 right-0 p-5"
                  style={{ position: "absolute", zIndex: 2 }}
                >
                  <h3
                    className="font-light text-xl mb-1.5 leading-tight text-white tracking-tight"
                    style={{
                      textShadow: "0 2px 8px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.9)",
                    }}
                  >
                    {list.title}
                  </h3>
                  {list.subtitle && (
                    <p
                      className="text-sm font-light text-white/95"
                      style={{
                        textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                      }}
                    >
                      {list.subtitle}
                    </p>
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
