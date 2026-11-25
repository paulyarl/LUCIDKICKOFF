export const OVERLAY_FITS = ["contain", "cover", "fill"] as const;
export type OverlayFit = (typeof OVERLAY_FITS)[number];

export type OverlayGuide = {
  overlay?: string;
  overlayOpacity?: number;
  overlayFit?: OverlayFit;
  overlayVisible?: boolean;
};

export type OverlayDisplay = {
  src?: string;
  opacity: number;
  fit: OverlayFit;
  visible: boolean;
};

export const DEFAULT_OVERLAY_OPACITY = 0.3;

function isOverlayFit(value: unknown): value is OverlayFit {
  return typeof value === "string" && (OVERLAY_FITS as readonly string[]).includes(value);
}

export function getOverlayDisplay(guide?: OverlayGuide | null): OverlayDisplay {
  const src = typeof guide?.overlay === "string" && guide.overlay.trim() ? guide.overlay : undefined;
  const opacity =
    typeof guide?.overlayOpacity === "number" && Number.isFinite(guide.overlayOpacity)
      ? Math.min(1, Math.max(0, guide.overlayOpacity))
      : DEFAULT_OVERLAY_OPACITY;

  return {
    src,
    opacity,
    fit: isOverlayFit(guide?.overlayFit) ? guide.overlayFit : "contain",
    visible: guide?.overlayVisible !== false,
  };
}

export function overlayPreserveAspectRatio(fit: OverlayFit): string {
  switch (fit) {
    case "cover":
      return "xMidYMid slice";
    case "fill":
      return "none";
    case "contain":
    default:
      return "xMidYMid meet";
  }
}
