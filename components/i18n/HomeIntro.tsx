"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function HomeIntro() {
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="w-full max-w-4xl text-center">
      <h2 className="font-heading text-3xl md:text-5xl leading-tight md:leading-[1.1] tracking-tight text-text-primary text-balance line-clamp-2">
        {mounted ? t("home.intro.title") : "Learn to draw, color, and create with fun lessons and easy tutorials!"}
      </h2>
      <p className="mt-3 md:mt-4 text-base md:text-lg text-text-secondary">
        {mounted ? t("home.intro.subtitle") : "Pick a page or lesson to start your art adventure."}
      </p>
      <div className="mt-5 md:mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button asChild variant="secondary" size="lg" className="min-w-[200px]">
          <Link href="/canvas">{mounted ? t("home.intro.startDrawing") : "Start Drawing"}</Link>
        </Button>
        <Button asChild variant="default" size="lg" className="min-w-[200px]">
          <Link href="/pack">{mounted ? t("home.intro.browsePages") : "Browse Pages"}</Link>
        </Button>
      </div>
    </section>
  );
}

