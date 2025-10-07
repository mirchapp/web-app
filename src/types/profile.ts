export interface Profile {
  user_id: string;
  username?: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  avatar_url?: string;
  location?: string;
  follower_count: number;
  following_count: number;
  post_count: number;
  favourite_cuisines?: string[];
  dietary_preferences?: string[];
  spice_preference: number;
  price_preference: number;
  created_at: string;
  updated_at: string;
  signup_completed: boolean;
  signup_step: number;
}

export interface OnboardingData {
  display_name?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  bio?: string;
  location?: string;
  avatar_url?: string;
  favourite_cuisines?: string[];
  dietary_preferences?: string[];
  spice_preference?: number;
  price_preference?: number;
}
