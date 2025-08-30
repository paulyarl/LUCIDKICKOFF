"use client"
import posthog from "posthog-js"
import { PostHogProvider as PH } from "posthog-js/react"
import React, { useEffect } from "react"

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  useEffect(() => {
    if (typeof window !== 'undefined' && key && !posthog.__loaded) {
      posthog.init(key, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
        capture_pageview: true,
      })
    }
  }, [key])

  // If no key is configured, avoid mounting the provider entirely.
  if (!key) {
    return React.createElement(React.Fragment, null, children)
  }

  // Return without JSX to keep this file as .ts
  return React.createElement(PH as any, { client: posthog }, children)
}
