"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "../ui/button";
import { Icons } from "../icons";
import { LanguageSwitcher } from "../i18n/LanguageSwitcher";
import { useAuth } from "../../lib/auth/use-auth";
import { useI18n } from "../../lib/i18n/provider";

export function AppHeader() {
  const { user, signOut } = useAuth();
  const { t } = useI18n();
  const pathname = usePathname();
  const role = (user?.app_metadata as any)?.role as string | undefined;
  const isAdmin = role === 'admin';
  const isParent = role === 'parent' || isAdmin;
  const homeHref = user ? '/dashboard' : '/';
  const libraryHref = '/library';
  const libraryLabel = 'My Library';
  const linkClass = (href: string) =>
    `text-sm ${
      pathname === href || (href !== '/' && pathname.startsWith(`${href}/`))
        ? 'font-semibold text-foreground'
        : 'text-muted-foreground hover:text-foreground'
    }`;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Icons.palette className="h-8 w-8 text-primary" />
          <Link href={homeHref} className="text-2xl font-bold truncate" aria-label={t('app.title')}>
            {t("app.title")}
          </Link>
        </div>

        <nav className="hidden sm:flex items-center gap-4">
          <Link href={homeHref} className={linkClass(homeHref)}>
            Dashboard
          </Link>
          <Link href="/packs" className={linkClass('/packs')}>
            Educational Packs
          </Link>
          <Link href="/category" className={linkClass('/category')}>
            Categories
          </Link>
          <Link href="/community" className={linkClass('/community')}>
            Community
          </Link>
          <Link href="/learn/mode" className={linkClass('/learn/mode')}>
            {t('nav.learn') ?? 'Learn'}
          </Link>
          {user && isParent && (
            <Link href="/author" className={linkClass('/author')}>
              Author
            </Link>
          )}
          {user && (
            <>
              {isAdmin && (
                <Link href="/admin" className={linkClass('/admin')}>
                  {t('nav.admin') ?? 'Admin'}
                </Link>
              )}
              {isParent && (
                <Link href="/parent" className={linkClass('/parent')}>
                  {t('nav.parent') ?? 'Parent'}
                </Link>
              )}
              <Link href={libraryHref} className={linkClass(libraryHref)}>
                {libraryLabel}
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                title="Your profile"
                className="text-sm text-muted-foreground hover:text-foreground truncate max-w-[40vw] sm:max-w-none"
              >
                {t('header.welcomeEmail', { email: user.email ?? '' })}
              </Link>
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
          {user ? (
            <Link
              href="/notifications"
              aria-label="Notifications"
              title="Notifications"
              className="relative"
            >
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-coral" />
            </Link>
          ) : null}
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
