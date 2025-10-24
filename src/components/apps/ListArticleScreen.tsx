"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  MapPin,
  Star,
  DollarSign,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type DishHighlight,
  type ListArticle,
  type ListArticleEntry,
  getRestaurantForEntry,
} from "@/data/mock/list-articles";
import { RestaurantDrawer } from "@/components/restaurant/RestaurantDrawer";
import { RestaurantPage } from "@/components/restaurant/RestaurantPage";
import { RestaurantMenuPage } from "@/components/restaurant/RestaurantMenuPage";
import type { Restaurant } from "@/types/video";

interface ListArticleScreenProps {
  article: ListArticle;
}

interface MenuSectionItem {
  id: string;
  name: string;
  description?: string;
  price?: number;
  image?: string;
}

interface MenuData {
  title?: string;
  sections: Array<{ title: string; items: MenuSectionItem[] }>;
}

export function ListArticleScreen({ article }: ListArticleScreenProps) {
  const router = useRouter();
  const [selectedRestaurant, setSelectedRestaurant] =
    React.useState<Restaurant | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [restaurantPageOpen, setRestaurantPageOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [menuData, setMenuData] = React.useState<MenuData | null>(null);

  const heroAlt = article.heroImageAlt ?? `${article.title} hero image`;

  const handleNavigateBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/diners");
  };

  const ensureRestaurant = React.useCallback(
    (entry: ListArticleEntry): Restaurant | null => {
      const restaurant = getRestaurantForEntry(entry.restaurantId);
      if (!restaurant) {
        console.warn(
          `Restaurant data not found for id "${entry.restaurantId}"`
        );
        return null;
      }
      setSelectedRestaurant(restaurant);
      return restaurant;
    },
    []
  );

  const openQuickView = (entry: ListArticleEntry) => {
    const restaurant = ensureRestaurant(entry);
    if (!restaurant) return;
    setDrawerOpen(true);
  };

  const openFullRestaurantPage = (entry: ListArticleEntry) => {
    const restaurant = ensureRestaurant(entry);
    if (!restaurant) return;
    setRestaurantPageOpen(true);
  };

  const buildMenuData = (
    restaurant: Restaurant,
    entry: ListArticleEntry,
    highlight?: DishHighlight
  ): MenuData | null => {
    const highlights = highlight ? [highlight] : entry.dishHighlights ?? [];
    if (!highlights.length) return null;

    return {
      title: `${restaurant.name} — Dish Highlights`,
      sections: [
        {
          title: highlight ? "Selected Dish" : "Signature Picks",
          items: highlights.map((dish) => ({
            id: dish.id,
            name: dish.name,
            description: dish.description,
            price: dish.price,
            image: dish.image,
          })),
        },
      ],
    };
  };

  const openMenu = (entry: ListArticleEntry, highlight?: DishHighlight) => {
    const restaurant = ensureRestaurant(entry);
    if (!restaurant) return;
    const data = buildMenuData(restaurant, entry, highlight);
    if (!data) return;
    setMenuData(data);
    setMenuOpen(true);
  };

  const renderStat = (icon: React.ReactNode, label: string) => (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
      {icon}
      <span>{label}</span>
    </span>
  );

  const renderKeyFacts = (entry: ListArticleEntry) => {
    const restaurant = getRestaurantForEntry(entry.restaurantId);
    if (!restaurant) return null;

    const facts: React.ReactNode[] = [];

    if (restaurant.rating) {
      facts.push(
        renderStat(
          <Star className="h-3.5 w-3.5 fill-current" />,
          `${restaurant.rating.toFixed(1)} rating`
        )
      );
    }

    if (restaurant.distance) {
      facts.push(
        renderStat(<MapPin className="h-3.5 w-3.5" />, restaurant.distance)
      );
    }

    if (restaurant.priceRange) {
      facts.push(
        renderStat(
          <DollarSign className="h-3.5 w-3.5" />,
          restaurant.priceRange
        )
      );
    }

    if (restaurant.cuisine) {
      facts.push(
        renderStat(
          <UtensilsCrossed className="h-3.5 w-3.5" />,
          restaurant.cuisine
        )
      );
    }

    return (
      <div className="flex flex-wrap items-center gap-2">
        {facts.map((fact, index) => (
          <React.Fragment key={index}>{fact}</React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative h-[320px] w-full overflow-hidden">
        <Image
          src={article.heroImage}
          alt={heroAlt}
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/10" />

        <div className="absolute top-6 left-6">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60"
            onClick={handleNavigateBack}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 px-6 pb-10">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 backdrop-blur">
              {article.location ?? "Editors' Picks"}
            </div>
            <h1
              className="text-3xl font-semibold leading-tight text-white md:text-4xl"
              style={{
                textShadow: "0 12px 28px rgba(0,0,0,0.4)",
              }}
            >
              {article.title}
            </h1>
            {article.updatedAt && (
              <p className="text-sm text-white/80">
                Updated {article.updatedAt}
              </p>
            )}
          </div>
        </div>
      </div>

      <article className="mx-auto w-full max-w-4xl px-6 pb-24">
        <header className="space-y-4 pt-8">
          {article.author && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="h-8 w-8 rounded-full bg-primary/20" />
              <div>
                <p className="font-medium text-foreground">
                  {article.author.name}
                </p>
                {article.author.role && <p>{article.author.role}</p>}
              </div>
            </div>
          )}
          <p className="text-lg leading-relaxed text-muted-foreground">
            {article.intro}
          </p>
          {article.tags && (
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        <div className="mt-12 space-y-10">
          {article.entries.map((entry) => (
            <section
              key={entry.id}
              className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-lg shadow-black/5 transition-transform hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="grid gap-0 md:grid-cols-[260px,1fr]">
                <div className="relative h-56 md:h-full">
                  <Image
                    src={entry.featuredImage}
                    alt={entry.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-black/10 to-transparent" />
                  {/* <div className="absolute top-4 left-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-lg font-bold text-primary shadow-xl">
                    #{entry.rank}
                  </div> */}
                </div>

                <div className="space-y-3 p-6">
                  <div className="">
                    <div className="flex flex-wrap items-center justify-between">
                      <h2 className="text-2xl font-semibold text-foreground">
                        {entry.title}
                      </h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-xs font-semibold text-primary"
                        onClick={() => openFullRestaurantPage(entry)}
                      >
                        View restaurant
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </div>
                    {/* <p className="text-sm font-medium text-muted-foreground">{entry.dek}</p> */}
                    <p className="text-base text-muted-foreground/90">
                      {entry.body}
                    </p>
                  </div>

                  {renderKeyFacts(entry)}

                  {entry.contextTips && entry.contextTips.length > 0 && (
                    <div className="space-y-2 rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                        Insider Tips
                      </p>
                      <ul className="space-y-1.5">
                        {entry.contextTips.map((tip, tipIndex) => (
                          <li key={tipIndex} className="flex gap-2">
                            <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <Button
                      className="rounded-2xl px-5"
                      onClick={() => openQuickView(entry)}
                    >
                      Quick glance
                    </Button>
                    {entry.dishHighlights &&
                      entry.dishHighlights.length > 0 && (
                        <Button
                          variant="outline"
                          className="rounded-2xl px-5"
                          onClick={() => openMenu(entry)}
                        >
                          Browse dishes
                        </Button>
                      )}
                  </div>

                  {entry.dishHighlights && entry.dishHighlights.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Dish spotlights
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {entry.dishHighlights.map((dish) => (
                          <div
                            key={dish.id}
                            className="flex gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4 transition-colors hover:border-primary/40 hover:bg-primary/10"
                          >
                            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl">
                              <Image
                                src={dish.image}
                                alt={dish.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-sm font-semibold text-foreground">
                                  {dish.name}
                                </h4>
                                {typeof dish.price === "number" && (
                                  <span className="text-xs font-semibold text-primary">
                                    ${dish.price.toFixed(2)}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-3">
                                {dish.description}
                              </p>
                              {dish.tags && (
                                <div className="flex flex-wrap gap-1">
                                  {dish.tags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 gap-1 px-2 text-xs text-primary"
                                  onClick={() => openMenu(entry, dish)}
                                >
                                  Rate or review
                                  <ArrowUpRight className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          ))}
        </div>
      </article>

      {selectedRestaurant && (
        <>
          <RestaurantDrawer
            isOpen={drawerOpen}
            onClose={() => {
              setDrawerOpen(false);
              setSelectedRestaurant(null);
            }}
            onExpand={() => {
              setDrawerOpen(false);
              setRestaurantPageOpen(true);
            }}
            restaurant={selectedRestaurant}
          />
          <RestaurantPage
            isOpen={restaurantPageOpen}
            onClose={() => {
              setRestaurantPageOpen(false);
              setSelectedRestaurant(null);
            }}
            restaurant={selectedRestaurant}
          />
        </>
      )}

      {selectedRestaurant && menuData && (
        <RestaurantMenuPage
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          onConfirm={(item) => {
            console.log("Selected dish for review:", item);
            setMenuOpen(false);
          }}
          restaurantName={selectedRestaurant.name}
          menu={menuData}
        />
      )}
    </div>
  );
}
