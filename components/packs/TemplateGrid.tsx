"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/use-auth";
import { useI18n } from "@/lib/i18n/provider";
import { toggleFavorite, type EntityType } from "@/lib/engagement";
import { getMyRating, upsertRating } from "@/lib/engagement";
import { StarRatingInput } from "@/components/packs/StarRatingInput";
import {
  listTemplateWorkForPack,
  loadTemplateWork,
  saveTemplateWork,
  type TemplateWork,
  type TemplateCanvasStateV2,
} from "@/lib/learn/persistence";

export type TemplateCard = {
  id: string;
  title: string;
  imageUrl: string;
  isFree: boolean;
  tags: string[];
  ratingAvg?: number;
  ratingCount?: number;
};

export function TemplateGrid({
  packId,
  templates,
}: {
  packId: string;
  templates: TemplateCard[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const { user } = useAuth();
  const userKey = user ? `lc_user_${user.id}` : undefined;

  const inProgress = useMemo(() => listTemplateWorkForPack(userKey, packId).filter(w => w.status === "in_progress"), [userKey, packId]);
  const { t } = useI18n();

  const [favs, setFavs] = useState<Record<string, boolean>>({});
  const [myRatings, setMyRatings] = useState<Record<string, number | null>>({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const entries = await Promise.all(
          templates.map(async (tpl) => [tpl.id, await getMyRating("template", tpl.id)] as const)
        );
        if (!mounted) return;
        const map: Record<string, number | null> = {};
        for (const [id, r] of entries) map[id] = r;
        setMyRatings(map);
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, [templates]);

  const displayStars = (avg?: number) => {
    const a = Math.max(0, Math.min(5, Math.round((avg ?? 0))));
    return "★★★★★".slice(0, a) + "☆☆☆☆☆".slice(0, 5 - a);
  };

  const handleToggleFavorite = async (tplId: string) => {
    try {
      setFavs((s) => ({ ...s, [tplId]: !s[tplId] }));
      const desired = !favs[tplId];
      await toggleFavorite("template" as EntityType, tplId, desired);
    } catch (e) {
      // revert on error
      setFavs((s) => ({ ...s, [tplId]: !s[tplId] }));
    }
  };

  const handleStart = (tpl: TemplateCard) => {
    const now = Date.now();
    const work: TemplateWork = {
      packId,
      templateId: tpl.id,
      status: "in_progress",
      startedAt: now,
      updatedAt: now,
    };
    saveTemplateWork(userKey, work);
    const from = `${pathname}${search && search.toString() ? `?${search.toString()}` : ""}`;
    router.push(`/canvas?packId=${encodeURIComponent(packId)}&templateId=${encodeURIComponent(tpl.id)}&from=${encodeURIComponent(from)}`);
  };

  const isInProgress = (templateId: string) => !!loadTemplateWork(userKey, packId, templateId)?.status && loadTemplateWork(userKey, packId, templateId)?.status === "in_progress";

  return (
    <div className="space-y-8">
      {inProgress.length > 0 && (
        <div>
          <div className="mb-2 text-sm font-medium">{t("packs.inProgress")}</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {inProgress.map((w) => {
              const tpl = templates.find(t => t.id === w.templateId);
              if (!tpl) return null;
              return (
                <div key={`inprog-${w.templateId}`} className="relative border rounded-lg overflow-hidden group">
                  <Image src={tpl.imageUrl} alt={tpl.title} width={400} height={300} className="aspect-[4/3] object-cover" />
                  <div className="p-2 flex items-center justify-between">
                    <div className="text-sm font-medium truncate">{tpl.title}</div>
                    <Badge variant="secondary">{t("packs.inProgress")}</Badge>
                  </div>
                  <div className="p-2 pt-0">
                    <Button size="sm" className="w-full" onClick={() => {
                    const from = `${pathname}${search && search.toString() ? `?${search.toString()}` : ""}`;
                    router.push(`/canvas?packId=${encodeURIComponent(packId)}&templateId=${encodeURIComponent(tpl.id)}&from=${encodeURIComponent(from)}`)
                  }}>{t("common.resume")}</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <div className="mb-2 text-sm font-medium">{t("packs.templates")}</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {templates.map((tpl) => (
            <div key={tpl.id} className="relative border rounded-lg overflow-hidden group">
              <Image src={tpl.imageUrl} alt={tpl.title} width={400} height={300} className="aspect-[4/3] object-cover" />
              <div className="absolute top-2 left-2 flex gap-2">
                {isInProgress(tpl.id) && <Badge variant="default">{t("packs.inProgress")}</Badge>}
                {!tpl.isFree && <Badge variant="secondary">{t("packs.proBadge")}</Badge>}
              </div>
              <div className="absolute top-2 right-2">
                <Button variant="secondary" size="sm" aria-label={favs[tpl.id] ? (t("actions.unfavorite") || "Unfavorite") : (t("actions.favorite") || "Favorite")} onClick={() => handleToggleFavorite(tpl.id)}>
                  {favs[tpl.id] ? "❤️" : "🤍"}
                </Button>
              </div>
              <div className="p-2">
                <div className="text-sm font-medium truncate">{tpl.title}</div>
                <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
                  <span>{displayStars(tpl.ratingAvg)}</span>
                  <span>{(tpl.ratingAvg ?? 0).toFixed(1)}</span>
                  <span>({tpl.ratingCount ?? 0})</span>
                </div>
                <div className="mt-1">
                  <StarRatingInput
                    value={myRatings[tpl.id] ?? null}
                    onChange={async (r) => {
                      setMyRatings((s) => ({ ...s, [tpl.id]: r }));
                      try {
                        await upsertRating("template", tpl.id, r);
                      } catch {
                        // revert on error
                        setMyRatings((s) => ({ ...s, [tpl.id]: null }));
                      }
                    }}
                    ariaLabel={`Rate ${tpl.title}`}
                  />
                </div>
                <div className="mt-2">
                  <Button size="sm" className="w-full" onClick={() => handleStart(tpl)}>{t("common.color")}</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
