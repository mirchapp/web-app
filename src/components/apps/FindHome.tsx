"use client";

import * as React from "react";
import { Search, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { FeaturedLists } from "./FeaturedLists";
import { CuratedLists } from "./CuratedLists";
import { SuggestedProfiles } from "./SuggestedProfiles";
import { ConnectWithFriends } from "./ConnectWithFriends";
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
  const [userId, setUserId] = React.useState<string>("");
  const [showConnectDrawer, setShowConnectDrawer] = React.useState(false);
  const router = useRouter();
  const supabase = createClient();

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

  const displayItems = results;
  const showResults = query.length > 0;
  const showSuggestions = !query && suggestions.length > 0;

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

  // Memoize star positions so they don't change on re-render
  const starPositions = React.useMemo(() => {
    return Array.from({ length: 20 }, () => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
      duration: 2 + Math.random() * 3,
      delay: Math.random() * 2,
    }));
  }, []);

  // In standalone PWA, bottom nav is still present, so use consistent padding
  const bottomPadding = 'calc(env(safe-area-inset-bottom, 20px) + 88px)';

  return (
    <div
      className="h-full overflow-y-auto bg-white dark:bg-[#0A0A0F] relative"
      style={{
        paddingBottom: bottomPadding,
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Animated purple wave background - matching profile page */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        {/* Purple wave gradient */}
        <div
          className="absolute left-0 right-0 h-[400px] opacity-20 dark:opacity-30"
          style={{
            top: '10%',
            background: 'linear-gradient(90deg, rgba(138, 66, 214, 0.4) 0%, rgba(168, 85, 247, 0.3) 50%, rgba(138, 66, 214, 0.4) 100%)',
            filter: 'blur(80px)',
            transform: 'translateZ(0)',
            animation: 'wave 8s ease-in-out infinite alternate'
          }}
        />

        {/* Subtle stars/particles */}
        <div className="absolute inset-0 opacity-15 dark:opacity-30">
          {starPositions.map((star, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-purple-500/30 dark:bg-white/20 rounded-full"
              style={{
                top: `${star.top}%`,
                left: `${star.left}%`,
                animation: `twinkle ${star.duration}s ease-in-out infinite`,
                animationDelay: `${star.delay}s`,
                willChange: 'opacity',
              }}
            />
          ))}
        </div>
      </div>

      {/* Header Section */}
      <div
        className="px-5 sm:px-6 pb-6 relative z-10"
        style={{ paddingTop: "calc(var(--header-top-padding-safe) - 20px)" }}
      >
        {/* Logo */}
        <div className="mb-4 -mt-2">
          <div className="relative w-40 h-16 mb-1">
            {/* Light mode logo */}
            <Image
              src="/mirch-logo-transparent-dark.png"
              alt="Mirch"
              width={160}
              height={64}
              className="object-contain object-left dark:hidden"
              priority
            />
            {/* Dark mode logo */}
            <Image
              src="/mirch-logo-transparent.png"
              alt="Mirch"
              width={160}
              height={64}
              className="object-contain object-left hidden dark:block"
              priority
            />
          </div>
          <p className="text-sm text-gray-600 dark:text-white/50 font-light">
            Discover people and places
          </p>
        </div>

        {/* Search Input */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
            {loading ? (
              <Loader2 className="h-5 w-5 text-gray-400 dark:text-white/40 animate-spin" />
            ) : (
              <Search className="h-5 w-5 text-gray-400 dark:text-white/40" />
            )}
          </div>
          <Input
            type="text"
            placeholder="Search by name or @username"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={cn(
              "h-14 pl-12 pr-4 rounded-2xl",
              "bg-card dark:bg-white/[0.02] backdrop-blur-xl",
              "border border-gray-200 dark:border-white/10",
              "text-base placeholder:text-gray-400 dark:placeholder:text-white/40",
              "focus-visible:ring-2 focus-visible:ring-primary/20",
              "transition-all duration-200 font-light",
              "shadow-sm"
            )}
            style={{
              boxShadow: "0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.1)"
            }}
          />
        </div>
      </div>

      {/* Search Results */}
      {showResults && (
        <div className="px-5 sm:px-6 mb-6 relative z-10">
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
              <User className="h-12 w-12 text-gray-300 dark:text-white/30 mb-3" />
              <p className="text-sm text-gray-600 dark:text-white/50 text-center font-light">
                No results found
              </p>
              <p className="text-xs text-gray-400 dark:text-white/40 text-center mt-1 font-light">
                Try a different search term
              </p>
            </div>
          )}
        </div>
      )}

      {/* Featured Lists Section - Hide when searching */}
      {!query && (
        <div className="relative z-10">
          <FeaturedLists
            lists={featuredListsData}
            onSeeAll={() => console.log("See all featured lists")}
            onListClick={(list) => router.push(`/diners/lists/${list.slug}`)}
          />

          {/* Suggested Profiles Carousel - Show when not searching */}
          {showSuggestions && (
            <SuggestedProfiles
              profiles={suggestions}
              onProfileClick={handleProfileClick}
              onSeeAll={() => setShowConnectDrawer(true)}
            />
          )}

          {/* Curated Lists Section */}
          <CuratedLists
            lists={curatedListsData}
            location="New York, NY"
            onListClick={(list) => router.push(`/diners/lists/${list.slug}`)}
          />
        </div>
      )}

      {/* Connect with Friends Drawer */}
      <ConnectWithFriends
        isOpen={showConnectDrawer}
        profiles={suggestions}
        onClose={() => setShowConnectDrawer(false)}
        onProfileClick={handleProfileClick}
      />
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
        "hover:bg-gray-50 dark:hover:bg-white/[0.03] active:bg-gray-100 dark:active:bg-white/[0.05]",
        "transition-all duration-200",
        "text-left rounded-xl"
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0 w-12 h-12 rounded-full overflow-hidden ring-1 ring-gray-200 dark:ring-white/10 shadow-sm">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-white/5">
            <User className="h-6 w-6 text-gray-300 dark:text-white/30" />
          </div>
        )}
      </div>

      {/* Profile Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <p
            className={cn(
              "text-sm font-medium text-gray-900 dark:text-white truncate",
              !highlightUsername && "font-semibold"
            )}
          >
            {displayName}
          </p>
          {username && (
            <p
              className={cn(
                "text-sm text-gray-500 dark:text-white/50 truncate font-light",
                highlightUsername && "font-semibold text-gray-900 dark:text-white"
              )}
            >
              @{username}
            </p>
          )}
        </div>

        {/* Bio or Reason */}
        {showReason && reason ? (
          <p className="text-xs text-gray-500 dark:text-white/50 truncate mt-0.5 font-light">
            {reason}
          </p>
        ) : profile.bio ? (
          <p className="text-xs text-gray-500 dark:text-white/50 truncate mt-0.5 font-light">
            {profile.bio}
          </p>
        ) : null}

        {/* Follower Count */}
        {profile.follower_count !== undefined && (
          <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5 font-light">
            {profile.follower_count.toLocaleString()}{" "}
            {profile.follower_count === 1 ? "follower" : "followers"}
          </p>
        )}
      </div>
    </button>
  );
}
