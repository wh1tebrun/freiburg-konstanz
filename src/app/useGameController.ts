import { useCallback, useEffect, useRef, useState } from "react";

import {
  createGameState,
  getDisplayScore,
  loadProgress,
  pauseGame,
  restartStage,
  saveProgress,
  selectStage,
  startGame,
  stepGame,
  type GameEvent,
  type GameState,
  type LaneIndex,
} from "../game";

type HeldInput = {
  left: boolean;
  right: boolean;
  sprint: boolean;
};

export type GameController = {
  state: GameState;
  displayScore: number;
  announcement: string;
  heldInput: Readonly<HeldInput>;
  actions: {
    selectStage: (stageIndex: number) => void;
    start: () => void;
    pause: () => void;
    retry: () => void;
    returnToRoute: () => void;
    continueRoute: () => void;
    changeLane: (laneDelta: -1 | 1) => void;
    useBottle: () => void;
    holdLeft: (active: boolean) => void;
    holdRight: (active: boolean) => void;
    holdSprint: (active: boolean) => void;
  };
};

function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function createInitialState(): GameState {
  const progress = loadProgress(getBrowserStorage());

  return createGameState({
    unlockedStageIndex: progress.unlockedStageIndex,
    seed: Date.now(),
  });
}

function formatEvent(event: GameEvent): string {
  switch (event.type) {
    case "nearMiss":
      return `Near miss · +${event.points} · ${event.multiplier}× combo`;
    case "damage":
      return event.livesRemaining > 0
        ? `Collision · ${event.livesRemaining} lives remaining`
        : "Run ended";
    case "shieldBlocked":
      return "Shield absorbed the collision";
    case "pickupCollected":
      return `${event.kind[0]?.toUpperCase()}${event.kind.slice(1)} collected`;
    case "stageComplete":
      return "Stage complete";
    case "gameOver":
      return "Run ended";
    case "vehiclePassed":
      return "";
  }
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    Boolean(target.closest("button, a, input, select, textarea, [contenteditable]"))
  );
}

export function useGameController(): GameController {
  const [state, setState] = useState<GameState>(createInitialState);
  const [announcement, setAnnouncement] = useState("");
  const stateRef = useRef(state);
  const announcementTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heldInputRef = useRef<HeldInput>({
    left: false,
    right: false,
    sprint: false,
  });
  const [heldInput, setHeldInput] = useState<HeldInput>({
    left: false,
    right: false,
    sprint: false,
  });

  const publishEvents = useCallback((events: readonly GameEvent[]) => {
    const message = [...events].reverse().map(formatEvent).find(Boolean);

    if (!message) return;

    setAnnouncement(message);
    if (announcementTimerRef.current) {
      clearTimeout(announcementTimerRef.current);
    }

    announcementTimerRef.current = setTimeout(() => {
      setAnnouncement("");
      announcementTimerRef.current = null;
    }, 1_300);
  }, []);

  const commit = useCallback(
    (transition: (current: GameState) => GameState) => {
      const nextState = transition(stateRef.current);
      stateRef.current = nextState;
      setState(nextState);
      publishEvents(nextState.events);
    },
    [publishEvents],
  );

  const updateHeldInput = useCallback((key: keyof HeldInput, active: boolean) => {
    if (heldInputRef.current[key] === active) return;

    const nextHeldInput = { ...heldInputRef.current, [key]: active };
    heldInputRef.current = nextHeldInput;
    setHeldInput(nextHeldInput);
  }, []);

  const releaseHeldInput = useCallback(() => {
    const released = { left: false, right: false, sprint: false };
    heldInputRef.current = released;
    setHeldInput(released);
  }, []);

  const returnToRoute = useCallback(() => {
    releaseHeldInput();
    commit(restartStage);
  }, [commit, releaseHeldInput]);

  const retry = useCallback(() => {
    releaseHeldInput();
    commit((current) => startGame(restartStage(current)));
  }, [commit, releaseHeldInput]);

  const continueRoute = useCallback(() => {
    releaseHeldInput();
    commit((current) => selectStage(current, current.stageIndex + 1));
  }, [commit, releaseHeldInput]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    saveProgress(getBrowserStorage(), state.unlockedStageIndex);
  }, [state.unlockedStageIndex]);

  useEffect(() => {
    if (state.phase !== "playing") return;

    let animationFrameId = 0;
    let previousTime = performance.now();

    const frame = (currentTime: number) => {
      const elapsedSeconds = (currentTime - previousTime) / 1_000;
      const deltaSeconds =
        Number.isFinite(elapsedSeconds) && elapsedSeconds >= 0 ? Math.min(elapsedSeconds, 0.1) : 0;
      previousTime = Number.isFinite(currentTime) ? currentTime : performance.now();

      const held = heldInputRef.current;
      const horizontal = Number(held.right) - Number(held.left);
      const nextState = stepGame(
        stateRef.current,
        { horizontal, sprint: held.sprint },
        deltaSeconds,
      );

      stateRef.current = nextState;
      setState(nextState);
      publishEvents(nextState.events);

      if (nextState.phase === "playing") {
        animationFrameId = requestAnimationFrame(frame);
      }
    };

    animationFrameId = requestAnimationFrame(frame);

    return () => cancelAnimationFrame(animationFrameId);
  }, [publishEvents, state.phase]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const current = stateRef.current;
      const interactiveTarget = isInteractiveTarget(event.target);

      if (event.code === "Enter" && current.phase === "menu" && !interactiveTarget) {
        event.preventDefault();
        commit(startGame);
        return;
      }

      if (event.code === "Escape" || event.code === "KeyP") {
        if (current.phase === "playing" || current.phase === "paused") {
          event.preventDefault();
          releaseHeldInput();
          commit(pauseGame);
        }
        return;
      }

      if (event.code === "KeyM" && current.phase !== "menu") {
        event.preventDefault();
        returnToRoute();
        return;
      }

      if (event.code === "KeyR" && current.phase === "gameOver") {
        event.preventDefault();
        retry();
        return;
      }

      if (event.code === "KeyN" && current.phase === "stageComplete") {
        event.preventDefault();
        continueRoute();
        return;
      }

      if (current.phase !== "playing" || interactiveTarget) return;

      if (event.code === "KeyA" || event.code === "ArrowLeft") {
        event.preventDefault();
        updateHeldInput("left", true);
      } else if (event.code === "KeyD" || event.code === "ArrowRight") {
        event.preventDefault();
        updateHeldInput("right", true);
      } else if (event.code === "ShiftLeft" || event.code === "ShiftRight") {
        event.preventDefault();
        updateHeldInput("sprint", true);
      } else if (!event.repeat && (event.code === "KeyW" || event.code === "ArrowUp")) {
        event.preventDefault();
        commit((game) => stepGame(game, { laneDelta: 1 }, 0));
      } else if (!event.repeat && (event.code === "KeyS" || event.code === "ArrowDown")) {
        event.preventDefault();
        commit((game) => stepGame(game, { laneDelta: -1 }, 0));
      } else if (!event.repeat && event.code === "KeyE") {
        event.preventDefault();
        commit((game) => stepGame(game, { useBottle: true }, 0));
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === "KeyA" || event.code === "ArrowLeft") {
        updateHeldInput("left", false);
      } else if (event.code === "KeyD" || event.code === "ArrowRight") {
        updateHeldInput("right", false);
      } else if (event.code === "ShiftLeft" || event.code === "ShiftRight") {
        updateHeldInput("sprint", false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [commit, continueRoute, releaseHeldInput, retry, returnToRoute, updateHeldInput]);

  useEffect(() => {
    const pauseForInterruption = () => {
      releaseHeldInput();
      if (stateRef.current.phase === "playing") commit(pauseGame);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") pauseForInterruption();
    };

    window.addEventListener("blur", pauseForInterruption);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("blur", pauseForInterruption);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [commit, releaseHeldInput]);

  useEffect(
    () => () => {
      if (announcementTimerRef.current) {
        clearTimeout(announcementTimerRef.current);
      }
    },
    [],
  );

  return {
    state,
    displayScore: getDisplayScore(state),
    announcement,
    heldInput,
    actions: {
      selectStage: (stageIndex) => commit((current) => selectStage(current, stageIndex)),
      start: () => commit(startGame),
      pause: () => {
        releaseHeldInput();
        commit(pauseGame);
      },
      retry,
      returnToRoute,
      continueRoute,
      changeLane: (laneDelta) => commit((current) => stepGame(current, { laneDelta }, 0)),
      useBottle: () => commit((current) => stepGame(current, { useBottle: true }, 0)),
      holdLeft: (active) => updateHeldInput("left", active),
      holdRight: (active) => updateHeldInput("right", active),
      holdSprint: (active) => updateHeldInput("sprint", active),
    },
  };
}

export function lanePercentage(lane: LaneIndex): number {
  return [8, 22, 36][lane] ?? 22;
}
