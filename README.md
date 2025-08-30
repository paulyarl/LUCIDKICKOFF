# LucidCraft

Guest-first creative canvas application built with Next.js, TypeScript, and Supabase.

## Features

- **Guest-first** - Start creating without an account
- **Responsive Design** - Optimized for both mobile and tablet
- **Accessible** - WCAG 2.1 AA compliant
- **Offline Support** - Service worker for basic offline functionality
- **Privacy Focused** - COPPA compliant with minimal data collection

## Tech Stack

- **Frontend**: Next.js 13+ (App Router), TypeScript, Tailwind CSS
- **UI**: shadcn/ui, Lucide Icons
- **State & Data**: React Query, Zod
- **Backend**: Supabase (Auth, Database, Storage)
- **Analytics**: PostHog (Product Analytics & Session Recording)
- **Error Tracking**: Sentry (Error Monitoring & Performance)
- **Canvas**: Konva
- **Validation**: Zod (Runtime type checking & validation)

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/lucidcraft.git
   cd lucidcraft
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # PostHog (optional)
   NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
   NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
   
   # Analytics & Monitoring
   NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
   NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
   NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
   SENTRY_AUTH_TOKEN=your_sentry_auth_token
   
   # Feature Flags
   NEXT_PUBLIC_ENABLE_ANALYTICS=true
   NEXT_PUBLIC_ENABLE_ERROR_TRACKING=true
   NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## Analytics Setup

### 1. Set Up PostHog

1. Create a PostHog account at [posthog.com](https://posthog.com)
2. Create a new project and get your API key
3. Update the following in your `.env.local`:
   ```env
   NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
   NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
   ```

### 2. Set Up Sentry

1. Create a Sentry account at [sentry.io](https://sentry.io)
2. Create a new project (select Next.js)
3. Get your DSN and auth token
4. Update your `.env.local`:
   ```env
   NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
   SENTRY_AUTH_TOKEN=your_sentry_auth_token
   ```

### 3. Set Up Dashboards

1. Install required tools:
   ```bash
   npm install -g axios
   ```

2. Run the setup script (replace with your PostHog API key):
   ```bash
   POSTHOG_API_KEY=your_posthog_api_key node scripts/setup-posthog-dashboards.js
   ```

   This will create the following dashboards:
   - LucidKickoff - Performance Overview
     - Time to First Stroke (p95)
     - Brush Latency (p95)
     - Save Success Rate
     - Crash-Free Sessions

## Project Structure

```
.
├── app/                    # App Router
│   ├── (marketing)/        # Marketing pages
│   ├── api/                # API routes
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/             # Reusable components
│   ├── ui/                 # shadcn/ui components
│   ├── AspectFrame.tsx     # Device aspect ratio enforcer
│   └── KonvaStage.tsx      # Canvas component
├── lib/
│   ├── supabase/           # Supabase client helpers
│   ├── posthog.client.ts   # Analytics
│   └── utils.ts            # Utility functions
└── public/                 # Static files
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Check TypeScript types

## License

MIT
