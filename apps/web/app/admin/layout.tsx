import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
};

// All admin pages share the light brand chrome. force-light re-declares the
// light token set so token-based components render correctly even when the
// user theme is dark.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="force-light min-h-screen bg-brand-cream text-brand-navy">
      {children}
    </div>
  );
}
