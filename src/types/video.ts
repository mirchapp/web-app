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
