'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Icons } from '../components/icons';
import { AuthModal } from '../components/auth/AuthModal';
import { useAuth } from '../../../lib/auth/use-auth';
import { useI18n } from '../../../lib/i18n/provider';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';

export default function Home() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showGuestChoice, setShowGuestChoice] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const { user } = useAuth();
  const { t } = useI18n();

  const handleGetStarted = () => {
    if (user) {
      // User is signed in, navigate to learn mode selector
      window.location.href = '/canvas';
    } else {
      // Show guest/sign-in choice dialog
      setShowGuestChoice(true);
    }
  };

  const handleSignIn = () => {
    setAuthMode('signin');
    setShowAuthModal(true);
  };

  

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-black dark:from-slate-900 dark:via-black dark:to-black text-white">
        {/* Global header provided by AppHeader in layout */}
        {/* Hero Section */}
        <section className="container py-24 md:py-32">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <Badge variant="secondary" className="px-4 py-2">
                {t('home.hero.badge')}
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl" data-testid="home-title">
                {t('home.hero.welcomePrefix')}{' '}
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {t('app.title')}
                </span>
              </h1>
              <p className="mx-auto max-w-[42rem] text-slate-300 text-xl leading-relaxed">
                {t('home.intro.title')}
              </p>
              <p className="mx-auto max-w-[42rem] text-slate-300 text-lg leading-relaxed">
                {t('home.intro.subtitle')}
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-4 pt-6">
              <Button size="lg" onClick={handleGetStarted}>
                <Icons.palette className="h-5 w-5 mr-2" />
                {t('home.intro.startDrawing')}
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/packs">
                  <Icons.bookOpen className="h-5 w-5 mr-2" />
                  {t('home.intro.browsePages')}
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container py-24">
          <div className="text-center space-y-12">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t('home.features.title')}
              </h2>
              <p className="mx-auto max-w-[42rem] text-slate-300 text-lg">
                {t('home.features.subtitle')}
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <Card className="text-left">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Icons.bookOpen className="h-6 w-6 text-primary" />
                    <CardTitle>{t('home.features.card.lessons.title')}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {t('home.features.card.lessons.desc')}
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-left">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Icons.palette className="h-6 w-6 text-primary" />
                    <CardTitle>{t('home.features.card.canvas.title')}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {t('home.features.card.canvas.desc')}
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-left">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Icons.heart className="h-6 w-6 text-primary" />
                    <CardTitle>{t('home.features.card.coloring.title')}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {t('home.features.card.coloring.desc')}
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t bg-muted/50">
          <div className="container py-24">
            <div className="text-center space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  {t('home.cta.title')}
                </h2>
                <p className="mx-auto max-w-[42rem] text-lg bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {t('home.cta.subtitle')}
                </p>
              </div>
              
              <div className="flex items-center justify-center gap-4">
                <Button size="lg" onClick={handleGetStarted}>
                  {t('home.cta.primary')}
                </Button>
                {!user && (
                  <Button variant="outline" size="lg" onClick={handleSignIn}>
                    {t('auth.signIn')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />

      {/* Guest Choice Dialog */}
      <Dialog open={showGuestChoice} onOpenChange={setShowGuestChoice}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('home.guestDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('home.guestDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button asChild className="flex-1">
              <Link href="/canvas">{t('home.guestDialog.continueGuest')}</Link>
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowGuestChoice(false);
                setAuthMode('signin');
                setShowAuthModal(true);
              }}
            >
              {t('home.guestDialog.signIn')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
