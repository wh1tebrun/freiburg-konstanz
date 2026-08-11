import { LEVELS } from "./config/levels";
import type { PersistedProgress, StorageLike } from "./types";

export const PROGRESS_STORAGE_KEY = "freiburg-konstanz.progress.v1";
export const PREVIOUS_PROGRESS_STORAGE_KEY = "freiburg-to-konstanz.progress.v1";
export const LEGACY_PROGRESS_STORAGE_KEY = "ride-to-bodensee-unlocked";
export const PROGRESS_VERSION = 1 as const;

export function clampUnlockedStage(stageIndex: number, levelCount: number = LEVELS.length): number {
  if (levelCount <= 0 || !Number.isFinite(stageIndex)) return 0;

  return Math.max(0, Math.min(levelCount - 1, Math.trunc(stageIndex)));
}

export function createProgress(unlockedStageIndex = 0): PersistedProgress {
  return {
    version: PROGRESS_VERSION,
    unlockedStageIndex: clampUnlockedStage(unlockedStageIndex),
  };
}

export function loadProgress(storage: StorageLike | null): PersistedProgress {
  if (!storage) return createProgress();

  const canonicalProgress = readVersionedProgress(storage, PROGRESS_STORAGE_KEY);
  if (canonicalProgress) return canonicalProgress;

  const previousProgress = readVersionedProgress(storage, PREVIOUS_PROGRESS_STORAGE_KEY);
  if (previousProgress) {
    writeCanonicalProgress(storage, previousProgress);
    return previousProgress;
  }

  const legacyProgress = readLegacyProgress(storage);
  if (legacyProgress) {
    writeCanonicalProgress(storage, legacyProgress);
    return legacyProgress;
  }

  return createProgress();
}

export function saveProgress(storage: StorageLike | null, unlockedStageIndex: number): boolean {
  if (!storage) return false;

  return writeCanonicalProgress(storage, createProgress(unlockedStageIndex));
}

function readVersionedProgress(storage: StorageLike, key: string): PersistedProgress | null {
  try {
    const serialized = storage.getItem(key);
    if (!serialized) return null;

    const parsed: unknown = JSON.parse(serialized);
    if (!isProgressRecord(parsed)) return null;

    return createProgress(parsed.unlockedStageIndex);
  } catch {
    return null;
  }
}

function readLegacyProgress(storage: StorageLike): PersistedProgress | null {
  try {
    const serialized = storage.getItem(LEGACY_PROGRESS_STORAGE_KEY);
    if (!serialized?.trim()) return null;

    const unlockedStageIndex = Number(serialized);
    if (!Number.isFinite(unlockedStageIndex)) return null;

    return createProgress(unlockedStageIndex);
  } catch {
    return null;
  }
}

function writeCanonicalProgress(storage: StorageLike, progress: PersistedProgress): boolean {
  try {
    storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

function isProgressRecord(value: unknown): value is PersistedProgress {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Partial<PersistedProgress>;
  return (
    candidate.version === PROGRESS_VERSION &&
    typeof candidate.unlockedStageIndex === "number" &&
    Number.isFinite(candidate.unlockedStageIndex)
  );
}
