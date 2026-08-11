import { LEVELS, getLevel } from "../game";
import { PRODUCT_IDENTITY } from "../content/product";

type StageSelectProps = {
  selectedStageIndex: number;
  unlockedStageIndex: number;
  onSelect: (stageIndex: number) => void;
  onStart: () => void;
};

function getDifficulty(trafficIntensity: number): string {
  if (trafficIntensity >= 0.14) return "Demanding";
  if (trafficIntensity >= 0.08) return "Moderate";
  return "Introductory";
}

export function StageSelect({
  selectedStageIndex,
  unlockedStageIndex,
  onSelect,
  onStart,
}: StageSelectProps) {
  const selectedStage = getLevel(selectedStageIndex);
  const completion = ((unlockedStageIndex + 1) / LEVELS.length) * 100;

  return (
    <section className="route-planner" aria-labelledby="route-heading">
      <div className="route-planner__intro">
        <div>
          <p className="eyebrow">Ten-stage route</p>
          <h2 id="route-heading">Choose the next stretch.</h2>
        </div>
        <div
          className="route-progress"
          aria-label={`${unlockedStageIndex + 1} of ${LEVELS.length} stages unlocked`}
        >
          <span>
            {unlockedStageIndex + 1}/{LEVELS.length} unlocked
          </span>
          <div className="route-progress__track" aria-hidden="true">
            <span style={{ width: `${completion}%` }} />
          </div>
        </div>
      </div>

      <div className="stage-feature">
        <div className="stage-feature__art">
          <img
            src={selectedStage.backgroundImage}
            alt={`Stylized landscape for ${selectedStage.title}`}
            width="1800"
            height="450"
            fetchPriority="high"
          />
          <div className="stage-feature__art-label">
            <span>Stage {selectedStage.id.toString().padStart(2, "0")}</span>
            <strong>{selectedStage.title}</strong>
          </div>
        </div>

        <div className="stage-feature__copy">
          <img
            className="stage-feature__badge"
            src={selectedStage.badge}
            alt=""
            width="120"
            height="120"
            aria-hidden="true"
          />
          <p className="eyebrow">Selected stage</p>
          <h3>{selectedStage.title}</h3>
          <p className="stage-feature__subtitle">{selectedStage.subtitle}</p>
          <p className="stage-feature__description">{selectedStage.description}</p>

          <dl className="stage-meta">
            <div>
              <dt>Target</dt>
              <dd>{selectedStage.finishDistance} m</dd>
            </div>
            <div>
              <dt>Traffic</dt>
              <dd>{getDifficulty(selectedStage.trafficIntensity)}</dd>
            </div>
            <div>
              <dt>Controls</dt>
              <dd>Keyboard + touch</dd>
            </div>
          </dl>

          <button className="button button--primary stage-feature__start" onClick={onStart}>
            Start stage
            <span aria-hidden="true">→</span>
          </button>
          <p className="stage-feature__hint">Press Enter to start</p>
        </div>
      </div>

      <ol className="stage-list" aria-label="Route stages">
        {LEVELS.map((stage, stageIndex) => {
          const locked = stageIndex > unlockedStageIndex;
          const selected = stageIndex === selectedStageIndex;

          return (
            <li key={stage.id}>
              <button
                className="stage-card"
                type="button"
                disabled={locked}
                aria-pressed={selected}
                aria-label={
                  locked ? `Stage ${stage.id}: locked` : `Stage ${stage.id}: ${stage.title}`
                }
                onClick={() => onSelect(stageIndex)}
              >
                <span className="stage-card__number">{stage.id.toString().padStart(2, "0")}</span>
                <img src={stage.badge} alt="" width="72" height="72" loading="lazy" />
                <span className="stage-card__copy">
                  <strong>{stage.title}</strong>
                  <small>{locked ? "Locked" : stage.subtitle}</small>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <p className="route-disclaimer">{PRODUCT_IDENTITY.routeDisclaimer}</p>
    </section>
  );
}
