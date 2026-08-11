import { describe, expect, it } from "vitest";

import {
  BANANA_DURATION_SECONDS,
  COFFEE_DURATION_SECONDS,
  MAX_STAMINA,
  applyPickupEffect,
  createGameState,
  startGame,
  stepGame,
  type GameState,
  type PickupState,
} from "../src/game";

function playingState(): GameState {
  return startGame(createGameState({ seed: 21, populateWorld: false }));
}

function createPickup(state: GameState, kind: PickupState["kind"]): PickupState {
  return {
    id: 10,
    kind,
    lane: state.player.lane,
    x: state.player.x + 5,
    width: 38,
  };
}

describe("stamina, boosts, and pickups", () => {
  it("applies banana-assisted sprint drain and coffee speed boost", () => {
    const initial = {
      ...playingState(),
      buffs: {
        coffeeRemaining: COFFEE_DURATION_SECONDS,
        bananaRemaining: BANANA_DURATION_SECONDS,
      },
    };
    const result = stepGame(initial, { sprint: true }, 1);

    expect(result.stamina).toBeCloseTo(89.5, 6);
    expect(result.distance).toBeCloseTo(21.3, 6);
    expect(result.score).toBeCloseTo(106.5, 6);
    expect(result.buffs.coffeeRemaining).toBeCloseTo(3, 6);
    expect(result.buffs.bananaRemaining).toBeCloseTo(4, 6);
  });

  it("regenerates stamina when sprint is released", () => {
    const initial = {
      ...playingState(),
      stamina: 40,
      buffs: { coffeeRemaining: 0, bananaRemaining: 2 },
    };
    const result = stepGame(initial, { sprint: false }, 1);

    expect(result.stamina).toBeCloseTo(76, 6);
  });

  it("uses a bottle atomically to heal and restore stamina", () => {
    const initial = {
      ...playingState(),
      bottles: 1,
      stamina: 50,
      player: { ...playingState().player, lives: 2 },
    };
    const result = stepGame(initial, { useBottle: true }, 0);

    expect(result.bottles).toBe(0);
    expect(result.player.lives).toBe(3);
    expect(result.stamina).toBe(85);
  });

  it("applies each pickup without mutating its input state", () => {
    const initial = {
      ...playingState(),
      stamina: 40,
      player: { ...playingState().player, lives: 2 },
    };

    const water = applyPickupEffect(initial, "water");
    const shield = applyPickupEffect(initial, "shield");
    const banana = applyPickupEffect(initial, "banana");
    const coffee = applyPickupEffect(initial, "coffee");
    const croissant = applyPickupEffect(initial, "croissant");

    expect(water.bottles).toBe(1);
    expect(shield.player.hasShield).toBe(true);
    expect(banana.buffs.bananaRemaining).toBe(BANANA_DURATION_SECONDS);
    expect(coffee.buffs.coffeeRemaining).toBe(COFFEE_DURATION_SECONDS);
    expect(croissant.player.lives).toBe(3);
    expect(croissant.stamina).toBe(75);
    expect(initial.stamina).toBe(40);
    expect(initial.player.lives).toBe(2);
  });

  it("collects a same-lane pickup through the engine and recycles it", () => {
    const initial = playingState();
    const pickup = createPickup(initial, "coffee");
    const state = { ...initial, pickups: [pickup] };
    const result = stepGame(state, {}, 1 / 120);

    expect(result.buffs.coffeeRemaining).toBeGreaterThan(0);
    expect(result.score).toBeGreaterThanOrEqual(55);
    expect(result.pickups[0]?.x).toBeGreaterThan(1_000);
    expect(result.events).toContainEqual({
      type: "pickupCollected",
      kind: "coffee",
    });
    expect(state.pickups[0]?.x).toBe(pickup.x);
  });

  it("caps recovery at maximum stamina", () => {
    const initial = { ...playingState(), stamina: 98 };
    const result = applyPickupEffect(initial, "banana");
    expect(result.stamina).toBe(MAX_STAMINA);
  });
});
