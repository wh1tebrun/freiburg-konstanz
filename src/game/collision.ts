import type { LaneIndex } from "./types";

export interface LaneInterval {
  readonly lane: LaneIndex;
  readonly x: number;
  readonly width: number;
}

export function intervalsOverlap(
  firstStart: number,
  firstWidth: number,
  secondStart: number,
  secondWidth: number,
): boolean {
  const firstEnd = firstStart + Math.max(0, firstWidth);
  const secondEnd = secondStart + Math.max(0, secondWidth);

  return firstStart < secondEnd && firstEnd > secondStart;
}

export function sameLaneCollision(first: LaneInterval, second: LaneInterval): boolean {
  return (
    first.lane === second.lane && intervalsOverlap(first.x, first.width, second.x, second.width)
  );
}

export function sameLaneNearMiss(
  first: LaneInterval,
  second: LaneInterval,
  margin: number,
): boolean {
  if (first.lane !== second.lane || margin <= 0) return false;
  if (sameLaneCollision(first, second)) return false;

  return intervalsOverlap(first.x - margin, first.width + margin * 2, second.x, second.width);
}
