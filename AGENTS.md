# This file provides guidance to AI coding Agents when working with code in this repository

## Project Overview

Mirch is a mobile-first restaurant discovery and social platform built as a Progressive Web App (PWA) with Capacitor for native iOS/Android capabilities. The app targets iPhone 14 Pro Max (430×932 viewport) as the primary design target.

**Tech Stack:**

- Next.js 15 (App Router, React Server Components)
- React 19
- TypeScript
- Tailwind CSS v4 with shadcn/ui components
- Supabase (authentication, database)
- Puppeteer (web scraping)
- next-pwa (Progressive Web App)
- Capacitor (native mobile wrapper)

## Development Commands

**Package Manager:** This project uses `pnpm`. The version is locked via `packageManager` field in package.json.

```bash
# Development server with Turbopack
pnpm dev

# Production build with Turbopack
pnpm build

# Start production server
pnpm start

# Linting
pnpm lint

# Add shadcn/ui components
npx shadcn@latest add [component-name]
```

## Architecture

### Directory Structure

```text
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # API route handlers
│   │   ├── menu/         # Menu parsing endpoints
│   │   ├── places/       # Google Places API integration
│   │   └── restaurant/   # Restaurant CRUD + scraping
│   ├── auth/             # Authentication flows
│   ├── diners/           # Diners subdomain pages
│   ├── restaurants/      # Restaurant discovery pages
│   ├── videos/           # Video feed pages
│   └── onboarding/       # User onboarding flow
├── components/           # React components
│   ├── ui/              # shadcn/ui components (button, card, input, etc.)
│   ├── feed/            # Feed-related components
│   ├── restaurant/      # Restaurant-specific components
│   ├── video/           # Video player components
│   └── layouts/         # Layout components
├── lib/                 # Core business logic
│   └── scraper/        # Restaurant website scraping utilities
│       ├── puppeteerScraper.ts    # Main scraper
│       ├── menuParser.ts          # Menu text parsing
│       └── googleMapsScraper.ts   # Google Maps data extraction
├── platform/            # Platform abstraction layer (web/native)
│   ├── device.ts       # Device detection and adapter
│   ├── web/           # Web-specific implementations
│   └── native/        # Capacitor native implementations
├── utils/
│   └── supabase/      # Supabase client utilities
│       ├── client.ts  # Browser client
│       └── server.ts  # Server client (RSC)
├── types/             # TypeScript type definitions
│   └── database.types.ts  # Generated Supabase types
├── hooks/             # Custom React hooks
├── data/              # Static data and mocks
└── features/          # Feature-specific modules
```

### Key Architectural Patterns

#### 1. Platform Abstraction (`src/platform/`)

- The app uses a device abstraction layer to support both web and native (Capacitor) environments
- `getDevice()` dynamically loads the appropriate platform implementation
- Always use `getDevice()` for platform-specific functionality (camera, haptics, etc.)
- Native code is lazy-loaded to avoid bundling Capacitor dependencies in web builds

#### 2. Supabase Integration

- Use `createClient()` from `@/utils/supabase/client` in Client Components
- Use `createClient()` from `@/utils/supabase/server` in Server Components/Actions
- Middleware refreshes auth sessions automatically (see `middleware.ts`)
- Database types are auto-generated in `src/types/database.types.ts`

#### 3. Subdomain Routing

- `diners` subdomain routes to `/diners/*` paths via middleware rewrite
- Middleware handles auth session refresh for all routes
- Auth/onboarding routes are shared across subdomains

#### 4. Restaurant Data Scraping

- Puppeteer-based scraper in `src/lib/scraper/puppeteerScraper.ts`
- Handles dropdowns, lazy loading, SPAs, iframes, multi-location menus
- Target scrape time: <30 seconds for 95% of sites
- Menu parsing uses GPT-4 for structure extraction (`src/lib/scraper/menuParser.ts`)

#### 5. Progressive Web App (PWA)

- Configured with `next-pwa` in `next.config.ts`
- Custom caching strategies for images, API calls, static assets, fonts
- Service worker enabled in both dev and production

#### 6. Mobile-First UI (see detailed rules below)

- Base styles target 430px (iPhone 14 Pro Max)
- All components use shadcn/ui from `@/components/ui/*`
- Tailwind v4 with custom design tokens
- Safe area insets respected for iOS notch/home indicator

## UI/UX Standards

**Goal:** "Uber elegant, sleek, liquid glass" UI, mobile-first and responsive.

### Authoring Principles

- **Mobile first:** Implement base styles for 430px width; extend with `sm`, `md`, `lg` breakpoints
- **Spacious & minimal:** Generous white space, clear hierarchy, no visual clutter
- **Subtle depth:** Prefer `ring-1 ring-black/5` and `shadow-sm` over heavy shadows
- **Rounded geometry:** Default `rounded-xl` on cards, inputs, buttons
- **Accessible contrast:** Meet WCAG AA; use `focus-visible:ring-2` with brand color
- **Motion:** Gentle, fast transitions (`transition`, `duration-200`, `ease-out`). Avoid large/constant animations
- **Dark mode:** Provide `dark:` variants for background, text, rings, borders
- **Touch targets:** Minimum 44×44px; avoid tiny tap areas and thin hit targets
- **Safe areas:** Respect notches/home indicator with `padding-bottom: env(safe-area-inset-bottom)` when using fixed elements
- **Performance:** Keep bundle lean, lazy-load heavy/rare UI; optimize images with `next/image` and explicit sizes

### shadcn/ui Components (preferred over custom Tailwind)

- Always use shadcn/ui components: `import { Button } from "@/components/ui/button"`, `import { Card } from "@/components/ui/card"`, etc.
- Page container: `min-h-screen bg-background text-foreground` with `container mx-auto px-4`
- Button: Use `<Button>` with variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
- Card: Use `<Card>`, `<CardHeader>`, `<CardTitle>`, `<CardDescription>`, `<CardContent>`, `<CardFooter>`
- Input: Use `<Input>` component for form fields
- Typography: Favor `text-base leading-relaxed` for body; headings with `font-semibold` and clear scale
- Custom components: Only when shadcn doesn't provide the needed component
- Add new components as needed: `npx shadcn@latest add [component-name]`

### Layout & Responsiveness

- Start at mobile (base). Add breakpoints progressively: `sm` for small tablets, `md` for tablets, `lg`/`xl` desktop
- Use Flex/Grid; avoid fixed pixel widths except for icons/avatars. Prefer `max-w-screen-sm/md` wrappers for readability
- Keep gutters: `px-4` at base, `sm:px-6`, `md:px-8`

### iOS Safari Specifics (iPhone 14 Pro Max target)

- Ensure meta viewport includes `viewport-fit=cover`
- Avoid `position: fixed` footer without safe-area padding; prefer sticky or add `pb-[env(safe-area-inset-bottom)]`
- Use `-webkit-overflow-scrolling: touch` for long scroll containers if needed

### Accessibility

- All interactive elements must be reachable and visible via keyboard (`focus-visible` styles mandatory)
- Provide `aria-label`/`aria-description` for icon-only controls
- Maintain color contrast ≥ 4.5:1 for text; ≥ 3:1 for large text and UI

### Coding Guidance

- Prefer Client Components for interactive UI; keep Server Components minimal for layout/data
- Use shadcn/ui components first, then Tailwind utilities; do not add custom CSS unless utility-first cannot express it succinctly
- Default to mobile-first classes in the base, layer in `sm:`/`md:` modifiers for larger screens
- Import shadcn components: `import { Button } from "@/components/ui/button"` and use their variants
- All fixed bars (headers/footers) must account for safe-area insets
- Use `next/image` with `sizes` and `priority` for above-the-fold media; otherwise lazy-load

### Acceptance Criteria for UI/UX

- Looks refined on 430×932 (iPhone 14 Pro Max) in Safari emulation and Chrome DevTools
- Passes Lighthouse Accessibility ≥ 90 on mobile
- No horizontal scrolling at base width; tap targets ≥ 44px; keyboard focus visible
- Dark mode visually correct; no unreadable text; rings/borders visible
- Responsive up to desktop (`lg`/`xl`) with sensible max widths

### Nice-to-Have (when trivial)

- Skeletons/placeholders for loading states using `animate-pulse`
- Empty states that are friendly and compact
- Small, meaningful micro-interactions (hover/active/press states)

## Environment Variables

Required variables (set in `.env`):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Optional:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-api-key
```

## Important Notes

- **TypeScript:** Strict mode enabled. Use proper types, avoid `any`.
- **Imports:** Use `@/*` path alias for imports (configured in `tsconfig.json`).
- **React Server Components:** App Router uses RSC by default. Add `"use client"` only when needed.
- **Image Optimization:** Always use `next/image` for external images. Remote patterns are configured to allow all hosts in `next.config.ts`.
- **PWA:** Service worker is active in both dev and prod. Clear cache if behavior seems stale.
- **Turbopack:** Development and build use Turbopack (`--turbopack` flag) for faster compilation.
