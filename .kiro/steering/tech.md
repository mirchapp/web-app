# Technology Stack

## Core Framework

- **Next.js 15** with App Router and React Server Components
- **React 19** with TypeScript strict mode
- **Capacitor** for native iOS/Android wrapper

## Styling & UI

- **Tailwind CSS v4** with custom design tokens
- **shadcn/ui** component library (New York style)
- **Framer Motion** for animations
- **Lucide React** for icons

## Backend & Data

- **Supabase** for authentication, database, and real-time features
- **Puppeteer** for restaurant website scraping
- **OpenAI GPT-4** for menu parsing and content processing

## Build & Development

- **Package Manager**: pnpm (locked version via packageManager field)
- **Turbopack** for fast development and builds
- **TypeScript** with strict mode and path aliases (`@/*`)

## PWA & Mobile

- **next-pwa** for Progressive Web App capabilities
- **Custom service worker** with caching strategies for images, API calls, and static assets
- **Safe area insets** for iOS notch/home indicator support

## Common Commands

```bash
# Development server with Turbopack
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Linting
pnpm lint

# Add shadcn/ui components
npx shadcn@latest add [component-name]
```

## Environment Setup

Required environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-api-key  # Optional
```

## Key Dependencies

- `@supabase/supabase-js` - Database and auth client
- `puppeteer` - Web scraping for restaurant data
- `cheerio` - HTML parsing
- `browser-image-compression` - Client-side image optimization
- `heic2any` - HEIC image format conversion
