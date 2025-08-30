import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import ImpersonationBanner from '../../components/child/ImpersonationBanner';

export default function ChildLayout({ children }: { children: ReactNode }) {
  const c = cookies();
  const impersonating = !!c.get('impersonate_user_id');
  return (
    <>
      {impersonating && <ImpersonationBanner />}
      {children}
    </>
  );
}
