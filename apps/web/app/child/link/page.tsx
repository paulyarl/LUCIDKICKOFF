'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n/provider';
import { generateChildOtp } from '@/apps/web/lib/family';

export default function ChildLinkPage() {
  const { t } = useI18n();
  const [otp, setOtp] = useState<string | null>(null);
  const [expires, setExpires] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await generateChildOtp();
      setOtp(res.otp);
      setExpires(new Date(res.expires_at).toLocaleString());
    } catch (e: any) {
      setError(e?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-lg py-10">
      <Card>
        <CardHeader>
          <CardTitle>{t('child.link.title') || 'Link your account'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('child.link.instructions') || 'Generate a one-time code and share it with your parent to link accounts.'}
          </p>

          <Button onClick={onGenerate} disabled={loading} className="w-full">
            {loading ? t('common.loading') || 'Loading…' : t('child.link.generate') || 'Generate OTP'}
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {otp && (
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('child.link.otp') || 'Your OTP'}</label>
              <Input value={otp} readOnly className="font-mono" />
              <p className="text-xs text-muted-foreground">
                {t('child.link.expires', { when: expires || '' }) || `Expires at: ${expires}`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
