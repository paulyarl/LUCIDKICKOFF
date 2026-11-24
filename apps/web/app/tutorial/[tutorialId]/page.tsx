import { redirect } from "next/navigation";

export default function TutorialPage({ params }: { params: { tutorialId: string } }) {
  redirect(`/learn/lesson/${params.tutorialId}`);
}
