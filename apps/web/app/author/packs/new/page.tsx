import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { NewPackForm } from "@/components/admin/NewPackForm";

export const dynamic = "force-dynamic";

export default async function NewAuthorPackPage({
  searchParams,
}: {
  searchParams: { category?: string; lesson?: string };
}) {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) redirect("/auth/login");

  const role = (session.user.app_metadata as any)?.role;
  if (role !== "parent" && role !== "admin") redirect("/");

  const { data: categoryData } = await supabase
    .from("categories")
    .select("id, slug, name")
    .eq("is_active", true)
    .eq("kind", "subject")
    .order("sort_order");
  const categories = (categoryData ?? []) as { id: string; slug: string; name: string }[];

  let initialLessonTitle: string | undefined;
  if (searchParams.lesson) {
    const { data: lesson } = await supabase
      .from("lessons")
      .select("id, title")
      .eq("id", searchParams.lesson)
      .maybeSingle();
    initialLessonTitle = (lesson as { title?: string } | null)?.title;
  }

  return (
    <main className="min-h-screen bg-brand-cream px-6 py-10 text-brand-navy">
      <div className="mx-auto max-w-2xl space-y-4">
        <div>
          <Link href="/author" className="text-xs font-bold text-brand-teal">
            ← Back to Author studio
          </Link>
          <h1 className="mt-2 font-heading text-2xl font-bold">New pack</h1>
          <p className="text-sm text-brand-navy/60">
            Create a private draft pack, then add or create lessons in the pack builder.
          </p>
        </div>
        <NewPackForm
          key={`${searchParams.category ?? ""}:${searchParams.lesson ?? ""}`}
          categories={categories}
          initialCategorySlug={searchParams.category}
          initialLessonId={initialLessonTitle ? searchParams.lesson : undefined}
          initialLessonTitle={initialLessonTitle}
          basePath="/author/packs"
        />
      </div>
    </main>
  );
}
