"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronRight, MapPin } from "lucide-react";

interface CuratedList {
  id: number;
  title: string;
  shortTitle?: string;
  description: string;
  imageUrl: string;
  category: string;
  count: number;
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
    <div className="">
      <div className="px-4 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">{location}</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Curated lists for your area
        </p>
      </div>

      {/* List items */}
      <div className="space-y-3 px-4">
        {lists.map((list) => (
          <div
            key={list.id}
            onClick={() => onListClick?.(list)}
            style={{
              display: "grid",
              gridTemplateColumns: "112px 1fr auto",
              gap: "16px",
              alignItems: "center",
              height: "112px",
              backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
              borderRadius: "12px",
              border: `1px solid ${isDark ? "#333" : "#e5e5e5"}`,
              overflow: "hidden",
              cursor: "pointer",
              padding: "0",
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
                borderRadius: "12px 0 0 12px",
              }}
            >
              <Image
                src={list.imageUrl}
                alt={list.title}
                fill
                sizes="112px"
                style={{ objectFit: "cover" }}
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
                  fontWeight: 600,
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
                  fontSize: "14px",
                  lineHeight: "1.4",
                  color: isDark ? "#a0a0a0" : "#666666",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  wordBreak: "break-word",
                }}
              >
                {list.description}
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
                  color: isDark ? "#808080" : "#999999",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
