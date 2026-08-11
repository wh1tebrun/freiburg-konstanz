import { describe, expect, it } from "vitest";

import {
  LEVELS,
  LEGACY_PROGRESS_STORAGE_KEY,
  PREVIOUS_PROGRESS_STORAGE_KEY,
  PROGRESS_STORAGE_KEY,
  clampUnlockedStage,
  createGameState,
  getLevel,
  loadProgress,
  saveProgress,
  selectStage,
  startGame,
  stepGame,
  type StorageLike,
} from "../src/game";

class MemoryStorage implements StorageLike {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("versioned progress storage", () => {
  it("uses the canonical repository slug", () => {
    expect(PROGRESS_STORAGE_KEY).toBe("freiburg-konstanz.progress.v1");
  });

  it("round-trips and clamps unlocked progress", () => {
    const storage = new MemoryStorage();

    expect(saveProgress(storage, 4)).toBe(true);
    expect(loadProgress(storage)).toEqual({
      version: 1,
      unlockedStageIndex: 4,
    });

    expect(saveProgress(storage, 999)).toBe(true);
    expect(loadProgress(storage).unlockedStageIndex).toBe(LEVELS.length - 1);
  });

  it("falls back safely for corrupt, incompatible, and unavailable storage", () => {
    const storage = new MemoryStorage();
    storage.values.set(PROGRESS_STORAGE_KEY, "not-json");
    expect(loadProgress(storage).unlockedStageIndex).toBe(0);

    storage.values.set(PROGRESS_STORAGE_KEY, JSON.stringify({ version: 2, unlockedStageIndex: 5 }));
    expect(loadProgress(storage).unlockedStageIndex).toBe(0);
    expect(loadProgress(null).unlockedStageIndex).toBe(0);

    const throwingStorage: StorageLike = {
      getItem: () => {
        throw new Error("storage blocked");
      },
      setItem: () => {
        throw new Error("storage blocked");
      },
    };

    expect(loadProgress(throwingStorage).unlockedStageIndex).toBe(0);
    expect(saveProgress(throwingStorage, 2)).toBe(false);
  });

  it("migrates the previous versioned key to the canonical key", () => {
    const storage = new MemoryStorage();
    storage.values.set(
      PREVIOUS_PROGRESS_STORAGE_KEY,
      JSON.stringify({ version: 1, unlockedStageIndex: 5 }),
    );

    expect(loadProgress(storage)).toEqual({
      version: 1,
      unlockedStageIndex: 5,
    });
    expect(JSON.parse(storage.values.get(PROGRESS_STORAGE_KEY) ?? "null")).toEqual({
      version: 1,
      unlockedStageIndex: 5,
    });
  });

  it("migrates and clamps the numeric legacy value", () => {
    const storage = new MemoryStorage();
    storage.values.set(LEGACY_PROGRESS_STORAGE_KEY, "999");

    expect(loadProgress(storage).unlockedStageIndex).toBe(LEVELS.length - 1);
    expect(JSON.parse(storage.values.get(PROGRESS_STORAGE_KEY) ?? "null")).toEqual({
      version: 1,
      unlockedStageIndex: LEVELS.length - 1,
    });
  });

  it("prefers valid canonical progress over migration sources", () => {
    const storage = new MemoryStorage();
    storage.values.set(PROGRESS_STORAGE_KEY, JSON.stringify({ version: 1, unlockedStageIndex: 2 }));
    storage.values.set(
      PREVIOUS_PROGRESS_STORAGE_KEY,
      JSON.stringify({ version: 1, unlockedStageIndex: 5 }),
    );
    storage.values.set(LEGACY_PROGRESS_STORAGE_KEY, "8");

    expect(loadProgress(storage).unlockedStageIndex).toBe(2);
  });

  it("recovers from corrupt canonical data and tolerates a failed migration write", () => {
    const values = new Map<string, string>([
      [PROGRESS_STORAGE_KEY, "not-json"],
      [PREVIOUS_PROGRESS_STORAGE_KEY, JSON.stringify({ version: 1, unlockedStageIndex: 4 })],
    ]);
    const storage: StorageLike = {
      getItem: (key) => values.get(key) ?? null,
      setItem: () => {
        throw new Error("storage is read-only");
      },
    };

    expect(loadProgress(storage)).toEqual({
      version: 1,
      unlockedStageIndex: 4,
    });
  });

  it("clamps invalid unlock indices", () => {
    expect(clampUnlockedStage(-10)).toBe(0);
    expect(clampUnlockedStage(Number.NaN)).toBe(0);
    expect(clampUnlockedStage(4.9)).toBe(4);
    expect(clampUnlockedStage(999)).toBe(LEVELS.length - 1);
  });
});

describe("stage progression", () => {
  it("completes a stage and unlocks exactly the next stage", () => {
    const initial = startGame(createGameState({ stageIndex: 0, seed: 31, populateWorld: false }));
    const state = {
      ...initial,
      distance: LEVELS[0].finishDistance - 0.1,
    };
    const result = stepGame(state, {}, 1);

    expect(result.phase).toBe("stageComplete");
    expect(result.distance).toBe(LEVELS[0].finishDistance);
    expect(result.unlockedStageIndex).toBe(1);
    expect(result.score).toBeGreaterThanOrEqual(300);
    expect(result.events.at(-1)).toEqual({
      type: "stageComplete",
      stageIndex: 0,
    });
    expect(state.phase).toBe("playing");
  });

  it("keeps the final-stage unlock clamped", () => {
    const lastIndex = LEVELS.length - 1;
    const initial = startGame(
      createGameState({
        stageIndex: lastIndex,
        unlockedStageIndex: lastIndex,
        seed: 32,
        populateWorld: false,
      }),
    );
    const state = {
      ...initial,
      distance: getLevel(lastIndex).finishDistance - 0.1,
    };
    const result = stepGame(state, {}, 1);

    expect(result.phase).toBe("stageComplete");
    expect(result.unlockedStageIndex).toBe(lastIndex);
  });

  it("refuses to select a locked stage", () => {
    const state = createGameState({ unlockedStageIndex: 1, seed: 33 });
    expect(selectStage(state, 3)).toBe(state);
    expect(selectStage(state, 1).stageIndex).toBe(1);
  });
});
