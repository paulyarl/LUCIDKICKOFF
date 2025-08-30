import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "../../../lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChildLibraryTitle, PacksTitle, TemplatesTitle, EmptyAssignedText } from "../../../components/child/ChildLibraryTexts";

// Server Component: fetch assigned items for the effective child user
export default async function ChildLibraryPage() {

  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Determine effective child id: impersonated or current user
  const cookieStore = cookies();
  const impersonated = cookieStore.get("impersonate_user_id")?.value || null;
  const childId = impersonated || user?.id || "";

  // If no user, render empty state gracefully
  if (!childId) {
    return (
      <div className="container py-12">
        <ChildLibraryTitle />
        <EmptyAssignedText />
      </div>
    );
  }

  // Fetch assigned packs
  const { data: packAssigns } = await supabase
    .from("child_pack_assignments")
    .select("pack_id")
    .eq("child_id", childId)
    .returns<Array<{ pack_id: string }>>();

  const packIds = (packAssigns ?? [])
    .map(({ pack_id }) => pack_id)
    .filter(Boolean);
  let assignedPacks: Array<{ id: string; slug: string; title: string }> = [];
  if (packIds.length > 0) {
    const { data: packs } = await supabase
      .from("packs")
      .select("id, slug, title")
      .in("id", packIds as string[])
      .returns<Array<{ id: string; slug: string; title: string }>>();
    assignedPacks = (packs ?? []).map(({ id, slug, title }) => ({ id, slug, title }));
  }

  // Fetch assigned templates (match via storage_ref -> templates.image_path)
  const { data: tplAssigns } = await supabase
    .from("child_template_assignments")
    .select("storage_ref")
    .eq("child_id", childId)
    .returns<Array<{ storage_ref: string }>>();

  const storageRefs = (tplAssigns ?? [])
    .map(({ storage_ref }) => storage_ref)
    .filter(Boolean);
  let assignedTemplates: Array<{ id: string; title: string }> = [];
  if (storageRefs.length > 0) {
    const { data: templates } = await supabase
      .from("templates")
      .select("id, title, image_path")
      .in("image_path", storageRefs as string[])
      .returns<Array<{ id: string; title: string; image_path: string }>>();
    assignedTemplates = (templates ?? []).map(({ id, title }) => ({ id, title }));
  }

  return (
    <div className="container py-12">
      <ChildLibraryTitle />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle><PacksTitle /></CardTitle>
          </CardHeader>
          <CardContent>
            {assignedPacks.length === 0 ? (
              <EmptyAssignedText />
            ) : (
              <ul className="space-y-2">
                {assignedPacks.map((p) => (
                  <li key={p.id}>
                    <Link className="underline" href={`/pack/${p.slug}`}>
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle><TemplatesTitle /></CardTitle>
          </CardHeader>
          <CardContent>
            {assignedTemplates.length === 0 ? (
              <EmptyAssignedText />
            ) : (
              <ul className="space-y-2">
                {assignedTemplates.map((tpl) => (
                  <li key={tpl.id}>
                    <Link className="underline" href={`/canvas?templateId=${tpl.id}`}>
                      {tpl.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
