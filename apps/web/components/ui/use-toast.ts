"use client"

import { toast as sonnerToast } from "sonner"

type ToastInput = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

function toast({ title, description, variant }: ToastInput) {
  if (variant === "destructive") {
    return sonnerToast.error(title, { description })
  }
  return sonnerToast(title, { description })
}

function useToast() {
  return { toast }
}

export { toast, useToast }
