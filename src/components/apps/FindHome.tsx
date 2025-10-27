"use client";

import * as React from "react";
import { Search, Loader2, User, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { FeaturedLists } from "./FeaturedLists";
import { CuratedLists } from "./CuratedLists";
import { SavedListsPreview } from "./SavedListsPreview";
import { SuggestedProfiles } from "./SuggestedProfiles";
import { ConnectWithFriends } from "./ConnectWithFriends";
import { getListSummaries } from "@/data/mock/list-articles";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Input } from "@/components/ui/input";
import { useCombinedSearch } from "@/hooks/useCombinedSearch";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useFollow } from "@/hooks/useFollow";
import { ProfileDrawer } from "@/components/profile/ProfileDrawer";
import { RestaurantPage } from "@/components/restaurant/RestaurantPage";
import type { Restaurant } from "@/types/video";

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
  const [showProfileDrawer, setShowProfileDrawer] = React.useState(false);
  const [selectedProfileId, setSelectedProfileId] = React.useState<string>("");
  const [showRestaurantPage, setShowRestaurantPage] = React.useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = React.useState<Restaurant | null>(null);
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
          const nextFollowingSet = new Set(followsData.map((f) => f.following_id));
          setFollowedUsers(nextFollowingSet);
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

  // Use the combined search hook
  const {
    query,
    setQuery,
    profileResults,
    restaurantResults,
    profileSuggestions,
    loading,
    error,
  } = useCombinedSearch({
    viewerId: userId,
    limit: 20,
    debounceMs: 300,
    minQueryLength: 1,
  });

  const displayItems = profileResults;
  const showResults = query.length > 0;
  const showSuggestions = !query && profileSuggestions.length > 0;

  // Update follow status when search results change
  React.useEffect(() => {
    if (!userId || profileResults.length === 0) return;

    const fetchFollowStatusForResults = async () => {
      const profileIds = profileResults.map((r) => r.user_id);

      const { data: followsData } = await supabase
        .from("Follows")
        .select("following_id")
        .eq("follower_id", userId)
        .in("following_id", profileIds);

      if (followsData) {
        setFollowedUsers((prev) => {
          const updatedFollowingSet = new Set(prev);
          followsData.forEach((f) => updatedFollowingSet.add(f.following_id));
          return updatedFollowingSet;
        });
      }
    };

    fetchFollowStatusForResults();
  }, [profileResults, userId, supabase]);

  // Debug logging
  React.useEffect(() => {
    console.log("FindHome state:", {
      userId,
      query,
      profileResultsCount: profileResults.length,
      restaurantResultsCount: restaurantResults.length,
      suggestionsCount: profileSuggestions.length,
      loading,
      showResults,
      displayItemsCount: displayItems.length,
    });
  }, [userId, query, profileResults, restaurantResults, profileSuggestions, loading, showResults, displayItems]);

  // Handle profile click
  const handleProfileClick = (profileUserId: string) => {
    setSelectedProfileId(profileUserId);
    setShowProfileDrawer(true);
  };

  // Handle restaurant click
  const handleRestaurantClick = async (restaurant: Restaurant) => {
    console.log('🍽️  Restaurant clicked:', restaurant.name);

    try {
      // First, check if restaurant exists in database
      console.log('🔍 Checking if restaurant exists in DB...');
      const checkResponse = await fetch(`/api/restaurant/get?placeId=${restaurant.id}`);
      const checkData = await checkResponse.json();

      if (checkData.exists && checkData.restaurant) {
        console.log('✅ Restaurant found in DB, using stored data');
        console.log('📊 Categories:', checkData.restaurant.Menu_Category?.length || 0);
        console.log('📊 Logo:', checkData.restaurant.logo_url ? 'Yes' : 'No');
        console.log('📊 Colors:', checkData.restaurant.primary_colour ? 'Yes' : 'No');

        // Use data from database - transform to Restaurant type
        const dbRestaurant: Restaurant = {
          id: checkData.restaurant.google_place_id,
          name: checkData.restaurant.name,
          logo: checkData.restaurant.logo_url || '',
          verified: checkData.restaurant.verified || false,
          rating: checkData.restaurant.rating || 0,
          distance: restaurant.distance || '',
          address: checkData.restaurant.address || '',
          phone: checkData.restaurant.phone || '',
          // Add DB-specific fields
          slug: checkData.restaurant.slug,
          description: checkData.restaurant.description,
          primaryColor: checkData.restaurant.primary_colour,
          secondaryColor: checkData.restaurant.secondary_colour,
          accentColor: checkData.restaurant.accent_colour,
          categories: checkData.restaurant.Menu_Category || [],
          fromDatabase: true,
        };

        setSelectedRestaurant(dbRestaurant);
        setShowRestaurantPage(true);
        return; // Don't scrape if we have data
      }

      console.log('⚠️  Restaurant not in DB, opening page and triggering scrape...');

      // Open page with placeholder data
      setSelectedRestaurant(restaurant);
      setShowRestaurantPage(true);

      // Trigger scraping and saving in the background
      const response = await fetch('/api/restaurant/scrape-and-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          placeId: restaurant.id,
          address: restaurant.address,
          latitude: null,
          longitude: null,
          phone: restaurant.phone,
          rating: restaurant.rating,
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Restaurant scraped and saved:', data);

        // Refresh data from database after scraping
        const refreshResponse = await fetch(`/api/restaurant/get?placeId=${restaurant.id}`);
        const refreshData = await refreshResponse.json();

        if (refreshData.exists && refreshData.restaurant) {
          console.log('🔄 Refreshing restaurant page with scraped data');
          const updatedRestaurant: Restaurant = {
            id: refreshData.restaurant.google_place_id,
            name: refreshData.restaurant.name,
            logo: refreshData.restaurant.logo_url || '',
            verified: refreshData.restaurant.verified || false,
            rating: refreshData.restaurant.rating || 0,
            distance: restaurant.distance || '',
            address: refreshData.restaurant.address || '',
            phone: refreshData.restaurant.phone || '',
            slug: refreshData.restaurant.slug,
            description: refreshData.restaurant.description,
            primaryColor: refreshData.restaurant.primary_colour,
            secondaryColor: refreshData.restaurant.secondary_colour,
            accentColor: refreshData.restaurant.accent_colour,
            categories: refreshData.restaurant.Menu_Category || [],
            fromDatabase: true,
          };

          setSelectedRestaurant(updatedRestaurant);
        }
      } else {
        console.error('Failed to save restaurant:', data.error);
      }
    } catch (error) {
      console.error('Error handling restaurant click:', error);
      // Fallback: still open the page with basic data
      setSelectedRestaurant(restaurant);
      setShowRestaurantPage(true);
    }
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
            placeholder="Search people and places"
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
          {displayItems.length > 0 && (
            <>
              {restaurantResults.length > 0 && (
                <div className="px-4 py-2 mb-2">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-white/50">
                    People
                  </h3>
                </div>
              )}
              <div className="space-y-1 mb-6">
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
            </>
          )}

          {/* Restaurant Results */}
          {restaurantResults.length > 0 && (
            <>
              <div className="px-4 py-2 mb-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-white/50">
                  Places
                </h3>
              </div>
              <div className="space-y-1">
                {restaurantResults.map((restaurant) => (
                  <RestaurantItem
                    key={restaurant.id}
                    restaurant={restaurant}
                    onClick={() => handleRestaurantClick({
                      id: restaurant.placeId,
                      name: restaurant.name,
                      logo: restaurant.photo || '',
                      verified: false,
                      rating: restaurant.rating || 0,
                      distance: restaurant.distance || '',
                      address: restaurant.address,
                      phone: '',
                    })}
                  />
                ))}
              </div>
            </>
          )}

          {/* Empty State */}
          {!loading && displayItems.length === 0 && restaurantResults.length === 0 && query && (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Search className="h-12 w-12 text-gray-300 dark:text-white/30 mb-3" />
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

          {/* Saved Lists Preview (user-specific) - now above friend suggestions */}
          <SavedListsPreview
            onSeeAll={() => console.log('See all saved lists')}
            onListClick={(list) => router.push(`/diners/lists/${list.slug || list.id}`)}
          />

          {/* Suggested Profiles Carousel - Show when not searching */}
          {showSuggestions && (
            <SuggestedProfiles
              profiles={profileSuggestions}
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
        profiles={profileSuggestions}
        onClose={() => setShowConnectDrawer(false)}
        onProfileClick={handleProfileClick}
        currentUserId={userId}
      />

      {/* Profile Drawer */}
      <ProfileDrawer
        isOpen={showProfileDrawer}
        onClose={() => setShowProfileDrawer(false)}
        userId={selectedProfileId}
      />

      {/* Restaurant Page */}
      {selectedRestaurant && (
        <RestaurantPage
          isOpen={showRestaurantPage}
          onClose={() => setShowRestaurantPage(false)}
          restaurant={selectedRestaurant}
        />
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

interface RestaurantItemProps {
  restaurant: {
    id: string;
    name: string;
    address: string;
    rating?: number;
    photo?: string;
    distance?: string;
  };
  onClick: () => void;
}

function RestaurantItem({ restaurant, onClick }: RestaurantItemProps) {
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
      {/* Restaurant Image/Icon */}
      <div className="relative flex-shrink-0 w-14 h-14 rounded-full overflow-hidden ring-1 ring-gray-200/60 dark:ring-white/[0.08] shadow-sm group-hover:ring-gray-300/60 dark:group-hover:ring-white/[0.12] transition-all duration-300">
        {restaurant.photo ? (
          <Image
            src={restaurant.photo}
            alt={restaurant.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50/50 dark:bg-white/[0.03]">
            <MapPin className="h-7 w-7 text-gray-300 dark:text-white/20" />
          </div>
        )}
      </div>

      {/* Restaurant Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-gray-900 dark:text-white truncate mb-0.5">
          {restaurant.name}
        </p>
        {restaurant.address && (
          <p className="text-[13px] text-gray-500 dark:text-white/40 truncate font-light">
            {restaurant.address}
          </p>
        )}
        {restaurant.distance && (
          <p className="text-xs text-gray-400 dark:text-white/30 mt-1 font-light">
            {restaurant.distance}
          </p>
        )}
      </div>
    </div>
  );
}
