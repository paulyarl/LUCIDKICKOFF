import type { ComponentType } from "react";
import { notFound } from "next/navigation";
import { FRAME_SCREENS, type FrameScreen } from "@/components/frame/screens";
import { PageBackdrop } from "@/components/frame/PageBackdrop";

export function generateStaticParams() {
  return Object.keys(FRAME_SCREENS).map((screen) => ({ screen }));
}

export default function FrameScreenPage({ params }: { params: { screen: string } }) {
  const Screen = FRAME_SCREENS[params.screen as FrameScreen] as ComponentType | undefined;
  if (!Screen) notFound();

  return (
    <PageBackdrop>
      <div className="mx-auto max-w-[1024px]">
        <Screen />
      </div>
    </PageBackdrop>
  );
}
