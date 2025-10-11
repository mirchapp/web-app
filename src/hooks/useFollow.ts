"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

export function useFollow(currentUserId: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const followUser = useCallback(
    async (followingId: string) => {
      if (!currentUserId) {
        setError("You must be logged in to follow users");
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        console.log("Attempting to follow:", { follower_id: currentUserId, following_id: followingId });

        const { data, error: insertError } = await supabase
          .from("Follows")
          .insert({
            follower_id: currentUserId,
            following_id: followingId,
          })
          .select();

        if (insertError) {
          console.error("Error following user:", {
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
            code: insertError.code,
          });
          setError(insertError.message);
          return false;
        }

        console.log("Successfully followed user:", data);
        return true;
      } catch (err) {
        console.error("Unexpected error following user:", err);
        setError("Failed to follow user");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [currentUserId, supabase]
  );

  const unfollowUser = useCallback(
    async (followingId: string) => {
      if (!currentUserId) {
        setError("You must be logged in to unfollow users");
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        console.log("Attempting to unfollow:", { follower_id: currentUserId, following_id: followingId });

        const { error: deleteError } = await supabase
          .from("Follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", followingId);

        if (deleteError) {
          console.error("Error unfollowing user:", {
            message: deleteError.message,
            details: deleteError.details,
            hint: deleteError.hint,
            code: deleteError.code,
          });
          setError(deleteError.message);
          return false;
        }

        console.log("Successfully unfollowed user");
        return true;
      } catch (err) {
        console.error("Unexpected error unfollowing user:", err);
        setError("Failed to unfollow user");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [currentUserId, supabase]
  );

  const toggleFollow = useCallback(
    async (followingId: string, isCurrentlyFollowing: boolean) => {
      if (isCurrentlyFollowing) {
        return await unfollowUser(followingId);
      } else {
        return await followUser(followingId);
      }
    },
    [followUser, unfollowUser]
  );

  return {
    followUser,
    unfollowUser,
    toggleFollow,
    loading,
    error,
  };
}
