"use client";

import LocalOverrides from "../../../components/admin/LocalOverrides";
import BrandShell from "@/components/chrome/BrandShell";

export default function LocalOverridesPage() {
  return (
    <BrandShell className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Local Overrides</h1>
        <p className="text-sm text-gray-500">Dev helpers to set localStorage keys used by the app.</p>
      </div>
      <LocalOverrides />
    </BrandShell>
  );
}
