export interface ProfileSearchResult {
  user_id: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  follower_count?: number;
  following_count?: number;
  match_type?: 'username' | 'display_name';
}

export interface ProfileSuggestion extends ProfileSearchResult {
  reason?: string;
  mutual_connections?: number;
}
