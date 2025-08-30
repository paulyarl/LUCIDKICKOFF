"use client";

import LocalOverrides from "../../../components/admin/LocalOverrides";

export default function LocalOverridesPage() {
  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Local Overrides</h1>
        <p className="text-sm text-gray-500">Dev helpers to set localStorage keys used by the app.</p>
      </div>
      <LocalOverrides />
    </div>
  );
}
