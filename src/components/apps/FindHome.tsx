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
import { Button } from "@/components/ui/button";
import { useFollow } from "@/hooks/useFollow";

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
  const [followedUsers, setFollowedUsers] = React.useState<Set<string>>(new Set());
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

        // Fetch following status
        const { data: followsData } = await supabase
          .from("Follows")
          .select("following_id")
          .eq("follower_id", session.user.id);

        if (followsData) {
          const followingSet = new Set(followsData.map((f) => f.following_id));
          setFollowedUsers(followingSet);
        }
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

        // Fetch following status
        const { data: followsData } = await supabase
          .from("Follows")
          .select("following_id")
          .eq("follower_id", user.id);

        if (followsData) {
          const followingSet = new Set(followsData.map((f) => f.following_id));
          setFollowedUsers(followingSet);
        }
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

  // Update follow status when search results change
  React.useEffect(() => {
    if (!userId || results.length === 0) return;

    const fetchFollowStatusForResults = async () => {
      const profileIds = results.map((r) => r.user_id);

      const { data: followsData } = await supabase
        .from("Follows")
        .select("following_id")
        .eq("follower_id", userId)
        .in("following_id", profileIds);

      if (followsData) {
        const followingSet = new Set(followsData.map((f) => f.following_id));
        setFollowedUsers((prev) => {
          const newSet = new Set(prev);
          followsData.forEach((f) => newSet.add(f.following_id));
          return newSet;
        });
      }
    };

    fetchFollowStatusForResults();
  }, [results, userId, supabase]);

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
      className="h-full overflow-y-auto bg-background relative"
      style={{
        paddingBottom: bottomPadding,
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Animated purple wave background - matching profile page */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none bg-background" style={{ zIndex: 0 }}>
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
                currentUserId={userId}
                isFollowing={followedUsers.has(profile.user_id)}
                onFollowChange={(isFollowing) => {
                  setFollowedUsers((prev) => {
                    const newSet = new Set(prev);
                    if (isFollowing) {
                      newSet.add(profile.user_id);
                    } else {
                      newSet.delete(profile.user_id);
                    }
                    return newSet;
                  });
                }}
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
              currentUserId={userId}
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
        currentUserId={userId}
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
  currentUserId?: string;
  isFollowing: boolean;
  onFollowChange: (isFollowing: boolean) => void;
}

function ProfileItem({
  profile,
  onClick,
  showReason,
  highlightUsername,
  currentUserId,
  isFollowing,
  onFollowChange,
}: ProfileItemProps) {
  const displayName = profile.display_name || profile.username || "Unknown";
  const username = profile.username;
  const avatarUrl = profile.avatar_url;
  const reason = profile.reason;
  const { toggleFollow, loading } = useFollow(currentUserId || null);

  const handleFollowClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await toggleFollow(profile.user_id, isFollowing);
    if (success) {
      onFollowChange(!isFollowing);
    }
  };

  const showFollowButton = currentUserId && profile.user_id !== currentUserId;

  return (
    <div
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3.5",
        "bg-card/30 dark:bg-white/[0.01] backdrop-blur-xl",
        "border border-gray-200/50 dark:border-white/[0.06]",
        "hover:bg-card/50 dark:hover:bg-white/[0.02]",
        "hover:border-gray-300/50 dark:hover:border-white/[0.10]",
        "hover:shadow-[0_2px_16px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_2px_16px_rgba(138,66,214,0.08)]",
        "transition-all duration-300",
        "rounded-2xl cursor-pointer group"
      )}
      style={{
        boxShadow: "0 1px 3px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
      onClick={onClick}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0 w-14 h-14 rounded-full overflow-hidden ring-1 ring-gray-200/60 dark:ring-white/[0.08] shadow-sm group-hover:ring-gray-300/60 dark:group-hover:ring-white/[0.12] transition-all duration-300">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50/50 dark:bg-white/[0.03]">
            <User className="h-7 w-7 text-gray-300 dark:text-white/20" />
          </div>
        )}
      </div>

      {/* Profile Info */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-[15px] font-medium text-gray-900 dark:text-white truncate mb-0.5",
            !highlightUsername && "font-semibold"
          )}
        >
          {displayName}
        </p>
        {username && (
          <p
            className={cn(
              "text-[13px] text-gray-500 dark:text-white/40 truncate font-light",
              highlightUsername && "font-semibold text-gray-900 dark:text-white"
            )}
          >
            @{username}
          </p>
        )}

        {/* Bio or Reason */}
        {showReason && reason ? (
          <p className="text-xs text-gray-500 dark:text-white/40 truncate font-light leading-relaxed mt-1">
            {reason}
          </p>
        ) : profile.bio ? (
          <p className="text-xs text-gray-500 dark:text-white/40 truncate font-light leading-relaxed mt-1">
            {profile.bio}
          </p>
        ) : null}

        {/* Follower Count */}
        {profile.follower_count !== undefined && (
          <p className="text-[11px] text-gray-400 dark:text-white/30 mt-1 font-light">
            {profile.follower_count.toLocaleString()}{" "}
            {profile.follower_count === 1 ? "follower" : "followers"}
          </p>
        )}
      </div>

      {/* Follow Button */}
      {showFollowButton && (
        <Button
          onClick={handleFollowClick}
          disabled={loading}
          className={cn(
            "flex-shrink-0 h-8 px-4 rounded-full text-xs font-medium transition-all duration-300 border",
            isFollowing
              ? "bg-gray-100/80 dark:bg-white/[0.05] hover:bg-gray-200/80 dark:hover:bg-white/[0.08] text-gray-700 dark:text-white/70 border-gray-300 dark:border-white/15"
              : "bg-primary hover:bg-primary/90 text-white border-transparent",
            loading && "opacity-50 cursor-not-allowed"
          )}
          style={
            isFollowing
              ? {
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.1)",
                }
              : {
                  background: "linear-gradient(135deg, rgba(168,85,247,0.95) 0%, rgba(138,66,214,0.95) 100%)",
                  boxShadow: "0 4px 20px rgba(138,66,214,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
                  backdropFilter: "blur(10px)",
                }
          }
        >
          {loading ? "..." : isFollowing ? "Following" : "Follow"}
        </Button>
      )}
    </div>
  );
}
