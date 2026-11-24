import { HomeFrame, PackFrame, PickerFrame, StatesFrame } from "@/components/frame/screens";
import { PageBackdrop } from "@/components/frame/PageBackdrop";

export default function FramePreviewPage() {
  return (
    <PageBackdrop>
      <div className="mx-auto max-w-[1100px] space-y-12">
        <div>
          <h1 className="font-heading text-3xl font-bold">Sprint 0A · Frame preview</h1>
          <p className="mt-1 text-sm text-brand-navy/60">
            Fixture-backed screens for visual sign-off. No database, no auth. Art falls back to a brand
            gradient until exports land.
          </p>
        </div>
        <HomeFrame />
        <PackFrame />
        <PickerFrame />
        <StatesFrame />
      </div>
    </PageBackdrop>
  );
}
