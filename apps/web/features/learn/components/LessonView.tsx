'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n/provider';

type LessonViewProps = {
  lessonId: string;
  title: string | null;
  estMinutes: number | null;
  mode: 'interactive' | 'tutorial';
};

export function LessonView({ lessonId, title, estMinutes, mode }: LessonViewProps) {
  const { t } = useI18n();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <h1 className="font-heading text-3xl font-bold text-brand-navy">
            {title ?? `${t('page.lessonRunner.title')} – ${lessonId}`}
          </h1>
          <Badge className="bg-brand-teal/15 text-brand-teal border-brand-teal/30">
            {mode === 'tutorial' ? t('learn.mode.tutorial.title') : t('learn.mode.interactive.title')}
          </Badge>
          {estMinutes != null && (
            <Badge variant="outline" className="text-brand-navy/70 border-brand-navy/20">
              {t('learn.lesson.estMinutes', { min: estMinutes })}
            </Badge>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('learn.lesson.header')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-brand-navy/60">{t('learn.lesson.welcome')}</p>

            <div className="flex gap-4">
              <Button size="lg" className="start-drawing-cta">{t('cta.startLesson')}</Button>
              <Button variant="outline" size="lg">
                {t('learn.lesson.viewInstructions')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
