'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Zap, ArrowRight, SkipForward } from 'lucide-react';
import { useI18n } from '@/lib/i18n/provider';

type LearningMode = 'interactive' | 'tutorial';

const STORAGE_KEY = 'lucidcraft-learning-mode';

export function ModeSelector() {
  const [selectedMode, setSelectedMode] = useState<LearningMode | null>(null);
  const router = useRouter();
  const { t } = useI18n();

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
    
    // Navigate based on mode
    if (mode === 'interactive') {
      router.push('/learn/lesson/1?mode=interactive');
    } else {
      router.push('/learn/lesson/1?mode=tutorial');
    }
  };

  const handleSkip = () => {
    // Skip to default interactive mode
    handleModeSelect('interactive');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header with Logo and Skip */}
      <header className="flex items-center justify-between p-6">
        <div className="flex items-center gap-2" tabIndex={1}>
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">LC</span>
          </div>
          <span className="font-semibold text-gray-800">{t('app.title')}</span>
        </div>
        
        <Button 
          variant="ghost" 
          onClick={handleSkip}
          tabIndex={2}
          className="text-gray-600 hover:text-gray-800"
        >
          <SkipForward className="w-4 h-4 mr-2" />
          {t('btn.skip')}
        </Button>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
            tabIndex={3}
          >
            {t('learn.mode.title')}
          </h1>
          <p className="text-xl text-gray-600 mb-12">{t('learn.mode.subtitle')}</p>

          {/* Mode Selection Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Interactive Lesson Card */}
            <Card 
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-105 cursor-pointer group ${
                selectedMode === 'interactive' ? 'ring-4 ring-coral-500 shadow-2xl' : 'hover:shadow-xl'
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
              <div className="absolute inset-0 bg-gradient-to-br from-coral-500 to-coral-600 opacity-10 group-hover:opacity-20 transition-opacity" />
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-coral-500 to-coral-600 rounded-2xl flex items-center justify-center">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <Badge variant="secondary" className="bg-coral-100 text-coral-700">
                    {t('learn.mode.badge.recommended')}
                  </Badge>
                </div>
                <CardTitle className="text-2xl font-bold text-left text-gray-900">
                  {t('learn.mode.interactive.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-left space-y-4">
                <p className="text-gray-600 text-lg leading-relaxed">{t('learn.mode.interactive.desc')}</p>
                
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-coral-500 rounded-full" />
                    {t('learn.mode.interactive.point1')}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-coral-500 rounded-full" />
                    {t('learn.mode.interactive.point2')}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-coral-500 rounded-full" />
                    {t('learn.mode.interactive.point3')}
                  </li>
                </ul>

                <Button 
                  size="lg" 
                  className="w-full h-12 bg-gradient-to-r from-coral-500 to-coral-600 hover:from-coral-600 hover:to-coral-700 text-white font-semibold text-lg transition-all duration-200"
                >
                  {t('learn.mode.interactive.cta')}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Step-by-Step Tutorial Card */}
            <Card 
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-105 cursor-pointer group ${
                selectedMode === 'tutorial' ? 'ring-4 ring-cyan-500 shadow-2xl' : 'hover:shadow-xl'
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
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-cyan-600 opacity-10 group-hover:opacity-20 transition-opacity" />
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <Badge variant="outline" className="border-cyan-500 text-cyan-700">
                    {t('learn.mode.tutorial.badge')}
                  </Badge>
                </div>
                <CardTitle className="text-2xl font-bold text-left text-gray-900">
                  {t('learn.mode.tutorial.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-left space-y-4">
                <p className="text-gray-600 text-lg leading-relaxed">{t('learn.mode.tutorial.desc')}</p>
                
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full" />
                    {t('learn.mode.tutorial.point1')}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full" />
                    {t('learn.mode.tutorial.point2')}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full" />
                    {t('learn.mode.tutorial.point3')}
                  </li>
                </ul>

                <Button 
                  size="lg" 
                  variant="outline"
                  className="w-full h-12 border-2 border-cyan-500 text-cyan-700 hover:bg-cyan-50 font-semibold text-lg transition-all duration-200"
                >
                  {t('learn.mode.tutorial.cta')}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Footer Note */}
          <p className="text-sm text-gray-500 mt-8">{t('learn.mode.footerNote')}</p>
        </div>
      </main>
    </div>
  );
}
