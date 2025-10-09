"use client";

import * as React from "react";
import { Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FeaturedLists } from "./FeaturedLists";
import { CuratedLists } from "./CuratedLists";
import { getListSummaries } from "@/data/mock/list-articles";
import { useRouter } from "next/navigation";

const featuredSummaries = getListSummaries("featured");
const curatedSummaries = getListSummaries("curated");

const featuredListsData = featuredSummaries.map((article) => ({
  id: article.slug,
  slug: article.slug,
  title: article.title,
  subtitle: article.summary.subtitle ?? undefined,
  imageUrl: article.summary.imageUrl,
  progress: article.summary.visited ?? 0,
  total: article.summary.total ?? article.summary.count ?? article.entries.length,
}));

const curatedListsData = curatedSummaries.map((article) => ({
  id: article.slug,
  slug: article.slug,
  title: article.title,
  shortTitle: article.summary.shortTitle ?? article.title,
  description: article.summary.description ?? article.intro,
  imageUrl: article.summary.imageUrl,
  category: article.summary.categoryLabel ?? "Curated Picks",
  count: article.summary.count ?? article.summary.total ?? article.entries.length,
}));

export function FindHome() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [greeting, setGreeting] = React.useState("");
  const router = useRouter();

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
        onListClick={(list) => router.push(`/diners/lists/${list.slug}`)}
      />

      {/* Curated Lists Section */}
      <CuratedLists
        lists={curatedListsData}
        location="New York, NY"
        onListClick={(list) => router.push(`/diners/lists/${list.slug}`)}
      />
    </div>
  );
}
