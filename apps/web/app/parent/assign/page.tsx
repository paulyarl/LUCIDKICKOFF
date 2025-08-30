'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { useI18n } from '@/lib/i18n/provider';
import { assignPack, assignTemplate, listChildren } from '../../../lib/family';
import { createClient } from '@/lib/supabase/client';

export default function ParentAssignPage() {
  const { t } = useI18n();
  const [childId, setChildId] = useState('');
  const [packId, setPackId] = useState('');
  const [templateRef, setTemplateRef] = useState('');
  const [children, setChildren] = useState<Array<{ id: string; email: string }>>([]);
  const [packs, setPacks] = useState<Array<{ id: string; title: string }>>([]);
  const [templates, setTemplates] = useState<Array<{ id: string; title: string; image_path: string }>>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [loadingPack, setLoadingPack] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoadingLists(true);
        setErr(null);
        const [childList, packList, templateList] = await Promise.all([
          listChildren().catch(() => []),
          (async () => {
            const supabase = createClient();
            const { data, error } = await supabase
              .from('packs')
              .select('id, title')
              .order('created_at', { ascending: false });
            if (error) throw error;
            return (data || []).map((p: any) => ({ id: p.id, title: p.title }));
          })().catch(() => []),
          (async () => {
            const supabase = createClient();
            const { data, error } = await supabase
              .from('templates')
              .select('id, title, image_path')
              .order('created_at', { ascending: false });
            if (error) throw error;
            return (data || []).map((t: any) => ({ id: t.id, title: t.title, image_path: t.image_path }));
          })().catch(() => []),
        ]);
        if (!active) return;
        setChildren(childList);
        setPacks(packList);
        setTemplates(templateList);
      } catch (e: any) {
        if (!active) return;
        setErr(e?.message || 'Failed to load lists');
      } finally {
        if (active) setLoadingLists(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  async function onAssignPack() {
    try {
      setLoadingPack(true);
      setErr(null);
      setMsg(null);
      await assignPack(childId.trim(), packId.trim());
      setMsg(t('parent.assign.pack.success') || 'Assigned pack');
    } catch (e: any) {
      setErr(e?.message || 'Failed to assign pack');
    } finally {
      setLoadingPack(false);
    }
  }

  async function onAssignTemplate() {
    try {
      setLoadingTemplate(true);
      setErr(null);
      setMsg(null);
      await assignTemplate(childId.trim(), templateRef.trim());
      setMsg(t('parent.assign.template.success') || 'Assigned template');
    } catch (e: any) {
      setErr(e?.message || 'Failed to assign template');
    } finally {
      setLoadingTemplate(false);
    }
  }

  return (
    <div className="container max-w-2xl py-10 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{t('parent.assign.title') || 'Assign content to a child'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('parent.assign.childId') || 'Child'}</label>
            <select
              className="w-full border rounded-md px-3 py-2 bg-background"
              value={childId}
              onChange={(e) => setChildId(e.target.value)}
              disabled={loadingLists}
            >
              <option value="">{loadingLists ? (t('common.loading') || 'Loading…') : (children.length ? '--' : (t('parent.assign.childId.ph') || 'Select a child'))}</option>
              {children.map((c) => (
                <option key={c.id} value={c.id}>{c.email}</option>
              ))}
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('parent.assign.packId') || 'Pack'}</label>
                <select
                  className="w-full border rounded-md px-3 py-2 bg-background"
                  value={packId}
                  onChange={(e) => setPackId(e.target.value)}
                  disabled={loadingLists}
                >
                  <option value="">{loadingLists ? (t('common.loading') || 'Loading…') : (packs.length ? '--' : (t('parent.assign.packId.ph') || 'Select a pack'))}</option>
                  {packs.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
              <Button className="w-full" disabled={loadingPack || !childId || !packId} onClick={onAssignPack}>
                {loadingPack ? (t('common.loading') || 'Loading…') : (t('parent.assign.packBtn') || 'Assign Pack')}
              </Button>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('parent.assign.templateRef') || 'Template'}</label>
                <select
                  className="w-full border rounded-md px-3 py-2 bg-background"
                  value={templateRef}
                  onChange={(e) => setTemplateRef(e.target.value)}
                  disabled={loadingLists}
                >
                  <option value="">{loadingLists ? (t('common.loading') || 'Loading…') : (templates.length ? '--' : (t('parent.assign.templateRef.ph') || 'Select a template'))}</option>
                  {templates.map((tm) => (
                    <option key={tm.id} value={tm.image_path}>{tm.title}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">{t('parent.assign.templateRef.ph') || 'storage/ref.json'}</p>
              </div>
              <Button className="w-full" disabled={loadingTemplate || !childId || !templateRef} onClick={onAssignTemplate}>
                {loadingTemplate ? (t('common.loading') || 'Loading…') : (t('parent.assign.templateBtn') || 'Assign Template')}
              </Button>
            </div>
          </div>

          {err && <p className="text-sm text-destructive">{err}</p>}
          {msg && <p className="text-sm text-green-600">{msg}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
