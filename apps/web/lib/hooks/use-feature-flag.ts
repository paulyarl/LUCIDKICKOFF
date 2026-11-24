"use client"

// Feature flags: check NEXT_PUBLIC_ENABLE_<KEY> env vars, defaulting to true.
// e.g. useFeatureFlag('community_feed') -> NEXT_PUBLIC_ENABLE_COMMUNITY_FEED
export function useFeatureFlag(flag: string): boolean {
  const envKey = `NEXT_PUBLIC_ENABLE_${flag.toUpperCase()}`
  const value = process.env[envKey]
  return value === undefined ? true : value === "true"
}
