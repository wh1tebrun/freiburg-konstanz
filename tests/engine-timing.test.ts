import { describe, expect, it } from "vitest";

import {
  createGameState,
  getDisplayScore,
  startGame,
  stepGame,
  type GameInput,
  type GameState,
} from "../src/game";

function simulate(refreshRate: number, durationSeconds: number, input: GameInput = {}): GameState {
  let state = startGame(createGameState({ seed: 7, populateWorld: false }));
  const stepCount = Math.round(refreshRate * durationSeconds);
  const deltaSeconds = durationSeconds / stepCount;

  for (let frame = 0; frame < stepCount; frame += 1) {
    state = stepGame(state, input, deltaSeconds);
  }

  return state;
}

describe("frame-rate-independent simulation", () => {
  it("produces equivalent score, distance, and stamina at 60/120/144 Hz", () => {
    const at60Hz = simulate(60, 10);
    const at120Hz = simulate(120, 10);
    const at144Hz = simulate(144, 10);

    for (const state of [at120Hz, at144Hz]) {
      expect(state.elapsedSeconds).toBeCloseTo(at60Hz.elapsedSeconds, 8);
      expect(state.distance).toBeCloseTo(at60Hz.distance, 8);
      expect(state.score).toBeCloseTo(at60Hz.score, 8);
      expect(state.stamina).toBeCloseTo(at60Hz.stamina, 8);
      expect(getDisplayScore(state)).toBe(getDisplayScore(at60Hz));
    }

    expect(at60Hz.distance).toBeCloseTo(120, 8);
    expect(at60Hz.score).toBeCloseTo(600, 8);
  });

  it("keeps boosted simulation equivalent across refresh rates", () => {
    const input = { sprint: true } satisfies GameInput;
    const createBoostedState = () => ({
      ...startGame(createGameState({ seed: 9, populateWorld: false })),
      buffs: { coffeeRemaining: 4, bananaRemaining: 5 },
    });

    const simulateBoosted = (refreshRate: number) => {
      let state = createBoostedState();
      const duration = 3;
      const steps = refreshRate * duration;

      for (let frame = 0; frame < steps; frame += 1) {
        state = stepGame(state, input, 1 / refreshRate);
      }

      return state;
    };

    const baseline = simulateBoosted(60);

    for (const refreshRate of [120, 144]) {
      const state = simulateBoosted(refreshRate);
      expect(state.distance).toBeCloseTo(baseline.distance, 7);
      expect(state.score).toBeCloseTo(baseline.score, 7);
      expect(state.stamina).toBeCloseTo(baseline.stamina, 7);
    }
  });

  it("does not advance a paused or completed run", () => {
    const playing = startGame(createGameState({ seed: 4, populateWorld: false }));
    const paused = stepGame(playing, { pauseToggle: true }, 0);
    const afterPause = stepGame(paused, { sprint: true }, 5);

    expect(paused.phase).toBe("paused");
    expect(afterPause).toEqual(paused);
  });

  it("rejects invalid time deltas", () => {
    const state = createGameState({ populateWorld: false });
    expect(() => stepGame(state, {}, -0.1)).toThrow(RangeError);
    expect(() => stepGame(state, {}, Number.NaN)).toThrow(RangeError);
  });
});
