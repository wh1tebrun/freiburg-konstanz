export type ProductIdentity = Readonly<{
  displayName: string;
  slug: string;
  tagline: string;
  pitch: string;
  routeDisclaimer: string;
}>;

export const PRODUCT_IDENTITY = {
  displayName: "Freiburg–Konstanz",
  slug: "freiburg-konstanz",
  tagline: "A Black Forest cycling arcade.",
  pitch:
    "Ride ten stylized stages from Freiburg to Konstanz, dodging traffic, managing stamina, collecting boosts, and chaining near-misses.",
  routeDisclaimer:
    "The route is a fictionalized journey inspired by Southern Baden and is not intended for real-world navigation or cycling guidance.",
} as const satisfies ProductIdentity;

export const STAGE_DISPLAY_NAMES = [
  "Freiburg Departure",
  "Kirchzarten Valley",
  "Hinterzarten Climb",
  "Titisee Lakeside",
  "Löffingen Plateau",
  "Donaueschingen",
  "Geisingen Fields",
  "Hegau Crossing",
  "Radolfzell Shore",
  "Konstanz Arrival",
] as const;

export type StageDisplayName = (typeof STAGE_DISPLAY_NAMES)[number];
export type StageNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export const STAGE_DISPLAY_NAME_BY_NUMBER = Object.freeze({
  1: STAGE_DISPLAY_NAMES[0],
  2: STAGE_DISPLAY_NAMES[1],
  3: STAGE_DISPLAY_NAMES[2],
  4: STAGE_DISPLAY_NAMES[3],
  5: STAGE_DISPLAY_NAMES[4],
  6: STAGE_DISPLAY_NAMES[5],
  7: STAGE_DISPLAY_NAMES[6],
  8: STAGE_DISPLAY_NAMES[7],
  9: STAGE_DISPLAY_NAMES[8],
  10: STAGE_DISPLAY_NAMES[9],
}) satisfies Readonly<Record<StageNumber, StageDisplayName>>;
