import { TemplatesManager } from "@/apps/web/components/templates/TemplatesManager";
import { createClient } from "@/lib/supabase/server";
import BrandShell from "@/components/chrome/BrandShell";

export const dynamic = "force-dynamic";

export default async function TemplatesPublicPage() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("is_free", true)
    .order("created_at", { ascending: false });
  const templates = (error ? [] : (data ?? []));
  return <BrandShell><TemplatesManager initialTemplates={templates as any} editable={false} /></BrandShell>;
}
