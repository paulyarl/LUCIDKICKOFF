/// <reference types="next" />
/// <reference types="next/navigation-types/navigation" />

declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SUPABASE_URL: string
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string
    NEXT_PUBLIC_POSTHOG_HOST?: string
    NEXT_PUBLIC_POSTHOG_KEY?: string
    NODE_ENV: 'development' | 'production' | 'test'
  }
}
