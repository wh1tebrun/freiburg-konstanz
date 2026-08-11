import { describe, expect, it } from "vitest";

import {
  DAMAGE_INVULNERABILITY_SECONDS,
  createGameState,
  intervalsOverlap,
  sameLaneCollision,
  startGame,
  stepGame,
  type GameState,
  type VehicleState,
} from "../src/game";

function createVehicle(state: GameState, overrides: Partial<VehicleState> = {}): VehicleState {
  return {
    id: 1,
    kindId: "test-vehicle",
    lane: state.player.lane,
    x: state.player.x + 10,
    width: 90,
    speedFactor: 0,
    nearMissAwarded: false,
    passAwarded: false,
    ...overrides,
  };
}

function playingState(): GameState {
  return startGame(createGameState({ seed: 11, populateWorld: false }));
}

describe("same-lane interval collisions", () => {
  it("uses strict interval overlap and ignores adjacent lanes", () => {
    expect(intervalsOverlap(10, 20, 30, 20)).toBe(false);
    expect(intervalsOverlap(10, 21, 30, 20)).toBe(true);
    expect(sameLaneCollision({ lane: 0, x: 10, width: 30 }, { lane: 1, x: 10, width: 30 })).toBe(
      false,
    );
  });

  it("takes one life, resets combo, and grants invulnerability", () => {
    const initial = playingState();
    const state = {
      ...initial,
      combo: 4,
      vehicles: [createVehicle(initial)],
    };
    const result = stepGame(state, {}, 1 / 120);

    expect(result.player.lives).toBe(2);
    expect(result.combo).toBe(0);
    expect(result.player.invulnerabilityRemaining).toBeCloseTo(DAMAGE_INVULNERABILITY_SECONDS, 5);
    expect(result.events).toContainEqual({
      type: "damage",
      livesRemaining: 2,
    });
    expect(state.player.lives).toBe(3);
    expect(state.vehicles[0]?.x).toBe(initial.player.x + 10);
  });

  it("blocks damage with a shield and grants a short safety window", () => {
    const initial = playingState();
    const state = {
      ...initial,
      player: { ...initial.player, hasShield: true },
      vehicles: [createVehicle(initial)],
    };
    const result = stepGame(state, {}, 1 / 120);

    expect(result.player.lives).toBe(3);
    expect(result.player.hasShield).toBe(false);
    expect(result.player.invulnerabilityRemaining).toBeGreaterThan(0);
    expect(result.events).toContainEqual({ type: "shieldBlocked" });
  });

  it("does not stack damage while invulnerable", () => {
    const initial = playingState();
    const state = {
      ...initial,
      player: {
        ...initial.player,
        lives: 2,
        invulnerabilityRemaining: 0.5,
      },
      vehicles: [createVehicle(initial)],
    };
    const result = stepGame(state, {}, 0.1);

    expect(result.player.lives).toBe(2);
    expect(result.player.invulnerabilityRemaining).toBeCloseTo(0.4, 6);
    expect(result.events.some((event) => event.type === "damage")).toBe(false);
  });

  it("moves to gameOver when the final life is lost", () => {
    const initial = playingState();
    const state = {
      ...initial,
      player: { ...initial.player, lives: 1 },
      vehicles: [createVehicle(initial)],
    };
    const result = stepGame(state, {}, 1 / 120);

    expect(result.player.lives).toBe(0);
    expect(result.phase).toBe("gameOver");
    expect(result.events.at(-1)).toEqual({ type: "gameOver" });
  });

  it("does not collide with a vehicle in another lane", () => {
    const initial = playingState();
    const state = {
      ...initial,
      vehicles: [createVehicle(initial, { lane: 0 })],
    };
    const result = stepGame(state, {}, 1 / 120);

    expect(result.player.lives).toBe(3);
    expect(result.events.some((event) => event.type === "damage")).toBe(false);
  });

  it("accepts a frozen state and returns new immutable values", () => {
    const initial = playingState();
    const vehicle = Object.freeze(createVehicle(initial));
    const vehicles = Object.freeze([vehicle]);
    const player = Object.freeze({ ...initial.player });
    const state = Object.freeze({ ...initial, player, vehicles });

    const result = stepGame(state, {}, 1 / 120);

    expect(result).not.toBe(state);
    expect(result.player).not.toBe(player);
    expect(vehicle.x).toBe(initial.player.x + 10);
    expect(state.player.lives).toBe(3);
  });
});
