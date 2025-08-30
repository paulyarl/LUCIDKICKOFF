'use client';

import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n/provider';

export function LessonView() {
  const params = useParams();
  const lessonId = params.lessonId as string;
  const { t } = useI18n();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{t('page.lessonRunner.title')} – {t('page.lessonRunner.subtitle', { id: lessonId })}</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>{t('learn.lesson.header')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{t('learn.lesson.welcome')}</p>
            
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
