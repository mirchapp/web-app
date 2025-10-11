"use client";

import * as React from "react";
import Image from "next/image";
import { User, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SuggestedProfile {
  user_id: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  reason?: string;
}

interface SuggestedProfilesProps {
  profiles: SuggestedProfile[];
  onProfileClick?: (userId: string) => void;
  onSeeAll?: () => void;
}

export function SuggestedProfiles({
  profiles,
  onProfileClick,
  onSeeAll,
}: SuggestedProfilesProps) {
  return (
    <div className="mb-6">
      <div className="px-4 mb-4 flex items-center justify-between">
        <h2 className="text-xl font-light text-gray-900 dark:text-white tracking-tight">
          Suggested for you
        </h2>
        {onSeeAll && (
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary/80 -mr-2 font-light"
            onClick={onSeeAll}
          >
            See all
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>

      {/* Horizontal scrolling profile cards */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 px-4 pb-2">
          {profiles.map((profile) => (
            <ProfileCard
              key={profile.user_id}
              profile={profile}
              onClick={() => onProfileClick?.(profile.user_id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface ProfileCardProps {
  profile: SuggestedProfile;
  onClick: () => void;
}

function ProfileCard({ profile, onClick }: ProfileCardProps) {
  const [isFollowing, setIsFollowing] = React.useState(false);
  const displayName = profile.display_name || profile.username || "Unknown";
  const username = profile.username;

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFollowing(!isFollowing);
  };

  return (
    <div
      className={cn(
        "flex-none w-[160px] rounded-2xl",
        "bg-card dark:bg-white/[0.02] backdrop-blur-xl",
        "border border-gray-200 dark:border-white/10",
        "hover:shadow-[0_4px_20px_rgba(138,66,214,0.15)] dark:hover:shadow-[0_4px_20px_rgba(138,66,214,0.25)]",
        "transition-all duration-300 cursor-pointer overflow-hidden relative"
      )}
      style={{
        boxShadow: "0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.1)",
      }}
    >
      {/* Subtle gradient overlay */}
      <div
        className="absolute inset-0 opacity-30 dark:opacity-40 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(168,85,247,0.03) 0%, transparent 100%)',
        }}
      />

      <div className="p-4 flex flex-col items-center relative z-10">
        {/* Avatar */}
        <div
          className="relative w-20 h-20 rounded-full overflow-hidden mb-3 cursor-pointer ring-1 ring-gray-200 dark:ring-white/10 shadow-lg"
          onClick={onClick}
          style={{
            boxShadow: "0 4px 12px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
          }}
        >
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={displayName}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-white/5">
              <User className="h-10 w-10 text-gray-300 dark:text-white/30" />
            </div>
          )}
        </div>

        {/* Name and Username */}
        <div className="text-center mb-3 w-full cursor-pointer" onClick={onClick}>
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate mb-0.5">
            {displayName}
          </p>
          {username && (
            <p className="text-xs text-gray-500 dark:text-white/50 truncate font-light">
              @{username}
            </p>
          )}
        </div>

        {/* Follow Button - Purple Glassy */}
        <Button
          onClick={handleFollowClick}
          className={cn(
            "w-full h-9 rounded-[14px] text-xs font-medium transition-all duration-200 border",
            isFollowing
              ? "bg-gray-100/80 dark:bg-white/[0.05] hover:bg-gray-200/80 dark:hover:bg-white/[0.08] text-gray-700 dark:text-white/70 border-gray-300 dark:border-white/15"
              : "bg-primary hover:bg-primary/90 text-white border-transparent"
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
          {isFollowing ? "Following" : "Follow"}
        </Button>
      </div>
    </div>
  );
}
