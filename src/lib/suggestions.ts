import { createClient } from "@/utils/supabase/client";
import { ProfileSuggestion } from "@/types/search";

export async function fetchSuggestedProfiles(
  viewerId: string,
  limit: number = 20,
  includeFollowing: boolean = false
): Promise<ProfileSuggestion[]> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.rpc("suggested_profiles", {
      viewer: viewerId,
      n: limit,
      include_following: includeFollowing,
    });

    if (error) {
      console.error("Error fetching suggested profiles:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Exception fetching suggested profiles:", err);
    return [];
  }
}
