"use client";

import Link from "next/link";
import { Button } from "../ui/button";
import { Icons } from "../icons";
import { LanguageSwitcher } from "../i18n/LanguageSwitcher";
import { useAuth } from "../../lib/auth/use-auth";
import { useI18n } from "../../lib/i18n/provider";

export function AppHeader() {
  const { user, signOut } = useAuth();
  const { t } = useI18n();
  const role = (user?.user_metadata as any)?.role as string | undefined;
  const isAdmin = role === 'admin';

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Icons.palette className="h-8 w-8 text-primary" />
          <Link href="/" className="text-2xl font-bold truncate" aria-label={t('app.title')}>
            {t("app.title")}
          </Link>
        </div>

        <nav className="hidden sm:flex items-center gap-4">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            {t('nav.home') ?? 'Home'}
          </Link>
          <Link href="/packs" className="text-sm text-muted-foreground hover:text-foreground">
            {t('nav.packs') ?? 'Packs'}
          </Link>
          <Link href="/learn/mode" className="text-sm text-muted-foreground hover:text-foreground">
            {t('nav.learn') ?? 'Learn'}
          </Link>
          {user && (
            <>
              {isAdmin && (
                <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
                  {t('nav.admin') ?? 'Admin'}
                </Link>
              )}
              <Link href="/parent" className="text-sm text-muted-foreground hover:text-foreground">
                {t('nav.parent') ?? 'Parent'}
              </Link>
              <Link href="/child/library" className="text-sm text-muted-foreground hover:text-foreground">
                {t('nav.childLibrary') ?? 'My Library'}
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground truncate max-w-[40vw] sm:max-w-none">
                {t('header.welcomeEmail', { email: user.email ?? '' })}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <Icons.logOut className="h-4 w-4 mr-2" />
                {t('auth.signOut')}
              </Button>
            </div>
          ) : (
            <Link href="/auth/login">
              <Button variant="outline" size="sm">{t('auth.signIn')}</Button>
            </Link>
          )}
          <Link href="/settings" aria-label={t('nav.settings') ?? 'Settings'} title={t('nav.settings') ?? 'Settings'}>
            <Button variant="ghost" size="icon">
              <Icons.settings className="h-5 w-5" />
            </Button>
          </Link>
          <LanguageSwitcher inline />
        </div>
      </div>
    </header>
  );
}
