export type GamePhase = "menu" | "playing" | "paused" | "gameOver" | "stageComplete";

export type LaneIndex = 0 | 1 | 2;
export type PickupKind = "water" | "shield" | "banana" | "coffee" | "croissant";

export interface GameLevel {
  readonly id: number;
  readonly title: string;
  readonly subtitle: string;
  readonly description: string;
  readonly badge: string;
  readonly backgroundImage: string;
  readonly finishDistance: number;
  readonly speedMultiplier: number;
  readonly trafficIntensity: number;
}

export interface VehicleKind {
  readonly id: string;
  readonly label: string;
  readonly body: "compact" | "sedan" | "sport" | "van" | "truck";
  readonly color: "alpine" | "charcoal" | "cream" | "forest" | "sunset";
  readonly width: number;
  readonly speedFactor: number;
}

export interface PlayerState {
  readonly x: number;
  readonly width: number;
  readonly lane: LaneIndex;
  readonly lives: number;
  readonly hasShield: boolean;
  readonly invulnerabilityRemaining: number;
}

export interface VehicleState {
  readonly id: number;
  readonly kindId: string;
  readonly lane: LaneIndex;
  readonly x: number;
  readonly width: number;
  readonly speedFactor: number;
  readonly nearMissAwarded: boolean;
  readonly passAwarded: boolean;
}

export interface PickupState {
  readonly id: number;
  readonly kind: PickupKind;
  readonly lane: LaneIndex;
  readonly x: number;
  readonly width: number;
}

export interface BuffState {
  readonly coffeeRemaining: number;
  readonly bananaRemaining: number;
}

export type GameEvent =
  | { readonly type: "vehiclePassed"; readonly vehicleId: number }
  | {
      readonly type: "nearMiss";
      readonly vehicleId: number;
      readonly points: number;
      readonly multiplier: number;
    }
  | { readonly type: "damage"; readonly livesRemaining: number }
  | { readonly type: "shieldBlocked" }
  | { readonly type: "pickupCollected"; readonly kind: PickupKind }
  | { readonly type: "stageComplete"; readonly stageIndex: number }
  | { readonly type: "gameOver" };

export interface GameState {
  readonly phase: GamePhase;
  readonly stageIndex: number;
  readonly unlockedStageIndex: number;
  readonly rngSeed: number;
  readonly elapsedSeconds: number;
  readonly distance: number;
  readonly score: number;
  readonly combo: number;
  readonly bestCombo: number;
  readonly stamina: number;
  readonly sprintExhausted: boolean;
  readonly bottles: number;
  readonly player: PlayerState;
  readonly buffs: BuffState;
  readonly vehicles: readonly VehicleState[];
  readonly pickups: readonly PickupState[];
  readonly nextEntityId: number;
  readonly events: readonly GameEvent[];
}

export interface GameInput {
  readonly start?: boolean;
  readonly pauseToggle?: boolean;
  readonly horizontal?: number;
  readonly laneDelta?: -1 | 0 | 1;
  readonly sprint?: boolean;
  readonly useBottle?: boolean;
}

export interface CreateGameOptions {
  readonly stageIndex?: number;
  readonly unlockedStageIndex?: number;
  readonly seed?: number;
  readonly populateWorld?: boolean;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface PersistedProgress {
  readonly version: 1;
  readonly unlockedStageIndex: number;
}
