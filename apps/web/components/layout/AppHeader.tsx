"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "../ui/button";
import { Icons } from "../icons";
import { LanguageSwitcher } from "../i18n/LanguageSwitcher";
import { useAuth } from "../../lib/auth/use-auth";
import { useI18n } from "../../lib/i18n/provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export function AppHeader() {
  const { user, signOut } = useAuth();
  const { t } = useI18n();
  const pathname = usePathname();
  const role = (user?.app_metadata as any)?.role as string | undefined;
  const isAdmin = role === 'admin';
  const isParent = role === 'parent' || isAdmin;
  const homeHref = user ? '/dashboard' : '/';
  const libraryHref = '/library';
  const libraryLabel = t('nav.childLibrary') ?? 'My Library';
  const linkClass = (href: string) =>
    `whitespace-nowrap text-sm transition-colors ${
      pathname === href || (href !== '/' && pathname.startsWith(`${href}/`))
        ? 'font-semibold text-foreground'
        : 'text-muted-foreground hover:text-foreground'
    }`;

  const navLinks: { href: string; label: string }[] = [
    { href: homeHref, label: t('nav.dashboard') ?? 'Dashboard' },
    { href: '/packs', label: t('nav.packs') ?? 'Educational Packs' },
    { href: '/category', label: t('nav.categories') ?? 'Categories' },
    { href: '/community', label: t('nav.community') ?? 'Community' },
    { href: '/learn/mode', label: t('nav.learn') ?? 'Learn' },
    ...(user && isParent ? [{ href: '/author', label: t('nav.author') ?? 'Author' }] : []),
    ...(user && isAdmin ? [{ href: '/admin', label: t('nav.admin') ?? 'Admin' }] : []),
    ...(user && isParent ? [{ href: '/parent', label: t('nav.parent') ?? 'Parent' }] : []),
    ...(user ? [{ href: libraryHref, label: libraryLabel }] : []),
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-3 px-3 sm:px-4 lg:px-8">
        <div className="flex items-center gap-2 shrink-0">
          <Link href={homeHref} className="flex items-center gap-2 whitespace-nowrap text-2xl font-bold" aria-label={t('app.title')}>
            <Icons.palette className="h-8 w-8 text-primary" aria-hidden="true" />
            <span className="hidden sm:inline">{t("app.title")}</span>
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-4">
          {navLinks.map((l) => (
            <Link key={l.href + l.label} href={l.href} className={linkClass(l.href)}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 flex-nowrap justify-end">
          {user ? (
            <div className="hidden sm:flex items-center gap-3">
              <Link
                href="/profile"
                title="Your profile"
                className="text-sm text-muted-foreground hover:text-foreground truncate max-w-[24vw] lg:max-w-none"
              >
                {t('header.welcomeEmail', { email: user.email ?? '' })}
              </Link>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <Icons.logOut className="h-4 w-4 mr-2" />
                {t('auth.signOut')}
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="w-9 px-0 sm:w-auto sm:px-3" asChild>
              <Link href="/auth/login" aria-label={t('auth.signIn')} title={t('auth.signIn')}>
                <Icons.logIn className="h-4 w-4 sm:mr-2" aria-hidden="true" />
                <span className="hidden sm:inline">{t('auth.signIn')}</span>
              </Link>
            </Button>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t('nav.main') ?? 'Menu'}>
                <Icons.menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {navLinks.map((l) => (
                <DropdownMenuItem key={l.href + l.label} asChild>
                  <Link href={l.href} className="cursor-pointer">
                    {l.label}
                  </Link>
                </DropdownMenuItem>
              ))}
              {user ? (
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={handleSignOut}
                >
                  {t('auth.signOut')}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
