import { requireRole } from "@/lib/auth/requireRole";
import { fetchAllTemplates } from "@/lib/templates.server";
import { TemplatesManager } from "@/apps/web/components/templates/TemplatesManager";

export const dynamic = "force-dynamic";

export default async function AdminTemplatesPage() {
  await requireRole(['admin']);
  const templates = await fetchAllTemplates();
  return <TemplatesManager initialTemplates={templates} editable={true} />;
}
