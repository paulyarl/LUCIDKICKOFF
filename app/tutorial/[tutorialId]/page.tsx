"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type TutorialCp = {
  id: string;
  order: number;
  title: string;
  graded?: boolean;
};

type Tutorial = {
  id: string;
  title: string;
  checkpoints: TutorialCp[];
};

export default function TutorialEntryPage() {
  const params = useParams<{ tutorialId: string }>();
  const router = useRouter();
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = params?.tutorialId;
    if (!id) return;
    fetch(`/tutorials/${id}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then(setTutorial)
      .catch(() => setError("Could not load tutorial."));
  }, [params?.tutorialId]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      {!tutorial && !error && <div aria-busy="true">Loading…</div>}
      {error && <p className="text-red-600">{error}</p>}
      {tutorial && (
        <section>
          <h1 className="text-2xl md:text-3xl font-heading text-text-primary">{tutorial.title}</h1>
          <p className="mt-2 text-text-secondary">{tutorial.checkpoints.length} checkpoints</p>
          <ol className="mt-4 list-decimal pl-6 space-y-1">
            {tutorial.checkpoints.map((cp) => (
              <li key={cp.id} className="text-text-primary">
                {cp.title} {cp.graded === false ? <span className="text-text-muted">(ungraded)</span> : null}
              </li>
            ))}
          </ol>
          <div className="mt-6">
            <Button size="lg" onClick={() => router.push(`/tutorial/${tutorial.id}/run`)}>
              Start Tutorial
            </Button>
          </div>
        </section>
      )}
    </main>
  );
}
