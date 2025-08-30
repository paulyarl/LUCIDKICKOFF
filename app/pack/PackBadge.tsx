"use client";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/provider";

export default function PackBadge({ isFree }: { isFree: boolean }) {
  const { t } = useI18n();
  return (
    <Badge variant={isFree ? 'secondary' : 'default'}>
      {isFree ? t('packs.badge.free') : t('packs.badge.premium')}
    </Badge>
  );
}
