import freiburgBackground from "../../assets/runtime/backgrounds/freiburg-im-breisgau.webp";
import kirchzartenBackground from "../../assets/runtime/backgrounds/kirchzarten-valley.webp";
import hinterzartenBackground from "../../assets/runtime/backgrounds/hinterzarten-climb.webp";
import titiseeBackground from "../../assets/runtime/backgrounds/titisee-lakeside.webp";
import loeffingenBackground from "../../assets/runtime/backgrounds/loeffingen-heights.webp";
import donaueschingenBackground from "../../assets/runtime/backgrounds/donaueschingen-source.webp";
import geisingenBackground from "../../assets/runtime/backgrounds/geisingen-fields.webp";
import engenBackground from "../../assets/runtime/backgrounds/engen-hegau.webp";
import radolfzellBackground from "../../assets/runtime/backgrounds/radolfzell-shoreline.webp";
import konstanzBackground from "../../assets/runtime/backgrounds/konstanz-arrival.webp";

import freiburgBadge from "../../assets/runtime/level-icons/freiburg-start.webp";
import kirchzartenBadge from "../../assets/runtime/level-icons/kirchzarten-valley.webp";
import hinterzartenBadge from "../../assets/runtime/level-icons/hinterzarten-climb.webp";
import titiseeBadge from "../../assets/runtime/level-icons/titisee-lakeside.webp";
import loeffingenBadge from "../../assets/runtime/level-icons/loeffingen-heights.webp";
import donaueschingenBadge from "../../assets/runtime/level-icons/donaueschingen-source.webp";
import geisingenBadge from "../../assets/runtime/level-icons/geisingen-fields.webp";
import engenBadge from "../../assets/runtime/level-icons/engen-hegau.webp";
import radolfzellBadge from "../../assets/runtime/level-icons/radolfzell-shoreline.webp";
import konstanzBadge from "../../assets/runtime/level-icons/konstanz-arrival.webp";

import type { GameLevel } from "../types";

export const LEVELS = [
  {
    id: 1,
    title: "Freiburg Departure",
    subtitle: "Eastbound from Freiburg im Breisgau",
    description: "The ride leaves Freiburg and turns toward the first Black Forest foothills.",
    badge: freiburgBadge,
    backgroundImage: freiburgBackground,
    finishDistance: 500,
    speedMultiplier: 1,
    trafficIntensity: 0,
  },
  {
    id: 2,
    title: "Kirchzarten Valley",
    subtitle: "Entering the Dreisam Valley",
    description: "Open valley roads replace the city as the route reaches Kirchzarten.",
    badge: kirchzartenBadge,
    backgroundImage: kirchzartenBackground,
    finishDistance: 560,
    speedMultiplier: 1.04,
    trafficIntensity: 0.04,
  },
  {
    id: 3,
    title: "Hinterzarten Climb",
    subtitle: "Climbing into the Upper Black Forest",
    description: "A sustained climb leads through higher forest roads and cooler air.",
    badge: hinterzartenBadge,
    backgroundImage: hinterzartenBackground,
    finishDistance: 590,
    speedMultiplier: 1.06,
    trafficIntensity: 0.06,
  },
  {
    id: 4,
    title: "Titisee Lakeside",
    subtitle: "Riding past the lake",
    description: "The route opens into lakeside views after the long forest climb.",
    badge: titiseeBadge,
    backgroundImage: titiseeBackground,
    finishDistance: 620,
    speedMultiplier: 1.08,
    trafficIntensity: 0.08,
  },
  {
    id: 5,
    title: "Löffingen Plateau",
    subtitle: "Across the high country",
    description: "Open terrain, broader skies, and exposed roads define the high plateau.",
    badge: loeffingenBadge,
    backgroundImage: loeffingenBackground,
    finishDistance: 650,
    speedMultiplier: 1.1,
    trafficIntensity: 0.09,
  },
  {
    id: 6,
    title: "Donaueschingen",
    subtitle: "Past the source of the Danube",
    description: "The ride passes through Donaueschingen and its historic town scenery.",
    badge: donaueschingenBadge,
    backgroundImage: donaueschingenBackground,
    finishDistance: 680,
    speedMultiplier: 1.12,
    trafficIntensity: 0.1,
  },
  {
    id: 7,
    title: "Geisingen Fields",
    subtitle: "Rolling toward the Hegau",
    description: "Changing winds sweep across the open fields as the route turns south.",
    badge: geisingenBadge,
    backgroundImage: geisingenBackground,
    finishDistance: 720,
    speedMultiplier: 1.16,
    trafficIntensity: 0.12,
  },
  {
    id: 8,
    title: "Hegau Crossing",
    subtitle: "Volcanic hills on the horizon",
    description: "The distinctive volcanic hills of the Hegau rise in the distance.",
    badge: engenBadge,
    backgroundImage: engenBackground,
    finishDistance: 760,
    speedMultiplier: 1.18,
    trafficIntensity: 0.14,
  },
  {
    id: 9,
    title: "Radolfzell Shore",
    subtitle: "The first view of Lake Constance",
    description: "Radolfzell brings the first wide shoreline views of Lake Constance.",
    badge: radolfzellBadge,
    backgroundImage: radolfzellBackground,
    finishDistance: 800,
    speedMultiplier: 1.2,
    trafficIntensity: 0.15,
  },
  {
    id: 10,
    title: "Konstanz Arrival",
    subtitle: "The final approach to the lake",
    description: "The journey closes with a final approach into Konstanz and Lake Constance.",
    badge: konstanzBadge,
    backgroundImage: konstanzBackground,
    finishDistance: 850,
    speedMultiplier: 1.22,
    trafficIntensity: 0.17,
  },
] as const satisfies readonly GameLevel[];

export function clampStageIndex(stageIndex: number): number {
  if (!Number.isFinite(stageIndex)) return 0;
  return Math.max(0, Math.min(LEVELS.length - 1, Math.trunc(stageIndex)));
}

export function getLevel(stageIndex: number): GameLevel {
  const level = LEVELS[clampStageIndex(stageIndex)];

  if (!level) {
    throw new Error("Freiburg–Konstanz must define at least one level.");
  }

  return level;
}
