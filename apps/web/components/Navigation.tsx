'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './auth/AuthProvider';
import { Button } from './ui/button';
import { User, LogOut, LogIn, UserPlus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export function Navigation() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path ? 'bg-accent' : '';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <span className="inline-block font-bold">LucidKickoff</span>
          </Link>
          <nav className="hidden gap-6 md:flex">
            <Link
              href="/explore"
              className={`flex items-center text-sm font-medium transition-colors hover:text-primary ${isActive('/explore')}`}
            >
              Explore
            </Link>
            {user && (
              <Link
                href="/create"
                className={`flex items-center text-sm font-medium transition-colors hover:text-primary ${isActive('/create')}`}
              >
                Create
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={user.user_metadata?.avatar_url} 
                      alt={user.email || 'User'} 
                    />
                    <AvatarFallback>
                      {user.email?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.user_metadata?.full_name || user.email?.split('@')[0]}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/profile">
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={signOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/auth/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign in
                </Link>
              </Button>
              <Button asChild>
                <Link href="/auth/signup">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Sign up
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
