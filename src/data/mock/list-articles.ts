import restaurants from "@/data/mock/restaurants.json";
import type { Restaurant } from "@/types/video";

export type ListArticleType = "featured" | "curated";

export interface DishHighlight {
  id: string;
  name: string;
  description: string;
  image: string;
  price?: number;
  tags?: string[];
}

export interface ListArticleEntry {
  id: string;
  rank: number;
  title: string;
  dek: string;
  body: string;
  featuredImage: string;
  restaurantId: string;
  contextTips?: string[];
  dishHighlights?: DishHighlight[];
}

export interface ListArticleSummaryBase {
  type: ListArticleType;
  imageUrl: string;
  shortTitle?: string;
  subtitle?: string;
  description?: string;
  categoryLabel?: string;
  count?: number;
  total?: number;
  visited?: number;
  locationLabel?: string;
}

export interface ListArticle {
  slug: string;
  title: string;
  heroImage: string;
  heroImageAlt?: string;
  intro: string;
  updatedAt?: string;
  location?: string;
  author?: {
    name: string;
    avatar?: string;
    role?: string;
  };
  tags?: string[];
  summary: ListArticleSummaryBase;
  entries: ListArticleEntry[];
}

const restaurantMap: Record<string, Restaurant> = (restaurants as Restaurant[]).reduce(
  (acc, restaurant) => {
    acc[restaurant.id] = restaurant;
    return acc;
  },
  {} as Record<string, Restaurant>
);

export const listArticles: ListArticle[] = [
  {
    slug: "north-america-50-best",
    title: "North America's 50 Best Restaurants (Starter Set)",
    heroImage:
      "https://images.unsplash.com/photo-1543352634-873f17a7a088?w=1200&h=800&fit=crop&auto=format",
    heroImageAlt: "Elegant dining room with city skyline view",
    intro:
      "We tasted through a year's worth of reservations to build the starter set for the continent's big 50. These three spots capture the energy, ingredient obsession, and service finesse that define the list.",
    updatedAt: "May 2024",
    location: "North America",
    author: {
      name: "Mirch Editorial Team",
      role: "Dining Guides",
    },
    tags: ["Rankings", "Best Of", "Tasting Menus"],
    summary: {
      type: "featured",
      imageUrl:
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop&auto=format",
      subtitle: "You've been to 0 of 50",
      total: 50,
      visited: 0,
    },
    entries: [
      {
        id: "north-america-1",
        rank: 1,
        title: restaurantMap["1"]?.name ?? "The Spice House",
        dek: "Hyper-flavor Thai tasting in a room that feels like Bangkok's design district.",
        body:
          "Chef Arisa Sutthikul leans on locally grown makrut lime, cherry bomb chiles, and Ontario shrimp paste to build a 12-course tasting that shatters the tired expectations of \"fusion\" cooking. The Massaman arrives tableside in a copper pot perfumed with smoked cinnamon, while dessert riffs on mango sticky rice with condensed-milk soft serve.",
        featuredImage:
          "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&h=700&fit=crop&auto=format",
        restaurantId: "1",
        contextTips: [
          "Request bar counter seats to watch the curry paste pounding up close.",
          "Pair the Massaman with their tamarind old fashioned—it balances the richness perfectly.",
        ],
        dishHighlights: [
          {
            id: "1-massaman",
            name: "Massaman Curry",
            description: "Wagyu brisket, Yukon golds, toasted peanuts, and charred pearl onions.",
            image:
              "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=400&fit=crop&auto=format",
            price: 19.99,
            tags: ["Signature", "Slow Simmered"],
          },
          {
            id: "1-basil-beef",
            name: "Thai Basil Beef",
            description: "Loaded with holy basil, bird's eye chiles, and roasted cashews.",
            image:
              "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop&auto=format",
            price: 18.99,
            tags: ["Spicy", "Guest Favorite"],
          },
        ],
      },
      {
        id: "north-america-2",
        rank: 2,
        title: restaurantMap["8"]?.name ?? "Skyline Spirits",
        dek: "Toronto's skyline bar that behaves like a chef's counter once the sun sets.",
        body:
          "Skyline Spirits might read cocktail bar, but the bar team keeps a fermentation log that rivals the kitchens down the street. Order the smoked maple old fashioned and an off-menu oyster flight; the crew will walk you through a tasting like they're narrating a film.",
        featuredImage:
          "https://images.unsplash.com/photo-1556740749-887f6717d7e4?w=900&h=700&fit=crop&auto=format",
        restaurantId: "8",
        contextTips: [
          "Reserve the corner banquette for the best view of sunset over King Street.",
          "Ask for the barrel-aged Negroni that isn't on the printed menu.",
        ],
        dishHighlights: [
          {
            id: "8-caviar-toast",
            name: "Sturgeon Caviar Toast",
            description: "Brioche, cultured butter, golden Osetra, and fines herbes.",
            image:
              "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=400&fit=crop&auto=format",
            price: 24.0,
            tags: ["Lux", "Small Plate"],
          },
          {
            id: "8-maple-old-fashioned",
            name: "Smoked Maple Old Fashioned",
            description: "Canadian rye, cedar smoke, dark maple, and orange oil.",
            image:
              "https://images.unsplash.com/photo-1558640472-9d2a7deb7f62?w=400&h=400&fit=crop&auto=format",
            price: 18.0,
            tags: ["Cocktail", "Signature Pour"],
          },
        ],
      },
      {
        id: "north-america-3",
        rank: 3,
        title: restaurantMap["6"]?.name ?? "Tokyo Tide Sushi",
        dek: "A 16-seat omakase that treats Toyosu tuna with gospel-level reverence.",
        body:
          "Chef Kei Nakamura lands three Toyosu shipments a week and the team calibrates rice seasoning to match the day's humidity. The toro flight is showstopping, but the sleeper hit is the ankimo torchon with yuzu kosho. Expect a playlist that nods to Shibuya jazz bars circa 1978.",
        featuredImage:
          "https://images.unsplash.com/photo-1544145945-94d51a0d7b58?w=900&h=700&fit=crop&auto=format",
        restaurantId: "6",
        contextTips: [
          "Arrive ten minutes early; the welcome tea service sets the tone.",
          "If you're celebrating, flag it—there's a special dessert nigiri with A5 wagyu.",
        ],
        dishHighlights: [
          {
            id: "6-toro-flight",
            name: "Toro Omakase Flight",
            description: "Chutoro, otoro, and charcoal-kissed kamatoro.",
            image:
              "https://images.unsplash.com/photo-1546069901-eacef0df6022?w=400&h=400&fit=crop&auto=format",
            price: 48.0,
            tags: ["Omakase", "Lux"],
          },
          {
            id: "6-uni-spoon",
            name: "Hokkaido Uni Spoon",
            description: "Uni, quail egg, squid ink sushi rice, and citrus salt.",
            image:
              "https://images.unsplash.com/photo-1542736667-069246bdbc84?w=400&h=400&fit=crop&auto=format",
            price: 32.0,
            tags: ["Seasonal", "Shellfish"],
          },
        ],
      },
    ],
  },
  {
    slug: "toronto-top-cocktail-bars",
    title: "Top 20 Toronto Cocktail Bars",
    heroImage:
      "https://images.unsplash.com/photo-1455621481073-d5bc1c40c177?w=1200&h=800&fit=crop&auto=format",
    intro:
      "From barrel-aged Manhattans to zero-proof flights, these Toronto bars are pushing the city's drinking culture forward.",
    updatedAt: "April 2024",
    location: "Toronto, ON",
    author: {
      name: "Kaya Desai",
      role: "City Editor",
    },
    tags: ["Cocktails", "Toronto", "Nightlife"],
    summary: {
      type: "featured",
      imageUrl:
        "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&h=600&fit=crop&auto=format",
      subtitle: "You've been to 0 of 20",
      total: 20,
      visited: 0,
    },
    entries: [
      {
        id: "toronto-cocktails-1",
        rank: 1,
        title: restaurantMap["8"]?.name ?? "Skyline Spirits",
        dek: "Panorama views, vinyl-only playlists, and cedar-smoked old fashioneds.",
        body:
          "Skyline is the bar you bring your out-of-towners to. The cedar-smoked Old Fashioned is dramatic, but the team is just as comfortable riffing on zero-proof pairings for the raw bar. Ask about the barrel-aged Negroni—they always have a barrel quietly resting in the back room.",
        featuredImage:
          "https://images.unsplash.com/photo-1558640472-9d2a7deb7f62?w=900&h=700&fit=crop&auto=format",
        restaurantId: "8",
        dishHighlights: [
          {
            id: "8-zero-proof-flight",
            name: "Citrus & Spice Flight",
            description: "Three-course zero-proof pairing with verjus, smoked tea, and peppercorn tonic.",
            image:
              "https://images.unsplash.com/photo-1481391032119-d89fee407e29?w=400&h=400&fit=crop&auto=format",
            price: 21.0,
            tags: ["Zero Proof"],
          },
        ],
      },
      {
        id: "toronto-cocktails-2",
        rank: 2,
        title: restaurantMap["1"]?.name ?? "The Spice House",
        dek: "Chef-driven cocktails with Thai pantry staples—think galangal, makrut, and coconut.",
        body:
          "The bar program mirrors the kitchen's obsession with layering. Order the tom kha fizz for an aromatic sipper that leans savory with lemongrass oil and mushroom tincture.",
        featuredImage:
          "https://images.unsplash.com/photo-1604908177555-937c7de93c04?w=900&h=700&fit=crop&auto=format",
        restaurantId: "1",
      },
      {
        id: "toronto-cocktails-3",
        rank: 3,
        title: restaurantMap["3"]?.name ?? "Burger Palace",
        dek: "Come for the double smash, stay for the aged-rum milk punch.",
        body:
          "Burger Palace's speakeasy back room keeps the grills fired for late-night sliders. The clarified milk punch is a revelation after midnight.",
        featuredImage:
          "https://images.unsplash.com/photo-1544145945-94d51a0d7b58?w=900&h=700&fit=crop&auto=format",
        restaurantId: "3",
      },
    ],
  },
  {
    slug: "nyc-vietnamese-top-15",
    title: "Top 15 NYC Vietnamese Restaurants",
    heroImage:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=800&fit=crop&auto=format",
    intro:
      "From Hanoi-style bun cha to Saigon street snacks, these Vietnamese kitchens are where NYC diners are spending their reservations.",
    updatedAt: "March 2024",
    location: "New York, NY",
    author: {
      name: "Amelia Tran",
      role: "Vietnamese Food Writer",
    },
    tags: ["Vietnamese", "NYC", "Dining Guides"],
    summary: {
      type: "curated",
      imageUrl:
        "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&h=600&fit=crop&auto=format",
      shortTitle: "Top 15 NYC Vietnamese",
      description: "The top 15 NYC Vietnamese restaurants, as ranked by members",
      categoryLabel: "Vietnamese",
      count: 15,
      locationLabel: "New York",
    },
    entries: [
      {
        id: "nyc-viet-1",
        rank: 1,
        title: restaurantMap["4"]?.name ?? "Saigon Social",
        dek: "Broths that simmer for 24 hours and rooftop-grown herbs.",
        body:
          "Saigon Social has become the LES anchor for Vietnamese comfort food. Chef Helen Nguyen layers beef bones, charred onions, and fish sauce for a pho tai that has depth for days.",
        featuredImage:
          "https://images.unsplash.com/photo-1604908177555-937c7de93c04?w=900&h=700&fit=crop&auto=format",
        restaurantId: "4",
        contextTips: [
          "Go early for the bánh mì; they sell out by 7.",
          "Ask about the seasonal produce from the rooftop garden.",
        ],
        dishHighlights: [
          {
            id: "4-pho-tai",
            name: "Pho Tai",
            description: "Wagyu eye of round, star anise broth, and rice noodles.",
            image:
              "https://images.unsplash.com/photo-1612874470087-70aa23627758?w=400&h=400&fit=crop&auto=format",
            price: 19.5,
            tags: ["Signature", "Broth Lover"],
          },
          {
            id: "4-crispy-rolls",
            name: "Saigon Crispy Rolls",
            description: "Crab, shiitake, glass noodles, and nuoc cham dip.",
            image:
              "https://images.unsplash.com/photo-1604908177555-937c7de93c04?w=400&h=400&fit=crop&auto=format",
            price: 14.0,
            tags: ["Snack", "Crunchy"],
          },
        ],
      },
      {
        id: "nyc-viet-2",
        rank: 2,
        title: restaurantMap["1"]?.name ?? "The Spice House",
        dek: "Thai on the sign, but a Vietnamese sandwich worth the trip.",
        body:
          "Chef Arisa channels her time in Saigon with a bánh mì that loads in house-made cha lua and pickled papaya. It's the sleeper menu item locals gatekeep.",
        featuredImage:
          "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=900&h=700&fit=crop&auto=format",
        restaurantId: "1",
      },
      {
        id: "nyc-viet-3",
        rank: 3,
        title: restaurantMap["3"]?.name ?? "Burger Palace",
        dek: "Vietnamese-inspired burger with nuoc cham caramelized onions.",
        body:
          "Burger Palace flips a monthly special burger informed by Southeast Asian pantry staples. The fish sauce caramel adds savory depth.",
        featuredImage:
          "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=900&h=700&fit=crop&auto=format",
        restaurantId: "3",
      },
    ],
  },
  {
    slug: "nyc-filipino-top-10",
    title: "Top 10 NYC Filipino Restaurants",
    heroImage:
      "https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=1200&h=800&fit=crop&auto=format",
    intro:
      "Lechon, kinilaw, and kamayan feasts—these are the Filipino spots our members line up for.",
    updatedAt: "March 2024",
    location: "New York, NY",
    author: {
      name: "Miguel Santos",
      role: "Community Curator",
    },
    tags: ["Filipino", "NYC", "Community Picks"],
    summary: {
      type: "curated",
      imageUrl:
        "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&h=600&fit=crop&auto=format",
      description: "The top 10 NYC Filipino restaurants, as ranked by members",
      categoryLabel: "Filipino",
      count: 10,
    },
    entries: [
      {
        id: "nyc-filipino-1",
        rank: 1,
        title: restaurantMap["5"]?.name ?? "Baryo Fiesta",
        dek: "Kamayan feasts with bottomless calamansi spritz.",
        body:
          "Baryo Fiesta is the party restaurant that manages to balance energy and precise cooking. The chicken inasal should be eaten with your hands—dip it in sawsawan and chase with garlic rice.",
        featuredImage:
          "https://images.unsplash.com/photo-1599351431202-1e0f0137899d?w=900&h=700&fit=crop&auto=format",
        restaurantId: "5",
        dishHighlights: [
          {
            id: "5-inasal",
            name: "Chicken Inasal",
            description: "Calamansi-brushed grilled chicken with ginger vinegar dip.",
            image:
              "https://images.unsplash.com/photo-1599351431202-1e0f0137899d?w=400&h=400&fit=crop&auto=format",
            price: 21.0,
            tags: ["Grilled", "Signature"],
          },
          {
            id: "5-halo-halo",
            name: "Ube Halo-Halo",
            description: "Shaved ice, leche flan, and house-made ube ice cream.",
            image:
              "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=400&h=400&fit=crop&auto=format",
            price: 12.0,
            tags: ["Dessert"],
          },
        ],
      },
    ],
  },
  {
    slug: "nyc-sushi-top-15",
    title: "Top 15 NYC Sushi Counters",
    heroImage:
      "https://images.unsplash.com/photo-1553621042-f6e147245754?w=1200&h=800&fit=crop&auto=format",
    intro:
      "The counters to reserve now—from hidden eight-seat dens to power omakase palaces.",
    updatedAt: "February 2024",
    location: "New York, NY",
    tags: ["Sushi", "NYC", "Omakase"],
    summary: {
      type: "curated",
      imageUrl:
        "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop&auto=format",
      description: "The top 15 sushi restaurants in NYC, as ranked by members",
      categoryLabel: "Sushi",
      count: 15,
    },
    entries: [
      {
        id: "nyc-sushi-1",
        rank: 1,
        title: restaurantMap["6"]?.name ?? "Tokyo Tide Sushi",
        dek: "Sixteen courses, Toyosu fish, and a soundtrack of Shibuya jazz.",
        body:
          "Chef Kei's omakase moves cleanly from Hokkaido scallop to charcoal-seared kinmedai. The rice is seasoned in three ways depending on the fish.",
        featuredImage:
          "https://images.unsplash.com/photo-1546069901-eacef0df6022?w=900&h=700&fit=crop&auto=format",
        restaurantId: "6",
      },
    ],
  },
  {
    slug: "nyc-spanish-top-10",
    title: "Top 10 NYC Spanish Restaurants",
    heroImage:
      "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=1200&h=800&fit=crop&auto=format",
    intro:
      "Sherry programs, wood-fired paellas, and cava-soaked evenings—the Spanish tables to book now.",
    updatedAt: "January 2024",
    location: "New York, NY",
    summary: {
      type: "curated",
      imageUrl:
        "https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=800&h=600&fit=crop&auto=format",
      description: "The top 10 Spanish restaurants in NYC, as ranked by members",
      categoryLabel: "Spanish",
      count: 10,
    },
    entries: [
      {
        id: "nyc-spanish-1",
        rank: 1,
        title: restaurantMap["7"]?.name ?? "Casa Flamenca",
        dek: "Live flamenco, sherry flights, and paella that hits before the second set.",
        body:
          "Casa Flamenca keeps Valencia alive in the Village. The paella lands with crispy socarrat and prawns the size of your palm.",
        featuredImage:
          "https://images.unsplash.com/photo-1543353071-873f17a7a088?w=900&h=700&fit=crop&auto=format",
        restaurantId: "7",
        dishHighlights: [
          {
            id: "7-paella",
            name: "Seafood Paella",
            description: "Bomba rice, saffron, prawns, mussels, and calamari.",
            image:
              "https://images.unsplash.com/photo-1543353071-873f17a7a088?w=400&h=400&fit=crop&auto=format",
            price: 34.0,
            tags: ["Shareable", "Classic"],
          },
        ],
      },
    ],
  },
];

export function getListArticle(slug: string): ListArticle | undefined {
  return listArticles.find((article) => article.slug === slug);
}

export function getRestaurantForEntry(restaurantId: string): Restaurant | undefined {
  return restaurantMap[restaurantId];
}

export function getListSummaries(type: ListArticleType) {
  return listArticles.filter((article) => article.summary.type === type);
}
