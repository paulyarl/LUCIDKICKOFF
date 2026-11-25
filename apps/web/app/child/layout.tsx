import { ReactNode } from 'react';
import ImpersonationBanner from '../../components/child/ImpersonationBanner';
import { getValidatedImpersonation } from '@/lib/auth/impersonation';
import { db } from '@/lib/api/server';

export default async function ChildLayout({ children }: { children: ReactNode }) {
  const payload = await getValidatedImpersonation();

  let impersonating = false;
  if (payload) {
    if (payload.admin) {
      impersonating = true;
    } else if (payload.profileId) {
      const profile = await db.service().family.childContext({ profileId: payload.profileId });
      impersonating = Boolean(profile?.active);
    }
  }

  return (
    <>
      {impersonating && <ImpersonationBanner />}
      {children}
    </>
  );
}
