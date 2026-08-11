import { DEFAULT_RNG_SEED } from "./constants";

export interface RandomSample {
  readonly seed: number;
  readonly value: number;
}

export function normalizeSeed(seed: number): number {
  if (!Number.isFinite(seed)) return DEFAULT_RNG_SEED;

  const normalized = Math.trunc(seed) >>> 0;
  return normalized === 0 ? DEFAULT_RNG_SEED : normalized;
}

export function nextRandom(seed: number): RandomSample {
  const currentSeed = normalizeSeed(seed);
  const nextSeed = (Math.imul(currentSeed, 1_664_525) + 1_013_904_223) >>> 0;

  return {
    seed: nextSeed,
    value: nextSeed / 0x1_0000_0000,
  };
}

export function randomInt(
  seed: number,
  minimumInclusive: number,
  maximumExclusive: number,
): RandomSample {
  if (maximumExclusive <= minimumInclusive) {
    throw new RangeError("maximumExclusive must be greater than minimumInclusive.");
  }

  const sample = nextRandom(seed);
  const value = minimumInclusive + Math.floor(sample.value * (maximumExclusive - minimumInclusive));

  return { seed: sample.seed, value };
}

export function randomRange(seed: number, minimum: number, maximum: number): RandomSample {
  if (maximum < minimum) {
    throw new RangeError("maximum must be greater than or equal to minimum.");
  }

  const sample = nextRandom(seed);
  return {
    seed: sample.seed,
    value: minimum + sample.value * (maximum - minimum),
  };
}
