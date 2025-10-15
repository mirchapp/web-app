// Shared feed data model to drive the Home feed experience.
// This file only declares types to keep the UI implementation modular and extendable.

export type FeedAudience = 'followers' | 'network' | 'community';

export type FeedReactionType =
  | 'like'
  | 'love'
  | 'yum'
  | 'wow'
  | 'insightful'
  | 'support';

export interface FeedEngagementStats {
  reactions: Partial<Record<FeedReactionType, number>>;
  comments: number;
  shares: number;
  saves: number;
  views?: number;
}

export interface FeedEngagementState {
  userReaction?: FeedReactionType | null;
  isSaved?: boolean;
  isShared?: boolean;
}

export interface FeedNetworkContext {
  reason: 'followed' | 'second-degree' | 'recommended' | 'trending';
  /**
   * Optional contextual detail shown above the post (e.g. "Sonia Patel liked this").
   */
  detail?: string;
}

export interface FeedAuthorBase {
  id: string;
  name: string;
  avatarUrl?: string;
  headline?: string;
  isVerified?: boolean;
}

export interface FeedUserAuthor extends FeedAuthorBase {
  type: 'user';
  badges?: string[];
}

export interface FeedRestaurantAuthor extends FeedAuthorBase {
  type: 'restaurant';
  location?: string;
  cuisineTags?: string[];
}

export interface FeedMirchAuthor extends FeedAuthorBase {
  type: 'mirch';
  role: 'admin' | 'curator' | 'editor';
}

export type FeedAuthor = FeedUserAuthor | FeedRestaurantAuthor | FeedMirchAuthor;

export type FeedMediaType = 'image' | 'video';

export interface FeedMedia {
  id: string;
  type: FeedMediaType;
  url: string;
  alt?: string;
  aspectRatio?: number;
  durationSeconds?: number;
  thumbnailUrl?: string;
}

export interface FeedBasePost {
  id: string;
  author: FeedAuthor;
  createdAt: string; // ISO timestamp
  audience: FeedAudience;
  context?: FeedNetworkContext;
  stats: FeedEngagementStats;
  state?: FeedEngagementState;
  tags?: string[];
}

export interface FeedLocationReference {
  restaurantId: string;
  restaurantName: string;
  address?: string;
  neighborhood?: string;
  rating?: number;
}

export interface FeedReviewContent {
  type: 'review';
  title?: string;
  body: string;
  tasteRating?: 'loved' | 'liked' | 'meh' | 'not_for_me';
  valueForMoney?: 'great' | 'solid' | 'okay' | 'pricey';
  wouldReturn?: boolean;
  highlights?: string[];
  media: FeedMedia[];
  location?: FeedLocationReference;
}

export interface FeedFlixContent {
  type: 'flix';
  videoId: string;
  caption?: string;
  media: FeedMedia;
  relatedLocation?: FeedLocationReference;
  autoplayPreview?: boolean;
}

export interface FeedAnnouncementContent {
  type: 'announcement';
  headline: string;
  body: string;
  media?: FeedMedia[];
  validFrom?: string;
  validThrough?: string;
  ctaButton?: {
    label: string;
    href: string;
  };
  location?: FeedLocationReference;
}

export interface FeedNewsletterContent {
  type: 'newsletter';
  title: string;
  summary: string;
  readingTimeMinutes?: number;
  coverImage?: FeedMedia;
  canonicalUrl?: string;
  sections?: string[];
}

export type FeedContent =
  | FeedReviewContent
  | FeedFlixContent
  | FeedAnnouncementContent
  | FeedNewsletterContent;

export interface FeedPost extends FeedBasePost {
  content: FeedContent;
}

export interface FeedSectionHeader {
  type: 'section-header';
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
}

export interface FeedDivider {
  type: 'divider';
  id: string;
  label?: string;
}

export type FeedItem = FeedPost | FeedSectionHeader | FeedDivider;

export interface FeedResponse {
  items: FeedItem[];
  cursor?: string;
}
