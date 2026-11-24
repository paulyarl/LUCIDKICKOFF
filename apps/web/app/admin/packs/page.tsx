import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPacksPage() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) redirect("/auth/login");

  const role = (session.user.app_metadata as any)?.role;
  if (role !== "admin") redirect("/");

  const { data } = await supabase.from("packs").select("*").order("title");
  const packs = (data ?? []) as unknown as { id: string; title: string; slug: string }[];

  return (
    <main className="min-h-screen bg-brand-cream px-6 py-10 text-brand-navy">
      <div className="mx-auto max-w-3xl space-y-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Packs</h1>
          <p className="text-sm text-brand-navy/60">Assemble published lessons into a pack.</p>
        </div>
        {packs.length === 0 ? (
          <p className="rounded-card bg-white p-6 text-sm text-brand-navy/50 shadow-soft">
            No packs yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {packs.map((pack) => (
              <li key={pack.id}>
                <Link
                  href={`/admin/packs/${pack.id}`}
                  className="flex items-center justify-between rounded-card bg-white p-4 shadow-soft hover:bg-brand-teal/5"
                >
                  <div>
                    <p className="font-heading text-sm font-bold">{pack.title}</p>
                    <p className="text-[11px] text-brand-navy/50">{pack.slug}</p>
                  </div>
                  <span className="text-xs font-semibold text-brand-teal">Build</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
