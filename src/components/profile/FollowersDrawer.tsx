"use client";

import * as React from "react";
import Image from "next/image";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SideDrawer } from "@/components/ui/side-drawer";
import { cn } from "@/lib/utils";
import { useFollow } from "@/hooks/useFollow";
import { createClient } from "@/utils/supabase/client";
import { fetchSuggestedProfiles } from "@/lib/suggestions";
import { ProfileDrawer } from "./ProfileDrawer";

interface ProfileUser {
  user_id: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
}

interface FollowersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentUserId: string;
  mode: "followers" | "following";
  onProfileClick?: (userId: string) => void;
}

export function FollowersDrawer({
  isOpen,
  onClose,
  userId,
  currentUserId,
  mode,
  onProfileClick,
}: FollowersDrawerProps) {
  const [profiles, setProfiles] = React.useState<ProfileUser[]>([]);
  const [suggestedProfiles, setSuggestedProfiles] = React.useState<ProfileUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [followedUsers, setFollowedUsers] = React.useState<Set<string>>(new Set());
  const [showProfileDrawer, setShowProfileDrawer] = React.useState(false);
  const [selectedProfileId, setSelectedProfileId] = React.useState<string>("");
  const { toggleFollow } = useFollow(currentUserId);
  const supabase = createClient();

  const handleProfileClick = (profileUserId: string) => {
    setSelectedProfileId(profileUserId);
    setShowProfileDrawer(true);
    if (onProfileClick) {
      onProfileClick(profileUserId);
    }
  };

  // Fetch followers or following
  React.useEffect(() => {
    if (!isOpen) return;

    const fetchProfiles = async () => {
      setLoading(true);

      if (mode === "followers") {
        // Get users who are following this user
        const { data: followsData } = await supabase
          .from("Follows")
          .select("follower_id")
          .eq("following_id", userId);

        if (followsData && followsData.length > 0) {
          const followerIds = followsData.map((f) => f.follower_id);

          // Fetch profile data for these users
          const { data: profilesData } = await supabase
            .from("Profile")
            .select("user_id, username, display_name, avatar_url, bio")
            .in("user_id", followerIds);

          setProfiles(profilesData || []);
        } else {
          setProfiles([]);
        }
        // Don't fetch suggestions for followers
        setSuggestedProfiles([]);
      } else {
        // Get users this user is following
        const { data: followsData } = await supabase
          .from("Follows")
          .select("following_id")
          .eq("follower_id", userId);

        if (followsData && followsData.length > 0) {
          const followingIds = followsData.map((f) => f.following_id);

          // Fetch profile data for these users
          const { data: profilesData } = await supabase
            .from("Profile")
            .select("user_id, username, display_name, avatar_url, bio")
            .in("user_id", followingIds);

          setProfiles(profilesData || []);
        } else {
          setProfiles([]);
        }

        // Only fetch suggested profiles if viewing current user's following list
        if (userId === currentUserId) {
          await fetchSuggestedProfilesList();
        } else {
          setSuggestedProfiles([]);
        }
      }

      setLoading(false);
    };

    const fetchSuggestedProfilesList = async () => {
      // Use the same suggestion logic as the Find page
      const suggested = await fetchSuggestedProfiles(currentUserId, 10, false);
      setSuggestedProfiles(suggested);
    };

    fetchProfiles();
  }, [isOpen, userId, mode, currentUserId, supabase]);

  // Fetch current user's following status for each profile
  React.useEffect(() => {
    if (!isOpen || (profiles.length === 0 && suggestedProfiles.length === 0)) return;

    const fetchFollowStatus = async () => {
      const allProfileIds = [
        ...profiles.map((p) => p.user_id),
        ...suggestedProfiles.map((p) => p.user_id),
      ];

      if (allProfileIds.length === 0) return;

      const { data: followsData } = await supabase
        .from("Follows")
        .select("following_id")
        .eq("follower_id", currentUserId)
        .in("following_id", allProfileIds);

      if (followsData) {
        const followingSet = new Set(followsData.map((f) => f.following_id));
        setFollowedUsers(followingSet);
      }
    };

    fetchFollowStatus();
  }, [isOpen, profiles, suggestedProfiles, currentUserId, supabase]);

  const handleFollowToggle = async (profileUserId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isCurrentlyFollowing = followedUsers.has(profileUserId);
    const success = await toggleFollow(profileUserId, isCurrentlyFollowing);

    if (success) {
      setFollowedUsers((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(profileUserId)) {
          newSet.delete(profileUserId);
        } else {
          newSet.add(profileUserId);
        }
        return newSet;
      });

      // If we're in "following" mode and we just unfollowed someone, remove them from the list
      if (mode === "following" && isCurrentlyFollowing) {
        setProfiles((prev) => prev.filter((p) => p.user_id !== profileUserId));
      }
    }
  };

  return (
    <>
      <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "followers" ? "Followers" : "Following"}
      headerTopPadding="calc(env(safe-area-inset-top, 0px) + 2rem)"
    >
      <div
        className="container mx-auto px-5 sm:px-6 pb-8 relative z-10"
        style={{
          paddingTop: "0.25rem",
        }}
      >
        <div className="max-w-md mx-auto">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-card dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 animate-pulse"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-white/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-32" />
                    <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-24" />
                  </div>
                  <div className="h-8 w-20 bg-gray-200 dark:bg-white/10 rounded-full" />
                </div>
              ))}
            </div>
          ) : profiles.length === 0 ? (
            <div className="w-full">
              {/* Empty state header */}
              <div className="flex flex-col items-center justify-center py-8 px-4">
                <User className="h-12 w-12 text-gray-300 dark:text-white/30 mb-3" />
                <p className="text-sm text-gray-600 dark:text-white/50 text-center font-light">
                  {mode === "followers" ? "No followers yet" : "Not following anyone yet"}
                </p>
              </div>

              {/* Suggested profiles */}
              {suggestedProfiles.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 px-2">
                    Suggested for you
                  </h3>
                  <div className="space-y-3">
                    {suggestedProfiles.map((profile) => (
                      <ProfileListItem
                        key={profile.user_id}
                        profile={profile}
                        isFollowing={followedUsers.has(profile.user_id)}
                        onFollowToggle={handleFollowToggle}
                        onProfileClick={handleProfileClick}
                        currentUserId={currentUserId}
                        showFollowButton={profile.user_id !== currentUserId}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full">
              {/* Following list */}
              <div className="space-y-3 w-full">
                {profiles.map((profile) => (
                  <ProfileListItem
                    key={profile.user_id}
                    profile={profile}
                    isFollowing={followedUsers.has(profile.user_id)}
                    onFollowToggle={handleFollowToggle}
                    onProfileClick={handleProfileClick}
                    currentUserId={currentUserId}
                    showFollowButton={profile.user_id !== currentUserId}
                  />
                ))}
              </div>

              {/* Suggested profiles - shown at the end for following mode */}
              {mode === "following" && suggestedProfiles.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 px-2">
                    Suggested for you
                  </h3>
                  <div className="space-y-3">
                    {suggestedProfiles.map((profile) => (
                      <ProfileListItem
                        key={profile.user_id}
                        profile={profile}
                        isFollowing={followedUsers.has(profile.user_id)}
                        onFollowToggle={handleFollowToggle}
                        onProfileClick={handleProfileClick}
                        currentUserId={currentUserId}
                        showFollowButton={profile.user_id !== currentUserId}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </SideDrawer>

      {/* Profile Drawer */}
      <ProfileDrawer
        isOpen={showProfileDrawer}
        onClose={() => setShowProfileDrawer(false)}
        userId={selectedProfileId}
      />
    </>
  );
}

interface ProfileListItemProps {
  profile: ProfileUser;
  isFollowing: boolean;
  onFollowToggle: (userId: string, e: React.MouseEvent) => void;
  onProfileClick?: (userId: string) => void;
  currentUserId: string;
  showFollowButton: boolean;
}

function ProfileListItem({
  profile,
  isFollowing,
  onFollowToggle,
  onProfileClick,
  currentUserId,
  showFollowButton,
}: ProfileListItemProps) {
  const displayName = profile.display_name || profile.username || "Unknown";
  const username = profile.username;
  const { loading } = useFollow(currentUserId);

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-2xl",
        "bg-card dark:bg-white/[0.02] backdrop-blur-xl",
        "border border-gray-200 dark:border-white/10",
        "transition-all duration-200",
        onProfileClick && "cursor-pointer hover:shadow-lg"
      )}
      style={{
        boxShadow: "0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.1)",
      }}
      onClick={() => onProfileClick?.(profile.user_id)}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0 w-12 h-12 rounded-full overflow-hidden ring-1 ring-gray-200 dark:ring-white/10 shadow-sm">
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
        {username && (
          <p className="text-xs text-gray-500 dark:text-white/50 truncate font-light">
            @{username}
          </p>
        )}
      </div>

      {/* Follow Button - only show if not current user */}
      {showFollowButton && (
        <Button
          onClick={(e) => onFollowToggle(profile.user_id, e)}
          disabled={loading}
          className={cn(
            "flex-shrink-0 h-8 px-5 rounded-[14px] text-xs font-medium transition-all duration-200 border",
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
