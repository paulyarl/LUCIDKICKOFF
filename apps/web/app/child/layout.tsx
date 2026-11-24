import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import ImpersonationBanner from '../../components/child/ImpersonationBanner';
import { verifyImpersonation, IMPERSONATION_COOKIE } from '@/lib/auth/impersonation';
import { createServiceClient } from '@/lib/supabase/service';

export default async function ChildLayout({ children }: { children: ReactNode }) {
  const c = cookies();
  const payload = verifyImpersonation(c.get(IMPERSONATION_COOKIE)?.value);

  let impersonating = false;
  if (payload) {
    if (payload.admin) {
      impersonating = true;
    } else if (payload.profileId && payload.guardianId) {
      const supabase = createServiceClient();
      const { data: profile } = await supabase
        .from('child_profiles')
        .select('active')
        .eq('id', payload.profileId)
        .maybeSingle();
      const { data: guardian } = await supabase
        .from('child_guardians')
        .select('role')
        .eq('child_profile_id', payload.profileId)
        .eq('guardian_id', payload.guardianId)
        .maybeSingle();
      impersonating = Boolean((profile as any)?.active && guardian);
    }
  }

  return (
    <>
      {impersonating && <ImpersonationBanner />}
      {children}
    </>
  );
}
