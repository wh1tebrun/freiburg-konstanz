import { describe, expect, it } from "vitest";

import {
  MAX_COMBO_MULTIPLIER,
  NEAR_MISS_BASE_SCORE,
  createGameState,
  sameLaneNearMiss,
  startGame,
  stepGame,
  type GameState,
  type VehicleState,
} from "../src/game";

function playingState(): GameState {
  return startGame(createGameState({ seed: 91, populateWorld: false }));
}

function nearMissVehicle(state: GameState, id: number): VehicleState {
  return {
    id,
    kindId: "near-miss-test",
    lane: state.player.lane,
    x: state.player.x + state.player.width + 10,
    width: 80,
    speedFactor: 0,
    nearMissAwarded: false,
    passAwarded: false,
  };
}

describe("near-miss combo scoring", () => {
  it("detects only expanded, non-colliding intervals in the same lane", () => {
    const player = { lane: 1 as const, x: 100, width: 70 };

    expect(sameLaneNearMiss(player, { lane: 1, x: 180, width: 80 }, 20)).toBe(true);
    expect(sameLaneNearMiss(player, { lane: 1, x: 160, width: 80 }, 20)).toBe(false);
    expect(sameLaneNearMiss(player, { lane: 0, x: 180, width: 80 }, 20)).toBe(false);
  });

  it("awards a vehicle exactly once", () => {
    const initial = playingState();
    const state = {
      ...initial,
      vehicles: [nearMissVehicle(initial, 1)],
    };

    const first = stepGame(state, {}, 1 / 120);
    const second = stepGame(first, {}, 1 / 120);

    expect(first.combo).toBe(1);
    expect(first.bestCombo).toBe(1);
    expect(first.vehicles[0]?.nearMissAwarded).toBe(true);
    expect(first.events).toContainEqual({
      type: "nearMiss",
      vehicleId: 1,
      points: NEAR_MISS_BASE_SCORE,
      multiplier: 1,
    });
    expect(second.combo).toBe(1);
    expect(second.events.some((event) => event.type === "nearMiss")).toBe(false);
  });

  it("caps the score multiplier at 5x while preserving the best streak", () => {
    const initial = playingState();
    const vehicles = Array.from({ length: 7 }, (_, index) => nearMissVehicle(initial, index + 1));
    const result = stepGame({ ...initial, vehicles }, {}, 1 / 120);
    const nearMissEvents = result.events.filter((event) => event.type === "nearMiss");

    expect(result.combo).toBe(7);
    expect(result.bestCombo).toBe(7);
    expect(nearMissEvents.map((event) => event.multiplier)).toEqual([
      1,
      2,
      3,
      4,
      MAX_COMBO_MULTIPLIER,
      MAX_COMBO_MULTIPLIER,
      MAX_COMBO_MULTIPLIER,
    ]);
    expect(nearMissEvents.at(-1)?.points).toBe(NEAR_MISS_BASE_SCORE * MAX_COMBO_MULTIPLIER);
  });

  it("never awards a near miss for an actual collision", () => {
    const initial = playingState();
    const collidingVehicle: VehicleState = {
      ...nearMissVehicle(initial, 1),
      x: initial.player.x + 5,
    };
    const result = stepGame({ ...initial, vehicles: [collidingVehicle] }, {}, 1 / 120);

    expect(result.player.lives).toBe(2);
    expect(result.combo).toBe(0);
    expect(result.events.some((event) => event.type === "nearMiss")).toBe(false);
  });

  it("resets the active combo on damage without erasing bestCombo", () => {
    const initial = playingState();
    const collidingVehicle: VehicleState = {
      ...nearMissVehicle(initial, 9),
      x: initial.player.x + 5,
    };
    const result = stepGame(
      {
        ...initial,
        combo: 4,
        bestCombo: 8,
        vehicles: [collidingVehicle],
      },
      {},
      1 / 120,
    );

    expect(result.combo).toBe(0);
    expect(result.bestCombo).toBe(8);
    expect(result.events).toContainEqual({
      type: "damage",
      livesRemaining: 2,
    });
  });
});
