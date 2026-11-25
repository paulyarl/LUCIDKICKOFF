'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Zap, ArrowRight, SkipForward } from 'lucide-react';
import { useI18n } from '@/lib/i18n/provider';
import { createClient } from '@/lib/supabase/client';
import { Icons } from '@/components/icons';

type LearningMode = 'interactive' | 'tutorial';

const STORAGE_KEY = 'lucidcraft-learning-mode';

export function ModeSelector() {
  const [selectedMode, setSelectedMode] = useState<LearningMode | null>(null);
  const [firstLessonId, setFirstLessonId] = useState<string | null>(null);
  const router = useRouter();
  const { t } = useI18n();

  // Resolve a real destination: first published catalog lesson
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data } = await supabase
        .from('lessons')
        .select('id')
        .eq('status', 'published')
        .eq('visibility', 'catalog')
        .order('published_at', { ascending: true })
        .limit(1);
      if (data && data.length > 0) setFirstLessonId((data[0] as any).id as string);
    })();
  }, []);

  // Load last choice from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem(STORAGE_KEY) as LearningMode | null;
    if (savedMode && (savedMode === 'interactive' || savedMode === 'tutorial')) {
      setSelectedMode(savedMode);
    }
  }, []);

  const handleModeSelect = (mode: LearningMode) => {
    setSelectedMode(mode);
    localStorage.setItem(STORAGE_KEY, mode);
    
    // Navigate to a real lesson if one exists, else browse packs
    const dest = firstLessonId ? `/learn/lesson/${firstLessonId}?mode=${mode}` : '/packs';
    router.push(dest);
  };

  const handleSkip = () => {
    // Skip to default interactive mode
    handleModeSelect('interactive');
  };

  return (
    <div className="min-h-screen bg-brand-cream">
      {/* Header with Logo and Skip */}
      <header className="flex items-center justify-between p-6">
        <div className="flex items-center gap-2" tabIndex={1}>
          <Icons.palette className="h-8 w-8 text-brand-teal" />
          <span className="font-heading text-xl font-bold text-brand-navy">{t('app.title')}</span>
        </div>
        
        <Button 
          variant="ghost" 
          onClick={handleSkip}
          tabIndex={2}
          className="text-brand-navy/60 hover:text-brand-navy"
        >
          <SkipForward className="w-4 h-4 mr-2" />
          {t('btn.skip')}
        </Button>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 
            className="font-heading text-4xl md:text-5xl font-bold text-brand-navy mb-4"
            tabIndex={3}
          >
            {t('learn.mode.title')}
          </h1>
          <p className="text-xl text-brand-navy/60 mb-12">{t('learn.mode.subtitle')}</p>

          {/* Mode Selection Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Interactive Lesson Card */}
            <Card 
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-105 cursor-pointer group ${
                selectedMode === 'interactive' ? 'ring-4 ring-brand-coral shadow-2xl' : 'hover:shadow-xl'
              }`}
              onClick={() => handleModeSelect('interactive')}
              tabIndex={4}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleModeSelect('interactive');
                }
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-coral to-brand-coral opacity-10 group-hover:opacity-20 transition-opacity" />
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-brand-coral to-brand-coral rounded-2xl flex items-center justify-center">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <Badge variant="secondary" className="bg-brand-coral/15 text-brand-coral">
                    {t('learn.mode.badge.recommended')}
                  </Badge>
                </div>
                <CardTitle className="font-heading text-2xl font-bold text-left text-brand-navy">
                  {t('learn.mode.interactive.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-left space-y-4">
                <p className="text-brand-navy/70 text-lg leading-relaxed">{t('learn.mode.interactive.desc')}</p>
                
                <ul className="space-y-2 text-brand-navy/70">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-brand-coral rounded-full" />
                    {t('learn.mode.interactive.point1')}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-brand-coral rounded-full" />
                    {t('learn.mode.interactive.point2')}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-brand-coral rounded-full" />
                    {t('learn.mode.interactive.point3')}
                  </li>
                </ul>

                <Button 
                  size="lg" 
                  className="w-full h-12 bg-gradient-to-r from-brand-coral to-brand-coral hover:from-brand-coral hover:to-brand-coral text-white font-semibold text-lg transition-all duration-200"
                >
                  {t('learn.mode.interactive.cta')}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Step-by-Step Tutorial Card */}
            <Card 
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-105 cursor-pointer group ${
                selectedMode === 'tutorial' ? 'ring-4 ring-brand-teal shadow-2xl' : 'hover:shadow-xl'
              }`}
              onClick={() => handleModeSelect('tutorial')}
              tabIndex={5}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleModeSelect('tutorial');
                }
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-teal to-brand-teal opacity-10 group-hover:opacity-20 transition-opacity" />
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-brand-teal to-brand-teal rounded-2xl flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <Badge variant="outline" className="border-brand-teal text-brand-teal">
                    {t('learn.mode.tutorial.badge')}
                  </Badge>
                </div>
                <CardTitle className="font-heading text-2xl font-bold text-left text-brand-navy">
                  {t('learn.mode.tutorial.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-left space-y-4">
                <p className="text-brand-navy/70 text-lg leading-relaxed">{t('learn.mode.tutorial.desc')}</p>
                
                <ul className="space-y-2 text-brand-navy/70">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-brand-teal rounded-full" />
                    {t('learn.mode.tutorial.point1')}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-brand-teal rounded-full" />
                    {t('learn.mode.tutorial.point2')}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-brand-teal rounded-full" />
                    {t('learn.mode.tutorial.point3')}
                  </li>
                </ul>

                <Button 
                  size="lg" 
                  variant="outline"
                  className="w-full h-12 border-2 border-brand-teal text-brand-teal hover:bg-brand-teal/10 font-semibold text-lg transition-all duration-200"
                >
                  {t('learn.mode.tutorial.cta')}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Footer Note */}
          <p className="text-sm text-brand-navy/50 mt-8">{t('learn.mode.footerNote')}</p>
        </div>
      </main>
    </div>
  );
}
