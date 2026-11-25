import { ReactNode } from "react";
import { OfflineBanner } from "./OfflineBanner";

const sizes = {
  default: "max-w-5xl",
  narrow: "max-w-lg",
  wide: "max-w-none",
} as const;

// Light brand chrome for pages outside a themed section layout.
// force-light re-declares the light token set so token-based components
// render correctly even when the user theme is dark.
export default function BrandShell({
  children,
  size = "default",
  className = "",
}: {
  children: ReactNode;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <div className="force-light min-h-screen bg-brand-cream text-brand-navy">
      <OfflineBanner />
      <div className={`mx-auto w-full px-6 py-10 ${sizes[size]} ${className}`}>
        {children}
      </div>
    </div>
  );
}
