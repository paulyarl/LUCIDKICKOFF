import { redirect } from 'next/navigation';

// Back-compat redirect: /color/:pageId -> /canvas?templateId=:pageId
export default function ColorPage({ params }: { params: { pageId: string } }) {
  const templateId = params.pageId;
  redirect(`/canvas?templateId=${templateId}`);
}
