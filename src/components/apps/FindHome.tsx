"use client";

import * as React from "react";
import { Search, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { FeaturedLists } from "./FeaturedLists";
import { CuratedLists } from "./CuratedLists";
import { getListSummaries } from "@/data/mock/list-articles";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Input } from "@/components/ui/input";
import { useProfileSearch } from "@/hooks/useProfileSearch";
import Image from "next/image";

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
  const [greeting, setGreeting] = React.useState("");
  const [userId, setUserId] = React.useState<string>("");
  const router = useRouter();
  const supabase = createClient();

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

  React.useEffect(() => {
    const getUser = async () => {
      console.log("Fetching user...");

      // Try getting session first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log("Session:", { session, sessionError });

      if (session?.user) {
        console.log("Setting userId from session to:", session.user.id);
        setUserId(session.user.id);
        return;
      }

      // Fallback to getUser
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      console.log("User fetched:", { user, error });
      if (user) {
        console.log("Setting userId to:", user.id);
        setUserId(user.id);
      } else {
        console.log("No user found");
      }
    };
    getUser();
  }, [supabase]);

  // Use the profile search hook
  const {
    query,
    setQuery,
    results,
    suggestions,
    loading,
    error,
  } = useProfileSearch({
    viewerId: userId,
    limit: 20,
    debounceMs: 200,
    minQueryLength: 1,
  });

  const displayItems = results.length > 0 ? results : suggestions;
  const showResults = query.length > 0 || suggestions.length > 0;

  // Debug logging
  React.useEffect(() => {
    console.log("FindHome state:", {
      userId,
      query,
      resultsCount: results.length,
      suggestionsCount: suggestions.length,
      loading,
      showResults,
      displayItemsCount: displayItems.length,
    });
  }, [userId, query, results, suggestions, loading, showResults, displayItems]);

  // Handle profile click
  const handleProfileClick = (profileUserId: string) => {
    router.push(`/profile/${profileUserId}`);
  };

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
            Discover people and places
          </p>
        </div>

        {/* Search Input */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
            {loading ? (
              <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
            ) : (
              <Search className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <Input
            type="text"
            placeholder="Search by name or @username"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={cn(
              "h-14 pl-12 pr-4 rounded-2xl",
              "bg-muted/50 border-border/50",
              "text-base placeholder:text-muted-foreground",
              "focus-visible:ring-2 focus-visible:ring-primary/20",
              "transition-all duration-200"
            )}
          />
        </div>
      </div>

      {/* Search Results or Suggestions */}
      {showResults && (
        <div className="px-4 mb-6">
          {/* Section Header */}
          {!query && suggestions.length > 0 && (
            <h3 className="text-sm font-medium text-muted-foreground mb-3 px-4">
              Suggested for you
            </h3>
          )}

          {/* Error State */}
          {error && (
            <div className="px-4 py-3 text-sm text-destructive mb-4">
              {error}
            </div>
          )}

          {/* Profile List */}
          <div className="space-y-1">
            {displayItems.map((profile) => (
              <ProfileItem
                key={profile.user_id}
                profile={profile}
                onClick={() => handleProfileClick(profile.user_id)}
                showReason={!query && "reason" in profile}
                highlightUsername={query.startsWith("@")}
              />
            ))}
          </div>

          {/* Empty State */}
          {!loading && displayItems.length === 0 && query && (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <User className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground text-center">
                No results found
              </p>
              <p className="text-xs text-muted-foreground/70 text-center mt-1">
                Try a different search term
              </p>
            </div>
          )}
        </div>
      )}

      {/* Featured Lists Section - Hide when searching */}
      {!query && (
        <>
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
        </>
      )}
    </div>
  );
}

interface ProfileItemProps {
  profile: {
    user_id: string;
    username?: string;
    display_name?: string;
    avatar_url?: string;
    bio?: string;
    follower_count?: number;
    reason?: string;
  };
  onClick: () => void;
  showReason?: boolean;
  highlightUsername?: boolean;
}

function ProfileItem({
  profile,
  onClick,
  showReason,
  highlightUsername,
}: ProfileItemProps) {
  const displayName = profile.display_name || profile.username || "Unknown";
  const username = profile.username;
  const avatarUrl = profile.avatar_url;
  const reason = profile.reason;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3",
        "hover:bg-muted/50 active:bg-muted",
        "transition-colors duration-150",
        "text-left rounded-xl"
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0 w-12 h-12 rounded-full bg-muted overflow-hidden">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Profile Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <p
            className={cn(
              "text-sm font-medium text-foreground truncate",
              !highlightUsername && "font-semibold"
            )}
          >
            {displayName}
          </p>
          {username && (
            <p
              className={cn(
                "text-sm text-muted-foreground truncate",
                highlightUsername && "font-semibold text-foreground"
              )}
            >
              @{username}
            </p>
          )}
        </div>

        {/* Bio or Reason */}
        {showReason && reason ? (
          <p className="text-xs text-muted-foreground/80 truncate mt-0.5">
            {reason}
          </p>
        ) : profile.bio ? (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {profile.bio}
          </p>
        ) : null}

        {/* Follower Count */}
        {profile.follower_count !== undefined && (
          <p className="text-xs text-muted-foreground/70 mt-0.5">
            {profile.follower_count.toLocaleString()}{" "}
            {profile.follower_count === 1 ? "follower" : "followers"}
          </p>
        )}
      </div>
    </button>
  );
}
