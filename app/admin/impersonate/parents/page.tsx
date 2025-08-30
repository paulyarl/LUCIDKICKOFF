import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/requireRole'
import AdminHeader from '@/components/admin/AdminHeader'
import AdminBreadcrumbs from '@/components/admin/AdminBreadcrumbs'
import { T } from '@/components/i18n/T'
import { Button } from '@/components/ui/button'
import AdminUserPicker from '@/components/admin/AdminUserPicker'

export const dynamic = 'force-dynamic'

export async function setImpersonation(formData: FormData) {
  'use server'
  await requireRole(['admin'])
  const userId = String(formData.get('userId') || '')
  if (!userId) return
  const c: any = cookies()
  c.set('impersonate_user_id', userId, { httpOnly: true, sameSite: 'lax', path: '/', secure: true })
  redirect('/parent')
}

export async function clearImpersonation() {
  'use server'
  await requireRole(['admin'])
  const c: any = cookies()
  c.delete('impersonate_user_id')
}

export default async function ImpersonateParentsPage() {
  await requireRole(['admin'])
  return (
    <div className="container py-8 space-y-6">
      <AdminHeader titleKey="admin.impersonate.parent.title" />
      <AdminBreadcrumbs
        items={[
          { labelKey: 'admin.index.title', href: '/admin' },
          { labelKey: 'admin.impersonate.parent.title' },
        ]}
      />

      <div className="max-w-md space-y-4">
        <p className="text-sm text-muted-foreground">
          <T k="admin.impersonate.parent.title" />
        </p>

        <form action={setImpersonation} className="space-y-3">
          <AdminUserPicker
            name="userId"
            label={<T k="admin.impersonate.parent.label" /> as unknown as string}
            role="parent"
            placeholder="email@domain.com"
          />
          <Button type="submit">
            <T k="admin.impersonate.submit" />
          </Button>
        </form>

        <form action={clearImpersonation} className="pt-2">
          <Button type="submit" variant="outline">
            <T k="admin.impersonate.stop" />
          </Button>
        </form>
      </div>
    </div>
  )
}

