import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { NewPackForm } from "@/components/admin/NewPackForm";

export const dynamic = "force-dynamic";

export default async function NewPackPage() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) redirect("/auth/login");

  const role = (session.user.app_metadata as any)?.role;
  if (role !== "admin") redirect("/");

  return (
    <main className="min-h-screen bg-brand-cream px-6 py-10 text-brand-navy">
      <div className="mx-auto max-w-2xl space-y-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">New pack</h1>
          <p className="text-sm text-brand-navy/60">
            Create the pack shell, then add categories and published lessons in the builder.
          </p>
        </div>
        <NewPackForm />
      </div>
    </main>
  );
}
