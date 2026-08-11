import { describe, expect, it } from "vitest";

import {
  createGameState,
  nextRandom,
  normalizeSeed,
  PRODUCT_NAME,
  PRODUCT_TAGLINE,
} from "../src/game";

describe("deterministic random source", () => {
  it("produces the same sequence for the same seed", () => {
    const collect = (initialSeed: number) => {
      const values: number[] = [];
      let seed = initialSeed;

      for (let index = 0; index < 6; index += 1) {
        const sample = nextRandom(seed);
        seed = sample.seed;
        values.push(sample.value);
      }

      return { seed, values };
    };

    expect(collect(42)).toEqual(collect(42));
    expect(collect(42)).not.toEqual(collect(43));
  });

  it("normalizes invalid and zero seeds", () => {
    expect(normalizeSeed(0)).not.toBe(0);
    expect(normalizeSeed(Number.NaN)).toBe(normalizeSeed(Number.POSITIVE_INFINITY));
  });

  it("creates identical populated worlds from identical inputs", () => {
    const first = createGameState({ seed: 12_345 });
    const second = createGameState({ seed: 12_345 });
    const different = createGameState({ seed: 54_321 });

    expect(first).toEqual(second);
    expect(first.vehicles).not.toEqual(different.vehicles);
    expect(first.pickups).not.toEqual(different.pickups);
  });

  it("exports the canonical product identity", () => {
    expect(PRODUCT_NAME).toBe("Freiburg–Konstanz");
    expect(PRODUCT_TAGLINE).toBe("A Black Forest cycling arcade.");
  });
});
