import { MAX_LIVES, MAX_STAMINA, getLevel, type GameState } from "../game";

type GameHudProps = {
  state: GameState;
  displayScore: number;
  onPause: () => void;
};

export function GameHud({ state, displayScore, onPause }: GameHudProps) {
  const level = getLevel(state.stageIndex);
  const progress = Math.min(100, (state.distance / level.finishDistance) * 100);

  return (
    <header className="game-hud" aria-label="Current run">
      <div className="game-hud__stage">
        <span>Stage {level.id.toString().padStart(2, "0")}</span>
        <strong>{level.title}</strong>
      </div>

      <div className="game-hud__progress">
        <div className="game-hud__progress-copy">
          <span>{Math.floor(state.distance)} m</span>
          <span>{level.finishDistance} m</span>
        </div>
        <div
          className="game-hud__progress-track"
          role="progressbar"
          aria-label="Stage distance"
          aria-valuemin={0}
          aria-valuemax={level.finishDistance}
          aria-valuenow={Math.floor(state.distance)}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      <dl className="game-hud__stats">
        <div>
          <dt>Lives</dt>
          <dd>
            {state.player.lives}/{MAX_LIVES}
          </dd>
        </div>
        <div>
          <dt>Score</dt>
          <dd>{displayScore.toLocaleString("en-US")}</dd>
        </div>
        <div>
          <dt>Combo</dt>
          <dd>{state.combo > 0 ? `${Math.min(state.combo, 5)}×` : "—"}</dd>
        </div>
        <div>
          <dt>Water</dt>
          <dd>{state.bottles}</dd>
        </div>
      </dl>

      <div
        className="game-hud__stamina"
        aria-label={`Stamina ${Math.round(state.stamina)} percent`}
      >
        <span>Stamina</span>
        <div aria-hidden="true">
          <span style={{ width: `${(state.stamina / MAX_STAMINA) * 100}%` }} />
        </div>
      </div>

      <button className="icon-button" type="button" onClick={onPause} aria-label="Pause game">
        <span aria-hidden="true">Ⅱ</span>
      </button>
    </header>
  );
}
