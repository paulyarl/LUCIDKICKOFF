import { createTemplateFromUpload } from '@/lib/templates.server'
import { createClient } from '@/lib/supabase/server'

export default async function NewTemplatePage() {
  const supabase = createClient()
  const { data: entitlements } = await supabase
    .from('entitlements_catalog')
    .select('code,label')
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .order('code', { ascending: true })

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-semibold mb-6">New Template</h1>
      <form action={createTemplateFromUpload} className="space-y-4" encType="multipart/form-data">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            name="title"
            type="text"
            className="w-full rounded border px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Image (PNG)</label>
          <input
            name="file"
            type="file"
            accept="image/png,image/*"
            className="w-full"
            required
          />
        </div>
        <div className="flex items-center gap-2">
          <input id="is_free" name="is_free" type="checkbox" defaultChecked />
          <label htmlFor="is_free" className="text-sm">Is Free</label>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium mb-1">Required Entitlement (optional)</label>
            <a href="/admin/entitlements" className="text-xs text-blue-600 hover:underline">Manage entitlements</a>
          </div>
          <select
            name="required_entitlement"
            className="w-full rounded border px-3 py-2 bg-white"
            defaultValue=""
          >
            <option value="">None (any entitlement shows premium-generic)</option>
            {(entitlements || []).map((e: any) => (
              <option key={e.code} value={e.code}>{e.label || e.code}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">If set, only users with that entitlement can see the template when it isn't free.</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
          <input
            name="tags"
            type="text"
            className="w-full rounded border px-3 py-2"
            placeholder="animals, cute, easy"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Create
          </button>
          <a
            href="/admin/templates"
            className="inline-flex items-center rounded-md border px-4 py-2 hover:bg-gray-50"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  )
}
