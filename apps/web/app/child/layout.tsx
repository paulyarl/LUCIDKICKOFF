import { ReactNode } from 'react';
import ImpersonationBanner from '../../components/child/ImpersonationBanner';
import { getValidatedImpersonation } from '@/lib/auth/impersonation';
import { createServiceClient } from '@/lib/supabase/service';

export default async function ChildLayout({ children }: { children: ReactNode }) {
  const payload = await getValidatedImpersonation();

  let impersonating = false;
  if (payload) {
    if (payload.admin) {
      impersonating = true;
    } else if (payload.profileId) {
      const supabase = createServiceClient();
      const { data: profile } = await supabase
        .from('child_profiles')
        .select('active')
        .eq('id', payload.profileId)
        .maybeSingle();
      impersonating = Boolean((profile as any)?.active);
    }
  }

  return (
    <>
      {impersonating && <ImpersonationBanner />}
      {children}
    </>
  );
}
