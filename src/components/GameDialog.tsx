import { useEffect, useRef } from "react";

import { LEVELS, getLevel, type GameState } from "../game";

type GameDialogProps = {
  state: GameState;
  displayScore: number;
  onResume: () => void;
  onRetry: () => void;
  onRoute: () => void;
  onContinue: () => void;
};

function getResultLabel(state: GameState, displayScore: number): string {
  if (state.player.lives === 3 && displayScore >= 5_000) return "Flawless line";
  if (displayScore >= 3_500) return "Strong breakaway";
  if (state.player.lives >= 2) return "Controlled finish";
  return "Route finisher";
}

export function GameDialog({
  state,
  displayScore,
  onResume,
  onRetry,
  onRoute,
  onContinue,
}: GameDialogProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const level = getLevel(state.stageIndex);
  const isFinalStage = state.stageIndex === LEVELS.length - 1;

  useEffect(() => {
    headingRef.current?.focus();
  }, [state.phase]);

  if (state.phase === "playing" || state.phase === "menu") return null;

  const paused = state.phase === "paused";
  const complete = state.phase === "stageComplete";
  const title = paused ? "Ride paused" : complete ? "Stage complete" : "Run ended";
  const description = paused
    ? "The simulation is stopped and all held controls have been released."
    : complete
      ? `${level.title} is clear. The next section of the route is now available.`
      : `${level.title} is still waiting. Reset the stage and take another line.`;

  return (
    <div className="game-dialog-backdrop">
      <section
        className="game-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="result-title"
      >
        <p className="eyebrow">
          {paused ? "Intermission" : `Stage ${level.id.toString().padStart(2, "0")}`}
        </p>
        <h2 id="result-title" ref={headingRef} tabIndex={-1}>
          {title}
        </h2>
        <p className="game-dialog__description">{description}</p>

        {!paused && (
          <>
            <strong className="game-dialog__result">
              {complete ? getResultLabel(state, displayScore) : "Reset and ride again"}
            </strong>
            <dl className="game-dialog__stats">
              <div>
                <dt>Score</dt>
                <dd>{displayScore.toLocaleString("en-US")}</dd>
              </div>
              <div>
                <dt>Best combo</dt>
                <dd>{state.bestCombo > 0 ? `${Math.min(state.bestCombo, 5)}×` : "—"}</dd>
              </div>
              <div>
                <dt>Lives</dt>
                <dd>{state.player.lives}</dd>
              </div>
              <div>
                <dt>Distance</dt>
                <dd>{Math.floor(state.distance)} m</dd>
              </div>
            </dl>
          </>
        )}

        <div className="game-dialog__actions">
          {paused && (
            <button className="button button--primary" onClick={onResume}>
              Resume
            </button>
          )}
          {state.phase === "gameOver" && (
            <button className="button button--primary" onClick={onRetry}>
              Retry stage
            </button>
          )}
          {complete && (
            <button className="button button--primary" onClick={onContinue}>
              {isFinalStage ? "Review route" : "Next stage"}
            </button>
          )}
          <button className="button button--secondary" onClick={onRoute}>
            Route map
          </button>
        </div>

        <p className="game-dialog__keys">
          {paused
            ? "P / Esc to resume · M for route"
            : complete
              ? "N for next · M for route"
              : "R to retry · M for route"}
        </p>
      </section>
    </div>
  );
}
