'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  BookmarkCheck,
  ChefHat,
  Compass,
  HeartHandshake,
  LineChart,
  Megaphone,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

const dinerHighlights = [
  {
    title: 'Curated lists from tastemakers',
    description:
      'Follow local food lovers and unlock the collections they actually recommend, not generic review site noise.',
    icon: Sparkles,
  },
  {
    title: 'Plan nights out together',
    description:
      'Build collaborative lists, vote on the next spot, and keep track of where the crew has already been.',
    icon: HeartHandshake,
  },
  {
    title: 'See what’s trending nearby',
    description:
      'Real-time activity lets you spot rising pop-ups, chef’s counters, and hidden gems before the lines form.',
    icon: Compass,
  },
];

const restaurantHighlights = [
  {
    title: 'Showcase what makes you special',
    description:
      'Tell your story with rich dish spotlights, seasonal menus, and behind-the-scenes updates.',
    icon: Megaphone,
  },
  {
    title: 'Understand your superfans',
    description:
      'Mirch highlights the diners who champion you most so you can reward loyalty and invite feedback.',
    icon: Users,
  },
  {
    title: 'Track performance in one glance',
    description:
      'Monitor reservations, sentiment, and engagement trends without combing through spreadsheets.',
    icon: LineChart,
  },
];

const platformFeatures = [
  {
    title: 'Social-first discovery',
    description:
      'A living food graph that stays fresh thanks to people you trust and creators who know the scene.',
    icon: Users,
  },
  {
    title: 'List building that sticks',
    description:
      'Save places once and access them everywhere, complete with status, notes, and who suggested it.',
    icon: BookmarkCheck,
  },
  {
    title: 'Stories from the kitchen',
    description:
      'Short-form video, chef spotlights, and behind-the-pass coverage keep diners engaged between visits.',
    icon: ChefHat,
  },
  {
    title: 'Signal-rich feedback loop',
    description:
      'Restaurants see the full journey: discovery → planning → visit → share. No more disconnected tools.',
    icon: Star,
  },
];

const previewTabs = [
  {
    id: 'feed',
    label: 'Diners Feed',
    eyebrow: 'Swipeable recommendations',
    title: 'Dinner plans stay inspired',
    description:
      'Personalized cards spotlight the dishes and lists friends are loving right now. Save, react, and share with a tap.',
    bullets: [
      'Rich cards with dish photos, creator notes, and map context',
      'Filter by neighborhood, cuisine, or the friend who shared it',
      'Sync with personal lists to track where you have been',
    ],
    cta: { label: 'Explore the diners app', href: '/diners' },
    media: {
      type: 'image' as const,
      src: '/mirch-logo-transparent.png',
      alt: 'Mirch app preview',
    },
  },
  {
    id: 'lists',
    label: 'Collaborative Lists',
    eyebrow: 'Plan with friends',
    title: 'Your shared tastebook',
    description:
      'Organize upcoming outings, track who has gone, and unlock community lists curated by top tastemakers.',
    bullets: [
      'Tap into curated collections ranked by mood, budget, or vibe',
      'Upvote places to decide the next group dinner',
      'Track status: Want to try, Booked, Visited, or Recommend',
    ],
    cta: { label: 'Build a list together', href: '/signup' },
    media: {
      type: 'gradient' as const,
    },
  },
  {
    id: 'restaurants',
    label: 'Restaurant Tools',
    eyebrow: 'Give restaurants superpowers',
    title: 'Insights that drive loyalty',
    description:
      'See in real time when creators shout you out, spotlight new menu drops, and keep the momentum going.',
    bullets: [
      'Unified dashboard for reservations, sentiment, and loyalty',
      'Launch limited drops or chef’s table seats to superfans',
      'Respond to shout-outs with media-ready assets',
    ],
    cta: { label: 'Tour the restaurant dashboard', href: '/restaurants' },
    media: {
      type: 'panel' as const,
    },
  },
];

function PreviewMedia({
  media,
}: {
  media: (typeof previewTabs)[number]['media'];
}) {
  if (media.type === 'image') {
    return (
      <div className="relative h-72 w-full overflow-hidden rounded-3xl border border-primary/20 bg-secondary/60 shadow-[0_18px_60px_rgba(138,66,214,0.15)]">
        <Image
          src={media.src}
          alt={media.alt}
          fill
          sizes="(max-width: 1024px) 100vw, 480px"
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/60 via-primary/20 to-transparent mix-blend-multiply" />
      </div>
    );
  }

  if (media.type === 'panel') {
    return (
      <div className="h-72 w-full rounded-3xl border border-border bg-gradient-to-br from-card/80 via-secondary/60 to-background p-6 shadow-[0_16px_60px_rgba(16,12,20,0.12)]">
        <div className="grid h-full gap-4">
          <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Today&apos;s orders</p>
              <span className="text-lg font-semibold text-primary">24</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              +12% vs yesterday · Most popular: Chili Garlic Noodles
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
            <p className="text-sm text-muted-foreground">Top advocates this week</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex justify-between">
                <span>Sara (Tastemaker)</span>
                <span className="text-primary">8 shout-outs</span>
              </li>
              <li className="flex justify-between">
                <span>Amit (Private group)</span>
                <span className="text-primary">5 bookings</span>
              </li>
              <li className="flex justify-between">
                <span>Neighborhood Bites List</span>
                <span className="text-primary">+72 saves</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-72 w-full overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-[1px]">
      <div className="h-full w-full rounded-[calc(theme(borderRadius.3xl)-1px)] bg-background/95 p-6">
        <div className="grid h-full gap-3">
          <div className="rounded-2xl border border-primary/40 bg-secondary/40 p-4">
            <p className="text-sm font-medium text-primary">Weekend crawl</p>
            <p className="text-xs text-muted-foreground mt-1">
              Friends added 3 new spots · Brunch kickoff at 11:30am
            </p>
          </div>
          <div className="rounded-2xl border border-primary/20 bg-secondary/30 p-4">
            <p className="text-sm font-medium text-primary">Votes in progress</p>
            <p className="text-xs text-muted-foreground mt-1">
              Late night dessert · 4 votes · Ends in 2 hours
            </p>
          </div>
          <div className="rounded-2xl border border-primary/20 bg-secondary/20 p-4">
            <p className="text-sm font-medium text-primary">Shared notes</p>
            <p className="text-xs text-muted-foreground mt-1">
              “Order the butter crab” · “Ask for chef tasting add-on”
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-background to-secondary/40">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(138,66,214,0.2),_transparent_55%)]" />
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-primary/30 bg-secondary/70">
              <Image
                src="/mirch-logo-transparent.png"
                alt="Mirch logo"
                fill
                sizes="36px"
                className="object-contain p-1.5"
                priority
              />
            </div>
            <div>
              <p className="text-sm font-medium text-primary">Mirch</p>
              <p className="text-xs text-muted-foreground">
                Social dining, reimagined
              </p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <Link href="#diners" className="transition-colors hover:text-primary">
              Diners
            </Link>
            <Link
              href="#restaurants"
              className="transition-colors hover:text-primary"
            >
              Restaurants
            </Link>
            <Link
              href="#platform"
              className="transition-colors hover:text-primary"
            >
              Platform
            </Link>
            <Link
              href="/login"
              className="transition-colors hover:text-primary"
            >
              Log in
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/signup">Join waitlist</Link>
            </Button>
            <Button asChild className="hidden sm:inline-flex">
              <Link href="/diners">
                Get started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-24 px-4 py-16 sm:px-6 sm:py-24">
        <section className="grid items-center gap-12 md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-secondary/60 px-4 py-2 text-sm text-primary">
              <Sparkles className="h-4 w-4" />
              <span>Powered by creators, tastemakers, and local legends</span>
            </div>
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-[3.2rem]">
                The food scene moves fast.
                <span className="text-primary"> Stay ahead with Mirch.</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground sm:max-w-xl">
                Discover the spots your friends cannot stop talking about, plan
                your next adventure together, and give restaurants the tools to
                keep the love going.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/diners">
                  For Diners
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/restaurants">
                  For Restaurants
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Prefer a tour?{' '}
              <Link href="/demo" className="font-medium text-primary">
                Watch the guided walkthrough →
              </Link>
            </p>
          </div>
          <div className="relative">
            <div className="absolute -inset-x-6 -top-10 h-[420px] rounded-[3rem] bg-gradient-to-br from-primary/25 via-primary/10 to-transparent blur-3xl" />
            <div className="relative overflow-hidden rounded-[2.5rem] border border-primary/20 bg-background shadow-[0_25px_80px_rgba(138,66,214,0.18)]">
              <div className="flex items-center justify-between border-b border-border/80 px-6 py-4">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Live around you
                </p>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  Mirch Feed
                </span>
              </div>
              <div className="space-y-6 px-6 py-8">
                <Card className="border border-primary/20 bg-secondary/50 shadow-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold text-foreground">
                      Bao Buns & Back Alley Cocktails
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Priyanka just unlocked a secret menu item — add it to your
                      list before the weekend.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between pt-0 text-sm text-muted-foreground">
                    <span>SoMa · 8 saves</span>
                    <button className="rounded-full border border-primary/40 px-3 py-1 text-xs font-medium text-primary transition hover:bg-primary hover:text-primary-foreground">
                      Save
                    </button>
                  </CardContent>
                </Card>
                <Card className="border border-primary/20 bg-background/90 shadow-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold text-foreground">
                      Saffron Supper Club
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Chef Razi is hosting a one-night tasting to preview the
                      monsoon menu.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between pt-0 text-sm text-muted-foreground">
                    <span>Mission · 12 spots left</span>
                    <button className="rounded-full border border-primary/40 px-3 py-1 text-xs font-medium text-primary transition hover:bg-primary hover:text-primary-foreground">
                      Request seat
                    </button>
                  </CardContent>
                </Card>
                <Card className="border border-primary/20 bg-secondary/70 shadow-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold text-foreground">
                      Neighborhood crawl: heat seekers
                    </CardTitle>
                    <CardDescription className="text-sm">
                      6 stops · curated by Ashok · 45 people following this week.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between pt-0 text-sm text-muted-foreground">
                    <span>Status: Planning</span>
                    <button className="rounded-full border border-primary/40 px-3 py-1 text-xs font-medium text-primary transition hover:bg-primary hover:text-primary-foreground">
                      Join list
                    </button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section id="diners" className="space-y-10">
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              Diners, meet your new home base
            </h2>
            <p className="max-w-2xl text-base text-muted-foreground">
              Mirch turns the group chat, the saved notes doc, and the map pins
              into one living feed. Follow trusted creators and friends to keep
              discovering without losing your personal flavor.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {dinerHighlights.map(({ title, description, icon: Icon }) => (
              <Card
                key={title}
                className="relative overflow-hidden border border-primary/15 bg-background/90 transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_18px_40px_rgba(138,66,214,0.12)]"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary/60 to-primary/20" />
                <CardHeader className="space-y-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <CardTitle className="text-lg">{title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
          <div className="flex flex-col gap-3 rounded-3xl border border-primary/15 bg-secondary/50 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Beta access</p>
              <p className="text-base text-muted-foreground">
                We drop batches of invites every week. Grab your spot now.
              </p>
            </div>
            <div className="flex gap-3">
              <Button asChild>
                <Link href="/signup">Join the diner waitlist</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/videos">See Mirch in action</Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="restaurants" className="space-y-10">
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              Built with restaurants, not just for them
            </h2>
            <p className="max-w-2xl text-base text-muted-foreground">
              Mirch keeps your story front and center. Highlight seasonal dishes,
              turn your superfans into storytellers, and use real-time insights to
              keep tables full.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {restaurantHighlights.map(({ title, description, icon: Icon }) => (
              <Card
                key={title}
                className="relative overflow-hidden border border-primary/15 bg-background/90 transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_18px_40px_rgba(138,66,214,0.12)]"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary/60 to-primary/20" />
                <CardHeader className="space-y-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <CardTitle className="text-lg">{title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
          <div className="flex flex-col gap-3 rounded-3xl border border-primary/15 bg-background/80 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Early partner program</p>
              <p className="text-base text-muted-foreground">
                We accept a handful of new restaurant partners each month.
              </p>
            </div>
            <div className="flex gap-3">
              <Button asChild>
                <Link href="/restaurants">See the dashboard</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/demo">Book a walkthrough</Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="platform" className="space-y-10">
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              One platform, shared momentum
            </h2>
            <p className="max-w-2xl text-base text-muted-foreground">
              Diners, creators, and operators stay in sync. Mirch makes every
              recommendation actionable and every visit measurable.
            </p>
          </div>
          <Tabs defaultValue={previewTabs[0]?.id ?? 'feed'} className="space-y-8">
            <TabsList>
              {previewTabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {previewTabs.map((tab) => (
              <TabsContent
                key={tab.id}
                value={tab.id}
                className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center"
              >
                <div className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                    {tab.eyebrow}
                  </p>
                  <h3 className="text-2xl font-semibold text-foreground">
                    {tab.title}
                  </h3>
                  <p className="text-base text-muted-foreground">
                    {tab.description}
                  </p>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    {tab.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3">
                        <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild size="lg" className="mt-6">
                    <Link href={tab.cta.href}>{tab.cta.label}</Link>
                  </Button>
                </div>
                <PreviewMedia media={tab.media} />
              </TabsContent>
            ))}
          </Tabs>
          <div className="grid gap-6 md:grid-cols-2">
            {platformFeatures.map(({ title, description, icon: Icon }) => (
              <Card
                key={title}
                className="border border-primary/15 bg-background/95 transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_18px_40px_rgba(138,66,214,0.12)]"
              >
                <CardHeader className="flex items-start gap-4">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="space-y-2">
                    <CardTitle className="text-lg">{title}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                      {description}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/12 via-primary/5 to-transparent p-8 sm:p-12">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                Join the beta
              </p>
              <h3 className="text-3xl font-semibold text-foreground sm:text-4xl">
                Ready when you are.
              </h3>
              <p className="max-w-xl text-base text-muted-foreground">
                Whether you are scouting the next dinner party, curating lists for
                thousands, or running a beloved kitchen, Mirch gives you the tools
                to turn every recommendation into a memorable meal.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:w-72">
              <Button size="lg" asChild>
                <Link href="/signup">Claim your invite</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/newsletter">Get product updates</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 bg-background/70 py-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} Mirch Labs. Crafted with love for the food world.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-primary">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-primary">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-primary">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
