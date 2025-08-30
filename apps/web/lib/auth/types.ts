import { User } from '@supabase/supabase-js';

export type AuthUser = {
  id: string;
  email?: string;
  isGuest: boolean;
  isParent: boolean;
  isVerified: boolean;
  parentId?: string;
};

export type AuthSession = {
  user: AuthUser | null;
  isLoading: boolean;
  error: Error | null;
};

export type GuestProfile = {
  id: string;
  username: string;
  createdAt: string;
  lastActive: string;
};

export type AuthEvent = 
  | { type: 'SIGN_IN_STARTED' }
  | { type: 'SIGN_IN_SUCCESS'; user: AuthUser }
  | { type: 'SIGN_IN_ERROR'; error: Error }
  | { type: 'SIGN_OUT_STARTED' }
  | { type: 'SIGN_OUT_SUCCESS' }
  | { type: 'SIGN_OUT_ERROR'; error: Error }
  | { type: 'GUEST_CREATED'; guestId: string }
  | { type: 'ACCOUNT_LINKED'; fromGuestId: string; toUserId: string };

export const GUEST_USERNAME_PREFIX = 'guest_';

export function isGuestUser(user: User | null): boolean {
  return user?.email?.startsWith(GUEST_USERNAME_PREFIX) ?? false;
}
