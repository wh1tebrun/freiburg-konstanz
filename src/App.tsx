import { useEffect, useRef, useState } from "react";
import "./App.css";

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

type GameLevel = {
  id: number;
  title: string;
  subtitle: string;
  badge: string;
  themeClass: string;
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
    subtitle: "Urban warm-up",
    badge: "🏙️",
    themeClass: "theme-city",
    finishDistance: 500,
    speedMultiplier: 1,
    trafficIntensity: 0,
  },
  {
    id: 2,
    title: "Black Forest",
    subtitle: "Green roads and tight traffic",
    badge: "🌲",
    themeClass: "theme-forest",
    finishDistance: 560,
    speedMultiplier: 1.04,
    trafficIntensity: 0.04,
  },
  {
    id: 3,
    title: "Rural Valley",
    subtitle: "Open countryside",
    badge: "🌾",
    themeClass: "theme-rural",
    finishDistance: 590,
    speedMultiplier: 1.06,
    trafficIntensity: 0.06,
  },
  {
    id: 4,
    title: "Bodensee Approach",
    subtitle: "Blue lake horizon",
    badge: "🌊",
    themeClass: "theme-lake",
    finishDistance: 620,
    speedMultiplier: 1.08,
    trafficIntensity: 0.08,
  },
  {
    id: 5,
    title: "Desert Road",
    subtitle: "Heat and long straights",
    badge: "🏜️",
    themeClass: "theme-desert",
    finishDistance: 650,
    speedMultiplier: 1.1,
    trafficIntensity: 0.09,
  },
  {
    id: 6,
    title: "Volcanic Pass",
    subtitle: "Lava road chaos",
    badge: "🌋",
    themeClass: "theme-volcano",
    finishDistance: 680,
    speedMultiplier: 1.12,
    trafficIntensity: 0.1,
  },
  {
    id: 7,
    title: "Night Autobahn",
    subtitle: "Fast lights, fast cars",
    badge: "🌙",
    themeClass: "theme-night",
    finishDistance: 720,
    speedMultiplier: 1.16,
    trafficIntensity: 0.12,
  },
  {
    id: 8,
    title: "Snowy Alps",
    subtitle: "Cold air and slippery lanes",
    badge: "❄️",
    themeClass: "theme-snow",
    finishDistance: 760,
    speedMultiplier: 1.12,
    trafficIntensity: 0.14,
  },
  {
    id: 9,
    title: "Rainy City",
    subtitle: "Wet asphalt, low visibility",
    badge: "🌧️",
    themeClass: "theme-rain",
    finishDistance: 800,
    speedMultiplier: 1.18,
    trafficIntensity: 0.15,
  },
  {
    id: 10,
    title: "Sunset Coast",
    subtitle: "Final ride to Konstanz",
    badge: "🌅",
    themeClass: "theme-sunset",
    finishDistance: 850,
    speedMultiplier: 1.22,
    trafficIntensity: 0.17,
  },
];

const LANES: Lane[] = [
  {
    name: "Lower Lane",
    shortName: "Lower",
    playerBottom: 52,
    vehicleBottom: 66,
    itemBottom: 48,
    zIndex: 62,
  },
  {
    name: "Middle Lane",
    shortName: "Middle",
    playerBottom: 192,
    vehicleBottom: 206,
    itemBottom: 198,
    zIndex: 52,
  },
  {
    name: "Upper Lane",
    shortName: "Upper",
    playerBottom: 332,
    vehicleBottom: 346,
    itemBottom: 348,
    zIndex: 42,
  },
];

const VEHICLE_KINDS: VehicleKind[] = [
  {
    brand: "BMW",
    cssClass: "car-bmw",
    sizeClass: "vehicle-car",
    width: 132,
    height: 58,
    speedFactor: 1.08,
  },
  {
    brand: "AUDI",
    cssClass: "car-audi",
    sizeClass: "vehicle-car",
    width: 138,
    height: 58,
    speedFactor: 1.04,
  },
  {
    brand: "MERC",
    cssClass: "car-mercedes",
    sizeClass: "vehicle-car",
    width: 146,
    height: 60,
    speedFactor: 1,
  },
  {
    brand: "VW",
    cssClass: "car-vw",
    sizeClass: "vehicle-car-small",
    width: 120,
    height: 56,
    speedFactor: 1.12,
  },
  {
    brand: "POR",
    cssClass: "car-porsche",
    sizeClass: "vehicle-sport",
    width: 150,
    height: 54,
    speedFactor: 1.2,
  },
  {
    brand: "MAN",
    cssClass: "truck-man",
    sizeClass: "vehicle-truck",
    width: 230,
    height: 82,
    speedFactor: 0.82,
  },
  {
    brand: "DHL",
    cssClass: "truck-dhl",
    sizeClass: "vehicle-truck",
    width: 220,
    height: 80,
    speedFactor: 0.86,
  },
  {
    brand: "MB",
    cssClass: "truck-mercedes",
    sizeClass: "vehicle-truck",
    width: 240,
    height: 84,
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
    setMessage(`${LANES[nextLane].name}`);
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

  function useBottle() {
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

  function getIncomingWarnings() {
    const screenWidth = getViewportWidth();
    const warnings: LaneIndex[] = [];

    for (const wave of trafficWavesRef.current) {
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
        useBottle();
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
        return;
      }

      if (event.code === "KeyS" || event.code === "ArrowDown") {
        event.preventDefault();
        switchLane(-1);
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
  }, [
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

      let movedWaves = trafficWavesRef.current.map((wave) => ({
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

      let movedItems = roadItemsRef.current.map((item) => ({
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

  const incomingWarnings = getIncomingWarnings();

  return (
    <div
      className={`game ${selectedLevel.themeClass} ${
        !isGameStarted ? "not-started" : ""
      } ${isGameOver ? "game-over" : ""} ${
        isStageComplete ? "stage-complete" : ""
      }`}
    >
      {(isGameStarted || isGameOver || isStageComplete) && (
        <div className="hud">
          <div className="hud-title">
            <span>{selectedLevel.badge}</span>
            <strong>{selectedLevel.title}</strong>
          </div>

          <div className="stat-grid">
            <div className="stat">🏆 {score}</div>
            <div className="stat">🔥 x{combo}</div>
            <div className="stat">
              📍 {distance}/{selectedLevel.finishDistance}m
            </div>
            <div className="stat">⚡ Lv.{speedLevel}</div>
            <div className="stat">{isSprinting ? "🔥 Sprint" : "🚲 Normal"}</div>
            <div className="stat">🛣️ {currentLane.shortName}</div>
            <div className="stat">❤️ {"❤️".repeat(lives)}</div>
            <div className="stat">
              💧 {bottles} {hasShield ? "🛡️" : ""}
            </div>
          </div>

          <div className="power-row">
            <span>{coffeeTime > 0 ? `☕ ${coffeeTime}s` : "☕ -"}</span>
            <span>{bananaTime > 0 ? `🍌 ${bananaTime}s` : "🍌 -"}</span>
          </div>

          <div className="stamina-row">
            <span>🔋</span>
            <div className="stamina-bar">
              <div
                className="stamina-fill"
                style={{ width: `${stamina}%` }}
              ></div>
            </div>
            <span>{stamina}</span>
          </div>

          <div className="message-line">{message}</div>

          <div className="controls-hint">
            <span>A/D move</span>
            <span>W/S lane</span>
            <span>Shift sprint</span>
            <span>E bottle</span>
          </div>
        </div>
      )}

      {eventText && (
        <div key={eventKey} className="event-pop">
          {eventText}
        </div>
      )}

      {!isGameStarted && !isGameOver && !isStageComplete && (
        <div className="level-select-panel">
          <div className="level-select-header">
            <div>
              <h1>🚴‍♀️ Ride to Bodensee</h1>
              <p>Choose a route stage and survive the ride to Konstanz.</p>
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
                    isSelected ? "selected" : ""
                  } ${isLocked ? "locked" : ""}`}
                  onClick={() => selectLevel(index)}
                  disabled={isLocked}
                >
                  <div className="level-card-top">
                    <span className="level-badge">
                      {isLocked ? "🔒" : level.badge}
                    </span>
                    <span className="level-number">Stage {level.id}</span>
                  </div>

                  <h2>{level.title}</h2>
                  <p>{level.subtitle}</p>

                  <div className="level-card-meta">
                    <span>📍 {level.finishDistance}m</span>
                    <span>⚡ x{level.speedMultiplier.toFixed(2)}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="level-select-footer">
            <button className="primary-button" onClick={startGame}>
              Start {selectedLevel.badge} {selectedLevel.title}
            </button>

            <p>Controls: A/D move · W/S lane · Shift sprint · E bottle · R map</p>
          </div>
        </div>
      )}

      {isGameOver && (
        <div className="game-over-panel">
          <h2>💥 Game Over</h2>
          <p>{selectedLevel.title} got too dangerous.</p>
          <p>Score: {score}</p>
          <p>Best Combo: x{bestCombo}</p>
          <p>Distance: {distance} m</p>
          <p>Bottles left: {bottles}</p>
          <p>Rank: {getFinalRank(lives, bottles, score)}</p>

          <div className="panel-actions">
            <button onClick={returnToMap}>Back to Map</button>
            <button onClick={retryCurrentLevel}>Retry</button>
          </div>
        </div>
      )}

      {isStageComplete && (
        <div className="stage-complete-panel">
          <h2>🏁 Stage Complete!</h2>
          <p>{selectedLevel.title} cleared.</p>
          <p>Score: {score}</p>
          <p>Best Combo: x{bestCombo}</p>
          <p>Lives left: {"❤️".repeat(lives)}</p>
          <p>Bottles left: {bottles}</p>
          <p>Rank: {finalRank}</p>

          <div className="panel-actions">
            <button onClick={returnToMap}>Map</button>
            <button onClick={goToNextLevel}>
              {selectedLevelIndex >= LEVELS.length - 1 ? "Finish" : "Next Stage"}
            </button>
          </div>

          <p className="small-hint">N = next stage · R/M = map</p>
        </div>
      )}

      <div className="scene">
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
              className={`vehicle ${vehicle.kind.cssClass} ${vehicle.kind.sizeClass}`}
              style={{
                width: `${vehicle.kind.width}px`,
                height: `${vehicle.kind.height}px`,
                bottom: `${LANES[vehicle.lane].vehicleBottom}px`,
                zIndex: LANES[vehicle.lane].zIndex,
                transform: `translateX(${wave.x + vehicle.offsetX}px)`,
              }}
            >
              <div className="vehicle-shine"></div>
              <span className="vehicle-brand">{vehicle.kind.brand}</span>
              <div className="vehicle-window vehicle-window-one"></div>
              <div className="vehicle-window vehicle-window-two"></div>
              <div className="vehicle-light"></div>
              <div className="vehicle-wheel vehicle-wheel-left"></div>
              <div className="vehicle-wheel vehicle-wheel-right"></div>
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
  <div className="player-name-tag">Melissa</div>

  <img
    className="player-sprite"
    src="/assets/player/melissa-bike.png"
    alt="Melissa riding a bike"
    draggable="false"
  />
</div>
      </div>
    </div>
  );
}

export default App;