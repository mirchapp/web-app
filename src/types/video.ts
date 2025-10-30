export interface User {
  id?: string; // Optional user ID for profile lookup
  username: string;
  avatar: string;
  isFollowing: boolean;
}

export interface PopularDish {
  name: string;
  description: string;
  price: number;
  image: string;
}

export interface RestaurantHours {
  weekday: string;
  weekend: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  display_order: number;
  Menu_Item: MenuItem[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: string | null;
}

export interface StreamingMenuItem {
  name: string;
  description?: string | null;
  price?: string | null;
}

export interface StreamingMenuCategory {
  name: string;
  items: StreamingMenuItem[];
}

export interface StreamingMenu {
  description?: string;
  cuisine?: string;
  tags?: string[];
  logo?: string;
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  categories: StreamingMenuCategory[];
}

export interface Restaurant {
  id: string;
  name: string;
  logo: string;
  verified: boolean;
  rating: number;
  distance: string;
  address: string;
  phone: string;
  cuisine?: string;
  priceRange?: string;
  hours?: RestaurantHours;
  about?: string;
  popularDishes?: PopularDish[];
  // Database fields
  slug?: string;
  description?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  categories?: MenuCategory[];
  fromDatabase?: boolean;
  // Streaming menu data (while scraping)
  streamingMenu?: StreamingMenu;
}

export interface VideoStats {
  likes: number;
  isLiked: boolean;
  isBookmarked: boolean;
}

export interface Video {
  id: string;
  src: string;
  thumbnail: string;
  user: User;
  restaurant: Restaurant;
  dish: string;
  stats: VideoStats;
}
