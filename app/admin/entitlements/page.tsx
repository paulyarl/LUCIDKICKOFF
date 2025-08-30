import { createClient } from '@/lib/supabase/server'
import { upsertEntitlement, deleteEntitlement } from '@/lib/entitlements.server'

export default async function EntitlementsAdminPage() {
  const supabase = createClient()
  const { data: entitlements } = await supabase
    .from('entitlements_catalog')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('code', { ascending: true })

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-6">Entitlements</h1>

      <section className="mb-8">
        <h2 className="text-lg font-medium mb-3">Add / Update</h2>
        <form action={upsertEntitlement} className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
          <div className="md:col-span-1">
            <label className="block text-sm mb-1">Code</label>
            <input name="code" required className="w-full rounded border px-3 py-2" placeholder="gold" />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm mb-1">Label</label>
            <input name="label" required className="w-full rounded border px-3 py-2" placeholder="Gold" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Description</label>
            <input name="description" className="w-full rounded border px-3 py-2" placeholder="Plan or pack description" />
          </div>
          <div>
            <label className="block text-sm mb-1">Sort Order</label>
            <input name="sort_order" type="number" defaultValue={0} className="w-full rounded border px-3 py-2" />
          </div>
          <div className="flex items-center gap-2">
            <input id="active" name="active" type="checkbox" defaultChecked />
            <label htmlFor="active" className="text-sm">Active</label>
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Save</button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">Existing</h2>
        <div className="divide-y rounded border bg-white">
          {(entitlements || []).map((e) => (
            <div key={e.code} className="flex items-center justify-between p-3">
              <div>
                <div className="font-medium">{e.label} <span className="text-gray-400">({e.code})</span></div>
                {e.description && <div className="text-sm text-gray-600">{e.description}</div>}
                <div className="text-xs text-gray-500">Sort: {e.sort_order} · {e.active ? 'Active' : 'Inactive'}</div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  type="button" 
                  onClick={() => {
                    const form = document.querySelector('form') as HTMLFormElement;
                    (form.querySelector('[name="code"]') as HTMLInputElement).value = e.code;
                    (form.querySelector('[name="label"]') as HTMLInputElement).value = e.label;
                    (form.querySelector('[name="description"]') as HTMLInputElement).value = e.description || '';
                    (form.querySelector('[name="sort_order"]') as HTMLInputElement).value = e.sort_order.toString();
                    (form.querySelector('[name="active"]') as HTMLInputElement).checked = e.active;
                    form.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
                  title="Edit entitlement"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <form action={deleteEntitlement} className="inline">
                  <input type="hidden" name="code" value={e.code} />
                  <button 
                    type="submit" 
                    className="inline-flex items-center rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                    title="Delete entitlement"
                    onClick={(e) => {
                      if (!confirm('Delete this entitlement?')) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
          {(!entitlements || entitlements.length === 0) && (
            <div className="p-4 text-sm text-gray-500">No entitlements yet.</div>
          )}
        </div>
      </section>
    </div>
  )
}
