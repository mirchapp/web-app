"use client";

import * as React from "react";
import { Search, Loader2, User, MapPin, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCombinedSearch } from "@/hooks/useCombinedSearch";
import Image from "next/image";
import type { Restaurant } from "@/types/video";

interface ProfileSearchProps {
  viewerId: string;
  onProfileClick?: (userId: string) => void;
  onRestaurantClick?: (restaurant: Restaurant) => void;
  className?: string;
  placeholder?: string;
}

export function ProfileSearch({
  viewerId,
  onProfileClick,
  onRestaurantClick,
  className,
  placeholder = "Search people and places",
}: ProfileSearchProps) {
  const {
    query,
    setQuery,
    profileResults,
    restaurantResults,
    profileSuggestions,
    loading,
    suggesting,
    error,
  } = useCombinedSearch({
    viewerId,
    limit: 20,
    debounceMs: 300,
    minQueryLength: 1,
  });

  const displayProfiles = profileResults.length > 0 ? profileResults : profileSuggestions;
  const showSuggestionHeader = !query && profileSuggestions.length > 0;
  const hasAnyResults = displayProfiles.length > 0 || restaurantResults.length > 0;

  return (
    <div className={cn("w-full", className)}>
      {/* Search Input */}
      <div className="relative mb-4">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
          {loading ? (
            <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={cn(
            "h-12 pl-12 pr-4 rounded-xl",
            "bg-muted/50 border-border/50",
            "text-base placeholder:text-muted-foreground",
            "focus-visible:ring-2 focus-visible:ring-primary/20",
            "transition-all duration-200"
          )}
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Results/Suggestions */}
      <div className="space-y-1">
        {/* Suggestion Header */}
        {showSuggestionHeader && (
          <div className="px-4 py-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Suggested for you
            </h3>
          </div>
        )}

        {/* Loading State */}
        {suggesting && !hasAnyResults && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
          </div>
        )}

        {/* Restaurant Results */}
        {restaurantResults.length > 0 && query && (
          <>
            <div className="px-4 py-2 pt-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Places
              </h3>
            </div>
            {restaurantResults.map((restaurant) => (
              <RestaurantItem
                key={restaurant.id}
                restaurant={restaurant}
                onClick={() => onRestaurantClick?.({
                  id: restaurant.placeId,
                  name: restaurant.name,
                  logo: '',
                  verified: false,
                  rating: restaurant.rating || 0,
                  distance: '',
                  address: restaurant.address,
                  phone: '',
                })}
              />
            ))}
          </>
        )}

        {/* Profile Results */}
        {displayProfiles.length > 0 && (
          <>
            {restaurantResults.length > 0 && query && (
              <div className="px-4 py-2 pt-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  People
                </h3>
              </div>
            )}
            {displayProfiles.map((profile) => (
              <ProfileItem
                key={profile.user_id}
                profile={profile}
                onClick={() => onProfileClick?.(profile.user_id)}
                showReason={!query && "reason" in profile}
                highlightUsername={query.startsWith("@")}
              />
            ))}
          </>
        )}

        {/* Empty State */}
        {!loading && !suggesting && !hasAnyResults && query && (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <Search className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground text-center">
              No results found
            </p>
            <p className="text-xs text-muted-foreground/70 text-center mt-1">
              Try a different search term
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface RestaurantItemProps {
  restaurant: {
    id: string;
    name: string;
    address: string;
    rating?: number;
  };
  onClick: () => void;
}

function RestaurantItem({ restaurant, onClick }: RestaurantItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3",
        "hover:bg-muted/50 active:bg-muted",
        "transition-colors duration-150",
        "text-left group"
      )}
    >
      {/* Restaurant Icon */}
      <div className="relative flex-shrink-0 w-12 h-12 rounded-full bg-muted overflow-hidden flex items-center justify-center">
        <MapPin className="h-6 w-6 text-muted-foreground" />
      </div>

      {/* Restaurant Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground truncate">
            {restaurant.name}
          </p>
        </div>

        {restaurant.address && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {restaurant.address}
          </p>
        )}

        {restaurant.rating && (
          <p className="text-xs text-muted-foreground/70 mt-0.5">
            ⭐ {restaurant.rating.toFixed(1)}
          </p>
        )}
      </div>

      {/* Chevron */}
      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
    </button>
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
        "text-left"
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
