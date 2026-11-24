export const SKINS = {
  tz: {
    id: "tz",
    label: "Tanzania",
    jurisdiction: "TZ",
    locale: "en",
    layout: "learning-2.1",
  },
  console: {
    id: "console",
    label: "Console (2.0)",
    jurisdiction: "TZ",
    locale: "en",
    layout: "console-2.0",
  },
  ke: {
    id: "ke",
    label: "Kenya",
    jurisdiction: "KE",
    locale: "en",
    layout: "learning-2.1",
  },
  ug: {
    id: "ug",
    label: "Uganda",
    jurisdiction: "UG",
    locale: "en",
    layout: "learning-2.1",
  },
  rw: {
    id: "rw",
    label: "Rwanda",
    jurisdiction: "RW",
    locale: "en",
    layout: "learning-2.1",
  },
} as const;

export type SkinId = keyof typeof SKINS;

export function skinForJurisdiction(code?: string | null): SkinId {
  switch ((code ?? "").toUpperCase()) {
    case "KE":
      return "ke";
    case "UG":
      return "ug";
    case "RW":
      return "rw";
    default:
      return "tz";
  }
}
