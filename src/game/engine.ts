import {
  BANANA_DURATION_SECONDS,
  BANANA_STAMINA_DRAIN_MULTIPLIER,
  BANANA_STAMINA_REGEN_PER_SECOND,
  BASE_DISTANCE_PER_SECOND,
  BASE_ROAD_SPEED,
  BASE_SCORE_PER_SECOND,
  COFFEE_DURATION_SECONDS,
  COFFEE_SPEED_MULTIPLIER,
  DAMAGE_INVULNERABILITY_SECONDS,
  DEFAULT_RNG_SEED,
  ENTITY_DESPAWN_X,
  FINISH_SCORE_BONUS,
  LANE_COUNT,
  MAX_LIVES,
  MAX_STAMINA,
  MAX_COMBO_MULTIPLIER,
  NEAR_MISS_BASE_SCORE,
  NEAR_MISS_MARGIN,
  PICKUP_SPAWN_GAP_MIN,
  PICKUP_SPAWN_GAP_RANDOM,
  PICKUP_SPAWN_MIN_X,
  PLAYER_MOVE_SPEED,
  PLAYER_START_X,
  PLAYER_WIDTH,
  SHIELD_INVULNERABILITY_SECONDS,
  SPRINT_RECOVERY_THRESHOLD,
  SPRINT_SPEED_MULTIPLIER,
  SPRINT_STAMINA_DRAIN_PER_SECOND,
  STAMINA_REGEN_PER_SECOND,
  VEHICLE_SPAWN_GAP_MIN,
  VEHICLE_SPAWN_GAP_RANDOM,
  VEHICLE_SPAWN_MIN_X,
  WORLD_WIDTH,
} from "./constants";
import { sameLaneCollision, sameLaneNearMiss } from "./collision";
import { clampStageIndex, getLevel, LEVELS } from "./config/levels";
import { VEHICLE_KINDS } from "./config/vehicles";
import { clampUnlockedStage } from "./progress";
import { normalizeSeed, randomInt, randomRange } from "./random";
import type {
  CreateGameOptions,
  GameEvent,
  GameInput,
  GameState,
  LaneIndex,
  PickupKind,
  PickupState,
  VehicleKind,
  VehicleState,
} from "./types";

const MAX_SIMULATION_SLICE_SECONDS = 1 / 120;
const PASS_SCORE = 8;
const PICKUP_WIDTH = 38;
const EPSILON = 1e-9;

const PICKUP_KINDS = [
  "water",
  "shield",
  "banana",
  "coffee",
  "croissant",
] as const satisfies readonly PickupKind[];

interface SpawnedWorld {
  readonly rngSeed: number;
  readonly nextEntityId: number;
  readonly vehicles: readonly VehicleState[];
  readonly pickups: readonly PickupState[];
}

interface SpawnResult<T> {
  readonly entity: T;
  readonly rngSeed: number;
}

export function createGameState(options: CreateGameOptions = {}): GameState {
  const unlockedStageIndex = clampUnlockedStage(options.unlockedStageIndex ?? 0);
  const requestedStageIndex = clampStageIndex(options.stageIndex ?? 0);
  const stageIndex = Math.min(requestedStageIndex, unlockedStageIndex);
  const seed = normalizeSeed(options.seed ?? DEFAULT_RNG_SEED);
  const world =
    options.populateWorld === false
      ? {
          rngSeed: seed,
          nextEntityId: 1,
          vehicles: [],
          pickups: [],
        }
      : createInitialWorld(seed, stageIndex);

  return {
    phase: "menu",
    stageIndex,
    unlockedStageIndex,
    rngSeed: world.rngSeed,
    elapsedSeconds: 0,
    distance: 0,
    score: 0,
    combo: 0,
    bestCombo: 0,
    stamina: MAX_STAMINA,
    sprintExhausted: false,
    bottles: 0,
    player: {
      x: PLAYER_START_X,
      width: PLAYER_WIDTH,
      lane: 1,
      lives: MAX_LIVES,
      hasShield: false,
      invulnerabilityRemaining: 0,
    },
    buffs: {
      coffeeRemaining: 0,
      bananaRemaining: 0,
    },
    vehicles: world.vehicles,
    pickups: world.pickups,
    nextEntityId: world.nextEntityId,
    events: [],
  };
}

export function startGame(state: GameState): GameState {
  if (state.phase !== "menu" && state.phase !== "paused") return state;
  return { ...state, phase: "playing", events: [] };
}

export function pauseGame(state: GameState): GameState {
  if (state.phase === "playing") {
    return { ...state, phase: "paused", events: [] };
  }

  if (state.phase === "paused") {
    return { ...state, phase: "playing", events: [] };
  }

  return state;
}

export function selectStage(state: GameState, requestedIndex: number): GameState {
  const stageIndex = clampStageIndex(requestedIndex);
  if (stageIndex > state.unlockedStageIndex) return state;

  return createGameState({
    stageIndex,
    unlockedStageIndex: state.unlockedStageIndex,
    seed: state.rngSeed,
  });
}

export function restartStage(state: GameState): GameState {
  return createGameState({
    stageIndex: state.stageIndex,
    unlockedStageIndex: state.unlockedStageIndex,
    seed: state.rngSeed,
  });
}

export function stepGame(state: GameState, input: GameInput = {}, deltaSeconds: number): GameState {
  if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
    throw new RangeError("deltaSeconds must be a finite, non-negative number.");
  }

  let nextState: GameState = { ...state, events: [] };

  if (input.pauseToggle) {
    nextState = pauseGame(nextState);
  }

  if (input.start) {
    nextState = startGame(nextState);
  }

  if (nextState.phase !== "playing") return nextState;

  nextState = applyDiscreteInput(nextState, input);

  let remaining = deltaSeconds;

  while (remaining > EPSILON && nextState.phase === "playing") {
    const sliceDuration = Math.min(remaining, getNextSimulationSlice(nextState, input, remaining));

    if (sliceDuration <= EPSILON) {
      nextState = normalizeExpiredEffects(nextState);
      remaining = Math.max(0, remaining - EPSILON);
      continue;
    }

    nextState = advanceSlice(nextState, input, sliceDuration);
    remaining -= sliceDuration;
  }

  return nextState;
}

export function getSpeedLevel(distance: number, finishDistance: number): 1 | 2 | 3 {
  if (distance >= finishDistance * 0.7) return 3;
  if (distance >= finishDistance * 0.35) return 2;
  return 1;
}

export function getDisplayScore(state: GameState): number {
  return Math.floor(state.score + EPSILON);
}

function applyDiscreteInput(state: GameState, input: GameInput): GameState {
  const laneDelta = input.laneDelta ?? 0;
  const nextLane = clampLane(state.player.lane + laneDelta);
  let nextState: GameState = {
    ...state,
    player: nextLane === state.player.lane ? state.player : { ...state.player, lane: nextLane },
  };

  if (input.useBottle) {
    nextState = consumeBottle(nextState);
  }

  return nextState;
}

function consumeBottle(state: GameState): GameState {
  const canHeal = state.player.lives < MAX_LIVES;
  const canRestoreStamina = state.stamina < MAX_STAMINA;

  if (state.bottles <= 0 || (!canHeal && !canRestoreStamina)) return state;

  return {
    ...state,
    bottles: state.bottles - 1,
    stamina: Math.min(MAX_STAMINA, state.stamina + 35),
    player: {
      ...state.player,
      lives: Math.min(MAX_LIVES, state.player.lives + 1),
    },
  };
}

function getNextSimulationSlice(state: GameState, input: GameInput, remaining: number): number {
  const level = getLevel(state.stageIndex);
  const speedLevel = getSpeedLevel(state.distance, level.finishDistance);
  const speedMultiplier = getTotalSpeedMultiplier(state, input);
  const distanceRate =
    BASE_DISTANCE_PER_SECOND * speedLevel * speedMultiplier * level.speedMultiplier;

  let slice = Math.min(remaining, MAX_SIMULATION_SLICE_SECONDS);

  slice = limitToPositiveBoundary(slice, state.buffs.coffeeRemaining);
  slice = limitToPositiveBoundary(slice, state.buffs.bananaRemaining);
  slice = limitToPositiveBoundary(slice, state.player.invulnerabilityRemaining);

  if (input.sprint && !state.sprintExhausted && state.stamina > EPSILON) {
    const drainRate = getStaminaDrainRate(state);
    slice = limitToPositiveBoundary(slice, state.stamina / drainRate);
  }

  const nextDistanceBoundary = getNextDistanceBoundary(state.distance, level.finishDistance);

  if (distanceRate > EPSILON) {
    slice = limitToPositiveBoundary(slice, (nextDistanceBoundary - state.distance) / distanceRate);
  }

  return Math.max(EPSILON, slice);
}

function advanceSlice(state: GameState, input: GameInput, deltaSeconds: number): GameState {
  const level = getLevel(state.stageIndex);
  const speedLevel = getSpeedLevel(state.distance, level.finishDistance);
  const isSprinting = Boolean(input.sprint) && !state.sprintExhausted && state.stamina > EPSILON;
  const totalSpeedMultiplier = getTotalSpeedMultiplier(state, input);
  const roadSpeed = BASE_ROAD_SPEED * speedLevel * totalSpeedMultiplier * level.speedMultiplier;
  const distanceRate =
    BASE_DISTANCE_PER_SECOND * speedLevel * totalSpeedMultiplier * level.speedMultiplier;
  const scoreRate =
    BASE_SCORE_PER_SECOND * speedLevel * totalSpeedMultiplier * level.speedMultiplier;

  const horizontal = clamp(input.horizontal ?? 0, -1, 1);
  const playerX = clamp(
    state.player.x + horizontal * PLAYER_MOVE_SPEED * deltaSeconds,
    0,
    WORLD_WIDTH - state.player.width,
  );

  const staminaRate = isSprinting
    ? -getStaminaDrainRate(state)
    : input.sprint && state.sprintExhausted
      ? 0
      : getStaminaRegenRate(state);
  const stamina = clamp(state.stamina + staminaRate * deltaSeconds, 0, MAX_STAMINA);
  const sprintExhausted = isSprinting
    ? stamina <= EPSILON
    : state.sprintExhausted && (Boolean(input.sprint) || stamina < SPRINT_RECOVERY_THRESHOLD);

  const distance = Math.min(level.finishDistance, state.distance + distanceRate * deltaSeconds);

  let nextState: GameState = {
    ...state,
    elapsedSeconds: state.elapsedSeconds + deltaSeconds,
    distance,
    score: state.score + scoreRate * deltaSeconds,
    stamina,
    sprintExhausted,
    player: {
      ...state.player,
      x: playerX,
      invulnerabilityRemaining: Math.max(0, state.player.invulnerabilityRemaining - deltaSeconds),
    },
    buffs: {
      coffeeRemaining: Math.max(0, state.buffs.coffeeRemaining - deltaSeconds),
      bananaRemaining: Math.max(0, state.buffs.bananaRemaining - deltaSeconds),
    },
    vehicles: state.vehicles.map((vehicle) => ({
      ...vehicle,
      x: vehicle.x - roadSpeed * vehicle.speedFactor * deltaSeconds,
    })),
    pickups: state.pickups.map((pickup) => ({
      ...pickup,
      x: pickup.x - roadSpeed * 0.72 * deltaSeconds,
    })),
  };

  if (distance >= level.finishDistance - EPSILON) {
    const unlockedStageIndex = clampUnlockedStage(
      Math.max(state.unlockedStageIndex, state.stageIndex + 1),
    );

    return {
      ...nextState,
      phase: "stageComplete",
      distance: level.finishDistance,
      score: nextState.score + FINISH_SCORE_BONUS,
      unlockedStageIndex,
      events: [...nextState.events, { type: "stageComplete", stageIndex: state.stageIndex }],
    };
  }

  nextState = processPasses(nextState);
  nextState = processVehicleCollisions(nextState);

  if (nextState.phase === "gameOver") return recycleEntities(nextState);

  nextState = processNearMisses(nextState);
  nextState = processPickupCollisions(nextState);
  return recycleEntities(nextState);
}

function processPasses(state: GameState): GameState {
  let gainedScore = 0;
  const events: GameEvent[] = [];

  const vehicles = state.vehicles.map((vehicle) => {
    if (vehicle.passAwarded || vehicle.x + vehicle.width >= state.player.x) {
      return vehicle;
    }

    gainedScore += PASS_SCORE;
    events.push({ type: "vehiclePassed", vehicleId: vehicle.id });
    return { ...vehicle, passAwarded: true };
  });

  if (gainedScore === 0) return state;

  return {
    ...state,
    score: state.score + gainedScore,
    vehicles,
    events: [...state.events, ...events],
  };
}

function processVehicleCollisions(state: GameState): GameState {
  let player = state.player;
  let phase = state.phase;
  let combo = state.combo;
  const recycleIds = new Set<number>();
  const events: GameEvent[] = [];

  for (const vehicle of state.vehicles) {
    if (
      phase !== "playing" ||
      player.invulnerabilityRemaining > EPSILON ||
      !sameLaneCollision(player, vehicle)
    ) {
      continue;
    }

    recycleIds.add(vehicle.id);

    if (player.hasShield) {
      player = {
        ...player,
        hasShield: false,
        invulnerabilityRemaining: SHIELD_INVULNERABILITY_SECONDS,
      };
      events.push({ type: "shieldBlocked" });
      continue;
    }

    const lives = Math.max(0, player.lives - 1);
    combo = 0;
    player = {
      ...player,
      lives,
      invulnerabilityRemaining: lives > 0 ? DAMAGE_INVULNERABILITY_SECONDS : 0,
    };
    events.push({ type: "damage", livesRemaining: lives });

    if (lives === 0) {
      phase = "gameOver";
      events.push({ type: "gameOver" });
    }
  }

  if (recycleIds.size === 0) return state;

  return {
    ...state,
    phase,
    player,
    combo,
    events: [...state.events, ...events],
    vehicles: state.vehicles.map((vehicle) =>
      recycleIds.has(vehicle.id)
        ? { ...vehicle, x: ENTITY_DESPAWN_X - vehicle.width - 1 }
        : vehicle,
    ),
  };
}

function processNearMisses(state: GameState): GameState {
  let combo = state.combo;
  let bestCombo = state.bestCombo;
  let gainedScore = 0;
  const events: GameEvent[] = [];

  const vehicles = state.vehicles.map((vehicle) => {
    if (vehicle.nearMissAwarded || !sameLaneNearMiss(state.player, vehicle, NEAR_MISS_MARGIN)) {
      return vehicle;
    }

    combo += 1;
    bestCombo = Math.max(bestCombo, combo);

    const multiplier = Math.min(combo, MAX_COMBO_MULTIPLIER);
    const points = NEAR_MISS_BASE_SCORE * multiplier;

    gainedScore += points;
    events.push({
      type: "nearMiss",
      vehicleId: vehicle.id,
      points,
      multiplier,
    });

    return { ...vehicle, nearMissAwarded: true };
  });

  if (events.length === 0) return state;

  return {
    ...state,
    score: state.score + gainedScore,
    combo,
    bestCombo,
    vehicles,
    events: [...state.events, ...events],
  };
}

function processPickupCollisions(state: GameState): GameState {
  const collected = state.pickups.filter((pickup) => sameLaneCollision(state.player, pickup));

  if (collected.length === 0) return state;

  let nextState = state;
  const collectedIds = new Set(collected.map((pickup) => pickup.id));

  for (const pickup of collected) {
    nextState = applyPickupEffect(nextState, pickup.kind);
  }

  return {
    ...nextState,
    pickups: state.pickups.map((pickup) =>
      collectedIds.has(pickup.id) ? { ...pickup, x: ENTITY_DESPAWN_X - pickup.width - 1 } : pickup,
    ),
  };
}

export function applyPickupEffect(state: GameState, kind: PickupKind): GameState {
  const event: GameEvent = { type: "pickupCollected", kind };

  if (kind === "water") {
    return {
      ...state,
      bottles: state.bottles + 1,
      score: state.score + 25,
      events: [...state.events, event],
    };
  }

  if (kind === "shield") {
    return {
      ...state,
      player: { ...state.player, hasShield: true },
      score: state.score + 60,
      events: [...state.events, event],
    };
  }

  if (kind === "banana") {
    return {
      ...state,
      stamina: Math.min(MAX_STAMINA, state.stamina + 28),
      buffs: {
        ...state.buffs,
        bananaRemaining: BANANA_DURATION_SECONDS,
      },
      score: state.score + 45,
      events: [...state.events, event],
    };
  }

  if (kind === "coffee") {
    return {
      ...state,
      buffs: {
        ...state.buffs,
        coffeeRemaining: COFFEE_DURATION_SECONDS,
      },
      score: state.score + 55,
      events: [...state.events, event],
    };
  }

  return {
    ...state,
    stamina: Math.min(MAX_STAMINA, state.stamina + 35),
    player: {
      ...state.player,
      lives: Math.min(MAX_LIVES, state.player.lives + 1),
    },
    score: state.score + 75,
    events: [...state.events, event],
  };
}

function recycleEntities(state: GameState): GameState {
  let rngSeed = state.rngSeed;
  const level = getLevel(state.stageIndex);
  let furthestVehicleX = Math.max(
    VEHICLE_SPAWN_MIN_X,
    ...state.vehicles
      .filter((vehicle) => vehicle.x + vehicle.width >= ENTITY_DESPAWN_X)
      .map((vehicle) => vehicle.x),
  );

  const vehicles = state.vehicles.map((vehicle) => {
    if (vehicle.x + vehicle.width >= ENTITY_DESPAWN_X) return vehicle;

    const gapSample = randomRange(
      rngSeed,
      Math.max(180, VEHICLE_SPAWN_GAP_MIN - level.trafficIntensity * 300),
      VEHICLE_SPAWN_GAP_MIN + VEHICLE_SPAWN_GAP_RANDOM,
    );
    const x = furthestVehicleX + gapSample.value;
    const spawned = spawnVehicle(vehicle.id, x, gapSample.seed);

    rngSeed = spawned.rngSeed;
    furthestVehicleX = x;
    return spawned.entity;
  });

  let furthestPickupX = Math.max(
    PICKUP_SPAWN_MIN_X,
    ...state.pickups
      .filter((pickup) => pickup.x + pickup.width >= ENTITY_DESPAWN_X)
      .map((pickup) => pickup.x),
  );

  const pickups = state.pickups.map((pickup) => {
    if (pickup.x + pickup.width >= ENTITY_DESPAWN_X) return pickup;

    const gapSample = randomRange(
      rngSeed,
      PICKUP_SPAWN_GAP_MIN,
      PICKUP_SPAWN_GAP_MIN + PICKUP_SPAWN_GAP_RANDOM,
    );
    const x = furthestPickupX + gapSample.value;
    const spawned = spawnPickup(pickup.id, x, gapSample.seed);

    rngSeed = spawned.rngSeed;
    furthestPickupX = x;
    return spawned.entity;
  });

  const didRecycleVehicle = vehicles.some((vehicle, index) => vehicle !== state.vehicles[index]);
  const didRecyclePickup = pickups.some((pickup, index) => pickup !== state.pickups[index]);

  if (!didRecycleVehicle && !didRecyclePickup) return state;

  return { ...state, rngSeed, vehicles, pickups };
}

function createInitialWorld(seed: number, stageIndex: number): SpawnedWorld {
  const level = getLevel(stageIndex);
  let rngSeed = seed;
  let nextEntityId = 1;
  let vehicleX = VEHICLE_SPAWN_MIN_X;
  const vehicles: VehicleState[] = [];

  for (let index = 0; index < 5; index += 1) {
    const gapSample = randomRange(
      rngSeed,
      Math.max(180, VEHICLE_SPAWN_GAP_MIN - level.trafficIntensity * 300),
      VEHICLE_SPAWN_GAP_MIN + VEHICLE_SPAWN_GAP_RANDOM,
    );
    vehicleX += index === 0 ? 0 : gapSample.value;
    const spawned = spawnVehicle(nextEntityId, vehicleX, gapSample.seed);

    vehicles.push(spawned.entity);
    rngSeed = spawned.rngSeed;
    nextEntityId += 1;
  }

  let pickupX = PICKUP_SPAWN_MIN_X;
  const pickups: PickupState[] = [];

  for (let index = 0; index < 4; index += 1) {
    const gapSample = randomRange(
      rngSeed,
      PICKUP_SPAWN_GAP_MIN,
      PICKUP_SPAWN_GAP_MIN + PICKUP_SPAWN_GAP_RANDOM,
    );
    pickupX += index === 0 ? 0 : gapSample.value;
    const spawned = spawnPickup(nextEntityId, pickupX, gapSample.seed);

    pickups.push(spawned.entity);
    rngSeed = spawned.rngSeed;
    nextEntityId += 1;
  }

  return { rngSeed, nextEntityId, vehicles, pickups };
}

function spawnVehicle(id: number, x: number, seed: number): SpawnResult<VehicleState> {
  const laneSample = randomInt(seed, 0, LANE_COUNT);
  const kindSample = randomInt(laneSample.seed, 0, VEHICLE_KINDS.length);
  const kind = getVehicleKindAt(kindSample.value);

  return {
    rngSeed: kindSample.seed,
    entity: {
      id,
      kindId: kind.id,
      lane: laneSample.value as LaneIndex,
      x,
      width: kind.width,
      speedFactor: kind.speedFactor,
      nearMissAwarded: false,
      passAwarded: false,
    },
  };
}

function spawnPickup(id: number, x: number, seed: number): SpawnResult<PickupState> {
  const laneSample = randomInt(seed, 0, LANE_COUNT);
  const kindSample = randomInt(laneSample.seed, 0, PICKUP_KINDS.length);
  const kind = PICKUP_KINDS[kindSample.value] ?? PICKUP_KINDS[0];

  return {
    rngSeed: kindSample.seed,
    entity: {
      id,
      kind,
      lane: laneSample.value as LaneIndex,
      x,
      width: PICKUP_WIDTH,
    },
  };
}

function getVehicleKindAt(index: number): VehicleKind {
  return VEHICLE_KINDS[index] ?? VEHICLE_KINDS[0];
}

function getTotalSpeedMultiplier(state: GameState, input: GameInput): number {
  const coffeeMultiplier = state.buffs.coffeeRemaining > EPSILON ? COFFEE_SPEED_MULTIPLIER : 1;
  const sprintMultiplier =
    input.sprint && !state.sprintExhausted && state.stamina > EPSILON ? SPRINT_SPEED_MULTIPLIER : 1;

  return coffeeMultiplier * sprintMultiplier;
}

function getStaminaDrainRate(state: GameState): number {
  return (
    SPRINT_STAMINA_DRAIN_PER_SECOND *
    (state.buffs.bananaRemaining > EPSILON ? BANANA_STAMINA_DRAIN_MULTIPLIER : 1)
  );
}

function getStaminaRegenRate(state: GameState): number {
  return state.buffs.bananaRemaining > EPSILON
    ? BANANA_STAMINA_REGEN_PER_SECOND
    : STAMINA_REGEN_PER_SECOND;
}

function getNextDistanceBoundary(distance: number, finishDistance: number): number {
  const firstBoundary = finishDistance * 0.35;
  const secondBoundary = finishDistance * 0.7;

  if (distance < firstBoundary - EPSILON) return firstBoundary;
  if (distance < secondBoundary - EPSILON) return secondBoundary;
  return finishDistance;
}

function normalizeExpiredEffects(state: GameState): GameState {
  return {
    ...state,
    player: {
      ...state.player,
      invulnerabilityRemaining:
        state.player.invulnerabilityRemaining <= EPSILON
          ? 0
          : state.player.invulnerabilityRemaining,
    },
    buffs: {
      coffeeRemaining: state.buffs.coffeeRemaining <= EPSILON ? 0 : state.buffs.coffeeRemaining,
      bananaRemaining: state.buffs.bananaRemaining <= EPSILON ? 0 : state.buffs.bananaRemaining,
    },
  };
}

function limitToPositiveBoundary(current: number, boundary: number): number {
  return boundary > EPSILON ? Math.min(current, boundary) : current;
}

function clampLane(lane: number): LaneIndex {
  return Math.max(0, Math.min(LANE_COUNT - 1, Math.trunc(lane))) as LaneIndex;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

export const GAME_LEVEL_COUNT = LEVELS.length;
