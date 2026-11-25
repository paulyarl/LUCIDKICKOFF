import { TemplatesManager } from "@/apps/web/components/templates/TemplatesManager";
import { db } from "@/lib/api/server";
import BrandShell from "@/components/chrome/BrandShell";

export const dynamic = "force-dynamic";

export default async function TemplatesPublicPage() {
  const templates = await db.catalog().templates({ freeOnly: true });
  return <BrandShell><TemplatesManager initialTemplates={templates as any} editable={false} /></BrandShell>;
}
