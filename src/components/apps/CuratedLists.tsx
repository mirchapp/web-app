"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronRight, MapPin } from "lucide-react";

interface CuratedList {
  id: string;
  slug: string;
  title: string;
  shortTitle?: string;
  description?: string;
  imageUrl: string;
  category?: string;
  count?: number;
}

interface CuratedListsProps {
  lists: CuratedList[];
  location?: string;
  onListClick?: (list: CuratedList) => void;
}

export function CuratedLists({
  lists,
  location = "New York, NY",
  onListClick,
}: CuratedListsProps) {
  // Detect if user prefers dark mode
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return (
    <div
      className="opacity-0"
      style={{
        animation: 'fadeIn 0.6s ease-out forwards',
        animationDelay: '0.3s'
      }}
    >
      <div className="px-5 sm:px-6 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-light text-gray-900 dark:text-white tracking-tight">{location}</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-white/50 font-light">
          Curated lists for your area
        </p>
      </div>

      {/* List items */}
      <div className="space-y-3 px-5 sm:px-6">
        {lists.map((list, index) => (
          <div
            key={list.id}
            onClick={() => onListClick?.(list)}
            className="group opacity-0"
            style={{
              display: "grid",
              gridTemplateColumns: "112px 1fr auto",
              gap: "16px",
              alignItems: "center",
              height: "112px",
              backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "#ffffff",
              borderRadius: "16px",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgb(229,229,229)"}`,
              overflow: "hidden",
              cursor: "pointer",
              padding: "0",
              transition: "all 0.3s ease",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.1)",
              animation: 'fadeIn 0.5s ease-out forwards',
              animationDelay: `${0.35 + index * 0.1}s`
            }}
          >
            {/* Image */}
            <div
              style={{
                position: "relative",
                width: "112px",
                height: "112px",
                flexShrink: 0,
                overflow: "hidden",
                borderRadius: "16px 0 0 16px",
              }}
            >
              <Image
                src={list.imageUrl}
                alt={list.title}
                fill
                sizes="112px"
                style={{ objectFit: "cover", transition: "transform 0.5s ease" }}
                className="group-hover:scale-105"
              />
            </div>

            {/* Content */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: "4px",
                paddingRight: "8px",
                minWidth: 0,
              }}
            >
              <div
                style={{
                  fontWeight: 500,
                  fontSize: "16px",
                  lineHeight: "1.4",
                  color: isDark ? "#ffffff" : "#000000",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  wordBreak: "break-word",
                }}
              >
                {list.shortTitle || list.title}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                  color: isDark ? "rgba(255,255,255,0.5)" : "rgb(107,114,128)",
                  fontWeight: 300,
                }}
              >
                {list.category && (
                  <span style={{ fontWeight: 500 }}>{list.category}</span>
                )}
                {typeof list.count === "number" && (
                  <span>{list.count} places</span>
                )}
              </div>
              <div
                style={{
                  fontSize: "14px",
                  lineHeight: "1.4",
                  color: isDark ? "rgba(255,255,255,0.5)" : "rgb(107,114,128)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  wordBreak: "break-word",
                  fontWeight: 300,
                }}
              >
                {list.description ??
                  `Member-loved picks for ${list.category ?? "food lovers"}`}
              </div>
            </div>

            {/* Arrow */}
            <div
              style={{
                paddingRight: "12px",
                flexShrink: 0,
              }}
            >
              <ChevronRight
                style={{
                  width: "20px",
                  height: "20px",
                  color: isDark ? "rgba(255,255,255,0.4)" : "rgb(156,163,175)",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
