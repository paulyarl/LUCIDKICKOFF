'use client';

import { useEffect, useState } from 'react';
import { StarRatingInput } from '@/components/packs/StarRatingInput';
import { getMyRating, upsertRating } from '@/lib/engagement';

export function PackRatingControl({ packId }: { packId: string }) {
  const [myRating, setMyRating] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await getMyRating('pack', packId);
        if (mounted) setMyRating(r);
      } catch (_) {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, [packId]);

  const handleChange = async (r: number) => {
    try {
      setSaving(true);
      setMyRating(r);
      await upsertRating('pack', packId, r);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <StarRatingInput value={myRating} onChange={handleChange} ariaLabel="Rate this pack" />
      {saving && <span className="text-xs text-muted-foreground">Saving…</span>}
    </div>
  );
}
