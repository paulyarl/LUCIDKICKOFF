import React, { ReactNode } from 'react'
import { requireRole } from '@/lib/auth/requireRole'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Enforce admin-only access on the server before rendering any admin pages
  await requireRole(['admin'])
  return <>{children}</>
}
