"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeaturedList {
  id: number;
  title: string;
  subtitle: string;
  imageUrl: string;
  progress: number;
  total: number;
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
    <div className="mb-2">
      <div className="px-4 mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          Featured Lists
        </h2>
        {onSeeAll && (
          <Button
            variant="ghost"
            size="sm"
            className="text-primary -mr-2"
            onClick={onSeeAll}
          >
            See all
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>

      {/* Horizontal scrolling featured cards */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 px-4 pb-2">
          {lists.map((list) => (
            <div
              key={list.id}
              className="flex-none w-[300px] sm:w-[340px] overflow-hidden rounded-xl border border-border/50 hover:shadow-lg transition-all duration-200 cursor-pointer group h-48"
              onClick={() => onListClick?.(list)}
            >
              <div className="relative w-full h-full">
                <Image
                  src={list.imageUrl}
                  alt={list.title}
                  fill
                  sizes="(max-width: 640px) 300px, 340px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
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
                    className="font-bold text-xl mb-1.5 leading-tight text-white"
                    style={{
                      textShadow:
                        "0 2px 8px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.9)",
                      WebkitTextStroke: "0.5px rgba(0,0,0,0.1)",
                    }}
                  >
                    {list.title}
                  </h3>
                  <p
                    className="text-sm font-semibold text-white/95"
                    style={{
                      textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                      WebkitTextStroke: "0.3px rgba(0,0,0,0.1)",
                    }}
                  >
                    {list.subtitle}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
