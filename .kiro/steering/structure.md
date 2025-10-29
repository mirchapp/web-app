# Project Structure

## Directory Organization

```
src/
├── app/                    # Next.js App Router (pages & API routes)
│   ├── api/               # Backend API endpoints
│   │   ├── menu/         # Menu parsing services
│   │   ├── places/       # Google Places integration
│   │   └── restaurant/   # Restaurant CRUD + scraping
│   ├── auth/             # Authentication flows
│   ├── diners/           # Diners app pages
│   ├── restaurants/      # Restaurant dashboard pages
│   ├── videos/           # Video feed pages
│   └── onboarding/       # User onboarding flow
├── components/           # Reusable React components
│   ├── ui/              # shadcn/ui base components
│   ├── apps/            # App-specific components
│   ├── feed/            # Social feed components
│   ├── restaurant/      # Restaurant-related components
│   ├── profile/         # User profile components
│   └── layouts/         # Layout wrapper components
├── lib/                 # Core business logic
│   └── scraper/        # Restaurant scraping utilities
├── platform/            # Platform abstraction layer
│   ├── web/           # Web-specific implementations
│   ├── native/        # Capacitor native implementations
│   └── mock/          # Development mocks
├── utils/              # Utility functions
│   └── supabase/      # Database client utilities
├── types/             # TypeScript definitions
├── hooks/             # Custom React hooks
├── data/              # Static data and mocks
└── features/          # Feature-specific modules
```

## Key Architectural Patterns

### 1. Platform Abstraction (`src/platform/`)

- Device detection and platform-specific implementations
- Use `getDevice()` for camera, haptics, and native features
- Lazy-loaded to avoid bundling Capacitor in web builds

### 2. Component Organization

- **UI Components**: Use shadcn/ui from `@/components/ui/*`
- **App Components**: Feature-specific components in `@/components/apps/*`
- **Layout Components**: Shared layouts in `@/components/layouts/*`

### 3. API Structure (`src/app/api/`)

- RESTful endpoints organized by resource
- Each endpoint in its own `route.ts` file
- Consistent error handling and response formats

### 4. Database Integration

- Supabase clients in `@/utils/supabase/`
- Generated types in `@/types/database.types.ts`
- Server vs client usage patterns

## Import Conventions

- Use `@/*` path aliases for all internal imports
- Import shadcn components: `import { Button } from "@/components/ui/button"`
- Platform detection: `import { getDevice } from "@/platform/device"`
- Supabase clients: `import { createClient } from "@/utils/supabase/client"`

## File Naming

- **Components**: PascalCase (e.g., `RestaurantCard.tsx`)
- **Pages**: lowercase with hyphens (e.g., `page.tsx`, `not-found.tsx`)
- **API Routes**: `route.ts` in descriptive folders
- **Utilities**: camelCase (e.g., `imageProcessing.ts`)
- **Types**: camelCase with `.types.ts` suffix

## Code Organization Rules

1. **Server vs Client Components**: Default to Server Components, add `"use client"` only when needed
2. **Component Structure**: Props interface, component function, default export
3. **API Routes**: Handle multiple HTTP methods in single `route.ts` file
4. **Platform Code**: Always use device abstraction, never direct Capacitor imports
5. **Styling**: Mobile-first Tailwind classes, shadcn/ui components preferred
