import { useEffect, useRef, useState } from "react";
import "./App.css";
import bmwBlue from "./assets/vehicles/bmw-blue.png";
import audiSilver from "./assets/vehicles/audi-silver.png";
import mercedesBlack from "./assets/vehicles/mercedes-black.png";
import vwBlue from "./assets/vehicles/vw-blue.png";
import porscheYellow from "./assets/vehicles/porsche-yellow.png";
import manRedTruck from "./assets/vehicles/man-red-truck.png";
import dhlYellowTruck from "./assets/vehicles/dhl-yellow-truck.png";
import mercedesGrayVan from "./assets/vehicles/mercedes-gray-van.png";
import freiburgBg from "./assets/backgrounds/freiburg-im-breisgau.png";
import kirchzartenBg from "./assets/backgrounds/kirchzarten-valley.png";
import hinterzartenBg from "./assets/backgrounds/hinterzarten-climb.png";
import titiseeBg from "./assets/backgrounds/titisee-lakeside.png";
import loeffingenBg from "./assets/backgrounds/loeffingen-heights.png";
import donaueschingenBg from "./assets/backgrounds/donaueschingen-source.png";
import geisingenBg from "./assets/backgrounds/geisingen-fields.png";
import engenBg from "./assets/backgrounds/engen-hegau.png";
import radolfzellBg from "./assets/backgrounds/radolfzell-shoreline.png";
import konstanzBg from "./assets/backgrounds/konstanz-arrival.png";

import freiburgIcon from "./assets/level-icons/freiburg-start.png";
import kirchzartenIcon from "./assets/level-icons/kirchzarten-valley.png";
import hinterzartenIcon from "./assets/level-icons/hinterzarten-climb.png";
import titiseeIcon from "./assets/level-icons/titisee-lakeside.png";
import loeffingenIcon from "./assets/level-icons/loeffingen-heights.png";
import donaueschingenIcon from "./assets/level-icons/donaueschingen-source.png";
import geisingenIcon from "./assets/level-icons/geisingen-fields.png";
import engenIcon from "./assets/level-icons/engen-hegau.png";
import radolfzellIcon from "./assets/level-icons/radolfzell-shoreline.png";
import konstanzIcon from "./assets/level-icons/konstanz-arrival.png";

import melissaVictorySprite from "./assets/player/melissa-victory.png";

const TITLE_MELISSA_FRAME_WIDTH = 142;
const TITLE_MELISSA_FRAME_HEIGHT = 230;
const TITLE_MELISSA_FRAME_INDEX = 2; // soldan 3. frame

const MAX_LIVES = 3;
const MAX_STAMINA = 100;
const SPRINT_STAMINA_DRAIN = 30;

const PLAYER_WIDTH = 170;
const PLAYER_HEIGHT = 150;
const PLAYER_MOVE_SPEED = 520;

const MIN_PLAYER_X = 18;

const WAVE_MIN_GAP = 700;
const WAVE_RANDOM_GAP = 440;

type LaneIndex = 0 | 1 | 2;
type ItemKind = "water" | "shield" | "banana" | "coffee" | "croissant";
type PlayerAnim = "normal" | "sprint" | "left" | "right" | "hurt" | "victory";
type HorizontalInput = "none" | "left" | "right";

type GameLevel = {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  themeClass: string;
  backgroundImage?: string;
  finishDistance: number;
  speedMultiplier: number;
  trafficIntensity: number;
};

type Lane = {
  name: string;
  shortName: string;
  playerBottom: number;
  vehicleBottom: number;
  itemBottom: number;
  zIndex: number;
};

type VehicleKind = {
  brand: string;
  sprite: string;
  cssClass: string;
  sizeClass: string;
  width: number;
  height: number;
  speedFactor: number;
};

type WaveVehicle = {
  id: number;
  lane: LaneIndex;
  offsetX: number;
  kind: VehicleKind;
  nearMissAwarded: boolean;
  passAwarded: boolean;
};

type TrafficWave = {
  id: number;
  x: number;
  vehicles: WaveVehicle[];
};

type RoadItem = {
  id: number;
  x: number;
  lane: LaneIndex;
  kind: ItemKind;
};

const LEVELS: GameLevel[] = [
  {
    id: 1,
    title: "Freiburg Start",
    subtitle: "Leaving Freiburg im Breisgau",
    description:
      "Melissa sets off from Freiburg, rolling out of the city toward the eastern countryside.",
    badge: freiburgIcon,
    themeClass: "theme-city",
    backgroundImage: freiburgBg,
    finishDistance: 500,
    speedMultiplier: 1,
    trafficIntensity: 0,
  },
  {
    id: 2,
    title: "Kirchzarten Valley",
    subtitle: "Entering the Dreisam Valley",
    description:
      "Melissa leaves the city behind and rides into the greener, calmer valley roads near Kirchzarten.",
    badge: kirchzartenIcon,
    themeClass: "theme-forest",
    backgroundImage: kirchzartenBg,
    finishDistance: 560,
    speedMultiplier: 1.04,
    trafficIntensity: 0.04,
  },
  {
    id: 3,
    title: "Hinterzarten Climb",
    subtitle: "Climbing into the Upper Black Forest",
    description:
      "Melissa pushes uphill toward Hinterzarten, entering higher forest roads and cooler mountain air.",
    badge: hinterzartenIcon,
    themeClass: "theme-rural",
    backgroundImage: hinterzartenBg,
    finishDistance: 590,
    speedMultiplier: 1.06,
    trafficIntensity: 0.06,
  },
  {
    id: 4,
    title: "Titisee Lakeside",
    subtitle: "Riding past the lake",
    description:
      "After the climb, Melissa reaches the Titisee area, where the route opens into lakeside views and fresh forest light.",
    badge: titiseeIcon,
    themeClass: "theme-lake",
    backgroundImage: titiseeBg,
    finishDistance: 620,
    speedMultiplier: 1.08,
    trafficIntensity: 0.08,
  },
  {
    id: 5,
    title: "Löffingen Heights",
    subtitle: "Across the high plateau",
    description:
      "Melissa continues across the higher open terrain near Löffingen, where the forest gives way to broader skies and exposed roads.",
    badge: loeffingenIcon,
    themeClass: "theme-desert",
    backgroundImage: loeffingenBg,
    finishDistance: 650,
    speedMultiplier: 1.1,
    trafficIntensity: 0.09,
  },
  {
    id: 6,
    title: "Donaueschingen Source",
    subtitle: "Past the beginning of the Danube",
    description:
      "Melissa rides through Donaueschingen, passing historic town scenery near the famous source of the Danube.",
    badge: donaueschingenIcon,
    themeClass: "theme-volcano",
    backgroundImage: donaueschingenBg,
    finishDistance: 680,
    speedMultiplier: 1.12,
    trafficIntensity: 0.1,
  },
  {
    id: 7,
    title: "Geisingen Fields",
    subtitle: "Rolling toward the Hegau",
    description:
      "Melissa crosses the open fields around Geisingen, with broader roads and changing winds as the route turns south.",
    badge: geisingenIcon,
    themeClass: "theme-night",
    backgroundImage: geisingenBg,
    finishDistance: 720,
    speedMultiplier: 1.16,
    trafficIntensity: 0.12,
  },
  {
    id: 8,
    title: "Engen Hegau",
    subtitle: "Volcanic hills on the horizon",
    description:
      "Melissa reaches the Hegau landscape near Engen, where distinct volcanic hills rise in the distance.",
    badge: engenIcon,
    themeClass: "theme-snow",
    backgroundImage: engenBg,
    finishDistance: 760,
    speedMultiplier: 1.12,
    trafficIntensity: 0.14,
  },
  {
    id: 9,
    title: "Radolfzell Shoreline",
    subtitle: "First real glimpse of Bodensee",
    description:
      "Melissa reaches Radolfzell, where the route finally opens toward the shoreline and the first wide views of Lake Constance.",
    badge: radolfzellIcon,
    themeClass: "theme-rain",
    backgroundImage: radolfzellBg,
    finishDistance: 800,
    speedMultiplier: 1.18,
    trafficIntensity: 0.15,
  },
  {
    id: 10,
    title: "Konstanz Arrival",
    subtitle: "Final ride to Bodensee",
    description:
      "Melissa finishes the journey in Konstanz, riding into the lakeside city for the final Bodensee arrival.",
    badge: konstanzIcon,
    themeClass: "theme-sunset",
    backgroundImage: konstanzBg,
    finishDistance: 850,
    speedMultiplier: 1.22,
    trafficIntensity: 0.17,
  },
];

const LANES: Lane[] = [
  {
    name: "Lower Lane",
    shortName: "Lower",
    playerBottom: 18,
    vehicleBottom: 28,
    itemBottom: 30,
    zIndex: 62,
  },
  {
    name: "Middle Lane",
    shortName: "Middle",
    playerBottom: 108,
    vehicleBottom: 118,
    itemBottom: 120,
    zIndex: 52,
  },
  {
    name: "Upper Lane",
    shortName: "Upper",
    playerBottom: 198,
    vehicleBottom: 208,
    itemBottom: 210,
    zIndex: 42,
  },
];

const VEHICLE_KINDS: VehicleKind[] = [
  {
    brand: "BMW",
    sprite: bmwBlue,
    cssClass: "car-bmw",
    sizeClass: "vehicle-car",
    width: 145,
    height: 72,
    speedFactor: 1.08,
  },
  {
    brand: "AUDI",
    sprite: audiSilver,
    cssClass: "car-audi",
    sizeClass: "vehicle-car",
    width: 150,
    height: 72,
    speedFactor: 1.04,
  },
  {
    brand: "MERC",
    sprite: mercedesBlack,
    cssClass: "car-mercedes",
    sizeClass: "vehicle-car",
    width: 155,
    height: 74,
    speedFactor: 1,
  },
  {
    brand: "VW",
    sprite: vwBlue,
    cssClass: "car-vw",
    sizeClass: "vehicle-car-small",
    width: 135,
    height: 70,
    speedFactor: 1.12,
  },
  {
    brand: "POR",
    sprite: porscheYellow,
    cssClass: "car-porsche",
    sizeClass: "vehicle-sport",
    width: 158,
    height: 72,
    speedFactor: 1.2,
  },
  {
    brand: "MAN",
    sprite: manRedTruck,
    cssClass: "truck-man",
    sizeClass: "vehicle-truck",
    width: 250,
    height: 110,
    speedFactor: 0.82,
  },
  {
    brand: "DHL",
    sprite: dhlYellowTruck,
    cssClass: "truck-dhl",
    sizeClass: "vehicle-truck",
    width: 235,
    height: 105,
    speedFactor: 0.86,
  },
  {
    brand: "MB",
    sprite: mercedesGrayVan,
    cssClass: "truck-mercedes",
    sizeClass: "vehicle-truck",
    width: 220,
    height: 100,
    speedFactor: 0.78,
  },
];

let nextId = 1;

function getViewportWidth() {
  return window.innerWidth;
}

function getViewportHeight() {
  return window.innerHeight;
}

function getMaxPlayerX() {
  return getViewportWidth() - PLAYER_WIDTH - 18;
}

function randomFromArray<T>(items: T[]) {
  const index = Math.floor(Math.random() * items.length);
  return items[index];
}

function getRandomLane(): LaneIndex {
  return Math.floor(Math.random() * LANES.length) as LaneIndex;
}

function getRandomItemKind(): ItemKind {
  const roll = Math.random();

  if (roll < 0.38) return "water";
  if (roll < 0.58) return "banana";
  if (roll < 0.76) return "coffee";
  if (roll < 0.91) return "croissant";
  return "shield";
}

function getItemEmoji(kind: ItemKind) {
  if (kind === "water") return "💧";
  if (kind === "shield") return "🛡️";
  if (kind === "banana") return "🍌";
  if (kind === "coffee") return "☕";
  return "🥐";
}

function getSpeedLevelFromDistance(distance: number, finishDistance: number) {
  if (distance >= finishDistance * 0.7) return 3;
  if (distance >= finishDistance * 0.35) return 2;
  return 1;
}

function getBaseRoadSpeed(speedLevel: number) {
  if (speedLevel === 3) return 520;
  if (speedLevel === 2) return 445;
  return 370;
}

function getFinalRank(lives: number, bottles: number, score: number) {
  if (score >= 3600 && lives === 3) return "Bodensee Legend 🐉";
  if (lives === 3 && bottles >= 2) return "Bodensee Beast ⭐";
  if (lives === 3) return "Perfect Rider 🚴‍♀️";
  if (lives === 2) return "Strong Rider 💪";
  return "Bonk Survivor 💀";
}

function getUniqueRandomLanes(count: number): LaneIndex[] {
  const lanes: LaneIndex[] = [0, 1, 2];

  for (let i = lanes.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [lanes[i], lanes[randomIndex]] = [lanes[randomIndex], lanes[i]];
  }

  return lanes.slice(0, count);
}

function createWaveVehicle(lane: LaneIndex, offsetX: number): WaveVehicle {
  return {
    id: nextId++,
    lane,
    offsetX,
    kind: randomFromArray(VEHICLE_KINDS),
    nearMissAwarded: false,
    passAwarded: false,
  };
}

function createTrafficWave(
  x: number,
  speedLevel: number,
  level: GameLevel
): TrafficWave {
  const baseChance = speedLevel === 1 ? 0.4 : speedLevel === 2 ? 0.56 : 0.66;
  const twoVehicleChance = Math.min(0.82, baseChance + level.trafficIntensity);
  const vehicleCount = Math.random() < twoVehicleChance ? 2 : 1;

  const lanes = getUniqueRandomLanes(vehicleCount);

  const vehicles = lanes.map((lane, index) => {
    const offsetX = vehicleCount === 1 ? 0 : index === 0 ? -35 : 45;
    return createWaveVehicle(lane, offsetX);
  });

  return {
    id: nextId++,
    x,
    vehicles,
  };
}

function createRoadItem(x: number, lane?: LaneIndex): RoadItem {
  return {
    id: nextId++,
    x,
    lane: lane ?? getRandomLane(),
    kind: getRandomItemKind(),
  };
}

function createInitialWaves(level: GameLevel) {
  const screenWidth = getViewportWidth();
  const gap = WAVE_MIN_GAP - level.trafficIntensity * 120;

  return [
    createTrafficWave(screenWidth + 520, 1, level),
    createTrafficWave(screenWidth + 520 + gap, 1, level),
    createTrafficWave(screenWidth + 520 + gap * 2, 1, level),
    createTrafficWave(screenWidth + 520 + gap * 3, 2, level),
    createTrafficWave(screenWidth + 520 + gap * 4, 2, level),
  ];
}

function createInitialItems() {
  const screenWidth = getViewportWidth();

  return [
    createRoadItem(screenWidth + 950, 0),
    createRoadItem(screenWidth + 1850, 1),
    createRoadItem(screenWidth + 2750, 2),
    createRoadItem(screenWidth + 3650, getRandomLane()),
  ];
}

function getSavedUnlockedLevel() {
  if (typeof window === "undefined") return 0;

  const savedValue = window.localStorage.getItem("ride-to-bodensee-unlocked");
  const parsedValue = savedValue ? Number(savedValue) : 0;

  if (!Number.isFinite(parsedValue)) return 0;

  return Math.max(0, Math.min(LEVELS.length - 1, parsedValue));
}

function renderLevelBadge(
  badge: string,
  title: string,
  className: string
) {
  const isImage =
    badge.includes(".png") ||
    badge.includes(".jpg") ||
    badge.includes(".jpeg") ||
    badge.includes(".webp") ||
    badge.includes(".svg");

  if (isImage) {
    return (
      <img
        src={badge}
        alt={`${title} badge`}
        className={className}
        draggable="false"
      />
    );
  }

  return <span className={className}>{badge}</span>;
}

function App() {
  const [selectedLevelIndex, setSelectedLevelIndex] = useState(0);
  const [unlockedLevelIndex, setUnlockedLevelIndex] =
    useState(getSavedUnlockedLevel);

  const selectedLevel = LEVELS[selectedLevelIndex];

  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isStageComplete, setIsStageComplete] = useState(false);
  const [isInvincible, setIsInvincible] = useState(false);
  const [isSprinting, setIsSprinting] = useState(false);

  const [distance, setDistance] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [bottles, setBottles] = useState(0);
  const [hasShield, setHasShield] = useState(false);
  const [stamina, setStamina] = useState(MAX_STAMINA);
  const [message, setMessage] = useState("Choose a stage");

  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [eventText, setEventText] = useState("");
  const [eventKey, setEventKey] = useState(0);

  const [coffeeTime, setCoffeeTime] = useState(0);
  const [bananaTime, setBananaTime] = useState(0);

  const [playerX, setPlayerX] = useState(210);
  const [playerLane, setPlayerLane] = useState<LaneIndex>(1);
  const [horizontalInput, setHorizontalInput] =
  useState<HorizontalInput>("none");

  const [trafficWaves, setTrafficWaves] = useState<TrafficWave[]>(() =>
    createInitialWaves(LEVELS[0])
  );

  const [roadItems, setRoadItems] = useState<RoadItem[]>(() =>
    createInitialItems()
  );

  const playerXRef = useRef(210);
  const playerLaneRef = useRef<LaneIndex>(1);

  const trafficWavesRef = useRef<TrafficWave[]>(trafficWaves);
  const roadItemsRef = useRef<RoadItem[]>(roadItems);

  const distanceRef = useRef(0);
  const staminaRef = useRef(MAX_STAMINA);

  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const bestComboRef = useRef(0);

  const hasShieldRef = useRef(false);
  const coffeeTimeRef = useRef(0);
  const bananaTimeRef = useRef(0);

  const eventTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);

  const isInvincibleRef = useRef(false);
  const isShiftHeldRef = useRef(false);
  const isLeftHeldRef = useRef(false);
  const isRightHeldRef = useRef(false);
  const horizontalInputRef = useRef<HorizontalInput>("none");

  const speedLevel = getSpeedLevelFromDistance(
    distance,
    selectedLevel.finishDistance
  );

  const currentLane = LANES[playerLane];
  const finalRank = getFinalRank(lives, bottles, score);

  useEffect(() => {
    window.localStorage.setItem(
      "ride-to-bodensee-unlocked",
      String(unlockedLevelIndex)
    );
  }, [unlockedLevelIndex]);

  function setHorizontalDirection(direction: HorizontalInput) {
    horizontalInputRef.current = direction;
    setHorizontalInput(direction);
  }

  function getPlayerAnimation(): PlayerAnim {
    if (isStageComplete) return "victory";
    if (isGameOver || isInvincible) return "hurt";
    if (horizontalInput === "left") return "left";
    if (horizontalInput === "right") return "right";
    if (isSprinting || coffeeTime > 0) return "sprint";

    return "normal";
}

  function showEvent(text: string) {
    setEventText(text);
    setEventKey((oldKey) => oldKey + 1);

    if (eventTimeoutRef.current) {
      clearTimeout(eventTimeoutRef.current);
    }

    eventTimeoutRef.current = setTimeout(() => {
      setEventText("");
    }, 850);
  }

  function addScore(points: number, label: string, increasesCombo: boolean) {
    let multiplier = 1;

    if (increasesCombo) {
      comboRef.current += 1;
      multiplier = Math.min(comboRef.current, 5);

      setCombo(comboRef.current);

      if (comboRef.current > bestComboRef.current) {
        bestComboRef.current = comboRef.current;
        setBestCombo(comboRef.current);
      }
    }

    const gainedPoints = points * multiplier;

    scoreRef.current += gainedPoints;
    setScore(scoreRef.current);

    if (increasesCombo) {
      showEvent(`+${gainedPoints} ${label} x${multiplier}`);
    } else {
      showEvent(`+${gainedPoints} ${label}`);
    }
  }

  function resetCombo() {
    comboRef.current = 0;
    setCombo(0);
  }

  function resetRunForLevel(levelIndex: number) {
    const level = LEVELS[levelIndex];
    const freshWaves = createInitialWaves(level);
    const freshItems = createInitialItems();

    setIsGameStarted(false);
    setIsGameOver(false);
    setIsStageComplete(false);
    setIsInvincible(false);
    setIsSprinting(false);

    isInvincibleRef.current = false;
    isShiftHeldRef.current = false;
    isLeftHeldRef.current = false;
    isRightHeldRef.current = false;

    horizontalInputRef.current = "none";
    setHorizontalInput("none");

    distanceRef.current = 0;
    setDistance(0);

    staminaRef.current = MAX_STAMINA;
    setStamina(MAX_STAMINA);

    scoreRef.current = 0;
    comboRef.current = 0;
    bestComboRef.current = 0;

    setScore(0);
    setCombo(0);
    setBestCombo(0);
    setEventText("");

    setLives(MAX_LIVES);
    setBottles(0);

    hasShieldRef.current = false;
    setHasShield(false);

    coffeeTimeRef.current = 0;
    bananaTimeRef.current = 0;
    setCoffeeTime(0);
    setBananaTime(0);

    setMessage("Choose a stage");

    playerXRef.current = 210;
    playerLaneRef.current = 1;

    setPlayerX(210);
    setPlayerLane(1);

    trafficWavesRef.current = freshWaves;
    roadItemsRef.current = freshItems;

    setTrafficWaves(freshWaves);
    setRoadItems(freshItems);

    lastFrameTimeRef.current = null;
  }

  function selectLevel(levelIndex: number) {
    if (levelIndex > unlockedLevelIndex) return;

    setSelectedLevelIndex(levelIndex);
    resetRunForLevel(levelIndex);
  }

  function startGame() {
    if (isGameOver || isStageComplete) return;

    setIsGameStarted(true);
    setMessage("Ride started!");
  }

  function retryCurrentLevel() {
    resetRunForLevel(selectedLevelIndex);
    setIsGameStarted(true);
    setMessage("Ride started!");
  }

  function returnToMap() {
    resetRunForLevel(selectedLevelIndex);
  }

  function goToNextLevel() {
    if (selectedLevelIndex >= LEVELS.length - 1) {
      returnToMap();
      return;
    }

    const nextLevelIndex = selectedLevelIndex + 1;

    setUnlockedLevelIndex((oldValue) => Math.max(oldValue, nextLevelIndex));
    setSelectedLevelIndex(nextLevelIndex);
    resetRunForLevel(nextLevelIndex);
  }

  function switchLane(direction: number) {
    if (!isGameStarted || isGameOver || isStageComplete) return;

    const nextLane = Math.max(
      0,
      Math.min(LANES.length - 1, playerLaneRef.current + direction)
    ) as LaneIndex;

    if (nextLane === playerLaneRef.current) return;

    playerLaneRef.current = nextLane;
    setPlayerLane(nextLane);
    setMessage("");
  }

  function takeDamage() {
    if (isInvincibleRef.current) return;

    if (hasShieldRef.current) {
      hasShieldRef.current = false;
      setHasShield(false);
      setMessage("Shield saved you!");
      showEvent("🛡️ Shield blocked!");
      return;
    }

    resetCombo();

    setLives((oldLives) => {
      const newLives = oldLives - 1;

      if (newLives <= 0) {
        setIsGameOver(true);
        setIsSprinting(false);
        setMessage("Game over!");
        return 0;
      }

      isInvincibleRef.current = true;
      setIsInvincible(true);
      setMessage("Ouch! Combo broken.");

      setTimeout(() => {
        isInvincibleRef.current = false;
        setIsInvincible(false);
      }, 1200);

      return newLives;
    });
  }

  function collectItem(id: number) {
    const item = roadItemsRef.current.find(
      (currentItem) => currentItem.id === id
    );

    if (!item) return;

    const maxX = Math.max(
      getViewportWidth() + 900,
      ...roadItemsRef.current.map((currentItem) => currentItem.x)
    );

    const updatedItems = roadItemsRef.current.map((currentItem) => {
      if (currentItem.id !== id) return currentItem;

      return createRoadItem(maxX + 700 + Math.random() * 900, getRandomLane());
    });

    roadItemsRef.current = updatedItems;
    setRoadItems(updatedItems);

    if (item.kind === "water") {
      setBottles((oldBottles) => oldBottles + 1);
      setMessage("Water bottle collected!");
      addScore(25, "Water", false);
      return;
    }

    if (item.kind === "shield") {
      hasShieldRef.current = true;
      setHasShield(true);
      setMessage("Shield collected!");
      addScore(60, "Shield", false);
      return;
    }

    if (item.kind === "banana") {
      bananaTimeRef.current = 5;
      setBananaTime(5);

      staminaRef.current = Math.min(MAX_STAMINA, staminaRef.current + 28);
      setStamina(Math.floor(staminaRef.current));

      setMessage("Banana boost!");
      addScore(45, "Banana", false);
      return;
    }

    if (item.kind === "coffee") {
      coffeeTimeRef.current = 4;
      setCoffeeTime(4);

      setMessage("Coffee boost!");
      addScore(55, "Coffee", false);
      return;
    }

    if (item.kind === "croissant") {
      setLives((oldLives) => Math.min(MAX_LIVES, oldLives + 1));

      staminaRef.current = Math.min(MAX_STAMINA, staminaRef.current + 35);
      setStamina(Math.floor(staminaRef.current));

      setMessage("Croissant recovered you!");
      addScore(75, "Croissant", false);
    }
  }

  function drinkBottle() {
    if (!isGameStarted || isGameOver || isStageComplete) return;

    if (bottles <= 0) {
      setMessage("No bottles left!");
      return;
    }

    const canHealLife = lives < MAX_LIVES;
    const canRestoreStamina = staminaRef.current < MAX_STAMINA;

    if (!canHealLife && !canRestoreStamina) {
      setMessage("Already full!");
      return;
    }

    setBottles((oldBottles) => oldBottles - 1);

    if (canHealLife) {
      setLives((oldLives) => Math.min(MAX_LIVES, oldLives + 1));
    }

    staminaRef.current = Math.min(MAX_STAMINA, staminaRef.current + 35);
    setStamina(Math.floor(staminaRef.current));

    setMessage("Bottle used!");
  }

  function getPlayerHitbox() {
    const screenHeight = getViewportHeight();
    const lane = LANES[playerLaneRef.current];

    const playerTop = screenHeight - lane.playerBottom - PLAYER_HEIGHT;
    const playerBottom = screenHeight - lane.playerBottom;

    return {
      left: playerXRef.current + 38,
      right: playerXRef.current + PLAYER_WIDTH - 34,
      top: playerTop + 42,
      bottom: playerBottom - 18,
    };
  }

  function getVehicleHitbox(wave: TrafficWave, vehicle: WaveVehicle) {
    const screenHeight = getViewportHeight();
    const lane = LANES[vehicle.lane];

    const vehicleX = wave.x + vehicle.offsetX;

    const vehicleTop = screenHeight - lane.vehicleBottom - vehicle.kind.height;
    const vehicleBottom = screenHeight - lane.vehicleBottom;

    const sidePadding = vehicle.kind.sizeClass === "vehicle-truck" ? 16 : 12;

    return {
      left: vehicleX + sidePadding,
      right: vehicleX + vehicle.kind.width - sidePadding,
      top: vehicleTop + 10,
      bottom: vehicleBottom - 8,
    };
  }

  function getItemHitbox(item: RoadItem) {
    const screenHeight = getViewportHeight();
    const lane = LANES[item.lane];

    const itemSize = 54;
    const itemTop = screenHeight - lane.itemBottom - itemSize;
    const itemBottom = screenHeight - lane.itemBottom;

    return {
      left: item.x + 8,
      right: item.x + itemSize - 8,
      top: itemTop + 8,
      bottom: itemBottom - 8,
    };
  }

  function boxesOverlap(
    a: { left: number; right: number; top: number; bottom: number },
    b: { left: number; right: number; top: number; bottom: number }
  ) {
    return (
      a.left < b.right &&
      a.right > b.left &&
      a.top < b.bottom &&
      a.bottom > b.top
    );
  }

  function expandHitbox(
    box: { left: number; right: number; top: number; bottom: number },
    amountX: number,
    amountY: number
  ) {
    return {
      left: box.left - amountX,
      right: box.right + amountX,
      top: box.top - amountY,
      bottom: box.bottom + amountY,
    };
  }

  function recycleWaveById(id: number) {
    const maxX = Math.max(
      getViewportWidth() + 700,
      ...trafficWavesRef.current.map((wave) => wave.x)
    );

    const currentSpeedLevel = getSpeedLevelFromDistance(
      distanceRef.current,
      selectedLevel.finishDistance
    );

    const updatedWaves = trafficWavesRef.current.map((wave) => {
      if (wave.id !== id) return wave;

      return createTrafficWave(
        maxX + WAVE_MIN_GAP + Math.random() * WAVE_RANDOM_GAP,
        currentSpeedLevel,
        selectedLevel
      );
    });

    trafficWavesRef.current = updatedWaves;
    setTrafficWaves(updatedWaves);
  }

  function checkCollisionsAndRewards() {
    const playerHitbox = getPlayerHitbox();
    const nearMissHitbox = expandHitbox(playerHitbox, 44, 18);

    let wavesChanged = false;

    for (const wave of trafficWavesRef.current) {
      for (const vehicle of wave.vehicles) {
        const vehicleX = wave.x + vehicle.offsetX;

        if (
          !vehicle.passAwarded &&
          vehicleX + vehicle.kind.width < playerXRef.current
        ) {
          vehicle.passAwarded = true;
          wavesChanged = true;
          addScore(8, "Pass", false);
        }

        if (vehicle.lane !== playerLaneRef.current) continue;

        const vehicleHitbox = getVehicleHitbox(wave, vehicle);

        if (boxesOverlap(playerHitbox, vehicleHitbox)) {
          takeDamage();
          recycleWaveById(wave.id);
          return;
        }

        const hasNearMiss =
          !vehicle.nearMissAwarded &&
          boxesOverlap(nearMissHitbox, vehicleHitbox);

        if (hasNearMiss) {
          vehicle.nearMissAwarded = true;
          wavesChanged = true;
          setMessage("Near Miss!");
          addScore(50, "Near Miss", true);
        }
      }
    }

    if (wavesChanged) {
      setTrafficWaves([...trafficWavesRef.current]);
    }

    for (const item of roadItemsRef.current) {
      if (item.lane !== playerLaneRef.current) continue;

      const itemHitbox = getItemHitbox(item);

      if (boxesOverlap(playerHitbox, itemHitbox)) {
        collectItem(item.id);
        break;
      }
    }
  }

  function getIncomingWarnings(waves: TrafficWave[]) {
    const screenWidth = getViewportWidth();
    const warnings: LaneIndex[] = [];

    for (const wave of waves) {
      if (wave.x < screenWidth - 220 || wave.x > screenWidth + 430) continue;

      for (const vehicle of wave.vehicles) {
        if (!warnings.includes(vehicle.lane)) {
          warnings.push(vehicle.lane);
        }
      }
    }

    return warnings;
  }

  useEffect(() => {
  function handleKeyDown(event: KeyboardEvent) {
    if (event.code === "Enter") {
      if (!isGameStarted && !isGameOver && !isStageComplete) {
        startGame();
      }

      return;
    }

    if (event.code === "KeyR" || event.code === "KeyM") {
      returnToMap();
      return;
    }

    if (event.code === "KeyN") {
      if (isStageComplete) {
        goToNextLevel();
      }

      return;
    }

    if (event.code === "KeyE") {
      drinkBottle();
      return;
    }

    if (event.code === "ShiftLeft" || event.code === "ShiftRight") {
      isShiftHeldRef.current = true;
      return;
    }

    if (event.code === "KeyA" || event.code === "ArrowLeft") {
      event.preventDefault();
      isLeftHeldRef.current = true;
      return;
    }

    if (event.code === "KeyD" || event.code === "ArrowRight") {
      event.preventDefault();
      isRightHeldRef.current = true;
      return;
    }

    if (event.code === "KeyW" || event.code === "ArrowUp") {
      event.preventDefault();
      switchLane(1);

      setHorizontalDirection("left");
      window.setTimeout(() => {
        setHorizontalDirection("none");
      }, 340);

      return;
    }

    if (event.code === "KeyS" || event.code === "ArrowDown") {
      event.preventDefault();
      switchLane(-1);

      setHorizontalDirection("right");
      window.setTimeout(() => {
        setHorizontalDirection("none");
      }, 340);
    }
  }

  function handleKeyUp(event: KeyboardEvent) {
    if (event.code === "ShiftLeft" || event.code === "ShiftRight") {
      isShiftHeldRef.current = false;
      setIsSprinting(false);
    }

    if (event.code === "KeyA" || event.code === "ArrowLeft") {
      isLeftHeldRef.current = false;
    }

    if (event.code === "KeyD" || event.code === "ArrowRight") {
      isRightHeldRef.current = false;
    }
  }

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);

  return () => {
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
  };
}, 
[
  isGameStarted,
  isGameOver,
  isStageComplete,
  bottles,
  lives,
  selectedLevelIndex,
]);

  useEffect(() => {
    if (!isGameStarted || isGameOver || isStageComplete) return;

    let animationFrameId: number;

    function updateGame(currentTime: number) {
      if (lastFrameTimeRef.current === null) {
        lastFrameTimeRef.current = currentTime;
      }

      const deltaTime = Math.min(
        (currentTime - lastFrameTimeRef.current) / 1000,
        0.033
      );

      lastFrameTimeRef.current = currentTime;

      const currentSpeedLevel = getSpeedLevelFromDistance(
        distanceRef.current,
        selectedLevel.finishDistance
      );

      if (coffeeTimeRef.current > 0) {
        coffeeTimeRef.current = Math.max(0, coffeeTimeRef.current - deltaTime);
        setCoffeeTime(Math.ceil(coffeeTimeRef.current));
      }

      if (bananaTimeRef.current > 0) {
        bananaTimeRef.current = Math.max(0, bananaTimeRef.current - deltaTime);
        setBananaTime(Math.ceil(bananaTimeRef.current));
      }

      const coffeeMultiplier = coffeeTimeRef.current > 0 ? 1.25 : 1;
      const canSprint = isShiftHeldRef.current && staminaRef.current > 5;
      const sprintMultiplier = canSprint ? 1.42 : 1;

      if (canSprint) {
        const bananaDrainMultiplier = bananaTimeRef.current > 0 ? 0.35 : 1;

        staminaRef.current = Math.max(
          0,
          staminaRef.current -
            SPRINT_STAMINA_DRAIN * bananaDrainMultiplier * deltaTime
        );

        setIsSprinting(true);
      } else {
        setIsSprinting(false);

        if (staminaRef.current < MAX_STAMINA) {
          const bananaRegenBonus = bananaTimeRef.current > 0 ? 36 : 18;

          staminaRef.current = Math.min(
            MAX_STAMINA,
            staminaRef.current + bananaRegenBonus * deltaTime
          );
        }
      }

      const totalSpeedMultiplier =
        sprintMultiplier * coffeeMultiplier * selectedLevel.speedMultiplier;

      const playerSpeed = PLAYER_MOVE_SPEED * (canSprint ? 1.12 : 1);

      if (isLeftHeldRef.current) {
        playerXRef.current -= playerSpeed * deltaTime;
      }

      if (isRightHeldRef.current) {
        playerXRef.current += playerSpeed * deltaTime;
      }

      playerXRef.current = Math.max(
        MIN_PLAYER_X,
        Math.min(getMaxPlayerX(), playerXRef.current)
      );

      setPlayerX(playerXRef.current);

      const roadSpeed =
        getBaseRoadSpeed(currentSpeedLevel) * totalSpeedMultiplier;

      const movedWaves = trafficWavesRef.current.map((wave) => ({
        ...wave,
        x: wave.x - roadSpeed * deltaTime,
      }));

      for (let i = 0; i < movedWaves.length; i++) {
        const wave = movedWaves[i];

        const longestVehicleWidth = Math.max(
          ...wave.vehicles.map((vehicle) => vehicle.kind.width)
        );

        if (wave.x < -longestVehicleWidth - 180) {
          const maxX = Math.max(
            getViewportWidth() + 700,
            ...movedWaves.map((item) => item.x)
          );

          const dynamicGap =
            WAVE_MIN_GAP -
            selectedLevel.trafficIntensity * 140 +
            Math.random() * WAVE_RANDOM_GAP;

          movedWaves[i] = createTrafficWave(
            maxX + dynamicGap,
            currentSpeedLevel,
            selectedLevel
          );
        }
      }

      trafficWavesRef.current = movedWaves;
      setTrafficWaves(movedWaves);

      const movedItems = roadItemsRef.current.map((item) => ({
        ...item,
        x: item.x - roadSpeed * 0.72 * deltaTime,
      }));

      for (let i = 0; i < movedItems.length; i++) {
        const item = movedItems[i];

        if (item.x < -120) {
          const maxX = Math.max(
            getViewportWidth() + 900,
            ...movedItems.map((currentItem) => currentItem.x)
          );

          movedItems[i] = createRoadItem(
            maxX + 700 + Math.random() * 900,
            getRandomLane()
          );
        }
      }

      roadItemsRef.current = movedItems;
      setRoadItems(movedItems);

      distanceRef.current +=
        currentSpeedLevel * totalSpeedMultiplier * deltaTime * 8.8;

      scoreRef.current += Math.floor(currentSpeedLevel * totalSpeedMultiplier);
      setScore(scoreRef.current);

      if (distanceRef.current >= selectedLevel.finishDistance) {
        distanceRef.current = selectedLevel.finishDistance;
        setDistance(selectedLevel.finishDistance);
        setIsStageComplete(true);
        setIsSprinting(false);
        setMessage("Stage complete!");
        addScore(300, "Finish Bonus", false);

        const nextUnlock = Math.min(selectedLevelIndex + 1, LEVELS.length - 1);

        setUnlockedLevelIndex((oldValue) => Math.max(oldValue, nextUnlock));

        return;
      }

      setDistance(Math.floor(distanceRef.current));
      setStamina(Math.floor(staminaRef.current));

      checkCollisionsAndRewards();

      animationFrameId = requestAnimationFrame(updateGame);
    }

    animationFrameId = requestAnimationFrame(updateGame);

    return () => {
      cancelAnimationFrame(animationFrameId);
      lastFrameTimeRef.current = null;
    };
  }, [isGameStarted, isGameOver, isStageComplete, selectedLevelIndex]);

  const incomingWarnings = getIncomingWarnings(trafficWaves);
  const playerAnimation = getPlayerAnimation();

  return (
    <div
      className={`game ${selectedLevel.themeClass} ${
  selectedLevel.backgroundImage ? "has-art-bg" : ""
} ${!isGameStarted ? "not-started" : ""} ${
  isGameOver ? "game-over" : ""
} ${isStageComplete ? "stage-complete" : ""}`}
    >
      {(isGameStarted || isGameOver || isStageComplete) && (
  <>
    <div className="game-progress-hud">
      <div
        className="game-progress-fill"
        style={{
          width: `${Math.min(
            100,
            (distance / selectedLevel.finishDistance) * 100
          )}%`,
        }}
      />
    </div>

    <div className="core-hud-left">
      <span className="hud-pill">❤️ {lives}</span>
      <span className="hud-pill">💧 {bottles}</span>
      {hasShield && <span className="hud-pill">🛡️</span>}
    </div>

    <div className="core-hud-right">
      <span className="hud-pill">📍 {distance}m</span>
      {combo > 0 && <span className="hud-pill combo-pill">🔥 x{combo}</span>}
    </div>

    {(isSprinting || stamina < 100) && (
      <div className="minimal-stamina">
        <div
          className="minimal-stamina-fill"
          style={{ width: `${stamina}%` }}
        />
      </div>
    )}

    {(coffeeTime > 0 || bananaTime > 0) && (
      <div className="active-buffs">
        {coffeeTime > 0 && <span>☕ {coffeeTime}s</span>}
        {bananaTime > 0 && <span>🍌 {bananaTime}s</span>}
      </div>
    )}

    {message &&
      message !== "Choose a stage" &&
      message !== "Ride started!" && (
        <div className="minimal-message">{message}</div>
      )}
  </>
)}
      {eventText && (
        <div key={eventKey} className="event-pop">
          {eventText}
        </div>
      )}

      {!isGameStarted && !isGameOver && !isStageComplete && (
        <div className="level-select-panel">
          <div className="level-select-header">
            <div className="game-title-row">
  <div className="menu-mascot-badge">
    <div
      className="title-melissa-icon"
      style={{
        backgroundImage: `url(${melissaVictorySprite})`,
        width: `${TITLE_MELISSA_FRAME_WIDTH}px`,
        height: `${TITLE_MELISSA_FRAME_HEIGHT}px`,
        backgroundPosition: `-${
          TITLE_MELISSA_FRAME_INDEX * TITLE_MELISSA_FRAME_WIDTH
        }px 0px`,
      }}
    />
  </div>

  <div className="game-title-text">
    <span className="game-kicker">Melissa’s cycling adventure</span>
    <h1>Ride to Bodensee</h1>
    <p>Choose a route stage and survive the ride to Konstanz.</p>
  </div>
</div>

            <div className="level-progress">
              Unlocked {unlockedLevelIndex + 1}/{LEVELS.length}
            </div>
          </div>

          <div className="level-grid">
            {LEVELS.map((level, index) => {
              const isLocked = index > unlockedLevelIndex;
              const isSelected = index === selectedLevelIndex;

              return (
                <button
  key={level.id}
  className={`level-card ${level.themeClass} ${
    level.backgroundImage ? "level-card-art" : ""
  } ${isSelected ? "selected" : ""} ${isLocked ? "locked" : ""}`}
  style={
    level.backgroundImage
      ? {
          backgroundImage: `linear-gradient(
            to bottom,
            rgba(15, 23, 42, 0.18) 0%,
            rgba(15, 23, 42, 0.12) 42%,
            rgba(15, 23, 42, 0.72) 100%
          ), url(${level.backgroundImage})`,
        }
      : undefined
  }
  onClick={() => selectLevel(index)}
  disabled={isLocked}
>
                  <div className="level-card-top">
                    <span className="level-badge">
  {isLocked ? (
    "🔒"
  ) : level.badge.includes(".png") ? (
    <img
      className="level-badge-image"
      src={level.badge}
      alt={`${level.title} badge`}
      draggable="false"
    />
  ) : (
    level.badge
  )}
</span>
                    <span className="level-number">Stage {level.id}</span>
                  </div>

                  <h2>{level.title}</h2>
                  <p>{level.subtitle}</p>

                  <div className="level-card-meta">
  <span>📍 {level.finishDistance}m</span>
</div>
                </button>
              );
            })}
          </div>

          <div className="selected-stage-preview">
  <div className="selected-stage-main">
    <div className="selected-stage-badge-wrap">
      {renderLevelBadge(
        selectedLevel.badge,
        selectedLevel.title,
        "selected-stage-badge-image"
      )}
    </div>

    <div className="selected-stage-copy">
      <span className="selected-stage-kicker">Selected stage</span>
      <h3>{selectedLevel.title}</h3>
      <h4>{selectedLevel.subtitle}</h4>
      <p>{selectedLevel.description}</p>

      <div className="selected-stage-meta">
        <span>📍 {selectedLevel.finishDistance}m</span>
        <span>🚴 Melissa route</span>
      </div>
    </div>
  </div>

  <div className="selected-stage-actions">
    <div className="selected-stage-action-note">
      Ready for the next ride?
    </div>

    <button className="primary-button" onClick={startGame}>
      Start Stage
    </button>
  </div>
</div>
        </div>
      )}

     {isGameOver && (
  <div className="game-over-panel compact-game-over-panel">
    <div className="compact-game-over-header">
      <span>💥</span>
      <div>
        <h2>Game Over</h2>
        <p>{selectedLevel.title} was too dangerous</p>
      </div>
    </div>

    <div className="compact-game-over-stats">
      <span>🏆 {score}</span>
      <span>🔥 x{bestCombo}</span>
      <span>📍 {distance}m</span>
      <span>💧 {bottles}</span>
    </div>

    <div className="compact-rank danger-rank">
      {getFinalRank(lives, bottles, score)}
    </div>

    <div className="panel-actions compact-actions">
      <button onClick={returnToMap}>Map</button>
      <button onClick={retryCurrentLevel}>Retry</button>
    </div>

    <p className="small-hint">R/M = map</p>
  </div>
)}

      {isStageComplete && (
  <div className="stage-complete-panel compact-stage-panel">
    <div className="compact-stage-header">
      <span>🏁</span>
      <div>
        <h2>Stage Complete!</h2>
        <p>{selectedLevel.title} cleared</p>
      </div>
    </div>

    <div className="compact-stage-stats">
      <span>🏆 {score}</span>
      <span>🔥 x{bestCombo}</span>
      <span>❤️ {lives}</span>
      <span>💧 {bottles}</span>
    </div>

    <div className="compact-rank">
      {finalRank}
    </div>

    <div className="panel-actions compact-actions">
      <button onClick={returnToMap}>Map</button>
      <button onClick={goToNextLevel}>
        {selectedLevelIndex >= LEVELS.length - 1 ? "Finish" : "Next"}
      </button>
    </div>

    <p className="small-hint">N = next · R/M = map</p>
  </div>
)}

      <div className="scene">
  {selectedLevel.backgroundImage && (
    <div
      className="level-background-image"
      style={{
        backgroundImage: `url(${selectedLevel.backgroundImage})`,
      }}
    />
  )}

  <div className="sky-glow"></div>

        <div className="theme-decor decor-a"></div>
        <div className="theme-decor decor-b"></div>
        <div className="theme-decor decor-c"></div>

        <div className="sun"></div>

        <div className="cloud cloud-one"></div>
        <div className="cloud cloud-two"></div>

        <div className="mountains mountains-back"></div>
        <div className="mountains mountains-front"></div>

        <div className="field field-back"></div>
        <div className="field field-front"></div>

        <div className="road">
          <div className="lane-separator lane-separator-one"></div>
          <div className="lane-separator lane-separator-two"></div>
          <div className="road-lines road-lines-upper"></div>
          <div className="road-lines road-lines-middle"></div>
          <div className="road-lines road-lines-lower"></div>
        </div>

        {incomingWarnings.map((lane) => (
          <div
            key={`warning-${lane}`}
            className="lane-warning"
            style={{
              bottom: `${LANES[lane].vehicleBottom + 42}px`,
              zIndex: LANES[lane].zIndex + 15,
            }}
          >
            ⚠️
          </div>
        ))}

        {trafficWaves.flatMap((wave) =>
  wave.vehicles.map((vehicle) => (
    <div
      key={vehicle.id}
      className={`vehicle-sprite-wrapper ${vehicle.kind.sizeClass}`}
      style={{
        width: `${vehicle.kind.width}px`,
        height: `${vehicle.kind.height}px`,
        bottom: `${LANES[vehicle.lane].vehicleBottom}px`,
        zIndex: LANES[vehicle.lane].zIndex,
        transform: `translateX(${wave.x + vehicle.offsetX}px)`,
      }}
    >
      <img
        className="vehicle-sprite"
        src={vehicle.kind.sprite}
        alt={vehicle.kind.brand}
        draggable="false"
      />
    </div>
  ))
)}

        {roadItems.map((item) => (
          <div
            key={item.id}
            className={`road-item road-item-${item.kind}`}
            style={{
              bottom: `${LANES[item.lane].itemBottom}px`,
              zIndex: LANES[item.lane].zIndex + 1,
              transform: `translateX(${item.x}px)`,
            }}
          >
            <span className="road-item-icon">{getItemEmoji(item.kind)}</span>
          </div>
        ))}

        <div
  className={`player ${isInvincible ? "invincible" : ""} ${
    hasShield ? "shielded" : ""
  }`}
  style={{
    left: `${playerX}px`,
    bottom: `${currentLane.playerBottom}px`,
    zIndex: currentLane.zIndex + 3,
  }}
>

  <div
    className={`player-sprite-strip player-sprite-${playerAnimation}`}
    role="img"
    aria-label="Melissa riding a bike"
  />
</div>
      </div>
    </div>
  );
}

export default App;