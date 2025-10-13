import type {
  FeedContent,
  FeedItem,
  FeedNewsletterContent,
  FeedPost,
  FeedResponse,
} from '@/types/feed';
import flixVideos from './videos.json';

const getFormattedDate = (minutesAgo: number) => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutesAgo);
  return date.toISOString();
};

const firstFlix = flixVideos[0];

const feedItems: FeedItem[] = [
  {
    type: 'section-header',
    id: 'today-on-mirch',
    title: 'Today on Mirch',
    subtitle: 'Fresh bites from the people and places you follow',
    icon: 'sparkles',
  },
  {
    id: 'post-001',
    author: {
      type: 'user',
      id: 'user-sona-patel',
      name: 'Sona Patel',
      avatarUrl: 'https://images.unsplash.com/photo-1542156822-6924d1a71ace?w=200&h=200&fit=crop',
      headline: 'Product Designer @ ByteBites',
      isVerified: true,
      badges: ['Top Reviewer • Waterloo'],
    },
    createdAt: getFormattedDate(12),
    audience: 'followers',
    context: {
      reason: 'followed',
      detail: 'You follow Sona',
    },
    stats: {
      reactions: {
        like: 86,
        love: 42,
        yum: 58,
      },
      comments: 24,
      saves: 18,
      shares: 9,
    },
    state: {
      userReaction: null,
      isSaved: false,
    },
    tags: ['Waterloo', 'Brunch'],
    content: {
      type: 'review',
      title: 'Weekend brunch perfection at The Spice House',
      body:
        'Finally tried the Thai Basil Waffles everyone has been raving about. Crispy, savory, and the basil whip was unreal. Loved the chef’s tasting flight — perfect balance of heat and sweetness.',
      tasteRating: 'loved',
      valueForMoney: 'great',
      wouldReturn: true,
      highlights: ['Thai Basil Waffles', 'Chef tasting flight', 'House-made chili jam'],
      media: [
        {
          id: 'media-001',
          type: 'image',
          url: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=1200&h=800&fit=crop',
          alt: 'Thai-inspired brunch spread at The Spice House',
          aspectRatio: 4 / 3,
        },
        {
          id: 'media-002',
          type: 'image',
          url: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=1200&h=800&fit=crop',
          alt: 'Chef plating basil-infused waffles',
          aspectRatio: 4 / 3,
        },
      ],
      location: {
        restaurantId: '1',
        restaurantName: 'The Spice House',
        address: '123 King St N, Waterloo, ON',
        neighborhood: 'Uptown',
        rating: 4.8,
      },
    },
  } satisfies FeedPost,
  {
    id: 'post-002',
    author: {
      type: 'user',
      id: 'user-faizaan',
      name: firstFlix?.user?.username ?? 'Faizaan Qureshi',
      avatarUrl: firstFlix?.user?.avatar,
      headline: 'Food Creator | Mirch Flix Partner',
    },
    createdAt: getFormattedDate(28),
    audience: 'network',
    context: {
      reason: 'second-degree',
      detail: 'Ayla Singh liked this',
    },
    stats: {
      reactions: {
        like: firstFlix?.stats?.likes ?? 0,
        wow: Math.round((firstFlix?.stats?.likes ?? 0) * 0.35),
      },
      comments: 31,
      saves: 45,
      shares: 22,
      views: 1820,
    },
    state: {
      userReaction: 'like',
      isSaved: true,
    },
    tags: ['Mirch Flix', 'Street Eats'],
    content: {
      type: 'flix',
      videoId: firstFlix?.id ?? '1',
      caption: 'This cashew basil beef from The Spice House is the ultimate comfort food. Wait for the chili crunch finish 🔥',
      media: {
        id: `flix-${firstFlix?.id ?? '1'}`,
        type: 'video',
        url: firstFlix?.src ?? '',
        thumbnailUrl: firstFlix?.thumbnail,
        aspectRatio: 9 / 16,
        durationSeconds: 38,
      },
      relatedLocation: firstFlix
        ? {
            restaurantId: firstFlix.restaurant.id,
            restaurantName: firstFlix.restaurant.name,
            address: firstFlix.restaurant.address,
            neighborhood: 'Uptown',
            rating: firstFlix.restaurant.rating,
          }
        : undefined,
      autoplayPreview: true,
    },
  } satisfies FeedPost,
  {
    type: 'divider',
    id: 'network-divider',
    label: 'From restaurants you follow',
  },
  {
    id: 'post-003',
    author: {
      type: 'restaurant',
      id: 'restaurant-ramen-lab',
      name: 'Midnight Ramen Lab',
      avatarUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=160&h=160&fit=crop',
      location: 'King & Bridge St.',
      cuisineTags: ['Ramen', 'Late Night'],
      isVerified: true,
    },
    createdAt: getFormattedDate(90),
    audience: 'community',
    context: {
      reason: 'followed',
      detail: 'You follow Midnight Ramen Lab',
    },
    stats: {
      reactions: {
        love: 126,
        yum: 204,
      },
      comments: 18,
      saves: 64,
      shares: 11,
    },
    tags: ['New Dish', 'Limited Drop'],
    content: {
      type: 'announcement',
      headline: 'New: Fire & Umami Midwinter Bowl (Only 50 per night)',
      body:
        'Charred shoyu tare, bone-marrow butter broth, smoked oyster mushrooms, and chili oil confit egg. Available after 9pm this week only. Pre-reserve to guarantee a bowl.',
      media: [
        {
          id: 'media-ramen-hero',
          type: 'image',
          url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=900&fit=crop',
          alt: 'Midwinter ramen bowl with chili oil and smoked mushrooms',
          aspectRatio: 4 / 3,
        },
      ],
      validFrom: getFormattedDate(120),
      validThrough: getFormattedDate(-1440),
      ctaButton: {
        label: 'Reserve a Bowl',
        href: '/restaurants/midnight-ramen-lab/menu?special=midwinter-bowl',
      },
      location: {
        restaurantId: 'ramen-lab',
        restaurantName: 'Midnight Ramen Lab',
        address: '245 King St S, Waterloo, ON',
        neighborhood: 'King Corridor',
        rating: 4.7,
      },
    },
  } satisfies FeedPost,
  {
    id: 'post-004',
    author: {
      type: 'mirch',
      id: 'mirch-editorial',
      name: 'Mirch Editorial',
      avatarUrl: '/mirch-logo.svg',
      role: 'editor',
      headline: 'Curated city eats & stories',
    },
    createdAt: getFormattedDate(240),
    audience: 'community',
    context: {
      reason: 'trending',
      detail: 'Popular in your circles',
    },
    stats: {
      reactions: {
        insightful: 88,
        support: 47,
      },
      comments: 12,
      saves: 72,
      shares: 36,
    },
    tags: ['Weekend Guide', 'Newsletter'],
    content: {
      type: 'newsletter',
      title: 'The Heat List: 5 Late-Night Kitchens Keeping Waterloo Warm',
      summary:
        'Our editors taste-tested the city’s after-hours spots so you don’t have to. From spicy tteokbokki to charcoal rotis, here’s where your crew should land post-midnight.',
      readingTimeMinutes: 6,
      coverImage: {
        id: 'media-newsletter',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1526382551041-3c817fc3d478?w=1200&h=800&fit=crop',
        alt: 'Friends sharing late-night street food',
        aspectRatio: 4 / 3,
      },
      canonicalUrl: '/stories/the-heat-list-late-night-waterloo',
      sections: [
        'Inside the kitchens still cooking after midnight',
        'Chef tips for ordering the off-menu hits',
        'Community picks from Mirch tastemakers',
      ],
    } satisfies FeedNewsletterContent,
  } satisfies FeedPost,
];

const feedContent: FeedResponse = {
  items: feedItems,
  cursor: undefined,
};

export function getMockHomeFeed(): FeedResponse {
  return feedContent;
}

export function getFeedItems(): FeedItem[] {
  return feedItems;
}

export function getFeedContentByType<T extends FeedContent['type']>(type: T): FeedPost[] {
  return feedItems.filter((item): item is FeedPost => 'content' in item && item.content.type === type);
}

