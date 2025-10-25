"use client";

import * as React from "react";
import Image from "next/image";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SideDrawer } from "@/components/ui/side-drawer";
import { cn } from "@/lib/utils";
import { useFollow } from "@/hooks/useFollow";

interface SuggestedProfile {
  user_id: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  follower_count?: number;
}

interface ConnectWithFriendsProps {
  profiles: SuggestedProfile[];
  isOpen: boolean;
  onClose: () => void;
  onProfileClick?: (userId: string) => void;
  currentUserId?: string;
}

export function ConnectWithFriends({
  profiles,
  isOpen,
  onClose,
  onProfileClick,
  currentUserId,
}: ConnectWithFriendsProps) {
  const [followedUsers, setFollowedUsers] = React.useState<Set<string>>(new Set());
  const { toggleFollow } = useFollow(currentUserId || null);

  const handleFollowToggle = async (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isCurrentlyFollowing = followedUsers.has(userId);
    const success = await toggleFollow(userId, isCurrentlyFollowing);

    if (success) {
      setFollowedUsers((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(userId)) {
          newSet.delete(userId);
        } else {
          newSet.add(userId);
        }
        return newSet;
      });
    }
  };

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Connect with friends"
      headerTopPadding="calc(env(safe-area-inset-top, 0px) + 2rem)"
    >
      <div className="px-5 sm:px-6 pb-8 max-w-md mx-auto">
        {/* Subtitle - tight to title */}
        <p className="text-center text-sm text-gray-600 dark:text-white/50 font-light mb-6">
          Discover people you might know
        </p>

        {/* Profile List */}
        <div className="space-y-3">
          {profiles.map((profile) => (
            <ProfileListItem
              key={profile.user_id}
              profile={profile}
              isFollowing={followedUsers.has(profile.user_id)}
              onFollowToggle={handleFollowToggle}
              onProfileClick={onProfileClick}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      </div>
    </SideDrawer>
  );
}

interface ProfileListItemProps {
  profile: SuggestedProfile;
  isFollowing: boolean;
  onFollowToggle: (userId: string, e: React.MouseEvent) => void;
  onProfileClick?: (userId: string) => void;
  currentUserId?: string;
}

function ProfileListItem({
  profile,
  isFollowing,
  onFollowToggle,
  onProfileClick,
  currentUserId,
}: ProfileListItemProps) {
  const displayName = profile.display_name || profile.username || "Unknown";
  const { loading } = useFollow(currentUserId || null);

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-2xl",
        "bg-card dark:bg-white/[0.02]",
        "border border-gray-200 dark:border-white/10",
        "transition-all duration-200 shadow-sm",
        onProfileClick && "cursor-pointer hover:shadow-lg"
      )}
      onClick={() => onProfileClick?.(profile.user_id)}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden ring-1 ring-gray-200 dark:ring-white/10">
        {profile.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt={displayName}
            fill
            className="object-cover"
            sizes="48px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-white/5">
            <User className="h-6 w-6 text-gray-300 dark:text-white/30" />
          </div>
        )}
      </div>

      {/* Profile Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
          {displayName}
        </p>
        {profile.username && (
          <p className="text-xs text-gray-500 dark:text-white/50 truncate font-light">
            @{profile.username}
          </p>
        )}
      </div>

      {/* Follow Button */}
      <Button
        onClick={(e) => onFollowToggle(profile.user_id, e)}
        disabled={loading}
        className={cn(
          "flex-shrink-0 h-8 px-5 rounded-[14px] text-xs font-medium transition-all duration-200",
          isFollowing
            ? "bg-gray-100/80 dark:bg-white/[0.05] hover:bg-gray-200/80 dark:hover:bg-white/[0.08] text-gray-700 dark:text-white/70 border border-gray-300 dark:border-white/15"
            : "bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg",
          loading && "opacity-50 cursor-not-allowed"
        )}
      >
        {loading ? "..." : isFollowing ? "Following" : "Follow"}
      </Button>
    </div>
  );
}
