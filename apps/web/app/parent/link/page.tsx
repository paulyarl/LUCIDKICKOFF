'use client';

import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { useI18n } from '@/lib/i18n/provider';
import { linkChild } from '../../../lib/family';

export default function ParentLinkPage() {
  const { t } = useI18n();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const onLink = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      const res = await linkChild(otp.trim());
      if (res.success) setResult(res.child_id || 'linked');
      else setError('Failed');
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
          <CardTitle>{t('parent.link.title') || 'Link a child account'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('parent.link.instructions') || 'Enter the one-time code from your child to link accounts.'}
          </p>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('parent.link.otp.label') || 'One-time code'}</label>
            <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder={t('parent.link.otp.placeholder') || '123456'} />
          </div>
          <Button onClick={onLink} disabled={loading || !otp} className="w-full">
            {loading ? (t('common.loading') || 'Loading…') : (t('parent.link.submit') || 'Link Child')}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {result && (
            <p className="text-sm text-green-600">
              {t('parent.link.success', { id: result }) || `Linked child: ${result}`}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
