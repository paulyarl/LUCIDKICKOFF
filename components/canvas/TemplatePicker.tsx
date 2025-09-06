'use client';

import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/provider';

export type TemplateItem = {
  id: string;
  title: string;
  imageUrl: string;
  isFree?: boolean;
  tags?: string[];
};

export function TemplatePicker({
  isOpen,
  onClose,
  templates,
  onSelect,
  className,
  title = 'Choose a Template',
  showOnlyFree = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  templates: TemplateItem[];
  onSelect: (template: TemplateItem) => void;
  className?: string;
  title?: string;
  showOnlyFree?: boolean;
}) {
  const { t } = useI18n();
  const filtered = useMemo(
    () => (showOnlyFree ? templates.filter((t) => t.isFree) : templates),
    [templates, showOnlyFree]
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent className={cn('max-w-3xl', className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map((tpl) => (
            <button
              key={tpl.id}
              className="group rounded-md overflow-hidden border hover:shadow focus:outline-none focus:ring-2 focus:ring-ring"
              onClick={() => {
                onSelect(tpl);
              }}
            >
              <div className="aspect-square bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={tpl.imageUrl}
                  alt={tpl.title}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
              </div>
              <div className="p-2 text-sm flex justify-between">
                <span className="truncate" title={tpl.title}>{tpl.title}</span>
                {tpl.isFree && (
                  <span className="ml-2 text-xs rounded px-1 py-0.5 border">{t('packs.badge.free') || 'Free'}</span>
                )}
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-sm text-muted-foreground">{t('canvas.templates.empty') || 'No templates available.'}</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
