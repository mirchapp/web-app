"use client";

import * as React from "react";
import { Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FeaturedLists } from "./FeaturedLists";
import { CuratedLists } from "./CuratedLists";

// Mock data for curated lists
const curatedListsData = [
  {
    id: 1,
    title: "The top 15 NYC Vietnamese restaurants, as ranked by  members",
    shortTitle: "Top 15 NYC Vietnamese",
    description: "The top 15 NYC Vietnamese restaurants",
    imageUrl:
      "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&h=400&fit=crop&auto=format",
    category: "Vietnamese",
    count: 15,
  },
  {
    id: 2,
    title: "Top 10 NYC Filipino",
    description: "The top 10 NYC Filipino restaurants, as ranked by  members",
    imageUrl:
      "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=400&fit=crop&auto=format",
    category: "Filipino",
    count: 10,
  },
  {
    id: 3,
    title: "Top 15 NYC Sushi",
    description: "The top 15 sushi restaurants in NYC, as ranked by  members",
    imageUrl:
      "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=400&fit=crop&auto=format",
    category: "Sushi",
    count: 15,
  },
  {
    id: 4,
    title: "Top 10 NYC Spanish",
    description: "The top 10 Spanish restaurants in NYC, as ranked by  members",
    imageUrl:
      "https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=400&h=400&fit=crop&auto=format",
    category: "Spanish",
    count: 10,
  },
];

// Mock data for featured lists (larger cards)
const featuredListsData = [
  {
    id: 1,
    title: "North America's 50 Best Restaurants",
    subtitle: "You've been to 0 of 50",
    imageUrl:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop&auto=format",
    progress: 0,
    total: 50,
  },
  {
    id: 2,
    title: "Top 20 Toronto Cocktail Bars",
    subtitle: "You've been to 0 of 20",
    imageUrl:
      "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&h=600&fit=crop&auto=format",
    progress: 0,
    total: 20,
  },
];

export function FindHome() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [greeting, setGreeting] = React.useState("");

  React.useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("Good morning");
    } else if (hour < 18) {
      setGreeting("Good afternoon");
    } else {
      setGreeting("Good evening");
    }
  }, []);

  return (
    <div className="h-full overflow-y-auto pb-24">
      {/* Header Section */}
      <div
        className="px-4 pb-6"
        style={{ paddingTop: "var(--header-top-padding-safe)" }}
      >
        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-foreground mb-1">
            {greeting}, Faizaan
          </h1>
          <p className="text-sm text-muted-foreground">
            What are you craving today?
          </p>
        </div>

        {/* AI Search Bar */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <Input
            type="text"
            placeholder="Ask AI for restaurant suggestions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "h-14 pl-12 pr-12 rounded-2xl",
              "bg-muted/50 border-border/50",
              "text-base placeholder:text-muted-foreground",
              "focus-visible:ring-2 focus-visible:ring-primary/20",
              "transition-all duration-200"
            )}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        {/* AI Hint */}
        <p className="mt-3 text-xs text-center text-muted-foreground/80">
          Try: &ldquo;Find me the best sushi nearby&rdquo; or &ldquo;Romantic
          dinner spots&rdquo;
        </p>
      </div>

      {/* Featured Lists Section */}
      <FeaturedLists
        lists={featuredListsData}
        onSeeAll={() => console.log("See all featured lists")}
        onListClick={(list) => console.log("Clicked featured list:", list)}
      />

      {/* Curated Lists Section */}
      <CuratedLists
        lists={curatedListsData}
        location="New York, NY"
        onListClick={(list) => console.log("Clicked curated list:", list)}
      />
    </div>
  );
}
